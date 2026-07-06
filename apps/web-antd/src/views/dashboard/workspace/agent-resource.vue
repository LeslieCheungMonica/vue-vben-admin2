<script lang="ts" setup>
import { onMounted, ref } from 'vue';

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
  Table,
  Tag,
  Upload,
} from 'ant-design-vue';

import {
  deleteResourceApi,
  getResourceListApi,
  saveAgentConfigKejiApi,
  uploadResourceApi,
} from '#/api/core/resource';
import type { ResourceApi } from '#/api/core/resource';

const UseModal = Modal.useModal();
const [modalApi, contextHolder] = UseModal;

const loading = ref(false);
const resources = ref<ResourceApi.ResourceItem[]>([]);
const expandedRowKeys = ref<string[]>([]);

const uploadModalVisible = ref(false);
const uploadLoading = ref(false);
const uploadForm = ref({
  code: '',
  version: '',
  description: '',
  file: null as File | null,
});

const agentForm = ref({
  name: '',
  type: 'vuln_scan',
  target: '',
  targetUrl: '',
  description: '',
});

const codeConfig = ref({
  version: '',
  path: '',
  languages: [] as string[],
  gitRepo: '',
  gitBranch: '',
  gitUsername: '',
  gitPassword: '',
});

const knowledgeConfig = ref({
  source: 'doc_lib',
  url: '',
  documents: [] as { name: string; synced: boolean }[],
});

const bizConfig = ref({
  coreModules: [] as string[],
  coreTables: [] as { enName: string; cnName: string }[],
});

const newModule = ref('');
const newTableEn = ref('');
const newTableCn = ref('');

function onExpand(expanded: boolean, record: any) {
  expandedRowKeys.value = expanded ? [record.id] : [];
  if (expanded) {
    agentForm.value.name = record.agent_name || '';
    agentForm.value.type = record.agent_type === '漏洞扫描与渗透攻击测试' ? 'vuln_scan_penetration' : 'vuln_scan';
    agentForm.value.target = record.target_system || '';
    agentForm.value.description = record.task_description || '';
    codeConfig.value.version = record.version || '';
    codeConfig.value.path = record.extracted_path || '';
    codeConfig.value.gitRepo = record.git_repo || '';
    codeConfig.value.gitBranch = record.git_branch || '';
    codeConfig.value.gitUsername = record.git_username || '';
    codeConfig.value.gitPassword = record.git_password || '';
    codeConfig.value.languages = record.code_language ? record.code_language.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
    knowledgeConfig.value.source = record.kb_source === '自定义上传' ? 'custom_upload' : 'doc_lib';
    knowledgeConfig.value.url = record.kb_url || '';
    function parseJsonField(raw: any): any[] {
      if (!raw) return [];
      try { return JSON.parse(JSON.parse(raw)); } catch {}
      try { return JSON.parse(raw.replace(/\\"/g, '"')); } catch {}
      return [];
    }
    knowledgeConfig.value.documents = parseJsonField(record.doc_list);
    bizConfig.value.coreModules = parseJsonField(record.core_biz_modules);
    const tables = parseJsonField(record.core_data_tables);
    bizConfig.value.coreTables = tables.map((t: any) => ({ enName: t.en || t.enName, cnName: t.cn || t.cnName }));
  }
}

const languageOptions = ['Java', 'Python', 'JavaScript', 'PHP', 'Go', 'C/C++', 'Ruby', 'TypeScript'];

function parseBizModules(raw: any): string {
  if (!raw) return '';
  try {
    const arr = JSON.parse(raw.replace(/\\"/g, '"'));
    return Array.isArray(arr) ? arr.join(', ') : raw;
  } catch { return raw; }
}

async function fetchResources() {
  loading.value = true;
  try {
    const res = await getResourceListApi();
    resources.value = (res.items ?? []).filter((item: ResourceApi.ResourceItem) => item.agent_name);
  } catch {
    message.error('获取资源列表失败');
  } finally {
    loading.value = false;
  }
}

function openUploadModal() {
  uploadForm.value = { code: '', version: '', description: '', file: null };
  uploadModalVisible.value = true;
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
    await uploadResourceApi(formData);
    message.success('上传成功');
    uploadModalVisible.value = false;
    await fetchResources();
  } catch {
    message.error('上传失败');
  } finally {
    uploadLoading.value = false;
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
        message.success('资源已删除');
        await fetchResources();
      } catch {
        message.error('删除失败');
      }
    },
  });
}

function addModule() {
  const v = newModule.value.trim();
  if (v && !bizConfig.value.coreModules.includes(v)) {
    bizConfig.value.coreModules.push(v);
  }
  newModule.value = '';
}

function removeModule(idx: number) {
  bizConfig.value.coreModules.splice(idx, 1);
}

function addTable() {
  const en = newTableEn.value.trim();
  const cn = newTableCn.value.trim();
  if (en && cn) {
    bizConfig.value.coreTables.push({ enName: en, cnName: cn });
  }
  newTableEn.value = '';
  newTableCn.value = '';
}

function removeTable(idx: number) {
  bizConfig.value.coreTables.splice(idx, 1);
}

async function handleSave(record: ResourceApi.ResourceItem) {
  try {
    await saveAgentConfigKejiApi({
      id: record.id,
      agent_name: agentForm.value.name || undefined,
      agent_type: agentForm.value.type === 'vuln_scan' ? '漏洞扫描' : '漏洞扫描与渗透攻击测试',
      target_system: agentForm.value.target || undefined,
      task_description: agentForm.value.description || undefined,
      version: codeConfig.value.version || undefined,
      code_path: codeConfig.value.path || undefined,
      code_language: codeConfig.value.languages.join(',') || undefined,
      git_repo: codeConfig.value.gitRepo || undefined,
      git_branch: codeConfig.value.gitBranch || undefined,
      git_username: codeConfig.value.gitUsername || undefined,
      git_password: codeConfig.value.gitPassword || undefined,
      kb_source: knowledgeConfig.value.source === 'doc_lib' ? '飞书文档库' : '自定义上传',
      kb_url: knowledgeConfig.value.url || undefined,
      doc_list: knowledgeConfig.value.documents.length ? JSON.stringify(knowledgeConfig.value.documents) : undefined,
      core_biz_modules: bizConfig.value.coreModules.length ? JSON.stringify(bizConfig.value.coreModules) : undefined,
      core_data_tables: bizConfig.value.coreTables.length ? JSON.stringify(bizConfig.value.coreTables.map(t => ({ en: t.enName, cn: t.cnName }))) : undefined,
    });
    message.success('保存成功');
  } catch {
    message.error('保存失败');
  }
}

const columns = [
  { dataIndex: 'agent_name', key: 'agent_name', title: '智能体名称', width: 120, ellipsis: true },
  { dataIndex: 'agent_type', key: 'agent_type', title: '智能体类型', width: 140, ellipsis: true },
  { dataIndex: 'target_system', key: 'target_system', title: '代码库', width: 120, ellipsis: true },
  { dataIndex: 'kb_url', key: 'kb_url', title: '知识库地址', width: 200, ellipsis: true },
  { dataIndex: 'core_biz_modules', key: 'core_biz_modules', title: '核心业务功能', width: 200, ellipsis: true },
  { key: 'action', title: '操作', width: 160, fixed: 'right' as const },
];

onMounted(() => {
  fetchResources();
});
</script>

<template>
  <Page description="管理智能体资源的上传与删除" title="智能体资源管理">
    <Card class="mb-5">
      <div class="flex items-center justify-between">
        <span class="text-sm text-gray-500">已上传的资源列表</span>
        <Button type="primary" @click="openUploadModal">新增</Button>
      </div>
    </Card>

    <Card>
      <Table
        :columns="columns"
        :data-source="resources"
        :loading="loading"
        :expanded-row-keys="expandedRowKeys"
        expand-row-by-click
        @expand="onExpand"
        :pagination="{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total: number) => `共 ${total} 条`,
        }"
        :scroll="{ x: 'max-content' }"
        bordered
        row-key="id"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <Button type="primary" size="small" class="mr-2" @click.stop="handleSave(record)">保存</Button>
            <Button danger size="small" @click.stop="handleDelete(record)">删除</Button>
          </template>
          <template v-else-if="column.key === 'core_biz_modules'">
            <span class="text-xs">{{ parseBizModules(record.core_biz_modules) }}</span>
          </template>
        </template>
        <template #expandedRowRender="{ record }">
          <div class="space-y-6 px-2 py-4">
            <div class="rounded-lg border border-blue-200 bg-blue-50/40 p-4">
              <div class="mb-3 text-base font-semibold text-blue-700 border-b border-blue-200 pb-1">基本信息</div>
              <Form layout="vertical">
                <div class="grid grid-cols-2 gap-4">
                  <Form.Item label="智能体名称">
                    <Input v-model:value="agentForm.name" placeholder="输入智能体名称" />
                  </Form.Item>
                  <Form.Item label="智能体类型">
                    <Select v-model:value="agentForm.type">
                      <Select.Option value="vuln_scan">漏洞扫描</Select.Option>
                      <Select.Option value="vuln_scan_penetration">漏洞扫描与渗透攻击测试</Select.Option>
                    </Select>
                  </Form.Item>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <Form.Item label="目标系统">
                    <Input v-model:value="agentForm.target" placeholder="输入目标系统" />
                  </Form.Item>
                  <Form.Item label="目标系统地址">
                    <Input v-model:value="agentForm.targetUrl" placeholder="例如: https://example.com" />
                  </Form.Item>
                </div>
                <Form.Item label="任务描述">
                  <Input.TextArea v-model:value="agentForm.description" :rows="3" placeholder="输入任务描述" />
                </Form.Item>
              </Form>
            </div>

            <div class="rounded-lg border border-green-200 bg-green-50/40 p-4">
              <div class="mb-3 text-base font-semibold text-green-700 border-b border-green-200 pb-1">代码库配置</div>
              <Form layout="vertical">
                <div class="grid grid-cols-2 gap-4">
                  <Form.Item label="仓库地址">
                    <Input v-model:value="codeConfig.gitRepo" placeholder="例如: https://github.com/example/myapp.git" />
                  </Form.Item>
                  <Form.Item label="分支">
                    <Input v-model:value="codeConfig.gitBranch" placeholder="例如: main" />
                  </Form.Item>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <Form.Item label="用户名">
                    <Input v-model:value="codeConfig.gitUsername" placeholder="Git 用户名" />
                  </Form.Item>
                  <Form.Item label="密码">
                    <Input.Password v-model:value="codeConfig.gitPassword" placeholder="Git 密码" />
                  </Form.Item>
                </div>
                <Form.Item label="代码语言（可多选）">
                  <Checkbox.Group v-model:value="codeConfig.languages">
                    <Checkbox v-for="lang in languageOptions" :key="lang" :value="lang">{{ lang }}</Checkbox>
                  </Checkbox.Group>
                </Form.Item>
              </Form>
            </div>

            <div class="rounded-lg border border-purple-200 bg-purple-50/40 p-4">
              <div class="mb-3 text-base font-semibold text-purple-700 border-b border-purple-200 pb-1">知识库配置</div>
              <Form layout="vertical">
                <div class="grid grid-cols-2 gap-4">
                  <Form.Item label="知识库来源">
                    <Select v-model:value="knowledgeConfig.source">
                      <Select.Option value="doc_lib">飞书文档库</Select.Option>
                      <Select.Option value="custom_upload">自定义上传</Select.Option>
                    </Select>
                  </Form.Item>
                  <Form.Item label="知识库地址">
                    <Input v-model:value="knowledgeConfig.url" placeholder="输入知识库地址" />
                    <a v-if="knowledgeConfig.url" :href="knowledgeConfig.url" target="_blank" class="mt-1 inline-block text-xs text-blue-600 hover:text-blue-800">{{ knowledgeConfig.url }}</a>
                  </Form.Item>
                </div>
              </Form>
            </div>

            <div class="rounded-lg border border-orange-200 bg-orange-50/40 p-4">
              <div class="mb-3 text-base font-semibold text-orange-700 border-b border-orange-200 pb-1">业务画像配置</div>
              <Form layout="vertical">
                <Form.Item label="业务架构图">
                  <div class="flex h-48 items-center justify-center rounded border border-dashed border-gray-300 bg-white text-sm text-gray-400">业务知识图谱展示区域</div>
                </Form.Item>
                <Form.Item label="核心业务模块">
                  <div class="flex flex-wrap gap-2 mb-2">
                    <Tag v-for="(mod, idx) in bizConfig.coreModules" :key="idx" closable @close="removeModule(idx)">{{ mod }}</Tag>
                  </div>
                  <div class="flex gap-2">
                    <Input v-model:value="newModule" placeholder="输入模块名称" class="w-60" @press-enter="addModule" />
                    <Button @click="addModule">添加</Button>
                  </div>
                </Form.Item>
                <Form.Item label="核心数据表">
                  <div class="rounded border border-gray-200 bg-white">
                    <div class="flex items-center gap-2 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500 border-b">
                      <span class="flex-1">英文表名</span>
                      <span class="flex-1">中文表名</span>
                      <span class="w-12"></span>
                    </div>
                    <div v-if="bizConfig.coreTables.length === 0" class="px-3 py-4 text-center text-xs text-gray-400">暂无数据表</div>
                    <div v-for="(tbl, idx) in bizConfig.coreTables" :key="idx" class="flex items-center gap-2 border-b px-3 py-2 text-xs last:border-b-0">
                      <span class="flex-1 font-mono text-gray-700">{{ tbl.enName }}</span>
                      <span class="flex-1 text-gray-600">{{ tbl.cnName }}</span>
                      <Button size="small" danger @click="removeTable(idx)">删除</Button>
                    </div>
                  </div>
                  <div class="mt-2 flex gap-2">
                    <Input v-model:value="newTableEn" placeholder="英文表名" class="w-48" />
                    <Input v-model:value="newTableCn" placeholder="中文表名" class="w-48" @press-enter="addTable" />
                    <Button @click="addTable">添加</Button>
                  </div>
                </Form.Item>
              </Form>
            </div>
          </div>
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
        <Form.Item label="资源标识" required>
          <Input v-model:value="uploadForm.code" placeholder="例如: myapp" />
        </Form.Item>
        <Form.Item label="版本号" required>
          <Input v-model:value="uploadForm.version" placeholder="例如: v1.0" />
        </Form.Item>
        <Form.Item label="描述">
          <Input.TextArea v-model:value="uploadForm.description" placeholder="资源描述" :rows="2" />
        </Form.Item>
        <Form.Item label="ZIP 文件" required>
          <Upload
            :before-upload="(file: File) => { uploadForm.file = file; return false }"
            :file-list="uploadForm.file ? [{ name: uploadForm.file.name, uid: '-1' } as any] : []"
            :max-count="1"
          >
            <Button>选择文件</Button>
          </Upload>
        </Form.Item>
      </Form>
    </Modal>

    <contextHolder />
  </Page>
</template>
