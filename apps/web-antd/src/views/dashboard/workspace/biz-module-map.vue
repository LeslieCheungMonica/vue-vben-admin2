<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

import { Modal } from 'ant-design-vue';

import { moudles3dApi } from '#/api/core/resource';

const props = defineProps<{ webId: string }>();

interface ModuleInfo {
  name: string;
  path: string;
  purpose: string;
  complexity: string;
  primary_files: string[];
  functions: any[];
  entities: any[];
  business_rules: any[];
  dependencies: string[];
  algorithms: any[];
}

const loading = ref(true);
const errorMsg = ref('');
const modules = ref<ModuleInfo[]>([]);
const search = ref('');
const filter = ref<'all' | 'high' | 'medium' | 'low'>('all');
const selectedModule = ref<ModuleInfo | null>(null);
const detailVisible = ref(false);

const stats = ref({ modules: 0, files: 0, functions: 0, entities: 0, rules: 0 });

const COMPLEXITY_STYLE: Record<string, string> = {
  high: 'bg-red-500/20 text-red-400',
  medium: 'bg-amber-500/20 text-amber-400',
  low: 'bg-emerald-500/20 text-emerald-400',
};

function flattenModules(data: any): any[] {
  const list: any[] = [];
  const collect = (node: any) => {
    if (Array.isArray(node)) {
      node.forEach(collect);
    } else if (node && typeof node === 'object') {
      if (Array.isArray(node.modules)) {
        collect(node.modules);
      } else if (node.name) {
        list.push(node);
      }
    }
  };
  collect(data);
  return list;
}

const visibleModules = computed(() => {
  const kw = search.value.trim().toLowerCase();
  return modules.value.filter((m) => {
    if (filter.value !== 'all' && m.complexity !== filter.value) return false;
    if (kw) {
      const haystack = `${m.name} ${m.path} ${m.purpose}`.toLowerCase();
      if (!haystack.includes(kw)) return false;
    }
    return true;
  });
});

const pageSize = 9;
const page = ref(1);

const totalPages = computed(() =>
  Math.max(1, Math.ceil(visibleModules.value.length / pageSize)),
);

const pagedModules = computed(() => {
  const start = (page.value - 1) * pageSize;
  return visibleModules.value.slice(start, start + pageSize);
});

function goPage(p: number) {
  if (p < 1 || p > totalPages.value) return;
  page.value = p;
}

watch([search, filter], () => {
  page.value = 1;
});

function openDetail(m: ModuleInfo) {
  selectedModule.value = m;
  detailVisible.value = true;
}

function resetFilters() {
  search.value = '';
  filter.value = 'all';
}

async function loadData() {
  loading.value = true;
  errorMsg.value = '';
  try {
    const res = await moudles3dApi(props.webId);
    const mods = flattenModules(res?.modules);
    modules.value = mods;
    const files = mods.reduce(
      (s, m) => s + (m.primary_files?.length || 1),
      0,
    );
    stats.value = {
      modules: mods.length,
      files,
      functions: mods.reduce((s, m) => s + (m.functions?.length || 0), 0),
      entities: mods.reduce((s, m) => s + (m.entities?.length || 0), 0),
      rules: mods.reduce((s, m) => s + (m.business_rules?.length || 0), 0),
    };
    if (mods.length === 0) errorMsg.value = '未获取到模块数据';
  } catch (err: any) {
    errorMsg.value = err.message || '模块数据加载失败';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="relative h-full w-full overflow-y-auto bg-[#0d1117] p-4">
    <div
      v-if="loading"
      class="flex h-full flex-col items-center justify-center gap-3"
    >
      <div
        class="size-8 animate-spin rounded-full border-[3px] border-gray-700 border-t-blue-500"
      />
      <span class="text-sm text-gray-400">正在加载模块地图…</span>
    </div>

    <div
      v-else-if="errorMsg"
      class="flex h-full flex-col items-center justify-center gap-2 px-6"
    >
      <div class="text-4xl">🗺️</div>
      <p class="text-sm text-red-400">{{ errorMsg }}</p>
    </div>

    <template v-else>
      <div class="mb-3 flex flex-wrap items-center gap-3">
        <div
          class="flex gap-4 rounded-lg border border-gray-700 bg-[#161b22]/80 px-4 py-2 text-xs text-gray-300"
        >
          <span>🗂️ <span class="text-blue-400">{{ stats.modules }}</span> 模块</span>
          <span>📄 <span class="text-fuchsia-400">{{ stats.files }}</span> 文件</span>
          <span>⚙️ <span class="text-emerald-400">{{ stats.functions }}</span> 功能</span>
          <span>🗃️ <span class="text-amber-400">{{ stats.entities }}</span> 实体</span>
          <span>📏 <span class="text-purple-400">{{ stats.rules }}</span> 规则</span>
        </div>
        <input
          v-model="search"
          type="text"
          placeholder="搜索模块 / 路径 / 说明..."
          class="rounded-lg border border-gray-700 bg-[#161b22] px-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 outline-none focus:border-blue-500"
        />
        <select
          v-model="filter"
          class="rounded-lg border border-gray-700 bg-[#161b22] px-2 py-1.5 text-xs text-gray-200 outline-none focus:border-blue-500"
        >
          <option value="all">全部复杂度</option>
          <option value="high">高</option>
          <option value="medium">中</option>
          <option value="low">低</option>
        </select>
        <button
          class="rounded-lg border border-gray-700 bg-[#161b22] px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200"
          @click="resetFilters"
        >
          重置
        </button>
      </div>

      <div v-if="visibleModules.length === 0" class="py-16 text-center text-sm text-gray-500">
        没有匹配的模块
      </div>

      <div class="grid grid-cols-1 gap-3 xl:grid-cols-2 2xl:grid-cols-3">
        <div
          v-for="m in pagedModules"
          :key="m.name"
          class="overflow-hidden rounded-lg border border-gray-700 bg-[#161b22]/70"
        >
          <div class="flex items-center justify-between gap-2 px-4 py-3">
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <span class="truncate text-sm font-semibold text-gray-100">
                  {{ m.name }}
                </span>
                <span
                  v-if="m.complexity"
                  class="rounded px-1.5 py-0.5 text-[10px]"
                  :class="COMPLEXITY_STYLE[m.complexity] || 'bg-gray-600/30 text-gray-400'"
                >
                  {{ m.complexity }}
                </span>
              </div>
              <div class="mt-0.5 truncate text-[11px] text-gray-500">{{ m.path }}</div>
            </div>
            <button
              class="shrink-0 rounded-md border border-blue-600/40 bg-blue-600/15 px-2.5 py-1 text-[11px] font-medium text-blue-400 transition-colors hover:bg-blue-600/30"
              @click="openDetail(m)"
            >
              详情
            </button>
          </div>

          <div class="border-t border-gray-800 px-4 py-2.5">
            <p class="line-clamp-2 text-xs leading-relaxed text-gray-400">
              {{ m.purpose || '暂无说明' }}
            </p>
            <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500">
              <span>📄 {{ m.primary_files?.length || 0 }} 文件</span>
              <span>⚙️ {{ m.functions?.length || 0 }} 功能</span>
              <span>🗃️ {{ m.entities?.length || 0 }} 实体</span>
              <span>📏 {{ m.business_rules?.length || 0 }} 规则</span>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="totalPages > 1"
        class="mt-4 flex items-center justify-center gap-1.5"
      >
        <button
          class="rounded border border-gray-700 bg-[#161b22] px-2.5 py-1 text-xs text-gray-400 transition-colors hover:text-gray-200 disabled:opacity-40"
          :disabled="page <= 1"
          @click="goPage(page - 1)"
        >
          上一页
        </button>
        <template v-for="p in totalPages" :key="p">
          <button
            v-if="p === page || p === 1 || p === totalPages || Math.abs(p - page) <= 1"
            class="rounded border border-gray-700 bg-[#161b22] px-2.5 py-1 text-xs transition-colors"
            :class="p === page ? 'border-blue-600 bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'"
            @click="goPage(p)"
          >
            {{ p }}
          </button>
          <span
            v-else-if="p === page - 2 || p === page + 2"
            class="px-1 text-xs text-gray-500"
          >…</span>
        </template>
        <button
          class="rounded border border-gray-700 bg-[#161b22] px-2.5 py-1 text-xs text-gray-400 transition-colors hover:text-gray-200 disabled:opacity-40"
          :disabled="page >= totalPages"
          @click="goPage(page + 1)"
        >
          下一页
        </button>
      </div>
    </template>
  </div>

  <Modal
    v-if="selectedModule"
    :open="detailVisible"
    :title="`${selectedModule.name} · 模块详情`"
    width="70%"
    :footer="null"
    @cancel="detailVisible = false"
  >
    <div class="max-h-[70vh] space-y-4 overflow-y-auto">
      <div class="rounded-lg border border-gray-700 bg-[#161b22] p-3">
        <div class="mb-1 text-[11px] font-medium text-gray-500">模块路径</div>
        <div class="break-all text-xs text-gray-300">{{ selectedModule.path }}</div>
        <div v-if="selectedModule.purpose" class="mt-2 text-xs leading-relaxed text-gray-400">
          {{ selectedModule.purpose }}
        </div>
      </div>

      <div v-if="selectedModule.primary_files?.length">
        <div class="mb-1.5 text-xs font-medium text-gray-300">
          主要文件 ({{ selectedModule.primary_files.length }})
        </div>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="f in selectedModule.primary_files"
            :key="f"
            class="rounded bg-[#0a0d14] px-1.5 py-0.5 text-[10px] text-cyan-400/90"
          >
            {{ f }}
          </span>
        </div>
      </div>

      <div v-if="selectedModule.functions?.length">
        <div class="mb-1.5 text-xs font-medium text-gray-300">
          功能 ({{ selectedModule.functions.length }})
        </div>
        <ul class="space-y-1">
          <li
            v-for="(fn, i) in selectedModule.functions"
            :key="i"
            class="text-[11px] text-gray-400"
          >
            <span class="text-emerald-400/90">{{ fn.name }}</span>
            <span v-if="fn.file" class="ml-1 text-gray-600">· {{ fn.file }}</span>
          </li>
        </ul>
      </div>

      <div v-if="selectedModule.entities?.length">
        <div class="mb-1.5 text-xs font-medium text-gray-300">
          实体 ({{ selectedModule.entities.length }})
        </div>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="e in selectedModule.entities"
            :key="e.name"
            class="rounded bg-[#0a0d14] px-1.5 py-0.5 text-[10px] text-amber-400/90"
          >
            {{ e.name }}
          </span>
        </div>
      </div>

      <div v-if="selectedModule.business_rules?.length">
        <div class="mb-1.5 text-xs font-medium text-gray-300">
          业务规则 ({{ selectedModule.business_rules.length }})
        </div>
        <ul class="space-y-1.5">
          <li
            v-for="(r, i) in selectedModule.business_rules"
            :key="i"
            class="text-[11px] leading-relaxed text-gray-400"
          >
            <span class="text-purple-400">·</span> {{ r.description }}
          </li>
        </ul>
      </div>

      <div v-if="selectedModule.dependencies?.length">
        <div class="mb-1.5 text-xs font-medium text-gray-300">依赖</div>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="(d, i) in selectedModule.dependencies"
            :key="i"
            class="rounded bg-[#0a0d14] px-1.5 py-0.5 text-[10px] text-gray-400"
          >
            {{ d }}
          </span>
        </div>
      </div>
    </div>
  </Modal>
</template>
