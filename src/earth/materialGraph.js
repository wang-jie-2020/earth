import * as THREE from "three/webgpu";
import {
  step,
  normalWorldGeometry,
  output,
  texture,
  vec3,
  vec4,
  normalize,
  positionWorld,
  bumpMap,
  cameraPosition,
  color,
  uniform,
  mix,
  uv,
  max
} from "three/tsl";

export function createEarthMaterials({ sun, dayTexture, nightTexture, bumpRoughnessCloudsTexture }) {
  const atmosphereDayColor = uniform(color("#4db2ff"));
  const atmosphereTwilightColor = uniform(color("#bc490b"));
  const roughnessLow = uniform(0.25);
  const roughnessHigh = uniform(0.35);

  const viewDirection = positionWorld.sub(cameraPosition).normalize();
  const fresnel = viewDirection.dot(normalWorldGeometry).abs().oneMinus().toVar();

  const sunOrientation = normalWorldGeometry.dot(normalize(sun.position)).toVar();
  const atmosphereColor = mix(atmosphereTwilightColor, atmosphereDayColor, sunOrientation.smoothstep(-0.25, 0.75));

  const globeMaterial = new THREE.MeshStandardNodeMaterial();
  const cloudsStrength = texture(bumpRoughnessCloudsTexture, uv()).b.smoothstep(0.2, 1);

  globeMaterial.colorNode = mix(texture(dayTexture), vec3(1), cloudsStrength.mul(2));

  const roughness = max(
    texture(bumpRoughnessCloudsTexture).g,
    step(0.01, cloudsStrength)
  );
  globeMaterial.roughnessNode = roughness.remap(0, 1, roughnessLow, roughnessHigh);

  const night = texture(nightTexture);
  const dayStrength = sunOrientation.smoothstep(-0.25, 0.5);
  const atmosphereDayStrength = sunOrientation.smoothstep(-0.5, 1);
  const atmosphereMix = atmosphereDayStrength.mul(fresnel.pow(2)).clamp(0, 1);

  let finalOutput = mix(night.rgb, output.rgb, dayStrength);
  finalOutput = mix(finalOutput, atmosphereColor, atmosphereMix);
  globeMaterial.outputNode = vec4(finalOutput, output.a);

  const bumpElevation = max(
    texture(bumpRoughnessCloudsTexture).r,
    cloudsStrength
  );
  globeMaterial.normalNode = bumpMap(bumpElevation);

  const atmosphereMaterial = new THREE.MeshBasicNodeMaterial({
    side: THREE.BackSide,
    transparent: true
  });

  let alpha = fresnel.remap(0.73, 1, 1, 0).pow(3);
  alpha = alpha.mul(sunOrientation.smoothstep(-0.5, 1));
  atmosphereMaterial.outputNode = vec4(atmosphereColor, alpha);

  return {
    globeMaterial,
    atmosphereMaterial,
    uniforms: {
      atmosphereDayColor,
      atmosphereTwilightColor,
      roughnessLow,
      roughnessHigh
    }
  };
}
