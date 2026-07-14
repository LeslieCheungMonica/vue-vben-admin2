<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Button, Card, Form, Input, message, Modal, Select, Space, Table, Tag, Tooltip } from 'ant-design-vue';

import { getResourceListApi } from '#/api/core/resource';
import type { ResourceApi } from '#/api/core/resource';
import { createRepeatTaskApi, getRepeatTaskListApi } from '#/api/core/task';
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
    const res = await getRepeatTaskListApi();
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
  modalApi.confirm({
    title: '确认启动',
    content: `确定启动复扫任务 [${record.repeat_task_name}] 吗？`,
    okText: '启动',
    onOk: async () => {
      message.success('复扫任务已启动');
      await fetchTasks();
    },
  });
}

function handleDetail(record: RepeatTaskItem) {
  router.push(`/dashboard/task/detail/${taskId}`);
}

function handleEdit(record: RepeatTaskItem) {
  message.info('编辑复扫任务（待对接接口）');
}

function handleDelete(record: RepeatTaskItem) {
  modalApi.confirm({
    title: '确认删除',
    content: `确定删除复扫任务 [${record.repeat_task_name}] 吗？`,
    okText: '删除',
    okType: 'danger',
    onOk: async () => {
      message.success('复扫任务已删除');
      await fetchTasks();
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
          <template v-if="column.key === 'action'">
            <Space :size="4">
              <Tooltip title="启动复扫任务">
                <Button size="small" type="primary" @click="handleStart(record)">启动</Button>
              </Tooltip>
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
            <Select.Option value="code">源码 code</Select.Option>
            <Select.Option value="pta">渗透 pta</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>

    <contextHolder />
  </Page>
</template>
