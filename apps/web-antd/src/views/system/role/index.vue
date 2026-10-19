<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import type { SystemRoleItem } from '#/api';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Form,
  FormItem,
  Input,
  message,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
} from 'ant-design-vue';

import {
  deleteRoleApi,
  extractApiError,
  getRoleListApi,
  updateRoleStatusApi,
} from '#/api';

import RoleFormModal from './components/role-form-modal.vue';
import RoleMenuDrawer from './components/role-menu-drawer.vue';

const loading = ref(false);
const rows = ref<SystemRoleItem[]>([]);
const total = ref(0);

const query = reactive({
  code: '',
  name: '',
  page: 1,
  pageSize: 10,
  status: -1,
});

const statusOptions = [
  { label: '全部', value: -1 },
  { label: '启用', value: 1 },
  { label: '停用', value: 0 },
];

const columns: TableColumnsType = [
  { dataIndex: 'name', key: 'name', title: '角色名称', width: 170 },
  { dataIndex: 'code', key: 'code', title: '角色编码', width: 140 },
  { dataIndex: 'sort', key: 'sort', title: '排序', width: 80 },
  { dataIndex: 'menuCount', key: 'menuCount', title: '菜单数', width: 90 },
  { dataIndex: 'status', key: 'status', title: '状态', width: 90 },
  { dataIndex: 'remark', key: 'remark', title: '备注', ellipsis: true },
  { dataIndex: 'createTime', key: 'createTime', title: '创建时间', width: 170 },
  { fixed: 'right', key: 'action', title: '操作', width: 250 },
];

const pagination = computed(() => ({
  current: query.page,
  pageSize: query.pageSize,
  showSizeChanger: true,
  showTotal: (value: number) => `共 ${value} 条`,
  total: total.value,
}));

async function fetchList() {
  loading.value = true;
  try {
    const result = await getRoleListApi(query);
    rows.value = result.items;
    total.value = result.total;
  } catch (error) {
    message.error(extractApiError(error, '角色列表获取失败'));
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  query.page = 1;
  fetchList();
}

function handleReset() {
  Object.assign(query, { code: '', name: '', page: 1, status: -1 });
  fetchList();
}

function handleTableChange(pag: any) {
  query.page = pag?.current ?? 1;
  query.pageSize = pag?.pageSize ?? 10;
  fetchList();
}

// ---------------------------------------------------------------- 表单弹窗
const modalOpen = ref(false);
const editingRecord = ref<null | SystemRoleItem>(null);

function openCreate() {
  editingRecord.value = null;
  modalOpen.value = true;
}

function openEdit(record: SystemRoleItem) {
  editingRecord.value = record;
  modalOpen.value = true;
}

// ------------------------------------------------------------ 分配权限抽屉
const drawerOpen = ref(false);
const assignRole = ref<null | SystemRoleItem>(null);

function openAssign(record: SystemRoleItem) {
  assignRole.value = record;
  drawerOpen.value = true;
}

// ---------------------------------------------------------------- 行操作
async function handleStatusChange(record: SystemRoleItem) {
  try {
    await updateRoleStatusApi(record.id, record.status === 1 ? 0 : 1);
    message.success(record.status === 1 ? '停用成功' : '启用成功');
  } catch (error) {
    message.error(extractApiError(error));
  } finally {
    await fetchList();
  }
}

async function handleDelete(record: SystemRoleItem) {
  try {
    await deleteRoleApi(record.id);
    message.success('删除成功');
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
  <Page description="维护角色及其可访问的菜单权限" title="角色管理">
    <Card class="mb-5">
      <Form layout="inline">
        <FormItem label="角色名称">
          <Input
            v-model:value="query.name"
            allow-clear
            placeholder="请输入角色名称"
            @press-enter="handleSearch"
          />
        </FormItem>
        <FormItem label="角色编码">
          <Input
            v-model:value="query.code"
            allow-clear
            placeholder="请输入角色编码"
            @press-enter="handleSearch"
          />
        </FormItem>
        <FormItem label="状态">
          <Select
            v-model:value="query.status"
            :options="statusOptions"
            class="w-32"
          />
        </FormItem>
        <FormItem>
          <Space>
            <Button type="primary" @click="handleSearch">查询</Button>
            <Button @click="handleReset">重置</Button>
          </Space>
        </FormItem>
      </Form>
    </Card>

    <Card>
      <div class="mb-4 flex items-center justify-between">
        <span class="text-base font-medium">角色列表</span>
        <Button
          type="primary"
          @click="openCreate"
        >
          新增角色
        </Button>
      </div>

      <Table
        :columns="columns"
        :data-source="rows"
        :loading="loading"
        :pagination="pagination"
        :scroll="{ x: 1140 }"
        bordered
        row-key="id"
        size="middle"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <Space>
              <span>{{ record.name }}</span>
              <Tag v-if="record.builtIn" color="orange">内置</Tag>
            </Space>
          </template>
          <template v-else-if="column.key === 'status'">
            <Tag :color="record.status === 1 ? 'success' : 'error'">
              {{ record.status === 1 ? '启用' : '停用' }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'createTime'">
            {{ record.createTime || '-' }}
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button
                size="small"
                type="link"
                @click="openEdit(record as SystemRoleItem)"
              >
                编辑
              </Button>
              <Button
                size="small"
                type="link"
                @click="openAssign(record as SystemRoleItem)"
              >
                分配权限
              </Button>
              <Button
                :disabled="record.builtIn"
                size="small"
                type="link"
                @click="handleStatusChange(record as SystemRoleItem)"
              >
                {{ record.status === 1 ? '停用' : '启用' }}
              </Button>
              <Popconfirm
                v-if="!record.builtIn"
                cancel-text="取消"
                ok-text="删除"
                title="确认删除该角色？"
                @confirm="handleDelete(record as SystemRoleItem)"
              >
                <Button
                  danger
                  size="small"
                  type="link"
                >
                  删除
                </Button>
              </Popconfirm>
              <Button
                v-else
                disabled
                danger
                size="small"
                type="link"
              >
                删除
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <RoleFormModal
      v-model:open="modalOpen"
      :record="editingRecord"
      @success="fetchList"
    />

    <RoleMenuDrawer
      v-model:open="drawerOpen"
      :role="assignRole"
      @success="fetchList"
    />
  </Page>
</template>
