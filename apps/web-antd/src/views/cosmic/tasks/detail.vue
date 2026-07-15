<script lang="ts" setup>
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
} from 'vue';
import { useRoute } from 'vue-router';
import { Page } from '@vben/common-ui';
import { Descriptions, message, Tag, Tree } from 'ant-design-vue';
import { getCosmicTaskDetailApi, type CosmicApi } from '#/api/core/cosmic';

interface PartState {
  id: string;
  sessionId: string;
  type: 'reasoning' | 'tool' | 'step' | 'message';
  text: string;
  toolName?: string;
  toolCallId?: string;
  toolStatus?: 'pending' | 'running' | 'completed';
  toolInput?: string;
  toolOutput?: string;
  stepType?: 'start' | 'finish';
  hidden?: boolean;
  hideContent?: boolean;
  updatedAt: number;
}

interface AntTreeNode {
  key: string;
  title: string;
  children?: AntTreeNode[];
  isLeaf: boolean;
  evidence?: CosmicApi.Evidence;
  status: 'exists' | 'not-exists' | 'pending' | 'module';
  inputPath?: string;
}

const route = useRoute();
const taskId = route.params.taskId as string;

const loading = ref(false);
const treeData = ref<CosmicApi.TaskDetailNode | null>(null);
const antTreeData = ref<AntTreeNode[]>([]);
const selectedEvidence = ref<CosmicApi.Evidence | null>(null);
const expandedKeys = ref<string[]>([]);
const selectedKeys = ref<string[]>([]);

// Convert API tree to Ant Tree format
function toAntTree(node: CosmicApi.TaskDetailNode, path: string): AntTreeNode {
  const currentPath = path ? `${path}-${node.name}` : node.name;
  const isLeaf = !node.children || node.children.length === 0;
  let status: AntTreeNode['status'] = 'pending';
  if (node.evidence) {
    status = node.evidence.exists ? 'exists' : 'not-exists';
  }
  return {
    key: currentPath,
    title: node.name,
    isLeaf,
    status,
    evidence: node.evidence,
    inputPath: node.evidence?.input_path,
    children: node.children
      ? node.children.map((c) => toAntTree(c, currentPath))
      : undefined,
  };
}

const leftWidth = ref(70);
const rightCollapsed = ref(false);

function toggleRight() {
  rightCollapsed.value = !rightCollapsed.value;
}

const leftPanelStyle = computed(() => {
  if (rightCollapsed.value) return { width: '100%' };
  return { width: `${leftWidth.value}%` };
});

const rightPanelStyle = computed(() => {
  if (rightCollapsed.value) {
    return { width: '0', minWidth: '0', overflow: 'hidden', border: 'none' };
  }
  return { width: `calc(${100 - leftWidth.value}%)` };
});

async function fetchDetail() {
  loading.value = true;
  try {
    const res = await getCosmicTaskDetailApi(taskId);
    if (res.tree && res.tree.length > 0) {
      treeData.value = {
        name: 'COSMIC 功能判定',
        children: res.tree,
      };
      antTreeData.value = treeData.value.children.map((c) =>
        toAntTree(c, treeData.value!.name),
      );
      const keys = [treeData.value.name];
      let node: CosmicApi.TaskDetailNode | undefined = {
        name: treeData.value.name,
        children: res.tree,
      };
      for (let i = 0; i < 4; i++) {
        if (!node?.children?.length) break;
        node = node.children[0];
        keys.push(`${keys[i]}-${node.name}`);
      }
      expandedKeys.value = keys;
    } else {
      treeData.value = null;
      antTreeData.value = [];
    }
  } catch {
    message.error('获取任务详情失败');
    treeData.value = null;
  } finally {
    loading.value = false;
  }
}

function handleSelect(keys: string[], info: any) {
  selectedKeys.value = keys;
  const node = info.node as AntTreeNode;
  if (node.isLeaf && node.evidence) {
    selectedEvidence.value = { ...node.evidence, input_path: node.inputPath || node.evidence.input_path };
  } else if (!node.isLeaf) {
    const key = node.key;
    if (expandedKeys.value.includes(key)) {
      expandedKeys.value = expandedKeys.value.filter((k) => k !== key);
    } else {
      expandedKeys.value = [...expandedKeys.value, key];
    }
  }
}

function countLeafNodes(node: CosmicApi.TaskDetailNode): number {
  if (!node.children || node.children.length === 0) return 1;
  return node.children.reduce((sum, c) => sum + countLeafNodes(c), 0);
}

function countExists(node: CosmicApi.TaskDetailNode): number {
  if (!node.children || node.children.length === 0)
    return node.evidence?.exists ? 1 : 0;
  return node.children.reduce((sum, c) => sum + countExists(c), 0);
}

function countNotExists(node: CosmicApi.TaskDetailNode): number {
  if (!node.children || node.children.length === 0)
    return node.evidence && !node.evidence.exists ? 1 : 0;
  return node.children.reduce((sum, c) => sum + countNotExists(c), 0);
}

function countPending(node: CosmicApi.TaskDetailNode): number {
  if (!node.children || node.children.length === 0)
    return !node.evidence ? 1 : 0;
  return node.children.reduce((sum, c) => sum + countPending(c), 0);
}

// ---- Right side: thinking flow (EventSource) ----

const FLUSH_INTERVAL = 150;
const displayItems = shallowRef<PartState[]>([]);

const mergedDisplayItems = computed(() => {
  const result: (
    | { type: 'merged-reasoning'; texts: string[]; ids: string[] }
    | PartState
  )[] = [];
  let current: {
    type: 'merged-reasoning';
    texts: string[];
    ids: string[];
  } | null = null;
  for (const item of displayItems.value) {
    if (item.type === 'reasoning') {
      if (current) {
        current.texts.push(item.text);
        current.ids.push(item.id);
      } else {
        current = {
          type: 'merged-reasoning',
          texts: [item.text],
          ids: [item.id],
        };
        result.push(current);
      }
    } else {
      current = null;
      result.push(item);
    }
  }
  return result;
});

const eventStreamConnected = ref(false);
let eventSource: EventSource | null = null;
let flushTimer: ReturnType<typeof setInterval> | null = null;
const partsMap = new Map<string, PartState>();
const dirtyParts = new Set<string>();
const eventStreamContainer = ref<HTMLDivElement | null>(null);

function getOrCreatePart(
  id: string,
  sessionId: string,
  type: PartState['type'],
) {
  let part = partsMap.get(id);
  if (!part) {
    part = { id, sessionId, type, text: '', updatedAt: Date.now() };
    partsMap.set(id, part);
  }
  return part;
}

function flushDirtyParts() {
  if (dirtyParts.size === 0) return;
  const items = Array.from(partsMap.values())
    .filter((p) => !p.hidden)
    .sort((a, b) => a.updatedAt - b.updatedAt);
  displayItems.value = items;
  dirtyParts.clear();
  nextTick(() => {
    if (eventStreamContainer.value) {
      eventStreamContainer.value.scrollTop =
        eventStreamContainer.value.scrollHeight;
    }
  });
}

function processEvent(data: any) {
  const type: string = data.type;
  const props = data.properties || {};
  if (type === 'message.part.delta' && props.field === 'text') {
    const partId = props.partID;
    if (!partId) return;
    const existing = partsMap.get(partId);
    if (existing?.hidden) return;
    const part = getOrCreatePart(partId, props.sessionID, 'reasoning');
    part.text += props.delta || '';
    part.updatedAt = Date.now();
    dirtyParts.add(partId);
    return;
  }
  if (type === 'message.part.updated') {
    const partData = props.part || {};
    const partId = partData.id || props.partID;
    if (!partId) return;
    const partType: string = partData.type || '';
    const part = getOrCreatePart(partId, props.sessionID, partType as any);
    if (partType === 'reasoning') {
      part.text = partData.text || part.text;
    } else if (partType === 'tool') {
      part.type = 'tool';
      part.toolName = partData.toolName || partData.tool;
      part.toolCallId = partData.callID;
      part.toolStatus = partData.status || partData.state;
      part.toolInput = partData.input || partData.toolInput;
      part.toolOutput = partData.output || partData.toolOutput;
    }
    if (partData.status === 'completed' || partData.state === 'completed') {
      part.toolStatus = 'completed';
    }
    part.updatedAt = Date.now();
    dirtyParts.add(partId);
    return;
  }
  if (type === 'message.part.created') {
    const partData = props.part || {};
    const partId = partData.id || props.partID;
    if (!partId) return;
    const partType: string = partData.type || '';
    const part = getOrCreatePart(partId, props.sessionID, partType as any);
    if (partType === 'tool') {
      part.type = 'tool';
      part.toolName = partData.toolName || partData.tool;
      part.toolCallId = partData.callID;
      part.toolStatus = partData.status || partData.state;
    }
    part.updatedAt = Date.now();
    dirtyParts.add(partId);
    return;
  }
  if (type === 'step' && props.step) {
    const stepPartId = `step-${props.step.type}-${props.step.name || Date.now()}`;
    const part = getOrCreatePart(stepPartId, '', 'step');
    part.stepType = props.step.type;
    part.text = props.step.name || props.step.type;
    part.updatedAt = Date.now();
    dirtyParts.add(stepPartId);
  }
}

function connectEventStream() {
  const url = `/api/wape/event_stream/${taskId}`;
  eventSource = new EventSource(url);
  eventSource.onopen = () => {
    eventStreamConnected.value = true;
  };
  eventSource.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      processEvent(data);
    } catch {
      /* ignore */
    }
  };
  eventSource.onerror = () => {
    eventStreamConnected.value = false;
    if (eventSource) eventSource.close();
  };
}

const toolStatusIcon: Record<string, string> = {
  running: '🔄',
  completed: '✅',
  pending: '⏳',
};

onMounted(() => {
  fetchDetail();
  connectEventStream();
  flushTimer = setInterval(flushDirtyParts, FLUSH_INTERVAL);
});

onUnmounted(() => {
  if (eventSource) eventSource.close();
  if (flushTimer) clearInterval(flushTimer);
});
</script>

<template>
  <Page
    :description="`任务 ${taskId} 的判定详情与思考流程`"
    title="Cosmic 任务详情"
  >
    <div class="flex gap-0">
      <!-- Left panel: tree -->
      <div
        class="flex flex-col rounded border transition-all duration-300 overflow-hidden relative"
        :style="leftPanelStyle"
      >
        <div
          class="flex items-center gap-2 border-b bg-gray-50 px-4 py-3 text-sm font-medium shrink-0"
        >
          <span>📋 功能存在性判定</span>
          <Tag v-if="treeData" color="blue"
            >{{ countLeafNodes(treeData) }} 项</Tag
          >
          <Tag v-if="treeData" color="green"
            >{{ countExists(treeData) }} 已实现</Tag
          >
          <Tag v-if="treeData" color="red"
            >{{ countNotExists(treeData) }} 未实现</Tag
          >
          <Tag v-if="treeData" color="orange"
            >{{ countPending(treeData) }} 待判定</Tag
          >
        </div>
        <div class="flex-1 overflow-auto p-4" style="min-height: 500px">
          <div
            v-if="loading"
            class="flex items-center justify-center py-20 text-gray-400"
          >
            加载中...
          </div>
          <div
            v-else-if="!treeData"
            class="flex items-center justify-center py-20 text-gray-400"
          >
            暂无判定数据
          </div>
          <Tree
            v-else
            :tree-data="antTreeData"
            :expanded-keys="expandedKeys"
            :selected-keys="selectedKeys"
            show-line
            class="cosmic-tree"
            block-node
            @expand="expandedKeys = $event"
            @select="handleSelect"
          >
            <template
              #title="{ key: treeKey, title, isLeaf, status, evidence }"
            >
              <div class="flex items-center gap-2 py-0.5">
                <span v-if="!isLeaf" class="text-base shrink-0">📂</span>
                <span v-else class="text-base shrink-0">📄</span>
                <span
                  v-if="status === 'exists'"
                  class="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-green-500 ring-1 ring-green-200"
                />
                <span
                  v-else-if="status === 'not-exists'"
                  class="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-red-400 ring-1 ring-red-200"
                />
                <span
                  v-else-if="status === 'pending'"
                  class="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-yellow-400 ring-1 ring-yellow-200"
                />
                <span
                  v-else
                  class="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-gray-300"
                />
                <span
                  class="flex-1 truncate text-sm"
                  :class="{ 'font-medium': !isLeaf }"
                  >{{ title }}</span
                >
                <Tag
                  v-if="isLeaf && evidence"
                  :color="evidence.exists ? 'success' : 'error'"
                  class="shrink-0 !text-xs !px-1.5"
                >
                  {{ evidence.exists ? '已实现' : '未实现' }}
                </Tag>
                <Tag
                  v-else-if="isLeaf && !evidence"
                  color="default"
                  class="shrink-0 !text-xs !px-1.5"
                  >待判定</Tag
                >
              </div>
            </template>
          </Tree>
        </div>

        <!-- Evidence detail panel (overlay inside left panel) -->
        <div
          v-if="selectedEvidence"
          class="absolute right-0 top-0 z-20 flex flex-col rounded-l-lg border border-r-0 bg-white shadow-xl transition-all duration-300 overflow-hidden"
          :style="{ width: '440px', height: '100%' }"
        >
          <!-- Header -->
          <div
            class="flex items-center justify-between border-b bg-gradient-to-r from-blue-50 to-white px-4 py-3"
          >
            <div class="flex items-center gap-2">
              <span class="text-base">🔍</span>
              <span class="text-sm font-medium text-gray-700">判定详情</span>
            </div>
            <span
              class="cursor-pointer text-lg leading-none text-gray-300 hover:text-gray-500 transition-colors"
              @click="selectedEvidence = null"
              >×</span
            >
          </div>

          <div
            class="flex-1 overflow-auto p-4 space-y-4"
            style="min-height: 300px"
          >
            <div
              class="rounded-lg border p-4"
              :class="
                selectedEvidence.exists
                  ? 'border-green-200 bg-green-50/40'
                  : 'border-red-200 bg-red-50/40'
              "
            >
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <span class="text-lg">{{
                    selectedEvidence.exists ? '✅' : '❌'
                  }}</span>
                  <span
                    class="text-sm font-semibold"
                    :class="
                      selectedEvidence.exists
                        ? 'text-green-700'
                        : 'text-red-700'
                    "
                  >
                    {{ selectedEvidence.exists ? '功能已实现' : '功能未实现' }}
                  </span>
                </div>
                <Tag :color="selectedEvidence.exists ? 'success' : 'error'">{{
                  selectedEvidence.exists ? '是' : '否'
                }}</Tag>
              </div>
              <div class="space-y-2 text-sm">
                <div class="flex items-start gap-2">
                  <span class="shrink-0 mt-0.5 text-gray-400">📁</span>
                  <code class="break-all rounded bg-gray-100/80 px-2 py-0.5 text-xs text-gray-600">{{ selectedEvidence.input_path }}</code>
                </div>
                <div class="flex items-start gap-2">
                  <span class="shrink-0 mt-0.5 text-gray-400">💬</span>
                  <p class="text-gray-600 leading-relaxed">{{ selectedEvidence.reason }}</p>
                </div>
              </div>
            </div>

            <div v-if="selectedEvidence.summary" class="rounded-lg border border-gray-200 p-4">
              <div class="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">📊 总结</div>
              <div class="space-y-1.5 text-sm">
                <div v-if="selectedEvidence.summary.overall" class="flex items-center gap-2">
                  <span class="text-xs text-gray-400 w-16 shrink-0">整体</span>
                  <span>{{ selectedEvidence.summary.overall }}</span>
                </div>
                <div v-if="selectedEvidence.summary.frontend_status" class="flex items-center gap-2">
                  <span class="text-xs text-gray-400 w-16 shrink-0">前端</span>
                  <span>{{ selectedEvidence.summary.frontend_status }}</span>
                </div>
                <div v-if="selectedEvidence.summary.backend_status" class="flex items-center gap-2">
                  <span class="text-xs text-gray-400 w-16 shrink-0">后端</span>
                  <span>{{ selectedEvidence.summary.backend_status }}</span>
                </div>
              </div>
            </div>

            <div v-if="selectedEvidence.conclusion" class="rounded-lg border border-gray-200 p-4">
              <div class="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">📝 结论</div>
              <p class="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{{ selectedEvidence.conclusion }}</p>
            </div>

            <div v-if="selectedEvidence.evidence?.frontend" class="rounded-lg border border-gray-200 overflow-hidden">
              <div class="flex items-center gap-2 bg-gray-50 px-4 py-2.5 border-b border-gray-200">
                <span>🖥️</span>
                <span class="text-sm font-medium text-gray-700">前端分析</span>
                <Tag :color="selectedEvidence.evidence.frontend.exists ? 'success' : 'error'" class="ml-auto">
                  {{ selectedEvidence.evidence.frontend.exists ? '已找到' : '未找到' }}
                </Tag>
              </div>
              <div class="p-4 space-y-3">
                <div v-if="selectedEvidence.evidence.frontend.file_path">
                  <div class="text-xs text-gray-400 mb-1">文件路径</div>
                  <code class="block rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 font-mono break-all">{{ selectedEvidence.evidence.frontend.file_path }}</code>
                </div>
                <div v-if="selectedEvidence.evidence.frontend.component_name">
                  <div class="text-xs text-gray-400 mb-1">组件名</div>
                  <span class="text-sm text-gray-700">{{ selectedEvidence.evidence.frontend.component_name }}</span>
                </div>
                <div v-if="selectedEvidence.evidence.frontend.route_path">
                  <div class="text-xs text-gray-400 mb-1">路由路径</div>
                  <code class="text-sm text-gray-600">{{ selectedEvidence.evidence.frontend.route_path }}</code>
                </div>
                <div v-if="selectedEvidence.evidence.frontend.missing_reason">
                  <div class="text-xs text-gray-400 mb-1">缺失原因</div>
                  <p class="text-sm text-gray-600 leading-relaxed">{{ selectedEvidence.evidence.frontend.missing_reason }}</p>
                </div>
                <div v-if="selectedEvidence.evidence.frontend.reason">
                  <div class="text-xs text-gray-400 mb-1">分析理由</div>
                  <p class="text-sm text-gray-600 leading-relaxed">{{ selectedEvidence.evidence.frontend.reason }}</p>
                </div>
              </div>
            </div>

            <div v-if="selectedEvidence.evidence?.backend" class="rounded-lg border border-gray-200 overflow-hidden">
              <div class="flex items-center gap-2 bg-gray-50 px-4 py-2.5 border-b border-gray-200">
                <span>⚙️</span>
                <span class="text-sm font-medium text-gray-700">后端分析</span>
                <Tag :color="selectedEvidence.evidence.backend.exists ? 'success' : 'error'" class="ml-auto">
                  {{ selectedEvidence.evidence.backend.exists ? '已找到' : '未找到' }}
                </Tag>
              </div>
              <div class="p-4 space-y-3">
                <div v-if="selectedEvidence.evidence.backend.api">
                  <div class="text-xs text-gray-400 mb-1">API</div>
                  <code class="text-sm text-gray-600 font-mono">{{ selectedEvidence.evidence.backend.api }}</code>
                </div>
                <div v-if="selectedEvidence.evidence.backend.handler">
                  <div class="text-xs text-gray-400 mb-1">处理器</div>
                  <span class="text-sm text-gray-700">{{ selectedEvidence.evidence.backend.handler }}</span>
                </div>
                <div v-if="selectedEvidence.evidence.backend.file_path">
                  <div class="text-xs text-gray-400 mb-1">文件路径</div>
                  <code class="block rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 font-mono break-all">{{ selectedEvidence.evidence.backend.file_path }}</code>
                </div>
                <div v-if="selectedEvidence.evidence.backend.service_name">
                  <div class="text-xs text-gray-400 mb-1">服务名称</div>
                  <span class="text-sm text-gray-700">{{ selectedEvidence.evidence.backend.service_name }}</span>
                </div>
                <div v-if="selectedEvidence.evidence.backend.line">
                  <div class="text-xs text-gray-400 mb-1">行号</div>
                  <span class="text-sm text-gray-700">{{ selectedEvidence.evidence.backend.line }}</span>
                </div>
                <div v-if="selectedEvidence.evidence.backend.method">
                  <div class="text-xs text-gray-400 mb-1">HTTP 方法</div>
                  <Tag color="blue">{{ selectedEvidence.evidence.backend.method }}</Tag>
                </div>
                <div v-if="selectedEvidence.evidence.backend.reason">
                  <div class="text-xs text-gray-400 mb-1">分析理由</div>
                  <p class="text-sm text-gray-600 leading-relaxed">{{ selectedEvidence.evidence.backend.reason }}</p>
                </div>
                <div v-if="selectedEvidence.evidence.backend.code_snippet">
                  <div class="text-xs text-gray-400 mb-1">代码片段</div>
                  <pre class="rounded bg-gray-900 p-3 text-xs text-green-400 font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap">{{ selectedEvidence.evidence.backend.code_snippet }}</pre>
                </div>
              </div>
            </div>

            <div v-if="selectedEvidence.business_context" class="rounded-lg border border-gray-200 p-4">
              <div class="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">🏢 业务上下文</div>
              <div class="space-y-3 text-sm">
                <div v-if="selectedEvidence.business_context.service_responsibility">
                  <div class="text-xs text-gray-400 mb-1">服务职责</div>
                  <p class="text-gray-700 leading-relaxed">{{ selectedEvidence.business_context.service_responsibility }}</p>
                </div>
                <div v-if="selectedEvidence.business_context.data_flow">
                  <div class="text-xs text-gray-400 mb-1">数据流</div>
                  <p class="text-gray-700 leading-relaxed">{{ selectedEvidence.business_context.data_flow }}</p>
                </div>
                <div v-if="selectedEvidence.business_context.related_modules?.length">
                  <div class="text-xs text-gray-400 mb-1">相关模块</div>
                  <div class="flex flex-wrap gap-1.5">
                    <Tag v-for="m in selectedEvidence.business_context.related_modules" :key="m">{{ m }}</Tag>
                  </div>
                </div>
                <div v-if="selectedEvidence.business_context.note">
                  <div class="text-xs text-gray-400 mb-1">备注</div>
                  <p class="text-gray-700 leading-relaxed">{{ selectedEvidence.business_context.note }}</p>
                </div>
              </div>
            </div>

            <div v-if="selectedEvidence.searched_info" class="rounded-lg border border-gray-200 p-4">
              <div class="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">🔍 搜索信息</div>
              <div class="space-y-3 text-sm">
                <div v-if="selectedEvidence.searched_info.frontend_keywords?.length">
                  <div class="text-xs text-gray-400 mb-1">前端关键词</div>
                  <div class="flex flex-wrap gap-1.5">
                    <span v-for="kw in selectedEvidence.searched_info.frontend_keywords" :key="kw" class="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs text-blue-600 font-mono">{{ kw }}</span>
                  </div>
                </div>
                <div v-if="selectedEvidence.searched_info.frontend_paths?.length">
                  <div class="text-xs text-gray-400 mb-1">前端搜索路径</div>
                  <div class="space-y-1">
                    <div v-for="p in selectedEvidence.searched_info.frontend_paths" :key="p" class="rounded bg-gray-100 px-2 py-1 text-xs text-gray-500 font-mono">{{ p }}</div>
                  </div>
                </div>
                <div v-if="selectedEvidence.searched_info.backend_keywords?.length">
                  <div class="text-xs text-gray-400 mb-1">后端关键词</div>
                  <div class="flex flex-wrap gap-1.5">
                    <span v-for="kw in selectedEvidence.searched_info.backend_keywords" :key="kw" class="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs text-blue-600 font-mono">{{ kw }}</span>
                  </div>
                </div>
                <div v-if="selectedEvidence.searched_info.backend_paths?.length">
                  <div class="text-xs text-gray-400 mb-1">后端搜索路径</div>
                  <div class="space-y-1">
                    <div v-for="p in selectedEvidence.searched_info.backend_paths" :key="p" class="rounded bg-gray-100 px-2 py-1 text-xs text-gray-500 font-mono">{{ p }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="selectedEvidence.confidence !== undefined" class="rounded-lg border border-gray-200 p-4">
              <div class="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">🎯 置信度</div>
              <div class="flex items-center gap-2">
                <span class="text-sm font-bold" :class="selectedEvidence.confidence >= 0.8 ? 'text-green-600' : selectedEvidence.confidence >= 0.5 ? 'text-yellow-600' : 'text-red-600'">{{ (selectedEvidence.confidence * 100).toFixed(0) }}%</span>
                <div class="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div class="h-full rounded-full transition-all" :class="selectedEvidence.confidence >= 0.8 ? 'bg-green-500' : selectedEvidence.confidence >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'" :style="{ width: `${selectedEvidence.confidence * 100}%` }"></div>
                </div>
              </div>
            </div>

            <div v-if="selectedEvidence.recommendation" class="rounded-lg border border-gray-200 p-4">
              <div class="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">💡 建议</div>
              <p class="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{{ selectedEvidence.recommendation }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Resize handle -->
      <div class="relative flex flex-col" :style="{ width: '0' }">
        <div
          class="absolute -left-3 top-8 z-20 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white text-xs text-gray-400 shadow-sm transition-all hover:border-blue-300 hover:text-blue-500 hover:shadow-md"
          :title="rightCollapsed ? '展开思考流程' : '收起思考流程'"
          @click="toggleRight"
        >
          <span class="select-none leading-none text-[10px]">{{
            rightCollapsed ? '◀' : '▶'
          }}</span>
        </div>
      </div>

      <!-- Right panel: thinking flow -->
      <div
        class="flex flex-col rounded border transition-all duration-300 overflow-hidden"
        :style="rightPanelStyle"
      >
        <div
          class="flex items-center gap-2 border-b bg-gray-50 px-4 py-3 text-sm font-medium"
        >
          <span>🤖 思考流程</span>
          <span
            class="inline-block h-2 w-2 rounded-full"
            :style="{
              backgroundColor: eventStreamConnected ? '#52c41a' : '#d9d9d9',
            }"
          ></span>
          <span class="text-xs text-gray-400">{{
            eventStreamConnected ? '已连接' : '未连接'
          }}</span>
        </div>
        <div
          ref="eventStreamContainer"
          class="flex-1 overflow-y-auto p-4"
          style="min-height: 400px; max-height: 540px; overflow-x: hidden"
        >
          <template v-if="mergedDisplayItems.length === 0">
            <div class="pt-16 text-center text-gray-400">
              <div class="mb-2 text-3xl">⚡</div>
              <div>
                {{ eventStreamConnected ? '等待 AI 思考...' : '暂无连接' }}
              </div>
            </div>
          </template>
          <div class="space-y-3">
            <div
              v-for="item in mergedDisplayItems"
              :key="item.type === 'merged-reasoning' ? item.ids[0] : item.id"
              class="animate-fade-in"
            >
              <div
                v-if="item.type === 'merged-reasoning'"
                class="rounded-lg border border-blue-100 bg-blue-50/60 p-3"
              >
                <div
                  class="mb-1.5 flex items-center gap-1.5 text-xs text-blue-400"
                >
                  <span>💭</span><span>推理中</span>
                  <span
                    class="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400"
                  ></span>
                </div>
                <div
                  class="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 space-y-2"
                >
                  <template v-for="(text, tIdx) in item.texts" :key="tIdx">
                    <div v-if="text.trim()" class="text-gray-700">
                      {{ text }}
                    </div>
                  </template>
                  <span
                    class="inline-block h-3.5 w-0.5 animate-pulse bg-blue-300 align-text-bottom"
                  ></span>
                </div>
              </div>
              <div
                v-if="item.type === 'tool'"
                class="rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
              >
                <div class="mb-1.5 flex items-center gap-2">
                  <span class="text-base">{{
                    toolStatusIcon[item.toolStatus || ''] || '🔧'
                  }}</span>
                  <span class="text-xs font-medium text-gray-500">{{
                    item.toolName || '工具调用'
                  }}</span>
                  <Tag
                    v-if="item.toolStatus"
                    :color="
                      item.toolStatus === 'completed'
                        ? 'success'
                        : item.toolStatus === 'running'
                          ? 'processing'
                          : 'default'
                    "
                    >{{ item.toolStatus }}</Tag
                  >
                </div>
                <div
                  v-if="item.toolInput && !item.hideContent"
                  class="mb-1 rounded bg-gray-100 p-2 text-xs text-gray-600 font-mono"
                  style="word-break: break-all; white-space: pre-wrap"
                >
                  {{ item.toolInput }}
                </div>
                <div
                  v-if="item.toolInput && item.hideContent"
                  class="mb-1 truncate rounded bg-gray-50 p-2 text-xs text-gray-400 font-mono"
                  :title="item.toolInput"
                >
                  {{ item.toolInput.slice(0, 80) }}...
                </div>
                <div
                  v-if="item.toolOutput && !item.hideContent"
                  class="rounded bg-green-50 p-2 text-xs text-green-700 font-mono"
                  style="word-break: break-all; white-space: pre-wrap"
                >
                  {{ item.toolOutput }}
                </div>
                <div
                  v-if="item.toolOutput && item.hideContent"
                  class="truncate rounded bg-gray-50 p-2 text-xs text-gray-400 font-mono"
                  :title="item.toolOutput"
                >
                  {{ item.toolOutput.slice(0, 80) }}...
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Page>
</template>

<style scoped>
.cosmic-tree :deep(.ant-tree-treenode) {
  padding: 2px 0;
  border-bottom: 1px solid #f0f0f0;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.cosmic-tree :deep(.ant-tree-treenode:last-child) {
  border-bottom: none;
}

.cosmic-tree :deep(.ant-tree-treenode:hover) {
  background-color: #e6f4ff;
}

.cosmic-tree :deep(.ant-tree-node-content-wrapper) {
  background: transparent !important;
}
</style>
