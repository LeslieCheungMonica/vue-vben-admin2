<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import { onMounted, ref } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

defineProps<{
  data: { type: string; count: number }[];
}>();

onMounted(() => {
  renderEcharts({
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
      data: [],
      axisLabel: { rotate: 30 },
    },
    yAxis: {
      type: 'value',
    },
    series: [
      {
        type: 'bar',
        data: [],
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
  });
});
</script>

<template>
  <EchartsUI ref="chartRef" />
</template>
