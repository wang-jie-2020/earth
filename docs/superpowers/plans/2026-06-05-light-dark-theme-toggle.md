# Light/Dark Theme Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a minimal light/dark theme toggle with a top-right button, CSS theme switching, and synchronized three.js scene background changes.

**Architecture:** Keep theme state in `src/main.js` as runtime-only memory (`dark | light`) with default dark on every page load. Use `body.theme-light` + CSS custom properties for DOM styling, and route scene color changes through `app.setBackgroundColor()` to preserve scene encapsulation. Validate behavior with Playwright tests that cover runtime API sync, UI toggling, and non-persistence after reload.

**Tech Stack:** JavaScript (ESM), Vite, three.js WebGPU, Playwright

---

## File Structure and Responsibilities

- **Create:** `tests/theme-toggle.spec.js`
  - New focused regression tests for theme behavior (runtime API + UI toggle + reload reset).
- **Modify:** `src/earth/createScene.js`
  - Expose a scene-level `setBackgroundColor(hex)` API.
- **Modify:** `src/main.js`
  - Expose `app.setBackgroundColor(hex)`.
  - Add debug getter for current scene background color.
  - Add theme constants, button creation, click handler, and `applyTheme` flow in bootstrap.
- **Modify:** `src/styles/base.css`
  - Move color values to CSS variables.
  - Add light-theme override and top-right toggle button styles.
- **Run (no edit expected):** `tests/parity.spec.js`
  - Re-run existing parity checks to ensure no regressions.

---

### Task 1: Add scene background API with test-first flow

**Files:**
- Create: `tests/theme-toggle.spec.js`
- Modify: `src/earth/createScene.js`
- Modify: `src/main.js`

- [ ] **Step 1: Write the failing runtime API test**

Create `tests/theme-toggle.spec.js` with this initial content:

```javascript
import { test, expect } from "@playwright/test";

const DARK_BG_HEX = 0x000000;
const LIGHT_BG_HEX = 0xf3f7ff;

async function openApp(page) {
  await page.goto("/");
  await page.locator("canvas").first().waitFor({ state: "visible" });
  await page.waitForFunction(() => Boolean(window.__EARTH_APP__) && Boolean(window.__EARTH_APP_DEBUG__));
}

test.describe("theme toggle", () => {
  test("runtime API sets scene background color", async ({ page }) => {
    await openApp(page);

    const initial = await page.evaluate(() => window.__EARTH_APP_DEBUG__.getSceneBackgroundColor());
    expect(initial).toBe(DARK_BG_HEX);

    await page.evaluate(() => {
      window.__EARTH_APP__.setBackgroundColor(0xf3f7ff);
    });

    const updated = await page.evaluate(() => window.__EARTH_APP_DEBUG__.getSceneBackgroundColor());
    expect(updated).toBe(LIGHT_BG_HEX);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm run test -- tests/theme-toggle.spec.js -g "runtime API sets scene background color"
```

Expected: **FAIL** because `getSceneBackgroundColor` and `setBackgroundColor` do not exist yet.

- [ ] **Step 3: Implement scene-level background setter**

In `src/earth/createScene.js`, add `setBackgroundColor` and return it:

```javascript
function setBackgroundColor(hex) {
  scene.background.set(hex);
}

return {
  camera,
  scene,
  renderer,
  controls,
  globe,
  uniforms,
  resize,
  setBackgroundColor,
  dispose
};
```

- [ ] **Step 4: Implement app API + debug getter for background color**

In `src/main.js`, add app method:

```javascript
function setBackgroundColor(hex) {
  world.setBackgroundColor(hex);
}
```

Expose it in `app`:

```javascript
const app = {
  start,
  stop,
  resize,
  dispose,
  setAtmosphereDayColor,
  setAtmosphereTwilightColor,
  setRoughnessRange,
  setBackgroundColor
};
```

Add debug getter:

```javascript
getSceneBackgroundColor() {
  return world.scene.background.getHex(THREE.SRGBColorSpace);
}
```

- [ ] **Step 5: Run the runtime API test to verify it passes**

Run:

```bash
npm run test -- tests/theme-toggle.spec.js -g "runtime API sets scene background color"
```

Expected: **PASS** (`1 passed`).

- [ ] **Step 6: Commit Task 1 changes**

```bash
git add tests/theme-toggle.spec.js src/earth/createScene.js src/main.js
git commit -m "feat: add scene background runtime API"
```

---

### Task 2: Add UI theme toggle, CSS theming, and full validation

**Files:**
- Modify: `tests/theme-toggle.spec.js`
- Modify: `src/main.js`
- Modify: `src/styles/base.css`
- Run: `tests/parity.spec.js`

- [ ] **Step 1: Add failing UI toggle test**

Append this test to `tests/theme-toggle.spec.js`:

```javascript
const THEME_BUTTON_SELECTOR = '[data-testid="theme-toggle"]';

test("button toggles theme class and resets after reload", async ({ page }) => {
  await openApp(page);

  const body = page.locator("body");
  const toggle = page.locator(THEME_BUTTON_SELECTOR);

  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveText("切到白天");
  await expect(body).not.toHaveClass(/theme-light/);

  await toggle.click();
  await expect(body).toHaveClass(/theme-light/);
  await expect(toggle).toHaveText("切到夜间");

  const lightBg = await page.evaluate(() => window.__EARTH_APP_DEBUG__.getSceneBackgroundColor());
  expect(lightBg).toBe(LIGHT_BG_HEX);

  await toggle.click();
  await expect(body).not.toHaveClass(/theme-light/);
  await expect(toggle).toHaveText("切到白天");

  const darkBg = await page.evaluate(() => window.__EARTH_APP_DEBUG__.getSceneBackgroundColor());
  expect(darkBg).toBe(DARK_BG_HEX);

  await page.reload();
  await page.locator("canvas").first().waitFor({ state: "visible" });
  await page.waitForFunction(() => Boolean(window.__EARTH_APP_DEBUG__));
  await expect(page.locator("body")).not.toHaveClass(/theme-light/);

  const reloadedBg = await page.evaluate(() => window.__EARTH_APP_DEBUG__.getSceneBackgroundColor());
  expect(reloadedBg).toBe(DARK_BG_HEX);
});
```

- [ ] **Step 2: Run UI test to verify it fails**

Run:

```bash
npm run test -- tests/theme-toggle.spec.js -g "button toggles theme class and resets after reload"
```

Expected: **FAIL** waiting for `[data-testid="theme-toggle"]` because the button is not implemented yet.

- [ ] **Step 3: Implement theme state + button + apply flow in bootstrap**

In `src/main.js`, add constants near the top (after `DEFAULT_ASSET_BASE_URL`):

```javascript
const THEME_DARK = "dark";
const THEME_LIGHT = "light";
const THEME_BACKGROUND = {
  [THEME_DARK]: 0x000000,
  [THEME_LIGHT]: 0xf3f7ff
};
const THEME_LABEL = {
  [THEME_DARK]: "切到白天",
  [THEME_LIGHT]: "切到夜间"
};
```

Replace the document bootstrap block with:

```javascript
if (typeof document !== "undefined") {
  const query = new URLSearchParams(window.location.search);
  const fixedRotationParam = query.get("fixedRotationY");
  const fixedRotationY =
    fixedRotationParam !== null && Number.isFinite(Number(fixedRotationParam))
      ? Number(fixedRotationParam)
      : undefined;

  const container = document.getElementById("app") ?? document.body;
  const app = createEarthApp({
    container,
    showInspector: true,
    assetBaseUrl: DEFAULT_ASSET_BASE_URL,
    fixedRotationY
  });

  const themeToggle = document.createElement("button");
  themeToggle.type = "button";
  themeToggle.id = "theme-toggle";
  themeToggle.dataset.testid = "theme-toggle";
  document.body.append(themeToggle);

  let theme = THEME_DARK;

  function applyTheme(nextTheme) {
    theme = nextTheme;
    const isLight = theme === THEME_LIGHT;
    document.body.classList.toggle("theme-light", isLight);
    app.setBackgroundColor(THEME_BACKGROUND[theme]);
    themeToggle.textContent = THEME_LABEL[theme];
    themeToggle.setAttribute("aria-label", THEME_LABEL[theme]);
  }

  themeToggle.addEventListener("click", () => {
    applyTheme(theme === THEME_DARK ? THEME_LIGHT : THEME_DARK);
  });

  applyTheme(THEME_DARK);
  app.start();
}
```

- [ ] **Step 4: Implement CSS variable theming + top-right button style**

Replace `src/styles/base.css` content with:

```css
:root {
  --page-bg: #000000;
  --text-color: #ffffff;
  --link-color: #8ec5ff;
  --info-bg: rgba(0, 0, 0, 0.45);
  --info-border: rgba(255, 255, 255, 0.2);
  --toggle-bg: rgba(0, 0, 0, 0.6);
  --toggle-border: rgba(255, 255, 255, 0.28);
  --toggle-color: #ffffff;
}

body.theme-light {
  --page-bg: #f3f7ff;
  --text-color: #122033;
  --link-color: #1d4ed8;
  --info-bg: rgba(255, 255, 255, 0.8);
  --info-border: rgba(18, 32, 51, 0.2);
  --toggle-bg: rgba(255, 255, 255, 0.92);
  --toggle-border: rgba(18, 32, 51, 0.25);
  --toggle-color: #122033;
}

html,
body {
  margin: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--page-bg);
  color: var(--text-color);
  font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
}

body {
  position: relative;
}

#app {
  position: fixed;
  inset: 0;
}

#app > canvas {
  display: block;
  width: 100%;
  height: 100%;
}

a {
  color: var(--link-color);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

#info {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 10;
  max-width: min(90vw, 720px);
  padding: 10px 12px;
  border: 1px solid var(--info-border);
  border-radius: 8px;
  background: var(--info-bg);
  backdrop-filter: blur(4px);
  font-size: 13px;
  line-height: 1.45;
}

#info .title {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 600;
}

#theme-toggle {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 20;
  min-width: 92px;
  padding: 8px 10px;
  border: 1px solid var(--toggle-border);
  border-radius: 8px;
  background: var(--toggle-bg);
  color: var(--toggle-color);
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  backdrop-filter: blur(4px);
}

#theme-toggle:hover {
  opacity: 0.92;
}
```

- [ ] **Step 5: Run targeted tests for theme feature**

Run:

```bash
npm run test -- tests/theme-toggle.spec.js
```

Expected: **PASS** (`2 passed`).

- [ ] **Step 6: Run regression + build checks**

Run:

```bash
npm run test -- tests/parity.spec.js
npm run build
```

Expected:
- parity suite remains **PASS**
- Vite build completes successfully (outputs files under `dist/`)

- [ ] **Step 7: Commit Task 2 changes**

```bash
git add tests/theme-toggle.spec.js src/main.js src/styles/base.css
git commit -m "feat: add light dark theme toggle with scene sync"
```

---

## Spec Coverage Check

- ✅ 右上角按钮：Task 2 Step 3 + Step 4
- ✅ 默认暗色：Task 2 Step 3 (`theme = THEME_DARK`, `applyTheme(THEME_DARK)`)
- ✅ 页面样式切换：Task 2 Step 4 (CSS variables + `.theme-light`)
- ✅ 场景背景联动：Task 1 Step 3/4 + Task 2 Step 3 (`app.setBackgroundColor`)
- ✅ 刷新回暗色（不持久化）：Task 2 Step 1/5 test covers reload reset
- ✅ 不新增依赖：all tasks modify existing JS/CSS/tests only
- ✅ 构建通过：Task 2 Step 6

## Plan Self-Review

- Placeholder scan: no `TODO`/`TBD`/ambiguous “later” items.
- Type/API consistency: `setBackgroundColor(hex)` and `getSceneBackgroundColor()` names are consistent across tests and implementation tasks.
- Scope check: single subsystem (theme toggle) with no unrelated refactor.
