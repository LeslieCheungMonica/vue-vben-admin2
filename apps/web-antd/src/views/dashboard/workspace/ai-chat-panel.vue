<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue';

import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';

import { sessionAbortApi, webServerCreateSessionApi, webServerSendMsgAsyncApi, webServerStartApi, webServerStatusApi, webServerStopApi } from '#/api/core/resource';

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
const scrollRef = ref<HTMLDivElement | null>(null);

const MAX_HISTORY = 100;
const FLUSH_INTERVAL = 80;
const SAVE_INTERVAL = 2000;
const STORAGE_PREFIX = 'codechat:messages:';

let statusTimer: ReturnType<typeof setInterval> | null = null;
let flushTimer: ReturnType<typeof setInterval> | null = null;
let saveTimer: ReturnType<typeof setInterval> | null = null;
let eventSource: EventSource | null = null;
let currentAssistantId = '';
let isComposing = false;

const mdCache = new Map<string, string>();

const streamParts = new Map<string, Part>();
let streamOrder: string[] = [];
let streamDirty = false;
let messagesDirty = false;
let stickToBottom = true;

const BOTTOM_THRESHOLD = 40;

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
  todowrite: { icon: '📝', label: '任务列表' },
};

function getToolInfo(tool: string) {
  return TOOL_INFO[tool] || { icon: '🔧', label: tool };
}

function renderMarkdown(text: string): string {
  const key = text || '';
  const cached = mdCache.get(key);
  if (cached !== undefined) return cached;
  const html = md.render(key);
  if (mdCache.size > 500) {
    const oldest = mdCache.keys().next().value;
    if (oldest !== undefined) mdCache.delete(oldest);
  }
  mdCache.set(key, html);
  return html;
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

function formatQuestion(input: any): string {
  if (!input || typeof input !== 'object') return '';
  const items = Array.isArray(input.questions) ? input.questions : [];
  if (items.length > 0) {
    return items
      .map((q: any, i: number) => {
        if (typeof q === 'string') return `${i + 1}. ${q}`;
        const header = typeof q?.header === 'string' && q.header ? `【${q.header}】` : '';
        const body =
          [q?.question, q?.text, q?.prompt, q?.message, q?.content].find(
            (v) => typeof v === 'string' && v,
          ) || '';
        const lines = [`${i + 1}. ${header}${body}`];
        if (Array.isArray(q?.options)) {
          for (const opt of q.options) {
            if (typeof opt === 'string') {
              lines.push(`   - ${opt}`);
            } else {
              const label = opt?.label ?? opt?.text ?? '';
              const desc = opt?.description ? `：${opt.description}` : '';
              lines.push(`   - ${label}${desc}`);
            }
          }
        }
        return lines.join('\n');
      })
      .join('\n\n');
  }
  const q =
    input.question ?? input.text ?? input.prompt ?? input.message ?? input.content;
  if (typeof q === 'string' && q) {
    const lines = [q];
    if (Array.isArray(input.options)) {
      for (const opt of input.options) {
        if (typeof opt === 'string') {
          lines.push(`- ${opt}`);
        } else {
          const label = opt?.label ?? opt?.text ?? '';
          const desc = opt?.description ? `：${opt.description}` : '';
          lines.push(`- ${label}${desc}`);
        }
      }
    }
    return lines.join('\n');
  }
  return '';
}

function formatTodos(input: any): string {
  const todos = input?.todos;
  if (!Array.isArray(todos)) return '';
  const icons: Record<string, string> = {
    cancelled: '❌',
    completed: '✅',
    in_progress: '🔄',
    pending: '⏳',
  };
  return todos
    .map((t: any) =>
      typeof t === 'string'
        ? `- ${t}`
        : `${icons[t?.status] || '•'} ${t?.content ?? t?.text ?? ''}`,
    )
    .join('\n');
}

function buildToolText(tool: string, partData: any): string {
  const state = partData.state || {};
  const input = state.input ?? partData.input ?? partData.state?.input;
  let content = '';
  if (tool === 'question') {
    content = formatQuestion(input);
  } else if (tool === 'todowrite') {
    content = formatTodos(input);
  }
  if (!content && typeof input === 'string') content = input;
  if (!content && input && typeof input === 'object') {
    content = JSON.stringify(input, null, 2);
  }
  if (!content && typeof state.output === 'string') content = state.output;
  if (!content && typeof state.raw === 'string') content = state.raw;
  if (!content && typeof state.title === 'string' && state.title !== tool) {
    content = state.title;
  }
  if (!content && typeof partData.text === 'string') content = partData.text;
  return content;
}

function scrollToBottom() {
  const el = scrollRef.value;
  if (!el || !stickToBottom) return;
  nextTick(() => {
    el.scrollTop = el.scrollHeight;
  });
}

function handleScroll() {
  const el = scrollRef.value;
  if (!el) return;
  stickToBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= BOTTOM_THRESHOLD;
}

function ensureAssistant(): number {
  const idx = messages.value.findIndex((m) => m.id === currentAssistantId);
  if (idx >= 0) return idx;
  currentAssistantId = `assistant-${Date.now()}`;
  messages.value.push({ id: currentAssistantId, role: 'assistant', parts: [] });
  streamParts.clear();
  streamOrder = [];
  sending.value = true;
  return messages.value.length - 1;
}

function getOrCreateStreamPart(id: string, type: PartType): Part {
  let part = streamParts.get(id);
  if (!part) {
    part = { id, type, text: '' };
    streamParts.set(id, part);
    streamOrder.push(id);
  }
  return part;
}

function flushStream() {
  if (!streamDirty) return;
  streamDirty = false;
  const idx = messages.value.findIndex((m) => m.id === currentAssistantId);
  if (idx < 0) return;
  const target = messages.value[idx];
  if (!target) return;
  const parts = streamOrder.map((id) => ({ ...streamParts.get(id)! }));
  messages.value[idx] = { ...target, parts };
  messagesDirty = true;
  scrollToBottom();
}

function storageKey() {
  return `${STORAGE_PREFIX}${props.systemId || 'default'}`;
}

function saveMessages() {
  if (!props.systemId || !messagesDirty) return;
  messagesDirty = false;
  try {
    trimHistory();
    localStorage.setItem(storageKey(), JSON.stringify(messages.value));
  } catch {
    try {
      localStorage.setItem(storageKey(), JSON.stringify(messages.value.slice(-20)));
    } catch { /* ignore quota errors */ }
  }
}

function loadMessages() {
  if (!props.systemId) return;
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      messages.value = parsed.slice(-MAX_HISTORY);
      currentAssistantId = '';
      streamParts.clear();
      streamOrder = [];
      messagesDirty = false;
    }
  } catch { /* ignore corrupt cache */ }
}

function clearMessages() {
  try {
    localStorage.removeItem(storageKey());
  } catch { /* ignore */ }
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
      await new Promise((resolve) => setTimeout(resolve, 2000));
      connectEventStream();
    } catch { /* ignore */ }
  }
}

function stop() {
  if (!props.systemId) return;
  webServerStopApi(props.systemId).catch(() => {});
  if (eventSource) { eventSource.close(); eventSource = null; }
  connected.value = false;
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

  if (type === 'session.status') {
    if (propsData.status?.type === 'idle') {
      flushStream();
      sending.value = false;
      saveMessages();
    }
    return;
  }

  if (type !== 'message.part.delta' && type !== 'message.part.updated') {
    return;
  }

  ensureAssistant();

  if (type === 'message.part.delta' && propsData.field === 'text') {
    const partId = propsData.partID;
    if (!partId) return;
    const part = getOrCreateStreamPart(partId, 'text');
    part.text = (part.text || '') + (propsData.delta || '');
    streamDirty = true;
    return;
  }

  if (type === 'message.part.updated') {
    const partData = propsData.part || {};
    const partId = partData.id || propsData.partID;
    if (!partId) return;
    const partType: string = partData.type || '';

    if (partType === 'text') {
      const part = getOrCreateStreamPart(partId, 'text');
      part.type = 'text';
      part.text = partData.text || part.text || '';
    } else if (partType === 'reasoning') {
      const part = getOrCreateStreamPart(partId, 'reasoning');
      part.type = 'reasoning';
      part.text = partData.text || part.text || '';
    } else if (partType === 'tool') {
      const part = getOrCreateStreamPart(partId, 'tool');
      const tool = partData.tool || partData.toolName || part.tool || '';
      part.type = 'tool';
      part.tool = tool;
      part.status = partData.state?.status;
      part.title = partData.state?.title || tool;
      if (tool === 'question' || tool === 'todowrite') {
        const content = buildToolText(tool, partData);
        if (content) part.text = content;
      }
    }
    streamDirty = true;
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
  streamParts.clear();
  streamOrder = [];
  streamDirty = false;
  trimHistory();
  messagesDirty = true;
  stickToBottom = true;
  await nextTick();
  scrollToBottom();

  webServerSendMsgAsyncApi(props.systemId || '', text).catch(() => {});
}

function stopSending() {
  sending.value = false;
  if (props.systemId) {
    sessionAbortApi(props.systemId).catch(() => {});
  }
}

async function newSession() {
  if (!props.systemId) return;
  try {
    await webServerCreateSessionApi(props.systemId);
  } catch { /* ignore */ }
  messages.value = [];
  currentAssistantId = '';
  streamParts.clear();
  streamOrder = [];
  streamDirty = false;
  messagesDirty = false;
  sending.value = false;
  stickToBottom = true;
  mdCache.clear();
  clearMessages();
}

statusTimer = setInterval(checkStatus, 3000);
flushTimer = setInterval(flushStream, FLUSH_INTERVAL);
saveTimer = setInterval(saveMessages, SAVE_INTERVAL);
loadMessages();
checkStatus();

onMounted(() => {
  scrollToBottom();
});

onUnmounted(() => {
  if (statusTimer) { clearInterval(statusTimer); statusTimer = null; }
  if (flushTimer) { clearInterval(flushTimer); flushTimer = null; }
  if (saveTimer) { clearInterval(saveTimer); saveTimer = null; }
  if (eventSource) { eventSource.close(); eventSource = null; }
  flushStream();
  saveMessages();
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
          :class="connected ? 'text-red-400 hover:text-red-300' : ''"
          @click="connected ? stop() : connect()"
        >
          {{ connected ? '停止' : '连接' }}
        </button>
        <button
          class="rounded px-2 py-1 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-700/50"
          @click="newSession"
        >
          新建会话
        </button>
      </div>
    </div>

    <div ref="scrollRef" class="flex-1 overflow-y-auto px-4 py-3 space-y-4" @scroll="handleScroll">
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
              class="rounded-md border border-gray-700/60 bg-[#141821] px-2.5 py-1.5"
            >
              <div class="flex items-center gap-2">
                <span class="text-sm">{{ getToolInfo(tool.tool || '').icon }}</span>
                <span class="flex-1 truncate text-xs" :class="tool.status === 'pending' || tool.status === 'running' ? 'animate-pulse text-gray-400' : 'text-gray-300'">
                  {{ tool.title || getToolInfo(tool.tool || '').label }}
                </span>
                <span v-if="tool.status === 'pending' || tool.status === 'running'" class="text-xs text-blue-400">运行中…</span>
                <span v-else-if="tool.status === 'completed'" class="text-xs text-green-500">✓</span>
                <span v-else-if="tool.status === 'error'" class="text-xs text-red-500">✗</span>
              </div>
              <div
                v-if="(tool.tool === 'question' || tool.tool === 'todowrite') && tool.text"
                class="mt-1.5 whitespace-pre-wrap break-words rounded bg-black/20 px-2 py-1.5 text-xs leading-relaxed text-gray-300"
              >
                {{ tool.text }}
              </div>
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