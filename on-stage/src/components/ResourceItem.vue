<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PlayState } from '@/services/audioEngine'

const props = defineProps<{
  name: string
  state: PlayState
  decodeError: boolean
}>()

const emit = defineEmits<{
  playNow: []
  playLoop: []
  stop: []
  dimOff: []
  remove: []
}>()

const confirming = ref(false)
const active = computed(() => props.state !== 'idle')
const label: Record<PlayState, string> = {
  idle: '',
  playing: 'Playing',
  looping: 'Looping',
  dimming: 'Dimming',
}
</script>

<template>
  <li class="item" :class="state">
    <div class="head">
      <span class="name">{{ name }}</span>
      <span v-if="decodeError" class="badge error">Can't play this file</span>
      <span v-else-if="active" class="badge">{{ label[state] }}</span>
    </div>

    <div class="buttons">
      <button class="play" :disabled="decodeError" @click="emit('playNow')">▶ Play now</button>
      <button class="play" :disabled="decodeError" @click="emit('playLoop')">↻ Play loop</button>
      <button class="stop" :disabled="!active" @click="emit('stop')">■ Stop</button>
      <button class="dim" :disabled="!active || state === 'dimming'" @click="emit('dimOff')">
        ◢ Dim off
      </button>
    </div>

    <div class="remove">
      <template v-if="confirming">
        <span>Remove “{{ name }}”?</span>
        <button class="danger" @click="emit('remove')">Remove</button>
        <button @click="confirming = false">Cancel</button>
      </template>
      <button v-else class="link" @click="confirming = true">Remove</button>
    </div>
  </li>
</template>

<style scoped>
.item {
  list-style: none;
  padding: 14px;
  border-radius: 12px;
  background: var(--surface);
  border: 2px solid transparent;
  transition: border-color 0.2s;
}
.item.playing,
.item.looping {
  border-color: var(--accent);
}
.item.dimming {
  border-color: var(--warn);
}
.head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.name {
  font-size: 1.15rem;
  font-weight: 600;
  overflow-wrap: anywhere;
  flex: 1;
}
.badge {
  padding: 2px 10px;
  border-radius: 999px;
  background: var(--accent);
  color: var(--accent-text);
  font-size: 0.85rem;
  white-space: nowrap;
}
.badge.error {
  background: var(--danger);
  color: #fff;
}
.buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
@media (max-width: 520px) {
  .buttons {
    grid-template-columns: repeat(2, 1fr);
  }
}
button {
  min-height: 52px;
  border: none;
  border-radius: 10px;
  font: inherit;
  font-weight: 600;
  background: var(--button);
  color: var(--text);
  cursor: pointer;
  touch-action: manipulation;
}
button:active:not(:disabled) {
  filter: brightness(0.8);
}
button:disabled {
  opacity: 0.35;
  cursor: default;
}
.play {
  background: var(--accent);
  color: var(--accent-text);
}
.stop {
  background: var(--danger);
  color: #fff;
}
.dim {
  background: var(--warn);
  color: #1a1a1a;
}
.remove {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
  font-size: 0.9rem;
  color: var(--muted);
}
.remove button {
  min-height: 40px;
  padding: 0 14px;
}
.remove .danger {
  background: var(--danger);
  color: #fff;
}
.link {
  background: none;
  color: var(--muted);
  text-decoration: underline;
}
</style>
