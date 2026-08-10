<script setup lang="ts">
import { onMounted, nextTick, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import { getResourceListApi } from '#/api/core/resource';

import AIChatPanel from './ai-chat-panel.vue';
import Biz3dMap from './biz-3d-map.vue';
import BizModuleMap from './biz-module-map.vue';

import Sigma from 'sigma';
import Graph from 'graphology';
import FA2Layout from 'graphology-layout-forceatlas2/worker';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import noverlap from 'graphology-layout-noverlap';

type Phase = 'loading' | 'graph';

const route = useRoute();
const taskId = route.params.taskId as string;

const phase = ref<Phase>('loading');
const loadMessage = ref('');
const errorMsg = ref('');
const resourceInfo = ref('');

let graphData: { nodes: any[]; relationships: any[] } | null = null;
let sigmaInstance: any = null;
let sigmaGraph: any = null;
let layoutInstance: any = null;
let layoutTimeout: ReturnType<typeof setTimeout> | null = null;
let layoutProgressInterval: ReturnType<typeof setInterval> | null = null;
let selectedNodeId: string | null = null;
let layoutDone = false;

const containerRef = ref<HTMLDivElement | null>(null);
const nodeCount = ref(0);
const edgeCount = ref(0);
const layoutProgress = ref(0);
const showChat = ref(true);
const systemId = ref(taskId);
const chatWidth = ref(400);
const dragging = ref(false);
const leftTab = ref('code');

function startResize(e: MouseEvent) {
  e.preventDefault();
  dragging.value = true;
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
  const startX = e.clientX;
  const startWidth = chatWidth.value;
  const onMove = (ev: MouseEvent) => {
    const delta = startX - ev.clientX;
    chatWidth.value = Math.min(800, Math.max(280, startWidth + delta));
  };
  const onUp = () => {
    dragging.value = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  };
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
}

const NODE_COLORS: Record<string, string> = {
  Project: '#a78bfa', Package: '#c4b5fd', Module: '#8b5cf6',
  Folder: '#818cf8', File: '#38bdf8', Class: '#fbbf24',
  Function: '#34d399', Method: '#2dd4bf', Variable: '#94a3b8',
  Interface: '#f472b6', Enum: '#fb923c', Decorator: '#fcd34d',
  Import: '#64748b', Type: '#a5b4fc', CodeElement: '#94a3b8',
  Community: '#818cf8', Process: '#fb7185', Section: '#7dd3fc',
  Struct: '#fbbf24', Trait: '#f472b6', Impl: '#2dd4bf',
  TypeAlias: '#a5b4fc', Const: '#94a3b8', Static: '#94a3b8',
  Namespace: '#8b5cf6', Union: '#fb923c', Typedef: '#a5b4fc',
  Macro: '#fcd34d', Property: '#94a3b8', Record: '#fbbf24',
  Delegate: '#2dd4bf', Annotation: '#fcd34d', Constructor: '#34d399',
  Template: '#a5b4fc', Route: '#fb7185', Tool: '#a78bfa',
};

const NODE_SIZES: Record<string, number> = {
  Project: 20, Package: 16, Module: 13, Folder: 10, File: 6,
  Class: 8, Function: 4, Method: 3, Variable: 2, Interface: 7,
  Enum: 5, Decorator: 2, Import: 1.5, Type: 3, CodeElement: 2,
  Community: 0, Process: 0, Section: 8, Struct: 8, Trait: 7,
  Impl: 3, TypeAlias: 3, Const: 2, Static: 2, Namespace: 13,
  Union: 5, Typedef: 3, Macro: 2, Property: 2, Record: 8,
  Delegate: 3, Annotation: 2, Constructor: 4, Template: 3,
  Route: 5, Tool: 5,
};

const COMMUNITY_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef',
  '#ec4899', '#f43f5e', '#14b8a6', '#84cc16',
];

const LEGEND_ITEMS = [
  { label: '项目', type: 'Project', color: '#a78bfa' },
  { label: '包', type: 'Package', color: '#c4b5fd' },
  { label: '模块', type: 'Module', color: '#8b5cf6' },
  { label: '目录', type: 'Folder', color: '#818cf8' },
  { label: '文件', type: 'File', color: '#38bdf8' },
  { label: '类', type: 'Class', color: '#fbbf24' },
  { label: '函数', type: 'Function', color: '#34d399' },
  { label: '方法', type: 'Method', color: '#2dd4bf' },
  { label: '接口', type: 'Interface', color: '#f472b6' },
  { label: '枚举', type: 'Enum', color: '#fb923c' },
  { label: '类型', type: 'Type', color: '#a5b4fc' },
  { label: '进程', type: 'Process', color: '#fb7185' },
  { label: '路由', type: 'Route', color: '#fb7185' },
  { label: '工具', type: 'Tool', color: '#a78bfa' },
];

function getCommunityColor(index: number): string {
  return COMMUNITY_COLORS[index % COMMUNITY_COLORS.length];
}

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 100, g: 100, b: 100 };
};

const rgbToHex = (r: number, g: number, b: number): string =>
  '#' + [r, g, b].map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('');

const dimColor = (hex: string, amount: number): string => {
  const rgb = hexToRgb(hex);
  const darkBg = { r: 7, g: 10, b: 18 };
  return rgbToHex(
    darkBg.r + (rgb.r - darkBg.r) * amount,
    darkBg.g + (rgb.g - darkBg.g) * amount,
    darkBg.b + (rgb.b - darkBg.b) * amount,
  );
};

const brightenColor = (hex: string, factor: number): string => {
  const rgb = hexToRgb(hex);
  return rgbToHex(
    rgb.r + ((255 - rgb.r) * (factor - 1)) / factor,
    rgb.g + ((255 - rgb.g) * (factor - 1)) / factor,
    rgb.b + ((255 - rgb.b) * (factor - 1)) / factor,
  );
};

const mixToBg = (hex: string, amount: number): string => {
  const bg = { r: 7, g: 10, b: 18 };
  const c = parseInt(hex.slice(1), 16);
  const mix = (channel: number, bgChannel: number) =>
    Math.round(bgChannel + (channel - bgChannel) * amount)
      .toString(16).padStart(2, '0');
  return `#${mix((c >> 16) & 255, bg.r)}${mix((c >> 8) & 255, bg.g)}${mix(c & 255, bg.b)}`;
};

const getScaledNodeSize = (baseSize: number, nodeCount: number): number => {
  if (nodeCount > 50000) return Math.max(1, baseSize * 0.4);
  if (nodeCount > 20000) return Math.max(1.5, baseSize * 0.5);
  if (nodeCount > 5000) return Math.max(2, baseSize * 0.65);
  if (nodeCount > 1000) return Math.max(2.5, baseSize * 0.8);
  return baseSize;
};

const getDegreeBasedSize = (degree: number, nodeCount: number): number => {
  const base = (1.8 + 1.15 * Math.log2(1 + Math.max(0, degree))) * 1.4;
  return getScaledNodeSize(base, nodeCount);
};

const getNodeMass = (nodeType: string, nodeCount: number): number => {
  const baseMassMultiplier = nodeCount > 5000 ? 2 : nodeCount > 1000 ? 1.5 : 1;
  switch (nodeType) {
    case 'Project': return 50 * baseMassMultiplier;
    case 'Package': return 30 * baseMassMultiplier;
    case 'Module': return 20 * baseMassMultiplier;
    case 'Folder': return 15 * baseMassMultiplier;
    case 'File': return 3 * baseMassMultiplier;
    case 'Class': case 'Interface': return 5 * baseMassMultiplier;
    case 'Function': case 'Method': return 2 * baseMassMultiplier;
    default: return 1;
  }
};

const NOVERLAP_SETTINGS = {
  maxIterations: 150, ratio: 1.2, margin: 20, expansion: 1.3,
};

function getFA2Settings(nodeCount: number) {
  const isSmall = nodeCount < 500;
  const isMedium = nodeCount >= 500 && nodeCount < 2000;
  const isLarge = nodeCount >= 2000 && nodeCount < 10000;
  return {
    gravity: isSmall ? 0.4 : isMedium ? 0.25 : isLarge ? 0.15 : 0.08,
    scalingRatio: isSmall ? 40 : isMedium ? 80 : isLarge ? 150 : 250,
    slowDown: isSmall ? 1 : isMedium ? 2 : isLarge ? 3 : 5,
    barnesHutOptimize: nodeCount > 200,
    barnesHutTheta: isLarge ? 0.8 : 0.6,
    strongGravityMode: false,
    outboundAttractionDistribution: true,
    linLogMode: false,
    adjustSizes: true,
    edgeWeightInfluence: 0.5,
  };
}

function getLayoutDuration(nodeCount: number): number {
  if (nodeCount > 10000) return 45000;
  if (nodeCount > 5000) return 35000;
  if (nodeCount > 2000) return 30000;
  if (nodeCount > 1000) return 30000;
  if (nodeCount > 500) return 25000;
  return 20000;
}

function buildGraphology(nodes: any[], relationships: any[]) {
  const g = new Graph();
  const nodeCount = nodes.length;

  const parentToChildren = new Map<string, string[]>();
  const childToParent = new Map<string, string>();
  const hierarchyRelations = new Set(['CONTAINS', 'DEFINES', 'IMPORTS']);

  relationships.forEach((rel: any) => {
    if (hierarchyRelations.has(rel.type)) {
      if (!parentToChildren.has(rel.sourceId)) {
        parentToChildren.set(rel.sourceId, []);
      }
      parentToChildren.get(rel.sourceId)!.push(rel.targetId);
      childToParent.set(rel.targetId, rel.sourceId);
    }
  });

  const nodeMap = new Map(nodes.map((n: any) => [n.id, n]));
  const structuralTypes = new Set(['Project', 'Package', 'Module', 'Folder']);
  const structuralNodes = nodes.filter((n: any) => structuralTypes.has(n.label));

  const structuralSpread = Math.sqrt(nodeCount) * 40;
  const childJitter = Math.sqrt(nodeCount) * 3;

  const communityMemberships = new Map<string, number>();
  relationships.forEach((rel: any) => {
    if (rel.type === 'MEMBER_OF') {
      const communityNode = nodeMap.get(rel.targetId);
      if (communityNode?.label === 'Community') {
        const idx = parseInt(rel.targetId.replace('comm_', ''), 10) || 0;
        communityMemberships.set(rel.sourceId, idx);
      }
    }
  });

  const clusterCenters = new Map<number, { x: number; y: number }>();
  if (communityMemberships.size > 0) {
    const communities = new Set(communityMemberships.values());
    const communityCount = communities.size;
    const clusterSpread = structuralSpread * 0.8;
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    let idx = 0;
    communities.forEach((communityId) => {
      const angle = idx * goldenAngle;
      const radius = clusterSpread * Math.sqrt((idx + 1) / communityCount);
      clusterCenters.set(communityId, { x: radius * Math.cos(angle), y: radius * Math.sin(angle) });
      idx++;
    });
  }

  const clusterJitter = Math.sqrt(nodeCount) * 1.5;
  const nodePositions = new Map<string, { x: number; y: number }>();

  structuralNodes.forEach((node: any, index: number) => {
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const angle = index * goldenAngle;
    const radius = structuralSpread * Math.sqrt((index + 1) / Math.max(structuralNodes.length, 1));
    const jitter = structuralSpread * 0.15;
    const x = radius * Math.cos(angle) + (Math.random() - 0.5) * jitter;
    const y = radius * Math.sin(angle) + (Math.random() - 0.5) * jitter;
    nodePositions.set(node.id, { x, y });
    const baseSize = NODE_SIZES[node.label] || 8;
    const scaledSize = getScaledNodeSize(baseSize, nodeCount);
    g.addNode(node.id, {
      x, y, size: scaledSize, color: NODE_COLORS[node.label] || '#9ca3af',
      label: node.properties.name, nodeType: node.label, filePath: node.properties.filePath,
      hidden: false, mass: getNodeMass(node.label, nodeCount),
    });
  });

  const addNodeWithPosition = (nodeId: string) => {
    if (g.hasNode(nodeId)) return;
    const node = nodeMap.get(nodeId);
    if (!node) return;
    let x: number, y: number;
    const communityIndex = communityMemberships.get(nodeId);
    const symbolTypes = new Set(['Function', 'Class', 'Method', 'Interface']);
    const clusterCenter = communityIndex !== undefined ? clusterCenters.get(communityIndex) : null;

    if (clusterCenter && symbolTypes.has(node.label)) {
      x = clusterCenter.x + (Math.random() - 0.5) * clusterJitter;
      y = clusterCenter.y + (Math.random() - 0.5) * clusterJitter;
    } else {
      const parentId = childToParent.get(nodeId);
      const parentPos = parentId ? nodePositions.get(parentId) : null;
      if (parentPos) {
        x = parentPos.x + (Math.random() - 0.5) * childJitter;
        y = parentPos.y + (Math.random() - 0.5) * childJitter;
      } else {
        x = (Math.random() - 0.5) * structuralSpread * 0.5;
        y = (Math.random() - 0.5) * structuralSpread * 0.5;
      }
    }
    nodePositions.set(nodeId, { x, y });
    const baseSize = NODE_SIZES[node.label] || 8;
    const scaledSize = getScaledNodeSize(baseSize, nodeCount);
    const hasCommunity = communityIndex !== undefined;
    const usesCommunityColor = hasCommunity && symbolTypes.has(node.label);
    const nodeColor = usesCommunityColor
      ? getCommunityColor(communityIndex!)
      : NODE_COLORS[node.label] || '#9ca3af';
    g.addNode(nodeId, {
      x, y, size: scaledSize, color: nodeColor,
      label: node.properties.name, nodeType: node.label, filePath: node.properties.filePath,
      hidden: false, mass: getNodeMass(node.label, nodeCount),
      community: communityIndex, communityColor: hasCommunity ? getCommunityColor(communityIndex!) : undefined,
    });
  };

  const queue: string[] = [...structuralNodes.map((n: any) => n.id)];
  const visited = new Set<string>(queue);
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const children = parentToChildren.get(currentId) || [];
    for (const childId of children) {
      if (!visited.has(childId)) {
        visited.add(childId);
        addNodeWithPosition(childId);
        queue.push(childId);
      }
    }
  }

  nodes.forEach((node: any) => {
    if (!g.hasNode(node.id)) addNodeWithPosition(node.id);
  });

  const edgeBaseSize = nodeCount > 20000 ? 3 : nodeCount > 5000 ? 4 : 5;
  const EDGE_STYLES: Record<string, { color: string; sizeMultiplier: number }> = {
    CONTAINS: { color: mixToBg('#7c8aa0', 0.5), sizeMultiplier: 0.5 },
    DEFINES: { color: mixToBg('#2dd4bf', 0.5), sizeMultiplier: 0.6 },
    IMPORTS: { color: mixToBg('#7dd3fc', 0.5), sizeMultiplier: 0.8 },
    CALLS: { color: mixToBg('#a78bfa', 0.5), sizeMultiplier: 1.0 },
    EXTENDS: { color: mixToBg('#fb923c', 0.5), sizeMultiplier: 1.0 },
    IMPLEMENTS: { color: mixToBg('#f472b6', 0.5), sizeMultiplier: 1.0 },
  };
  const defaultEdgeStyle = { color: mixToBg('#7c8aa0', 0.4), sizeMultiplier: 0.6 };

  relationships.forEach((rel: any) => {
    if (g.hasNode(rel.sourceId) && g.hasNode(rel.targetId)) {
      if (!g.hasEdge(rel.sourceId, rel.targetId)) {
        const style = EDGE_STYLES[rel.type] || defaultEdgeStyle;
        g.addEdge(rel.sourceId, rel.targetId, {
          size: edgeBaseSize * style.sizeMultiplier,
          color: style.color, relationType: rel.type,
        });
      }
    }
  });

  g.forEachNode((nodeId: string) => {
    g.setNodeAttribute(nodeId, 'size', getDegreeBasedSize(g.degree(nodeId), nodeCount));
  });

  return g;
}

function initSigma() {
  if (!containerRef.value || !graphData) return;
  if (sigmaInstance) { sigmaInstance.kill(); sigmaInstance = null; }
  if (layoutTimeout) { clearTimeout(layoutTimeout); layoutTimeout = null; }
  if (layoutInstance) { layoutInstance.kill(); layoutInstance = null; }

  sigmaGraph = buildGraphology(graphData.nodes, graphData.relationships);
  selectedNodeId = null;

  sigmaInstance = new Sigma(sigmaGraph, containerRef.value, {
    renderLabels: true,
    labelFont: 'ui-sans-serif, system-ui, sans-serif',
    labelSize: 10,
    labelWeight: '500',
    labelColor: { color: '#e2e8f0' },
    labelRenderedSizeThreshold: 8,
    labelDensity: 0.1,
    labelGridCellSize: 70,
    defaultNodeColor: '#94a3b8',
    defaultEdgeColor: '#303744',
    minCameraRatio: 0.002,
    maxCameraRatio: 50,
    hideEdgesOnMove: true,
    zIndex: true,
    defaultDrawNodeLabel: (ctx: any, data: any, settings: any) => {
      if (!data.label) return;
      const size = settings.labelSize || 10;
      const font = settings.labelFont || 'ui-sans-serif, system-ui, sans-serif';
      ctx.font = `500 ${size}px ${font}`;
      const textWidth = ctx.measureText(data.label).width;
      const nodeSize = data.size || 4;
      const x = data.x;
      const y = data.y + nodeSize + 2;
      const padX = 3;
      ctx.fillStyle = 'rgba(7,10,18,0.65)';
      ctx.fillRect(x - textWidth / 2 - padX, y - 1, textWidth + padX * 2, size + 3);
      ctx.fillStyle = '#e2e8f0';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(data.label, x, y);
    },
    nodeReducer: (node: any, data: any) => {
      const res = { ...data };
      if (data.hidden) { res.hidden = true; return res; }
      if (nodeCount > 3000) {
        const camera = sigmaInstance?.getCamera();
        if (camera) {
          const ratio = camera.getRatio();
          const viewport = camera.getViewport();
          const margin = viewport.width * 2;
          if (Math.abs(data.x) > margin || Math.abs(data.y) > margin) {
            res.hidden = true;
            return res;
          }
        }
      }
      if (selectedNodeId) {
        const isSelected = node === selectedNodeId;
        const isNeighbor = sigmaGraph.hasEdge(node, selectedNodeId) || sigmaGraph.hasEdge(selectedNodeId, node);
        if (isSelected) {
          res.color = data.color;
          res.size = (data.size || 8) * 1.8;
          res.zIndex = 2;
          res.highlighted = true;
        } else if (isNeighbor) {
          res.color = data.color;
          res.size = (data.size || 8) * 1.3;
          res.zIndex = 1;
        } else {
          res.color = dimColor(data.color, 0.25);
          res.size = (data.size || 8) * 0.6;
          res.zIndex = 0;
        }
      }
      return res;
    },
    edgeReducer: (edge: any, data: any) => {
      const res = { ...data };
      if (selectedNodeId) {
        const [source, target] = sigmaGraph.extremities(edge);
        const isConnected = source === selectedNodeId || target === selectedNodeId;
        if (isConnected) {
          res.color = brightenColor(data.color, 1.5);
          res.size = Math.max(3, (data.size || 1) * 4);
          res.zIndex = 2;
        } else {
          res.color = dimColor(data.color, 0.1);
          res.size = 0.3;
          res.zIndex = 0;
        }
      }
      return res;
    },
  });

  sigmaInstance.on('clickNode', ({ node }: any) => {
    selectedNodeId = node;
    sigmaInstance.refresh();
  });

  sigmaInstance.on('clickStage', () => {
    selectedNodeId = null;
    sigmaInstance.refresh();
  });

  runLayout();
}

function runLayout() {
  if (!sigmaInstance || !sigmaGraph) return;
  if (layoutInstance) { layoutInstance.kill(); layoutInstance = null; }
  if (layoutTimeout) { clearTimeout(layoutTimeout); layoutTimeout = null; }

  layoutDone = false;
  const inferredSettings = forceAtlas2.inferSettings(sigmaGraph);
  const customSettings = getFA2Settings(sigmaGraph.order);
  const settings = { ...inferredSettings, ...customSettings };

  const layout = new FA2Layout(sigmaGraph, { settings, getThreadsWeight: () => 1 });
  layoutInstance = layout;
  layout.start();

  const duration = getLayoutDuration(sigmaGraph.order);
  layoutProgress.value = 0;
  if (layoutProgressInterval) { clearInterval(layoutProgressInterval); }
  layoutProgressInterval = setInterval(() => {
    const elapsed = duration - (layoutTimeout ? duration : 0);
    layoutProgress.value = Math.min(95, Math.round((elapsed / duration) * 100));
  }, 500);

  layoutTimeout = setTimeout(() => {
    clearInterval(layoutProgressInterval!);
    layoutProgressInterval = null;
    layoutProgress.value = 100;
    layoutDone = true;
    if (layoutInstance) {
      layoutInstance.stop();
      layoutInstance = null;
      noverlap.assign(sigmaGraph, NOVERLAP_SETTINGS);
      sigmaInstance?.refresh();
    }
  }, duration);
}

const MAX_NODES = 5000;

function sampleGraph(data: { nodes: any[]; relationships: any[] }) {
  if (data.nodes.length <= MAX_NODES) return data;
  const structuralTypes = new Set(['Project', 'Package', 'Module', 'Folder']);
  const keepIds = new Set<string>();
  data.nodes.forEach((n) => {
    if (structuralTypes.has(n.label)) keepIds.add(n.id);
  });
  const degree = new Map<string, number>();
  data.relationships.forEach((r) => {
    degree.set(r.sourceId, (degree.get(r.sourceId) || 0) + 1);
    degree.set(r.targetId, (degree.get(r.targetId) || 0) + 1);
  });
  const fileNodes = data.nodes.filter((n) => n.label === 'File' && !keepIds.has(n.id));
  fileNodes.sort((a, b) => (degree.get(b.id) || 0) - (degree.get(a.id) || 0));
  const fileSlots = Math.min(fileNodes.length, Math.floor((MAX_NODES - keepIds.size) * 0.6));
  for (let i = 0; i < fileSlots; i++) keepIds.add(fileNodes[i].id);
  const symbolNodes = data.nodes.filter((n) => !keepIds.has(n.id));
  symbolNodes.sort((a, b) => (degree.get(b.id) || 0) - (degree.get(a.id) || 0));
  const symbolSlots = MAX_NODES - keepIds.size;
  for (let i = 0; i < symbolSlots && i < symbolNodes.length; i++) keepIds.add(symbolNodes[i].id);
  const sampled = {
    nodes: data.nodes.filter((n) => keepIds.has(n.id)),
    relationships: data.relationships.filter((r) => keepIds.has(r.sourceId) && keepIds.has(r.targetId)),
  };
  return sampled;
}

function zoomIn() { sigmaInstance?.getCamera().animatedZoom({ duration: 200 }); }
function zoomOut() { sigmaInstance?.getCamera().animatedUnzoom({ duration: 200 }); }

function resetZoom() {
  selectedNodeId = null;
  sigmaInstance?.getCamera().animatedReset({ duration: 300 });
  sigmaInstance?.refresh();
}

function focusNode() {
  if (!selectedNodeId || !sigmaInstance || !sigmaGraph) return;
  if (!sigmaGraph.hasNode(selectedNodeId)) return;
  const attrs = sigmaGraph.getNodeAttributes(selectedNodeId);
  sigmaInstance.getCamera().animate({ x: attrs.x, y: attrs.y, ratio: 0.15 }, { duration: 400 });
  sigmaInstance.refresh();
}

onMounted(async () => {
  const resourceId = Number(taskId);
  if (!resourceId) {
    errorMsg.value = '缺少资源 ID';
    return;
  }
  loadMessage.value = '正在获取资源信息...';
  try {
    const resRes = await getResourceListApi();
    const resource = resRes.items?.find((r: any) => r.id === resourceId);
    if (!resource) {
      errorMsg.value = '未找到关联的资源信息';
      return;
    }
    resourceInfo.value = `资源: ${resource.code}:${resource.version}`;

    const rawGraph = resource.biz_arch_graph;
    if (!rawGraph) {
      errorMsg.value = '该资源未包含代码图谱数据，请先上传资源并解析图谱';
      return;
    }
    const parsed = JSON.parse(rawGraph);
    if (!parsed?.nodes?.length) {
      errorMsg.value = '图谱数据为空';
      return;
    }
    let sampled = parsed;
    if (parsed.nodes.length > MAX_NODES) {
      loadMessage.value = `图谱过大 (${parsed.nodes.length} 节点)，正在采样至 ${MAX_NODES} 节点...`;
      await nextTick();
      sampled = sampleGraph(parsed);
    }
    loadMessage.value = `正在渲染代码图谱 (${sampled.nodes.length} 节点, ${sampled.relationships.length} 边)...`;
    graphData = sampled;
    nodeCount.value = sampled.nodes.length;
    edgeCount.value = sampled.relationships.length;
    phase.value = 'graph';
    requestAnimationFrame(() => {
      if (containerRef.value && graphData && !sigmaInstance) {
        initSigma();
      }
    });
  } catch (err: any) {
    errorMsg.value = err.message || '加载失败';
  }
});

watch(containerRef, (val) => {
  if (val && graphData && phase.value === 'graph') {
    requestAnimationFrame(() => initSigma());
  }
});

watch(leftTab, (val) => {
  if (val !== 'code') {
    if (layoutTimeout) { clearTimeout(layoutTimeout); layoutTimeout = null; }
    if (layoutProgressInterval) {
      clearInterval(layoutProgressInterval);
      layoutProgressInterval = null;
    }
    if (layoutInstance) { layoutInstance.kill(); layoutInstance = null; }
    return;
  }
  if (sigmaInstance && sigmaGraph && phase.value === 'graph' && !layoutDone) {
    requestAnimationFrame(() => runLayout());
  }
});

onUnmounted(() => {
  if (layoutTimeout) clearTimeout(layoutTimeout);
  if (layoutProgressInterval) clearInterval(layoutProgressInterval);
  if (layoutInstance) { layoutInstance.kill(); layoutInstance = null; }
  if (sigmaInstance) { sigmaInstance.kill(); sigmaInstance = null; }
  sigmaGraph = null;
});
</script>

<template>
  <Page :auto-content-height="true" title="业务测绘">
    <template v-if="phase === 'loading'">
      <div class="flex min-h-[60vh] flex-col items-center justify-center px-6">
        <div v-if="errorMsg" class="text-center">
          <h1 class="mb-2 text-3xl font-semibold tracking-tight text-gray-100">
            <span class="text-fuchsia-400">代码</span><span class="text-cyan-400">地图</span>
          </h1>
          <p class="mb-2 text-sm text-red-400">{{ errorMsg }}</p>
          <p v-if="resourceInfo" class="text-xs text-gray-500">{{ resourceInfo }}</p>
        </div>
        <div v-else class="flex flex-col items-center justify-center gap-4">
          <div class="relative size-16">
            <div class="absolute inset-0 animate-spin rounded-full border-2 border-gray-600 border-t-fuchsia-500" />
          </div>
          <p class="text-sm text-gray-200">{{ loadMessage }}</p>
        </div>
      </div>
    </template>

    <template v-else-if="phase === 'graph'">
      <div class="relative flex h-[calc(100vh-180px)] gap-0">
        <div class="relative flex-1 min-w-0 rounded-lg border border-gray-700 bg-[#070a12] overflow-hidden">
          <div class="absolute top-0 left-0 bottom-0 z-20 flex w-16 flex-col items-center gap-1 bg-[#070a12]/95 px-1 py-2 backdrop-blur-sm">
            <button
              class="w-full rounded px-1 py-2 text-center text-xs font-medium leading-tight transition-colors"
              :class="leftTab === 'code' ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:text-gray-200'"
              @click="leftTab = 'code'"
            >
              代码<br />地图
            </button>
            <button
              class="w-full rounded px-1 py-2 text-center text-xs font-medium leading-tight transition-colors"
              :class="leftTab === 'biz3d' ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:text-gray-200'"
              @click="leftTab = 'biz3d'"
            >
              业务<br />3D地图
            </button>
            <button
              class="w-full rounded px-1 py-2 text-center text-xs font-medium leading-tight transition-colors"
              :class="leftTab === 'modules' ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:text-gray-200'"
              @click="leftTab = 'modules'"
            >
              模块<br />地图
            </button>
          </div>
          <template v-if="leftTab === 'code'">
          <div ref="containerRef" class="sigma-container absolute inset-y-0" style="left: 64px; right: 0" />
          <div
            class="absolute right-3 top-14 z-10 rounded-lg border border-gray-700/60 bg-[#0a0d14]/90 p-3 shadow-sm backdrop-blur-sm"
          >
            <div class="mb-2 text-xs font-medium text-gray-300">节点类型</div>
            <div class="grid grid-cols-2 gap-x-4 gap-y-1">
              <div
                v-for="item in LEGEND_ITEMS"
                :key="item.type"
                class="flex items-center gap-1.5"
              >
                <span
                  class="size-2.5 rounded-full"
                  :style="{ backgroundColor: item.color }"
                />
                <span class="text-[11px] text-gray-400">{{ item.label }}</span>
              </div>
            </div>
          </div>
          <div
            class="absolute bottom-3 right-3 z-10 rounded-md border border-gray-700/60 bg-[#0a0d14]/90 px-2.5 py-1 text-[11px] text-gray-400 shadow-sm backdrop-blur-sm"
          >
            <span class="text-blue-400">{{ nodeCount }}</span> 节点 ·
            <span class="text-fuchsia-400">{{ edgeCount }}</span> 边
          </div>
          <div class="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-gray-700 bg-gray-800/90 px-3 py-2 shadow-sm backdrop-blur-sm" style="margin-left: 32px">
            <button class="rounded p-1 text-gray-400 hover:text-gray-200 hover:bg-gray-700" title="放大" @click="zoomIn">
              <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
            </button>
            <button class="rounded p-1 text-gray-400 hover:text-gray-200 hover:bg-gray-700" title="缩小" @click="zoomOut">
              <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M20 12H4" /></svg>
            </button>
            <button class="rounded p-1 text-gray-400 hover:text-gray-200 hover:bg-gray-700" title="重置视图" @click="resetZoom">
              <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" /></svg>
            </button>
            <button v-if="selectedNodeId" class="rounded p-1 text-gray-400 hover:text-gray-200 hover:bg-gray-700" title="聚焦选中节点" @click="focusNode">
              <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            </button>
            <div class="w-px h-4 bg-gray-700" />
            <span class="text-xs text-gray-400 whitespace-nowrap">{{ nodeCount }} 节点 · {{ edgeCount }} 边</span>
            <template v-if="layoutProgress > 0 && layoutProgress < 100">
              <div class="w-px h-4 bg-gray-700" />
              <div class="flex items-center gap-2">
                <div class="h-1.5 w-20 overflow-hidden rounded-full bg-gray-700">
                  <div
                    class="h-full rounded-full bg-fuchsia-500 transition-all duration-300"
                    :style="{ width: layoutProgress + '%' }"
                  />
                </div>
                <span class="text-xs text-gray-400">布局 {{ layoutProgress }}%</span>
              </div>
            </template>
          </div>
          </template>
          <template v-else-if="leftTab === 'biz3d'">
            <div class="absolute inset-y-0" style="left: 64px; right: 0">
              <Biz3dMap :web-id="taskId" />
            </div>
          </template>
          <template v-else>
            <div class="absolute inset-y-0" style="left: 64px; right: 0">
              <BizModuleMap :web-id="taskId" />
            </div>
          </template>
        </div>
        <div
          class="w-1 cursor-col-resize flex-shrink-0 bg-gray-800 hover:bg-blue-500/60 transition-colors"
          :class="showChat ? '' : 'hidden'"
          @mousedown="startResize"
          title="拖动调整宽度"
        />
        <div
          class="relative flex-shrink-0 bg-[#0c0f16] transition-[width] duration-200"
          :class="showChat ? '' : 'w-0'"
          :style="showChat ? { width: chatWidth + 'px' } : {}"
        >
          <div class="h-full overflow-hidden" :style="{ width: chatWidth + 'px' }">
            <AIChatPanel v-if="showChat" :system-id="systemId" />
          </div>
        </div>
        <button
          class="absolute top-1/2 z-10 -translate-y-1/2 rounded-l bg-gray-800 p-1 text-gray-400 hover:text-gray-200 hover:bg-gray-700"
          :class="showChat ? '' : 'right-0'"
          :style="showChat ? { right: (chatWidth + 4) + 'px' } : {}"
          @click="showChat = !showChat"
        >
          <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path v-if="showChat" stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            <path v-else stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </template>
  </Page>
</template>

<style scoped>
.sigma-container :deep(.sigma-scene) {
  background: #070a12 !important;
}
.sigma-container :deep(canvas) {
  display: block;
}
</style>