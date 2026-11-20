import { ref } from 'vue'
import { defineStore } from 'pinia'

import * as engine from '@/services/audioEngine'
import type { PlayState } from '@/services/audioEngine'
import * as db from '@/services/resourceDb'
import type { StoredResource } from '@/services/resourceDb'

export const DIM_SECONDS = 3

export const useResourcesStore = defineStore('resources', () => {
  const resources = ref<StoredResource[]>([])
  const playState = ref<Record<string, PlayState>>({})
  const decodeError = ref<Record<string, boolean>>({})
  const error = ref<string | null>(null)
  const loaded = ref(false)

  engine.onStateChange((id, state) => {
    playState.value[id] = state
  })

  function predecode(resource: StoredResource) {
    engine.decode(resource.id, resource.blob).catch(() => {
      decodeError.value[resource.id] = true
    })
  }

  async function load() {
    if (loaded.value) return
    try {
      resources.value = await db.listResources()
      resources.value.forEach(predecode)
    } catch (e) {
      error.value = `Could not load saved resources: ${String(e)}`
    }
    loaded.value = true
  }

  async function addFiles(files: FileList | File[]) {
    error.value = null
    for (const file of Array.from(files)) {
      try {
        const resource = await db.addResource(file)
        resources.value.push(resource)
        predecode(resource)
      } catch (e) {
        const quota = e instanceof DOMException && e.name === 'QuotaExceededError'
        error.value = quota
          ? `Not enough browser storage to save "${file.name}".`
          : `Could not add "${file.name}": ${String(e)}`
      }
    }
  }

  async function remove(id: string) {
    engine.forget(id)
    await db.removeResource(id)
    resources.value = resources.value.filter((r) => r.id !== id)
    delete playState.value[id]
    delete decodeError.value[id]
  }

  async function start(id: string, loop: boolean) {
    const resource = resources.value.find((r) => r.id === id)
    if (!resource) return
    try {
      await engine.play(id, resource.blob, loop)
      decodeError.value[id] = false
    } catch {
      decodeError.value[id] = true
    }
  }

  const playNow = (id: string) => start(id, false)
  const playLoop = (id: string) => start(id, true)
  const stop = (id: string) => engine.stop(id)
  const dimOff = (id: string) => engine.dimOff(id, DIM_SECONDS)

  return {
    resources,
    playState,
    decodeError,
    error,
    loaded,
    load,
    addFiles,
    remove,
    playNow,
    playLoop,
    stop,
    dimOff,
  }
})
