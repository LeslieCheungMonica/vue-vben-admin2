<script lang="ts" setup>
import { computed, onUnmounted, ref, shallowRef, triggerRef, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Descriptions, Modal, Tag } from 'ant-design-vue';

import {
  getTaskListApi,
  getAuthVulnListApi,
  getBizDataApi,
  getBizVulnListApi,
  getBizVulnExploitListApi,
} from '#/api/core/task';
import type { TaskApi } from '#/api/core/task';
import type { AuthVulnItem } from '#/api/core/task';
import type { BizVulnExploitItem } from '#/api/core/task';

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

const loading = ref(true);
const task = ref<TaskApi.TaskItem | null>(null);

const FLUSH_INTERVAL = 150;

const displayItems = shallowRef<PartState[]>([]);

const mergedDisplayItems = computed(() => {
  const result: (
    | { type: 'merged-reasoning'; texts: string[]; ids: string[] }
    | PartState
  )[] = [];
  let current:
    | { type: 'merged-reasoning'; texts: string[]; ids: string[] }
    | null = null;

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

const leftWidth = ref(75);
const rightCollapsed = ref(false);
function toggleRight() {
  rightCollapsed.value = !rightCollapsed.value;
}

const leftPanelStyle = computed(() => {
  if (rightCollapsed.value) {
    return { width: '100%', maxHeight: '600px' };
  }
  return { width: `${leftWidth.value}%`, maxHeight: '600px' };
});

const rightPanelStyle = computed(() => {
  if (rightCollapsed.value) {
    return { width: '0', minWidth: '0', overflow: 'hidden', border: 'none' };
  }
  return { width: `calc(${100 - leftWidth.value}%)` };
});

const activeStep = ref('vuln_recon');
const collapsedSteps = ref(new Set<string>());

function toggleCollapse(key: string) {
  if (collapsedSteps.value.has(key)) {
    collapsedSteps.value.delete(key);
  } else {
    collapsedSteps.value.add(key);
  }
  // trigger reactivity
  collapsedSteps.value = new Set(collapsedSteps.value);
}

function isCollapsed(key: string) {
  return collapsedSteps.value.has(key);
}

const flowSteps = [
  { key: 'vuln_recon', label: '漏洞侦查', icon: '🔍' },
  {
    key: 'attack_surface',
    label: '攻击面测绘',
    icon: '🎯',
    children: [{ key: 'attack_graph', label: '攻击图谱', icon: '🗺️' }],
  },
  { key: 'biz_surface', label: '业务面测绘', icon: '🏗️' },
  {
    key: 'auth',
    label: '认证漏洞扫描',
    icon: '🔐',
    children: [
      { key: 'auth_vuln_list', label: '认证漏洞列表', icon: '📋' },
      { key: 'auth_exploit', label: '漏洞攻击利用', icon: '⚡' },
    ],
  },
  {
    key: 'zuthz',
    label: '授权漏洞扫描',
    icon: '🛡️',
    children: [{ key: 'zuthz_exploit', label: '漏洞攻击利用', icon: '⚡' }],
  },
  {
    key: 'inject',
    label: '注入漏洞扫描',
    icon: '💉',
    children: [{ key: 'inject_exploit', label: '漏洞攻击利用', icon: '⚡' }],
  },
  {
    key: 'ssrf',
    label: 'SSRF漏洞扫描',
    icon: '🌐',
    children: [{ key: 'ssrf_exploit', label: '漏洞攻击利用', icon: '⚡' }],
  },
  {
    key: 'xxs',
    label: 'XSS漏洞扫描',
    icon: '📝',
    children: [{ key: 'xxs_exploit', label: '漏洞攻击利用', icon: '⚡' }],
  },
  {
    key: 'biz',
    label: '业务逻辑漏洞扫描',
    icon: '⚙️',
    children: [
      { key: 'biz_vuln_list', label: '业务漏洞列表', icon: '📋' },
      { key: 'biz_exploit', label: '漏洞攻击利用', icon: '⚡' },
    ],
  },
];

function getStepTitle(key: string) {
  for (const s of flowSteps) {
    if (s.key === key) return s.label;
    const child = s.children?.find((c) => c.key === key);
    if (child) return child.label;
  }
  return '基本信息';
}

function getStepIcon(key: string) {
  for (const s of flowSteps) {
    if (s.key === key) return s.icon;
    const child = s.children?.find((c) => c.key === key);
    if (child) return child.icon;
  }
  return '📋';
}

function getStepDesc(key: string) {
  const map: Record<string, string> = {
    vuln_recon: '分析源码，提取安全架构与技术栈信息，发现潜在漏洞入口',
    attack_surface: '关联外部扫描结果与代码，测绘攻击面范围',
    attack_graph: '生成攻击图谱，可视化攻击路径与关联关系',
    biz_surface: '查看业务面测绘数据',
    auth: '检测认证相关漏洞',
    auth_vuln_list: '查看认证漏洞列表',
    auth_exploit: '对认证漏洞进行可利用性验证',
    zuthz: '检测授权相关漏洞',
    zuthz_exploit: '对授权漏洞进行可利用性验证',
    inject: '检测注入类漏洞',
    inject_exploit: '对注入漏洞进行可利用性验证',
    ssrf: '检测SSRF漏洞',
    ssrf_exploit: '对SSRF漏洞进行可利用性验证',
    xxs: '检测XSS漏洞',
    xxs_exploit: '对XSS漏洞进行可利用性验证',
    biz: '检测业务逻辑漏洞',
    biz_vuln_list: '查看业务漏洞列表',
    biz_exploit: '对业务逻辑漏洞进行可利用性验证',
  };
  return map[key] || '';
}

const statusColorMap: Record<string, string> = {
  'wait-to-start': 'default',
  running: 'processing',
  stopped: 'warning',
  'run-except': 'error',
};

const statusLabelMap: Record<string, string> = {
  'wait-to-start': '等待启动',
  running: '运行中',
  stopped: '已停止',
  'run-except': '执行异常',
};

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
      if (tool === 'grep' || tool === 'glob') {
        part.hidden = true;
        return;
      }
      if (tool === 'read' || tool === 'bash') {
        part.hideContent = true;
      }
      part.type = 'tool';
      part.toolName = tool;
      part.toolCallId = partData.callID;
      const state = partData.state || {};
      if (state.status) part.toolStatus = state.status;
      if (state.input) {
        part.toolInput =
          typeof state.input === 'string'
            ? state.input
            : JSON.stringify(state.input, null, 2);
      }
      if (state.output) {
        part.toolOutput =
          typeof state.output === 'string'
            ? state.output
            : JSON.stringify(state.output, null, 2);
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

  if (type === 'session.status') {
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
    const res = await getTaskListApi(taskId);
    task.value = res.items?.[0] ?? null;
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

const toolStatusColor: Record<string, string> = {
  pending: 'text-yellow-500',
  running: 'text-blue-500',
  completed: 'text-green-500',
};

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

const pdfUrl = ref<string | null>(null);
const pdfLoading = ref(false);

function getReportPdfUrl(taskId: string, stage: string) {
  return `/api/wape/report_pdf/${taskId}/${stage}?time=${new Date().getTime()}`;
}

async function loadPdf(stage: string) {
  const taskId = route.params.taskId as string;
  if (!taskId) return;
  pdfUrl.value = null;
  pdfLoading.value = true;
  try {
    const url = getReportPdfUrl(taskId, stage);
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('PDF not found');
    const blob = await resp.blob();
    pdfUrl.value = URL.createObjectURL(blob);
  } catch {
    pdfUrl.value = null;
  } finally {
    pdfLoading.value = false;
  }
}

watch(activeStep, (step) => {
  const pdfStages: Record<string, string> = {
    vuln_recon: 'pre_recon',
    attack_surface: 'recon',
    attack_graph: 'recon_graph',
    auth: 'auth_vuln',
    auth_exploit: 'auth_vuln_exploit',
  };
  const stage = pdfStages[step];
  if (stage) {
    loadPdf(stage);
  } else {
    if (pdfUrl.value) {
      URL.revokeObjectURL(pdfUrl.value);
      pdfUrl.value = null;
    }
  }
});

const authVulnList = ref<AuthVulnItem[]>([]);
const authVulnLoading = ref(false);

async function loadAuthVulnList() {
  const taskId = route.params.taskId as string;
  if (!taskId) return;
  authVulnLoading.value = true;
  try {
    const res = await getAuthVulnListApi(taskId);
    authVulnList.value = res.items || [];
  } catch {
    authVulnList.value = [];
  } finally {
    authVulnLoading.value = false;
  }
}

watch(activeStep, (step) => {
  if (step === 'auth_vuln_list') {
    loadAuthVulnList();
  }
});

const bizVulnExploitList = ref<BizVulnExploitItem[]>([]);
const bizVulnExploitLoading = ref(false);
const selectedBizName = ref<string | null>(null);
const showBizModuleList = ref(true);

async function loadBizVulnExploitList(bizName: string) {
  const taskId = route.params.taskId as string;
  if (!taskId) return;
  bizVulnExploitLoading.value = true;
  selectedBizName.value = bizName;
  showBizModuleList.value = false;
  try {
    const res = await getBizVulnExploitListApi(taskId, bizName);
    bizVulnExploitList.value = res.items || [];
  } catch {
    bizVulnExploitList.value = [];
  } finally {
    bizVulnExploitLoading.value = false;
  }
}

function backToBizModuleList() {
  showBizModuleList.value = true;
  selectedBizName.value = null;
  bizVulnExploitList.value = [];
}

const bizExploitPdfUrl = ref<string | null>(null);
const bizExploitPdfLoading = ref(false);
const selectedBizExploitName = ref<string | null>(null);
const showBizExploitModuleList = ref(true);

async function loadBizExploitPdf(bizName: string) {
  const taskId = route.params.taskId as string;
  if (!taskId) return;
  bizExploitPdfLoading.value = true;
  selectedBizExploitName.value = bizName;
  showBizExploitModuleList.value = false;
  bizExploitPdfUrl.value = null;
  try {
    const url = `/api/wape/biz_exploit_report_pdf/${taskId}/${encodeURIComponent(bizName)}?time=${new Date().getTime()}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('PDF not found');
    const blob = await resp.blob();
    bizExploitPdfUrl.value = URL.createObjectURL(blob);
  } catch {
    bizExploitPdfUrl.value = null;
  } finally {
    bizExploitPdfLoading.value = false;
  }
}

function backBizExploitToModuleList() {
  showBizExploitModuleList.value = true;
  selectedBizExploitName.value = null;
  if (bizExploitPdfUrl.value) {
    URL.revokeObjectURL(bizExploitPdfUrl.value);
    bizExploitPdfUrl.value = null;
  }
}

const bizData = ref<any[]>([]);
const bizDataLoading = ref(false);
const bizCollapsed = ref(new Set<string>());

function toggleBizCollapse(key: string) {
  const s = new Set(bizCollapsed.value);
  if (s.has(key)) {
    s.delete(key);
  } else {
    s.add(key);
  }
  bizCollapsed.value = s;
}

async function loadBizData() {
  const taskId = route.params.taskId as string;
  if (!taskId) return;
  bizDataLoading.value = true;
  try {
    const res = await getBizDataApi(taskId);
    bizData.value = res.data || [];
  } catch {
    bizData.value = [];
  } finally {
    bizDataLoading.value = false;
  }
}

const bizVulnResSet = ref(new Set<string>());

async function loadBizVulnList() {
  const taskId = route.params.taskId as string;
  if (!taskId) return;
  try {
    const res = await getBizVulnListApi(taskId);
    const items = res.items || [];
    bizVulnResSet.value = new Set(items.map((i) => i.res).filter(Boolean));
  } catch {
    bizVulnResSet.value = new Set();
  }
}

watch(activeStep, (step) => {
  if (
    step === 'biz_surface' ||
    step === 'biz' ||
    step === 'biz_vuln_list' ||
    step === 'biz_exploit'
  ) {
    loadBizData();
  }
  if (step === 'biz') {
    loadBizVulnList();
  }
  if (step === 'biz_vuln_list') {
    loadBizVulnList();
    showBizModuleList.value = true;
    selectedBizName.value = null;
    bizVulnExploitList.value = [];
  }
  if (step === 'biz_exploit') {
    backBizExploitToModuleList();
  }
});

const reportModalVisible = ref(false);
const reportModalPdfUrl = ref<string | null>(null);
const reportModalLoading = ref(false);

async function openReportPdf(bizName: string) {
  const taskId = route.params.taskId as string;
  if (!taskId) return;
  reportModalLoading.value = true;
  reportModalVisible.value = true;
  reportModalPdfUrl.value = null;
  try {
    const url = `/api/wape/biz_report_pdf/${taskId}/${encodeURIComponent(bizName)}?time=${new Date().getTime()}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('PDF not found');
    const blob = await resp.blob();
    reportModalPdfUrl.value = URL.createObjectURL(blob);
  } catch {
    reportModalPdfUrl.value = null;
  } finally {
    reportModalLoading.value = false;
  }
}

function closeReportPdf() {
  reportModalVisible.value = false;
  if (reportModalPdfUrl.value) {
    URL.revokeObjectURL(reportModalPdfUrl.value);
    reportModalPdfUrl.value = null;
  }
}

onUnmounted(() => {
  disconnectEventStream();
  if (pdfUrl.value) {
    URL.revokeObjectURL(pdfUrl.value);
  }
  if (reportModalPdfUrl.value) {
    URL.revokeObjectURL(reportModalPdfUrl.value);
  }
});
</script>

<template>
  <Page
    v-if="task"
    description="任务详情与实时思考流程"
    :title="task.task_name"
  >
    <div
      ref="splitContainer"
      class="flex gap-0 select-none"
      style="min-height: 500px"
    >
      <div
        class="flex flex-col overflow-hidden rounded border p-4"
        :style="leftPanelStyle"
      >
        <div class="flex flex-1 gap-3 overflow-hidden">
          <div class="relative flex flex-shrink-0 flex-col pt-1">
            <div
              class="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400"
            >
              流程
            </div>
            <div class="relative">
              <div
                class="absolute left-[9px] top-2 h-[calc(100%-12px)] w-0.5 bg-gray-200"
              ></div>
              <template v-for="(step, idx) in flowSteps" :key="step.key">
                <div
                  class="relative flex cursor-pointer items-start py-1.5"
                  @click="activeStep = step.key"
                >
                  <div
                    class="relative z-10 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[9px] transition-all duration-200"
                    :class="
                      activeStep === step.key
                        ? 'scale-110 bg-blue-500 text-white shadow-md'
                        : 'bg-white text-gray-400 ring-1 ring-gray-300 hover:bg-blue-50 hover:text-blue-500 hover:ring-blue-300'
                    "
                  >
                    {{ step.icon }}
                  </div>
                  <div
                    class="ml-2 flex items-center gap-1 self-center text-xs font-medium leading-none transition-colors duration-200"
                    :class="
                      activeStep === step.key
                        ? 'text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    "
                  >
                    <span>{{ step.label }}</span>
                    <span
                      v-if="step.children?.length"
                      class="cursor-pointer text-[10px] text-gray-400 hover:text-gray-600 transition-transform duration-200"
                      :class="{ 'rotate-90': !isCollapsed(step.key) }"
                      @click.stop="toggleCollapse(step.key)"
                    >
                      ▸
                    </span>
                  </div>
                </div>
                <template
                  v-if="step.children?.length && !isCollapsed(step.key)"
                >
                  <div
                    v-for="child in step.children"
                    :key="child.key"
                    class="relative flex cursor-pointer items-start py-1.5 pl-6"
                    @click="activeStep = child.key"
                  >
                    <div
                      class="relative z-10 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-[7px] transition-all duration-200"
                      :class="
                        activeStep === child.key
                          ? 'scale-110 bg-blue-400 text-white shadow-md'
                          : 'bg-white text-gray-400 ring-1 ring-gray-300 hover:bg-blue-50 hover:text-blue-500 hover:ring-blue-300'
                      "
                    >
                      {{ child.icon }}
                    </div>
                    <div
                      class="ml-2 self-center text-[11px] leading-none transition-colors duration-200"
                      :class="
                        activeStep === child.key
                          ? 'font-medium text-blue-500'
                          : 'font-normal text-gray-400 hover:text-gray-600'
                      "
                    >
                      {{ child.label }}
                    </div>
                  </div>
                </template>
              </template>
            </div>
          </div>

          <div
            style="width: 100%"
            v-if="
              activeStep === 'vuln_recon' ||
              activeStep === 'attack_surface' ||
              activeStep === 'attack_graph' ||
              activeStep === 'auth' ||
              activeStep === 'auth_exploit'
            "
            class="flex h-full flex-col"
          >
            <div
              v-if="pdfLoading"
              class="flex flex-1 items-center justify-center text-gray-400 text-sm"
            >
              加载报告中...
            </div>
            <iframe
              v-else-if="pdfUrl"
              :src="pdfUrl"
              class="h-full w-full rounded border-0"
              style="min-height: 500px"
            ></iframe>
            <div
              v-else
              class="flex flex-1 items-center justify-center rounded border border-gray-200 bg-gray-50 text-sm text-gray-400"
            >
              <div class="text-center">
                <div class="mb-1 text-lg">{{ getStepIcon(activeStep) }}</div>
                <div class="font-medium text-gray-600">
                  {{ getStepTitle(activeStep) }}
                </div>
                <div class="mt-1 text-xs text-gray-400">
                  {{ getStepDesc(activeStep) }}
                </div>
              </div>
            </div>
          </div>

          <div
            v-else-if="activeStep === 'biz_surface' || activeStep === 'biz'"
            class="flex h-full w-full flex-1 flex-col overflow-y-auto p-4"
          >
            <div
              v-if="bizDataLoading"
              class="flex flex-1 items-center justify-center text-gray-400 text-sm"
            >
              加载业务数据中...
            </div>
            <div
              v-else-if="bizData.length === 0"
              class="flex flex-1 items-center justify-center text-gray-400 text-sm"
            >
              暂无业务数据
            </div>
            <div v-else class="space-y-4">
              <template v-for="(group, gIdx) in bizData" :key="gIdx">
                <div
                  v-for="(modules, category) in group"
                  :key="category"
                  class="rounded border border-gray-200 bg-white shadow-sm"
                >
                  <div
                    class="flex cursor-pointer items-center justify-between px-4 py-3 select-none"
                    @click="toggleBizCollapse(gIdx + '-' + category)"
                  >
                    <div class="text-sm font-medium text-gray-700 capitalize">
                      {{ String(category).replace(/_/g, ' ') }}
                      <span class="ml-2 text-xs font-normal text-gray-400"
                        >({{ modules.length }})</span
                      >
                    </div>
                    <span
                      class="text-xs text-gray-400 transition-transform duration-200"
                      :class="{
                        'rotate-90': !bizCollapsed.has(gIdx + '-' + category),
                      }"
                    >
                      ▸
                    </span>
                  </div>
                  <div
                    v-if="!bizCollapsed.has(gIdx + '-' + category)"
                    class="space-y-2 border-t border-gray-100 px-4 py-3"
                  >
                    <div
                      v-for="(item, idx) in modules"
                      :key="idx"
                      class="cursor-pointer rounded p-2 text-xs transition-colors hover:text-blue-600"
                      :class="
                        bizVulnResSet.has(item.module_name)
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-50 text-gray-600 hover:bg-blue-50'
                      "
                      @click="openReportPdf(item.module_name)"
                    >
                      <div class="font-medium">{{ item.module_name }}</div>
                      <div
                        v-if="item.module_path"
                        class="mt-1 font-mono text-gray-400"
                      >
                        {{ item.module_path }}
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <div
            v-else-if="activeStep === 'auth_vuln_list'"
            class="flex h-full w-full flex-1 flex-col overflow-y-auto"
          >
            <div
              v-if="authVulnLoading"
              class="flex flex-1 items-center justify-center text-gray-400 text-sm"
            >
              加载漏洞列表中...
            </div>
            <div
              v-else-if="authVulnList.length === 0"
              class="flex flex-1 items-center justify-center text-gray-400 text-sm"
            >
              暂无认证漏洞
            </div>
            <div v-else class="space-y-3 p-2">
              <div
                v-for="vuln in authVulnList"
                :key="vuln.id"
                class="rounded border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div class="mb-2 flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-sm font-medium text-gray-700">{{
                      vuln.vuln_id
                    }}</span>
                    <Tag
                      :color="
                        vuln.severity === 'critical'
                          ? 'error'
                          : vuln.severity === 'high'
                            ? 'warning'
                            : vuln.severity === 'medium'
                              ? 'orange'
                              : 'green'
                      "
                    >
                      {{ vuln.severity }}
                    </Tag>
                    <Tag
                      :color="
                        vuln.status === 'confirmed' ? 'success' : 'default'
                      "
                    >
                      {{ vuln.status }}
                    </Tag>
                  </div>
                  <span class="text-xs text-gray-400">{{
                    vuln.create_time
                  }}</span>
                </div>
                <div class="mb-2 text-sm font-medium text-gray-800">
                  {{ vuln.title }}
                </div>
                <div class="mb-2 text-xs text-gray-500">
                  <span class="font-medium">漏洞类型:</span>
                  {{ vuln.vuln_type }}
                </div>
                <div v-if="vuln.location" class="mb-2 text-xs text-gray-500">
                  <span class="font-medium">位置:</span> {{ vuln.location }}
                </div>
                <div
                  v-if="vuln.vuln_detail"
                  class="mb-2 rounded bg-gray-50 p-2 text-xs text-gray-600"
                >
                  <span class="font-medium">详情:</span> {{ vuln.vuln_detail }}
                </div>
                <div v-if="vuln.impact" class="mb-2 text-xs text-gray-500">
                  <span class="font-medium">影响:</span> {{ vuln.impact }}
                </div>
                <div
                  v-if="vuln.prerequisites"
                  class="mb-2 text-xs text-gray-500"
                >
                  <span class="font-medium">前置条件:</span>
                  {{ vuln.prerequisites }}
                </div>
                <div v-if="vuln.exploit_steps" class="mb-2">
                  <div class="mb-1 text-xs font-medium text-gray-500">
                    利用步骤:
                  </div>
                  <div
                    class="rounded bg-gray-50 p-2 text-xs text-gray-600 space-y-1"
                  >
                    <template
                      v-for="(line, idx) in vuln.exploit_steps.split(
                        /(?:\n|;)/,
                      )"
                      :key="idx"
                    >
                      <div v-if="line.trim()" class="flex items-start gap-2">
                        <div
                          v-if="/^\d/.test(line.trim())"
                          class="flex items-start gap-2"
                        >
                          <span
                            class="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] text-blue-600"
                          >
                            {{ line.trim().charAt(0) }}
                          </span>
                          <span class="break-words">{{
                            line.trim().replace(/^\d+[.):]?\s*/, '')
                          }}</span>
                        </div>
                        <div v-else class="ml-6 break-words">
                          {{ line.trim() }}
                        </div>
                      </div>
                    </template>
                  </div>
                </div>
                <div
                  v-if="vuln.evidence"
                  class="rounded bg-green-50 p-2 text-xs text-green-700"
                >
                  <span class="font-medium">证据:</span> {{ vuln.evidence }}
                </div>
              </div>
            </div>
          </div>

          <div
            v-else-if="activeStep === 'biz_vuln_list'"
            class="flex h-full w-full flex-1 flex-col overflow-y-auto"
          >
            <div v-if="showBizModuleList" class="p-4">
              <div class="mb-3 text-sm font-medium text-gray-700">
                选择业务模块查看漏洞
              </div>
              <div v-if="bizDataLoading" class="flex items-center justify-center py-8 text-sm text-gray-400">
                加载业务数据中...
              </div>
              <div v-else-if="bizData.length === 0" class="flex items-center justify-center py-8 text-sm text-gray-400">
                暂无业务数据
              </div>
              <div v-else class="space-y-4">
                <template v-for="(group, gIdx) in bizData" :key="gIdx">
                  <div
                    v-for="(modules, category) in group"
                    :key="category"
                    class="rounded border border-gray-200 bg-white shadow-sm"
                  >
                    <div
                      class="flex cursor-pointer items-center justify-between px-4 py-3 select-none"
                      @click="toggleBizCollapse(gIdx + '-' + category)"
                    >
                      <div class="text-sm font-medium text-gray-700 capitalize">
                        {{ String(category).replace(/_/g, ' ') }}
                        <span class="ml-2 text-xs font-normal text-gray-400"
                          >({{ modules.length }})</span
                        >
                      </div>
                      <span
                        class="text-xs text-gray-400 transition-transform duration-200"
                        :class="{
                          'rotate-90': !bizCollapsed.has(gIdx + '-' + category),
                        }"
                      >
                        ▸
                      </span>
                    </div>
                    <div
                      v-if="!bizCollapsed.has(gIdx + '-' + category)"
                      class="space-y-2 border-t border-gray-100 px-4 py-3"
                    >
                      <div
                        v-for="(item, idx) in modules"
                        :key="idx"
                        class="cursor-pointer rounded p-2 text-xs transition-colors hover:text-blue-600"
                        :class="
                          bizVulnResSet.has(item.module_name)
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-50 text-gray-600 hover:bg-blue-50'
                        "
                        @click="loadBizVulnExploitList(item.module_name)"
                      >
                        <div class="font-medium">{{ item.module_name }}</div>
                        <div
                          v-if="item.module_path"
                          class="mt-1 font-mono text-gray-400"
                        >
                          {{ item.module_path }}
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </div>
            <div v-else class="flex h-full flex-col">
              <div class="flex items-center gap-2 border-b bg-gray-50 px-4 py-2">
                <button
                  class="rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50"
                  @click="backToBizModuleList"
                >
                  ← 返回模块列表
                </button>
                <span class="text-xs font-medium text-gray-600">
                  {{ selectedBizName }}
                </span>
              </div>
              <div
                v-if="bizVulnExploitLoading"
                class="flex flex-1 items-center justify-center text-sm text-gray-400"
              >
                加载漏洞列表中...
              </div>
              <div
                v-else-if="bizVulnExploitList.length === 0"
                class="flex flex-1 items-center justify-center text-sm text-gray-400"
              >
                暂无业务漏洞
              </div>
              <div v-else class="flex-1 space-y-3 overflow-y-auto p-2">
                <div
                  v-for="vuln in bizVulnExploitList"
                  :key="vuln.id"
                  class="rounded border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div class="mb-2 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="font-mono text-sm font-medium text-gray-700">{{
                        vuln.vuln_id
                      }}</span>
                      <Tag
                        :color="
                          vuln.severity === 'critical' || vuln.severity === '严重'
                            ? 'error'
                            : vuln.severity === 'high' || vuln.severity === '高'
                              ? 'warning'
                              : vuln.severity === 'medium' || vuln.severity === '中'
                                ? 'orange'
                                : 'green'
                        "
                      >
                        {{ vuln.severity }}
                      </Tag>
                      <Tag
                        :color="
                          vuln.status === '成功利用' || vuln.status === 'confirmed'
                            ? 'success'
                            : 'default'
                        "
                      >
                        {{ vuln.status }}
                      </Tag>
                    </div>
                    <span class="text-xs text-gray-400">{{
                      vuln.create_time
                    }}</span>
                  </div>
                  <div class="mb-2 text-sm font-medium text-gray-800">
                    {{ vuln.title }}
                  </div>
                  <div class="mb-2 text-xs text-gray-500">
                    <span class="font-medium">漏洞类型:</span>
                    {{ vuln.vuln_type }}
                  </div>
                  <div v-if="vuln.category" class="mb-2 text-xs text-gray-500">
                    <span class="font-medium">分类:</span> {{ vuln.category }}
                  </div>
                  <div v-if="vuln.location" class="mb-2 text-xs text-gray-500">
                    <span class="font-medium">位置:</span> {{ vuln.location }}
                  </div>
                  <div
                    v-if="vuln.vuln_detail"
                    class="mb-2 rounded bg-gray-50 p-2 text-xs text-gray-600"
                  >
                    <span class="font-medium">详情:</span> {{ vuln.vuln_detail }}
                  </div>
                  <div v-if="vuln.impact" class="mb-2 text-xs text-gray-500">
                    <span class="font-medium">影响:</span> {{ vuln.impact }}
                  </div>
                  <div
                    v-if="vuln.prerequisites"
                    class="mb-2 text-xs text-gray-500"
                  >
                    <span class="font-medium">前置条件:</span>
                    {{ vuln.prerequisites }}
                  </div>
                  <div v-if="vuln.exploit_steps" class="mb-2">
                    <div class="mb-1 text-xs font-medium text-gray-500">
                      利用步骤:
                    </div>
                    <div
                      class="rounded bg-gray-50 p-2 text-xs text-gray-600 space-y-1"
                    >
                      <template
                        v-for="(line, idx) in vuln.exploit_steps.split(
                          /(?:\n|;)/,
                        )"
                        :key="idx"
                      >
                        <div v-if="line.trim()" class="flex items-start gap-2">
                          <div
                            v-if="/^\d/.test(line.trim())"
                            class="flex items-start gap-2"
                          >
                            <span
                              class="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] text-blue-600"
                            >
                              {{ line.trim().charAt(0) }}
                            </span>
                            <span class="break-words">{{
                              line.trim().replace(/^\d+[.):]?\s*/, '')
                            }}</span>
                          </div>
                          <div v-else class="ml-6 break-words">
                            {{ line.trim() }}
                          </div>
                        </div>
                      </template>
                    </div>
                  </div>
                  <div
                    v-if="vuln.evidence"
                    class="rounded bg-green-50 p-2 text-xs text-green-700"
                  >
                    <span class="font-medium">证据:</span> {{ vuln.evidence }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            v-else-if="activeStep === 'biz_exploit'"
            class="flex h-full w-full flex-1 flex-col"
          >
            <div v-if="showBizExploitModuleList" class="flex h-full flex-col overflow-y-auto p-4">
              <div class="mb-3 text-sm font-medium text-gray-700">
                选择业务模块查看漏洞利用报告
              </div>
              <div v-if="bizDataLoading" class="flex items-center justify-center py-8 text-sm text-gray-400">
                加载业务数据中...
              </div>
              <div v-else-if="bizData.length === 0" class="flex items-center justify-center py-8 text-sm text-gray-400">
                暂无业务数据
              </div>
              <div v-else class="space-y-4">
                <template v-for="(group, gIdx) in bizData" :key="gIdx">
                  <div
                    v-for="(modules, category) in group"
                    :key="category"
                    class="rounded border border-gray-200 bg-white shadow-sm"
                  >
                    <div
                      class="flex cursor-pointer items-center justify-between px-4 py-3 select-none"
                      @click="toggleBizCollapse(gIdx + '-' + category)"
                    >
                      <div class="text-sm font-medium text-gray-700 capitalize">
                        {{ String(category).replace(/_/g, ' ') }}
                        <span class="ml-2 text-xs font-normal text-gray-400"
                          >({{ modules.length }})</span
                        >
                      </div>
                      <span
                        class="text-xs text-gray-400 transition-transform duration-200"
                        :class="{
                          'rotate-90': !bizCollapsed.has(gIdx + '-' + category),
                        }"
                      >
                        ▸
                      </span>
                    </div>
                    <div
                      v-if="!bizCollapsed.has(gIdx + '-' + category)"
                      class="space-y-2 border-t border-gray-100 px-4 py-3"
                    >
                      <div
                        v-for="(item, idx) in modules"
                        :key="idx"
                        class="cursor-pointer rounded p-2 text-xs transition-colors hover:text-blue-600"
                        :class="
                          bizVulnResSet.has(item.module_name)
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-50 text-gray-600 hover:bg-blue-50'
                        "
                        @click="loadBizExploitPdf(item.module_name)"
                      >
                        <div class="font-medium">{{ item.module_name }}</div>
                        <div
                          v-if="item.module_path"
                          class="mt-1 font-mono text-gray-400"
                        >
                          {{ item.module_path }}
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </div>
            <div v-else class="flex h-full flex-col">
              <div class="flex items-center gap-2 border-b bg-gray-50 px-4 py-2">
                <button
                  class="rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50"
                  @click="backBizExploitToModuleList"
                >
                  ← 返回模块列表
                </button>
                <span class="text-xs font-medium text-gray-600">
                  {{ selectedBizExploitName }} - 漏洞利用报告
                </span>
              </div>
              <div
                v-if="bizExploitPdfLoading"
                class="flex flex-1 items-center justify-center text-sm text-gray-400"
              >
                加载报告中...
              </div>
              <iframe
                v-else-if="bizExploitPdfUrl"
                :src="bizExploitPdfUrl"
                class="h-full w-full rounded border-0"
                style="min-height: 500px"
              ></iframe>
              <div
                v-else
                class="flex flex-1 items-center justify-center text-sm text-gray-400"
              >
                暂无报告
              </div>
            </div>
          </div>

          <div
            style="width: 100%"
            v-else
            class="rounded border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-400"
          >
            <div class="mb-1 text-lg">{{ getStepIcon(activeStep) }}</div>
            <div class="font-medium text-gray-600">
              {{ getStepTitle(activeStep) }}
            </div>
            <div class="mt-1 text-xs text-gray-400">
              {{ getStepDesc(activeStep) }}
            </div>
          </div>
        </div>
      </div>

      <div class="relative flex flex-col" :style="{ width: '0' }">
        <div
          class="absolute -left-3 top-8 z-20 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white text-xs text-gray-400 shadow-sm transition-all hover:border-blue-300 hover:text-blue-500 hover:shadow-md"
          :title="rightCollapsed ? '展开思考流程' : '收起思考流程'"
          @click="toggleRight"
        >
          <span class="select-none leading-none text-[10px]">
            {{ rightCollapsed ? '◀' : '▶' }}
          </span>
        </div>
      </div>

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
          <span class="text-xs text-gray-400">
            {{ eventStreamConnected ? '已连接' : '未连接' }}
          </span>
        </div>
        <div
          ref="eventStreamContainer"
          class="flex-1 overflow-y-auto p-4"
          style="min-height: 400px; max-height: 540px"
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
              <!-- merged reasoning block -->
              <div
                v-if="item.type === 'merged-reasoning'"
                class="rounded-lg border border-blue-100 bg-blue-50/60 p-3"
              >
                <div
                  class="mb-1.5 flex items-center gap-1.5 text-xs text-blue-400"
                >
                  <span>💭</span>
                  <span>推理中</span>
                  <span
                    class="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400"
                  ></span>
                </div>
                <div
                  class="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 space-y-2"
                >
                  <template
                    v-for="(text, tIdx) in item.texts"
                    :key="tIdx"
                  >
                    <div v-if="text.trim()" class="text-gray-700">
                      {{ text }}
                    </div>
                  </template>
                  <span
                    class="inline-block h-3.5 w-0.5 animate-pulse bg-blue-300 align-text-bottom"
                  ></span>
                </div>
              </div>

              <!-- tool call block -->
              <div
                v-if="item.type === 'tool'"
                class="rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
              >
                <div class="mb-1.5 flex items-center gap-2">
                  <span class="text-base">
                    {{ toolStatusIcon[item.toolStatus || ''] || '🔧' }}
                  </span>
                  <span class="text-xs font-medium text-gray-500">
                    {{ item.toolName || '工具调用' }}
                  </span>
                  <Tag
                    v-if="item.toolStatus"
                    :color="
                      item.toolStatus === 'completed'
                        ? 'success'
                        : item.toolStatus === 'running'
                          ? 'processing'
                          : 'default'
                    "
                    class="!text-xs !px-1.5 !py-0"
                  >
                    {{ item.toolStatus }}
                  </Tag>
                </div>
                <div
                  v-if="item.toolInput && !item.hideContent"
                  class="mb-1 rounded bg-gray-100 p-2 text-xs text-gray-600 font-mono"
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
                  class="rounded bg-green-50 p-2 text-xs text-green-700 font-mono whitespace-pre-wrap"
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

              <!-- step block -->
              <div
                v-if="item.type === 'step'"
                class="flex items-center gap-2 text-xs text-gray-400"
              >
                <span v-if="item.stepType === 'start'" class="text-blue-400"
                  >┌─</span
                >
                <span
                  v-else-if="item.stepType === 'finish'"
                  class="text-green-400"
                  >└─</span
                >
                <span>{{ item.text }}</span>
              </div>

              <!-- info/message block -->
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

    <Modal
      :open="reportModalVisible"
      title="业务报告"
      width="80%"
      :footer="null"
      @cancel="closeReportPdf"
    >
      <div
        v-if="reportModalLoading"
        class="flex items-center justify-center py-20 text-gray-400 text-sm"
      >
        加载报告中...
      </div>
      <iframe
        v-else-if="reportModalPdfUrl"
        :src="reportModalPdfUrl"
        class="h-full w-full rounded border-0"
        style="min-height: 600px"
      ></iframe>
      <div
        v-else
        class="flex items-center justify-center py-20 text-gray-400 text-sm"
      >
        暂无报告
      </div>
    </Modal>
  </Page>
  <Page v-else-if="!loading" description="未找到任务" title="任务详情">
    <div class="pt-20 text-center text-gray-400">未找到对应任务信息</div>
  </Page>
</template>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.2s ease-out;
}
</style>
