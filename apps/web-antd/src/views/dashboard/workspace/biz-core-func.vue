<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { moudles3dApi } from '#/api/core/resource';

const props = defineProps<{ webId: string }>();

interface CoreFunc {
  function: string;
  function_desc?: string;
  core_function_reason?: string;
  file_path?: string;
  frontend_file_path?: string[];
}

interface CoreModule {
  name: string;
  path?: string;
  purpose?: string;
  complexity?: string;
  core_functions: CoreFunc[];
}

const loading = ref(true);
const errorMsg = ref('');
const modules = ref<CoreModule[]>([]);
const search = ref('');

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

const totalCoreFuncs = computed(() =>
  modules.value.reduce((s, m) => s + (m.core_functions?.length || 0), 0),
);

const visibleModules = computed(() => {
  const kw = search.value.trim().toLowerCase();
  if (!kw) return modules.value;
  return modules.value
    .map((m) => {
      const matched = (m.core_functions || []).filter((f) =>
        `${f.function} ${f.function_desc || ''} ${f.core_function_reason || ''}`
          .toLowerCase()
          .includes(kw),
      );
      return matched.length ? { ...m, core_functions: matched } : null;
    })
    .filter((m): m is CoreModule => !!m);
});

async function loadData() {
  loading.value = true;
  errorMsg.value = '';
  try {
    const res = await moudles3dApi(props.webId);
    const mods = flattenModules(res?.modules);
    modules.value = mods.map((m: any) => ({
      name: m.name,
      path: m.path,
      purpose: m.purpose,
      complexity: m.complexity,
      core_functions: Array.isArray(m.core_functions) ? m.core_functions : [],
    }));
    if (modules.value.length === 0) errorMsg.value = '未获取到核心功能数据';
  } catch (err: any) {
    errorMsg.value = err.message || '核心功能数据加载失败';
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
      <span class="text-sm text-gray-400">正在加载核心功能…</span>
    </div>

    <div
      v-else-if="errorMsg"
      class="flex h-full flex-col items-center justify-center gap-2 px-6"
    >
      <div class="text-4xl">⚙️</div>
      <p class="text-sm text-red-400">{{ errorMsg }}</p>
    </div>

    <template v-else>
      <div class="mb-3 flex flex-wrap items-center gap-3">
        <div class="rounded-lg border border-gray-700 bg-[#161b22]/80 px-4 py-2 text-xs text-gray-300">
          🧩 <span class="text-blue-400">{{ modules.length }}</span> 模块 · ⚙️
          <span class="text-emerald-400">{{ totalCoreFuncs }}</span> 核心功能
        </div>
        <input
          v-model="search"
          type="text"
          placeholder="搜索核心功能 / 模块..."
          class="rounded-lg border border-gray-700 bg-[#161b22] px-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 outline-none focus:border-blue-500"
        />
      </div>

      <div
        v-if="visibleModules.length === 0"
        class="py-16 text-center text-sm text-gray-500"
      >
        没有匹配的核心功能
      </div>

      <div
        v-for="m in visibleModules"
        :key="m.name"
        class="mb-4 overflow-hidden rounded-lg border border-gray-700 bg-[#161b22]/70"
      >
        <div class="flex items-center gap-2 border-b border-gray-800 px-4 py-2.5">
          <span class="text-sm font-semibold text-gray-100">{{ m.name }}</span>
          <span
            v-if="m.complexity"
            class="rounded px-1.5 py-0.5 text-[10px]"
            :class="m.complexity === 'high' ? 'bg-red-500/20 text-red-400' : m.complexity === 'medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'"
          >
            {{ m.complexity }}
          </span>
          <span class="ml-auto text-[11px] text-gray-500">
            核心功能 {{ m.core_functions.length }}
          </span>
        </div>

        <div class="space-y-2.5 p-3">
          <div
            v-for="(f, i) in m.core_functions"
            :key="i"
            class="rounded-lg border border-gray-700/70 bg-[#0d1117]/60 p-3"
          >
            <div class="flex items-start gap-2">
              <span class="mt-0.5 shrink-0 text-sm text-emerald-400">⚙️</span>
              <div class="min-w-0 flex-1">
                <div class="break-all font-mono text-xs font-semibold text-cyan-300">
                  {{ f.function }}
                </div>
                <div v-if="f.function_desc" class="mt-1 text-xs leading-relaxed text-gray-300">
                  {{ f.function_desc }}
                </div>
              </div>
            </div>

            <div
              v-if="f.core_function_reason"
              class="mt-2 rounded bg-[#1a2030] px-2.5 py-2 text-[11px] leading-relaxed text-gray-400"
            >
              {{ f.core_function_reason }}
            </div>

            <div
              v-if="f.file_path"
              class="mt-2 flex items-start gap-1.5 text-[11px] text-gray-500"
            >
              <span class="shrink-0">📄</span>
              <span class="break-all">{{ f.file_path }}</span>
            </div>

            <div
              v-if="f.frontend_file_path?.length"
              class="mt-1.5 flex flex-wrap gap-1"
            >
              <span
                v-for="fp in f.frontend_file_path"
                :key="fp"
                class="rounded bg-[#0a0d14] px-1.5 py-0.5 text-[10px] text-fuchsia-400/90"
              >
                🖥️ {{ fp }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
