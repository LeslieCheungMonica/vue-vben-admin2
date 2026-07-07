<script lang="ts" setup>
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Empty,
  Progress,
  Spin,
  Statistic,
  Table,
  Tag,
} from 'ant-design-vue';

import { generateReportApi } from '#/api/core/sensitive-report';

import {
  getRiskLevelColor,
  getRiskLevelName,
  getSensitiveTypeName,
} from '../utils/mapping';

interface ReportData {
  reportId: string;
  generateTime: string;
  summary: {
    totalLogsAnalyzed: number;
    totalDetections: number;
    totalRisks: number;
    overallRiskLevel: string;
  };
  riskBreakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  sensitiveTypeDistribution: {
    type: string;
    count: number;
    percentage: number;
  }[];
  topRiskyInterfaces: {
    serviceName: string;
    serviceRoute: string;
    riskScore: number;
    riskLevel: string;
    sensitiveTypes: string;
  }[];
  recommendations: string[];
}

const generating = ref(false);
const reportData = ref<ReportData | null>(null);

const riskTagColor = (level: string) => getRiskLevelColor(level);

const riskPercent = (level: string) => {
  if (!reportData.value) return 0;
  const rb = reportData.value.riskBreakdown;
  const total = rb.critical + rb.high + rb.medium + rb.low;
  if (total === 0) return 0;
  const map: Record<string, number> = {
    CRITICAL: rb.critical,
    HIGH: rb.high,
    MEDIUM: rb.medium,
    LOW: rb.low,
  };
  return Math.round(((map[level] || 0) / total) * 100);
};

const handleGenerate = async () => {
  generating.value = true;
  try {
    const res = await generateReportApi();
    if (res) {
      reportData.value = res as any;
    }
  } catch {
    // Error handled by interceptor
  } finally {
    generating.value = false;
  }
};

const typeColumns = [
  { dataIndex: 'type', key: 'type', title: '敏感类型', width: 150 },
  {
    dataIndex: 'count',
    key: 'count',
    title: '检测次数',
    width: 120,
    align: 'center' as const,
  },
  { key: 'percentage', title: '占比', width: 200 },
];

const riskColumns = [
  {
    dataIndex: 'serviceName',
    key: 'serviceName',
    title: '服务名称',
    ellipsis: true,
  },
  {
    dataIndex: 'serviceRoute',
    key: 'serviceRoute',
    title: '服务路由',
    ellipsis: true,
  },
  {
    dataIndex: 'riskScore',
    key: 'riskScore',
    title: '风险分数',
    width: 100,
    align: 'center' as const,
  },
  {
    key: 'riskLevel',
    title: '风险等级',
    width: 110,
    align: 'center' as const,
  },
  {
    dataIndex: 'sensitiveTypes',
    key: 'sensitiveTypes',
    title: '敏感类型',
    ellipsis: true,
  },
];
</script>

<template>
  <Page description="生成敏感信息检测评估报告" title="评估报告">
    <!-- Action Bar -->
    <Card class="mb-4">
      <div class="flex justify-end">
        <Button type="primary" :loading="generating" @click="handleGenerate">
          {{ generating ? '生成中...' : '生成报告' }}
        </Button>
      </div>
    </Card>

    <!-- Loading State -->
    <Card v-if="generating" class="py-20 text-center">
      <Spin size="large" />
      <p class="mt-4 text-gray-400">正在分析数据并生成报告，请稍候...</p>
    </Card>

    <!-- Report Content -->
    <template v-else-if="reportData">
      <!-- Report Header -->
      <Card class="mb-4">
        <div class="flex items-center gap-5">
          <div
            class="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-2xl bg-red-500/10"
          >
            <span class="text-3xl text-red-500">📄</span>
          </div>
          <div>
            <h2 class="mb-2 text-xl font-semibold">敏感信息检测评估报告</h2>
            <p class="text-sm text-gray-400">
              报告编号: {{ reportData.reportId }}
            </p>
            <p class="text-sm text-gray-400">
              生成时间: {{ reportData.generateTime }}
            </p>
            <p class="text-sm text-gray-400">
              综合风险等级:
              <Tag :color="riskTagColor(reportData.summary.overallRiskLevel)">
                {{ getRiskLevelName(reportData.summary.overallRiskLevel) }}
              </Tag>
            </p>
          </div>
        </div>
      </Card>

      <!-- Summary Statistics -->
      <div class="mb-4 grid grid-cols-3 gap-4">
        <Card>
          <Statistic
            title="分析日志数"
            :value="reportData.summary.totalLogsAnalyzed"
          />
        </Card>
        <Card>
          <Statistic
            title="检测发现"
            :value="reportData.summary.totalDetections"
            :value-style="{ color: '#e94560' }"
          />
        </Card>
        <Card>
          <Statistic
            title="风险接口"
            :value="reportData.summary.totalRisks"
            :value-style="{ color: '#f5a623' }"
          />
        </Card>
      </div>

      <!-- Risk Breakdown -->
      <Card class="mb-4" title="风险等级分布">
        <div class="flex flex-col gap-3">
          <div>
            <div class="mb-1 flex justify-between text-sm">
              <span>{{ getRiskLevelName('CRITICAL') }}</span>
              <span class="text-gray-400"
                >{{ reportData.riskBreakdown.critical }} 个</span
              >
            </div>
            <Progress
              :percent="riskPercent('CRITICAL')"
              stroke-color="#e94560"
              :stroke-width="12"
              :show-info="false"
            />
          </div>
          <div>
            <div class="mb-1 flex justify-between text-sm">
              <span>{{ getRiskLevelName('HIGH') }}</span>
              <span class="text-gray-400"
                >{{ reportData.riskBreakdown.high }} 个</span
              >
            </div>
            <Progress
              :percent="riskPercent('HIGH')"
              stroke-color="#f5a623"
              :stroke-width="12"
              :show-info="false"
            />
          </div>
          <div>
            <div class="mb-1 flex justify-between text-sm">
              <span>{{ getRiskLevelName('MEDIUM') }}</span>
              <span class="text-gray-400"
                >{{ reportData.riskBreakdown.medium }} 个</span
              >
            </div>
            <Progress
              :percent="riskPercent('MEDIUM')"
              stroke-color="#409eff"
              :stroke-width="12"
              :show-info="false"
            />
          </div>
          <div>
            <div class="mb-1 flex justify-between text-sm">
              <span>{{ getRiskLevelName('LOW') }}</span>
              <span class="text-gray-400"
                >{{ reportData.riskBreakdown.low }} 个</span
              >
            </div>
            <Progress
              :percent="riskPercent('LOW')"
              stroke-color="#67c23a"
              :stroke-width="12"
              :show-info="false"
            />
          </div>
        </div>
      </Card>

      <!-- Sensitive Type Distribution -->
      <Card class="mb-4" title="敏感类型分布">
        <Table
          :columns="typeColumns"
          :data-source="reportData.sensitiveTypeDistribution"
          :pagination="false"
          bordered
          size="middle"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'type'">
              {{ getSensitiveTypeName(record.type) }}
            </template>
            <template v-if="column.key === 'percentage'">
              <Progress :percent="record.percentage" :stroke-width="10" />
            </template>
          </template>
        </Table>
      </Card>

      <!-- Top Risky Interfaces -->
      <Card class="mb-4" title="高危接口列表">
        <Table
          :columns="riskColumns"
          :data-source="reportData.topRiskyInterfaces"
          :pagination="false"
          bordered
          size="middle"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'riskLevel'">
              <Tag :color="riskTagColor(record.riskLevel)" size="small">
                {{ getRiskLevelName(record.riskLevel) }}
              </Tag>
            </template>
            <template v-if="column.key === 'sensitiveTypes'">
              {{ getSensitiveTypeName(record.sensitiveTypes) }}
            </template>
          </template>
        </Table>
      </Card>

      <!-- Recommendations -->
      <Card title="安全建议">
        <div class="flex flex-col gap-3">
          <div
            v-for="(rec, index) in reportData.recommendations"
            :key="index"
            class="flex items-start gap-3 rounded-lg border p-3"
          >
            <div
              class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500 text-xs font-semibold text-white"
            >
              {{ index + 1 }}
            </div>
            <div class="text-sm leading-relaxed">{{ rec }}</div>
          </div>
        </div>
      </Card>
    </template>

    <!-- Empty State -->
    <Card v-else class="py-20 text-center">
      <Empty description="点击「生成报告」按钮，生成敏感信息检测评估报告" />
    </Card>
  </Page>
</template>
