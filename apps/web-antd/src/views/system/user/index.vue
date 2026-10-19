<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import type { SystemUserItem } from '#/api';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import {
  Button,
  Card,
  Form,
  FormItem,
  Input,
  InputPassword,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
} from 'ant-design-vue';

import {
  deleteUserApi,
  extractApiError,
  getUserListApi,
  resetUserPasswordApi,
  updateUserStatusApi,
} from '#/api';

import UserFormModal from './components/user-form-modal.vue';

const userStore = useUserStore();

const loading = ref(false);
const rows = ref<SystemUserItem[]>([]);
const total = ref(0);

const query = reactive({
  mobile: '',
  page: 1,
  pageSize: 10,
  realName: '',
  status: -1,
  username: '',
});

const statusOptions = [
  { label: '全部', value: -1 },
  { label: '启用', value: 1 },
  { label: '停用', value: 0 },
];

const columns: TableColumnsType = [
  { dataIndex: 'username', key: 'username', title: '用户名', width: 140 },
  { dataIndex: 'realName', key: 'realName', title: '姓名', width: 120 },
  { dataIndex: 'mobile', key: 'mobile', title: '手机号', width: 130 },
  { dataIndex: 'email', key: 'email', title: '邮箱', width: 180 },
  { dataIndex: 'roles', key: 'roles', title: '角色', width: 170 },
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
    const result = await getUserListApi(query);
    rows.value = result.items;
    total.value = result.total;
  } catch (error) {
    message.error(extractApiError(error, '用户列表获取失败'));
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  query.page = 1;
  fetchList();
}

function handleReset() {
  Object.assign(query, {
    mobile: '',
    page: 1,
    realName: '',
    status: -1,
    username: '',
  });
  fetchList();
}

function handleTableChange(pag: any) {
  query.page = pag?.current ?? 1;
  query.pageSize = pag?.pageSize ?? 10;
  fetchList();
}

// ---------------------------------------------------------------- 表单弹窗
const modalOpen = ref(false);
const editingId = ref<null | number>(null);

function openCreate() {
  editingId.value = null;
  modalOpen.value = true;
}

function openEdit(record: SystemUserItem) {
  editingId.value = record.id;
  modalOpen.value = true;
}

// ---------------------------------------------------------------- 行操作
async function handleStatusChange(record: SystemUserItem) {
  try {
    await updateUserStatusApi(record.id, record.status === 1 ? 0 : 1);
    message.success(record.status === 1 ? '停用成功' : '启用成功');
  } catch (error) {
    message.error(extractApiError(error));
  } finally {
    await fetchList();
  }
}

async function handleDelete(record: SystemUserItem) {
  try {
    await deleteUserApi(record.id);
    message.success('删除成功');
    await fetchList();
  } catch (error) {
    message.error(extractApiError(error));
  }
}

// ---------------------------------------------------------------- 重置密码
const pwdVisible = ref(false);
const pwdSubmitting = ref(false);
const pwdTarget = ref<null | SystemUserItem>(null);
const pwdForm = reactive({ password: '' });

const pwdRules = [
  {
    validator: (_rule: unknown, value: string) => {
      if (!/^(?=.*[A-Za-z])(?=.*\d)[\S\s]{6,32}$/.test(value ?? '')) {
        return Promise.reject(new Error('密码需为 6-32 位且同时包含字母和数字'));
      }
      return Promise.resolve();
    },
  },
];

function openResetPassword(record: SystemUserItem) {
  pwdTarget.value = record;
  pwdForm.password = '';
  pwdVisible.value = true;
}

async function submitResetPassword() {
  if (!pwdTarget.value) {
    return;
  }
  pwdSubmitting.value = true;
  try {
    await resetUserPasswordApi(pwdTarget.value.id, pwdForm.password);
    message.success('密码重置成功');
    pwdVisible.value = false;
  } catch (error) {
    message.error(extractApiError(error));
  } finally {
    pwdSubmitting.value = false;
  }
}

/** 内置账号与当前登录账号禁止删除/停用（后端亦会返回 403） */
function isProtected(record: SystemUserItem) {
  return (
    record.builtIn ||
    String(record.id) === String(userStore.userInfo?.userId ?? '')
  );
}

onMounted(() => {
  fetchList();
});
</script>

<template>
  <Page description="维护平台账号、所属角色与启停状态" title="用户管理">
    <Card class="mb-5">
      <Form layout="inline">
        <FormItem label="用户名">
          <Input
            v-model:value="query.username"
            allow-clear
            placeholder="请输入用户名"
            @press-enter="handleSearch"
          />
        </FormItem>
        <FormItem label="姓名">
          <Input
            v-model:value="query.realName"
            allow-clear
            placeholder="请输入姓名"
            @press-enter="handleSearch"
          />
        </FormItem>
        <FormItem label="手机号">
          <Input
            v-model:value="query.mobile"
            allow-clear
            placeholder="请输入手机号"
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
        <span class="text-base font-medium">用户列表</span>
        <Button
          type="primary"
          @click="openCreate"
        >
          新增用户
        </Button>
      </div>

      <Table
        :columns="columns"
        :data-source="rows"
        :loading="loading"
        :pagination="pagination"
        :scroll="{ x: 1240 }"
        bordered
        row-key="id"
        size="middle"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'roles'">
            <template v-if="record.roles?.length">
              <Tag v-for="role in record.roles" :key="role.id" color="blue">
                {{ role.name }}
              </Tag>
            </template>
            <span v-else class="text-gray-400">-</span>
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
                @click="openEdit(record as SystemUserItem)"
              >
                编辑
              </Button>
              <Button
                :disabled="isProtected(record as SystemUserItem)"
                size="small"
                type="link"
                @click="handleStatusChange(record as SystemUserItem)"
              >
                {{ record.status === 1 ? '停用' : '启用' }}
              </Button>
              <Button
                size="small"
                type="link"
                @click="openResetPassword(record as SystemUserItem)"
              >
                重置密码
              </Button>
              <Popconfirm
                v-if="!isProtected(record as SystemUserItem)"
                cancel-text="取消"
                ok-text="删除"
                title="确认删除该用户？"
                @confirm="handleDelete(record as SystemUserItem)"
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

    <UserFormModal
      v-model:open="modalOpen"
      :record-id="editingId"
      @success="fetchList"
    />

    <Modal
      v-model:open="pwdVisible"
      :confirm-loading="pwdSubmitting"
      :width="480"
      cancel-text="取消"
      ok-text="确认重置"
      title="重置密码"
      @ok="submitResetPassword"
    >
      <Form :label-col="{ span: 6 }" class="pt-4">
        <FormItem label="账号">
          <span>{{ pwdTarget?.username }}（{{ pwdTarget?.realName }}）</span>
        </FormItem>
        <FormItem :rules="pwdRules" label="新密码" required>
          <InputPassword
            v-model:value="pwdForm.password"
            :maxlength="32"
            placeholder="6-32 位，需包含字母和数字"
          />
        </FormItem>
      </Form>
    </Modal>
  </Page>
</template>
