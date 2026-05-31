<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Button, Card, Checkbox, message, Spin, Tree } from 'ant-design-vue';

import { getBizDataApi, getTaskListApi } from '#/api/core/task';

interface TreeNode {
  title: string;
  key: string;
  isLeaf?: boolean;
  nodeType?: string;
  rawValue?: string;
  children?: TreeNode[];
}

let nodeIdCounter = 0;
function buildTree(data: any, _parentKey = ''): TreeNode[] {
  if (data === null || data === undefined) {
    const id = ++nodeIdCounter;
    return [{ title: 'null', key: `n${id}`, isLeaf: true, nodeType: 'null', rawValue: 'null' }];
  }
  if (Array.isArray(data)) {
    if (data.length === 0) {
      const id = ++nodeIdCounter;
      return [{ title: '(array) 空', key: `n${id}`, isLeaf: true, nodeType: 'array' }];
    }
    return data.map((item) => {
      const id = ++nodeIdCounter;
      const key = `n${id}`;
      if (typeof item === 'object' && item !== null) {
        return { title: '', key, children: buildTree(item, key), nodeType: 'array' };
      }
      const val = item === null ? 'null' : String(item);
      const type = item === null ? 'null' : typeof item;
      return { title: '', key, isLeaf: true, nodeType: type, rawValue: val };
    });
  }
  if (typeof data === 'object') {
    const entries = Object.entries(data);
    if (entries.length === 0) {
      const id = ++nodeIdCounter;
      return [{ title: '(object) 空', key: `n${id}`, isLeaf: true, nodeType: 'object' }];
    }
    const hasModuleName = entries.find(([k]) => k === 'module_name');
    const hasModulePath = entries.find(([k]) => k === 'module_path');
    if (hasModuleName && hasModulePath) {
      const mn = String(hasModuleName[1] ?? '');
      const mp = String(hasModulePath[1] ?? '');
      const combined = mn && mp ? `${mn}/${mp}` : (mn || mp);
      const id = ++nodeIdCounter;
      const result = entries.filter(([k]) => k !== 'module_name' && k !== 'module_path').map(([k, v]) => {
        const nid = ++nodeIdCounter;
        const nkey = `n${nid}`;
        if (typeof v === 'object' && v !== null) {
          return { title: k, key: nkey, children: buildTree(v, nkey), nodeType: 'object' };
        }
        const val = v === null ? 'null' : String(v);
        const type = v === null ? 'null' : typeof v;
        return { title: k, key: nkey, isLeaf: true, nodeType: type, rawValue: val };
      });
      result.unshift({ title: combined, key: `n${id}`, isLeaf: true, nodeType: 'string', rawValue: combined });
      return result;
    }
    return entries.map(([k, v]) => {
      const id = ++nodeIdCounter;
      const key = `n${id}`;
      if (typeof v === 'object' && v !== null) {
        return { title: k, key, children: buildTree(v, key), nodeType: 'object' };
      }
      const val = v === null ? 'null' : String(v);
      const type = v === null ? 'null' : typeof v;
      return { title: k, key, isLeaf: true, nodeType: type, rawValue: val };
    });
  }
  const id = ++nodeIdCounter;
  return [{ title: String(data), key: `n${id}`, isLeaf: true, nodeType: typeof data, rawValue: String(data) }];
}

const route = useRoute();

const taskId = computed(() => route.params.taskId as string);

const taskName = ref('');
const loading = ref(true);
const treeData = ref<TreeNode[]>([]);
const searchValue = ref('');
const checkedKeys = ref<string[]>([]);
const allLeafKeys = ref<string[]>([]);

const selectAll = computed({
  get: () => checkedKeys.value.length === allLeafKeys.value.length && allLeafKeys.value.length > 0,
  set: (val: boolean) => {
    checkedKeys.value = val ? [...allLeafKeys.value] : [];
  },
});

const selectAllIndeterminate = computed(
  () => checkedKeys.value.length > 0 && checkedKeys.value.length < allLeafKeys.value.length,
);

function collectLeafKeys(nodes: TreeNode[]): string[] {
  const keys: string[] = [];
  for (const node of nodes) {
    if (node.children) {
      keys.push(...collectLeafKeys(node.children));
    } else if (node.isLeaf) {
      keys.push(node.key);
    }
  }
  return keys;
}

function filterTree(nodes: TreeNode[], q: string): TreeNode[] {
  if (!q) return nodes;
  const lq = q.toLowerCase();
  return nodes.reduce<TreeNode[]>((acc, node) => {
    const titleMatch = node.title?.toLowerCase().includes(lq);
    const valMatch = node.rawValue?.toLowerCase().includes(lq);
    const children = node.children ? filterTree(node.children, lq) : undefined;
    if (titleMatch || valMatch || (children && children.length > 0)) {
      acc.push({ ...node, children: children && children.length > 0 ? children : undefined });
    }
    return acc;
  }, []);
}

const filteredTreeData = computed(() => filterTree(treeData.value, searchValue.value.trim()));

const stats = computed(() => {
  function count(nodes: TreeNode[]): { total: number; objects: number; arrays: number; fields: number } {
    return nodes.reduce(
      (s, n) => {
        const c = n.children ? count(n.children) : { total: 0, objects: 0, arrays: 0, fields: 0 };
        return {
          total: s.total + 1 + c.total,
          objects: s.objects + (n.nodeType === 'object' ? 1 : 0) + c.objects,
          arrays: s.arrays + (n.nodeType === 'array' ? 1 : 0) + c.arrays,
          fields: s.fields + (n.isLeaf && n.nodeType !== 'object' && n.nodeType !== 'array' ? 1 : 0) + c.fields,
        };
      },
      { total: 0, objects: 0, arrays: 0, fields: 0 },
    );
  }
  return count(treeData.value);
});

async function fetchData() {
  const tid = taskId.value;
  if (!tid) return;
  loading.value = true;
  try {
    const taskRes = await getTaskListApi(tid);
    const found = taskRes.items?.find((t) => t.task_id === tid);
    taskName.value = found?.task_name ?? tid;

    nodeIdCounter = 0;
    const res = await getBizDataApi(tid);
    treeData.value = buildTree(res.data ?? []);
    allLeafKeys.value = collectLeafKeys(treeData.value);
  } catch {
    message.error('获取业务数据失败');
  } finally {
    loading.value = false;
  }
}

function handleSave() {
  const selected = checkedKeys.value;
  if (selected.length === 0) {
    message.warning('请先选择需要保存的数据');
    return;
  }
  message.success(`已保存 ${selected.length} 项数据`);
}

watch(taskId, () => {
  searchValue.value = '';
  fetchData();
});

onMounted(() => {
  fetchData();
});
</script>

<template>
  <Page
    description="查看并选择任务的业务范围数据"
    :title="`业务范围 - ${taskName}`"
  >
    <div class="biz-header">
      <div class="biz-header-stats">
        <div class="stat-pill stat-pill-total">
          <span class="stat-icon">📊</span>
          <span class="stat-num">{{ stats.total }}</span>
          <span class="stat-lbl">节点</span>
        </div>
        <div class="stat-pill stat-pill-obj">
          <span class="stat-icon">📦</span>
          <span class="stat-num">{{ stats.objects }}</span>
          <span class="stat-lbl">对象</span>
        </div>
        <div class="stat-pill stat-pill-arr">
          <span class="stat-icon">📋</span>
          <span class="stat-num">{{ stats.arrays }}</span>
          <span class="stat-lbl">数组</span>
        </div>
        <div class="stat-pill stat-pill-field">
          <span class="stat-icon">🏷️</span>
          <span class="stat-num">{{ stats.fields }}</span>
          <span class="stat-lbl">字段</span>
        </div>
      </div>
      <Button type="primary" size="large" class="save-btn" @click="handleSave">
        保存选择 ({{ checkedKeys.length }})
      </Button>
    </div>

    <Card class="biz-card">
      <div class="biz-toolbar">
        <label class="select-all" @click="selectAll = !selectAll">
          <Checkbox
            v-model:checked="selectAll"
            :indeterminate="selectAllIndeterminate"
          />
          <span>全选</span>
        </label>
        <div class="biz-search">
          <span class="search-icon">🔍</span>
          <input
            v-model="searchValue"
            class="search-input"
            placeholder="搜索字段名或值..."
          />
        </div>
        <div class="biz-legend">
          <span><span class="dot dot-obj" />对象</span>
          <span><span class="dot dot-arr" />数组</span>
          <span><span class="dot dot-str" />字符串</span>
          <span><span class="dot dot-num" />数字</span>
          <span><span class="dot dot-bool" />布尔</span>
        </div>
      </div>
    </Card>

    <Card class="biz-card mt-4">
      <Spin v-if="loading" class="biz-spin" />
      <div v-else-if="filteredTreeData.length === 0" class="biz-empty">
        {{ searchValue ? '无匹配数据' : '暂无数据' }}
      </div>
      <Tree
        v-else
        v-model:checkedKeys="checkedKeys"
        :tree-data="filteredTreeData"
        :default-expand-all="true"
        checkable
        class="biz-tree"
      >
        <template #title="{ title, nodeType, rawValue }">
          <span class="tree-node">
            <template v-if="nodeType === 'object'">
              <span class="node-badge node-obj">{ }</span>
              <span class="node-label">{{ title }}</span>
            </template>
            <template v-else-if="nodeType === 'array'">
              <span class="node-badge node-arr">[ ]</span>
              <span class="node-label node-label-dim">{{ title }}</span>
            </template>
            <template v-else>
              <span class="type-tag">
                <template v-if="nodeType === 'string'">
                  <span class="type-tag-icon str-icon">"</span>
                </template>
                <template v-else-if="nodeType === 'number'">
                  <span class="type-tag-icon num-icon">#</span>
                </template>
                <template v-else-if="nodeType === 'boolean'">
                  <span class="type-tag-icon bool-icon">⚡</span>
                </template>
                <template v-else-if="nodeType === 'null'">
                  <span class="type-tag-icon null-icon">∅</span>
                </template>
              </span>
              <span v-if="title !== rawValue" class="node-label">{{ title }}</span>
              <span v-if="title !== rawValue" class="node-sep">:</span>
              <span
                class="node-val"
                :class="[
                  nodeType === 'string' ? 'v-str' : '',
                  nodeType === 'number' ? 'v-num' : '',
                  nodeType === 'boolean' && rawValue === 'true' ? 'v-true' : '',
                  nodeType === 'boolean' && rawValue === 'false' ? 'v-false' : '',
                  nodeType === 'null' ? 'v-null' : '',
                ]"
              >
{{ rawValue }}
              </span>
            </template>
          </span>
        </template>
      </Tree>
    </Card>
  </Page>
</template>

<style scoped>
.biz-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #f8faff 0%, #eef4ff 100%);
  border-radius: 12px;
  border: 1px solid #e4ebf5;
}
.biz-header-stats {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.stat-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.stat-icon { font-size: 15px; }
.stat-num { font-weight: 700; font-size: 15px; color: #1f2937; }
.stat-lbl { color: #6b7280; font-size: 12px; }
.stat-pill-total { border: 1px solid #e8e0ff; }
.stat-pill-obj { border: 1px solid #d6e2ff; }
.stat-pill-arr { border: 1px solid #fdecc8; }
.stat-pill-field { border: 1px solid #d1fae5; }

.save-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 8px;
  font-weight: 600;
  box-shadow: 0 2px 6px rgba(59,130,246,0.2);
}

.biz-card { border-radius: 12px; }
.biz-card :deep(.ant-card-body) { padding: 16px 20px; }

.biz-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.select-all {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
}
.select-all:hover { color: #3b82f6; }

.biz-search {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 160px;
  max-width: 320px;
}
.search-icon { font-size: 14px; flex-shrink: 0; }
.search-input {
  flex: 1;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 7px 12px;
  font-size: 13px;
  outline: none;
  transition: all 0.2s;
  background: #f9fafb;
}
.search-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
  background: #fff;
}
.search-input::placeholder { color: #9ca3af; }

.biz-legend {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 12px;
  color: #6b7280;
}
.biz-legend span { display: inline-flex; align-items: center; gap: 4px; }
.dot { width: 7px; height: 7px; border-radius: 50%; }
.dot-obj { background: #3b82f6; }
.dot-arr { background: #f59e0b; }
.dot-str { background: #10b981; }
.dot-num { background: #f97316; }
.dot-bool { background: #8b5cf6; }

.biz-spin { display: flex; justify-content: center; padding: 80px 0; }
.biz-empty { text-align: center; padding: 80px 0; color: #9ca3af; font-size: 14px; }

.biz-tree { font-size: 13px; }
.biz-tree :deep(.ant-tree-treenode) { padding: 2px 0; }
.biz-tree :deep(.ant-tree-node-content-wrapper) { overflow: hidden; }

.biz-tree :deep(.ant-tree-node-content-wrapper) {
  overflow: hidden;
  display: inline-flex;
  align-items: center;
}

.tree-node {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}

.node-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px; height: 20px;
  border-radius: 4px;
  font-size: 10px; font-weight: 700;
  flex-shrink: 0;
}
.node-obj { background: #eff6ff; color: #2563eb; }
.node-arr { background: #fef3c7; color: #d97706; }

.node-label { font-weight: 500; color: #1f2937; }
.node-label-dim { color: #6b7280; font-weight: 400; }
.node-sep { color: #d1d5db; flex-shrink: 0; }

.type-tag { display: inline-flex; flex-shrink: 0; width: 18px; justify-content: center; }
.type-tag-icon { font-size: 12px; font-weight: 700; }
.str-icon { color: #059669; }
.num-icon { color: #d97706; }
.bool-icon { font-size: 11px; }
.null-icon { color: #9ca3af; }

.node-val {
  font-size: 12px;
  font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
  padding: 1px 7px;
  border-radius: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 360px;
}
.v-str { background: #f0fdf4; color: #065f46; }
.v-num { background: #fff7ed; color: #9a3412; }
.v-true { background: #f0fdf4; color: #16a34a; }
.v-false { background: #fef2f2; color: #dc2626; }
.v-null { background: #f3f4f6; color: #6b7280; }
.str-q { color: #86efac; }
</style>
