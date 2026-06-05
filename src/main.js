import * as THREE from "three/webgpu";
import { createScene } from "./earth/createScene.js";
import { createAnimationLoop, AUTO_ROTATION_SPEED } from "./earth/animate.js";
import { createInspectorBindings } from "./ui/inspector.js";
import "./styles/base.css";

const DEFAULT_ASSET_BASE_URL = "/assets/textures/planets";

function assertContainer(container) {
  if (!(container instanceof HTMLElement)) {
    throw new Error("createEarthApp(options): options.container must be an HTMLElement.");
  }
}

export function createEarthApp(options) {
  const config = options ?? {};
  assertContainer(config.container);

  const showInspector = config.showInspector ?? true;
  const assetBaseUrl = config.assetBaseUrl ?? DEFAULT_ASSET_BASE_URL;
  const fixedRotationY = Number.isFinite(config.fixedRotationY) ? config.fixedRotationY : undefined;

  const world = createScene({
    container: config.container,
    showInspector,
    assetBaseUrl
  });

  const loop = createAnimationLoop({
    ...world,
    fixedRotationY
  });
  const inspector = createInspectorBindings({
    renderer: world.renderer,
    uniforms: world.uniforms,
    enabled: showInspector
  });

  let started = false;

  function handleResize() {
    const width = config.container.clientWidth || window.innerWidth;
    const height = config.container.clientHeight || window.innerHeight;
    world.resize(width, height);
  }

  function start() {
    if (started) {
      return;
    }
    started = true;
    loop.start();
    window.addEventListener("resize", handleResize);
  }

  function stop() {
    if (!started) {
      return;
    }
    started = false;
    loop.stop();
    window.removeEventListener("resize", handleResize);
  }

  function resize() {
    handleResize();
  }

  function dispose() {
    stop();
    world.dispose();
  }

  function setAtmosphereDayColor(hex) {
    world.uniforms.atmosphereDayColor.value.set(hex);
  }

  function setAtmosphereTwilightColor(hex) {
    world.uniforms.atmosphereTwilightColor.value.set(hex);
  }

  function setRoughnessRange(low, high) {
    world.uniforms.roughnessLow.value = low;
    world.uniforms.roughnessHigh.value = high;
  }

  const app = {
    start,
    stop,
    resize,
    dispose,
    setAtmosphereDayColor,
    setAtmosphereTwilightColor,
    setRoughnessRange
  };

  const debug = {
    getTelemetry() {
      return { ...loop.telemetry };
    },
    getControlConfig() {
      return {
        enableDamping: world.controls.enableDamping,
        minDistance: world.controls.minDistance,
        maxDistance: world.controls.maxDistance
      };
    },
    getInspectorParameterNames() {
      return [...inspector.parameterNames];
    },
    getUniformSnapshot() {
      return {
        atmosphereDayColor: world.uniforms.atmosphereDayColor.value.getHex(THREE.SRGBColorSpace),
        atmosphereTwilightColor: world.uniforms.atmosphereTwilightColor.value.getHex(THREE.SRGBColorSpace),
        roughnessLow: world.uniforms.roughnessLow.value,
        roughnessHigh: world.uniforms.roughnessHigh.value
      };
    },
    getRotationSpeed() {
      return AUTO_ROTATION_SPEED;
    }
  };

  if (typeof window !== "undefined") {
    window.__EARTH_APP__ = app;
    window.__EARTH_APP_DEBUG__ = debug;
  }

  return app;
}

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
  app.start();
}
