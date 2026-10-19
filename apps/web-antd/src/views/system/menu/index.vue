<script lang="ts" setup>
import type { SystemMenuItem } from '#/api';

import { computed, onMounted, ref } from 'vue';

import { IconPicker, Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import {
  Card,
  Descriptions,
  DescriptionsItem,
  Empty,
  Input,
  message,
  Popconfirm,
  Space,
  Tag,
  Tooltip,
  Tree,
} from 'ant-design-vue';

import {
  deleteMenuApi,
  extractApiError,
  getMenuListApi,
  updateMenuStatusApi,
} from '#/api';

import MenuFormModal from './components/menu-form-modal.vue';

const loading = ref(false);
const rows = ref<SystemMenuItem[]>([]);
const expandedKeys = ref<number[]>([]);
const selectedKeys = ref<number[]>([]);
const searchValue = ref('');
/** 当前鼠标悬停的节点 key */
const hoveredKey = ref<null | number>(null);

const typeTextMap: Record<string, string> = {
  catalog: '目录',
  menu: '菜单',
};

const typeColorMap: Record<string, string> = {
  catalog: 'default',
  menu: 'blue',
};

/** 将菜单数据转成 antd Tree 格式 */
function mapTree(items: SystemMenuItem[]): any[] {
  return items.map((item) => ({
    children: item.children?.length ? mapTree(item.children) : undefined,
    hideInMenu: item.hideInMenu,
    key: item.id,
    title: item.title,
    // 保留原始数据用于详情展示
    _raw: item,
  }));
}

const treeData = computed(() => mapTree(rows.value));

/** 扁平化所有菜单节点，用于快速查找 */
const flatMap = computed(() => {
  const map = new Map<number, SystemMenuItem>();
  function walk(items: SystemMenuItem[]) {
    for (const item of items) {
      map.set(item.id, item);
      if (item.children?.length) walk(item.children);
    }
  }
  walk(rows.value);
  return map;
});

const selectedMenu = computed(() =>
  selectedKeys.value.length ? flatMap.value.get(selectedKeys.value[0]!) : null,
);

function collectAllKeys(nodes: SystemMenuItem[]): number[] {
  const keys: number[] = [];
  const walk = (items: SystemMenuItem[]) => {
    for (const item of items) {
      if (item.children?.length) {
        keys.push(item.id);
        walk(item.children);
      }
    }
  };
  walk(nodes);
  return keys;
}

async function fetchList() {
  loading.value = true;
  try {
    const menuTree = await getMenuListApi({
      title: searchValue.value,
    });
    rows.value = menuTree;
    expandedKeys.value = collectAllKeys(menuTree);
  } catch (error) {
    message.error(extractApiError(error, '菜单列表获取失败'));
  } finally {
    loading.value = false;
  }
}

function handleSelect(keys: any[]) {
  selectedKeys.value = keys as number[];
}

function handleExpand(keys: any[]) {
  expandedKeys.value = keys as number[];
}

// ---------------------------------------------------------------- 表单弹窗
const modalOpen = ref(false);
const editingRecord = ref<null | SystemMenuItem>(null);
const parentId = ref(0);

function openCreate() {
  editingRecord.value = null;
  parentId.value = 0;
  modalOpen.value = true;
}

function openCreateChild(record: SystemMenuItem, event: Event) {
  event.stopPropagation();
  editingRecord.value = null;
  parentId.value = record.id;
  modalOpen.value = true;
}

function openEdit(record: SystemMenuItem, event: Event) {
  event.stopPropagation();
  editingRecord.value = record;
  parentId.value = 0;
  modalOpen.value = true;
}

function stopPropagation(event: Event) {
  event.stopPropagation();
}

// ---------------------------------------------------------------- 行操作
async function handleStatusChange(record: SystemMenuItem, event?: Event) {
  event?.stopPropagation();
  try {
    await updateMenuStatusApi(record.id, record.status === 1 ? 0 : 1);
    message.success(record.status === 1 ? '停用成功' : '启用成功');
    await fetchList();
  } catch (error) {
    message.error(extractApiError(error));
  }
}

async function handleDelete(record: SystemMenuItem) {
  try {
    await deleteMenuApi(record.id);
    message.success('删除成功');
    // 如果删除的是当前选中的节点，清空选中
    if (selectedKeys.value.includes(record.id)) {
      selectedKeys.value = [];
    }
    await fetchList();
  } catch (error) {
    message.error(extractApiError(error));
  }
}

onMounted(() => {
  fetchList();
});
</script>

<template>
  <Page description="维护菜单树及其启停状态" title="菜单管理">
    <div class="flex gap-4">
      <!-- 左侧：菜单树 -->
      <Card class="w-80 shrink-0" title="菜单结构">
        <template #extra>
          <a class="text-primary text-sm" @click="openCreate">+ 新增菜单</a>
        </template>
        <Input
          v-model:value="searchValue"
          allow-clear
          class="mb-3"
          placeholder="搜索菜单标题"
          @press-enter="fetchList"
        />
        <Tree
          v-if="treeData.length"
          :expanded-keys="expandedKeys"
          :field-names="{ children: 'children', key: 'key', title: 'title' }"
          :selected-keys="selectedKeys"
          :tree-data="treeData"
          block-node
          class="menu-tree"
          @expand="handleExpand"
          @select="handleSelect"
        >
          <template #title="{ key, title, _raw, hideInMenu }">
            <div
              class="tree-node-content"
              :class="{ 'tree-node-hidden': hideInMenu }"
              @mouseenter="hoveredKey = key as number"
              @mouseleave="hoveredKey = null"
            >
              <span class="tree-node-title">{{ title }}</span>
              <Tag v-if="hideInMenu" class="ml-1" color="default" style="font-size: 10px; line-height: 16px; padding: 0 4px;">隐</Tag>
              <span v-if="hoveredKey === key" class="tree-node-actions" @click.stop>
                <Tooltip title="编辑">
                  <IconifyIcon class="action-icon" icon="lucide:pencil" @click.stop="openEdit(_raw, $event)" />
                </Tooltip>
                <Tooltip title="新增子级">
                  <IconifyIcon class="action-icon" icon="lucide:plus" @click.stop="openCreateChild(_raw, $event)" />
                </Tooltip>
                <Tooltip :title="_raw.status === 1 ? '停用' : '启用'">
                  <IconifyIcon class="action-icon" icon="lucide:power" @click.stop="handleStatusChange(_raw, $event)" />
                </Tooltip>
                <Popconfirm
                  v-if="!_raw.builtIn"
                  cancel-text="取消"
                  ok-text="删除"
                  title="确认删除该菜单？"
                  @confirm="handleDelete(_raw)"
                >
                  <IconifyIcon class="action-icon action-icon-danger" icon="lucide:trash-2" @click.stop />
                </Popconfirm>
              </span>
            </div>
          </template>
        </Tree>
        <Empty v-else description="暂无菜单数据" />
      </Card>

      <!-- 右侧：详情面板 -->
      <Card class="flex-1" title="菜单详情">
        <template v-if="selectedMenu">
          <Descriptions :column="2" bordered size="small">
            <DescriptionsItem label="菜单标题">
              <Space>
                <span>{{ selectedMenu.title }}</span>
                <Tag v-if="selectedMenu.builtIn" color="orange">内置</Tag>
              </Space>
            </DescriptionsItem>
            <DescriptionsItem label="类型">
              <Tag :color="typeColorMap[selectedMenu.type]">
                {{ typeTextMap[selectedMenu.type] ?? selectedMenu.type }}
              </Tag>
            </DescriptionsItem>
            <DescriptionsItem label="菜单地址">
              {{ selectedMenu.menuUrl || '-' }}
            </DescriptionsItem>
            <DescriptionsItem label="图标">
              <IconifyIcon v-if="selectedMenu.icon" :icon="selectedMenu.icon" :size="18" />
              <span v-else>-</span>
            </DescriptionsItem>
            <DescriptionsItem label="排序">
              {{ selectedMenu.orderNo }}
            </DescriptionsItem>
            <DescriptionsItem label="状态">
              <Tag :color="selectedMenu.status === 1 ? 'success' : 'error'">
                {{ selectedMenu.status === 1 ? '启用' : '停用' }}
              </Tag>
            </DescriptionsItem>
            <DescriptionsItem label="隐藏菜单">
              <Tag :color="selectedMenu.hideInMenu ? 'default' : 'processing'">
                {{ selectedMenu.hideInMenu ? '隐藏' : '显示' }}
              </Tag>
            </DescriptionsItem>
            <DescriptionsItem label="备注">
              {{ selectedMenu.remark || '-' }}
            </DescriptionsItem>
            <DescriptionsItem label="创建时间">
              {{ selectedMenu.createTime || '-' }}
            </DescriptionsItem>
            <DescriptionsItem label="更新时间">
              {{ selectedMenu.updateTime || '-' }}
            </DescriptionsItem>
          </Descriptions>
        </template>
        <Empty v-else description="请在左侧选择一个菜单查看详情" />
      </Card>
    </div>

    <MenuFormModal
      v-model:open="modalOpen"
      :parent-id="parentId"
      :record="editingRecord"
      @success="fetchList"
    />
  </Page>
</template>

<style scoped>
.tree-node-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-right: 4px;
}

.tree-node-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tree-node-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 8px;
  flex-shrink: 0;
}

.action-icon {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
  cursor: pointer;
  transition: color 0.2s;
  padding: 2px;
  border-radius: 4px;
}

.action-icon:hover {
  color: #1677ff;
  background-color: rgba(22, 119, 255, 0.06);
}

.action-icon-danger:hover {
  color: #ff4d4f;
  background-color: rgba(255, 77, 79, 0.06);
}

.tree-node-hidden {
  opacity: 0.5;
}

.tree-node-hidden:hover {
  opacity: 0.8;
}

/* 暗色主题适配 */
.dark .action-icon {
  color: rgba(255, 255, 255, 0.45);
}

.dark .action-icon:hover {
  color: #4096ff;
  background-color: rgba(64, 150, 255, 0.1);
}

.dark .action-icon-danger:hover {
  color: #ff7875;
  background-color: rgba(255, 120, 117, 0.1);
}
</style>
