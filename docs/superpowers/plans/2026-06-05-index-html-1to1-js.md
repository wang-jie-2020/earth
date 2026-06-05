# `index.html` 1:1 Engineering Recreation Plan (JS Only)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recreate the current `examples/index.html` in an engineering-friendly structure with 1:1 behavior and visual parity, using JavaScript only.

**Architecture:** Use a two-stage migration. Stage 1 locks and calibrates a single-file baseline with local assets. Stage 2 moves the same behavior into a root-level modular JavaScript app (Vite) with visual and behavior regression checks at each split.

**Tech Stack:** JavaScript, Vite, three.js (WebGPU + TSL), OrbitControls, Inspector

---

## Summary

- Lock `examples/index.html` as the single source of truth for parity.
- Localize textures and dependencies for reproducible offline builds.
- Keep the entire scope JavaScript-only (no TypeScript migration).
- Accept only after both visual and behavior regression checks pass.

## Implementation Changes

### Stage 1: Single-file baseline calibration (no behavior changes)

1. Freeze baseline: keep `examples/index.html` unchanged and capture reference screenshots and parameter snapshots.
2. Localize textures into `public/assets/textures/planets/` and replace remote URLs with local paths.
3. Localize dependencies: replace CDN/importmap loading with local npm-based module resolution.
4. Recalibrate parity: camera, lighting, rotation speed, and GUI defaults must match baseline exactly.

### Stage 2: Root-level engineering migration (JavaScript)

1. Create project structure: `index.html`, `src/`, `public/`, `tests/`.
2. Split modules without behavior drift:
   - `src/main.js`: app bootstrap and lifecycle.
   - `src/earth/createScene.js`: scene/camera/renderer/controls setup.
   - `src/earth/materialGraph.js`: TSL material and atmosphere node logic.
   - `src/earth/animate.js`: timer and render loop.
   - `src/ui/inspector.js`: inspector parameter bindings.
   - `src/styles/base.css`: page and info overlay styles.
3. Use Vite (`dev/build/preview`) to keep WebGPU loading stable.
4. Run parity regression after each refactor slice and fix drift immediately.

## Interfaces (JS)

Stable public API:

1. `createEarthApp(options)`
2. `app.start()` / `app.stop()` / `app.resize()` / `app.dispose()`
3. `app.setAtmosphereDayColor(hex)`
4. `app.setAtmosphereTwilightColor(hex)`
5. `app.setRoughnessRange(low, high)`

`options` fields:

1. `container` (required)
2. `showInspector` (default: `true`)
3. `assetBaseUrl` (default: `/assets/textures/planets`)

## Test Plan

1. Visual regression with three fixed camera states (initial, rotating, zoomed), pixel diff threshold `<= 0.5%`.
2. Behavior regression:
   - Auto-rotation speed remains `delta * 0.025`.
   - OrbitControls damping and zoom boundaries remain unchanged.
   - Four inspector parameters exist and apply in real time.
3. Engineering regression:
   - `npm run build` passes.
   - `npm run preview` runs correctly.
   - Full validation runs in a WebGPU-capable Chromium environment.

## Assumptions

1. Scope matches current repo baseline `examples/index.html` only (no upstream sync in this task).
2. `three` version stays pinned to baseline-compatible version.
3. This plan excludes TypeScript and excludes WebGL fallback work.
