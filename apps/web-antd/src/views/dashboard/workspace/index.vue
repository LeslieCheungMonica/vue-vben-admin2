<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Checkbox,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Tooltip,
} from 'ant-design-vue';

import { getResourceListApi } from '#/api/core/resource';
import type { ResourceApi } from '#/api/core/resource';
import {
  createTaskApi,
  deleteTaskApi,
  getTaskListApi,
  startTaskApi,
  stopTaskApi,
  updateTaskApi,
} from '#/api/core/task';
import type { TaskApi } from '#/api/core/task';

const router = useRouter();

const UseModal = Modal.useModal();
const [modalApi, contextHolder] = UseModal;

const loading = ref(false);
const tasks = ref<TaskApi.TaskItem[]>([]);
const filterKeyword = ref('');

const createModalVisible = ref(false);
const createLoading = ref(false);
const resources = ref<ResourceApi.ResourceItem[]>([]);
const createForm = ref<TaskApi.TaskCreateParams>({
  resource_id: 0,
  task_name: '',
  web_url: '',
  code_desc: '',
  scan_scope: '',
  focus: '',
  login_flow: '',
  success_condition: '',
  core_biz_domain: '',
  core_biz_sub_domain_demo: '',
  api_example: '',
  skip_exploit: 'no',
});

const editModalVisible = ref(false);
const editLoading = ref(false);
const editTask = ref<TaskApi.TaskItem | null>(null);
const editForm = ref<TaskApi.TaskUpdateParams>({ task_id: '' });

const scopeOptions = [
  { label: '认证漏洞 (auth)', value: 'auth' },
  { label: '越权 (authz)', value: 'authz' },
  { label: '注入 (injection)', value: 'injection' },
  { label: 'SSRF', value: 'ssrf' },
  { label: 'XSS (xss)', value: 'xss' },
  { label: '业务逻辑 (biz)', value: 'biz' },
];

const statusColorMap: Record<string, string> = {
  'wait-to-start': 'default',
  running: 'processing',
  stopped: 'warning',
  'run-except': 'error',
  invalid: 'default',
};

const statusLabelMap: Record<string, string> = {
  'wait-to-start': '待运行',
  running: '运行中',
  stopped: '已停止',
  finish: '执行完成',
  'run-except': '执行异常',
  invalid: '执行完成',
};

async function fetchTasks() {
  loading.value = true;
  try {
    const res = await getTaskListApi(filterKeyword.value || undefined);
    tasks.value = res.items ?? [];
  } catch {
    message.error('获取任务列表失败');
  } finally {
    loading.value = false;
  }
}

async function fetchResources() {
  try {
    const res = await getResourceListApi();
    resources.value = res.items ?? [];
  } catch {
    console.error('获取资源列表失败');
  }
}

function openCreateModal() {
  createForm.value = {
    resource_id: 0,
    task_name: '',
    web_url: '',
    code_desc: '',
    scan_scope: '',
    focus: '',
    login_flow: '',
    success_condition: '',
    core_biz_domain: '',
    core_biz_sub_domain_demo: '',
    api_example: '',
    skip_exploit: 'no',
  };
  createModalVisible.value = true;
  fetchResources();
}

function handleScopeChange(checkedValues: string[]) {
  createForm.value.scan_scope = checkedValues.join(',');
}

async function handleCreate() {
  if (!createForm.value.resource_id) {
    message.warning('请选择资源');
    return;
  }
  if (!createForm.value.task_name) {
    message.warning('请输入任务名称');
    return;
  }
  if (!createForm.value.web_url) {
    message.warning('请输入目标 Web 地址');
    return;
  }
  if (!createForm.value.code_desc) {
    message.warning('请输入项目描述');
    return;
  }
  if (!createForm.value.scan_scope) {
    message.warning('请选择扫描范围');
    return;
  }

  createLoading.value = true;
  try {
    await createTaskApi(createForm.value);
    message.success('任务创建成功');
    createModalVisible.value = false;
    await fetchTasks();
  } catch {
    message.error('创建任务失败');
  } finally {
    createLoading.value = false;
  }
}

function handleStart(record: TaskApi.TaskItem) {
  modalApi.confirm({
    content: `确定启动任务 [${record.task_name}] 吗？`,
    okText: '启动',
    title: '确认启动',
    onOk: async () => {
      try {
        await startTaskApi(record.task_id);
        message.success('任务已启动');
        await fetchTasks();
      } catch {
        message.error('启动任务失败');
      }
    },
  });
}

function handleStop(record: TaskApi.TaskItem) {
  modalApi.confirm({
    content: `确定停止任务 [${record.task_name}] 吗？`,
    okText: '停止',
    title: '确认停止',
    onOk: async () => {
      try {
        await stopTaskApi(record.task_id);
        message.success('任务已停止');
        await fetchTasks();
      } catch {
        message.error('停止任务失败');
      }
    },
  });
}

function showDetail(record: TaskApi.TaskItem) {
  router.push(`/dashboard/task/detail/${record.task_id}`);
}

function openEditModal(record: TaskApi.TaskItem) {
  editTask.value = record;
  editForm.value = {
    task_id: record.task_id,
    task_name: record.task_name,
    web_url: record.web_url,
    code_desc: record.code_desc,
    scan_scope: record.scan_scope,
    focus: record.focus,
    login_flow: record.login_flow,
    success_condition: record.success_condition,
    core_biz_domain: record.core_biz_domain,
    core_biz_sub_domain_demo: record.core_biz_sub_domain_demo,
    api_example: record.api_example || '',
    skip_exploit: record.skip_exploit || 'no',
  };
  editModalVisible.value = true;
}

function handleEditScopeChange(checkedValues: string[]) {
  editForm.value.scan_scope = checkedValues.join(',');
}

async function handleUpdate() {
  if (!editForm.value.task_name) {
    message.warning('请输入任务名称');
    return;
  }
  if (!editForm.value.web_url) {
    message.warning('请输入目标 Web 地址');
    return;
  }
  if (!editForm.value.code_desc) {
    message.warning('请输入项目描述');
    return;
  }
  if (!editForm.value.scan_scope) {
    message.warning('请选择扫描范围');
    return;
  }

  editLoading.value = true;
  try {
    await updateTaskApi(editForm.value);
    message.success('任务更新成功');
    editModalVisible.value = false;
    await fetchTasks();
  } catch {
    message.error('更新任务失败');
  } finally {
    editLoading.value = false;
  }
}

function handleDownload(record: TaskApi.TaskItem) {
  const a = document.createElement('a');
  a.href = `/api/wape/download_report_zip/${record.task_id}`;
  a.download = `${record.task_id}_report.zip`;
  a.click();
}

function handleDelete(record: TaskApi.TaskItem) {
  modalApi.confirm({
    content: `确定删除任务 [${record.task_name}] 吗？`,
    okText: '删除',
    okType: 'danger',
    title: '确认删除',
    onOk: async () => {
      try {
        await deleteTaskApi(record.task_id);
        message.success('任务已删除');
        await fetchTasks();
      } catch {
        message.error('删除任务失败');
      }
    },
  });
}

const SCAN_SCOPE_LIST = ['auth', 'authz', 'inject', 'ssrf', 'xss', 'biz'];

const columns = [
  {
    dataIndex: 'task_id',
    key: 'task_id',
    title: '任务 ID',
    width: 160,
    ellipsis: true,
  },
  {
    dataIndex: 'task_name',
    key: 'task_name',
    title: '任务名称',
    width: 140,
    ellipsis: true,
  },
  {
    dataIndex: 'web_url',
    key: 'web_url',
    title: '目标地址',
    width: 200,
    ellipsis: true,
  },
  { dataIndex: 'scan_scope', key: 'scan_scope', title: '扫描范围', width: 350 },
  { dataIndex: 'status', key: 'status', title: '状态', width: 100 },
  { dataIndex: 'created_at', key: 'created_at', title: '创建时间', width: 160 },
  { key: 'action', title: '操作', width: 260, fixed: 'right' as const },
];

onMounted(() => {
  fetchTasks();
});
</script>

<template>
  <Page description="管理扫描任务的创建、启动与监控" title="智能体任务管理">
    <Card class="mb-5">
      <div class="flex flex-wrap items-center justify-between">
        <Space>
          <span class="text-sm text-gray-500">任务 ID：</span>
          <Input
            v-model:value="filterKeyword"
            class="w-60"
            placeholder="按任务 ID 模糊搜索"
            @press-enter="fetchTasks"
          />
          <Button type="primary" @click="fetchTasks">查询</Button>
          <Button
            @click="
              filterKeyword = '';
              fetchTasks();
            "
            >重置</Button
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
        :scroll="{ x: 'max-content' }"
        bordered
        row-key="task_id"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <Tag :color="statusColorMap[record.status] || 'default'">
              {{ statusLabelMap[record.status] || record.status }}
            </Tag>
          </template>
          <template v-if="column.key === 'web_url'">
            <Tooltip :title="record.web_url">
              <span class="truncate block max-w-[180px]">{{
                record.web_url
              }}</span>
            </Tooltip>
          </template>
          <template v-if="column.key === 'scan_scope'">
            <Space :size="4" wrap>
              <Tag
                v-for="s in SCAN_SCOPE_LIST"
                :key="s"
                :color="
                  record.scan_scope?.split(',').includes(s)
                    ? 'green'
                    : 'default'
                "
              >
                {{ s }}
              </Tag>
            </Space>
          </template>
          <template v-if="column.key === 'action'">
            <Space :size="4">
              <Tooltip
                v-if="record.status === 'invalid'"
                title="任务无效，无法启动"
              >
                <Button size="small" disabled>
                  启动
                </Button>
              </Tooltip>
              <Tooltip
                v-else-if="
                  record.status === 'wait-to-start' ||
                  record.status === 'finish' ||
                  record.status === 'run-except' ||
                  !record.status
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
              <Tooltip v-else-if="record.status === 'running'" title="停止任务">
                <Button size="small" @click="handleStop(record)">停止</Button>
              </Tooltip>
              <Tooltip v-else-if="record.status === 'stopped'" title="继续任务">
                <Button size="small" type="primary" @click="handleStart(record)"
                  >继续</Button
                >
              </Tooltip>
              <span v-else class="text-gray-300 text-xs cursor-not-allowed"
                >—</span
              >
              <Button size="small" @click="router.push(`/dashboard/task/biz-data/${record.task_id}`)">业务范围</Button>
              <Button size="small" @click="router.push(`/dashboard/task/run-status/${record.task_id}`)">运行状态</Button>
              <Button size="small" @click="showDetail(record)">详情</Button>
              <Button size="small" @click="handleDownload(record)">下载</Button>
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
      :width="700"
      cancel-text="取消"
      ok-text="创建"
      title="创建扫描任务"
      @ok="handleCreate"
    >
      <Tabs type="card">
        <Tabs.TabPane key="basic" tab="基础信息">
          <Form layout="vertical">
            <Form.Item label="选择资源" required>
              <Select
                v-model:value="createForm.resource_id"
                :options="
                  resources.map((r) => ({
                    label: `${r.code}:${r.version} - ${r.description || '无描述'}`,
                    value: r.id,
                  }))
                "
                placeholder="请选择已上传的资源"
              />
            </Form.Item>
            <Form.Item label="任务名称" required>
              <Input
                v-model:value="createForm.task_name"
                placeholder="例如: myapp-安全扫描"
              />
            </Form.Item>
            <Form.Item label="目标 Web 地址" required>
              <Input
                v-model:value="createForm.web_url"
                placeholder="例如: https://example.com"
              />
            </Form.Item>
            <Form.Item label="项目描述" required>
              <Input.TextArea
                v-model:value="createForm.code_desc"
                placeholder="描述项目背景和功能"
                :rows="2"
              />
            </Form.Item>
            <Form.Item label="扫描范围" required>
              <Checkbox.Group
                :options="scopeOptions"
                @change="handleScopeChange"
              />
            </Form.Item>
          </Form>
        </Tabs.TabPane>
        <Tabs.TabPane key="intel" tab="情报指导">
          <Form layout="vertical">
            <Form.Item label="重点关注领域">
              <Input.TextArea
                v-model:value="createForm.focus"
                placeholder="例如: 认证授权"
                :rows="3"
              />
            </Form.Item>
            <Form.Item label="登录流程说明">
              <Input.TextArea
                v-model:value="createForm.login_flow"
                placeholder="例如: 表单登录，输入用户名密码后提交 POST /api/login"
                :rows="3"
              />
            </Form.Item>
            <Form.Item label="登录成功判断条件">
              <Input.TextArea
                v-model:value="createForm.success_condition"
                placeholder="例如: 返回200且body包含token字段"
                :rows="3"
              />
            </Form.Item>
            <Form.Item label="核心业务域">
              <Input.TextArea
                v-model:value="createForm.core_biz_domain"
                placeholder="例如: 订单系统"
                :rows="3"
              />
            </Form.Item>
            <Form.Item label="子业务域示例">
              <Input.TextArea
                v-model:value="createForm.core_biz_sub_domain_demo"
                placeholder="例如: 创建订单、支付回调"
                :rows="3"
              />
            </Form.Item>
            <Form.Item label="API 调用样例">
              <Input.TextArea
                v-model:value="createForm.api_example"
                placeholder='例子：http://127.0.0.1/test/list -H "Authorization: $TOKEN"&#10;后台接口访问需要TOKEN：`eyJhbGciOiJIUzUxMiJ9.eyJ0ZW5hbnRJZCI6OTgsInVzZXJUeXBlIjoidGVuYW50IiwidGVuYW50Q29kZSI6IlNEQ1RFTkFOVCIsInVzZXJOYW1lIjoibGl5YW5odWkiLCJpYXQiOjE3NzkwODU4ODMsImV4cCI6MTc3OTE3MjI4MywianRpIjoibG9naW5fdG9rZW5zOnRlbmFudDpsaXlhbmh1aSJ9...`'
                :rows="5"
              />
            </Form.Item>
            <Form.Item label="跳过利用阶段">
              <Select v-model:value="createForm.skip_exploit">
                <Select.Option value="no">否</Select.Option>
                <Select.Option value="yes">是</Select.Option>
              </Select>
            </Form.Item>
          </Form>
        </Tabs.TabPane>
      </Tabs>
    </Modal>

    <Modal
      v-model:visible="editModalVisible"
      :confirm-loading="editLoading"
      :width="700"
      cancel-text="取消"
      ok-text="保存"
      title="编辑任务"
      @ok="handleUpdate"
    >
      <Tabs v-if="editTask" type="card">
        <Tabs.TabPane key="basic" tab="基础信息">
          <Form layout="vertical">
            <Form.Item label="任务 ID">
              <Input :value="editTask.task_id" disabled />
            </Form.Item>
            <Form.Item label="资源 ID">
              <Input :value="editTask.resource_id" disabled />
            </Form.Item>
            <Form.Item label="状态">
              <Input
                :value="statusLabelMap[editTask.status] || editTask.status"
                disabled
              />
            </Form.Item>
            <Form.Item label="创建时间">
              <Input :value="editTask.created_at" disabled />
            </Form.Item>
            <Form.Item label="任务名称" required>
              <Input v-model:value="editForm.task_name" />
            </Form.Item>
            <Form.Item label="目标 Web 地址" required>
              <Input v-model:value="editForm.web_url" />
            </Form.Item>
            <Form.Item label="项目描述" required>
              <Input.TextArea v-model:value="editForm.code_desc" :rows="3" />
            </Form.Item>
            <Form.Item label="扫描范围" required>
              <Checkbox.Group
                :options="scopeOptions"
                :value="
                  editForm.scan_scope ? editForm.scan_scope.split(',') : []
                "
                @change="handleEditScopeChange"
              />
            </Form.Item>
          </Form>
        </Tabs.TabPane>
        <Tabs.TabPane key="intel" tab="情报指导">
          <Form layout="vertical">
            <Form.Item label="重点关注领域">
              <Input.TextArea v-model:value="editForm.focus" :rows="3" />
            </Form.Item>
            <Form.Item label="登录流程说明">
              <Input.TextArea v-model:value="editForm.login_flow" :rows="3" />
            </Form.Item>
            <Form.Item label="登录成功判断条件">
              <Input.TextArea
                v-model:value="editForm.success_condition"
                :rows="3"
              />
            </Form.Item>
            <Form.Item label="核心业务域">
              <Input.TextArea
                v-model:value="editForm.core_biz_domain"
                :rows="3"
              />
            </Form.Item>
            <Form.Item label="子业务域示例">
              <Input.TextArea
                v-model:value="editForm.core_biz_sub_domain_demo"
                :rows="3"
              />
            </Form.Item>
            <Form.Item label="API 调用样例">
              <Input.TextArea
                v-model:value="editForm.api_example"
                placeholder='例子：http://127.0.0.1/test/list -H "Authorization: $TOKEN"&#10;后台接口访问需要TOKEN：`eyJhbGciOiJIUzUxMiJ9.eyJ0ZW5hbnRJZCI6OTgsInVzZXJUeXBlIjoidGVuYW50IiwidGVuYW50Q29kZSI6IlNEQ1RFTkFOVCIsInVzZXJOYW1lIjoibGl5YW5odWkiLCJpYXQiOjE3NzkwODU4ODMsImV4cCI6MTc3OTE3MjI4MywianRpIjoibG9naW5fdG9rZW5zOnRlbmFudDpsaXlhbmh1aSJ9...`'
                :rows="5"
              />
            </Form.Item>
            <Form.Item label="跳过利用阶段">
              <Select v-model:value="editForm.skip_exploit">
                <Select.Option value="no">否</Select.Option>
                <Select.Option value="yes">是</Select.Option>
              </Select>
            </Form.Item>
          </Form>
        </Tabs.TabPane>
      </Tabs>
    </Modal>

    <contextHolder />
  </Page>
</template>
