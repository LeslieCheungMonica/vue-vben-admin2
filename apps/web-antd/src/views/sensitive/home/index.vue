<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { Button, Card, Statistic, Table, Tag } from 'ant-design-vue';
import { useRouter } from 'vue-router';

import { statisticsApi } from '#/api/core/sensitive-data';

import {
  getRiskLevelColor,
  getRiskLevelName,
  getSensitiveTypeName,
} from '../utils/mapping';

const router = useRouter();

const stats = reactive({
  totalLogs: 0,
  totalDetections: 0,
  totalRisks: 0,
  riskDistribution: {} as Record<string, number>,
  sensitiveTypeDistribution: {} as Record<string, number>,
  topRiskyApis: [] as any[],
});

const riskTagColor = (level: string) => getRiskLevelColor(level);

const highRiskCount = computed(() => {
  const d = stats.riskDistribution;
  return (d.CRITICAL || 0) + (d.HIGH || 0);
});

// Pie chart
const pieChartRef = ref<EchartsUIType>();
const { renderEcharts: renderPie } = useEcharts(pieChartRef);

// Bar chart
const barChartRef = ref<EchartsUIType>();
const { renderEcharts: renderBar } = useEcharts(barChartRef);

const riskyApiColumns = [
  {
    dataIndex: 'service_name',
    key: 'service_name',
    title: '服务名称',
    ellipsis: true,
  },
  {
    dataIndex: 'service_route',
    key: 'service_route',
    title: '服务路由',
    ellipsis: true,
  },
  {
    key: 'risk_level',
    title: '风险等级',
    width: 110,
    align: 'center' as const,
  },
  {
    dataIndex: 'sensitive_types',
    key: 'sensitive_types',
    title: '敏感类型',
    ellipsis: true,
  },
];

const loadStatistics = async () => {
  try {
    const res = await statisticsApi();
    if (res) {
      stats.totalLogs = res.totalLogs || 0;
      stats.totalDetections = res.totalDetections || 0;
      stats.totalRisks = res.totalRisks || 0;
      stats.riskDistribution = res.riskDistribution || {};
      stats.sensitiveTypeDistribution = res.sensitiveTypeDistribution || {};
      stats.topRiskyApis = res.topRiskyApis || [];
    }
  } catch {
    // Use default empty data on error
  }
};

const renderCharts = () => {
  // Pie chart - risk distribution (object → array)
  const pieData = Object.entries(stats.riskDistribution).map(
    ([name, value]) => ({ name, value }),
  );
  renderPie({
    tooltip: {
      trigger: 'item',
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['40%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderWidth: 2,
        },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold' },
        },
        data: pieData,
      },
    ],
    color: ['#e94560', '#f5a623', '#409eff', '#67c23a', '#909399'],
  });

  // Bar chart - type distribution (object → array)
  const types = Object.keys(stats.sensitiveTypeDistribution).map(t => getSensitiveTypeName(t));
  const counts = Object.values(stats.sensitiveTypeDistribution);
  renderBar({
    tooltip: {
      trigger: 'axis',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: types,
      axisLabel: { rotate: 30 },
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        type: 'bar',
        data: counts,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
  });
};

onMounted(async () => {
  await loadStatistics();
  renderCharts();
});
</script>

<template>
  <Page description="敏感数据检测总览" title="总览">
    <!-- Stat Cards -->
    <div class="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <Statistic
          title="总日志数"
          :value="stats.totalLogs"
          :value-style="{ color: '#409eff' }"
        />
      </Card>
      <Card>
        <Statistic
          title="检测发现数"
          :value="stats.totalDetections"
          :value-style="{ color: '#e94560' }"
        />
      </Card>
      <Card>
        <Statistic
          title="高危接口数"
          :value="highRiskCount"
          :value-style="{ color: '#f5a623' }"
        />
      </Card>
      <Card>
        <Statistic
          title="风险接口数"
          :value="stats.totalRisks"
          :value-style="{ color: '#67c23a' }"
        />
      </Card>
    </div>

    <!-- Charts Row -->
    <div class="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card title="风险等级分布">
        <EchartsUI ref="pieChartRef" height="360px" />
      </Card>
      <Card title="敏感类型分布">
        <EchartsUI ref="barChartRef" height="360px" />
      </Card>
    </div>

    <!-- Top Risky APIs -->
    <Card>
      <template #title>
        <span>高危接口 Top5</span>
      </template>
      <template #extra>
        <Button
          type="link"
          @click="router.push('/sensitive/detection')"
        >
          查看更多 →
        </Button>
      </template>
      <Table
        :columns="riskyApiColumns"
        :data-source="stats.topRiskyApis"
        :pagination="false"
        bordered
        size="middle"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'risk_level'">
            <Tag :color="riskTagColor(record.risk_level)" size="small">
              {{ getRiskLevelName(record.risk_level) }}
            </Tag>
          </template>
          <template v-if="column.key === 'sensitive_types'">
            <template v-if="Array.isArray(record.sensitive_types)">
              <Tag
                v-for="t in record.sensitive_types"
                :key="t"
                color="red"
                size="small"
                class="mr-1"
              >
                {{ getSensitiveTypeName(t) }}
              </Tag>
            </template>
            <template v-else>
              {{ getSensitiveTypeName(record.sensitive_types) }}
            </template>
          </template>
        </template>
      </Table>
    </Card>
  </Page>
</template>
