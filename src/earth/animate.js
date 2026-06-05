import * as THREE from "three/webgpu";

export const AUTO_ROTATION_SPEED = 0.025;

export function createAnimationLoop({ renderer, scene, camera, controls, globe, fixedRotationY }) {
  const timer = new THREE.Timer();
  timer.connect(document);

  const telemetry = {
    frameCount: 0,
    lastDelta: 0,
    lastRotationStep: 0
  };

  async function animate() {
    timer.update();
    const delta = timer.getDelta();
    const isFixedRotation = Number.isFinite(fixedRotationY);
    const rotationStep = isFixedRotation ? 0 : delta * AUTO_ROTATION_SPEED;

    if (isFixedRotation) {
      globe.rotation.y = fixedRotationY;
    } else {
      globe.rotation.y += rotationStep;
    }
    controls.update();
    renderer.render(scene, camera);

    telemetry.frameCount += 1;
    telemetry.lastDelta = delta;
    telemetry.lastRotationStep = rotationStep;
  }

  return {
    telemetry,
    start() {
      renderer.setAnimationLoop(animate);
    },
    stop() {
      renderer.setAnimationLoop(null);
    }
  };
}
