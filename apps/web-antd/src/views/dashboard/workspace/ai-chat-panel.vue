<script setup lang="ts">
import { nextTick, onUnmounted, ref } from 'vue';

interface Part {
  id: string;
  messageID?: string;
  sessionID?: string;
  type: string;
  text?: string;
  delta?: string;
  state?: { status: string; input?: any; output?: string; title?: string };
  tool?: string;
  callID?: string;
}

interface MessageData {
  id: string;
  role: 'user' | 'assistant';
  parts: Part[];
  time: { created?: string };
  modelID?: string;
  providerID?: string;
  finish?: string;
}

const serverUrl = ref('http://127.0.0.1:4096');
const connected = ref(false);
const sessionId = ref('');
const messages = ref<MessageData[]>([]);
const inputText = ref('');
const sending = ref(false);

let abortController: AbortController | null = null;
let eventSource: EventSource | null = null;

const pendingParts = ref<Record<string, Part>>({});

async function checkHealth() {
  try {
    const resp = await fetch(`${serverUrl.value}/global/health`, { signal: AbortSignal.timeout(5000) });
    connected.value = resp.ok;
  } catch {
    connected.value = false;
  }
}

function connectSSE() {
  if (eventSource) { eventSource.close(); eventSource = null; }
  try {
    eventSource = new EventSource(`${serverUrl.value}/global/event`);
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const payload = data.payload;
        if (!payload) return;
        handleEvent(payload.type, payload.properties);
      } catch { /* ignore parse errors */ }
    };
    eventSource.onerror = () => {
      connected.value = false;
    };
  } catch { /* ignore */ }
}

function handleEvent(type: string, props: any) {
  if (type !== 'server.heartbeat') {
    console.log('[SSE]', type, props);
  }
  switch (type) {
    case 'server.connected':
      connected.value = true;
      break;
    case 'server.heartbeat':
      break;
    case 'session.status': {
      const status = props.status?.type;
      if (status === 'busy') sending.value = true;
      else if (status === 'idle') sending.value = false;
      break;
    }
    case 'message.updated': {
      const info = props.info;
      if (!info) break;
      const idx = messages.value.findIndex((m) => m.id === info.id);
      if (idx >= 0) {
        messages.value[idx] = { ...messages.value[idx], ...info };
      } else {
        messages.value.push(info);
      }
      break;
    }
    case 'message.part.updated': {
      const part = props.part as Part;
      if (!part) break;
      updatePart(part);
      break;
    }
    case 'message.part.delta': {
      const { messageID, partID, field, delta } = props;
      if (!messageID || !partID || field !== 'text' || !delta) break;
      const key = `${messageID}:${partID}`;
      const existing = pendingParts.value[key];
      if (existing) {
        existing.text = (existing.text || '') + delta;
      } else {
        pendingParts.value[key] = { id: partID, type: 'text', text: delta };
      }
      pendingParts.value = { ...pendingParts.value };
      break;
    }
    case 'message.created': {
      const msg = props.info as MessageData;
      if (msg) {
        messages.value.push(msg);
      }
      break;
    }
    case 'message.part.removed': {
      const { partID } = props;
      if (!partID) break;
      for (const key of Object.keys(pendingParts.value)) {
        if (key.endsWith(`:${partID}`)) delete pendingParts.value[key];
      }
      pendingParts.value = { ...pendingParts.value };
      for (const msg of messages.value) {
        msg.parts = msg.parts.filter((p) => p.id !== partID);
      }
      break;
    }
  }
}

function updatePart(part: Part) {
  const key = `${part.messageID || ''}:${part.id}`;
  delete pendingParts.value[key];
  pendingParts.value = { ...pendingParts.value };
  for (const msg of messages.value) {
    if (msg.id === part.messageID) {
      const idx = msg.parts.findIndex((p) => p.id === part.id);
      if (idx >= 0) msg.parts[idx] = part;
      else msg.parts.push(part);
      return;
    }
  }
}

function getDisplayText(msg: MessageData): string {
  const parts = msg.parts || [];
  const texts = parts.map((p) => {
    if (p.type === 'text') return p.text || '';
    if (p.type === 'reasoning') return '';
    return '';
  }).filter(Boolean);
  return texts.join('\n');
}

function getReasoningText(msg: MessageData): string {
  const parts = msg.parts || [];
  return parts.filter((p) => p.type === 'reasoning').map((p) => p.text || '').join('\n');
}

function getPendingText(): string {
  let result = '';
  for (const part of Object.values(pendingParts.value)) {
    if (part.type === 'text' && part.text) result += part.text;
  }
  return result;
}

function getPendingReasoning(): string {
  let result = '';
  for (const part of Object.values(pendingParts.value)) {
    if (part.type === 'reasoning' && part.text) result += part.text;
  }
  return result;
}

function getToolCalls(msg: MessageData): { tool: string; title: string; status: string }[] {
  return (msg.parts || []).filter((p) => p.type === 'tool').map((p) => ({
    tool: p.tool || '',
    title: p.state?.title || p.tool || '',
    status: p.state?.status || 'pending',
  }));
}

async function createSession() {
  try {
    const resp = await fetch(`${serverUrl.value}/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '业务测绘对话' }),
    });
    if (!resp.ok) return;
    const data = await resp.json();
    sessionId.value = data.id;
  } catch {
    connected.value = false;
  }
}

async function loadMessages() {
  if (!sessionId.value) return;
  try {
    const resp = await fetch(`${serverUrl.value}/session/${sessionId.value}/message`);
    if (!resp.ok) return;
    const data = await resp.json();
    messages.value = data || [];
  } catch { /* ignore */ }
}

async function sendMessage() {
  const text = inputText.value.trim();
  if (!text || !sessionId.value) return;
  inputText.value = '';
  sending.value = true;

  messages.value.push({
    id: `user-${Date.now()}`,
    role: 'user',
    parts: [{ id: `part-${Date.now()}`, type: 'text', text }],
    time: { created: new Date().toISOString() },
  });
  await nextTick();

  abortController = new AbortController();
  try {
    const resp = await fetch(`${serverUrl.value}/session/${sessionId.value}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parts: [{ type: 'text', text }] }),
      signal: abortController.signal,
    });
    if (resp.ok) {
      const msg = await resp.json();
      const info = msg.info || msg;
      if (info && info.id) {
        const idx = messages.value.findIndex((m) => m.id === info.id);
        if (idx >= 0) messages.value[idx] = info;
        else messages.value.push(info);
      }
    }
  } catch {
    /* ignore */
  } finally {
    abortController = null;
  }
}

function stopSending() {
  if (!sessionId.value) return;
  abortController?.abort();
  fetch(`${serverUrl.value}/session/${sessionId.value}/abort`, { method: 'POST' }).catch(() => {});
}

async function connect() {
  pendingParts.value = {};
  messages.value = [];
  sessionId.value = '';
  await checkHealth();
  if (connected.value) {
    connectSSE();
    await createSession();
    if (sessionId.value) {
      await loadMessages();
    }
  }
}

onUnmounted(() => {
  abortController?.abort();
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

    <div class="flex-1 overflow-y-auto p-3 space-y-3">
      <div v-if="!connected" class="flex h-full items-center justify-center">
        <div class="text-center">
          <p class="text-sm text-gray-500">未连接到 CodeChat 服务器</p>
          <p class="mt-1 text-xs text-gray-600">点击「连接」按钮</p>
        </div>
      </div>
      <template v-for="msg in messages" :key="msg.id">
        <div v-if="msg.role === 'user'" class="flex justify-end">
          <div class="max-w-[85%] rounded-lg bg-fuchsia-600/20 px-3 py-2 text-sm text-gray-100">
            <div class="whitespace-pre-wrap break-words">{{ getDisplayText(msg) }}</div>
          </div>
        </div>
        <div v-else class="space-y-2">
          <div v-if="getReasoningText(msg)" class="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-300/70">
            <div class="mb-1 text-xs text-amber-400/50">思考</div>
            <div class="whitespace-pre-wrap break-words">{{ getReasoningText(msg) }}</div>
          </div>
          <div class="rounded-lg bg-gray-800/50 px-3 py-2 text-sm text-gray-200">
            <div class="whitespace-pre-wrap break-words">{{ getDisplayText(msg) }}</div>
          </div>
          <div v-if="getToolCalls(msg).length > 0" class="space-y-1">
            <div
              v-for="tc in getToolCalls(msg)"
              :key="tc.tool"
              class="flex items-center gap-2 rounded bg-gray-800/30 px-2 py-1 text-xs text-gray-400"
            >
              <span class="size-2 rounded-full" :class="tc.status === 'completed' ? 'bg-green-500' : tc.status === 'running' ? 'bg-yellow-500' : 'bg-gray-500'" />
              {{ tc.title }}
            </div>
          </div>
        </div>
      </template>
      <div v-if="sending" class="space-y-2">
        <div v-if="getPendingReasoning()" class="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-300/70">
          <div class="mb-1 text-xs text-amber-400/50">思考</div>
          <div class="whitespace-pre-wrap break-words">{{ getPendingReasoning() }}</div>
        </div>
        <div class="rounded-lg bg-gray-800/50 px-3 py-2 text-sm text-gray-200">
          <div class="whitespace-pre-wrap break-words">{{ getPendingText() || '...' }}</div>
        </div>
      </div>
    </div>

    <div class="border-t border-gray-700/50 p-3">
      <div class="flex items-end gap-2">
        <textarea
          v-model="inputText"
          class="flex-1 resize-none rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-gray-200 outline-none placeholder:text-gray-500 focus:border-fuchsia-500/50"
          placeholder="输入消息..."
          :disabled="!connected || !sessionId"
          rows="2"
          @keydown.enter.prevent="!sending && sendMessage()"
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
          class="rounded-lg bg-fuchsia-600/20 px-3 py-2 text-sm text-fuchsia-400 hover:bg-fuchsia-600/30 disabled:opacity-30"
          :disabled="!connected || !sessionId || !inputText.trim()"
          @click="sendMessage"
        >
          发送
        </button>
      </div>
    </div>
  </div>
</template>