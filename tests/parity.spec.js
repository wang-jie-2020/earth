import { test, expect } from "@playwright/test";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

const MAX_DIFF_RATIO = 0.005;
const PARAMETER_NAMES = [
  "atmosphereDayColor",
  "atmosphereTwilightColor",
  "roughnessLow",
  "roughnessHigh"
];
const BASELINE_URL = "/examples/index-local-baseline.html";
const STATE_ROTATION = {
  initial: 0,
  rotating: 0.08,
  zoomed: 0
};

function withFixedRotation(url, rotation) {
  return `${url}?fixedRotationY=${rotation}`;
}

async function waitForScene(page, url) {
  await page.goto(url);
  await page.locator("canvas").first().waitFor({ state: "visible" });
  await page.waitForTimeout(1000);
}

async function setState(page, stateName) {
  const canvas = page.locator("canvas").first();
  const box = await canvas.boundingBox();

  if (!box) {
    throw new Error("Canvas is not ready.");
  }

  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;

  if (stateName === "initial") {
    await page.waitForTimeout(100);
    return;
  }

  if (stateName === "rotating") {
    await page.waitForTimeout(150);
    return;
  }

  if (stateName === "zoomed") {
    await page.mouse.move(cx, cy);
    await page.mouse.wheel(0, 900);
    await page.waitForTimeout(600);
  }
}

function diffRatio(basePngBuffer, appPngBuffer) {
  const base = PNG.sync.read(basePngBuffer);
  const app = PNG.sync.read(appPngBuffer);

  if (base.width !== app.width || base.height !== app.height) {
    throw new Error(`Screenshot size mismatch: ${base.width}x${base.height} vs ${app.width}x${app.height}`);
  }

  const diff = new PNG({ width: base.width, height: base.height });
  const mismatchPixels = pixelmatch(base.data, app.data, diff.data, base.width, base.height, {
    threshold: 0.1
  });

  const totalPixels = base.width * base.height;
  return mismatchPixels / totalPixels;
}

test.describe("earth parity checks", () => {
  test("visual parity <= 0.5% in three camera states", async ({ page }) => {
    const states = ["initial", "rotating", "zoomed"];

    for (const state of states) {
      const fixedRotation = STATE_ROTATION[state];
      await waitForScene(page, withFixedRotation(BASELINE_URL, fixedRotation));
      await setState(page, state);
      const baselineShot = await page.locator("canvas").first().screenshot();

      await waitForScene(page, withFixedRotation("/", fixedRotation));
      await setState(page, state);
      const appShot = await page.locator("canvas").first().screenshot();

      const ratio = diffRatio(baselineShot, appShot);
      expect(ratio, `Diff ratio for "${state}" should be <= 0.5%`).toBeLessThanOrEqual(MAX_DIFF_RATIO);
    }
  });

  test("behavior parity: rotation, controls, inspector, runtime API", async ({ page }) => {
    await waitForScene(page, "/");
    await page.waitForFunction(() => Boolean(window.__EARTH_APP_DEBUG__));

    const rotationCheck = await page.evaluate(() => {
      const telemetry = window.__EARTH_APP_DEBUG__.getTelemetry();
      return {
        lastDelta: telemetry.lastDelta,
        lastRotationStep: telemetry.lastRotationStep,
        expectedSpeed: window.__EARTH_APP_DEBUG__.getRotationSpeed()
      };
    });

    expect(rotationCheck.lastDelta).toBeGreaterThan(0);
    const measuredSpeed = rotationCheck.lastRotationStep / rotationCheck.lastDelta;
    expect(Math.abs(measuredSpeed - rotationCheck.expectedSpeed)).toBeLessThan(1e-6);
    expect(rotationCheck.expectedSpeed).toBe(0.025);

    const controls = await page.evaluate(() => window.__EARTH_APP_DEBUG__.getControlConfig());
    expect(controls.enableDamping).toBe(true);
    expect(controls.minDistance).toBe(0.1);
    expect(controls.maxDistance).toBe(50);

    const inspectorNames = await page.evaluate(() => window.__EARTH_APP_DEBUG__.getInspectorParameterNames());
    expect(inspectorNames).toEqual(PARAMETER_NAMES);

    const before = await page.evaluate(() => window.__EARTH_APP_DEBUG__.getUniformSnapshot());

    await page.evaluate(() => {
      window.__EARTH_APP__.setAtmosphereDayColor("#112233");
      window.__EARTH_APP__.setAtmosphereTwilightColor("#445566");
      window.__EARTH_APP__.setRoughnessRange(0.123, 0.456);
    });

    const after = await page.evaluate(() => window.__EARTH_APP_DEBUG__.getUniformSnapshot());

    expect(before.atmosphereDayColor).not.toBe(after.atmosphereDayColor);
    expect(before.atmosphereTwilightColor).not.toBe(after.atmosphereTwilightColor);
    expect(after.atmosphereDayColor).toBe(0x112233);
    expect(after.atmosphereTwilightColor).toBe(0x445566);
    expect(after.roughnessLow).toBeCloseTo(0.123, 8);
    expect(after.roughnessHigh).toBeCloseTo(0.456, 8);
  });
});
