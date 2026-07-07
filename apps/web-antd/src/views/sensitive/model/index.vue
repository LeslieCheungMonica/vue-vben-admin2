<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Descriptions,
  DescriptionsItem,
  Form,
  FormItem,
  Input,
  message,
  Modal,
  Radio,
  RadioGroup,
  Select,
  SelectOption,
  Slider,
  Space,
  Switch,
  Table,
  Tag,
  Textarea,
} from 'ant-design-vue';

import {
  modelListApi,
  modelUpdateApi,
  modelTestApi,
} from '#/api/core/sensitive-model';
import type { SensitiveModelApi } from '#/api/core/sensitive-model';

import { getSensitiveTypeName } from '../utils/mapping';

const loading = ref(false);
const editVisible = ref(false);
const testVisible = ref(false);
const testLoading = ref(false);
const testText = ref('');
const testResult = ref<any>(null);
const editingModel = ref<SensitiveModelApi.ModelConfig | null>(null);
const modelListData = ref<SensitiveModelApi.ModelConfig[]>([]);

const editForm = reactive({
  id: '',
  name: '',
  type: 'RULE' as 'RULE' | 'LLM',
  sensitive_type: '',
  pattern: '',
  confidence: 0.8,
  enabled: true,
  priority: 1,
  description: '',
});

const columns = [
  {
    dataIndex: 'name',
    key: 'name',
    title: '模型名称',
    ellipsis: true,
  },
  {
    key: 'type',
    title: '类型',
    width: 100,
    align: 'center' as const,
  },
  {
    dataIndex: 'sensitive_type',
    key: 'sensitive_type',
    title: '敏感类型',
    width: 120,
  },
  {
    key: 'enabled',
    title: '启用',
    width: 80,
    align: 'center' as const,
  },
  {
    dataIndex: 'priority',
    key: 'priority',
    title: '优先级',
    width: 80,
    align: 'center' as const,
  },
  {
    key: 'action',
    title: '操作',
    width: 160,
    align: 'center' as const,
    fixed: 'right' as const,
  },
];

const loadModels = async () => {
  loading.value = true;
  try {
    const res = await modelListApi();
    if (res) {
      modelListData.value = res.list || [];
    }
  } catch {
    // Error handled by interceptor
  } finally {
    loading.value = false;
  }
};

const handleRefresh = () => {
  loadModels();
};

const handleEdit = (row: SensitiveModelApi.ModelConfig) => {
  editingModel.value = row;
  Object.assign(editForm, {
    id: row.id,
    name: row.name,
    type: row.type,
    sensitive_type: row.sensitive_type,
    pattern: row.pattern || '',
    confidence: row.confidence,
    enabled: row.enabled,
    priority: row.priority,
    description: row.description || '',
  });
  editVisible.value = true;
};

const handleSave = async () => {
  try {
    await modelUpdateApi({
      id: editForm.id,
      name: editForm.name,
      pattern: editForm.pattern,
      confidence: editForm.confidence,
      enabled: editForm.enabled,
      priority: editForm.priority,
      description: editForm.description,
    });
    message.success('保存成功');
    editVisible.value = false;
    loadModels();
  } catch {
    // Error handled by interceptor
  }
};

const handleToggleEnabled = async (row: SensitiveModelApi.ModelConfig) => {
  try {
    await modelUpdateApi({ id: row.id, enabled: row.enabled });
    message.success(row.enabled ? '已启用' : '已禁用');
  } catch {
    row.enabled = !row.enabled;
  }
};

const handleTest = (row: SensitiveModelApi.ModelConfig) => {
  editingModel.value = row;
  testText.value = '';
  testResult.value = null;
  testVisible.value = true;
};

const runTest = async () => {
  if (!testText.value.trim()) {
    message.warning('请输入测试文本');
    return;
  }
  if (!editingModel.value) return;

  testLoading.value = true;
  try {
    const res = await modelTestApi({
      id: editingModel.value.id,
      sampleData: testText.value,
    });
    if (res) {
      testResult.value = res;
    }
  } catch {
    // Error handled by interceptor
  } finally {
    testLoading.value = false;
  }
};

onMounted(() => {
  loadModels();
});
</script>

<template>
  <Page title="模型配置" description="管理敏感信息检测模型">
    <!-- Action Bar -->
    <Card class="mb-4">
      <div class="flex items-center justify-between">
        <span class="text-sm text-gray-400">管理敏感信息检测模型，支持规则模型和大语言模型</span>
        <Button type="primary" @click="handleRefresh">刷新</Button>
      </div>
    </Card>

    <!-- Model Table -->
    <Card>
      <Table
        :columns="columns"
        :data-source="modelListData"
        :loading="loading"
        :pagination="false"
        :scroll="{ x: 800 }"
        bordered
        row-key="id"
        size="middle"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'type'">
            <Tag :color="record.type === 'RULE' ? 'blue' : 'green'">
              {{ record.type === 'RULE' ? '规则' : 'LLM' }}
            </Tag>
          </template>
          <template v-if="column.key === 'sensitive_type'">
            <Tag>{{ getSensitiveTypeName(record.sensitive_type) }}</Tag>
          </template>
          <template v-if="column.key === 'enabled'">
            <Switch
              v-model:checked="record.enabled"
              @change="handleToggleEnabled(record)"
            />
          </template>
          <template v-if="column.key === 'action'">
            <Space :size="4">
              <Button size="small" type="link" @click="handleEdit(record)">
                编辑
              </Button>
              <Button size="small" type="link" @click="handleTest(record)">
                测试
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- Edit Dialog -->
    <Modal
      v-model:visible="editVisible"
      :title="editingModel ? '编辑模型' : '新增模型'"
      :width="600"
      destroy-on-close
    >
      <Form :label-col="{ span: 5 }" :wrapper-col="{ span: 18 }">
        <FormItem label="模型名称">
          <Input v-model:value="editForm.name" placeholder="请输入模型名称" />
        </FormItem>

        <FormItem label="模型类型">
          <RadioGroup v-model:value="editForm.type" :disabled="!!editingModel">
            <Radio value="RULE">规则模型</Radio>
            <Radio value="LLM">大语言模型</Radio>
          </RadioGroup>
        </FormItem>

        <FormItem label="敏感类型">
          <Select
            v-model:value="editForm.sensitive_type"
            placeholder="选择敏感类型"
          >
            <SelectOption value="ID_CARD">身份证号</SelectOption>
            <SelectOption value="PHONE">手机号码</SelectOption>
            <SelectOption value="BANK_CARD">银行卡号</SelectOption>
            <SelectOption value="NAME">姓名</SelectOption>
            <SelectOption value="ADDRESS">地址</SelectOption>
            <SelectOption value="EMAIL">邮箱</SelectOption>
            <SelectOption value="IP">IP地址</SelectOption>
            <SelectOption value="MIXED">综合</SelectOption>
          </Select>
        </FormItem>

        <!-- RULE model: regex pattern -->
        <FormItem v-if="editForm.type === 'RULE'" label="匹配规则">
          <Textarea
            v-model:value="editForm.pattern"
            :rows="3"
            placeholder="请输入正则表达式规则"
          />
        </FormItem>

        <FormItem label="优先级">
          <Slider
            v-model:value="editForm.priority"
            :min="1"
            :max="10"
            :step="1"
          />
        </FormItem>

        <FormItem label="启用状态">
          <Switch v-model:checked="editForm.enabled" />
        </FormItem>

        <FormItem label="描述">
          <Textarea
            v-model:value="editForm.description"
            :rows="2"
            placeholder="模型描述"
          />
        </FormItem>
      </Form>

      <template #footer>
        <Button @click="editVisible = false">取消</Button>
        <Button type="primary" @click="handleSave">保存</Button>
      </template>
    </Modal>

    <!-- Test Dialog -->
    <Modal
      v-model:visible="testVisible"
      title="模型测试"
      :width="600"
      destroy-on-close
    >
      <Form :label-col="{ span: 4 }" :wrapper-col="{ span: 19 }">
        <FormItem label="测试文本">
          <Textarea
            v-model:value="testText"
            :rows="4"
            placeholder="请输入需要检测的文本"
          />
        </FormItem>
        <FormItem :wrapper-col="{ offset: 4, span: 19 }">
          <Button type="primary" :loading="testLoading" @click="runTest">
            执行测试
          </Button>
        </FormItem>
      </Form>

      <div v-if="testResult" class="mt-5">
        <Descriptions :column="2" bordered size="small">
          <DescriptionsItem label="模型名称">
            {{ testResult.modelName }}
          </DescriptionsItem>
          <DescriptionsItem label="模型类型">
            <Tag :color="testResult.modelType === 'RULE' ? 'blue' : 'green'">
              {{ testResult.modelType === 'RULE' ? '规则' : 'LLM' }}
            </Tag>
          </DescriptionsItem>
          <DescriptionsItem label="敏感类型">
            {{ testResult.sensitiveType }}
          </DescriptionsItem>
          <DescriptionsItem label="检测结果">
            <Tag :color="testResult.detected ? 'red' : 'green'">
              {{ testResult.detected ? '检测到敏感信息' : '未检测到敏感信息' }}
            </Tag>
          </DescriptionsItem>
          <DescriptionsItem v-if="testResult.confidence" label="置信度">
            {{ (testResult.confidence * 100).toFixed(1) }}%
          </DescriptionsItem>
          <DescriptionsItem v-if="testResult.matchResult" label="匹配结果">
            {{ testResult.matchResult }}
          </DescriptionsItem>
          <DescriptionsItem v-if="testResult.error" label="错误" :span="2">
            <Tag color="red">{{ testResult.error }}</Tag>
          </DescriptionsItem>
          <DescriptionsItem v-if="testResult.message" label="消息" :span="2">
            {{ testResult.message }}
          </DescriptionsItem>
        </Descriptions>
      </div>
    </Modal>
  </Page>
</template>
