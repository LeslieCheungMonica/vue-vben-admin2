<script lang="ts" setup>
import { computed, nextTick, onMounted, onUnmounted, ref, shallowRef } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Card, message, Table, Tag } from 'ant-design-vue';

import { getApiEndpointTaskDetailApi, type ApiEndpointApi } from '#/api/core/apiEndpoint';

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

const route = useRoute();
const taskId = route.params.taskId as string;

const loading = ref(false);
const detail = ref<ApiEndpointApi.TaskDetailResult | null>(null);
const csvData = ref<{ headers: string[]; rows: string[][] } | null>(null);

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.trim().split('\n');
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows = lines.slice(1).map((line) =>
    line.split(',').map((cell) => cell.trim().replace(/^"|"$/g, '')),
  );
  return { headers, rows };
}

const statusColorMap: Record<string, string> = {
  'wait-to-start': 'default',
  running: 'processing',
  processing: 'processing',
  completed: 'success',
  finish: 'success',
  failed: 'error',
  stopped: 'warning',
};

const statusLabelMap: Record<string, string> = {
  'wait-to-start': '待运行',
  running: '运行中',
  processing: '运行中',
  completed: '运行完成',
  finish: '运行完成',
  failed: '失败',
  stopped: '已停止',
};

async function fetchDetail() {
  loading.value = true;
  try {
    const res = await getApiEndpointTaskDetailApi(taskId);
    detail.value = res;
    if (res.csv_content) {
      csvData.value = parseCsv(res.csv_content);
    }
  } catch {
    message.error('获取任务详情失败');
  } finally {
    loading.value = false;
  }
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

const rightCollapsed = ref(false);
const leftWidth = ref(78);

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

function toggleRight() {
  rightCollapsed.value = !rightCollapsed.value;
}

function getOrCreatePart(id: string, sessionId: string, type: PartState['type']) {
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
      eventStreamContainer.value.scrollTop = eventStreamContainer.value.scrollHeight;
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
  <Page :description="`任务 ${taskId} 的详情与数据`" title="API 任务详情">
    <div v-if="loading" class="flex items-center justify-center py-20 text-gray-400">
      <div class="text-center">
        <div class="mb-2 text-3xl animate-spin">⏳</div>
        <div>加载中...</div>
      </div>
    </div>
    <div v-else-if="detail" class="flex gap-0">
      <!-- Left panel -->
      <div
        class="flex flex-col rounded border transition-all duration-300 overflow-hidden"
        :style="leftPanelStyle"
      >
        <!-- Task Info Header -->
        <div class="border-b bg-gradient-to-r from-blue-50 to-white px-5 py-3">
          <div class="flex items-center gap-3 mb-2">
            <span class="text-xl">📋</span>
            <span class="text-base font-semibold text-gray-800">任务信息</span>
            <Tag :color="statusColorMap[detail.task_status] || 'default'">{{ statusLabelMap[detail.task_status] || detail.task_status }}</Tag>
          </div>
          <div class="grid grid-cols-3 gap-x-6 gap-y-1 text-sm">
            <div class="flex items-center gap-2">
              <span class="text-gray-400 shrink-0">🆔</span>
              <code class="text-gray-700 font-mono text-xs">{{ detail.task_id }}</code>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-gray-400 shrink-0">📛</span>
              <span class="text-gray-700">{{ detail.task_name }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-gray-400 shrink-0">🌐</span>
              <span class="text-gray-700">{{ detail.main_domain || '-' }}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-gray-400 shrink-0">📁</span>
              <code class="text-gray-600 font-mono text-xs">{{ detail.resource_path || '-' }}</code>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-gray-400 shrink-0">📅</span>
              <span class="text-gray-700">{{ detail.created_at }}</span>
            </div>
          </div>
        </div>

        <!-- CSV Data -->
        <div class="flex-1 overflow-auto p-4" style="min-height: 400px; max-height: calc(100vh - 300px);">
          <div v-if="csvData" class="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div class="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-3">
              <span class="text-lg">📊</span>
              <span class="text-sm font-semibold text-white">CSV 数据</span>
              <span class="ml-auto inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-0.5 text-xs text-white/90">{{ csvData.rows.length }} 条记录</span>
            </div>
            <div class="p-1">
              <Table
                :data-source="csvData.rows.map((row, i) => ({ _key: i, ...Object.fromEntries(csvData.headers.map((h, j) => [h, row[j] || ''])) }))"
                :columns="csvData.headers.map((h, i) => ({ title: h, dataIndex: h, key: h, ellipsis: true, width: i === 0 ? 200 : undefined }))"
                :pagination="{ pageSize: 12, showSizeChanger: true, showTotal: (t: number) => `共 ${t} 条` }"
                row-key="_key"
                size="middle"
                :scroll="{ x: 'max-content' }"
                class="api-csv-table"
              />
            </div>
          </div>
          <div v-else class="flex items-center justify-center py-16 text-gray-400">
            <div class="text-center">
              <div class="mb-2 text-4xl">📭</div>
              <div>暂无 CSV 数据</div>
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
          <span class="select-none leading-none text-[10px]">{{ rightCollapsed ? '◀' : '▶' }}</span>
        </div>
      </div>

      <!-- Right panel: thinking flow -->
      <div
        class="flex flex-col rounded border transition-all duration-300 overflow-hidden"
        :style="rightPanelStyle"
      >
        <div class="flex items-center gap-2 border-b bg-gradient-to-r from-purple-50 to-white px-4 py-3 text-sm font-medium">
          <span>🤖</span>
          <span>思考流程</span>
          <span
            class="inline-block h-2 w-2 rounded-full"
            :style="{ backgroundColor: eventStreamConnected ? '#52c41a' : '#d9d9d9' }"
          ></span>
          <span class="text-xs text-gray-400">{{ eventStreamConnected ? '已连接' : '未连接' }}</span>
        </div>
        <div
          ref="eventStreamContainer"
          class="flex-1 overflow-y-auto p-4"
          style="min-height: 400px; max-height: calc(100vh - 300px); overflow-x: hidden"
        >
          <template v-if="mergedDisplayItems.length === 0">
            <div class="pt-16 text-center text-gray-400">
              <div class="mb-2 text-3xl">⚡</div>
              <div>{{ eventStreamConnected ? '等待 AI 思考...' : '暂无连接' }}</div>
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
                class="rounded-lg border border-purple-100 bg-purple-50/60 p-3"
              >
                <div class="mb-1.5 flex items-center gap-1.5 text-xs text-purple-400">
                  <span>💭</span><span>推理中</span>
                  <span class="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-purple-400"></span>
                </div>
                <div class="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 space-y-2">
                  <template v-for="(text, tIdx) in item.texts" :key="tIdx">
                    <div v-if="text.trim()" class="text-gray-700">{{ text }}</div>
                  </template>
                  <span class="inline-block h-3.5 w-0.5 animate-pulse bg-purple-300 align-text-bottom"></span>
                </div>
              </div>
              <div
                v-if="item.type === 'tool'"
                class="rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
              >
                <div class="mb-1.5 flex items-center gap-2">
                  <span class="text-base">{{ toolStatusIcon[item.toolStatus || ''] || '🔧' }}</span>
                  <span class="text-xs font-medium text-gray-500">{{ item.toolName || '工具调用' }}</span>
                  <Tag
                    v-if="item.toolStatus"
                    :color="item.toolStatus === 'completed' ? 'success' : item.toolStatus === 'running' ? 'processing' : 'default'"
                  >{{ item.toolStatus }}</Tag>
                </div>
                <div
                  v-if="item.toolInput && !item.hideContent"
                  class="mb-1 rounded bg-gray-100 p-2 text-xs text-gray-600 font-mono"
                  style="word-break: break-all; white-space: pre-wrap"
                >{{ item.toolInput }}</div>
                <div
                  v-if="item.toolOutput && !item.hideContent"
                  class="rounded bg-green-50 p-2 text-xs text-green-700 font-mono"
                  style="word-break: break-all; white-space: pre-wrap"
                >{{ item.toolOutput }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Page>
</template>

<style scoped>
.api-csv-table :deep(.ant-table-thead > tr > th) {
  background: #f8fafc;
  font-weight: 700;
  color: #1e293b;
  font-size: 13px;
  padding: 10px 14px;
  border-bottom: 2px solid #e2e8f0;
}
.api-csv-table :deep(.ant-table-tbody > tr > td) {
  padding: 9px 14px;
  font-size: 13px;
  color: #334155;
  border-bottom: 1px solid #f1f5f9;
}
.api-csv-table :deep(.ant-table-tbody > tr:nth-child(even) > td) {
  background: #f8fafc;
}
.api-csv-table :deep(.ant-table-tbody > tr:hover > td) {
  background: #eff6ff !important;
}
.api-csv-table :deep(.ant-table-pagination) {
  margin: 12px 14px !important;
}
</style>