# Hero Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a new `examples/hero-homepage.html` from scratch that matches the approved Hero spec, while keeping `examples/index.html` untouched.

**Architecture:** Use a single static HTML page with inline CSS/JS, powered by the same `three.webgpu + three.tsl + OrbitControls` stack used in `examples/index.html`. Keep data split by intent: `METRICS` drives the top cards (hardcoded), `PROJECTS` drives markers and tooltip/detail interactions. Add one lightweight Node smoke test file for regression checks and one simple detail placeholder page.

**Tech Stack:** HTML, CSS, vanilla JavaScript, Three.js WebGPU/TSL, Node.js built-in `fs` + `assert`.

---

I'm using the writing-plans skill to create the implementation plan.

## File Structure

- Create: `examples/hero-homepage.html`
  Responsibility: full Hero screen implementation (layout, styling, WebGPU earth, marker interactions, tooltip follow, intro animation).
- Create: `examples/project-detail.html`
  Responsibility: placeholder detail page opened by marker click, rendering query parameters.
- Create: `tests/hero-homepage.spec.mjs`
  Responsibility: smoke checks for required DOM IDs, `METRICS` hardcoded source, and key interaction function presence.
- Modify: `docs/superpowers/specs/2026-06-04-hero-homepage-design.md` (only if mismatch is found during execution; otherwise no change).

### Task 1: Add Failing Smoke Test for New Hero Page

**Files:**
- Create: `tests/hero-homepage.spec.mjs`
- Test: `tests/hero-homepage.spec.mjs`

- [ ] **Step 1: Write the failing test**

```js
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const heroPath = new URL("../examples/hero-homepage.html", import.meta.url);
const html = readFileSync(heroPath, "utf8");

assert.match(html, /const\s+METRICS\s*=\s*\{/, "METRICS constant must exist");
assert.match(html, /id="metric-total"/, "metric-total card id must exist");
assert.match(html, /id="metric-regions"/, "metric-regions card id must exist");
assert.match(html, /id="metric-active"/, "metric-active card id must exist");
assert.match(html, /id="metric-risk"/, "metric-risk card id must exist");
assert.match(html, /function\s+updateTooltipPosition\s*\(/, "tooltip follow function must exist");
assert.match(html, /function\s+openProjectDetail\s*\(/, "detail open function must exist");
assert.doesNotMatch(html, /fillMetrics\s*\(\)\s*\{[\s\S]*PROJECTS\.filter/, "top metrics must not be derived from PROJECTS");

console.log("hero-homepage smoke test passed");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/hero-homepage.spec.mjs`  
Expected: FAIL with file-not-found for `examples/hero-homepage.html`.

- [ ] **Step 3: Commit**

```bash
git add tests/hero-homepage.spec.mjs
git commit -m "test: add hero homepage smoke test"
```

### Task 2: Create Hero Page Shell with Hardcoded METRICS and Layout

**Files:**
- Create: `examples/hero-homepage.html`
- Test: `tests/hero-homepage.spec.mjs`

- [ ] **Step 1: Write minimal failing content in `examples/hero-homepage.html`**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>系统首页 Hero 原型</title>
</head>
<body>
  <main class="hero"></main>
</body>
</html>
```

- [ ] **Step 2: Run smoke test to verify it fails for missing requirements**

Run: `node tests/hero-homepage.spec.mjs`  
Expected: FAIL with missing `METRICS`/card IDs/function signatures.

- [ ] **Step 3: Implement full shell, styling, and hardcoded metrics rendering**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>系统首页 Hero 原型</title>
  <style>
    :root {
      --bg-0: #040913;
      --bg-1: #07162d;
      --bg-2: #0b2748;
      --text-main: #e7f2ff;
      --text-muted: #98acc7;
      --card-bg: rgba(5, 18, 37, 0.62);
      --card-border: rgba(104, 180, 255, 0.28);
      --accent: #87f8ff;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      color: var(--text-main);
      font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
      background: linear-gradient(135deg, var(--bg-0), var(--bg-1) 48%, var(--bg-2));
    }
    .hero { position: relative; width: 100vw; height: 100vh; min-width: 1200px; overflow: hidden; }
    #globe-stage { position: absolute; inset: 0; }
    .hero-cards {
      position: absolute;
      top: 28px;
      left: 36px;
      right: 36px;
      z-index: 10;
      display: grid;
      gap: 14px;
      grid-template-columns: repeat(4, minmax(190px, 1fr));
      pointer-events: none;
    }
    .hero-card {
      border: 1px solid var(--card-border);
      border-radius: 8px;
      background: linear-gradient(165deg, rgba(8, 24, 50, 0.72), var(--card-bg));
      padding: 14px 16px;
      min-height: 106px;
    }
    .label { margin: 0; font-size: 13px; color: var(--text-muted); }
    .value { margin: 8px 0 7px; font-size: 32px; line-height: 1; font-weight: 600; color: var(--accent); }
    .desc { margin: 0; font-size: 12px; color: var(--text-muted); }
    .legend {
      position: absolute;
      left: 36px;
      bottom: 26px;
      z-index: 8;
      display: flex;
      gap: 18px;
      padding: 10px 14px;
      border-radius: 8px;
      border: 1px solid rgba(104, 180, 255, 0.2);
      background: rgba(4, 14, 30, 0.55);
      font-size: 12px;
      color: var(--text-muted);
    }
    .tooltip {
      position: absolute;
      top: 0;
      left: 0;
      width: 280px;
      z-index: 30;
      border-radius: 8px;
      border: 1px solid rgba(98, 184, 255, 0.5);
      background: rgba(7, 21, 41, 0.92);
      padding: 12px 14px;
      pointer-events: none;
      opacity: 0;
      transform: translate(-50%, -118%) scale(0.96);
      transition: opacity 180ms ease, transform 180ms ease;
    }
    .tooltip.show { opacity: 1; transform: translate(-50%, -126%) scale(1); }
  </style>
</head>
<body>
  <main class="hero">
    <section id="globe-stage"></section>
    <section class="hero-cards" aria-label="全局项目概览">
      <article class="hero-card"><p class="label">Project Count</p><p class="value" id="metric-total">0</p><p class="desc">全球在管项目总量</p></article>
      <article class="hero-card"><p class="label">Coverage</p><p class="value" id="metric-regions">0</p><p class="desc">覆盖国家与地区</p></article>
      <article class="hero-card"><p class="label">Active Delivery</p><p class="value" id="metric-active">0%</p><p class="desc">本月正常履约率</p></article>
      <article class="hero-card"><p class="label">Risk Alerts</p><p class="value" id="metric-risk">0</p><p class="desc">需跟进风险项目</p></article>
    </section>
    <aside class="legend" aria-label="点位状态图例">建设中 / 稳定运营 / 风险观察 / 选中高亮</aside>
    <article id="project-tooltip" class="tooltip" aria-live="polite">
      <h2 id="tip-name"></h2><p id="tip-meta"></p><span id="tip-type"></span><p id="tip-desc"></p>
    </article>
  </main>
  <script>
    const METRICS = { totalProjects: 36, coverageRegions: 19, deliveryRate: "94%", riskCount: 3 };
    document.getElementById("metric-total").textContent = String(METRICS.totalProjects);
    document.getElementById("metric-regions").textContent = String(METRICS.coverageRegions);
    document.getElementById("metric-active").textContent = METRICS.deliveryRate;
    document.getElementById("metric-risk").textContent = String(METRICS.riskCount);
  </script>
</body>
</html>
```

- [ ] **Step 4: Run smoke test to verify partial requirements pass**

Run: `node tests/hero-homepage.spec.mjs`  
Expected: FAIL only on missing `updateTooltipPosition`/`openProjectDetail`.

- [ ] **Step 5: Commit**

```bash
git add examples/hero-homepage.html
git commit -m "feat: scaffold hero homepage layout with fixed metrics"
```

### Task 3: Add 3D Earth Scene, Marker States, Tooltip Follow, and Click Behavior

**Files:**
- Modify: `examples/hero-homepage.html`
- Test: `tests/hero-homepage.spec.mjs`

- [ ] **Step 1: Add import map and 3D scene bootstrap with WebGPU stack**

```html
<script type="importmap">
{
  "imports": {
    "three": "https://unpkg.com/three@0.184.0/build/three.webgpu.js",
    "three/webgpu": "https://unpkg.com/three@0.184.0/build/three.webgpu.js",
    "three/tsl": "https://unpkg.com/three@0.184.0/build/three.tsl.js",
    "three/addons/": "https://unpkg.com/three@0.184.0/examples/jsm/"
  }
}
</script>
<script type="module">
  import * as THREE from "three/webgpu";
  import { step, normalWorldGeometry, output, texture, vec3, vec4, normalize, positionWorld, bumpMap, cameraPosition, color, uniform, mix, uv, max } from "three/tsl";
  import { OrbitControls } from "three/addons/controls/OrbitControls.js";
  const stage = document.getElementById("globe-stage");
  const camera = new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(4.5, 2, 3);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  const sun = new THREE.DirectionalLight("#ffffff", 2);
  sun.position.set(0, 0, 3);
  scene.add(sun);
  const renderer = new THREE.WebGPURenderer();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  stage.appendChild(renderer.domElement);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
</script>
```

- [ ] **Step 2: Define marker data and status styles (PROJECTS-only use)**

```js
const PROJECTS = [
  { name: "巴西圣保罗配网升级", country: "巴西", region: "南美", lat: -23.55, lon: -46.63, type: "配网工程", desc: "城市环网改造与配电自动化升级。", status: "building" },
  { name: "德国鲁尔工业园储能", country: "德国", region: "欧洲", lat: 51.45, lon: 7.01, type: "储能系统", desc: "工商业储能+微网调度。", status: "active" },
  { name: "阿联酋沙漠光伏矩阵", country: "阿联酋", region: "中东", lat: 24.45, lon: 54.38, type: "光伏电站", desc: "2.4GW 地面电站建设中。", status: "watch" }
];

const STATUS_STYLE = {
  building: { color: 0x53beff, label: "建设中" },
  active: { color: 0x52efd6, label: "稳定运营" },
  watch: { color: 0xffb45e, label: "风险观察" }
};
```

- [ ] **Step 3: Add interaction functions and tooltip-follow projection**

```js
function updateTooltipPosition() {
  if (!hoveredEntry || !tooltipEl.classList.contains("show")) return;
  hoveredEntry.core.getWorldPosition(worldPoint);
  projected.copy(worldPoint).project(camera);
  pointToCamera.copy(camera.position).sub(worldPoint).normalize();
  pointNormal.copy(worldPoint).normalize();
  const isFacingCamera = pointToCamera.dot(pointNormal) > 0;
  if (!isFacingCamera || projected.z > 1.0) { tooltipEl.style.opacity = "0"; return; }
  const x = (projected.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-projected.y * 0.5 + 0.5) * window.innerHeight;
  tooltipEl.style.left = `${x}px`;
  tooltipEl.style.top = `${y}px`;
  tooltipEl.style.opacity = "1";
}

function openProjectDetail(project, statusLabel) {
  const params = new URLSearchParams({
    name: project.name,
    country: project.country,
    region: project.region,
    lat: String(project.lat),
    lon: String(project.lon),
    type: project.type,
    desc: project.desc,
    status: statusLabel
  });
  window.open(`./project-detail.html?${params.toString()}`, "_blank", "noopener");
}
```

- [ ] **Step 4: Run smoke test to verify required signatures and IDs pass**

Run: `node tests/hero-homepage.spec.mjs`  
Expected: PASS with `hero-homepage smoke test passed`.

- [ ] **Step 5: Manual visual validation on desktop breakpoints**

Run a local static server from repo root: `python -m http.server 4173`  
Open: `http://localhost:4173/examples/hero-homepage.html`  
Expected:
- 4 top cards show hardcoded `METRICS` values.
- Earth is visible and slowly rotating.
- Hover marker shows tooltip and follows on rotation.
- Clicking marker opens detail page URL in new tab.
- No vertical scrollbar at 1920x1080 / 1440x900 / 1366x768.

- [ ] **Step 6: Commit**

```bash
git add examples/hero-homepage.html
git commit -m "feat: implement hero globe interactions and tooltip follow"
```

### Task 4: Add Detail Placeholder Page for Marker Click Target

**Files:**
- Create: `examples/project-detail.html`
- Test: manual browser check

- [ ] **Step 1: Write `examples/project-detail.html` with query-param rendering**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>项目详情</title>
</head>
<body>
  <main>
    <h1 id="name">项目详情</h1>
    <p id="countryRegion">-</p>
    <p id="type">-</p>
    <p id="status">-</p>
    <p id="coords">-</p>
    <p id="desc">-</p>
  </main>
  <script>
    const params = new URLSearchParams(window.location.search);
    const data = {
      name: params.get("name") || "项目详情",
      country: params.get("country") || "-",
      region: params.get("region") || "-",
      type: params.get("type") || "-",
      status: params.get("status") || "-",
      lat: params.get("lat") || "-",
      lon: params.get("lon") || "-",
      desc: params.get("desc") || "-"
    };
    document.title = `${data.name} - 项目详情`;
    document.getElementById("name").textContent = data.name;
    document.getElementById("countryRegion").textContent = `${data.country} · ${data.region}`;
    document.getElementById("type").textContent = data.type;
    document.getElementById("status").textContent = data.status;
    document.getElementById("coords").textContent = `${data.lat}, ${data.lon}`;
    document.getElementById("desc").textContent = data.desc;
  </script>
</body>
</html>
```

- [ ] **Step 2: Validate click-through flow manually**

Run: `python -m http.server 4173`  
Open: `http://localhost:4173/examples/hero-homepage.html` and click a marker  
Expected: new tab opens `project-detail.html` and displays query values.

- [ ] **Step 3: Commit**

```bash
git add examples/project-detail.html
git commit -m "feat: add project detail placeholder page"
```

### Task 5: Final Verification and Handoff Notes

**Files:**
- Modify: `docs/superpowers/specs/2026-06-04-hero-homepage-design.md` (only if implementation reveals needed clarification)
- Test: `tests/hero-homepage.spec.mjs` + manual checklist

- [ ] **Step 1: Run automated smoke test**

Run: `node tests/hero-homepage.spec.mjs`  
Expected: PASS.

- [ ] **Step 2: Execute manual acceptance checklist**

Run: open `http://localhost:4173/examples/hero-homepage.html`  
Expected:
- Top four cards match `METRICS` literal values.
- No card value changes when editing only `PROJECTS`.
- Tooltip hides when marker rotates to back side.
- Blank-area click closes tooltip.
- No side panel, no bottom ticker, no particle/arc effects.

- [ ] **Step 3: Commit final polish (if any)**

```bash
git add examples/hero-homepage.html examples/project-detail.html tests/hero-homepage.spec.mjs
git commit -m "chore: finalize hero homepage acceptance fixes"
```
