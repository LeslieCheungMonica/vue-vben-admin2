<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, shallowRef, triggerRef } from 'vue';

import { webServerSendMsgApi, webServerStartApi, webServerStatusApi } from '#/api/core/resource';

interface PartState {
  id: string;
  sessionId: string;
  type: 'text' | 'reasoning' | 'tool' | 'step';
  text: string;
  toolName?: string;
  updatedAt: number;
}

interface MessageData {
  id: string;
  role: 'user' | 'assistant';
  parts: { id: string; type: string; text?: string }[];
  time: { created?: string };
}

const props = defineProps<{ systemId?: string }>();
const connected = ref(false);
const messages = ref<MessageData[]>([]);
const inputText = ref('');
const sending = ref(false);

let statusTimer: ReturnType<typeof setInterval> | null = null;
let eventSource: EventSource | null = null;
let flushTimer: ReturnType<typeof setInterval> | null = null;

const FLUSH_INTERVAL = 150;
const displayItems = shallowRef<PartState[]>([]);
const partsMap = new Map<string, PartState>();
const dirtyParts = new Set<string>();

const mergedDisplayItems = computed(() => {
  const result: (PartState | { type: 'merged-reasoning'; texts: string[] })[] = [];
  let current: { type: 'merged-reasoning'; texts: string[] } | null = null;
  for (const item of displayItems.value) {
    if (item.type === 'reasoning') {
      if (!item.text.trim()) continue;
      if (current) {
        current.texts.push(item.text.replace(/<\/?thinking>/g, '').replace(/\n{3,}/g, '\n\n'));
      } else {
        current = { type: 'merged-reasoning', texts: [item.text.replace(/<\/?thinking>/g, '').replace(/\n{3,}/g, '\n\n')] };
        result.push(current);
      }
    } else {
      current = null;
      result.push(item);
    }
  }
  return result;
});

function getAssistantText(): string {
  return displayItems.value
    .filter((p) => p.type === 'text')
    .map((p) => p.text || '')
    .join('');
}

function getReasoningText(): string {
  return displayItems.value
    .filter((p) => p.type === 'reasoning')
    .map((p) => p.text || '')
    .join('\n');
}

function getDisplayText(msg: MessageData): string {
  return (msg.parts || []).filter((p) => p.type === 'text').map((p) => p.text || '').join('\n');
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
  const propsData = data.properties || {};

  if (type === 'message.part.delta' && propsData.field === 'text') {
    const partId = propsData.partID;
    if (!partId) return;
    const part = getOrCreatePart(partId, propsData.sessionID, 'text');
    part.text += propsData.delta || '';
    part.updatedAt = Date.now();
    dirtyParts.add(partId);
    return;
  }

  if (type === 'message.part.updated') {
    const partData = propsData.part || {};
    const partId = partData.id || propsData.partID;
    if (!partId) return;
    const partType: string = partData.type || 'text';
    const part = getOrCreatePart(partId, propsData.sessionID, partType as PartState['type']);
    if (partType === 'reasoning') {
      part.type = 'reasoning';
      part.text = partData.text || part.text;
    } else if (partType === 'text') {
      part.type = 'text';
      part.text = partData.text || part.text;
    } else if (partType === 'tool') {
      part.type = 'tool';
      part.toolName = partData.tool;
      part.text = partData.state?.title || partData.tool || '';
    }
    part.updatedAt = Date.now();
    dirtyParts.add(partId);
    return;
  }

  if (type === 'session.status') {
    if (propsData.status?.type === 'idle') {
      sending.value = false;
    }
    return;
  }
}

function flushBuffer() {
  if (dirtyParts.size === 0) return;
  for (const id of dirtyParts) {
    const part = partsMap.get(id);
    if (!part) continue;
    const existingIdx = displayItems.value.findIndex((d) => d.id === id);
    if (existingIdx >= 0) {
      displayItems.value[existingIdx] = { ...part };
    } else {
      displayItems.value.push({ ...part });
    }
  }
  dirtyParts.clear();
  triggerRef(displayItems);
}

function connectEventStream() {
  if (eventSource) { eventSource.close(); eventSource = null; }
  partsMap.clear();
  dirtyParts.clear();
  displayItems.value = [];

  flushTimer = setInterval(flushBuffer, FLUSH_INTERVAL);

  const url = `/api/wape/event_stream/web_${props.systemId}`;
  eventSource = new EventSource(url);
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      processEvent(data);
    } catch { /* ignore */ }
  };
}

async function sendMessage() {
  const text = inputText.value.trim();
  if (!text || !connected.value) return;
  inputText.value = '';
  sending.value = true;

  partsMap.clear();
  dirtyParts.clear();
  displayItems.value = [];

  messages.value.push({
    id: `user-${Date.now()}`,
    role: 'user',
    parts: [{ id: `part-${Date.now()}`, type: 'text', text }],
    time: { created: new Date().toISOString() },
  });
  await nextTick();

  // 不等待返回值，直接触发消息发送，事件从 /wape/event_stream 流式获取
  webServerSendMsgApi(props.systemId || '', text).catch(() => {});
}

function stopSending() {
  sending.value = false;
}

statusTimer = setInterval(checkStatus, 3000);
checkStatus();

onUnmounted(() => {
  if (statusTimer) { clearInterval(statusTimer); statusTimer = null; }
  if (flushTimer) { clearInterval(flushTimer); flushTimer = null; }
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
          <div class="max-w-[85%] rounded-lg bg-fuchsia-600/20 px-3 py-2 text-sm text-gray-100">
            <div class="whitespace-pre-wrap break-words">{{ getDisplayText(msg) }}</div>
          </div>
        </div>
      </template>
      <div v-if="sending || getAssistantText() || getReasoningText()" class="flex justify-start">
        <div class="max-w-[85%] space-y-2">
          <div
            v-if="getReasoningText()"
            class="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-300/70"
          >
            <div class="mb-1 text-xs text-amber-400/50">思考</div>
            <div class="whitespace-pre-wrap break-words">{{ getReasoningText() }}</div>
          </div>
          <div class="rounded-lg bg-gray-800/50 px-3 py-2 text-sm text-gray-200">
            <div class="whitespace-pre-wrap break-words">{{ getAssistantText() || '...' }}</div>
          </div>
        </div>
      </div>
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
          class="rounded-lg bg-fuchsia-600/20 px-3 py-2 text-sm text-fuchsia-400 hover:bg-fuchsia-600/30 disabled:opacity-30"
          :disabled="!connected || !inputText.trim()"
          @click="sendMessage"
        >
          发送
        </button>
      </div>
    </div>
  </div>
</template>