import * as THREE from "three/webgpu";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Inspector } from "three/addons/inspector/Inspector.js";
import { createEarthMaterials } from "./materialGraph.js";

function normalizeAssetBaseUrl(assetBaseUrl) {
  if (!assetBaseUrl) {
    return "/assets/textures/planets";
  }
  return assetBaseUrl.endsWith("/") ? assetBaseUrl.slice(0, -1) : assetBaseUrl;
}

function loadTextures(textureLoader, assetBaseUrl) {
  const base = normalizeAssetBaseUrl(assetBaseUrl);

  const dayTexture = textureLoader.load(`${base}/earth_day_4096.jpg`);
  dayTexture.colorSpace = THREE.SRGBColorSpace;
  dayTexture.anisotropy = 8;

  const nightTexture = textureLoader.load(`${base}/earth_night_4096.jpg`);
  nightTexture.colorSpace = THREE.SRGBColorSpace;
  nightTexture.anisotropy = 8;

  const bumpRoughnessCloudsTexture = textureLoader.load(`${base}/earth_bump_roughness_clouds_4096.jpg`);
  bumpRoughnessCloudsTexture.anisotropy = 8;

  return { dayTexture, nightTexture, bumpRoughnessCloudsTexture };
}

export function createScene({ container, assetBaseUrl, showInspector }) {
  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;

  const camera = new THREE.PerspectiveCamera(25, width / height, 0.1, 100);
  camera.position.set(4.5, 2, 3);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  const sun = new THREE.DirectionalLight("#ffffff", 2);
  sun.position.set(0, 0, 3);
  scene.add(sun);

  const textureLoader = new THREE.TextureLoader();
  const textures = loadTextures(textureLoader, assetBaseUrl);
  const { globeMaterial, atmosphereMaterial, uniforms } = createEarthMaterials({
    sun,
    ...textures
  });

  const sphereGeometry = new THREE.SphereGeometry(1, 64, 64);
  const globe = new THREE.Mesh(sphereGeometry, globeMaterial);
  scene.add(globe);

  const atmosphere = new THREE.Mesh(sphereGeometry, atmosphereMaterial);
  atmosphere.scale.setScalar(1.04);
  scene.add(atmosphere);

  const renderer = new THREE.WebGPURenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  if (showInspector) {
    renderer.inspector = new Inspector();
  }
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.minDistance = 0.1;
  controls.maxDistance = 50;

  function resize(nextWidth, nextHeight) {
    camera.aspect = nextWidth / nextHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(nextWidth, nextHeight);
  }

  function dispose() {
    controls.dispose();
    renderer.dispose();
    sphereGeometry.dispose();
    globeMaterial.dispose();
    atmosphereMaterial.dispose();
    textures.dayTexture.dispose();
    textures.nightTexture.dispose();
    textures.bumpRoughnessCloudsTexture.dispose();
    container.removeChild(renderer.domElement);
  }

  return {
    camera,
    scene,
    renderer,
    controls,
    globe,
    uniforms,
    resize,
    dispose
  };
}
