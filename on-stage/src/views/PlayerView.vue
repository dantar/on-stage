<script setup lang="ts">
import { onMounted } from 'vue'
import AddResource from '@/components/AddResource.vue'
import ResourceItem from '@/components/ResourceItem.vue'
import { useResourcesStore } from '@/stores/resources'

const store = useResourcesStore()
onMounted(() => store.load())
</script>

<template>
  <main>
    <header>
      <h1>On Stage</h1>
      <AddResource @add="store.addFiles" />
    </header>

    <p v-if="store.error" class="error" role="alert">
      {{ store.error }}
      <button @click="store.error = null">Dismiss</button>
    </p>

    <p v-if="store.loaded && store.resources.length === 0" class="empty">
      No audio yet. Tap “Add audio” to pick files from this device.
    </p>

    <ul class="list">
      <ResourceItem
        v-for="r in store.resources"
        :key="r.id"
        :name="r.name"
        :state="store.playState[r.id] ?? 'idle'"
        :decode-error="store.decodeError[r.id] ?? false"
        @play-now="store.playNow(r.id)"
        @play-loop="store.playLoop(r.id)"
        @stop="store.stop(r.id)"
        @dim-off="store.dimOff(r.id)"
        @remove="store.remove(r.id)"
      />
    </ul>
  </main>
</template>

<style scoped>
main {
  max-width: 900px;
  margin: 0 auto;
  padding: 16px;
}
header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}
h1 {
  margin: 0;
  font-size: 1.6rem;
}
.list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
  padding: 0;
}
.empty {
  color: var(--muted);
  text-align: center;
  padding: 40px 0;
}
.error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 10px;
  background: var(--danger);
  color: #fff;
}
.error button {
  min-height: 40px;
  border: none;
  border-radius: 8px;
  padding: 0 12px;
  background: rgba(0, 0, 0, 0.25);
  color: #fff;
  font: inherit;
}
</style>
