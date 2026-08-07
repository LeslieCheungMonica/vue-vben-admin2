<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref } from 'vue';

import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';

import { webServerSendMsgAsyncApi, webServerStartApi, webServerStatusApi } from '#/api/core/resource';

const md = new MarkdownIt({
  highlight: function (str: string, lang: string) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value;
      } catch {
        return '';
      }
    }
    return '';
  },
  html: false,
  linkify: true,
  breaks: true,
});

type PartType = 'text' | 'reasoning' | 'tool';

interface Part {
  id: string;
  type: PartType;
  text?: string;
  tool?: string;
  status?: 'pending' | 'running' | 'completed' | 'error';
  title?: string;
}

interface MessageData {
  id: string;
  role: 'user' | 'assistant';
  parts: Part[];
}

const props = defineProps<{ systemId?: string }>();
const connected = ref(false);
const messages = ref<MessageData[]>([]);
const inputText = ref('');
const sending = ref(false);

const MAX_HISTORY = 100;

let statusTimer: ReturnType<typeof setInterval> | null = null;
let eventSource: EventSource | null = null;
let currentAssistantId = '';
let isComposing = false;

function handleEnter(e: KeyboardEvent) {
  if (isComposing || e.isComposing) return;
  if (sending.value) return;
  e.preventDefault();
  sendMessage();
}

function trimHistory() {
  if (messages.value.length > MAX_HISTORY) {
    messages.value = messages.value.slice(-MAX_HISTORY);
  }
}

const TOOL_INFO: Record<string, { icon: string; label: string }> = {
  read: { icon: '👓', label: '读取文件' },
  list: { icon: '📋', label: '列出目录' },
  glob: { icon: '🔍', label: '搜索文件' },
  grep: { icon: '🔍', label: '搜索内容' },
  webfetch: { icon: '🌐', label: '网页抓取' },
  bash: { icon: '>_', label: '终端命令' },
  edit: { icon: '✏️', label: '编辑文件' },
  write: { icon: '✏️', label: '写入文件' },
  apply_patch: { icon: '📝', label: '应用补丁' },
  task: { icon: '🤖', label: '子任务' },
  question: { icon: '❓', label: '问题' },
};

function getToolInfo(tool: string) {
  return TOOL_INFO[tool] || { icon: '🔧', label: tool };
}

function renderMarkdown(text: string): string {
  return md.render(text || '');
}

function getMsgText(msg: MessageData): string {
  return msg.parts.filter((p) => p.type === 'text').map((p) => p.text || '').join('\n');
}

function getMsgReasoning(msg: MessageData): string {
  return msg.parts.filter((p) => p.type === 'reasoning').map((p) => p.text || '').join('\n');
}

function getMsgTools(msg: MessageData): Part[] {
  return msg.parts.filter((p) => p.type === 'tool');
}

function updateAssistant(patch: Partial<MessageData>) {
  const idx = messages.value.findIndex((m) => m.id === currentAssistantId);
  if (idx >= 0) {
    messages.value[idx] = { ...messages.value[idx], ...patch };
  }
}

async function checkStatus() {
  if (!props.systemId || connected.value) return;
  try {
    const res = await webServerStatusApi(props.systemId);
    const data = res as any;
    if (data?.message && data.message !== '服务已断开') {
      connected.value = true;
      if (statusTimer) { clearInterval(statusTimer); statusTimer = null; }
      connectEventStream();
    }
  } catch { /* not ready yet */ }
}

async function connect() {
  if (props.systemId) {
    try {
      await webServerStartApi(props.systemId);
      connected.value = true;
      connectEventStream();
    } catch { /* ignore */ }
  }
}

function connectEventStream() {
  if (eventSource) { eventSource.close(); eventSource = null; }
  const url = `/api/wape/event_stream/web_${props.systemId}`;
  eventSource = new EventSource(url);
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      processEvent(data);
    } catch { /* ignore */ }
  };
}

function processEvent(data: any) {
  const type: string = data.type;
  const propsData = data.properties || {};
  const idx = messages.value.findIndex((m) => m.id === currentAssistantId);
  if (idx < 0) return;

  if (type === 'message.part.delta' && propsData.field === 'text') {
    const partId = propsData.partID;
    const parts = messages.value[idx].parts;
    let part = parts.find((p) => p.id === partId);
    if (!part) {
      part = { id: partId, type: 'text', text: '' };
      updateAssistant({ parts: [...parts, part] });
    } else {
      const delta = propsData.delta || '';
      updateAssistant({
        parts: parts.map((p) => (p.id === partId ? { ...p, text: (p.text || '') + delta } : p)),
      });
    }
    return;
  }

  if (type === 'message.part.updated') {
    const partData = propsData.part || {};
    const partId = partData.id || propsData.partID;
    const partType: string = partData.type || '';
    const parts = messages.value[idx].parts;

    if (partType === 'text') {
      const existing = parts.find((p) => p.id === partId);
      updateAssistant({
        parts: existing
          ? parts.map((p) => (p.id === partId ? { ...p, type: 'text', text: partData.text || p.text } : p))
          : [...parts, { id: partId, type: 'text', text: partData.text || '' }],
      });
    } else if (partType === 'reasoning') {
      const existing = parts.find((p) => p.id === partId);
      updateAssistant({
        parts: existing
          ? parts.map((p) => (p.id === partId ? { ...p, type: 'reasoning', text: partData.text || p.text } : p))
          : [...parts, { id: partId, type: 'reasoning', text: partData.text || '' }],
      });
    } else if (partType === 'tool') {
      const existing = parts.find((p) => p.id === partId);
      const toolPart: Part = {
        id: partId,
        type: 'tool',
        tool: partData.tool,
        status: partData.state?.status,
        title: partData.state?.title || partData.tool,
      };
      updateAssistant({
        parts: existing ? parts.map((p) => (p.id === partId ? toolPart : p)) : [...parts, toolPart],
      });
    }
    return;
  }

  if (type === 'session.status') {
    if (propsData.status?.type === 'idle') {
      sending.value = false;
    }
    return;
  }
}

async function sendMessage() {
  const text = inputText.value.trim();
  if (!text || !connected.value) return;
  inputText.value = '';
  sending.value = true;

  messages.value.push({
    id: `user-${Date.now()}`,
    role: 'user',
    parts: [{ id: `part-${Date.now()}`, type: 'text', text }],
  });

  currentAssistantId = `assistant-${Date.now()}`;
  messages.value.push({
    id: currentAssistantId,
    role: 'assistant',
    parts: [],
  });
  trimHistory();
  await nextTick();

  webServerSendMsgAsyncApi(props.systemId || '', text).catch(() => {});
}

function stopSending() {
  sending.value = false;
}

statusTimer = setInterval(checkStatus, 3000);
checkStatus();

onUnmounted(() => {
  if (statusTimer) { clearInterval(statusTimer); statusTimer = null; }
  if (eventSource) { eventSource.close(); eventSource = null; }
});
</script>

<template>
  <div class="flex h-full flex-col bg-[#0c0f16]">
    <div class="flex items-center justify-between border-b border-gray-700/50 px-3 py-2">
      <div class="flex items-center gap-2">
        <div
          class="size-2 rounded-full"
          :class="connected ? 'bg-green-500' : 'bg-red-500'"
        />
        <span class="text-xs text-gray-400">CodeChat</span>
      </div>
      <div class="flex items-center gap-1">
        <button
          class="rounded px-2 py-1 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-700/50"
          @click="connect"
        >
          连接
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto px-4 py-3 space-y-4">
      <div v-if="!connected" class="flex h-full items-center justify-center">
        <div class="text-center">
          <p class="text-sm text-gray-500">未连接到 CodeChat 服务器</p>
          <p class="mt-1 text-xs text-gray-600">等待服务启动...</p>
        </div>
      </div>

      <template v-for="msg in messages" :key="msg.id">
        <!-- 用户消息：右对齐气泡 -->
        <div v-if="msg.role === 'user'" class="flex justify-end">
          <div
            class="max-w-[85%] rounded-lg border border-gray-600/60 bg-[#151a24] px-3 py-2 text-xs leading-relaxed text-gray-100"
          >
            <div class="whitespace-pre-wrap break-words">{{ getMsgText(msg) }}</div>
          </div>
        </div>

        <!-- 助手消息：无边框 markdown -->
        <div
          v-else-if="getMsgText(msg) || getMsgReasoning(msg) || getMsgTools(msg).length || msg.id === currentAssistantId"
          class="min-w-0"
        >
          <div v-if="getMsgReasoning(msg)" class="mb-2">
            <div
              class="markdown-body markdown-dim text-xs leading-relaxed text-gray-500"
              v-html="renderMarkdown(getMsgReasoning(msg))"
            />
          </div>
          <div v-if="getMsgText(msg)" class="mb-1">
            <div
              class="markdown-body text-xs leading-relaxed text-gray-200"
              v-html="renderMarkdown(getMsgText(msg))"
            />
          </div>
          <div v-for="tool in getMsgTools(msg)" :key="tool.id" class="mb-1">
            <div
              class="flex items-center gap-2 rounded-md border border-gray-700/60 bg-[#141821] px-2.5 py-1.5"
            >
              <span class="text-sm">{{ getToolInfo(tool.tool || '').icon }}</span>
              <span class="flex-1 truncate text-xs" :class="tool.status === 'pending' || tool.status === 'running' ? 'animate-pulse text-gray-400' : 'text-gray-300'">
                {{ tool.title || getToolInfo(tool.tool || '').label }}
              </span>
              <span v-if="tool.status === 'pending' || tool.status === 'running'" class="text-xs text-blue-400">运行中…</span>
              <span v-else-if="tool.status === 'completed'" class="text-xs text-green-500">✓</span>
              <span v-else-if="tool.status === 'error'" class="text-xs text-red-500">✗</span>
            </div>
          </div>
          <div
            v-if="msg.id === currentAssistantId && sending && !getMsgText(msg) && !getMsgReasoning(msg) && !getMsgTools(msg).length"
            class="flex items-center gap-1.5 text-xs text-gray-500"
          >
            <span class="inline-block size-3 animate-spin rounded-full border border-gray-500 border-t-transparent" />
            <span>思考中…</span>
          </div>
        </div>
      </template>
    </div>

    <div class="border-t border-gray-700/50 p-3">
      <div class="flex items-end gap-2">
        <textarea
          v-model="inputText"
          class="flex-1 resize-none rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-gray-200 outline-none placeholder:text-gray-500 focus:border-blue-500/60"
          placeholder="输入消息..."
          :disabled="!connected"
          rows="2"
          @compositionstart="isComposing = true"
          @compositionend="isComposing = false"
          @keydown.enter="handleEnter"
        />
        <button
          v-if="sending"
          class="rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-400 hover:bg-red-500/30"
          @click="stopSending"
        >
          停止
        </button>
        <button
          v-else
          class="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-500 disabled:opacity-30 disabled:hover:bg-blue-600"
          :disabled="!connected || !inputText.trim()"
          @click="sendMessage"
        >
          发送
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.markdown-body :deep(p) {
  margin: 0 0 8px;
}
.markdown-body :deep(p:last-child) {
  margin-bottom: 0;
}
.markdown-body :deep(code) {
  padding: 1px 4px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.92em;
}
.markdown-body :deep(pre) {
  margin: 8px 0;
  padding: 10px;
  border-radius: 6px;
  background: #0d1117;
  overflow-x: auto;
}
.markdown-body :deep(pre code) {
  background: transparent;
  padding: 0;
}
.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin: 4px 0;
  padding-left: 20px;
}
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3) {
  margin: 10px 0 6px;
  font-size: 1.1em;
  font-weight: 600;
}
.markdown-dim :deep(*) {
  opacity: 0.6;
}
</style>