import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// One persistent viewer receives camera poses from the root layout on every route.
let renderer;
let environment;
let pivot;
let disposed = false;
let status = "loading";
function respondStatus(event) {
  if (
    event.origin === location.origin &&
    event.source === parent &&
    (event.data?.type === "umbrella-frame" || event.data?.type === "umbrella-stage") &&
    event.data.requestStatus &&
    status !== "loading"
  ) {
    parent.postMessage({ type: `umbrella-${status}` }, location.origin);
  }
}
window.addEventListener("message", respondStatus);
let frame = { spin: 1.4, elevation: 88, size: 0.58, ox: 0, oy: 0 };
const materials = new Set();
const geometries = new Set();
const textures = new Set();
function releaseModel(model) {
  model.traverse((object) => {
    if (!object.isMesh) return;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material);
      for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
    }
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
  for (const texture of textures) texture.dispose();
}
window.addEventListener(
  "pagehide",
  () => {
    disposed = true;
    window.removeEventListener("message", respondStatus);
    environment?.dispose();
    renderer?.dispose();
    renderer?.forceContextLoss();
  },
  { once: true },
);

// Pixel-ratio governor: start at a ceiling that fits the device, then step down when frames
// arrive late and back up when they are consistently on time. Fill rate is the main cost of
// a full-width transparent canvas on phones.
const coarsePointer = matchMedia("(pointer: coarse)").matches;
const maxPixelRatio = Math.min(devicePixelRatio || 1, coarsePointer ? 1.5 : 2);
const minPixelRatio = Math.min(1, maxPixelRatio);
let pixelRatio = maxPixelRatio;
let sampleStart = 0;
let sampleFrames = 0;
function governPixelRatio(now) {
  if (!sampleStart) {
    sampleStart = now;
    sampleFrames = 0;
    return;
  }
  sampleFrames += 1;
  const elapsed = now - sampleStart;
  if (elapsed < 1000) return;
  const average = elapsed / sampleFrames;
  sampleStart = now;
  sampleFrames = 0;
  // Only judge continuous animation: long gaps mean the parent was idle, not slow.
  if (average > 100) return;
  const next =
    average > 20
      ? Math.max(minPixelRatio, pixelRatio - 0.25)
      : average < 17.5
        ? Math.min(maxPixelRatio, pixelRatio + 0.25)
        : pixelRatio;
  if (next !== pixelRatio) {
    pixelRatio = next;
    renderer.setPixelRatio(pixelRatio);
    measuredWidth = 0;
  }
}

let measuredWidth = 0;
let measuredHeight = 0;

try {
  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0, 0);
  renderer.setPixelRatio(pixelRatio);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  environment = pmrem.fromScene(room, 0.04);
  scene.environment = environment.texture;
  scene.environmentIntensity = 1.3;
  room.dispose();
  pmrem.dispose();
  const model = (await new GLTFLoader().loadAsync("/home/black-umbrella.glb")).scene;
  if (disposed) {
    releaseModel(model);
  } else {
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const extent = Math.max(size.x, size.y, size.z);
    if (!Number.isFinite(extent) || extent <= 0) throw new Error("Invalid model bounds");
    model.position.sub(center);
    pivot = new THREE.Group();
    pivot.add(model);
    pivot.scale.setScalar(2 / extent);
    scene.add(pivot);
    const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 100);
    const key = new THREE.DirectionalLight(0xffffff, 4);
    key.position.set(-3, 5, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xc5dedc, 3);
    rim.position.set(4, 2, -3);
    scene.add(rim);

    let lastRendered = null;
    function render(force = false) {
      if (disposed || document.hidden) return;
      const w = Math.max(innerWidth, 1);
      const h = Math.max(innerHeight, 1);
      const sizeChanged = w !== measuredWidth || h !== measuredHeight;
      if (
        !force &&
        !sizeChanged &&
        lastRendered &&
        lastRendered.spin === frame.spin &&
        lastRendered.elevation === frame.elevation &&
        lastRendered.size === frame.size &&
        lastRendered.ox === frame.ox &&
        lastRendered.oy === frame.oy
      )
        return;
      camera.aspect = w / h;
      const distance =
        (1.15 * h) / (Math.max(frame.size, 0.001) * Math.min(w, h) * Math.tan(Math.PI / 12));
      camera.far = Math.max(100, distance * 4);
      camera.updateProjectionMatrix();
      const elevation = THREE.MathUtils.degToRad(THREE.MathUtils.clamp(frame.elevation, -88, 88));
      camera.position.set(0, Math.sin(elevation) * distance, Math.cos(elevation) * distance);
      camera.lookAt(0, 0, 0);
      // Offset the projection center so the model lands at (ox, oy) in clip space.
      camera.projectionMatrix.elements[8] -= frame.ox;
      camera.projectionMatrix.elements[9] -= frame.oy;
      pivot.rotation.y = frame.spin;
      if (sizeChanged) {
        measuredWidth = w;
        measuredHeight = h;
        renderer.setSize(w, h, false);
      }
      renderer.render(scene, camera);
      lastRendered = { ...frame };
    }

    // ---- driven mode: at most one render per display frame -----------------------------
    let renderedThisFrame = false;
    let pendingRender = false;
    let frameTick = 0;
    function onVsync(now) {
      frameTick = 0;
      renderedThisFrame = false;
      if (pendingRender) {
        pendingRender = false;
        render();
        renderedThisFrame = true;
        governPixelRatio(now);
        frameTick = requestAnimationFrame(onVsync);
      }
    }
    function requestDrivenRender() {
      if (!renderedThisFrame) {
        render();
        renderedThisFrame = true;
        governPixelRatio(performance.now());
      } else {
        pendingRender = true;
      }
      if (!frameTick) frameTick = requestAnimationFrame(onVsync);
    }
    function onFrame(event) {
      if (
        event.origin !== location.origin ||
        event.source !== parent ||
        event.data?.type !== "umbrella-frame"
      )
        return;
      const data = event.data;
      if (![data.spin, data.elevation, data.size, data.ox, data.oy].every(Number.isFinite)) return;
      frame = data;
      requestDrivenRender();
    }

    function onVisibility() {
      render(true);
    }
    function onResize() {
      render(true);
    }

    window.addEventListener("message", onFrame);
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener(
      "pagehide",
      () => {
        cancelAnimationFrame(frameTick);
        window.removeEventListener("message", onFrame);
        window.removeEventListener("resize", onResize);
        document.removeEventListener("visibilitychange", onVisibility);
        releaseModel(model);
      },
      { once: true },
    );
    render(true);
    status = "ready";
    parent.postMessage({ type: "umbrella-ready" }, location.origin);
  }
} catch {
  status = "error";
  parent.postMessage({ type: "umbrella-error" }, location.origin);
}
