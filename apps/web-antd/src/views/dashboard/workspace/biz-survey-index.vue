<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Button, Card, message, Table, Tag } from 'ant-design-vue';

import { bizSurveyCreateApi, bizSurveyListApi, bizSurveyUpdateApi, getResourceListApi } from '#/api/core/resource';
import type { ResourceApi } from '#/api/core/resource';

const router = useRouter();
const loading = ref(false);
const groups = ref<{ system_name: string; resources: ResourceApi.ResourceItem[] }[]>([]);
const surveyMap = ref(new Map<string, { resource_id: number; resource_path: string }>());

async function fetchGroups() {
  loading.value = true;
  try {
    const [res, surveyRes] = await Promise.all([getResourceListApi(), bizSurveyListApi()]);
    const records = (surveyRes as any)?.records ?? [];
    surveyMap.value = new Map();
    records.forEach((r: any) => {
      if (r.system_name && r.resource_path != null) {
        surveyMap.value.set(r.system_name, {
          resource_id: r.resource_id,
          resource_path: r.resource_path,
        });
      }
    });
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

function getSurveyInfo(group: any) {
  const maxResource = group.resources.reduce((a: any, b: any) => (a.id > b.id ? a : b));
  const existing = surveyMap.value.get(group.system_name);
  if (existing) {
    return { resource_id: existing.resource_id, resource_path: existing.resource_path };
  }
  return {
    resource_id: maxResource.id,
    resource_path: `${maxResource.code}/${maxResource.version}`,
  };
}

function getResourcePath(group: any): string {
  return getSurveyInfo(group).resource_path;
}

async function startSurvey(group: any) {
  const systemName = group.system_name;
  const systemId = `sys_${systemName.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '_')}`;
  const info = getSurveyInfo(group);
  try {
    await bizSurveyCreateApi({
      system_id: systemId,
      system_name: systemName,
      resource_id: info.resource_id,
      resource_path: info.resource_path,
    });
    router.push(`/dashboard/task/biz-survey/${info.resource_id}?system_id=${systemId}`);
  } catch {
    message.error('创建业务测绘失败');
  }
}

async function updateResource(group: any) {
  const maxResource = group.resources.reduce((a: any, b: any) => (a.id > b.id ? a : b));
  try {
    await bizSurveyUpdateApi(group.system_name, maxResource.id);
    message.success('资源更新成功');
    fetchGroups();
  } catch {
    message.error('资源更新失败');
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
          { key: 'resource_path', title: '资源路径' },
          { dataIndex: 'resource_count', key: 'resource_count', title: '资源数量', width: 120 },
          { key: 'action', title: '操作', width: 200 },
        ]"
        :data-source="groups"
        :loading="loading"
        :pagination="false"
        bordered
        row-key="system_name"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'resource_path'">
            <span class="text-sm text-gray-600">{{ getResourcePath(record) }}</span>
          </template>
          <template v-if="column.key === 'resource_count'">
            <Tag color="blue">{{ record.resources.length }}</Tag>
          </template>
          <template v-if="column.key === 'action'">
            <Button type="primary" size="small" @click="startSurvey(record)">
              开始测绘
            </Button>
            <Button size="small" class="ml-2" @click="updateResource(record)">
              更新资源
            </Button>
          </template>
        </template>
      </Table>
    </Card>
  </Page>
</template>