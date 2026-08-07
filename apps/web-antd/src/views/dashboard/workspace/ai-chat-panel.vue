<script setup lang="ts">
import { nextTick, onUnmounted, ref } from 'vue';

import { webServerSendMsgAsyncApi, webServerStartApi, webServerStatusApi } from '#/api/core/resource';

interface Part {
  id: string;
  type: string;
  text?: string;
}

interface MessageData {
  id: string;
  role: 'user' | 'assistant';
  parts: Part[];
  time: { created?: string };
}

const props = defineProps<{ systemId?: string }>();
const connected = ref(false);
const messages = ref<MessageData[]>([]);
const inputText = ref('');
const sending = ref(false);

const MAX_HISTORY = 100;

function trimHistory() {
  if (messages.value.length > MAX_HISTORY) {
    messages.value = messages.value.slice(-MAX_HISTORY);
  }
}

let statusTimer: ReturnType<typeof setInterval> | null = null;
let eventSource: EventSource | null = null;
let currentAssistantId = '';
let currentPartId = '';
let currentReasoningId = '';

function getDisplayText(msg: MessageData): string {
  return (msg.parts || []).filter((p) => p.type === 'text').map((p) => p.text || '').join('\n');
}

function getReasoningText(msg: MessageData): string {
  return (msg.parts || []).filter((p) => p.type === 'reasoning').map((p) => p.text || '').join('\n');
}

function updateAssistant(patch: Partial<MessageData>) {
  const idx = messages.value.findIndex((m) => m.id === currentAssistantId);
  if (idx >= 0) {
    messages.value[idx] = { ...messages.value[idx], ...patch };
  }
}

function getOrCreateTextPart() {
  const idx = messages.value.findIndex((m) => m.id === currentAssistantId);
  if (idx < 0) return;
  const msg = messages.value[idx];
  let part = msg.parts.find((p) => p.id === currentPartId);
  if (!part) {
    part = { id: currentPartId, type: 'text', text: '' };
    updateAssistant({ parts: [...msg.parts, part] });
  }
  return part;
}

function getOrCreateReasoningPart() {
  const idx = messages.value.findIndex((m) => m.id === currentAssistantId);
  if (idx < 0) return;
  const msg = messages.value[idx];
  let part = msg.parts.find((p) => p.id === currentReasoningId);
  if (!part) {
    part = { id: currentReasoningId, type: 'reasoning', text: '' };
    updateAssistant({ parts: [...msg.parts, part] });
  }
  return part;
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

  if (type === 'message.part.delta' && propsData.field === 'text') {
    const partId = propsData.partID;
    if (!partId || !currentAssistantId) return;
    currentPartId = partId;
    const part = getOrCreateTextPart();
    if (part) {
      part.text = (part.text || '') + (propsData.delta || '');
      const idx = messages.value.findIndex((m) => m.id === currentAssistantId);
      if (idx >= 0) {
        const parts = messages.value[idx].parts.map((p) =>
          p.id === part.id ? { ...p, text: part.text } : p,
        );
        updateAssistant({ parts });
      }
    }
    return;
  }

  if (type === 'message.part.updated') {
    const partData = propsData.part || {};
    const partId = partData.id || propsData.partID;
    const partType: string = partData.type || '';
    if (!currentAssistantId || !partId) return;

    if (partType === 'text') {
      currentPartId = partId;
      const idx = messages.value.findIndex((m) => m.id === currentAssistantId);
      if (idx >= 0) {
        const parts = messages.value[idx].parts.map((p) =>
          p.id === partId ? { ...p, type: 'text', text: partData.text || p.text } : p,
        );
        if (!parts.some((p) => p.id === partId)) {
          parts.push({ id: partId, type: 'text', text: partData.text || '' });
        }
        updateAssistant({ parts });
      }
    } else if (partType === 'reasoning') {
      currentReasoningId = partId;
      const idx = messages.value.findIndex((m) => m.id === currentAssistantId);
      if (idx >= 0) {
        const parts = messages.value[idx].parts.map((p) =>
          p.id === partId ? { ...p, type: 'reasoning', text: partData.text || p.text } : p,
        );
        if (!parts.some((p) => p.id === partId)) {
          parts.push({ id: partId, type: 'reasoning', text: partData.text || '' });
        }
        updateAssistant({ parts });
      }
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
    time: { created: new Date().toISOString() },
  });

  currentAssistantId = `assistant-${Date.now()}`;
  currentPartId = '';
  currentReasoningId = '';
  messages.value.push({
    id: currentAssistantId,
    role: 'assistant',
    parts: [],
    time: { created: new Date().toISOString() },
  });
  trimHistory();
  await nextTick();

  // 不等待返回值，直接触发消息发送，事件从 /wape/event_stream 流式获取
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

    <div class="flex-1 overflow-y-auto p-3 space-y-3">
      <div v-if="!connected" class="flex h-full items-center justify-center">
        <div class="text-center">
          <p class="text-sm text-gray-500">未连接到 CodeChat 服务器</p>
          <p class="mt-1 text-xs text-gray-600">等待服务启动...</p>
        </div>
      </div>
      <template v-for="msg in messages" :key="msg.id">
        <div v-if="msg.role === 'user'" class="flex justify-end">
          <div class="max-w-[85%] rounded-lg bg-fuchsia-600/20 px-3 py-2 text-xs text-gray-100">
            <div class="whitespace-pre-wrap break-words">{{ getDisplayText(msg) }}</div>
          </div>
        </div>
        <div v-else-if="getDisplayText(msg) || getReasoningText(msg) || msg.id === currentAssistantId" class="flex justify-start">
          <div class="max-w-[85%] space-y-2">
            <div
              v-if="getReasoningText(msg)"
              class="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-300/70"
            >
              <div class="mb-1 text-[10px] text-amber-400/50">思考</div>
              <div class="whitespace-pre-wrap break-words">{{ getReasoningText(msg) }}</div>
            </div>
            <div class="rounded-lg bg-gray-800/50 px-3 py-2 text-xs text-gray-200">
              <div class="whitespace-pre-wrap break-words">{{ getDisplayText(msg) || '...' }}</div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <div class="border-t border-gray-700/50 p-3">
      <div class="flex items-end gap-2">
        <textarea
          v-model="inputText"
          class="flex-1 resize-none rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-gray-200 outline-none placeholder:text-gray-500 focus:border-fuchsia-500/50"
          placeholder="输入消息..."
          :disabled="!connected"
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