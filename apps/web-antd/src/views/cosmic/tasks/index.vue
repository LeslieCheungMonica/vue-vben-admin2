<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
} from 'ant-design-vue';

import { createCosmicTaskApi, deleteCosmicTaskApi, exportCosmicReportApi, getCosmicResourceListApi, getCosmicTaskListApi, startCosmicTaskApi, stopCosmicTaskApi, updateCosmicTaskApi } from '#/api/core/cosmic';
import type { CosmicApi } from '#/api/core/cosmic';
import { getResourceListApi } from '#/api/core/resource';
import type { ResourceApi } from '#/api/core/resource';

const router = useRouter();

const loading = ref(false);
const tasks = ref<CosmicApi.TaskItem[]>([]);

const createModalVisible = ref(false);
const createLoading = ref(false);
const codeResources = ref<ResourceApi.ResourceItem[]>([]);
const cosmicResources = ref<CosmicApi.ResourceItem[]>([]);
const createForm = ref({
  code_resource_id: 0,
  cosmic_resource_id: 0,
  task_name: '',
});

const editModalVisible = ref(false);
const editLoading = ref(false);
const editForm = ref<{
  task_id: string;
  task_name: string;
  code_resource_id: number;
  cosmic_resource_id: number;
}>({
  task_id: '',
  task_name: '',
  code_resource_id: 0,
  cosmic_resource_id: 0,
});

const statusColorMap: Record<string, string> = {
  pending: 'default',
  running: 'processing',
  stopped: 'warning',
  finish: 'success',
  'run-except': 'error',
};

const statusLabelMap: Record<string, string> = {
  pending: '待运行',
  running: '运行中',
  stopped: '已停止',
  finish: '已完成',
  'run-except': '执行异常',
};

async function fetchTasks() {
  loading.value = true;
  try {
    const res = await getCosmicTaskListApi();
    tasks.value = res.items ?? [];
  } catch {
    message.error('获取任务列表失败');
  } finally {
    loading.value = false;
  }
}

async function openCreateModal() {
  createForm.value = {
    code_resource_id: 0,
    cosmic_resource_id: 0,
    task_name: '',
  };
  try {
    const [codeRes, cosmicRes] = await Promise.all([
      getResourceListApi(),
      getCosmicResourceListApi(),
    ]);
    codeResources.value = codeRes.items ?? [];
    cosmicResources.value = cosmicRes.items ?? [];
    createModalVisible.value = true;
  } catch {
    message.error('加载资源列表失败');
  }
}

async function handleCreate() {
  if (!createForm.value.task_name) {
    message.warning('请输入任务名称');
    return;
  }
  if (!createForm.value.code_resource_id) {
    message.warning('请选择代码资源');
    return;
  }
  if (!createForm.value.cosmic_resource_id) {
    message.warning('请选择 COSMIC 资源');
    return;
  }

  createLoading.value = true;
  try {
    await createCosmicTaskApi(createForm.value);
    message.success('任务创建成功');
    createModalVisible.value = false;
    await fetchTasks();
  } catch {
    message.error('创建任务失败');
  } finally {
    createLoading.value = false;
  }
}

async function handleStart(record: CosmicApi.TaskItem) {
  try {
    await startCosmicTaskApi(record.task_id);
    message.success('任务已提交启动');
    await fetchTasks();
  } catch {
    message.error('启动任务失败');
  }
}

async function handleStop(record: CosmicApi.TaskItem) {
  try {
    await stopCosmicTaskApi(record.task_id);
    message.success('任务已停止');
    await fetchTasks();
  } catch {
    message.error('停止任务失败');
  }
}

function showDetail(record: CosmicApi.TaskItem) {
  router.push(`/cosmic/task/detail/${record.task_id}`);
}

async function openEditModal(record: CosmicApi.TaskItem) {
  editForm.value = {
    task_id: record.task_id,
    task_name: record.task_name,
    code_resource_id: record.code_resource_id,
    cosmic_resource_id: record.cosmic_resource_id,
  };
  try {
    const [codeRes, cosmicRes] = await Promise.all([
      getResourceListApi(),
      getCosmicResourceListApi(),
    ]);
    codeResources.value = codeRes.items ?? [];
    cosmicResources.value = cosmicRes.items ?? [];
    editModalVisible.value = true;
  } catch {
    message.error('加载资源列表失败');
  }
}

async function handleEdit() {
  if (!editForm.value.task_name) {
    message.warning('请输入任务名称');
    return;
  }
  if (!editForm.value.code_resource_id) {
    message.warning('请选择代码资源');
    return;
  }
  if (!editForm.value.cosmic_resource_id) {
    message.warning('请选择 COSMIC 资源');
    return;
  }

  editLoading.value = true;
  try {
    await updateCosmicTaskApi(editForm.value);
    message.success('任务更新成功');
    editModalVisible.value = false;
    await fetchTasks();
  } catch {
    message.error('更新任务失败');
  } finally {
    editLoading.value = false;
  }
}

async function handleDelete(record: CosmicApi.TaskItem) {
  Modal.confirm({
    content: `确定删除任务「${record.task_name}」吗？`,
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    onOk: async () => {
      try {
        await deleteCosmicTaskApi(record.task_id);
        message.success('任务已删除');
        await fetchTasks();
      } catch {
        message.error('删除任务失败');
      }
    },
  });
}

async function handleExport(taskId: string, taskName: string) {
  try {
    const res = await exportCosmicReportApi(taskId);
    const blob = res.data as Blob;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cosmic_report_${taskId}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    message.success(`报告「${taskName}」已导出`);
  } catch {
    message.error('导出报告失败');
  }
}

const columns = [
  {
    dataIndex: 'task_id',
    key: 'task_id',
    title: '任务 ID',
    width: 220,
    ellipsis: true,
  },
  {
    dataIndex: 'task_name',
    key: 'task_name',
    title: '任务名称',
    width: 200,
    ellipsis: true,
  },
  { dataIndex: 'status', key: 'status', title: '状态', width: 100 },
  { dataIndex: 'created_at', key: 'created_at', title: '创建时间', width: 180 },
  { key: 'action', title: '操作', width: 300 },
];

onMounted(() => {
  fetchTasks();
});
</script>

<template>
  <Page description="管理 COSMIC 功能存在性判定任务" title="Cosmic 任务管理">
    <Card class="mb-5">
      <div class="flex items-center justify-between">
        <Space>
          <span class="text-sm text-gray-500"
            >共 {{ tasks.length }} 个任务</span
          >
        </Space>
        <Button type="primary" @click="openCreateModal">创建任务</Button>
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
        row-key="task_id"
        size="middle"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'task_id'">
            <Tooltip :title="record.task_id">
              <span class="truncate block max-w-[200px]">{{
                record.task_id
              }}</span>
            </Tooltip>
          </template>
          <template v-if="column.key === 'status'">
            <Tag :color="statusColorMap[record.status] || 'default'">
              {{ statusLabelMap[record.status] || record.status }}
            </Tag>
          </template>
          <template v-if="column.key === 'action'">
            <Space :size="4">
              <Tooltip
                v-if="
                  record.status === 'pending' ||
                  record.status === 'stopped' ||
                  record.status === 'finish' ||
                  record.status === 'run-except'
                "
                title="启动任务"
              >
                <Button
                  size="small"
                  type="primary"
                  @click="handleStart(record)"
                >
                  启动
                </Button>
              </Tooltip>
              <Tooltip v-if="record.status === 'running'" title="停止任务">
                <Button size="small" @click="handleStop(record)"> 停止 </Button>
              </Tooltip>
              <Tooltip title="导出报告">
                <Button
                  size="small"
                  @click="handleExport(record.task_id, record.task_name)"
                >
                  导出报告
                </Button>
              </Tooltip>
              <Button size="small" @click="showDetail(record)">详情</Button>
              <Button size="small" @click="openEditModal(record)">编辑</Button>
              <Button danger size="small" @click="handleDelete(record)"
                >删除</Button
              >
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <Modal
      v-model:visible="createModalVisible"
      :confirm-loading="createLoading"
      :width="600"
      cancel-text="取消"
      ok-text="创建"
      title="创建 COSMIC 任务"
      @ok="handleCreate"
    >
      <Form layout="vertical">
        <Form.Item label="代码资源" required>
          <Select
            v-model:value="createForm.code_resource_id"
            :options="
              codeResources.map((r) => ({
                label: `${r.code}:${r.version} - ${r.description || '无描述'}`,
                value: r.id,
              }))
            "
            placeholder="请选择已上传的代码资源"
          />
        </Form.Item>
        <Form.Item label="COSMIC 资源" required>
          <Select
            v-model:value="createForm.cosmic_resource_id"
            :options="
              cosmicResources.map((r) => ({
                label: `${r.real_file_name} - ${r.description || '无描述'}`,
                value: r.id,
              }))
            "
            placeholder="请选择已上传的 COSMIC Excel 文件"
          />
        </Form.Item>
        <Form.Item label="任务名称" required>
          <Input
            v-model:value="createForm.task_name"
            placeholder="例如: SDC COSMIC 评估"
          />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:visible="editModalVisible"
      :confirm-loading="editLoading"
      :width="600"
      cancel-text="取消"
      ok-text="保存"
      title="编辑 COSMIC 任务"
      @ok="handleEdit"
    >
      <Form layout="vertical">
        <Form.Item label="代码资源" required>
          <Select
            v-model:value="editForm.code_resource_id"
            :options="
              codeResources.map((r) => ({
                label: `${r.code}:${r.version} - ${r.description || '无描述'}`,
                value: r.id,
              }))
            "
            placeholder="请选择已上传的代码资源"
          />
        </Form.Item>
        <Form.Item label="COSMIC 资源" required>
          <Select
            v-model:value="editForm.cosmic_resource_id"
            :options="
              cosmicResources.map((r) => ({
                label: `${r.real_file_name} - ${r.description || '无描述'}`,
                value: r.id,
              }))
            "
            placeholder="请选择已上传的 COSMIC Excel 文件"
          />
        </Form.Item>
        <Form.Item label="任务名称" required>
          <Input
            v-model:value="editForm.task_name"
            placeholder="例如: SDC COSMIC 评估"
          />
        </Form.Item>
      </Form>
    </Modal>
  </Page>
</template>
