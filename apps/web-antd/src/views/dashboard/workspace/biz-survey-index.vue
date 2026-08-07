<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Button, Card, Table, Tag } from 'ant-design-vue';

import { getResourceListApi } from '#/api/core/resource';
import type { ResourceApi } from '#/api/core/resource';

const router = useRouter();
const loading = ref(false);
const groups = ref<{ system_name: string; resources: ResourceApi.ResourceItem[] }[]>([]);

async function fetchGroups() {
  loading.value = true;
  try {
    const res = await getResourceListApi();
    const items = res.items ?? [];
    const map = new Map<string, ResourceApi.ResourceItem[]>();
    for (const item of items) {
      const name = (item as any).system_name;
      if (!name) continue;
      if (!map.has(name)) map.set(name, []);
      map.get(name)!.push(item);
    }
    groups.value = [];
    map.forEach((resources, system_name) => {
      groups.value.push({ system_name, resources });
    });
    groups.value.sort((a, b) => a.system_name.localeCompare(b.system_name));
  } finally {
    loading.value = false;
  }
}

function startSurvey(group: { system_name: string; resources: ResourceApi.ResourceItem[] }) {
  const maxId = Math.max(...group.resources.map((r) => r.id));
  router.push(`/dashboard/task/biz-survey/${maxId}`);
}

onMounted(() => {
  fetchGroups();
});
</script>

<template>
  <Page title="业务测绘">
    <Card>
      <Table
        :columns="[
          { dataIndex: 'system_name', key: 'system_name', title: '系统名称' },
          { dataIndex: 'resource_count', key: 'resource_count', title: '资源数量', width: 120 },
          { key: 'action', title: '操作', width: 120 },
        ]"
        :data-source="groups"
        :loading="loading"
        :pagination="false"
        bordered
        row-key="system_name"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'resource_count'">
            <Tag color="blue">{{ record.resources.length }}</Tag>
          </template>
          <template v-if="column.key === 'action'">
            <Button type="primary" size="small" @click="startSurvey(record)">
              开始测绘
            </Button>
          </template>
        </template>
      </Table>
    </Card>
  </Page>
</template>