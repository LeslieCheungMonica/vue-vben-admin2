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
  RangePicker,
  Select,
  SelectOption,
  Space,
  Table,
  Tag,
  Textarea,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  addAndDetectApi,
  detectionByTraceIdApi,
  detectLogApi,
  logDetailApi,
  logListApi,
} from '#/api/core/sensitive-data';

import {
  getRiskLevelColor,
  getRiskLevelName,
  getSensitiveTypeName,
} from '../utils/mapping';

const loading = ref(false);
const detailVisible = ref(false);
const addVisible = ref(false);
const addDetecting = ref(false);
const addDetectResult = ref<any>(null);
const detailData = ref<any>(null);
const dateRange = ref<any[]>([]);
const detectingTraceId = ref('');
const detectResultVisible = ref(false);
const currentDetectResult = ref<any>(null);
const detailDetectionList = ref<any[]>([]);
const tableData = ref<any[]>([]);

const addForm = reactive({
  api_path: '',
  request: '',
  response: '',
});

const filterForm = reactive({
  apiPath: '',
  opId: '',
  detectStatus: undefined as string | undefined,
});

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
});

const formatJson = (str: string | undefined) => {
  if (!str) return '';
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
};

const riskTagColor = (level: string) => getRiskLevelColor(level);

const loadData = async () => {
  loading.value = true;
  try {
    const res = await logListApi({
      pageNum: pagination.current,
      pageSize: pagination.pageSize,
      startTime: dateRange.value?.[0]
        ? dayjs(dateRange.value[0]).format('YYYY-MM-DD')
        : undefined,
      endTime: dateRange.value?.[1]
        ? dayjs(dateRange.value[1]).format('YYYY-MM-DD')
        : undefined,
      apiPath: filterForm.apiPath,
      opId: filterForm.opId,
      detectStatus: filterForm.detectStatus,
    });
    if (res) {
      tableData.value = res.list || [];
      pagination.total = res.total || 0;
    }
  } catch {
    // Error handled by interceptor
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.current = 1;
  loadData();
};

const handleReset = () => {
  dateRange.value = [];
  Object.assign(filterForm, { apiPath: '', opId: '', detectStatus: undefined });
  pagination.current = 1;
  loadData();
};

const handleRowClick = async (row: any) => {
  try {
    const res = await logDetailApi({ traceId: row.trace_id });
    if (res) {
      detailData.value = res;
      detailDetectionList.value = [];
      if (res.detect_status === '1') {
        try {
          const detRes = await detectionByTraceIdApi({ traceId: row.trace_id });
          if (detRes) {
            detailDetectionList.value = Array.isArray(detRes) ? detRes : [];
          }
        } catch {
          /* ignore */
        }
      }
      detailVisible.value = true;
    }
  } catch {
    /* ignore */
  }
};

const handleDetectRow = async (row: any) => {
  Modal.confirm({
    content: `将对 Trace ID: ${row.trace_id}（${row.api_path}）调用 LLM 进行敏感信息检测，是否继续？`,
    okText: '开始检测',
    okType: 'danger',
    cancelText: '取消',
    onOk: async () => {
      detectingTraceId.value = row.trace_id;
      try {
        const res = await detectLogApi({ traceId: row.trace_id });
        if (res) {
          currentDetectResult.value = res;
          detectResultVisible.value = true;
          loadData();
          message.success('检测完成');
        }
      } catch (e: any) {
        message.error(e.message || '检测失败');
      } finally {
        detectingTraceId.value = '';
      }
    },
  });
};

const showAddDialog = () => {
  Object.assign(addForm, { api_path: '', request: '', response: '' });
  addDetectResult.value = null;
  addVisible.value = true;
};

const handleAddAndDetect = async () => {
  if (!addForm.api_path || !addForm.response) {
    message.warning('请填写接口路径和响应内容');
    return;
  }
  addDetecting.value = true;
  addDetectResult.value = null;
  try {
    const res = await addAndDetectApi({
      api_path: addForm.api_path,
      request: addForm.request,
      response: addForm.response,
      request_method: 'POST',
      request_result: '0',
      response_status: 200,
      log_type: 'WEB',
      aud: 'MANUAL',
    });
    if (res) addDetectResult.value = res;
  } catch (e: any) {
    message.error(e.message || '检测失败');
  } finally {
    addDetecting.value = false;
  }
};

const columns = [
  {
    dataIndex: 'trace_id',
    key: 'trace_id',
    title: 'Trace ID',
    width: 180,
    ellipsis: true,
  },
  {
    dataIndex: 'api_path',
    key: 'api_path',
    title: '接口路径',
    width: 200,
    ellipsis: true,
  },
  {
    dataIndex: 'create_op_id',
    key: 'create_op_id',
    title: '操作员ID',
    width: 120,
    ellipsis: true,
  },
  {
    key: 'detect_status',
    title: '检测状态',
    width: 100,
    align: 'center' as const,
  },
  {
    dataIndex: 'cost_time_ms',
    key: 'cost_time_ms',
    title: '耗时(ms)',
    width: 100,
    align: 'right' as const,
  },
  {
    dataIndex: 'create_time',
    key: 'create_time',
    title: '创建时间',
    width: 180,
  },
  {
    key: 'action',
    title: '操作',
    width: 160,
    align: 'center' as const,
    fixed: 'right' as const,
  },
];

const handleTableChange = (pag: any) => {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  loadData();
};

onMounted(() => {
  loadData();
});
</script>

<template>
  <Page description="查询接口日志及敏感信息检测结果" title="数据查询">
    <Card class="mb-4">
      <Form layout="inline">
        <FormItem label="时间范围">
          <RangePicker
            v-model:value="dateRange"
            format="YYYY-MM-DD"
            style="width: 260px"
          />
        </FormItem>
        <FormItem label="接口路径">
          <Input
            v-model:value="filterForm.apiPath"
            placeholder="输入接口路径"
            allow-clear
            style="width: 200px"
          />
        </FormItem>
        <FormItem label="操作员ID">
          <Input
            v-model:value="filterForm.opId"
            placeholder="输入操作员ID"
            allow-clear
            style="width: 160px"
          />
        </FormItem>
        <FormItem label="检测状态">
          <Select
            v-model:value="filterForm.detectStatus"
            placeholder="选择状态"
            allow-clear
            style="width: 120px"
          >
            <SelectOption value="1">已检测</SelectOption>
            <SelectOption value="0">未检测</SelectOption>
          </Select>
        </FormItem>
        <FormItem>
          <Space>
            <Button type="primary" @click="handleSearch">查询</Button>
            <Button @click="handleReset">重置</Button>
            <Button type="primary" ghost @click="showAddDialog">
              新增并检测
            </Button>
          </Space>
        </FormItem>
      </Form>
    </Card>

    <Card>
      <Table
        :columns="columns"
        :data-source="tableData"
        :loading="loading"
        :pagination="{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total: number) => `共 ${total} 条`,
        }"
        :scroll="{ x: 1000 }"
        bordered
        row-key="trace_id"
        size="middle"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'detect_status'">
            <Tag :color="record.detect_status === '1' ? 'green' : 'blue'">
              {{ record.detect_status === '1' ? '已检测' : '未检测' }}
            </Tag>
          </template>
          <template v-if="column.key === 'action'">
            <Space :size="4">
              <Button
                v-if="record.detect_status !== '1'"
                danger
                size="small"
                :loading="detectingTraceId === record.trace_id"
                @click.stop="handleDetectRow(record)"
              >
                检测
              </Button>
              <Button size="small" type="link" @click.stop="handleRowClick(record)">
                详情
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- Detail Dialog -->
    <Modal
      v-model:visible="detailVisible"
      title="日志详情"
      :width="800"
      :footer="null"
      destroy-on-close
    >
      <template v-if="detailData">
        <Descriptions :column="2" bordered size="small">
          <DescriptionsItem label="Trace ID">{{
            detailData.trace_id
          }}</DescriptionsItem>
          <DescriptionsItem label="接口路径">{{
            detailData.api_path
          }}</DescriptionsItem>
          <DescriptionsItem label="操作员ID">{{
            detailData.create_op_id
          }}</DescriptionsItem>
          <DescriptionsItem label="应用名称">{{
            detailData.app_name
          }}</DescriptionsItem>
          <DescriptionsItem label="检测状态">
            <Tag
              :color="detailData.detect_status === '1' ? 'green' : 'blue'"
            >
              {{ detailData.detect_status === '1' ? '已检测' : '未检测' }}
            </Tag>
          </DescriptionsItem>
          <DescriptionsItem label="耗时"
            >{{ detailData.cost_time_ms }} ms</DescriptionsItem
          >
          <DescriptionsItem label="客户端IP">{{
            detailData.client_ip
          }}</DescriptionsItem>
          <DescriptionsItem label="创建时间">{{
            detailData.create_time
          }}</DescriptionsItem>
        </Descriptions>

        <div class="mt-5">
          <h4 class="mb-2 border-l-[3px] border-red-500 pl-2 text-sm font-medium">
            请求头
          </h4>
          <pre
            class="max-h-[200px] overflow-auto rounded-lg bg-[var(--component-bg)] p-3 text-xs"
            >{{ formatJson(detailData.request_header) }}</pre
          >
        </div>
        <div class="mt-4">
          <h4 class="mb-2 border-l-[3px] border-red-500 pl-2 text-sm font-medium">
            请求体
          </h4>
          <pre
            class="max-h-[200px] overflow-auto rounded-lg bg-[var(--component-bg)] p-3 text-xs"
            >{{ formatJson(detailData.request) }}</pre
          >
        </div>
        <div class="mt-4">
          <h4 class="mb-2 border-l-[3px] border-red-500 pl-2 text-sm font-medium">
            响应状态
          </h4>
          <pre class="rounded-lg bg-[var(--component-bg)] p-3 text-xs">{{
            detailData.response_status
          }}</pre>
        </div>
        <div class="mt-4">
          <h4 class="mb-2 border-l-[3px] border-red-500 pl-2 text-sm font-medium">
            响应体
          </h4>
          <pre
            class="max-h-[200px] overflow-auto rounded-lg bg-[var(--component-bg)] p-3 text-xs"
            >{{ formatJson(detailData.response) }}</pre
          >
        </div>

        <!-- Detection Results for this log -->
        <div
          v-if="detailDetectionList.length"
          class="mt-4"
        >
          <h4 class="mb-2 border-l-[3px] border-red-500 pl-2 text-sm font-medium">
            检测结果
          </h4>
          <div
            v-for="(det, di) in detailDetectionList"
            :key="di"
            class="mb-3 rounded-lg border p-3"
          >
            <div class="mb-2 flex items-center gap-3">
              <Tag :color="riskTagColor(det.risk_level)" size="small">{{
                getRiskLevelName(det.risk_level)
              }}</Tag>
              <span class="text-xs text-gray-400"
                >来源: {{ det.detect_source }}</span
              >
              <span class="ml-auto text-xs text-gray-500">{{
                det.detect_time
              }}</span>
            </div>
            <div class="mb-2">
              <Tag
                v-for="t in det.sensitive_types || []"
                :key="t"
                color="red"
                size="small"
                class="mr-1"
              >
                {{ getSensitiveTypeName(t) }}
              </Tag>
            </div>
            <Table
              v-if="det.sensitive_details && det.sensitive_details.length"
              :columns="[
                { dataIndex: 'type', key: 'type', title: '类型', width: 120 },
                { dataIndex: 'field', key: 'field', title: '字段', width: 140 },
                {
                  dataIndex: 'value',
                  key: 'value',
                  title: '脱敏值',
                  ellipsis: true,
                },
                { dataIndex: 'source', key: 'source', title: '来源', width: 100 },
              ]"
              :data-source="det.sensitive_details"
              :pagination="false"
              bordered
              size="small"
            >
              <template #bodyCell="{ column, record: detailRow }">
                <template v-if="column.key === 'type'">
                  <Tag color="red" size="small">{{ detailRow.type }}</Tag>
                </template>
              </template>
            </Table>
          </div>
        </div>
      </template>
    </Modal>

    <!-- Detect Result Dialog -->
    <Modal
      v-model:visible="detectResultVisible"
      title="检测结果"
      :width="700"
      :footer="null"
      destroy-on-close
    >
      <template v-if="currentDetectResult">
        <Descriptions :column="2" bordered size="small" class="mb-4">
          <DescriptionsItem label="Trace ID">{{
            currentDetectResult.trace_id
          }}</DescriptionsItem>
          <DescriptionsItem label="接口路径">{{
            currentDetectResult.api_path
          }}</DescriptionsItem>
        </Descriptions>

        <!-- Rule Detection -->
        <div
          v-if="
            currentDetectResult.ruleDetect &&
            currentDetectResult.ruleDetect.length
          "
          class="mt-4"
        >
          <h4 class="mb-2 border-l-[3px] border-red-500 pl-2 text-sm font-medium">
            规则引擎检测
          </h4>
          <Tag
            v-for="r in currentDetectResult.ruleDetect"
            :key="r.type"
            color="red"
            class="mr-1"
          >
            {{ r.type }}
          </Tag>
        </div>

        <!-- LLM Detection -->
        <div v-if="currentDetectResult.llmDetect" class="mt-4">
          <h4 class="mb-2 border-l-[3px] border-red-500 pl-2 text-sm font-medium">
            LLM 检测
          </h4>
          <template v-if="currentDetectResult.llmDetect.error">
            <Tag color="orange">{{ currentDetectResult.llmDetect.error }}</Tag>
          </template>
          <template v-else>
            <Tag
              v-if="currentDetectResult.llmDetect.has_sensitive"
              color="red"
            >
              存在敏感信息
            </Tag>
            <Tag v-else color="green">未发现敏感信息</Tag>
            <div
              v-if="
                currentDetectResult.llmDetect.items &&
                currentDetectResult.llmDetect.items.length
              "
              class="mt-2"
            >
              <Table
                :columns="[
                  { dataIndex: 'type', key: 'type', title: '敏感类型', width: 120 },
                  { dataIndex: 'field', key: 'field', title: '字段', width: 140 },
                  {
                    dataIndex: 'value',
                    key: 'value',
                    title: '脱敏值',
                    ellipsis: true,
                  },
                ]"
                :data-source="currentDetectResult.llmDetect.items"
                :pagination="false"
                bordered
                size="small"
              >
                <template #bodyCell="{ column, record: llmRow }">
                  <template v-if="column.key === 'type'">
                    <Tag color="red" size="small">{{ llmRow.type }}</Tag>
                  </template>
                </template>
              </Table>
            </div>
          </template>
        </div>

        <!-- No sensitive found -->
        <div
          v-if="
            !currentDetectResult.llmDetect?.has_sensitive &&
            (!currentDetectResult.ruleDetect ||
              !currentDetectResult.ruleDetect.length)
          "
          class="mt-4"
        >
          <p class="text-green-500">✅ 未检测到敏感信息</p>
        </div>
      </template>
    </Modal>

    <!-- Add & Detect Dialog -->
    <Modal
      v-model:visible="addVisible"
      title="新增日志并检测"
      :width="700"
      :footer="null"
      destroy-on-close
    >
      <Form layout="vertical">
        <FormItem label="接口路径" required>
          <Input
            v-model:value="addForm.api_path"
            placeholder="如 QueryUserInfoService"
          />
        </FormItem>
        <FormItem label="请求体">
          <Textarea
            v-model:value="addForm.request"
            :rows="3"
            placeholder='如 {"opId":"ST001","phoneNum":"13800001111"}'
          />
        </FormItem>
        <FormItem label="响应体" required>
          <Textarea
            v-model:value="addForm.response"
            :rows="5"
            placeholder='粘贴接口响应JSON'
          />
        </FormItem>
      </Form>
      <div class="mb-4 text-right">
        <Button type="primary" :loading="addDetecting" @click="handleAddAndDetect">
          提交并检测
        </Button>
      </div>
      <div v-if="addDetectResult" class="mt-4">
        <h4 class="mb-3 text-sm font-medium">检测结果</h4>
        <div
          v-if="addDetectResult.ruleDetect && addDetectResult.ruleDetect.length"
        >
          <p class="mb-1 text-xs text-gray-400">规则引擎命中：</p>
          <Tag
            v-for="r in addDetectResult.ruleDetect"
            :key="r.type"
            color="red"
            class="mr-1"
          >
            {{ r.type }}
          </Tag>
        </div>
        <div v-if="addDetectResult.llmDetect" class="mt-3">
          <p class="mb-1 text-xs text-gray-400">LLM 检测结果：</p>
          <Tag
            v-if="addDetectResult.llmDetect.has_sensitive"
            color="red"
          >
            存在敏感信息
          </Tag>
          <Tag v-else color="green">未发现敏感信息</Tag>
          <div
            v-if="
              addDetectResult.llmDetect.items &&
              addDetectResult.llmDetect.items.length
            "
            class="mt-2"
          >
            <div
              v-for="item in addDetectResult.llmDetect.items"
              :key="item.type"
              class="my-1 text-sm"
            >
              <Tag color="red" size="small">{{ item.type }}</Tag>
              字段 <b>{{ item.field }}</b> = {{ item.value }}
            </div>
          </div>
        </div>
        <div
          v-if="
            !addDetectResult.llmDetect &&
            (!addDetectResult.ruleDetect ||
              !addDetectResult.ruleDetect.length)
          "
        >
          <p class="text-green-500">✅ 未检测到敏感信息</p>
        </div>
      </div>
    </Modal>
  </Page>
</template>
