<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Button, Card, message, Table, Tag } from 'ant-design-vue';

import { bizSurveyCreateApi, getResourceListApi } from '#/api/core/resource';
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

async function startSurvey(group: { system_name: string; resources: ResourceApi.ResourceItem[] }) {
  const maxResource = group.resources.reduce((a, b) => (a.id > b.id ? a : b));
  const systemName = group.system_name;
  const systemId = `sys_${systemName.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '_')}`;
  const resourcePath = `${maxResource.code}/${maxResource.version}`;
  try {
    await bizSurveyCreateApi({
      system_id: systemId,
      system_name: systemName,
      resource_id: maxResource.id,
      resource_path: resourcePath,
    });
    router.push(`/dashboard/task/biz-survey/${maxResource.id}?system_id=${systemId}`);
  } catch {
    message.error('创建业务测绘失败');
  }
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