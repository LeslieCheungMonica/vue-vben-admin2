<script lang="ts" setup>
import { computed, nextTick, onUnmounted, ref, shallowRef, triggerRef, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Modal, Tag } from 'ant-design-vue';

import { baseRequestClient } from '#/api/request';
import ExpandableMsg from './components/expandable-msg.vue';
import { getTaskListApi } from '#/api/core/task';
import type { TaskApi } from '#/api/core/task';
import ThoughtChainFlow from './components/expandable-graph.vue';

interface StageItem {
  stage: string;
  status: string;
  session_id?: string;
  created?: number;
  updated?: number;
}

interface TaskStageResult {
  status: string;
  mertic_status: { running: number; wait: number; finish: number };
  run_status: StageItem[];
  message: string;
}

const stageToAgent: Record<string, { key: string; name: string; icon: string }> = {
  'pre-recon': { key: 'vuln_recon', name: '漏洞侦查智能体', icon: '🔍' },
  recon: { key: 'attack_surface', name: '攻击面测绘智能体', icon: '🎯' },
  'recon-graph': { key: 'attack_graph', name: '攻击图谱智能体', icon: '🗺️' },
  'biz-recon': { key: 'biz_surface', name: '业务面测绘智能体', icon: '🏗️' },
  'biz-vuln': { key: 'biz', name: '业务逻辑漏洞扫描智能体', icon: '⚙️' },
};

const stageOrder = ['pre-recon', 'recon', 'recon-graph', 'biz-recon', 'biz-vuln'];

const route = useRoute();

const loading = ref(true);
const task = ref<TaskApi.TaskItem | null>(null);
const taskStage = ref<TaskStageResult | null>(null);

const agents = computed(() => {
  const list: { key: string; name: string; icon: string; stage: string; status: string; session_id?: string; created?: number; updated?: number }[] = [];
  for (const stage of stageOrder) {
    const info = stageToAgent[stage];
    const stageData = taskStage.value?.run_status?.find(s => s.stage === stage);
    list.push({
      ...info,
      stage,
      status: stageData?.status || 'wait',
      session_id: stageData?.session_id,
      created: stageData?.created,
      updated: stageData?.updated,
    });
  }
  return list;
});

const agentStats = computed(() => {
  const m = taskStage.value?.mertic_status;
  return {
    running: m?.running ?? 0,
    waiting: m?.wait ?? 0,
    error: 0,
    finish: m?.finish ?? 0,
  };
});

const activeStep = ref('pre-recon');

const activeAgent = computed(() => agents.value.find(a => a.stage === activeStep.value));

const flowSteps = [
  { key: 'pre-recon', label: '漏洞侦查', icon: '🔍' },
  { key: 'recon', label: '攻击面测绘', icon: '🎯' },
  { key: 'recon-graph', label: '攻击图谱', icon: '🗺️' },
  { key: 'biz-recon', label: '业务面测绘', icon: '🏗️' },
  { key: 'biz-vuln', label: '业务逻辑漏洞扫描', icon: '⚙️' },
];

function getStepTitle(key: string) {
  return flowSteps.find(s => s.key === key)?.label || key;
}

function getStepIcon(key: string) {
  return flowSteps.find(s => s.key === key)?.icon || '📋';
}

const statusLabelMap: Record<string, string> = {
  running: '运行中',
  wait: '待运行',
  finish: '已完成',
};

const statusColorMap: Record<string, string> = {
  running: 'bg-green-500',
  wait: 'bg-gray-300',
  finish: 'bg-blue-500',
};

const stageNodeMap: Record<string, string> = {
  'pre-recon': 'n2',
  recon: 'n4',
  'recon-graph': 'n6',
  'biz-recon': 'n7',
  'biz-vuln': 'n9',
};

const chainData = computed(() => {
  const stageStatus = taskStage.value?.run_status || [];
  const getNodeStatus = (stage: string) => {
    const s = stageStatus.find(ss => ss.stage === stage);
    if (!s) return 'pending';
    return s.status === 'running' ? 'running' : s.status === 'finish' ? 'completed' : 'pending';
  };
  const bizVulnFinish = stageStatus.find(s => s.stage === 'biz-vuln')?.status === 'finish';
  return {
    nodes: [
      { id: 'n1', label: '接收任务', type: 'input', status: 'completed', x: 0, y: 60 },
      { id: 'n2', label: '漏洞侦查', type: 'process', status: getNodeStatus('pre-recon'), x: 150, y: 60 },
      { id: 'n4', label: '攻击面测绘', type: 'process', status: getNodeStatus('recon'), x: 300, y: 60 },
      { id: 'n6', label: '攻击图谱生成', type: 'process', status: getNodeStatus('recon-graph'), x: 450, y: 60 },
      { id: 'n7', label: '业务面测绘', type: 'process', status: getNodeStatus('biz-recon'), x: 300, y: 120 },
      { id: 'n9', label: '业务逻辑漏扫', type: 'process', status: getNodeStatus('biz-vuln'), x: 600, y: 90 },
      { id: 'n10', label: '业务漏扫报告', type: 'output', status: bizVulnFinish ? 'completed' : 'pending', x: 760, y: 90 },
    ],
    edges: [
      { from: 'n1', to: 'n2' },
      { from: 'n2', to: 'n4' },
      { from: 'n4', to: 'n6' },
      { from: 'n2', to: 'n7' },
      { from: 'n7', to: 'n9' },
      { from: 'n6', to: 'n9' },
      { from: 'n9', to: 'n10' },
    ],
  };
});

let agentStartTime = Date.now();
const elapsedSeconds = ref(0);
let elapsedTimer: ReturnType<typeof setInterval> | null = null;

function startElapsedTimer() {
  stopElapsedTimer();
  elapsedSeconds.value = 0;
  agentStartTime = Date.now();
  elapsedTimer = setInterval(() => {
    elapsedSeconds.value = Math.floor((Date.now() - agentStartTime) / 1000);
  }, 1000);
}

function stopElapsedTimer() {
  if (elapsedTimer) {
    clearInterval(elapsedTimer);
    elapsedTimer = null;
  }
}

const formattedElapsed = computed(() => {
  const h = Math.floor(elapsedSeconds.value / 3600);
  const m = Math.floor((elapsedSeconds.value % 3600) / 60);
  const s = elapsedSeconds.value % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
});

const knowledgeHits = ref<{ time: string; text: string }[]>([]);

function addKnowledgeHit(text: string) {
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  knowledgeHits.value.unshift({ time, text });
  if (knowledgeHits.value.length > 50) {
    knowledgeHits.value = knowledgeHits.value.slice(0, 50);
  }
}

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
      if (!trimmed || /^<\/?thinking>\s*<\/?thinking>?\s*$/.test(trimmed))
        continue;
      if (current) {
        const cleaned = item.text
          .replace(/<\/?thinking>/g, '')
          .replace(/\n{3,}/g, '\n\n');
        current.texts.push(cleaned);
        current.ids.push(item.id);
      } else {
        current = {
          type: 'merged-reasoning',
          texts: [
            item.text.replace(/<\/?thinking>/g, '').replace(/\n{3,}/g, '\n\n'),
          ],
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
function toggleRight() {
  rightCollapsed.value = !rightCollapsed.value;
}

const centerPanelStyle = computed(() => {
  if (rightCollapsed.value) {
    return { flex: '1', maxHeight: 'calc(100vh - 246px)' };
  }
  return { flex: '1', maxHeight: 'calc(100vh - 246px)', minHeight: '100%' };
});

const rightPanelStyle = computed(() => {
  if (rightCollapsed.value) {
    return { width: '0', minWidth: '0', overflow: 'hidden', border: 'none' };
  }
  return {
    width: '360px',
    maxHeight: 'calc(100vh - 247px)',
  };
});

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
      if (tool === 'grep' || tool === 'glob') { part.hidden = true; return; }
      if (tool === 'read' || tool === 'bash') { part.hideContent = true; }
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

  if (type === 'session.updated') {
    const info = props.info || {};
    if (info.title) {
      const part = getOrCreatePart(`session:${info.id}`, info.id, 'message');
      part.text = `📋 ${info.title}`;
      part.updatedAt = Date.now();
      dirtyParts.add(part.id);
    }
    return;
  }
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
  if (el) {
    el.scrollTop = el.scrollHeight;
  }
}

async function fetchTask() {
  const taskId = route.params.taskId as string;
  if (!taskId) return;
  loading.value = true;
  try {
    const [taskRes, stageRes] = await Promise.all([
      getTaskListApi(taskId),
      baseRequestClient.post<TaskStageResult>('/wape/task_stage', { task_id: taskId }),
    ]);
    task.value = taskRes.items?.[0] ?? null;
    taskStage.value = stageRes.data;
  } catch {
    console.error('获取任务详情失败');
  } finally {
    loading.value = false;
  }
}

function connectEventStream(taskId: string) {
  disconnectEventStream();
  displayItems.value = [];
  partsMap.clear();
  dirtyParts.clear();
  eventStreamConnected.value = false;

  flushTimer = setInterval(flushBuffer, FLUSH_INTERVAL);

  const baseUrl = '/api';
  const url = `${baseUrl}/wape/event_stream/${taskId}`;
  eventSource = new EventSource(url);

  eventSource.onopen = () => {
    eventStreamConnected.value = true;
    startElapsedTimer();
  };

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      processEvent(data);
    } catch {
      // ignore parse errors
    }
  };

  eventSource.onerror = () => {
    eventStreamConnected.value = false;
  };
}

function disconnectEventStream() {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
  flushBuffer();
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
  eventStreamConnected.value = false;
}

const toolStatusIcon: Record<string, string> = {
  pending: '⏳',
  running: '🔄',
  completed: '✅',
};

const historyModalVisible = ref(false);
const historyLoading = ref(false);
const historySessions = ref<any[]>([]);
const historyPage = ref(1);
const historyTotal = ref(0);
const historyFilter = ref<string>('all');
const historyLoadingMore = ref(false);
const historySentinel = ref<HTMLElement | null>(null);
let historyObserver: IntersectionObserver | null = null;

const historyHasMore = computed(() => historySessions.value.length < historyTotal.value);

const historyFilterTags = [
  { key: 'all', label: '全部' },
  { key: 'tool', label: '🔧 执行工具' },
  { key: 'text', label: '📖 知识库读取' },
  { key: 'step', label: '⚡ 执行任务' },
];

const filteredHistorySessions = computed(() => {
  if (historyFilter.value === 'all') return historySessions.value;
  return historySessions.value.filter((msg: any) => {
    const type = msg.data?.type;
    if (historyFilter.value === 'step') return type === 'tool' && (msg.data?.tool === 'todowrite' || msg.data?.tool === 'task');
    if (historyFilter.value === 'tool') return type === 'tool' && msg.data?.tool !== 'todowrite' && msg.data?.tool !== 'task';
    return type === historyFilter.value;
  });
});

async function loadHistoryMessages(page = 1) {
  const taskId = route.params.taskId as string;
  if (!taskId) return;
  historyLoading.value = true;
  historyModalVisible.value = true;
  historyPage.value = page;
  try {
    const { data } = await baseRequestClient.post('/wape/task_session_messages', {
      task_id: taskId,
      page,
      page_size: 500,
    });
    if (page === 1) {
      historySessions.value = data.items ?? [];
    } else {
      historySessions.value = [...historySessions.value, ...(data.items ?? [])];
    }
    historyTotal.value = data.total ?? 0;
  } catch {
    if (page === 1) historySessions.value = [];
  } finally {
    historyLoading.value = false;
    historyLoadingMore.value = false;
  }
  if (page === 1) {
    nextTick(() => setupHistoryObserver());
  }
}

async function loadMoreHistory() {
  if (historyLoadingMore.value || !historyHasMore.value) return;
  historyLoadingMore.value = true;
  await loadHistoryMessages(historyPage.value + 1);
}

function setupHistoryObserver() {
  cleanupHistoryObserver();
  historyObserver = new IntersectionObserver(
    (entries) => { if (entries[0]?.isIntersecting) loadMoreHistory(); },
    { rootMargin: '100px' },
  );
  nextTick(() => { if (historySentinel.value) historyObserver?.observe(historySentinel.value); });
}

function cleanupHistoryObserver() {
  if (historyObserver) { historyObserver.disconnect(); historyObserver = null; }
}

function formatTime(ts: number) {
  if (!ts) return '';
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

function getMsgType(msg: any) {
  if (msg.data?.type === 'text') return '💬 文本';
  if (msg.data?.type === 'tool') {
    if (msg.data?.tool === 'todowrite') return '📝 任务列表';
    if (msg.data?.tool === 'task') return '📋 执行任务';
    return `🔧 ${msg.data.tool || '工具调用'}`;
  }
  if (msg.data?.type === 'step-start') return '▶️ 步骤开始';
  if (msg.data?.type === 'step-finish') return '⏹️ 步骤结束';
  return msg.data?.type || msg.role || '消息';
}

function getMsgContent(msg: any) {
  let text = '';
  if (msg.data?.type === 'text') {
    text = msg.data.text || '';
  } else if (msg.data?.type === 'tool') {
    text = msg.data.state?.input ? JSON.stringify(msg.data.state.input, null, 2) : '';
  } else if (msg.data?.type === 'step-finish') {
    text = msg.data.reason || '';
  } else if (msg.data?.type === 'tool' && (msg.data?.tool === 'todowrite' || msg.data?.tool === 'task')) {
    text = msg.data.state?.input ? JSON.stringify(msg.data.state.input, null, 2) : '';
  }
  if (/角色：你是一位/.test(text) || /\(可读写\) - 截图、脚本、临时工作等/.test(text) || /文件系统：\n- \. \(只读\)/.test(text) || /侦察报告 → 架构图/.test(text) || /提示词快照：业务域侦察/.test(text) || /提示词快照：认证漏洞分析/.test(text)) return '';
  text = text.replace(/<\/?conclusion_trigger>[\s\S]*?$/i, '');
  text = text.replace(/<\/?critical>[\s\S]*?<\/critical>/gi, '');
  text = text.replace(/<\/?system_architecture>[\s\S]*?<\/system_architecture>/gi, '');
  text = text.replace(/<\/?attacker_perspective>[\s\S]*?<\/attacker_perspective>/gi, '');
  text = text.replace(/<\/?starting_context>[\s\S]*?<\/starting_context>/gi, '');
  text = text.replace(/<\/?cli_tools>[\s\S]*?<\/cli_tools>/gi, '');
  text = text.replace(/<\/?task_agent_strategy>[\s\S]*?<\/task_agent_strategy>/gi, '');
  text = text.replace(/<\/?conclusion_trigger>/gi, '');
  return text.slice(0, 2000) || '(空)';
}

watch(
  () => route.params.taskId,
  (taskId) => {
    if (taskId) {
      fetchTask();
      connectEventStream(taskId as string);
    }
  },
  { immediate: true },
);

onUnmounted(() => {
  disconnectEventStream();
  cleanupHistoryObserver();
  stopElapsedTimer();
});
</script>

<template>
  <div>
    <Page
      v-if="task"
      description="任务运行状态"
      :title="task.task_name"
      class="h-full"
    >
      <div
        ref="splitContainer"
        class="flex gap-2 select-none"
        style="min-height: 500px; height: 100%"
      >
        <!-- Left: Agent List -->
        <div class="flex w-[239px] flex-shrink-0 flex-col overflow-hidden rounded border border-gray-200 bg-white p-3">
          <div class="mb-2 text-sm font-semibold text-gray-700">智能体列表</div>
          <div class="mb-3 flex gap-2 text-xs">
            <span class="rounded bg-blue-100 px-2 py-0.5 text-blue-700">运行中 {{ agentStats.running }}</span>
            <span class="rounded bg-gray-100 px-2 py-0.5 text-gray-600">待运行 {{ agentStats.waiting }}</span>
            <span class="rounded bg-green-100 px-2 py-0.5 text-green-700">已完成 {{ agentStats.finish }}</span>
          </div>
          <div class="flex flex-col gap-1.5 flex-1 overflow-y-auto">
            <div
              v-for="agent in agents"
              :key="agent.stage"
              class="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors"
              :class="activeStep === agent.stage ? 'border-blue-300 bg-blue-50' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'"
              @click="activeStep = agent.stage"
            >
              <span class="text-base">{{ agent.icon }}</span>
              <div class="flex flex-1 flex-col min-w-0">
                <span class="truncate font-medium text-gray-700">{{ agent.name }}</span>
                <span class="text-[10px]" :class="statusLabelMap[agent.status] ? 'text-gray-400' : 'text-gray-400'">{{ statusLabelMap[agent.status] || agent.status }}</span>
              </div>
              <span class="inline-block h-2 w-2 rounded-full" :class="statusColorMap[agent.status] || 'bg-gray-300'" />
            </div>
          </div>
        </div>

        <!-- Center: Three-layer layout -->
        <div
          class="flex flex-col overflow-hidden rounded border p-4"
          :style="centerPanelStyle"
        >
          <div style="width: 100%" class="flex h-full flex-col gap-3">
            <!-- Top: Agent Detail -->
            <div class="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3">
              <span class="text-2xl">{{ getStepIcon(activeStep) }}</span>
              <div class="flex flex-1 flex-col">
                <span class="text-sm font-semibold text-gray-700">{{ getStepTitle(activeStep) }}</span>
                <div class="flex items-center gap-3 text-xs text-gray-500">
                  <span class="flex items-center gap-1">
                    <span class="inline-block h-1.5 w-1.5 rounded-full" :class="statusColorMap[activeAgent?.status || 'wait']" />
                    {{ statusLabelMap[activeAgent?.status || 'wait'] || activeAgent?.status }}
                  </span>
                  <span>运行时长 30分钟</span>
                  <span class="font-mono text-blue-600 font-medium">{{ formattedElapsed }}</span>
                </div>
              </div>
            </div>

            <!-- Middle: Agent Execution Flow Graph -->
            <div class="flex flex-1 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-400 overflow-hidden">
              <ThoughtChainFlow
                :chain-data="chainData"
                title="智能体协同作业"
                theme-color="#00e0ff"
                :bg-color="'linear-gradient(135deg, rgba(10,15,30,0.9), rgba(5,10,20,0.9))'"
              />
            </div>

            <!-- Bottom: Real-time Knowledge Retrieval -->
            <div class="flex h-40 flex-col rounded-lg border border-gray-200 bg-white">
              <div class="border-b border-gray-100 px-3 py-2 text-xs font-medium text-gray-500">实时知识检索</div>
              <div class="flex-1 overflow-y-auto px-3 py-1">
                <div v-if="knowledgeHits.length === 0" class="flex h-full items-center justify-center text-xs text-gray-400">暂无检索记录</div>
                <div v-for="(hit, idx) in knowledgeHits" :key="idx" class="flex gap-2 py-1 text-xs border-b border-gray-50 last:border-0">
                  <span class="shrink-0 font-mono text-gray-400">{{ hit.time }}</span>
                  <span class="text-gray-600">{{ hit.text }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="relative flex flex-col" :style="{ width: '0' }">
          <div
            class="absolute -left-3 top-8 z-20 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white text-xs text-gray-400 shadow-sm transition-all hover:border-blue-300 hover:text-blue-500 hover:shadow-md"
            :title="rightCollapsed ? '展开推理过程' : '收起推理过程'"
            @click="toggleRight"
          >
            <span class="select-none leading-none text-[10px]">{{ rightCollapsed ? '◀' : '▶' }}</span>
          </div>
        </div>

        <div
          class="flex flex-col rounded border transition-all duration-300 overflow-hidden"
          :style="rightPanelStyle"
        >
          <div class="flex items-center gap-2 border-b bg-gray-50 px-4 py-3 text-sm font-medium">
            <span class="text-xs">🤖 推理过程</span>
            <span class="inline-block h-2 w-2 rounded-full" :style="{ backgroundColor: eventStreamConnected ? '#52c41a' : '#d9d9d9' }"></span>
            <span class="text-xs text-gray-400">{{ eventStreamConnected ? '已连接' : '未连接' }}</span>
            <div class="ml-auto">
              <button class="rounded px-2 py-0.5 text-xs text-blue-600 hover:bg-blue-200/50 transition-colors" @click="loadHistoryMessages(1)">查看历史</button>
            </div>
          </div>
          <div ref="eventStreamContainer" class="flex-1 overflow-y-auto p-4" style="min-height: 400px; max-height: 100%">
            <template v-if="mergedDisplayItems.length === 0">
              <div class="pt-16 text-center text-gray-400">
                <div class="mb-2 text-3xl">⚡</div>
                <div class="text-xs">{{ eventStreamConnected ? '等待 AI 思考...' : '暂无连接' }}</div>
              </div>
            </template>
            <div class="space-y-3">
              <div v-for="item in mergedDisplayItems" :key="item.type === 'merged-reasoning' ? item.ids[0] : item.id" class="animate-fade-in">
                <div v-if="item.type === 'merged-reasoning'" class="rounded-lg border border-blue-100 bg-blue-50/60 p-3">
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
                <div v-if="item.type === 'tool'" class="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                  <div class="mb-1.5 flex items-center gap-2">
                    <span class="text-base">{{ toolStatusIcon[item.toolStatus || ''] || '🔧' }}</span>
                    <span class="text-xs font-medium text-gray-500">{{ item.toolName || '工具调用' }}</span>
                    <Tag v-if="item.toolStatus" :color="item.toolStatus === 'completed' ? 'success' : item.toolStatus === 'running' ? 'processing' : 'default'" class="!text-xs !px-1.5 !py-0">{{ item.toolStatus }}</Tag>
                  </div>
                  <div v-if="item.toolInput && !item.hideContent" class="mb-1 rounded bg-gray-100 p-2 text-xs text-gray-600 font-mono">{{ item.toolInput }}</div>
                  <div v-if="item.toolInput && item.hideContent" class="mb-1 truncate rounded bg-gray-50 p-2 text-xs text-gray-400 font-mono" :title="item.toolInput">{{ item.toolInput.slice(0, 80) }}...</div>
                  <div v-if="item.toolOutput && !item.hideContent" class="rounded bg-green-50 p-2 text-xs text-green-700 font-mono whitespace-pre-wrap">{{ item.toolOutput }}</div>
                  <div v-if="item.toolOutput && item.hideContent" class="truncate rounded bg-gray-50 p-2 text-xs text-gray-400 font-mono" :title="item.toolOutput">{{ item.toolOutput.slice(0, 80) }}...</div>
                </div>
                <div v-if="item.type === 'step'" class="flex items-center gap-2 text-xs text-gray-400">
                  <span v-if="item.stepType === 'start'" class="text-blue-400">┌─</span>
                  <span v-else-if="item.stepType === 'finish'" class="text-green-400">└─</span>
                  <span>{{ item.text }}</span>
                </div>
                <div v-if="item.type === 'message'" class="rounded-lg border border-gray-100 bg-gray-50/50 p-2.5 text-xs text-gray-500">{{ item.text }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Page>
    <Page v-else-if="!loading" description="未找到任务" title="运行状态">
      <div class="pt-20 text-center text-gray-400">未找到对应任务信息</div>
    </Page>

    <Modal :open="historyModalVisible" title="历史会话消息" width="70%" :footer="null" @cancel="historyModalVisible = false; cleanupHistoryObserver()">
      <div v-if="historyLoading" class="flex items-center justify-center py-16 text-sm text-gray-400">加载中...</div>
      <div v-else-if="historySessions.length === 0" class="flex items-center justify-center py-16 text-sm text-gray-400">暂无历史消息</div>
      <div v-else>
        <div class="mb-3 flex flex-wrap gap-2">
          <button v-for="tag in historyFilterTags" :key="tag.key" class="rounded-full px-3 py-1 text-xs font-medium transition-colors" :class="historyFilter === tag.key ? 'bg-blue-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'" @click="historyFilter = tag.key">{{ tag.label }}</button>
        </div>
        <div class="space-y-3">
          <div v-for="(msg, idx) in filteredHistorySessions" :key="idx" class="rounded border border-gray-200 bg-white">
            <div class="flex items-center justify-between border-b border-gray-100 px-3 py-2 text-xs text-gray-500">
              <span class="font-medium text-gray-700">{{ getMsgType(msg) }}</span>
              <span>{{ formatTime(msg.time_created) }}</span>
            </div>
            <div class="px-3 py-2"><ExpandableMsg :content="getMsgContent(msg)" /></div>
          </div>
          <div ref="historySentinel" class="h-4" />
          <div v-if="historyLoadingMore" class="py-4 text-center text-xs text-gray-400">加载更多...</div>
        </div>
      </div>
    </Modal>
  </div>
</template>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in { animation: fade-in 0.2s ease-out; }
</style>
