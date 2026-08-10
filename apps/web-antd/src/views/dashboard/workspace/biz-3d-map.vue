<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue';

import { moudles3dApi } from '#/api/core/resource';

const props = defineProps<{ webId: string }>();

const containerRef = ref<HTMLDivElement | null>(null);
const modCount = ref(0);
const fileCount = ref(0);
const loading = ref(true);
const errorMsg = ref('');
const infoVisible = ref(false);
const infoName = ref('');
const infoDetail = ref('');
const controlsOpen = ref(false);
const scaleVal = ref(1);
const lightVal = ref(1);
const spacingVal = ref(3);

let scene: any = null;
let camera: any = null;
let renderer: any = null;
let controls: any = null;
let dirLight: any = null;
let ambientLight: any = null;
let raycaster: any = null;
let pointer: any = null;
let buildings: any[] = [];
let MODULES: any[] = [];
let MAX_FILES = 1;
let totalRows = 0;
let animationId: number | null = null;
const cols = 5;

const COLOR_MAP: Record<string, number> = {
  core: 0x58a6ff,
  support: 0x3fb950,
  infrastructure: 0xa371f7,
};

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(
      `script[data-three-src="${src}"]`,
    );
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.dataset.threeSrc = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`加载脚本失败: ${src}`));
    document.head.appendChild(script);
  });
}

let threeReady: Promise<void> | null = null;
function ensureThree(): Promise<void> {
  if (!threeReady) {
    threeReady = (async () => {
      await loadScript('/vendor/three.min.js');
      await loadScript('/vendor/OrbitControls.js');
    })();
  }
  return threeReady;
}

function initScene() {
  const container = containerRef.value;
  if (!container || !THREE) return;
  const W = container.clientWidth;
  const H = container.clientHeight;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0d1117);
  scene.fog = new THREE.Fog(0x0d1117, 40, 70);

  camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
  camera.position.set(25, 18, 25);
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.target.set(0, 2, 0);
  controls.maxPolarAngle = Math.PI / 2.1;

  ambientLight = new THREE.AmbientLight(0x404060, 0.5);
  scene.add(ambientLight);

  dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(20, 30, 20);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  scene.add(dirLight);

  const fillLight = new THREE.DirectionalLight(0x8888ff, 0.3);
  fillLight.position.set(-20, 10, -20);
  scene.add(fillLight);

  const hemiLight = new THREE.HemisphereLight(0x88aaff, 0x443366, 0.4);
  scene.add(hemiLight);

  const groundGeo = new THREE.PlaneGeometry(50, 50);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x161b22,
    roughness: 0.8,
    metalness: 0.2,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.1;
  ground.receiveShadow = true;
  scene.add(ground);

  const gridHelper = new THREE.GridHelper(50, 20, 0x30363d, 0x21262d);
  gridHelper.position.y = 0;
  scene.add(gridHelper);

  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();

  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  renderer.domElement.addEventListener('touchstart', onTouchStart);

  animate();
}

function onPointerDown(e: any) {
  if (!renderer || !buildings.length) return;
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(buildings);
  if (intersects.length > 0) {
    const mod = intersects[0].object.userData;
    showInfo(mod);
  }
}

function onTouchStart(e: any) {
  if (e.changedTouches.length === 1) {
    const touch = e.changedTouches[0];
    onPointerDown({ clientX: touch.clientX, clientY: touch.clientY });
  }
}

function showInfo(mod: any) {
  infoName.value = `${mod.name} (${mod.id})`;
  infoDetail.value = `${mod.purpose || ''}<br>类型: ${mod.type} · 复杂度: ${mod.complexity} · 文件数: ${mod.file_count}`;
  infoVisible.value = true;
}

function closeInfo() {
  infoVisible.value = false;
}

function clearCity() {
  if (!scene) return;
  while (scene.getObjectByName('building') || scene.getObjectByName('label')) {
    const b = scene.getObjectByName('building');
    if (b) scene.remove(b);
    const l = scene.getObjectByName('label');
    if (l) scene.remove(l);
  }
  buildings.forEach((m: any) => {
    scene.remove(m);
  });
  buildings = [];
}

function buildCity(modules: any[]) {
  if (!scene) return;
  clearCity();

  MODULES = modules;
  MAX_FILES = Math.max(...MODULES.map((m: any) => m.file_count)) || 1;
  totalRows = Math.ceil(MODULES.length / cols);

  modCount.value = MODULES.length;
  fileCount.value = MODULES.reduce((s: number, m: any) => s + m.file_count, 0);

  MODULES.forEach((mod, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const x = (col - (cols - 1) / 2) * 3.0;
    const z = (row - (totalRows - 1) / 2) * 3.0;

    const height = Math.max(0.5, (mod.file_count / MAX_FILES) * 8 + 0.5);
    const color = COLOR_MAP[mod.type] || 0x8b949e;

    const geo = new THREE.BoxGeometry(1.2, height, 1.2);
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.4,
      metalness: 0.3,
      emissive: color,
      emissiveIntensity: 0.08,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = 'building';
    mesh.position.set(x, height / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = mod;
    scene.add(mesh);
    buildings.push(mesh);

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'rgba(13,17,23,0.75)';
      ctx.roundRect(0, 0, 256, 64, 8);
      ctx.fill();
      ctx.fillStyle = '#e6edf3';
      ctx.font = 'bold 20px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(mod.name, 128, 32);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    const spriteMat = new THREE.SpriteMaterial({
      map: tex,
      depthWrite: false,
      transparent: true,
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.name = 'label';
    sprite.position.set(x, height + 1.2, z);
    sprite.scale.set(3, 0.75, 1);
    scene.add(sprite);
  });
}

function normalizeModules(data: any): any[] | null {
  const list: any[] = [];
  const collect = (node: any) => {
    if (Array.isArray(node)) {
      node.forEach(collect);
    } else if (node && typeof node === 'object') {
      if (Array.isArray(node.modules)) {
        collect(node.modules);
      } else if (node.name) {
        list.push(node);
      }
    }
  };
  collect(data);
  if (list.length === 0) return null;
  return list.map((m: any) => {
    const type =
      m.type ||
      (m.complexity === 'high'
        ? 'core'
        : m.complexity === 'medium'
          ? 'support'
          : 'infrastructure');
    return {
      id: m.id || m.name,
      name: m.name,
      file_count: (m.primary_files && m.primary_files.length) || 1,
      type,
      complexity: m.complexity || 'medium',
      purpose: m.purpose || '',
      path: m.path,
    };
  });
}

function onScale(e: any) {
  const v = parseFloat(e.target.value);
  scaleVal.value = v;
  buildings.forEach((m: any) => {
    const mod = m.userData;
    const base = Math.max(0.5, (mod.file_count / MAX_FILES) * 8 + 0.5);
    const h = Math.max(0.5, base * v);
    m.scale.y = h / base;
    m.position.y = h / 2;
  });
}

function onLight(e: any) {
  const v = parseFloat(e.target.value);
  lightVal.value = v;
  if (dirLight) dirLight.intensity = 1.2 * v;
  if (ambientLight) ambientLight.intensity = 0.5 * v;
}

function onSpacing(e: any) {
  const s = parseFloat(e.target.value);
  spacingVal.value = s;
  buildings.forEach((m: any, i: number) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    m.position.x = (col - (cols - 1) / 2) * s;
    m.position.z = (row - (totalRows - 1) / 2) * s;
  });
}

function animate() {
  animationId = requestAnimationFrame(animate);
  if (controls) controls.update();
  if (renderer) renderer.render(scene, camera);
}

function onResize() {
  const container = containerRef.value;
  if (!container || !renderer) return;
  const w = container.clientWidth;
  const h = container.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

async function loadData() {
  loading.value = true;
  errorMsg.value = '';
  try {
    await ensureThree();
    await nextTick();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    initScene();
    window.addEventListener('resize', onResize);
    const res = await moudles3dApi(props.webId);
    const mods = normalizeModules(res?.modules);
    if (mods) {
      buildCity(mods);
    } else {
      errorMsg.value = '未获取到 3D 模块数据';
    }
  } catch (err: any) {
    errorMsg.value = err.message || '3D 模块数据加载失败';
  } finally {
    loading.value = false;
  }
}

function destroyScene() {
  if (animationId !== null) cancelAnimationFrame(animationId);
  animationId = null;
  if (renderer) {
    renderer.domElement.removeEventListener('pointerdown', onPointerDown);
    renderer.domElement.removeEventListener('touchstart', onTouchStart);
    renderer.dispose();
    if (renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
  }
  renderer = null;
  scene = null;
  camera = null;
  controls = null;
  dirLight = null;
  ambientLight = null;
  buildings = [];
  MODULES = [];
}

onMounted(() => {
  loadData();
});

onUnmounted(() => {
  window.removeEventListener('resize', onResize);
  destroyScene();
});
</script>

<template>
  <div class="relative h-full w-full overflow-hidden bg-[#0d1117]">
    <div ref="containerRef" class="absolute inset-0" />

    <div
      v-if="loading"
      class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#0d1117]"
    >
      <div
        class="size-8 animate-spin rounded-full border-[3px] border-gray-700 border-t-blue-500"
      />
      <span class="text-sm text-gray-400">正在加载模块数据…</span>
    </div>

    <div
      v-else-if="errorMsg"
      class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[#0d1117] px-6"
    >
      <div class="text-4xl">🧊</div>
      <p class="text-sm text-red-400">{{ errorMsg }}</p>
    </div>

    <template v-else>
      <div
        class="absolute left-1/2 top-3 z-10 flex -translate-x-1/2 gap-5 rounded-full border border-gray-700 bg-[#161b22]/90 px-4 py-1.5 text-xs text-gray-300 backdrop-blur"
      >
        <span class="flex items-center gap-1">
          🏗️ <span class="text-blue-400">{{ modCount }}</span> 模块
        </span>
        <span class="flex items-center gap-1">
          📄 <span class="text-fuchsia-400">{{ fileCount }}</span> 文件
        </span>
      </div>

      <div
        class="absolute bottom-6 left-6 z-10 flex gap-4 rounded-lg border border-gray-700 bg-[#161b22]/90 px-4 py-2.5 text-xs text-gray-300 backdrop-blur"
      >
        <div class="flex items-center gap-1.5">
          <span class="size-2.5 rounded-full bg-[#58a6ff]" /> 核心模块
        </div>
        <div class="flex items-center gap-1.5">
          <span class="size-2.5 rounded-full bg-[#3fb950]" /> 支持模块
        </div>
        <div class="flex items-center gap-1.5">
          <span class="size-2.5 rounded-full bg-[#a371f7]" /> 基础设施
        </div>
      </div>

      <div
        v-if="infoVisible"
        class="absolute right-6 top-6 z-10 min-w-[200px] rounded-lg border border-gray-700 bg-[#161b22]/95 p-3 text-sm shadow backdrop-blur"
      >
        <span class="float-right cursor-pointer text-gray-500" @click="closeInfo">✕</span>
        <div class="mb-1 font-semibold text-gray-100">{{ infoName }}</div>
        <div class="text-xs text-gray-400" v-html="infoDetail" />
      </div>

      <div
        class="absolute right-6 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-3 rounded-lg border border-gray-700 bg-[#161b22]/90 p-3 text-xs backdrop-blur transition-all"
        :class="controlsOpen ? '' : 'translate-x-[calc(100%+1.5rem)]'"
      >
        <div class="font-semibold text-gray-300">🎛️ 控制面板</div>
        <label class="block text-gray-400">
          垂直缩放: {{ scaleVal.toFixed(1) }}
          <input
            type="range"
            min="0.2"
            max="3.0"
            step="0.1"
            :value="scaleVal"
            class="mt-1 w-36 accent-blue-500"
            @input="onScale"
          />
        </label>
        <label class="block text-gray-400">
          光照强度: {{ lightVal.toFixed(1) }}
          <input
            type="range"
            min="0.2"
            max="2.0"
            step="0.1"
            :value="lightVal"
            class="mt-1 w-36 accent-blue-500"
            @input="onLight"
          />
        </label>
        <label class="block text-gray-400">
          建筑间距: {{ spacingVal.toFixed(1) }}
          <input
            type="range"
            min="1.5"
            max="6.0"
            step="0.5"
            :value="spacingVal"
            class="mt-1 w-36 accent-blue-500"
            @input="onSpacing"
          />
        </label>
      </div>

      <button
        class="absolute bottom-6 right-6 z-20 flex size-10 items-center justify-center rounded-full border border-gray-700 bg-[#161b22] text-lg text-gray-300 hover:bg-[#21262d]"
        title="切换控制面板"
        @click="controlsOpen = !controlsOpen"
      >
        ⚙️
      </button>
    </template>
  </div>
</template>
