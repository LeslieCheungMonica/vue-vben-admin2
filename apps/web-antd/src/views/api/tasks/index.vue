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

import {
  createApiEndpointTaskApi,
  deleteApiEndpointTaskApi,
  getApiEndpointTaskListApi,
  startApiEndpointTaskApi,
  stopApiEndpointTaskApi,
  updateApiEndpointTaskApi,
  type ApiEndpointApi,
} from '#/api/core/apiEndpoint';
import { getResourceListApi, type ResourceApi } from '#/api/core/resource';

const router = useRouter();

const loading = ref(false);
const tasks = ref<ApiEndpointApi.TaskItem[]>([]);
const resources = ref<ResourceApi.ResourceItem[]>([]);

const createModalVisible = ref(false);
const createLoading = ref(false);
const createForm = ref({
  task_name: '',
  resource_id: 0,
  main_domain: '',
  resource_path: '',
});

const editModalVisible = ref(false);
const editLoading = ref(false);
const editForm = ref({
  task_id: '',
  task_name: '',
  main_domain: '',
  resource_path: '',
});

const statusColorMap: Record<string, string> = {
  'wait-to-start': 'default',
  processing: 'processing',
  completed: 'success',
  failed: 'error',
  stopped: 'warning',
};

const statusLabelMap: Record<string, string> = {
  'wait-to-start': '等待启动',
  processing: '处理中',
  completed: '已完成',
  failed: '失败',
  stopped: '已停止',
};

const columns = [
  { title: '任务ID', dataIndex: 'task_id', key: 'task_id', width: 260 },
  { title: '任务名称', dataIndex: 'task_name', key: 'task_name' },
  { title: '主域名', dataIndex: 'main_domain', key: 'main_domain' },
  { title: '资源路径', dataIndex: 'resource_path', key: 'resource_path' },
{
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
    },
  { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 180 },
  {
    title: '操作',
    key: 'action',
    width: 300,
  },
];

async function fetchTasks() {
  loading.value = true;
  try {
    const res = await getApiEndpointTaskListApi();
    tasks.value = res.items || [];
  } catch {
    message.error('获取任务列表失败');
  } finally {
    loading.value = false;
  }
}

async function fetchResources() {
  try {
    const res = await getResourceListApi();
    resources.value = res.items || [];
  } catch {
    message.error('获取资源列表失败');
  }
}

async function handleCreate() {
  if (!createForm.value.task_name) {
    message.warning('请输入任务名称');
    return;
  }
  createLoading.value = true;
  try {
    await createApiEndpointTaskApi({
      task_name: createForm.value.task_name,
      resource_id: createForm.value.resource_id,
      main_domain: createForm.value.main_domain || undefined,
      resource_path: createForm.value.resource_path || undefined,
    });
    message.success('任务创建成功');
    createModalVisible.value = false;
    createForm.value = { task_name: '', resource_id: 0, main_domain: '', resource_path: '' };
    await fetchTasks();
  } catch {
    message.error('创建任务失败');
  } finally {
    createLoading.value = false;
  }
}

function handleEdit(task: ApiEndpointApi.TaskItem) {
  editForm.value = {
    task_id: task.task_id,
    task_name: task.task_name,
    main_domain: task.main_domain,
    resource_path: task.resource_path,
  };
  editModalVisible.value = true;
}

async function handleUpdate() {
  editLoading.value = true;
  try {
    await updateApiEndpointTaskApi({
      task_id: editForm.value.task_id,
      task_name: editForm.value.task_name || undefined,
      main_domain: editForm.value.main_domain || undefined,
      resource_path: editForm.value.resource_path || undefined,
    });
    message.success('任务更新成功');
    editModalVisible.value = false;
    await fetchTasks();
  } catch {
    message.error('更新任务失败');
  } finally {
    editLoading.value = false;
  }
}

async function handleStart(taskId: string) {
  try {
    await startApiEndpointTaskApi(taskId);
    message.success('任务已启动');
    await fetchTasks();
  } catch {
    message.error('启动任务失败');
  }
}

async function handleStop(taskId: string) {
  try {
    await stopApiEndpointTaskApi(taskId);
    message.success('任务已停止');
    await fetchTasks();
  } catch {
    message.error('停止任务失败');
  }
}

function handleDelete(taskId: string) {
  Modal.confirm({
    title: '确认删除',
    content: `确定删除任务 ${taskId} 吗？`,
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    onOk: async () => {
      try {
        await deleteApiEndpointTaskApi(taskId);
        message.success('任务已删除');
        await fetchTasks();
      } catch {
        message.error('删除任务失败');
      }
    },
  });
}

function handleViewDetail(taskId: string) {
  router.push(`/api/task/detail/${taskId}`);
}

onMounted(() => {
  fetchTasks();
  fetchResources();
});
</script>

<template>
  <Page title="API 任务管理" description="管理 API 端点扫描任务">
    <Card>
      <div class="mb-4 flex items-center justify-between">
        <span class="text-lg font-medium">API 端点任务列表</span>
        <Button type="primary" @click="createModalVisible = true">新建任务</Button>
      </div>
      <Table
        :columns="columns"
        :data-source="tasks"
        :loading="loading"
        row-key="task_id"
        :pagination="{ pageSize: 10 }"
      >
        <template #bodyCell="{ column, record }: { column: any; record: ApiEndpointApi.TaskItem }">
          <template v-if="column.key === 'status'">
            <Tag :color="statusColorMap[record.status] || 'default'">{{ statusLabelMap[record.status] || record.status }}</Tag>
          </template>
          <template v-if="column.key === 'action'">
            <Space>
              <Tooltip title="查看详情">
                <Button size="small" type="link" @click="handleViewDetail(record.task_id)">详情</Button>
              </Tooltip>
              <Tooltip title="编辑任务">
                <Button size="small" type="link" @click="handleEdit(record)">编辑</Button>
              </Tooltip>
              <Tooltip v-if="record.status === 'wait-to-start'" title="启动任务">
                <Button size="small" type="link" @click="handleStart(record.task_id)">启动</Button>
              </Tooltip>
              <Tooltip v-if="record.status === 'processing'" title="停止任务">
                <Button size="small" type="link" danger @click="handleStop(record.task_id)">停止</Button>
              </Tooltip>
              <Tooltip title="删除任务">
                <Button size="small" type="link" danger @click="handleDelete(record.task_id)">删除</Button>
              </Tooltip>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- Create Modal -->
    <Modal
      v-model:open="createModalVisible"
      title="新建 API 端点任务"
      :confirm-loading="createLoading"
      @ok="handleCreate"
    >
      <Form layout="vertical">
        <Form.Item label="任务名称" required>
          <Input v-model:value="createForm.task_name" placeholder="请输入任务名称" />
        </Form.Item>
        <Form.Item label="资源" required>
          <Select v-model:value="createForm.resource_id" placeholder="请选择资源" :options="resources.map(r => ({ label: `${r.code}${r.description ? ' - ' + r.description : ''}`, value: r.id }))" />
        </Form.Item>
        <Form.Item label="主域名">
          <Input v-model:value="createForm.main_domain" placeholder="例如: example.com" />
        </Form.Item>
        <Form.Item label="资源路径">
          <Input v-model:value="createForm.resource_path" placeholder="例如: /codes/project1" />
        </Form.Item>
      </Form>
    </Modal>

    <!-- Edit Modal -->
    <Modal
      v-model:open="editModalVisible"
      title="编辑任务"
      :confirm-loading="editLoading"
      @ok="handleUpdate"
    >
      <Form layout="vertical">
        <Form.Item label="任务名称">
          <Input v-model:value="editForm.task_name" />
        </Form.Item>
        <Form.Item label="主域名">
          <Input v-model:value="editForm.main_domain" />
        </Form.Item>
        <Form.Item label="资源路径">
          <Input v-model:value="editForm.resource_path" />
        </Form.Item>
      </Form>
    </Modal>
  </Page>
</template>