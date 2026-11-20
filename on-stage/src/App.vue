<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <RouterView />
</template>

<style>
:root {
  --bg: #111214;
  --surface: #1d1f23;
  --button: #2c2f35;
  --text: #f1f1f1;
  --muted: #9a9ea6;
  --accent: #4fb477;
  --accent-text: #0b1a10;
  --warn: #e0a83b;
  --danger: #d0453c;
  color-scheme: dark;
}
* {
  box-sizing: border-box;
}
html,
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  -webkit-tap-highlight-color: transparent;
}
</style>
