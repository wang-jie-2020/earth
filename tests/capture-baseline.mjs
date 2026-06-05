import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";
import { createServer } from "vite";

const outDir = path.resolve("tests/baseline");
const baselineParams = {
  camera: {
    fov: 25,
    near: 0.1,
    far: 100,
    position: [4.5, 2, 3]
  },
  light: {
    color: "#ffffff",
    intensity: 2,
    position: [0, 0, 3]
  },
  animation: {
    rotationExpression: "delta * 0.025"
  },
  controls: {
    enableDamping: true,
    minDistance: 0.1,
    maxDistance: 50
  },
  inspector: {
    atmosphereDayColor: "#4db2ff",
    atmosphereTwilightColor: "#bc490b",
    roughnessLow: 0.25,
    roughnessHigh: 0.35
  }
};

async function startDevServer() {
  const server = await createServer({
    server: {
      host: "127.0.0.1",
      port: 4173,
      strictPort: true
    }
  });
  await server.listen();
  return server;
}

async function captureState(page, state, filePath) {
  await page.goto("http://127.0.0.1:4173/examples/index-local-baseline.html");
  await page.locator("canvas").first().waitFor({ state: "visible" });
  await page.waitForTimeout(2500);

  if (state === "rotating") {
    await page.waitForTimeout(2500);
  }

  if (state === "zoomed") {
    const box = await page.locator("canvas").first().boundingBox();
    if (!box) {
      throw new Error("Canvas is not ready.");
    }
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.wheel(0, 900);
    await page.waitForTimeout(1200);
  }

  await page.locator("canvas").first().screenshot({ path: filePath });
}

async function main() {
  await mkdir(outDir, { recursive: true });
  await writeFile(
    path.join(outDir, "params.snapshot.json"),
    `${JSON.stringify(baselineParams, null, 2)}\n`,
    "utf8"
  );

  const devServer = await startDevServer();

  try {
    const browser = await chromium.launch({
      channel: "chrome",
      headless: true,
      args: [
        "--enable-unsafe-webgpu",
        "--disable-dawn-features=disallow_unsafe_apis",
        "--disable-skia-graphite"
      ]
    });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    await captureState(page, "initial", path.join(outDir, "baseline-initial.png"));
    await captureState(page, "rotating", path.join(outDir, "baseline-rotating.png"));
    await captureState(page, "zoomed", path.join(outDir, "baseline-zoomed.png"));

    await browser.close();
  } finally {
    await devServer.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
