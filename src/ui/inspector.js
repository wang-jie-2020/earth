import * as THREE from "three/webgpu";

export const PARAMETER_NAMES = [
  "atmosphereDayColor",
  "atmosphereTwilightColor",
  "roughnessLow",
  "roughnessHigh"
];

export function createInspectorBindings({ renderer, uniforms, enabled }) {
  if (!enabled || !renderer.inspector) {
    return {
      parameterNames: []
    };
  }

  const gui = renderer.inspector.createParameters("Parameters");

  gui
    .addColor({ color: uniforms.atmosphereDayColor.value.getHex(THREE.SRGBColorSpace) }, "color")
    .onChange((value) => {
      uniforms.atmosphereDayColor.value.set(value);
    })
    .name("atmosphereDayColor");

  gui
    .addColor({ color: uniforms.atmosphereTwilightColor.value.getHex(THREE.SRGBColorSpace) }, "color")
    .onChange((value) => {
      uniforms.atmosphereTwilightColor.value.set(value);
    })
    .name("atmosphereTwilightColor");

  gui.add(uniforms.roughnessLow, "value", 0, 1, 0.001).name("roughnessLow");
  gui.add(uniforms.roughnessHigh, "value", 0, 1, 0.001).name("roughnessHigh");

  return {
    parameterNames: [...PARAMETER_NAMES]
  };
}
