<script lang="ts" setup>
import { nextTick, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Input,
  Modal,
  Table,
  type TableColumnType,
  Tag,
} from 'ant-design-vue';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';

import {
  chatSyncApi,
  type SensitiveAgentApi,
} from '#/api/core/sensitive-agent';
import {
  getRiskLevelColor,
  getRiskLevelName,
  getSensitiveTypeName,
} from '#/views/sensitive/utils/mapping';

import 'highlight.js/styles/github-dark.css';

type RiskInterfaceItem = SensitiveAgentApi.RiskInterfaceItem;
type StructuredRiskData = SensitiveAgentApi.StructuredRiskData;

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
  structuredData?: StructuredRiskData;
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

// AI scan demo modal state
const scanModalVisible = ref(false);
const scanLoading = ref(false);
const scanRecord = ref<RiskInterfaceItem | null>(null);
const scanStepIndex = ref(0);

const scanSteps = [
  { icon: '🔍', title: '关联代码定位', desc: '根据泄露接口路由定位源代码模块' },
  { icon: '🔎', title: '漏洞侦查', desc: '扫描接口认证、授权、注入等漏洞' },
  { icon: '⚔️', title: '渗透攻击测试', desc: '模拟攻击验证漏洞可利用性' },
  { icon: '📋', title: '生成渗透报告', desc: '汇总漏洞详情与修复建议' },
];

const quickQuestions = [
  '今天数据情况如何？',
  '有哪些高危接口？',
  '敏感信息分布情况？',
  '生成安全建议',
];

const riskTableColumns: TableColumnType<RiskInterfaceItem>[] = [
  { title: '接口名称', dataIndex: 'serviceName', key: 'serviceName', width: 180 },
  { title: '路由', dataIndex: 'serviceRoute', key: 'serviceRoute', width: 200 },
  { title: '风险等级', dataIndex: 'riskLevel', key: 'riskLevel', width: 90 },
  { title: '风险分', dataIndex: 'riskScore', key: 'riskScore', width: 80 },
  { title: '敏感类型', dataIndex: 'sensitiveTypes', key: 'sensitiveTypes', width: 200 },
  { title: '检测次数', dataIndex: 'detectCount', key: 'detectCount', width: 80 },
  { title: '操作', key: 'action', width: 130, fixed: 'right' },
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

async function handleAiScan(record: RiskInterfaceItem) {
  scanRecord.value = record;
  scanModalVisible.value = true;
  scanLoading.value = true;
  scanStepIndex.value = 0;

  // Simulate step-by-step scan process
  for (let i = 0; i < scanSteps.length; i++) {
    scanStepIndex.value = i;
    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));
  }
  scanStepIndex.value = scanSteps.length; // all done
  scanLoading.value = false;
}

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
            } else if (step.type === 'structured_data') {
              try {
                const data: StructuredRiskData = JSON.parse(step.content);
                messages.value[msgIndex]!.structuredData = data;
                scrollToBottom();
              } catch {
                // JSON parse error — skip
              }
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

              <!-- Structured Risk Data (仅数据统计类问题) -->
              <div v-if="msg.structuredData" class="mt-4">
                <!-- 风险等级定义 (overview / risk_only / suggestion 时展示) -->
                <div
                  v-if="['overview', 'risk_only', 'suggestion'].includes(msg.structuredData.displayMode)"
                  class="mb-3 flex flex-wrap gap-3 rounded-xl border border-orange-500/15 bg-orange-500/5 px-4 py-3"
                >
                  <span class="text-xs font-semibold text-gray-500">风险等级定义：</span>
                  <span
                    v-for="def in msg.structuredData.riskLevelDefs"
                    :key="def.level"
                    class="flex items-center gap-1"
                  >
                    <Tag :color="def.color">{{ def.name }}</Tag>
                    <span class="text-xs text-gray-400">{{ def.description }}</span>
                  </span>
                </div>

                <!-- 敏感类型分布 (type_dist 模式) -->
                <template v-if="msg.structuredData.displayMode === 'type_dist'">
                  <div
                    class="mb-1 flex items-center gap-1.5 text-xs font-semibold text-blue-500"
                  >
                    <span>📊</span>
                    <span>敏感信息类型分布</span>
                  </div>
                  <div class="rounded-xl border border-blue-500/10 bg-card px-4 py-3">
                    <div class="flex flex-col gap-2">
                      <div
                        v-for="item in msg.structuredData.sensitiveTypeDistribution"
                        :key="item.type"
                        class="flex items-center gap-3"
                      >
                        <Tag :color="item.color" class="min-w-[70px] text-center">{{ item.name }}</Tag>
                        <div class="flex-1">
                          <div class="h-4 overflow-hidden rounded-full bg-gray-100">
                            <div
                              class="h-full rounded-full transition-all"
                              :style="{
                                width: Math.max(4, item.count / Math.max(...msg.structuredData.sensitiveTypeDistribution.map(d => d.count)) * 100) + '%',
                                backgroundColor: item.color,
                              }"
                            ></div>
                          </div>
                        </div>
                        <span class="min-w-[40px] text-right text-xs font-semibold text-gray-600">{{ item.count }}次</span>
                      </div>
                    </div>
                  </div>
                </template>

                <!-- 风险接口明细表格 (overview / risk_only / suggestion 时展示) -->
                <template v-if="['overview', 'risk_only', 'suggestion'].includes(msg.structuredData.displayMode) && msg.structuredData.riskInterfaces.length > 0">
                  <div
                    class="mb-1 flex items-center gap-1.5 text-xs font-semibold text-red-500"
                  >
                    <span>📊</span>
                    <span>{{ msg.structuredData.displayMode === 'risk_only' ? '高危风险接口' : msg.structuredData.displayMode === 'suggestion' ? '主要风险接口' : '风险接口明细' }}</span>
                  </div>
                  <div class="rounded-xl border border-red-500/10 bg-card">
                    <Table
                      :columns="riskTableColumns"
                      :data-source="msg.structuredData.riskInterfaces"
                      size="small"
                      :pagination="msg.structuredData.riskInterfaces.length > 5 ? { pageSize: 5, size: 'small' } : false"
                      row-key="id"
                      :scroll="{ x: 800 }"
                    >
                      <template #bodyCell="{ column, record }">
                        <template v-if="column.key === 'riskLevel'">
                          <Tag :color="getRiskLevelColor(record.riskLevel)">
                            {{ getRiskLevelName(record.riskLevel) }}
                          </Tag>
                        </template>
                        <template v-if="column.key === 'sensitiveTypes'">
                          <Tag
                            v-for="t in record.sensitiveTypes.split(',')"
                            :key="t"
                            color="red"
                            class="mr-1 mb-1"
                          >
                            {{ getSensitiveTypeName(t.trim()) }}
                          </Tag>
                        </template>
                        <template v-if="column.key === 'action'">
                          <Button
                            type="link"
                            size="small"
                            @click="handleAiScan(record as RiskInterfaceItem)"
                          >
                            🔍 AI扫描渗透
                          </Button>
                        </template>
                      </template>
                    </Table>
                  </div>
                </template>
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

    <!-- AI Scan Demo Modal -->
    <Modal
      v-model:open="scanModalVisible"
      title="AI 扫描渗透分析"
      :footer="null"
      width="520px"
    >
      <!-- Target info -->
      <div class="mb-4 rounded-lg bg-red-500/5 px-3 py-2">
        <p class="text-xs font-medium text-gray-500">分析目标</p>
        <p class="text-sm font-semibold text-red-500">{{ scanRecord?.serviceName }}</p>
        <p class="text-xs text-gray-400">{{ scanRecord?.serviceRoute }}</p>
        <div class="mt-1 flex flex-wrap gap-1">
          <Tag
            v-for="t in scanRecord?.sensitiveTypes?.split(',')"
            :key="t"
            color="red"
          >
            {{ getSensitiveTypeName(t?.trim() ?? '') }}
          </Tag>
        </div>
      </div>

      <!-- Step progress -->
      <div class="flex flex-col gap-3 py-2">
        <div
          v-for="(step, i) in scanSteps"
          :key="i"
          class="flex items-start gap-3 rounded-lg border p-3 transition-all"
          :class="{
            'border-green-500/20 bg-green-500/5': scanStepIndex > i,
            'border-blue-400/40 bg-blue-500/5': scanStepIndex === i,
            'border-gray-200 bg-transparent': scanStepIndex < i,
          }"
        >
          <span class="mt-0.5 text-lg">{{ step.icon }}</span>
          <div class="flex-1">
            <p class="text-sm font-semibold" :class="scanStepIndex < i ? 'text-gray-400' : 'text-gray-700'">
              {{ step.title }}
            </p>
            <p class="text-xs text-gray-400">{{ step.desc }}</p>
          </div>
          <span
            v-if="scanStepIndex > i"
            class="text-sm text-green-500"
          >✓</span>
          <span
            v-else-if="scanStepIndex === i"
            class="h-4 w-4 animate-spin rounded-full border-2 border-blue-400/20 border-t-blue-400"
          ></span>
        </div>
      </div>

      <!-- Done result -->
      <div v-if="scanStepIndex >= scanSteps.length && !scanLoading" class="mt-2 rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3">
        <p class="mb-1 text-sm font-semibold text-green-600">✅ 渗透分析完成</p>
        <p class="text-xs text-gray-400">已对接口 <b>{{ scanRecord?.serviceName }}</b> 完成关联代码定位与漏洞渗透测试，发现 <b class="text-red-500">{{ scanRecord?.riskLevel === 'CRITICAL' ? 3 : 2 }}</b> 个安全漏洞。</p>
        <div class="mt-3 flex gap-2">
          <Button type="primary" size="small" @click="scanModalVisible = false">
            知道了
          </Button>
        </div>
      </div>
    </Modal>
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
