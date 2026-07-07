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
  Progress,
  Radio,
  RadioGroup,
  RangePicker,
  Select,
  SelectOption,
  Space,
  Spin,
  Table,
  Tag,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import type { SensitiveDataApi } from '#/api/core/sensitive-data';
import {
  batchRecheckApi,
  detectionDetailApi,
  detectionListApi,
} from '#/api/core/sensitive-data';

import {
  getRiskLevelColor,
  getRiskLevelName,
  getSensitiveTypeName,
} from '../utils/mapping';

const loading = ref(false);
const rechecking = ref(false);
const detailVisible = ref(false);
const detailData = ref<SensitiveDataApi.DetectionDetail | null>(null);
const dateRange = ref<any[]>([]);

// Recheck state
const recheckDialogVisible = ref(false);
const recheckScope = ref<'all' | 'api'>('all');
const recheckApiPath = ref('');
const recheckResult = ref<SensitiveDataApi.BatchRecheckResult | null>(null);
const recheckProgress = reactive({
  running: false,
  done: 0,
  total: 0,
});

const filterForm = reactive({
  riskLevel: undefined as string | undefined,
  sensitiveType: undefined as string | undefined,
  opId: '',
});

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
});

const tableData = ref<any[]>([]);

const riskTagColor = (level: string) => getRiskLevelColor(level);

const confirmTagColor = (status: string) => {
  const map: Record<string, string> = { '1': 'green', '2': 'blue' };
  return map[status] || 'orange';
};

const confirmLabel = (status: string) => {
  const map: Record<string, string> = {
    '0': '未确认',
    '1': '已确认',
    '2': '已忽略',
  };
  return map[status] || '未确认';
};

const columns = [
  {
    dataIndex: 'api_path',
    key: 'api_path',
    title: '接口路径',
    width: 200,
    ellipsis: true,
  },
  {
    dataIndex: 'op_name',
    key: 'op_name',
    title: '操作名称',
    width: 100,
    ellipsis: true,
  },
  {
    key: 'sensitive_types',
    title: '敏感类型',
    width: 180,
  },
  {
    key: 'risk_level',
    title: '风险等级',
    width: 110,
    align: 'center' as const,
  },
  {
    dataIndex: 'detect_time',
    key: 'detect_time',
    title: '检测时间',
    width: 180,
  },
  {
    key: 'deal_status',
    title: '确认状态',
    width: 100,
    align: 'center' as const,
  },
];

const recheckDetailColumns = [
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
    width: 180,
    ellipsis: true,
  },
  {
    key: 'ruleHits',
    title: '规则检测',
    width: 120,
    align: 'center' as const,
  },
  {
    key: 'llmDetect',
    title: 'LLM检测',
    width: 140,
    align: 'center' as const,
  },
  {
    key: 'sensitiveTypes',
    title: '敏感类型',
    width: 160,
  },
];

const sensitiveDetailColumns = [
  { dataIndex: 'type', key: 'type', title: '类型', width: 120 },
  { dataIndex: 'field', key: 'field', title: '字段', width: 120 },
  {
    dataIndex: 'maskedValue',
    key: 'maskedValue',
    title: '脱敏值',
    ellipsis: true,
  },
  { dataIndex: 'source', key: 'source', title: '来源', width: 120 },
];

const loadData = async () => {
  loading.value = true;
  try {
    const res = await detectionListApi({
      pageNum: pagination.current,
      pageSize: pagination.pageSize,
      riskLevel: filterForm.riskLevel,
      sensitiveType: filterForm.sensitiveType,
      opId: filterForm.opId,
      startTime: dateRange.value?.[0]
        ? dayjs(dateRange.value[0]).format('YYYY-MM-DD')
        : undefined,
      endTime: dateRange.value?.[1]
        ? dayjs(dateRange.value[1]).format('YYYY-MM-DD')
        : undefined,
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
  Object.assign(filterForm, {
    riskLevel: undefined,
    sensitiveType: undefined,
    opId: '',
  });
  pagination.current = 1;
  loadData();
};

const handleRowClick = async (row: any) => {
  try {
    const res = await detectionDetailApi({ id: row.id });
    if (res) {
      detailData.value = res;
      detailVisible.value = true;
    }
  } catch {
    // Error handled by interceptor
  }
};

const handleTableChange = (pag: any) => {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  loadData();
};

const showRecheckDialog = () => {
  recheckScope.value = 'all';
  recheckApiPath.value = '';
  recheckResult.value = null;
  recheckProgress.running = false;
  recheckProgress.done = 0;
  recheckProgress.total = 0;
  recheckDialogVisible.value = true;
};

const handleStartRecheck = async () => {
  if (recheckScope.value === 'api' && !recheckApiPath.value.trim()) {
    message.warning('请输入接口路径');
    return;
  }

  rechecking.value = true;
  recheckResult.value = null;
  recheckProgress.running = true;
  recheckProgress.done = 0;
  recheckProgress.total = 0;

  try {
    const params: SensitiveDataApi.BatchRecheckRequest = {};
    if (recheckScope.value === 'api') {
      params.apiPath = recheckApiPath.value.trim();
    }
    // else: no apiPath and no traceIds = 全量

    const res = await batchRecheckApi(params);
    if (res) {
      recheckResult.value = res;
      recheckProgress.done = res.total || 0;
      recheckProgress.total = res.total || 0;
      // Refresh detection table
      loadData();
    }
  } catch (e: any) {
    message.error(e.message || '复检失败');
  } finally {
    rechecking.value = false;
    recheckProgress.running = false;
  }
};

onMounted(() => {
  loadData();
});
</script>

<template>
  <Page description="查看敏感信息检测结果与批量复检" title="检测结果">
    <!-- Filter Form -->
    <Card class="mb-4">
      <Form layout="inline">
        <FormItem label="风险等级">
          <Select
            v-model:value="filterForm.riskLevel"
            placeholder="选择等级"
            allow-clear
            style="width: 140px"
          >
            <SelectOption value="CRITICAL">严重</SelectOption>
            <SelectOption value="HIGH">高危</SelectOption>
            <SelectOption value="MEDIUM">中危</SelectOption>
            <SelectOption value="LOW">低危</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="敏感类型">
          <Select
            v-model:value="filterForm.sensitiveType"
            placeholder="选择类型"
            allow-clear
            style="width: 160px"
          >
            <SelectOption value="ID_CARD">身份证号</SelectOption>
            <SelectOption value="PHONE">手机号码</SelectOption>
            <SelectOption value="BANK_CARD">银行卡号</SelectOption>
            <SelectOption value="NAME">姓名</SelectOption>
            <SelectOption value="ADDRESS">地址</SelectOption>
            <SelectOption value="EMAIL">邮箱</SelectOption>
            <SelectOption value="IP">IP地址</SelectOption>
            <SelectOption value="MIXED">综合</SelectOption>
            <SelectOption value="PASSWORD">密码</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="操作员ID">
          <Input
            v-model:value="filterForm.opId"
            placeholder="输入操作员ID"
            allow-clear
            style="width: 160px"
          />
        </FormItem>
        <FormItem label="时间范围">
          <RangePicker
            v-model:value="dateRange"
            format="YYYY-MM-DD"
            style="width: 260px"
          />
        </FormItem>
        <FormItem>
          <Space>
            <Button type="primary" @click="handleSearch">查询</Button>
            <Button @click="handleReset">重置</Button>
            <Button type="primary" ghost @click="showRecheckDialog">
              LLM 批量复检
            </Button>
          </Space>
        </FormItem>
      </Form>
    </Card>

    <!-- Detection Table -->
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
        :scroll="{ x: 900 }"
        bordered
        row-key="id"
        size="middle"
        class="cursor-pointer"
        @change="handleTableChange"
        @customRow="
          (record: any) => ({
            onClick: () => handleRowClick(record),
          })
        "
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'sensitive_types'">
            <Tag
              v-for="t in record.sensitive_types || record.sensitiveTypes || []"
              :key="t"
              color="red"
              size="small"
              class="mr-1"
            >
              {{ getSensitiveTypeName(t) }}
            </Tag>
          </template>
          <template v-if="column.key === 'risk_level'">
            <Tag :color="riskTagColor(record.risk_level || record.riskLevel)" size="small">
              {{ getRiskLevelName(record.risk_level || record.riskLevel) }}
            </Tag>
          </template>
          <template v-if="column.key === 'deal_status'">
            <Tag :color="confirmTagColor(record.deal_status || record.dealStatus)" size="small">
              {{ confirmLabel(record.deal_status || record.dealStatus) }}
            </Tag>
          </template>
        </template>
      </Table>
    </Card>

    <!-- Detail Dialog -->
    <Modal
      v-model:visible="detailVisible"
      title="检测详情"
      :width="800"
      :footer="null"
      destroy-on-close
    >
      <template v-if="detailData">
        <Descriptions :column="2" bordered size="small">
          <DescriptionsItem label="Trace ID">{{
            detailData.traceId
          }}</DescriptionsItem>
          <DescriptionsItem label="接口路径">{{
            detailData.apiPath
          }}</DescriptionsItem>
          <DescriptionsItem label="操作名称">{{
            detailData.opName
          }}</DescriptionsItem>
          <DescriptionsItem label="风险等级">
            <Tag :color="riskTagColor(detailData.riskLevel)" size="small">
              {{ getRiskLevelName(detailData.riskLevel) }}
            </Tag>
          </DescriptionsItem>
          <DescriptionsItem label="检测时间">{{
            detailData.detectTime
          }}</DescriptionsItem>
          <DescriptionsItem label="确认状态">
            <Tag :color="confirmTagColor(detailData.dealStatus)" size="small">
              {{ confirmLabel(detailData.dealStatus) }}
            </Tag>
          </DescriptionsItem>
          <DescriptionsItem label="敏感类型" :span="2">
            <Tag
              v-for="t in detailData.sensitiveTypes || []"
              :key="t"
              color="red"
              size="small"
              class="mr-1"
            >
              {{ getSensitiveTypeName(t) }}
            </Tag>
          </DescriptionsItem>
        </Descriptions>

        <div
          v-if="detailData.details && detailData.details.length"
          class="mt-5"
        >
          <h4
            class="mb-2 border-l-[3px] border-red-500 pl-2 text-sm font-medium"
          >
            敏感信息明细
          </h4>
          <Table
            :columns="sensitiveDetailColumns"
            :data-source="detailData.details"
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
      </template>
    </Modal>

    <!-- Batch Recheck Dialog -->
    <Modal
      v-model:visible="recheckDialogVisible"
      title="LLM 批量复检"
      :width="900"
      :footer="null"
      destroy-on-close
    >
      <!-- Config Section -->
      <Card class="mb-4" size="small">
        <Form layout="horizontal" :label-col="{ span: 4 }" :wrapper-col="{ span: 20 }">
          <FormItem label="检测范围">
            <RadioGroup v-model:value="recheckScope">
              <Radio value="all">全量检测（所有日志）</Radio>
              <Radio value="api">按接口路径检测</Radio>
            </RadioGroup>
          </FormItem>
          <FormItem v-if="recheckScope === 'api'" label="接口路径">
            <Input
              v-model:value="recheckApiPath"
              placeholder="输入接口路径关键字，如 QueryUserInfo"
              allow-clear
              style="width: 300px"
            />
          </FormItem>
        </Form>
        <div class="text-right">
          <Button class="mr-2" @click="recheckDialogVisible = false">
            取消
          </Button>
          <Button
            type="primary"
            :loading="rechecking"
            :disabled="recheckScope === 'api' && !recheckApiPath.trim()"
            @click="handleStartRecheck"
          >
            开始复检
          </Button>
        </div>
      </Card>

      <!-- Progress Section -->
      <div v-if="recheckProgress.running" class="py-6 text-center">
        <Spin size="large" />
        <p class="mt-3 text-sm text-gray-400">
          正在复检中，已处理 {{ recheckProgress.done }} /
          {{ recheckProgress.total }} 条...
        </p>
        <Progress
          :percent="
            recheckProgress.total > 0
              ? Math.round(
                  (recheckProgress.done / recheckProgress.total) * 100,
                )
              : 0
          "
          :stroke-width="8"
          class="mt-2"
        />
      </div>

      <!-- Result Section -->
      <div v-if="recheckResult" class="mt-4">
        <h4
          class="mb-3 border-l-[3px] border-red-500 pl-2 text-sm font-medium"
        >
          复检结果
        </h4>
        <div class="flex flex-wrap gap-4">
          <div
            class="min-w-[80px] rounded-lg border p-3 text-center"
          >
            <span class="block text-2xl font-bold">{{
              recheckResult.total
            }}</span>
            <span class="mt-1 block text-xs text-gray-400">检测总数</span>
          </div>
          <div
            class="min-w-[80px] rounded-lg border p-3 text-center"
          >
            <span class="block text-2xl font-bold text-red-500">{{
              recheckResult.detected
            }}</span>
            <span class="mt-1 block text-xs text-gray-400">检出敏感</span>
          </div>
          <div
            class="min-w-[80px] rounded-lg border p-3 text-center"
          >
            <span class="block text-2xl font-bold text-green-500">{{
              recheckResult.safe
            }}</span>
            <span class="mt-1 block text-xs text-gray-400">安全</span>
          </div>
          <div
            class="min-w-[80px] rounded-lg border p-3 text-center"
          >
            <span class="block text-2xl font-bold text-blue-500">{{
              recheckResult.llmSuccess
            }}</span>
            <span class="mt-1 block text-xs text-gray-400">LLM成功</span>
          </div>
          <div
            v-if="recheckResult.llmFail > 0"
            class="min-w-[80px] rounded-lg border p-3 text-center"
          >
            <span class="block text-2xl font-bold text-orange-500">{{
              recheckResult.llmFail
            }}</span>
            <span class="mt-1 block text-xs text-gray-400">LLM失败</span>
          </div>
        </div>

        <!-- Detail Table -->
        <div
          v-if="recheckResult.details && recheckResult.details.length"
          class="mt-4"
        >
          <Table
            :columns="recheckDetailColumns"
            :data-source="recheckResult.details"
            :pagination="false"
            :scroll="{ y: 300 }"
            bordered
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'ruleHits'">
                <template v-if="record.ruleHit">
                  <Tag color="red" size="small" class="mr-1">命中</Tag>
                </template>
                <span v-else class="text-green-500">-</span>
              </template>
              <template v-if="column.key === 'llmDetect'">
                <template v-if="record.error">
                  <Tag color="orange" size="small">失败</Tag>
                </template>
                <template v-else-if="record.llmDetected !== undefined">
                  <Tag
                    v-if="record.llmDetected"
                    color="red"
                    size="small"
                  >
                    敏感
                  </Tag>
                  <Tag v-else color="green" size="small">安全</Tag>
                </template>
                <span v-else class="text-gray-400">未启用</span>
              </template>
              <template v-if="column.key === 'sensitiveTypes'">
                <template
                  v-if="
                    record.sensitiveTypes && record.sensitiveTypes.length
                  "
                >
                  <Tag
                    v-for="t in record.sensitiveTypes"
                    :key="t"
                    color="red"
                    size="small"
                    class="mr-1"
                  >
                    {{ t }}
                  </Tag>
                </template>
                <span v-else class="text-gray-400">-</span>
              </template>
            </template>
          </Table>
        </div>
      </div>
    </Modal>
  </Page>
</template>
