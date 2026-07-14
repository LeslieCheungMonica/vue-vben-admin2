<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref, shallowRef, triggerRef } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Button, Checkbox, Input, message, Select, Tag } from 'ant-design-vue';

import { getRepeatTaskListApi, getVulnDetailListApi, updateRepeatTaskApi } from '#/api/core/task';
import type { VulnDetailItem } from '#/api/core/task';

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
const repeatTaskId = route.query.repeatTaskId as string | undefined;

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
      const trimmed = item.text.trim();
      if (!trimmed || /^<\/?thinking>\s*<\/?thinking>?\s*$/.test(trimmed)) continue;
      if (current) {
        const cleaned = item.text.replace(/<\/?thinking>/g, '').replace(/\n{3,}/g, '\n\n');
        current.texts.push(cleaned);
        current.ids.push(item.id);
      } else {
        current = {
          type: 'merged-reasoning',
          texts: [item.text.replace(/<\/?thinking>/g, '').replace(/\n{3,}/g, '\n\n')],
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

const toolStatusIcon: Record<string, string> = {
  pending: '⏳',
  running: '🔄',
  completed: '✅',
};

function getOrCreatePart(id: string, sessionId: string, type: PartState['type']) {
  let part = partsMap.get(id);
  if (!part) {
    part = { id, sessionId, type, text: '', updatedAt: Date.now() };
    partsMap.set(id, part);
  }
  return part;
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
      const tool = partData.tool || partData.toolName;
      part.type = 'tool';
      part.toolName = tool;
      part.toolCallId = partData.callID;
      const state = partData.state || {};
      if (state.status) part.toolStatus = state.status;
      if (state.input) {
        part.toolInput = typeof state.input === 'string' ? state.input : JSON.stringify(state.input, null, 2);
      }
      if (state.output) {
        part.toolOutput = typeof state.output === 'string' ? state.output : JSON.stringify(state.output, null, 2);
      }
    } else if (partType === 'step-start') {
      part.type = 'step';
      part.stepType = 'start';
    } else if (partType === 'step-finish') {
      part.type = 'step';
      part.stepType = 'finish';
      part.text = partData.reason || partData.snapshot || '';
    } else if (partType === 'message') {
      part.type = 'message';
    }
    part.updatedAt = Date.now();
    dirtyParts.add(partId);
    return;
  }

  if (type === 'message.updated') {
    const info = props.info || {};
    const msgId = info.id;
    if (!msgId) return;
    if (info.finish) {
      const part = getOrCreatePart(`finish:${msgId}`, info.sessionID, 'step');
      part.stepType = 'finish';
      part.text = `[完成] ${info.finish}  (tokens: ${info.tokens?.total || '-'})`;
      part.updatedAt = Date.now();
      dirtyParts.add(part.id);
    }
    return;
  }

  if (type === 'session.status' || type === 'session.updated') return;
}

function flushBuffer() {
  if (dirtyParts.size === 0) return;
  for (const id of dirtyParts) {
    const part = partsMap.get(id);
    if (!part || part.hidden) continue;
    const existingIdx = displayItems.value.findIndex((d) => d.id === id);
    if (existingIdx >= 0) {
      displayItems.value[existingIdx] = { ...part };
    } else {
      displayItems.value.push({ ...part });
    }
  }
  dirtyParts.clear();
  triggerRef(displayItems);
  const el = eventStreamContainer.value;
  if (el) el.scrollTop = el.scrollHeight;
}

function connectEventStream(tid: string) {
  disconnectEventStream();
  displayItems.value = [];
  partsMap.clear();
  dirtyParts.clear();
  eventStreamConnected.value = false;
  flushTimer = setInterval(flushBuffer, FLUSH_INTERVAL);
  const url = `/api/wape/event_stream/${tid}`;
  eventSource = new EventSource(url);
  eventSource.onopen = () => { eventStreamConnected.value = true; };
  eventSource.onmessage = (event) => {
    try { const d = JSON.parse(event.data); processEvent(d); } catch { /* ignore */ }
  };
  eventSource.onerror = () => { eventStreamConnected.value = false; };
}

function disconnectEventStream() {
  if (flushTimer) { clearInterval(flushTimer); flushTimer = null; }
  flushBuffer();
  if (eventSource) { eventSource.close(); eventSource = null; }
  eventStreamConnected.value = false;
}

onMounted(() => {
  fetchVulns();
  if (repeatTaskId) connectEventStream(repeatTaskId);
});

onUnmounted(() => {
  disconnectEventStream();
});

const keyword = ref('');
const confidenceFilter = ref<string>('all');
const sourceTableFilter = ref<string>('auth');
const vulnList = ref<VulnDetailItem[]>([]);
const loading = ref(false);
const selectedVuln = ref<VulnDetailItem | null>(null);
const selectedIds = ref<Set<number>>(new Set());
const page = ref(1);
const pageSize = 10;
const total = ref(0);

const confidenceOptions = [
  { label: '全部风险等级', value: 'all' },
  { label: '高危', value: '高危' },
  { label: '中危', value: '中危' },
  { label: '低危', value: '低危' },
];

const sourceTableOptions = [
  { label: 'auth', value: 'auth' },
  { label: 'authz', value: 'authz' },
  { label: 'injection', value: 'injection' },
  { label: 'ssrf', value: 'ssrf' },
  { label: 'xss', value: 'xss' },
  { label: 'biz', value: 'biz' },
];

const filteredList = computed(() => {
  let list = vulnList.value;
  if (keyword.value) {
    const kw = keyword.value.toLowerCase();
    list = list.filter(
      (v) =>
        v.title?.toLowerCase().includes(kw) ||
        v.vuln_id?.toLowerCase().includes(kw),
    );
  }
  return list;
});

const totalPages = computed(() => Math.ceil(total.value / pageSize));

const confidenceBgMap: Record<string, string> = {
  '高危': 'bg-red-50 border-red-200',
  '中危': 'bg-yellow-50 border-yellow-200',
  '低危': 'bg-green-50 border-green-200',
};

function toggleSelect(id: number) {
  const s = new Set(selectedIds.value);
  if (s.has(id)) s.delete(id); else s.add(id);
  selectedIds.value = s;
}

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedIds.value = new Set();
  } else {
    selectedIds.value = new Set(filteredList.value.map((v) => v.id));
  }
}

const isAllSelected = computed(
  () =>
    filteredList.value.length > 0 &&
    filteredList.value.every((v) => selectedIds.value.has(v.id)),
);

async function fetchVulns() {
  loading.value = true;
  page.value = 1;
  try {
    const res = await getVulnDetailListApi(
      taskId,
      sourceTableFilter.value,
      page.value,
      pageSize,
      confidenceFilter.value !== 'all' ? confidenceFilter.value : undefined,
    );
    vulnList.value = res.items ?? [];
    total.value = res.total ?? 0;
    if (vulnList.value.length > 0) {
      selectedVuln.value = vulnList.value[0];
    } else {
      selectedVuln.value = null;
    }
    if (repeatTaskId) {
      try {
        const repeatRes = await getRepeatTaskListApi(taskId);
        const repeatTask = repeatRes.items?.find((r) => r.repeat_task_id === repeatTaskId);
        if (repeatTask?.vuln_ids) {
          const savedIds = repeatTask.vuln_ids.split(',').map((s) => s.trim()).filter(Boolean);
          const matched = new Set(
            vulnList.value.filter((v) => savedIds.includes(v.vuln_id)).map((v) => v.id),
          );
          selectedIds.value = matched;
        }
      } catch { /* ignore */ }
    }
  } catch {
    vulnList.value = [];
    total.value = 0;
    selectedVuln.value = null;
  } finally {
    loading.value = false;
  }
}

async function syncSelectedIds() {
  if (!repeatTaskId) return;
  try {
    const repeatRes = await getRepeatTaskListApi(taskId);
    const repeatTask = repeatRes.items?.find((r) => r.repeat_task_id === repeatTaskId);
    if (repeatTask?.vuln_ids) {
      const savedIds = repeatTask.vuln_ids.split(',').map((s) => s.trim()).filter(Boolean);
      const matched = new Set(
        vulnList.value.filter((v) => savedIds.includes(v.vuln_id)).map((v) => v.id),
      );
      selectedIds.value = matched;
    }
  } catch { /* ignore */ }
}

async function goPage(p: number) {
  if (p < 1 || p > totalPages.value) return;
  page.value = p;
  loading.value = true;
  try {
    const res = await getVulnDetailListApi(
      taskId,
      sourceTableFilter.value,
      page.value,
      pageSize,
      confidenceFilter.value !== 'all' ? confidenceFilter.value : undefined,
    );
    vulnList.value = res.items ?? [];
    if (vulnList.value.length > 0) {
      selectedVuln.value = vulnList.value[0];
    } else {
      selectedVuln.value = null;
    }
    await syncSelectedIds();
  } catch {
    vulnList.value = [];
    selectedVuln.value = null;
  } finally {
    loading.value = false;
  }
}

function selectVuln(vuln: VulnDetailItem) {
  selectedVuln.value = vuln;
}

const exploitStatusBadgeClass = computed(() => {
  const s = selectedVuln.value?.exploit_status || '';
  if (s.includes('验证受阻') || s.includes('失败')) return 'bg-red-100 border-red-300 text-red-700';
  if (s.includes('成功利用') || s.includes('成功')) return 'bg-green-100 border-green-300 text-green-700';
  return 'bg-gray-100 border-gray-300 text-gray-700';
});

const hasExploitData = computed(() => {
  if (!selectedVuln.value) return false;
  const v = selectedVuln.value;
  return !!(
    v.exploit_title ||
    v.exploit_severity ||
    v.exploit_status ||
    v.exploit_vuln_detail ||
    v.exploit_location ||
    v.exploit_blockers ||
    v.exploit_impact ||
    v.exploit_prerequisites ||
    v.exploit_steps ||
    v.exploit_evidence
  );
});

async function handleSaveVulnIds() {
  if (!repeatTaskId) return;
  const selected = filteredList.value.filter((v) => selectedIds.value.has(v.id));
  const currentType = sourceTableFilter.value;

  let existing: Record<string, any> = {};
  try {
    const repeatRes = await getRepeatTaskListApi(taskId);
    const repeatTask = repeatRes.items?.find((r) => r.repeat_task_id === repeatTaskId);
    if (repeatTask?.vuln_ids) {
      existing = JSON.parse(repeatTask.vuln_ids);
    }
  } catch { /* ignore */ }

  if (currentType === 'biz') {
    const groups: Record<string, string[]> = {};
    for (const v of selected) {
      const name = v.biz_name || 'default';
      if (!groups[name]) groups[name] = [];
      groups[name].push(v.vuln_id);
    }
    existing.biz = Object.entries(groups).map(([biz_name, ids]) => ({
      biz_name,
      vuln_ids: ids.filter(Boolean).join(','),
    }));
  } else {
    const ids = selected.map((v) => v.vuln_id).filter(Boolean).join(',');
    existing[currentType] = ids;
  }

  try {
    await updateRepeatTaskApi({
      repeat_task_id: repeatTaskId,
      vuln_ids: JSON.stringify(existing),
    });
    message.success('漏洞 ID 已保存');
  } catch {
    message.error('保存失败');
  }
}

function confidenceClass(confidence: string) {
  if (confidence === '高危') return 'bg-red-100 text-red-700';
  if (confidence === '中危') return 'bg-yellow-100 text-yellow-700';
  if (confidence === '低危') return 'bg-green-100 text-green-700';
  return 'bg-gray-100 text-gray-600';
}

onMounted(() => {
  fetchVulns();
});
</script>

<template>
  <Page description="查看任务漏洞明细" title="漏洞明细">
    <div class="flex h-[calc(100vh-260px)] gap-5">
      <!-- Left: Vuln List -->
      <div
        class="flex w-[520px] flex-shrink-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
      >
        <div
          class="flex items-center gap-2 border-b border-gray-100 px-4 py-3"
        >
          <div
            class="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-sm"
          >
            🛡️
          </div>
          <span class="text-sm font-semibold text-gray-800">漏洞列表</span>
          <span
            class="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500"
          >
            {{ total }}
          </span>
          <Checkbox
            :checked="isAllSelected"
            class="ml-2"
            @change="toggleSelectAll"
          />
          <Button
            v-if="repeatTaskId"
            size="small"
            type="primary"
            ghost
            class="ml-1 text-xs"
            @click="handleSaveVulnIds"
          >
            保存
          </Button>
        </div>
        <div class="flex flex-col gap-2.5 border-b border-gray-100 px-4 py-3">
          <Input
            v-model:value="keyword"
            placeholder="搜索漏洞名称 / ID..."
            allow-clear
          >
            <template #prefix>
              <span class="text-gray-400">🔍</span>
            </template>
          </Input>
          <div class="flex items-center gap-1.5">
            <Select
              v-model:value="confidenceFilter"
              :options="confidenceOptions"
              class="w-[120px] text-xs"
              size="small"
            />
            <Select
              v-model:value="sourceTableFilter"
              :options="sourceTableOptions"
              class="w-[100px] text-xs"
              size="small"
            />
            <Button type="primary" ghost size="small" class="ml-auto text-xs" @click="fetchVulns">
              查询
            </Button>
          </div>
        </div>
        <div class="flex-1 overflow-y-auto">
          <div
            v-if="loading"
            class="flex items-center justify-center py-16 text-sm text-gray-400"
          >
            <div class="flex flex-col items-center gap-2">
              <div
                class="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"
              ></div>
              <span>加载中...</span>
            </div>
          </div>
          <div
            v-else-if="filteredList.length === 0"
            class="flex items-center justify-center py-16 text-sm text-gray-400"
          >
            <div class="flex flex-col items-center gap-1">
              <span class="text-2xl">📭</span>
              <span>暂无漏洞</span>
            </div>
          </div>
          <div
            v-for="vuln in filteredList"
            :key="vuln.id"
            class="mx-2 mb-1.5 cursor-pointer rounded-lg border px-3 py-2.5 transition-all hover:opacity-90"
            :class="[
              confidenceBgMap[vuln.confidence] || 'bg-gray-50 border-gray-200',
              selectedVuln?.id === vuln.id ? '!bg-blue-100/70' : '',
            ]"
            @click="selectVuln(vuln)"
          >
            <div class="flex items-start gap-2">
              <Checkbox
                :checked="selectedIds.has(vuln.id)"
                class="mt-0.5"
                @click.stop
                @change="toggleSelect(vuln.id)"
              />
              <div class="flex flex-1 flex-col min-w-0">
                <div class="flex items-start justify-between gap-2">
                  <div
                    class="flex-1 text-sm font-medium leading-snug"
                    :class="
                      selectedVuln?.id === vuln.id
                        ? 'text-blue-700'
                        : 'text-gray-800'
                    "
                  >
                    {{ vuln.title }}
                  </div>
                  <span
                    class="flex-shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium"
                    :class="confidenceClass(vuln.confidence)"
                  >
                    {{ vuln.confidence }}
                  </span>
                </div>
                <div class="mt-1.5 flex items-center gap-2 text-xs text-gray-400">
                  <span class="font-mono">{{ vuln.vuln_id }}</span>
                  <span class="text-gray-300">|</span>
                  <span>{{ vuln.create_time }}</span>
                  <span
                    v-if="vuln.vulnerability_type"
                    class="rounded-md bg-gray-100 px-1.5 py-0.5 font-mono text-gray-500"
                  >
                    {{ vuln.vulnerability_type }}
                  </span>
                </div>
                <div
                  v-if="vuln.notes"
                  class="mt-1.5 line-clamp-2 text-xs leading-relaxed text-gray-500"
                >
                  {{ vuln.notes }}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          v-if="totalPages > 1"
          class="flex items-center justify-between border-t border-gray-100 px-3 py-2 text-xs text-gray-500"
        >
          <span>共 {{ total }} 条</span>
          <div class="flex items-center gap-1">
            <button
              class="rounded px-2 py-1 transition-colors hover:bg-gray-100 disabled:opacity-40"
              :disabled="page <= 1"
              @click="goPage(page - 1)"
            >
              上一页
            </button>
            <template v-for="p in totalPages" :key="p">
              <button
                v-if="p === page || p === 1 || p === totalPages || Math.abs(p - page) <= 1"
                class="rounded px-2 py-1 transition-colors"
                :class="p === page ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'"
                @click="goPage(p)"
              >
                {{ p }}
              </button>
              <span
                v-else-if="p === page - 2 || p === page + 2"
                class="px-1"
              >...</span>
            </template>
            <button
              class="rounded px-2 py-1 transition-colors hover:bg-gray-100 disabled:opacity-40"
              :disabled="page >= totalPages"
              @click="goPage(page + 1)"
            >
              下一页
            </button>
          </div>
        </div>
      </div>

      <!-- Middle: Vuln Detail -->
      <div
        class="flex flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
      >
        <template v-if="selectedVuln">
          <div
            class="flex items-center gap-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-5 py-3.5"
          >
            <span
              class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
              :class="confidenceClass(selectedVuln.confidence)"
            >
              {{ selectedVuln.confidence }}
            </span>
            <span
              class="font-mono text-xs text-gray-400"
            >{{ selectedVuln.vuln_id }}</span
            >
            <span class="flex-1 text-sm font-semibold text-gray-800">{{
              selectedVuln.title
            }}</span>
            <span class="text-xs text-gray-400">{{
              selectedVuln.create_time
            }}</span>
          </div>
          <div class="flex flex-1 flex-col overflow-hidden">
            <div class="flex-1 overflow-y-auto p-5 text-sm">
              <div class="flex items-center gap-1.5 mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                <span>🔍</span><span>漏洞扫描基本信息</span>
              </div>
              <div class="space-y-4">
                <div v-if="selectedVuln.notes">
                  <div class="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    <span>📋</span><span>漏洞详情</span>
                  </div>
                  <div class="rounded-lg bg-gray-50 p-4 text-sm leading-relaxed text-gray-700">
                    {{ selectedVuln.notes }}
                  </div>
                </div>
                <div v-if="selectedVuln.source_endpoint">
                  <div class="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    <span>📍</span><span>源端点</span>
                  </div>
                  <div class="rounded-lg bg-gray-50 p-3 font-mono text-xs text-gray-600">
                    {{ selectedVuln.source_endpoint }}
                  </div>
                </div>
                <div v-if="selectedVuln.vulnerable_code_location">
                  <div class="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    <span>🔗</span><span>漏洞代码位置</span>
                  </div>
                  <div class="rounded-lg bg-gray-50 p-3 font-mono text-xs text-gray-600">
                    {{ selectedVuln.vulnerable_code_location }}
                  </div>
                </div>
                <div v-if="selectedVuln.missing_defense">
                  <div class="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    <span>🛡️</span><span>缺失的防御</span>
                  </div>
                  <div class="rounded-lg bg-orange-50 p-3 text-sm text-orange-800">
                    {{ selectedVuln.missing_defense }}
                  </div>
                </div>
                <div v-if="selectedVuln.exploitation_hypothesis">
                  <div class="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    <span>🔐</span><span>利用假设</span>
                  </div>
                  <div class="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                    {{ selectedVuln.exploitation_hypothesis }}
                  </div>
                </div>
                <div v-if="selectedVuln.suggested_exploit_technique">
                  <div class="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    <span>⚡</span><span>建议利用技术</span>
                  </div>
                  <div class="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                    {{ selectedVuln.suggested_exploit_technique }}
                  </div>
                </div>
              </div>
            </div>

            <template v-if="hasExploitData">
              <div class="h-8 bg-white"></div>
              <div
                class="flex-1 overflow-y-auto px-5 pb-5 pt-1 text-sm"
              >
                <div class="mb-4 flex items-center justify-between">
                  <div class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <span>⚔️</span><span>渗透信息</span>
                  </div>
                  <span v-if="selectedVuln.exploit_status" class="rounded-md px-2 py-0.5 text-xs font-medium" :class="exploitStatusBadgeClass">
                    {{ selectedVuln.exploit_status }}
                  </span>
                </div>
                <div class="space-y-4">
                  <div v-if="selectedVuln.exploit_title">
                    <div class="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      <span>🏷️</span><span>利用标题</span>
                    </div>
                    <div class="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                      {{ selectedVuln.exploit_title }}
                    </div>
                  </div>
                  <div v-if="selectedVuln.exploit_severity">
                    <div class="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      <span>⚠️</span><span>利用严重级别</span>
                    </div>
                    <div class="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                      {{ selectedVuln.exploit_severity }}
                    </div>
                  </div>
                  <div v-if="selectedVuln.exploit_vuln_detail">
                    <div class="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      <span>📋</span><span>利用详情</span>
                    </div>
                    <div class="rounded-lg bg-gray-50 p-4 text-sm leading-relaxed text-gray-700">
                      {{ selectedVuln.exploit_vuln_detail }}
                    </div>
                  </div>
                  <div v-if="selectedVuln.exploit_location">
                    <div class="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      <span>📍</span><span>利用位置</span>
                    </div>
                    <div class="rounded-lg bg-gray-50 p-3 font-mono text-xs text-gray-600">
                      {{ selectedVuln.exploit_location }}
                    </div>
                  </div>
                  <div v-if="selectedVuln.exploit_blockers">
                    <div class="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      <span>🚧</span><span>利用阻碍</span>
                    </div>
                    <div class="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                      {{ selectedVuln.exploit_blockers }}
                    </div>
                  </div>
                  <div v-if="selectedVuln.exploit_impact">
                    <div class="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      <span>💥</span><span>利用影响</span>
                    </div>
                    <div class="rounded-lg bg-orange-50 p-3 text-sm text-orange-800">
                      {{ selectedVuln.exploit_impact }}
                    </div>
                  </div>
                  <div v-if="selectedVuln.exploit_prerequisites">
                    <div class="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      <span>🔐</span><span>利用前提</span>
                    </div>
                    <div class="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                      {{ selectedVuln.exploit_prerequisites }}
                    </div>
                  </div>
                  <div v-if="selectedVuln.exploit_steps">
                    <div class="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      <span>⚡</span><span>利用步骤</span>
                    </div>
                    <div class="rounded-lg bg-gray-50 p-4 text-sm leading-relaxed">
                      <div
                        v-for="(line, idx) in selectedVuln.exploit_steps.split(/(?:\n|;)/)"
                        :key="idx"
                        v-show="line.trim()"
                        class="mb-2 flex items-start gap-2.5 last:mb-0"
                      >
                        <span class="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-medium text-blue-600">
                          {{ idx + 1 }}
                        </span>
                        <span class="pt-0.5 text-gray-700">{{ line.trim() }}</span>
                      </div>
                    </div>
                  </div>
                  <div v-if="selectedVuln.exploit_evidence">
                    <div class="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                      <span>✅</span><span>证据</span>
                    </div>
                    <div class="rounded-lg border border-green-200 bg-green-50 p-3 font-mono text-xs leading-relaxed text-green-700">
                      {{ selectedVuln.exploit_evidence }}
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </template>
        <div
          v-else
          class="flex flex-1 items-center justify-center text-sm text-gray-400"
        >
          <div class="flex flex-col items-center gap-2">
            <span class="text-3xl">👈</span>
            <span>请从左侧选择一个漏洞</span>
          </div>
        </div>
      </div>

      <!-- Right: Thinking Flow -->
      <div
        class="flex w-[320px] flex-shrink-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
      >
        <div
          class="flex items-center gap-2 border-b border-gray-100 px-4 py-3"
        >
          <span>🤖 思考流程</span>
          <span
            class="inline-block h-2 w-2 rounded-full"
            :style="{
              backgroundColor: eventStreamConnected ? '#52c41a' : '#d9d9d9',
            }"
          ></span>
          <span class="text-xs text-gray-400">
            {{ eventStreamConnected ? '已连接' : '未连接' }}
          </span>
        </div>
        <div
          ref="eventStreamContainer"
          class="flex-1 overflow-y-auto p-4"
          style="min-height: 400px; max-height: 100%"
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
                <div class="mb-1.5 flex items-center gap-1.5 text-xs text-blue-400">
                  <span>💭</span><span>推理中</span>
                  <span class="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400"></span>
                </div>
                <div class="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 space-y-2">
                  <template v-for="(text, tIdx) in item.texts" :key="tIdx">
                    <div v-if="text.trim()" class="text-gray-700">{{ text }}</div>
                  </template>
                  <span class="inline-block h-3.5 w-0.5 animate-pulse bg-blue-300 align-text-bottom"></span>
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
                    class="!text-xs !px-1.5 !py-0"
                  >{{ item.toolStatus }}</Tag>
                </div>
                <div v-if="item.toolInput" class="mb-1 rounded bg-gray-100 p-2 text-xs text-gray-600 font-mono">
                  {{ item.toolInput }}
                </div>
                <div v-if="item.toolOutput" class="rounded bg-green-50 p-2 text-xs text-green-700 font-mono whitespace-pre-wrap">
                  {{ item.toolOutput }}
                </div>
              </div>

              <div
                v-if="item.type === 'step'"
                class="flex items-center gap-2 text-xs text-gray-400"
              >
                <span v-if="item.stepType === 'start'" class="text-blue-400">┌─</span>
                <span v-else-if="item.stepType === 'finish'" class="text-green-400">└─</span>
                <span>{{ item.text }}</span>
              </div>

              <div
                v-if="item.type === 'message'"
                class="rounded-lg border border-gray-100 bg-gray-50/50 p-2.5 text-xs text-gray-500"
              >
                {{ item.text }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Page>
</template>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fade-in 0.2s ease-out;
}
</style>
