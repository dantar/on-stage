// Web Audio playback engine. Framework-free: the Pinia store subscribes via onStateChange.
// Web Audio (not <audio>) is used because iOS ignores HTMLMediaElement.volume (no fades)
// and <audio loop> leaves an audible gap between repetitions.

export type PlayState = 'idle' | 'playing' | 'looping' | 'dimming'

interface Instance {
  source: AudioBufferSourceNode
  gain: GainNode
}

type StateListener = (id: string, state: PlayState) => void

let ctx: AudioContext | null = null
const buffers = new Map<string, AudioBuffer>()
const pending = new Map<string, Promise<AudioBuffer>>()
const instances = new Map<string, Instance>()
const listeners = new Set<StateListener>()

function emit(id: string, state: PlayState) {
  for (const listener of listeners) listener(id, state)
}

function getContext(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  return ctx
}

/** Create/resume the shared context. Call from a user gesture (mobile autoplay rules). */
export async function ensureContext(): Promise<AudioContext> {
  const context = getContext()
  if (context.state !== 'running') await context.resume()
  return context
}

export function onStateChange(listener: StateListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Decode a blob into an AudioBuffer, cached by id. Works on a suspended context. */
export function decode(id: string, blob: Blob): Promise<AudioBuffer> {
  const cached = buffers.get(id)
  if (cached) return Promise.resolve(cached)
  const inFlight = pending.get(id)
  if (inFlight) return inFlight

  const promise = blob
    .arrayBuffer()
    .then((data) => getContext().decodeAudioData(data))
    .then((buffer) => {
      buffers.set(id, buffer)
      return buffer
    })
    .finally(() => pending.delete(id))
  pending.set(id, promise)
  return promise
}

function stopInstance(id: string) {
  const instance = instances.get(id)
  if (!instance) return
  instances.delete(id)
  instance.source.onended = null
  try {
    instance.source.stop()
  } catch {
    // already stopped
  }
  instance.source.disconnect()
  instance.gain.disconnect()
}

/** Start playback of an already decoded (or decodable) resource, restarting it if playing. */
export async function play(id: string, blob: Blob, loop: boolean): Promise<void> {
  const context = await ensureContext()
  const buffer = await decode(id, blob)
  stopInstance(id)

  const source = context.createBufferSource()
  source.buffer = buffer
  source.loop = loop
  const gain = context.createGain()
  gain.gain.value = 1
  source.connect(gain).connect(context.destination)

  const instance: Instance = { source, gain }
  source.onended = () => {
    if (instances.get(id) !== instance) return
    instances.delete(id)
    source.disconnect()
    gain.disconnect()
    emit(id, 'idle')
  }
  instances.set(id, instance)
  source.start()
  emit(id, loop ? 'looping' : 'playing')
}

export function stop(id: string): void {
  if (!instances.has(id)) return
  stopInstance(id)
  emit(id, 'idle')
}

/** Fade to silence over `seconds`, then stop. onended reports 'idle'. */
export function dimOff(id: string, seconds = 3): void {
  const instance = instances.get(id)
  if (!instance || !ctx) return
  const now = ctx.currentTime
  const param = instance.gain.gain
  param.cancelScheduledValues(now)
  param.setValueAtTime(param.value, now)
  param.linearRampToValueAtTime(0, now + seconds)
  instance.source.stop(now + seconds)
  emit(id, 'dimming')
}

/** Stop and drop the cached buffer (used when a resource is removed). */
export function forget(id: string): void {
  stop(id)
  buffers.delete(id)
}
