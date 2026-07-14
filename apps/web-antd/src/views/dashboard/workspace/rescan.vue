<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Button, Card, Form, Input, message, Modal, Select, Space, Table, Tag } from 'ant-design-vue';

import { getResourceListApi } from '#/api/core/resource';
import type { ResourceApi } from '#/api/core/resource';
import { createRepeatTaskApi, deleteRepeatTaskApi, getRepeatTaskListApi, startRepeatTaskApi, stopRepeatTaskApi, updateRepeatTaskApi } from '#/api/core/task';
import type { RepeatTaskItem } from '#/api/core/task';

const route = useRoute();
const router = useRouter();
const taskId = route.params.taskId as string;

const loading = ref(false);
const tasks = ref<RepeatTaskItem[]>([]);
const UseModal = Modal.useModal();
const [modalApi, contextHolder] = UseModal;

const createModalVisible = ref(false);
const createLoading = ref(false);
const resources = ref<ResourceApi.ResourceItem[]>([]);
const createForm = ref({
  repeat_task_name: '',
  resource_id: 0,
  repeat_task_type: 'code',
});

const statusColorMap: Record<string, string> = {
  'wait-to-start': 'default',
  running: 'processing',
  finish: 'success',
  stopped: 'warning',
  'run-except': 'error',
};

const statusLabelMap: Record<string, string> = {
  'wait-to-start': '待运行',
  running: '运行中',
  finish: '执行完成',
  stopped: '已停止',
  'run-except': '执行异常',
};

const columns = [
  { dataIndex: 'repeat_task_id', key: 'repeat_task_id', title: '复扫任务 ID', width: 180, ellipsis: true },
  { dataIndex: 'repeat_task_name', key: 'repeat_task_name', title: '任务名称', width: 200, ellipsis: true },
  { dataIndex: 'repeat_task_type', key: 'repeat_task_type', title: '类型', width: 80 },
  { dataIndex: 'status', key: 'status', title: '状态', width: 100 },
  { dataIndex: 'created_at', key: 'created_at', title: '创建时间', width: 160 },
  { key: 'action', title: '操作', width: 280, fixed: 'right' as const },
];

async function fetchTasks() {
  loading.value = true;
  try {
    const res = await getRepeatTaskListApi(taskId);
    tasks.value = res.items ?? [];
  } catch {
    tasks.value = [];
    message.error('获取复扫任务列表失败');
  } finally {
    loading.value = false;
  }
}

async function openCreateModal() {
  createForm.value = { repeat_task_name: '', resource_id: 0, repeat_task_type: 'code' };
  try {
    const res = await getResourceListApi();
    resources.value = res.items ?? [];
  } catch {
    resources.value = [];
  }
  createModalVisible.value = true;
}

async function handleCreate() {
  if (!createForm.value.repeat_task_name) {
    message.warning('请输入复扫任务名称');
    return;
  }
  if (!createForm.value.resource_id) {
    message.warning('请选择资源');
    return;
  }
  createLoading.value = true;
  try {
    await createRepeatTaskApi({
      task_id: taskId,
      repeat_task_name: createForm.value.repeat_task_name,
      resource_id: createForm.value.resource_id,
      repeat_task_type: createForm.value.repeat_task_type,
    });
    message.success('复扫任务创建成功');
    createModalVisible.value = false;
    await fetchTasks();
  } catch {
    message.error('创建复扫任务失败');
  } finally {
    createLoading.value = false;
  }
}

function handleStart(record: RepeatTaskItem) {
  const isRunning = record.status === 'running';
  const actionLabel = isRunning ? '停止' : record.status === 'stopped' ? '继续' : '启动';
  modalApi.confirm({
    title: `确认${actionLabel}`,
    content: `确定${actionLabel}复扫任务 [${record.repeat_task_name}] 吗？`,
    okText: actionLabel,
    onOk: async () => {
      try {
        if (isRunning) {
          await stopRepeatTaskApi(record.repeat_task_id);
          message.success('复扫任务已停止');
        } else {
          await startRepeatTaskApi(record.repeat_task_id);
          message.success('复扫任务已启动');
        }
        await fetchTasks();
      } catch {
        message.error(`${actionLabel}复扫任务失败`);
      }
    },
  });
}

function handleDetail(record: RepeatTaskItem) {
  router.push(`/dashboard/task/vuln-detail/${record.task_id}?repeatTaskId=${record.repeat_task_id}`);
}

const editModalVisible = ref(false);
const editLoading = ref(false);
const editForm = ref({
  repeat_task_id: '',
  repeat_task_name: '',
  resource_id: 0,
  repeat_task_type: 'code',
});

async function handleEdit(record: RepeatTaskItem) {
  try {
    const res = await getResourceListApi();
    resources.value = res.items ?? [];
  } catch {
    resources.value = [];
  }
  editForm.value = {
    repeat_task_id: record.repeat_task_id,
    repeat_task_name: record.repeat_task_name,
    resource_id: record.resource_id,
    repeat_task_type: record.repeat_task_type || 'code',
  };
  editModalVisible.value = true;
}

async function handleEditSubmit() {
  if (!editForm.value.repeat_task_name) {
    message.warning('请输入复扫任务名称');
    return;
  }
  editLoading.value = true;
  try {
    await updateRepeatTaskApi({
      repeat_task_id: editForm.value.repeat_task_id,
      repeat_task_name: editForm.value.repeat_task_name,
      resource_id: editForm.value.resource_id,
      repeat_task_type: editForm.value.repeat_task_type,
    });
    message.success('复扫任务更新成功');
    editModalVisible.value = false;
    await fetchTasks();
  } catch {
    message.error('更新复扫任务失败');
  } finally {
    editLoading.value = false;
  }
}

function handleDelete(record: RepeatTaskItem) {
  modalApi.confirm({
    title: '确认删除',
    content: `确定删除复扫任务 [${record.repeat_task_name}] 吗？`,
    okText: '删除',
    okType: 'danger',
    onOk: async () => {
      try {
        await deleteRepeatTaskApi(record.repeat_task_id);
        message.success('复扫任务已删除');
        await fetchTasks();
      } catch {
        message.error('删除复扫任务失败');
      }
    },
  });
}

onMounted(() => {
  fetchTasks();
});
</script>

<template>
  <Page description="管理复扫任务" title="复扫任务">
    <Card class="mb-5">
      <div class="flex items-center justify-between">
        <span class="text-sm text-gray-500">源任务 ID：{{ taskId }}</span>
        <Button type="primary" @click="openCreateModal">新增复扫任务</Button>
      </div>
    </Card>

    <Card>
      <Table
        :columns="columns"
        :data-source="tasks"
        :loading="loading"
        :pagination="{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total: number) => `共 ${total} 条`,
        }"
        bordered
        row-key="id"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <Tag :color="statusColorMap[record.status] || 'default'">
              {{ statusLabelMap[record.status] || record.status }}
            </Tag>
          </template>
          <template v-if="column.key === 'repeat_task_type'">
            {{ record.repeat_task_type === 'code' ? '源码' : record.repeat_task_type === 'pta' ? '渗透' : record.repeat_task_type }}
          </template>
          <template v-if="column.key === 'action'">
            <Space :size="4">
              <Button
                size="small"
                :type="record.status === 'running' ? 'default' : 'primary'"
                @click="handleStart(record)"
              >
                {{ record.status === 'running' ? '停止' : record.status === 'stopped' ? '继续' : '启动' }}
              </Button>
              <Button size="small" @click="handleDetail(record)">详情</Button>
              <Button size="small" @click="handleEdit(record)">编辑</Button>
              <Button danger size="small" @click="handleDelete(record)">删除</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <Modal
      v-model:visible="createModalVisible"
      :confirm-loading="createLoading"
      cancel-text="取消"
      ok-text="创建"
      title="新增复扫任务"
      @ok="handleCreate"
    >
      <Form layout="vertical">
        <Form.Item label="复扫任务名称" required>
          <Input
            v-model:value="createForm.repeat_task_name"
            placeholder="例如: 认证漏洞复扫"
          />
        </Form.Item>
        <Form.Item label="选择资源" required>
          <Select
            v-model:value="createForm.resource_id"
            :options="
              resources.map((r) => ({
                label: `${r.code}:${r.version} - ${r.description || '无描述'}`,
                value: r.id,
              }))
            "
            placeholder="请选择资源"
          />
        </Form.Item>
        <Form.Item label="复扫任务类型" required>
          <Select v-model:value="createForm.repeat_task_type">
            <Select.Option value="code">源码</Select.Option>
            <Select.Option value="pta">渗透</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:visible="editModalVisible"
      :confirm-loading="editLoading"
      cancel-text="取消"
      ok-text="保存"
      title="编辑复扫任务"
      @ok="handleEditSubmit"
    >
      <Form layout="vertical">
        <Form.Item label="复扫任务名称" required>
          <Input v-model:value="editForm.repeat_task_name" />
        </Form.Item>
        <Form.Item label="选择资源" required>
          <Select
            v-model:value="editForm.resource_id"
            :options="
              resources.map((r) => ({
                label: `${r.code}:${r.version} - ${r.description || '无描述'}`,
                value: r.id,
              }))
            "
            placeholder="请选择资源"
          />
        </Form.Item>
        <Form.Item label="复扫任务类型" required>
          <Select v-model:value="editForm.repeat_task_type">
            <Select.Option value="code">源码</Select.Option>
            <Select.Option value="pta">渗透</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>

    <contextHolder />
  </Page>
</template>
