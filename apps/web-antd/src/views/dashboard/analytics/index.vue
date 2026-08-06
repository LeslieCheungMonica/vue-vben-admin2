<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Form,
  Input,
  message,
  Modal,
  Space,
  Table,
  Tag,
  Upload,
} from 'ant-design-vue';

import JSZip from 'jszip';

import {
  deleteResourceApi,
  getResourceListApi,
  uploadResourceApi,
} from '#/api/core/resource';
import type { ResourceApi } from '#/api/core/resource';
import { buildGraphFromDirectory, shouldIgnorePath } from '../workspace/graph-builder';

const UseModal = Modal.useModal();
const [modalApi, contextHolder] = UseModal;

const loading = ref(false);
const resources = ref<ResourceApi.ResourceItem[]>([]);
const filterCode = ref('');
const filterVersion = ref('');

const uploadModalVisible = ref(false);
const uploadLoading = ref(false);
const uploadForm = ref({
  code: '',
  version: '',
  description: '',
  file: null as File | null,
});

async function fetchList() {
  loading.value = true;
  try {
    const res = await getResourceListApi(filterCode.value, filterVersion.value);
    resources.value = res.items ?? [];
  } catch {
    message.error('获取资源列表失败');
  } finally {
    loading.value = false;
  }
}

function handleDelete(record: ResourceApi.ResourceItem) {
  modalApi.confirm({
    content: `确定删除资源 [${record.code}:${record.version}] 吗？`,
    okText: '删除',
    okType: 'danger',
    title: '确认删除',
    onOk: async () => {
      try {
        await deleteResourceApi(record.id);
        message.success('删除成功');
        await fetchList();
      } catch {
        message.error('删除失败');
      }
    },
  });
}

function handleFileChange(file: File) {
  uploadForm.value.file = file;
  return false;
}

async function handleUpload() {
  if (!uploadForm.value.file) {
    message.warning('请选择 ZIP 文件');
    return;
  }
  if (!uploadForm.value.code) {
    message.warning('请输入资源标识');
    return;
  }
  if (!uploadForm.value.version) {
    message.warning('请输入版本号');
    return;
  }

  uploadLoading.value = true;
  try {
    const formData = new FormData();
    formData.append('file', uploadForm.value.file);
    formData.append('code', uploadForm.value.code);
    formData.append('version', uploadForm.value.version);
    if (uploadForm.value.description) {
      formData.append('description', uploadForm.value.description);
    }

    message.info('正在解析代码图谱...');
    let graphJson = '';
    try {
      const zip = await JSZip.loadAsync(uploadForm.value.file);
      const entries: { path: string; content: string }[] = [];
      const filePromises: Promise<void>[] = [];
      zip.forEach((relPath, zipEntry) => {
        if (zipEntry.dir) return;
        const path = `${uploadForm.value.code}/${relPath}`;
        if (shouldIgnorePath(path)) return;
        filePromises.push(
          zipEntry.async('string').then((content) => {
            entries.push({ path, content });
          }).catch(() => {}),
        );
      });
      await Promise.all(filePromises);
      if (entries.length > 0) {
        const graphData = buildGraphFromDirectory(entries);
        graphJson = JSON.stringify(graphData);
      }
    } catch { /* graph parsing is optional */ }

    if (graphJson) {
      formData.append('biz_arch_graph', graphJson);
    }

    await uploadResourceApi(formData);
    message.success('上传成功');

    uploadModalVisible.value = false;
    uploadForm.value = { code: '', version: '', description: '', file: null };
    await fetchList();
  } catch {
    message.error('上传失败');
  } finally {
    uploadLoading.value = false;
  }
}

const columns = [
  { dataIndex: 'id', key: 'id', title: 'ID', width: 80 },
  { dataIndex: 'code', key: 'code', title: '资源标识', width: 150 },
  { dataIndex: 'version', key: 'version', title: '版本号', width: 120 },
  { dataIndex: 'description', key: 'description', title: '描述' },
  {
    dataIndex: 'extracted_path',
    key: 'extracted_path',
    title: '解压路径',
    ellipsis: true,
  },
  {
    key: 'action',
    title: '操作',
    width: 100,
  },
];

onMounted(() => {
  fetchList();
});
</script>

<template>
  <Page description="管理已上传的扫描资源" title="资源管理">
    <Card class="mb-5">
      <div class="flex flex-wrap items-center justify-between">
        <Space>
          <span class="text-sm text-gray-500">资源标识：</span>
          <Input
            v-model:value="filterCode"
            class="w-40"
            placeholder="按资源标识过滤"
            @press-enter="fetchList"
          />
          <span class="text-sm text-gray-500">版本号：</span>
          <Input
            v-model:value="filterVersion"
            class="w-40"
            placeholder="按版本号过滤"
            @press-enter="fetchList"
          />
          <Button type="primary" @click="fetchList">查询</Button>
          <Button
            @click="
              filterCode = '';
              filterVersion = '';
              fetchList();
            "
          >
            重置
          </Button>
        </Space>
        <Button type="primary" @click="uploadModalVisible = true">
          上传资源
        </Button>
      </div>
    </Card>

    <Card>
      <Table
        :columns="columns"
        :data-source="resources"
        :loading="loading"
        :pagination="{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total: number) => `共 ${total} 条`,
        }"
        bordered
        row-key="id"
        size="middle"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'extracted_path'">
            <Tag color="blue">{{ record.extracted_path }}</Tag>
          </template>
          <template v-if="column.key === 'action'">
            <Button danger size="small" @click="handleDelete(record)">
              删除
            </Button>
          </template>
        </template>
      </Table>
    </Card>

    <Modal
      v-model:visible="uploadModalVisible"
      :confirm-loading="uploadLoading"
      cancel-text="取消"
      ok-text="上传"
      title="上传资源"
      @ok="handleUpload"
    >
      <Form layout="vertical">
        <Form.Item label="ZIP 文件" required>
          <Upload
            :before-upload="handleFileChange"
            :show-upload-list="true"
            accept=".zip"
          >
            <Button>选择文件</Button>
          </Upload>
        </Form.Item>
        <Form.Item label="资源标识" required>
          <Input v-model:value="uploadForm.code" placeholder="例如: myapp" />
        </Form.Item>
        <Form.Item label="版本号" required>
          <Input v-model:value="uploadForm.version" placeholder="例如: v1.0" />
        </Form.Item>
        <Form.Item label="描述">
          <Input.TextArea
            v-model:value="uploadForm.description"
            placeholder="资源描述（可选）"
            :rows="3"
          />
        </Form.Item>
      </Form>
    </Modal>

    <contextHolder />
  </Page>
</template>
