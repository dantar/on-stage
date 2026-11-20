# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Layout

The actual project lives in the `on-stage/` subdirectory (a freshly scaffolded `create-vue` app). Run all commands from there.

## Commands

```sh
cd on-stage
npm install
npm run dev          # Vite dev server with HMR (includes Vue DevTools plugin)
npm run build        # type-check (vue-tsc --build) and vite build, in parallel via run-p
npm run type-check   # vue-tsc --build only
npm run build-only   # vite build without type-checking
npm run preview      # serve the production build
```

Deploy (from the repo root): `scripts/deploy.sh` runs `npm ci` and `npm run build`, rsyncs `dist/` to `dantar:/opt/web/onstage/html/`, and then smoke-tests https://onstage.dantar.it. Use `scripts/deploy.sh --dry-run` to build and preview the rsync changes without uploading anything.

Node `^22.18.0 || >=24.12.0` is required. No linter, formatter, or test runner is configured yet (`tsconfig.app.json` already excludes `src/**/__tests__/*`, the conventional location if tests are added).

## Purpose

A mobile-first (tablet/smartphone) audio cue player for theater shows and role-playing sessions. The user adds audio files from the device, and each resource has Play now, Play loop, Stop and Dim off (3 s fade). Different resources play at the same time; pressing Play on a resource that is already playing restarts it (one instance per resource).

## Architecture

- Stack: Vue 3 (`<script setup lang="ts">` SFCs), Vite, TypeScript, Pinia, Vue Router. Single route `/` → `src/views/PlayerView.vue`.
- `src/services/audioEngine.ts`: framework-free Web Audio engine. It uses one shared `AudioContext`, and each playback is `AudioBufferSourceNode → GainNode → destination`. Decoded `AudioBuffer`s are cached per resource id. State changes (`idle | playing | looping | dimming`) are pushed to subscribers via `onStateChange`.
  - **Use Web Audio, not `<audio>` elements:** iOS ignores `HTMLMediaElement.volume`, so fades would not work, and `<audio loop>` leaves a gap between repetitions.
  - The context is resumed inside `play()` because playback must start from a user tap (mobile autoplay rules).
- `src/services/resourceDb.ts`: a small IndexedDB wrapper with no dependencies. It stores `{ id, name, type, size, addedAt, blob }`, so the files persist in the browser across reloads.
- `src/stores/resources.ts`: Pinia setup store that ties the DB and the engine together. It decodes files in the background after load/add so the first tap plays without delay, and records decode failures in `decodeError`.
- Components (`AddResource.vue`, `ResourceItem.vue`) are presentational and talk to the view only through props and emits. Theme colors are CSS variables defined in `App.vue`.
- `@/` is aliased to `src/` (configured in both `vite.config.ts` and `tsconfig.app.json`; keep them in sync).
- TypeScript uses project references: `tsconfig.app.json` for `src/`, `tsconfig.node.json` for config files. `noUncheckedIndexedAccess` is enabled, so indexed array/record access is typed as possibly `undefined`.
