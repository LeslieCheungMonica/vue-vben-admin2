<script lang="ts" setup>
import { nextTick, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Button, Card, Input, Tag, message } from 'ant-design-vue';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';

import { chatSyncApi } from '#/api/core/sensitive-agent';

import 'highlight.js/styles/github-dark.css';

interface StepItem {
  type: 'thinking' | 'analysis' | 'data';
  content: string;
  done: boolean;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  steps: StepItem[];
  timestamp: string;
}

const md = new MarkdownIt({
  highlight: function (str: string, lang: string) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value;
      } catch {
        /* ignore */
      }
    }
    return '';
  },
  html: false,
  linkify: true,
  breaks: true,
});

const chatAreaRef = ref<HTMLElement | null>(null);
const inputMessage = ref('');
const streaming = ref(false);
const messages = ref<ChatMessage[]>([]);

const quickQuestions = [
  '今天数据情况如何？',
  '有哪些高危接口？',
  '敏感信息分布情况？',
  '生成安全建议',
];

const renderMarkdown = (content: string) => {
  return md.render(content || '');
};

const scrollToBottom = () => {
  nextTick(() => {
    if (chatAreaRef.value) {
      chatAreaRef.value.scrollTop = chatAreaRef.value.scrollHeight;
    }
  });
};

const handleQuickQuestion = (question: string) => {
  inputMessage.value = question;
  handleSend();
};

const ensureStep = (
  msgIndex: number,
  type: 'thinking' | 'analysis' | 'data',
): StepItem => {
  const steps = messages.value[msgIndex]!.steps;
  const last = steps.length > 0 ? steps[steps.length - 1] : null;

  if (last && last.type === type && !last.done) {
    return last;
  }

  if (last && !last.done) {
    last.done = true;
  }

  const newStep: StepItem = { type, content: '', done: false };
  steps.push(newStep);
  scrollToBottom();
  return newStep;
};

const handleSend = async () => {
  const msg = inputMessage.value.trim();
  if (!msg || streaming.value) return;

  // Add user message
  messages.value.push({
    role: 'user',
    content: msg,
    steps: [],
    timestamp: new Date().toISOString(),
  });
  inputMessage.value = '';
  scrollToBottom();
  streaming.value = true;

  // Create assistant message placeholder
  const assistantMsg: ChatMessage = {
    role: 'assistant',
    content: '',
    steps: [],
    timestamp: new Date().toISOString(),
  };
  messages.value.push(assistantMsg);
  const msgIndex = messages.value.length - 1;
  scrollToBottom();

  try {
    // SSE streaming — POST to agent/chat
    const response = await fetch('/api/native-security/agent/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: msg }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data:')) {
          const jsonStr = line.substring(5).trim();
          if (!jsonStr) continue;

          try {
            const step = JSON.parse(jsonStr);

            if (step.type === 'thinking') {
              const s = ensureStep(msgIndex, 'thinking');
              s.content = step.content;
              scrollToBottom();
            } else if (step.type === 'analysis') {
              const steps = messages.value[msgIndex]!.steps;
              const last =
                steps.length > 0 ? steps[steps.length - 1] : null;
              if (last && !last.done) last.done = true;

              const s: StepItem = {
                type: 'analysis',
                content: step.content,
                done: false,
              };
              steps.push(s);
              scrollToBottom();
            } else if (step.type === 'data') {
              const steps = messages.value[msgIndex]!.steps;
              const last =
                steps.length > 0 ? steps[steps.length - 1] : null;
              if (last && !last.done) last.done = true;

              const s: StepItem = {
                type: 'data',
                content: step.content,
                done: false,
              };
              steps.push(s);
              scrollToBottom();
            } else if (step.type === 'answer') {
              for (const s of messages.value[msgIndex]!.steps) {
                s.done = true;
              }
              messages.value[msgIndex]!.content = step.content;
              scrollToBottom();
            } else if (step.type === 'done') {
              for (const s of messages.value[msgIndex]!.steps) {
                s.done = true;
              }
            }
          } catch {
            // Not valid JSON, skip
          }
        }
      }
    }
  } catch (sseError) {
    console.warn('SSE failed, falling back to sync chat:', sseError);

    try {
      const res = await chatSyncApi({ message: msg });
      const content =
        typeof res === 'string' ? res : res.answer || JSON.stringify(res);
      messages.value[msgIndex]!.content = content;
    } catch {
      messages.value[msgIndex]!.content =
        '抱歉，请求处理失败，请稍后重试。';
    }
  } finally {
    for (const s of messages.value[msgIndex]!.steps) {
      s.done = true;
    }
    streaming.value = false;
    scrollToBottom();
  }
};

onMounted(() => {
  scrollToBottom();
});
</script>

<template>
  <Page description="智能安全助手，支持多轮分析" title="AI 助手">
    <div class="flex h-[calc(100vh-200px)] flex-col overflow-hidden rounded-xl border">
      <!-- Chat Messages Area -->
      <div
        ref="chatAreaRef"
        class="flex-1 overflow-y-auto p-6"
      >
        <!-- Welcome Message -->
        <div v-if="messages.length === 0" class="py-12 text-center">
          <div
            class="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-red-500/10"
          >
            <span class="text-4xl">🤖</span>
          </div>
          <h2 class="mb-2 text-xl font-semibold">智能安全助手</h2>
          <p class="text-sm text-gray-400">
            我可以帮助您分析敏感信息检测数据、查询风险状况、生成安全建议
          </p>
          <p class="mt-1 text-xs text-gray-500">
            支持自动多轮分析与推理，逐步为您完成复杂任务
          </p>

          <div class="mt-7 flex flex-wrap justify-center gap-3">
            <div
              v-for="q in quickQuestions"
              :key="q"
              class="cursor-pointer rounded-full border px-4 py-2 text-xs text-gray-400 transition-all hover:border-red-500 hover:text-red-500"
              @click="handleQuickQuestion(q)"
            >
              {{ q }}
            </div>
          </div>
        </div>

        <!-- Message List -->
        <div
          v-for="(msg, index) in messages"
          :key="index"
          :class="[
            'mb-5 flex gap-3',
            msg.role === 'user' ? 'flex-row-reverse' : '',
          ]"
        >
          <!-- Avatar -->
          <div
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-card"
          >
            <span v-if="msg.role === 'user'" class="text-base">👤</span>
            <span v-else class="text-base">🤖</span>
          </div>

          <!-- Message Content -->
          <div class="min-w-[200px] max-w-[75%]">
            <!-- User message -->
            <template v-if="msg.role === 'user'">
              <div
                class="rounded-xl border border-blue-500/15 bg-primary/5 px-4 py-3 text-sm leading-relaxed"
              >
                {{ msg.content }}
              </div>
            </template>

            <!-- Assistant message -->
            <template v-else>
              <!-- Auto Process Timeline -->
              <div v-if="msg.steps && msg.steps.length" class="mb-3 flex flex-col gap-2">
                <div
                  v-for="(step, si) in msg.steps"
                  :key="si"
                  :class="[
                    'rounded-xl border p-3 transition-all',
                    step.done
                      ? 'border-green-500/15'
                      : 'border-blue-400/40 bg-blue-500/5',
                  ]"
                >
                  <!-- Thinking -->
                  <template v-if="step.type === 'thinking'">
                    <div class="flex items-center gap-2">
                      <span class="text-sm">💭</span>
                      <span
                        class="text-xs font-semibold tracking-wide text-gray-400"
                      >思考</span>
                      <span
                        v-if="!step.done"
                        class="ml-auto h-3 w-3 animate-spin rounded-full border-2 border-blue-400/20 border-t-blue-400"
                      ></span>
                      <span v-else class="ml-auto text-sm text-green-500">✓</span>
                    </div>
                    <div
                      v-if="step.content"
                      class="mt-1 rounded-md bg-red-500/5 px-2.5 py-1.5 text-xs leading-relaxed text-gray-400"
                    >
                      {{ step.content }}
                    </div>
                  </template>

                  <!-- Analysis / Tool Call -->
                  <template v-else-if="step.type === 'analysis'">
                    <div class="flex items-center gap-2">
                      <span class="text-sm">🔧</span>
                      <span
                        class="text-xs font-semibold tracking-wide text-gray-400"
                      >调用工具</span>
                      <span
                        v-if="!step.done"
                        class="ml-auto h-3 w-3 animate-spin rounded-full border-2 border-blue-400/20 border-t-blue-400"
                      ></span>
                      <span v-else class="ml-auto text-sm text-green-500">✓</span>
                    </div>
                    <div
                      v-if="step.content"
                      class="mt-1 rounded-md bg-blue-500/5 px-2.5 py-1.5 text-xs font-medium leading-relaxed text-blue-400"
                    >
                      {{ step.content }}
                    </div>
                  </template>

                  <!-- Data / Observation -->
                  <template v-else-if="step.type === 'data'">
                    <div class="flex items-center gap-2">
                      <span class="text-sm">👁️</span>
                      <span
                        class="text-xs font-semibold tracking-wide text-gray-400"
                      >观察结果</span>
                      <span
                        v-if="!step.done"
                        class="ml-auto h-3 w-3 animate-spin rounded-full border-2 border-blue-400/20 border-t-blue-400"
                      ></span>
                      <span v-else class="ml-auto text-sm text-green-500">✓</span>
                    </div>
                    <div
                      v-if="step.content"
                      class="mt-1 max-h-[150px] overflow-y-auto rounded-md border border-green-500/10 bg-card p-2 text-xs leading-relaxed text-gray-400"
                    >
                      <pre class="whitespace-pre-wrap break-words">{{ step.content }}</pre>
                    </div>
                  </template>
                </div>
              </div>

              <!-- Final Answer -->
              <div v-if="msg.content">
                <div
                  class="mb-2 flex items-center gap-1.5 text-xs font-semibold text-red-500"
                >
                  <span>🎯</span>
                  <span>最终结果</span>
                </div>
                <div
                  class="agent-markdown rounded-xl border border-red-500/10 bg-card px-4 py-3 text-sm leading-relaxed"
                  v-html="renderMarkdown(msg.content)"
                ></div>
              </div>
            </template>
          </div>
        </div>

        <!-- Streaming Indicator -->
        <div
          v-if="streaming && messages[messages.length - 1]?.role === 'user'"
          class="mb-5 flex gap-3"
        >
          <div
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-card"
          >
            <span class="text-base">🤖</span>
          </div>
          <div class="flex items-center gap-1 py-4">
            <span class="h-2 w-2 animate-pulse rounded-full bg-red-500"></span>
            <span
              class="h-2 w-2 animate-pulse rounded-full bg-red-500"
              style="animation-delay: 0.2s"
            ></span>
            <span
              class="h-2 w-2 animate-pulse rounded-full bg-red-500"
              style="animation-delay: 0.4s"
            ></span>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="border-t bg-card p-4">
        <div class="mb-3 flex flex-wrap gap-2">
          <Tag
            v-for="q in quickQuestions"
            :key="q"
            class="cursor-pointer hover:!border-red-500 hover:!text-red-500"
            @click="handleQuickQuestion(q)"
          >
            {{ q }}
          </Tag>
        </div>
        <div class="flex gap-3">
          <Input
            v-model:value="inputMessage"
            placeholder="输入您的问题，智能体将自动多轮分析..."
            :disabled="streaming"
            size="large"
            class="flex-1"
            @press-enter="handleSend"
          />
          <Button
            type="primary"
            :disabled="!inputMessage.trim() || streaming"
            :loading="streaming"
            size="large"
            @click="handleSend"
          >
            发送
          </Button>
        </div>
      </div>
    </div>
  </Page>
</template>

<style scoped>
.agent-markdown :deep(p) {
  margin: 0 0 8px;
}

.agent-markdown :deep(p:last-child) {
  margin-bottom: 0;
}

.agent-markdown :deep(code) {
  background: rgba(233, 69, 96, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
}

.agent-markdown :deep(pre) {
  background: var(--component-bg, #1a1a2e);
  border: 1px solid rgba(233, 69, 96, 0.08);
  border-radius: 8px;
  padding: 12px;
  overflow-x: auto;
}

.agent-markdown :deep(pre code) {
  background: transparent;
  padding: 0;
}

.agent-markdown :deep(ul),
.agent-markdown :deep(ol) {
  padding-left: 20px;
}

.agent-markdown :deep(table) {
  border-collapse: collapse;
  width: 100%;
}

.agent-markdown :deep(th),
.agent-markdown :deep(td) {
  border: 1px solid rgba(233, 69, 96, 0.1);
  padding: 8px 12px;
  text-align: left;
}

.agent-markdown :deep(th) {
  background: rgba(233, 69, 96, 0.05);
}
</style>
