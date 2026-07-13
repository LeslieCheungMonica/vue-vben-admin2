<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Button, Checkbox, Input, Select, Tag } from 'ant-design-vue';

import { getCommonVulnListApi } from '#/api/core/task';
import type { AuthVulnItem } from '#/api/core/task';

const route = useRoute();
const taskId = route.params.taskId as string;

const keyword = ref('');
const severityFilter = ref<string>('all');
const vulnTypeFilter = ref<string>('auth');
const vulnList = ref<AuthVulnItem[]>([]);
const loading = ref(false);
const selectedVuln = ref<AuthVulnItem | null>(null);
const selectedIds = ref<Set<number>>(new Set());
const page = ref(1);
const pageSize = 10;

const pagedList = computed(() => {
  const start = (page.value - 1) * pageSize;
  return filteredList.value.slice(start, start + pageSize);
});

const totalPages = computed(() => Math.ceil(filteredList.value.length / pageSize));

function goPage(p: number) {
  if (p < 1 || p > totalPages.value) return;
  page.value = p;
}

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

const severityOptions = [
  { label: '全部风险等级', value: 'all' },
  { label: '高危', value: 'high' },
  { label: '中危', value: 'medium' },
  { label: '低危', value: 'low' },
];

const vulnTypeOptions = [
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
  if (severityFilter.value !== 'all') {
    list = list.filter((v) => v.severity === severityFilter.value);
  }
  return list;
});

const severityColorMap: Record<string, string> = {
  critical: 'red',
  high: 'orange',
  medium: 'gold',
  low: 'green',
};

const severityLabelMap: Record<string, string> = {
  critical: '严重',
  high: '高危',
  medium: '中危',
  low: '低危',
};

async function fetchVulns() {
  loading.value = true;
  try {
    const res = await getCommonVulnListApi(taskId, vulnTypeFilter.value);
    vulnList.value = res.items ?? [];
    if (vulnList.value.length > 0) {
      selectedVuln.value = vulnList.value[0];
    } else {
      selectedVuln.value = null;
    }
  } catch {
    vulnList.value = [];
    selectedVuln.value = null;
  } finally {
    loading.value = false;
  }
}

function selectVuln(vuln: AuthVulnItem) {
  selectedVuln.value = vuln;
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
            {{ filteredList.length }}
          </span>
          <Checkbox
            :checked="isAllSelected"
            class="ml-2"
            @change="toggleSelectAll"
          />
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
              v-model:value="severityFilter"
              :options="severityOptions"
              class="w-[130px]"
              size="small"
            />
            <Select
              v-model:value="vulnTypeFilter"
              :options="vulnTypeOptions"
              class="w-[110px]"
              size="small"
            />
            <Button type="primary" ghost size="small" class="ml-auto" @click="fetchVulns">
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
            v-for="vuln in pagedList"
            :key="vuln.id"
            class="cursor-pointer border-b border-gray-50 px-4 py-3 transition-all hover:bg-blue-50/60"
            :class="{
              'border-l-2 border-l-blue-500 bg-blue-50/80': selectedVuln?.id === vuln.id,
            }"
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
                  <Tag
                    :color="severityColorMap[vuln.severity] || 'default'"
                    class="flex-shrink-0 !m-0 !text-[11px] !px-2 !py-0 !rounded-md !border-0"
                  >
                    {{ severityLabelMap[vuln.severity] || vuln.severity }}
                  </Tag>
                </div>
                <div class="mt-1.5 flex items-center gap-2 text-xs text-gray-400">
                  <span class="font-mono">{{ vuln.vuln_id }}</span>
                  <span class="text-gray-300">|</span>
                  <span>{{ vuln.create_time }}</span>
                  <span
                    v-if="vuln.vuln_type"
                    class="rounded-md bg-gray-100 px-1.5 py-0.5 font-mono text-gray-500"
                  >
                    {{ vuln.vuln_type }}
                  </span>
                </div>
                <div
                  v-if="vuln.vuln_detail"
                  class="mt-1.5 line-clamp-2 text-xs leading-relaxed text-gray-500"
                >
                  {{ vuln.vuln_detail }}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          v-if="totalPages > 1"
          class="flex items-center justify-between border-t border-gray-100 px-3 py-2 text-xs text-gray-500"
        >
          <span>共 {{ filteredList.length }} 条</span>
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
            <Tag
              :color="severityColorMap[selectedVuln.severity] || 'default'"
              class="!m-0 !text-xs !px-2.5 !py-0.5 !rounded-md !border-0"
            >
              {{ severityLabelMap[selectedVuln.severity] || selectedVuln.severity }}
            </Tag>
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
          <div class="flex-1 overflow-y-auto p-5 text-sm">
            <div class="space-y-5">
              <div v-if="selectedVuln.vuln_detail">
                <div
                  class="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400"
                >
                  <span>📋</span>
                  <span>漏洞详情</span>
                </div>
                <div
                  class="rounded-lg bg-gray-50 p-4 text-sm leading-relaxed text-gray-700"
                >
                  {{ selectedVuln.vuln_detail }}
                </div>
              </div>

              <div v-if="selectedVuln.location">
                <div
                  class="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400"
                >
                  <span>📍</span>
                  <span>漏洞位置</span>
                </div>
                <div
                  class="rounded-lg bg-gray-50 p-3 font-mono text-xs text-gray-600"
                >
                  {{ selectedVuln.location }}
                </div>
              </div>

              <div v-if="selectedVuln.impact">
                <div
                  class="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400"
                >
                  <span>💥</span>
                  <span>影响</span>
                </div>
                <div class="rounded-lg bg-orange-50 p-3 text-sm text-orange-800">
                  {{ selectedVuln.impact }}
                </div>
              </div>

              <div v-if="selectedVuln.prerequisites">
                <div
                  class="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400"
                >
                  <span>🔐</span>
                  <span>前置条件</span>
                </div>
                <div class="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                  {{ selectedVuln.prerequisites }}
                </div>
              </div>

              <div v-if="selectedVuln.exploit_steps">
                <div
                  class="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400"
                >
                  <span>⚡</span>
                  <span>利用步骤</span>
                </div>
                <div
                  class="rounded-lg bg-gray-50 p-4 text-sm leading-relaxed"
                >
                  <div
                    v-for="(line, idx) in selectedVuln.exploit_steps.split(
                      /(?:\n|;)/,
                    )"
                    :key="idx"
                    v-show="line.trim()"
                    class="mb-2 flex items-start gap-2.5 last:mb-0"
                  >
                    <span
                      class="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-medium text-blue-600"
                    >
                      {{ idx + 1 }}
                    </span>
                    <span class="pt-0.5 text-gray-700">{{ line.trim() }}</span>
                  </div>
                </div>
              </div>

              <div v-if="selectedVuln.evidence">
                <div
                  class="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400"
                >
                  <span>✅</span>
                  <span>证据</span>
                </div>
                <div
                  class="rounded-lg border border-green-200 bg-green-50 p-3 font-mono text-xs leading-relaxed text-green-700"
                >
                  {{ selectedVuln.evidence }}
                </div>
              </div>
            </div>
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

      <!-- Right: Placeholder -->
      <div
        class="flex w-[320px] flex-shrink-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
      >
        <div
          class="flex items-center gap-2 border-b border-gray-100 px-4 py-3"
        >
          <div
            class="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-sm"
          >
            📎
          </div>
          <span class="text-sm font-semibold text-gray-800">补充信息</span>
        </div>
        <div
          class="flex flex-1 items-center justify-center text-sm text-gray-400"
        >
          <div class="flex flex-col items-center gap-1">
            <span class="text-2xl">📄</span>
            <span>暂无数据</span>
          </div>
        </div>
      </div>
    </div>
  </Page>
</template>
