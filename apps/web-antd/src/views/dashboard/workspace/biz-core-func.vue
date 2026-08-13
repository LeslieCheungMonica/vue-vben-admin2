<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { message } from 'ant-design-vue';

import { bizSurveyListApi, coreFunctionListApi, coreFunctionSaveApi, moudles3dApi } from '#/api/core/resource';

const props = defineProps<{ webId: string }>();

interface FrontendFile {
  frontend_file_path: string;
  frontend_file_title?: string;
  frontend_file_desc?: string;
}

interface CoreFunc {
  function: string;
  core_function_reason?: string;
  file_path?: string;
  frontend_file?: FrontendFile[];
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
  const mods = modules.value
    .map((m) => ({
      ...m,
      core_functions: (m.core_functions || []).filter(
        (f) => (f.frontend_file?.length || 0) > 0,
      ),
    }))
    .filter((m) => m.core_functions.length > 0);
  if (!kw) return mods;
  return mods
    .map((m) => {
      const matched = m.core_functions.filter((f) =>
        `${f.function} ${f.core_function_reason || ''} ${f.file_path || ''}`
          .toLowerCase()
          .includes(kw),
      );
      return matched.length ? { ...m, core_functions: matched } : null;
    })
    .filter((m): m is CoreModule => !!m);
});

const selectedKeys = ref<Set<string>>(new Set());
const SELECT_STORAGE_KEY = 'biz_core_func_selected';

function itemKey(m: any, f: any, ff?: any) {
  if (ff) return `${m.name}::${f.function}::${ff.frontend_file_path}`;
  return `${m.name}::${f.function}::${f.file_path || 'none'}`;
}

function rowKeysOf(m: any): string[] {
  const keys: string[] = [];
  m.core_functions.forEach((f: any) => {
    if (f.frontend_file?.length) {
      f.frontend_file.forEach((ff: any) => keys.push(itemKey(m, f, ff)));
    } else {
      keys.push(itemKey(m, f));
    }
  });
  return keys;
}

const allKeys = computed(() => {
  const keys: string[] = [];
  visibleModules.value.forEach((m) => keys.push(...rowKeysOf(m)));
  return keys;
});

const allSelected = computed(
  () => allKeys.value.length > 0 && allKeys.value.every((k) => selectedKeys.value.has(k)),
);

function toggleSelectAll() {
  selectedKeys.value = allSelected.value ? new Set() : new Set(allKeys.value);
}

function isModuleAllSelected(m: any) {
  const keys = rowKeysOf(m);
  return keys.length > 0 && keys.every((k) => selectedKeys.value.has(k));
}

function toggleModule(m: any) {
  const keys = rowKeysOf(m);
  const next = new Set(selectedKeys.value);
  if (isModuleAllSelected(m)) keys.forEach((k) => next.delete(k));
  else keys.forEach((k) => next.add(k));
  selectedKeys.value = next;
}

function toggleRow(key: string) {
  const next = new Set(selectedKeys.value);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  selectedKeys.value = next;
}

async function resolveSystemName(): Promise<string> {
  try {
    const res = await bizSurveyListApi();
    const records = (res as any)?.records ?? [];
    const rec = records.find(
      (r: any) => String(r.resource_id) === String(props.webId),
    );
    return rec?.system_name || '';
  } catch {
    return '';
  }
}

async function handleSave() {
  if (selectedKeys.value.size === 0) {
    message.warning('请先选择核心功能');
    return;
  }
  const system_name = await resolveSystemName();
  const moduleList: any[] = [];
  modules.value.forEach((m) => {
    const functions: any[] = [];
    m.core_functions.forEach((f) => {
      const bizs = (f.frontend_file || [])
        .filter((ff) => selectedKeys.value.has(itemKey(m, f, ff)))
        .map((ff) => ({
          biz_title: ff.frontend_file_title || ff.frontend_file_path,
          biz_file_path: ff.frontend_file_path,
        }));
      if (bizs.length) {
        functions.push({
          fucntion_name: f.function,
          file_path: f.file_path || '',
          bizs,
        });
      }
    });
    if (functions.length) {
      moduleList.push({ module_name: m.name, functions });
    }
  });

  try {
    await coreFunctionSaveApi({ system_name, modules: moduleList });
    localStorage.setItem(SELECT_STORAGE_KEY, JSON.stringify([...selectedKeys.value]));
    message.success('核心功能已保存');
  } catch {
    message.error('保存失败');
  }
}

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

async function restoreSelection() {
  const system_name = await resolveSystemName();
  try {
    const res = await coreFunctionListApi(system_name);
    const records = (res as any)?.records ?? [];
    const keys = records
      .map((r: any) => `${r.module_name}::${r.fucntion_name}::${r.biz_file_path}`)
      .filter(Boolean);
    selectedKeys.value = new Set(keys);
  } catch {
    /* ignore */
  }
}

onMounted(async () => {
  await loadData();
  await restoreSelection();
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
          ⚙️ <span class="text-emerald-400">{{ totalCoreFuncs }}</span> 核心功能
        </div>
        <input
          v-model="search"
          type="text"
          placeholder="搜索核心功能..."
          class="rounded-lg border border-gray-700 bg-[#161b22] px-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 outline-none focus:border-blue-500"
        />
        <button
          class="rounded-md border border-blue-600/40 bg-blue-600/15 px-3 py-1.5 text-xs font-medium text-blue-400 transition-colors hover:bg-blue-600/30"
          @click="toggleSelectAll"
        >
          {{ allSelected ? '取消全选' : '全选' }}
        </button>
        <button
          class="rounded-md border border-emerald-600/40 bg-emerald-600/15 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-600/30"
          @click="handleSave"
        >
          保存
        </button>
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
        <div class="flex cursor-pointer items-center gap-2 border-b border-gray-800 px-4 py-2.5" @click="toggleModule(m)">
          <input
            type="checkbox"
            class="accent-blue-500"
            :checked="isModuleAllSelected(m)"
            @click.stop
            @change="toggleModule(m)"
          />
          <span class="text-sm font-semibold text-gray-100">{{ m.name }}</span>
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
            <template v-if="f.frontend_file?.length">
              <div
                v-for="(ff, fi) in f.frontend_file"
                :key="fi"
                class="mb-3 last:mb-0"
              >
                <div class="flex items-start gap-2">
                  <input
                    type="checkbox"
                    class="mt-0.5 accent-blue-500"
                    :checked="selectedKeys.has(itemKey(m, f, ff))"
                    @change="toggleRow(itemKey(m, f, ff))"
                  />
                  <div class="min-w-0 flex-1">
                    <div class="break-all text-xs font-semibold text-cyan-300">
                      {{ ff.frontend_file_title || f.function || '核心功能' }}
                    </div>
                    <div
                      v-if="ff.frontend_file_desc"
                      class="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-gray-300"
                    >
                      <span class="shrink-0 text-gray-500">📝 描述</span>
                      <span class="min-w-0">{{ ff.frontend_file_desc }}</span>
                    </div>
                    <div
                      v-if="ff.frontend_file_path"
                      class="mt-2 flex items-start gap-1.5 text-[11px] text-gray-500"
                    >
                      <span class="shrink-0 text-gray-400">📄 入口文件</span>
                      <span class="break-all">{{ ff.frontend_file_path }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
