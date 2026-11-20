<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{ add: [files: FileList] }>()
const input = ref<HTMLInputElement | null>(null)

function onChange() {
  const files = input.value?.files
  if (files && files.length > 0) emit('add', files)
  if (input.value) input.value.value = ''
}
</script>

<template>
  <label class="add">
    <input ref="input" type="file" accept="audio/*" multiple hidden @change="onChange" />
    <span>+ Add audio</span>
  </label>
</template>

<style scoped>
.add {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
  padding: 0 20px;
  border-radius: 10px;
  background: var(--accent);
  color: var(--accent-text);
  font-weight: 600;
  cursor: pointer;
  user-select: none;
}
.add:active {
  filter: brightness(0.85);
}
</style>
