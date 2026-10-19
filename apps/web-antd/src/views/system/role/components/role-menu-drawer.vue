<script lang="ts" setup>
import type { SystemRoleItem } from '#/api';

import { ref, watch } from 'vue';

import { Button, Drawer, message, Space, Tree } from 'ant-design-vue';

import {
  assignRoleMenusApi,
  extractApiError,
  getMenuTreeSelectApi,
  getRoleDetailApi,
} from '#/api';

const props = defineProps<{
  role: null | SystemRoleItem;
}>();

const emit = defineEmits<{ success: [] }>();

const open = defineModel<boolean>('open', { default: false });

const loading = ref(false);
const submitting = ref(false);
const treeData = ref<any[]>([]);
const checkedKeys = ref<number[]>([]);
const halfCheckedKeys = ref<number[]>([]);
const expandedKeys = ref<number[]>([]);

/** 一次性展开全部节点（Tree 的 defaultExpandAll 只在首次渲染生效） */
function collectAllKeys(nodes: any[]): number[] {
  const keys: number[] = [];
  const walk = (items: any[]) => {
    for (const item of items) {
      keys.push(item.key);
      if (item.children?.length) {
        walk(item.children);
      }
    }
  };
  walk(nodes);
  return keys;
}

/** 收集树中所有叶子节点（无 children 的节点）的 key */
function collectLeafKeys(nodes: any[]): Set<number> {
  const leaves = new Set<number>();
  const walk = (items: any[]) => {
    for (const item of items) {
      if (item.children?.length) {
        walk(item.children);
      } else {
        leaves.add(item.key);
      }
    }
  };
  walk(nodes);
  return leaves;
}

function mapTree(items: any[]): any[] {
  return items.map((item) => ({
    children: item.children?.length ? mapTree(item.children) : undefined,
    key: item.id,
    title: item.title,
  }));
}

async function loadTree() {
  if (treeData.value.length > 0) {
    return;
  }
  const menuTree = await getMenuTreeSelectApi();
  treeData.value = mapTree(menuTree);
  expandedKeys.value = collectAllKeys(treeData.value);
}

watch(open, async (visible) => {
  if (!visible || !props.role) {
    return;
  }
  loading.value = true;
  checkedKeys.value = [];
  halfCheckedKeys.value = [];
  try {
    await loadTree();
    const detail = await getRoleDetailApi(props.role.id);
    // 后端返回的 menuIds 包含父目录和子菜单，但 Ant Design Tree 的 checkStrictly=false
    // 模式下，checkedKeys 中包含父节点会导致其所有子节点被自动勾选。
    // 因此回显时只设置叶子节点 ID，让 Tree 自动推算父节点的勾选/半选状态。
    const leafKeys = collectLeafKeys(treeData.value);
    checkedKeys.value = detail.menuIds.filter((id: number) => leafKeys.has(id));
  } catch (error) {
    message.error(extractApiError(error, '菜单数据获取失败'));
  } finally {
    loading.value = false;
  }
});

function handleCheck(keys: any, info: any) {
  checkedKeys.value = Array.isArray(keys) ? keys : (keys?.checked ?? []);
  halfCheckedKeys.value = info?.halfCheckedKeys ?? [];
}

async function handleSubmit() {
  if (!props.role) {
    return;
  }
  submitting.value = true;
  try {
    // 半选父节点一并提交，避免"仅勾选部分子项"时丢失父级授权
    const menuIds = [...new Set([...checkedKeys.value, ...halfCheckedKeys.value])];
    await assignRoleMenusApi(props.role.id, menuIds);
    message.success('授权成功');
    open.value = false;
    emit('success');
  } catch (error) {
    message.error(extractApiError(error));
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Drawer
    v-model:open="open"
    :title="`分配权限 - ${props.role?.name ?? ''}`"
    :width="460"
  >
    <div class="mb-3 text-sm text-gray-500">
      勾选菜单权限，保存后立即生效（父节点会自动补齐）。
    </div>
    <Tree
      v-if="!loading"
      v-model:checked-keys="checkedKeys"
      v-model:expanded-keys="expandedKeys"
      :field-names="{ children: 'children', key: 'key', title: 'title' }"
      :tree-data="treeData"
      checkable
      @check="handleCheck"
    />
    <div v-else class="py-10 text-center text-gray-400">加载中...</div>
    <template #footer>
      <Space>
        <Button @click="open = false">取消</Button>
        <Button :loading="submitting" type="primary" @click="handleSubmit">
          保存
        </Button>
      </Space>
    </template>
  </Drawer>
</template>
