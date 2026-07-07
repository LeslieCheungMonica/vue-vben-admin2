<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Empty,
  Form,
  FormItem,
  Input,
  message,
  Modal,
  Pagination,
  Select,
  SelectOption,
  Space,
  Spin,
  TabPane,
  Tabs,
  Tag,
  Textarea,
} from 'ant-design-vue';

import {
  knowledgeAddApi,
  knowledgeEnhanceApi,
  knowledgeListApi,
} from '#/api/core/sensitive-knowledge';

import type { SensitiveKnowledgeApi } from '#/api/core/sensitive-knowledge';

const loading = ref(false);
const enhancing = ref(false);
const addVisible = ref(false);
const detailVisible = ref(false);
const enhanceVisible = ref(false);
const searchKeyword = ref('');
const activeCategory = ref('ALL');
const detailData = ref<SensitiveKnowledgeApi.KnowledgeItem | null>(null);
const enhanceQuery = ref('');
const enhanceResult = ref<SensitiveKnowledgeApi.KnowledgeEnhanceResponse | null>(
  null,
);

const knowledgeList = ref<SensitiveKnowledgeApi.KnowledgeItem[]>([]);

const pagination = reactive({
  current: 1,
  pageSize: 12,
  total: 0,
});

const addForm = reactive({
  title: '',
  content: '',
  category: 'LAW',
  tags: [] as string[],
  source: '',
});

const categoryTagColor = (category: string) => {
  const map: Record<string, string> = {
    LAW: 'red',
    STANDARD: 'orange',
    CASE: 'blue',
    TECH: 'green',
  };
  return map[category] || 'blue';
};

const categoryLabel = (category: string) => {
  const map: Record<string, string> = {
    LAW: '法规规范',
    STANDARD: '行业标准',
    CASE: '案例分析',
    TECH: '技术方案',
  };
  return map[category] || category;
};

const loadData = async () => {
  loading.value = true;
  try {
    const res = await knowledgeListApi({
      pageNum: pagination.current,
      pageSize: pagination.pageSize,
      category: activeCategory.value === 'ALL' ? undefined : activeCategory.value,
      keyword: searchKeyword.value || undefined,
    });
    if (res) {
      knowledgeList.value = res.list || [];
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

const handleCategoryChange = (key: string | number) => {
  activeCategory.value = key as string;
  pagination.current = 1;
  loadData();
};

const handleViewDetail = (item: SensitiveKnowledgeApi.KnowledgeItem) => {
  detailData.value = item;
  detailVisible.value = true;
};

const handleAdd = () => {
  Object.assign(addForm, {
    title: '',
    content: '',
    category: 'LAW',
    tags: [],
    source: '',
  });
  addVisible.value = true;
};

const handleSaveAdd = async () => {
  if (!addForm.title || !addForm.content) {
    message.warning('请填写标题和内容');
    return;
  }
  try {
    await knowledgeAddApi(addForm);
    message.success('添加成功');
    addVisible.value = false;
    loadData();
  } catch {
    // Error handled by interceptor
  }
};

const handleEnhance = () => {
  enhanceQuery.value = '';
  enhanceResult.value = null;
  enhanceVisible.value = true;
};

const runEnhance = async () => {
  if (!enhanceQuery.value.trim()) {
    message.warning('请输入增强查询描述');
    return;
  }
  enhancing.value = true;
  try {
    const res = await knowledgeEnhanceApi({ query: enhanceQuery.value });
    if (res) {
      enhanceResult.value = res;
      if (res.enhanced) {
        loadData();
      }
    }
  } catch {
    // Error handled by interceptor
  } finally {
    enhancing.value = false;
  }
};

const handlePageChange = (page: number, pageSize: number) => {
  pagination.current = page;
  pagination.pageSize = pageSize;
  loadData();
};

onMounted(() => {
  loadData();
});
</script>

<template>
  <Page description="管理知识库与AI知识增强" title="知识增强">
    <!-- Action Bar -->
    <Card class="mb-4">
      <div class="flex items-center justify-between">
        <Input
          v-model:value="searchKeyword"
          placeholder="搜索知识条目..."
          allow-clear
          style="width: 300px"
          @press-enter="handleSearch"
        />
        <Space>
          <Button type="primary" @click="handleAdd">新增知识</Button>
          <Button :loading="enhancing" @click="handleEnhance">
            {{ enhancing ? '增强中...' : '知识增强' }}
          </Button>
        </Space>
      </div>
    </Card>

    <!-- Category Tabs -->
    <Card class="mb-4">
      <Tabs v-model:activeKey="activeCategory" @change="handleCategoryChange">
        <TabPane key="ALL" tab="全部" />
        <TabPane key="LAW" tab="法规规范" />
        <TabPane key="STANDARD" tab="行业标准" />
        <TabPane key="CASE" tab="案例分析" />
        <TabPane key="TECH" tab="技术方案" />
      </Tabs>
    </Card>

    <!-- Knowledge Cards -->
    <Spin :spinning="loading">
      <div
        v-if="!loading && knowledgeList.length === 0"
        class="flex items-center justify-center py-16"
      >
        <Empty description="暂无知识条目" />
      </div>
      <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card
          v-for="item in knowledgeList"
          :key="item.id"
          hoverable
          class="cursor-pointer"
          @click="handleViewDetail(item)"
        >
          <div class="mb-3 flex items-center justify-between">
            <Tag :color="categoryTagColor(item.category)" size="small">
              {{ categoryLabel(item.category) }}
            </Tag>
            <span class="text-xs text-gray-400">{{ item.updateTime }}</span>
          </div>
          <h3 class="mb-2 text-sm font-medium leading-snug">
            {{ item.title }}
          </h3>
          <p class="mb-3 line-clamp-3 text-xs leading-relaxed text-gray-500">
            {{ item.content.substring(0, 120) }}...
          </p>
          <div class="flex items-center justify-between">
            <div class="flex gap-1">
              <Tag
                v-for="tag in item.tags.slice(0, 3)"
                :key="tag"
                size="small"
              >
                {{ tag }}
              </Tag>
            </div>
            <span class="text-xs text-gray-400">{{ item.source }}</span>
          </div>
        </Card>
      </div>
    </Spin>

    <!-- Pagination -->
    <div v-if="pagination.total > 0" class="mt-4 flex justify-end">
      <Pagination
        v-model:current="pagination.current"
        v-model:pageSize="pagination.pageSize"
        :page-size-options="['12', '24', '48']"
        :show-size-changer="true"
        :show-quick-jumper="true"
        :show-total="(total: number) => `共 ${total} 条`"
        :total="pagination.total"
        @change="handlePageChange"
      />
    </div>

    <!-- Add Dialog -->
    <Modal
      v-model:visible="addVisible"
      title="新增知识"
      :width="600"
      destroy-on-close
      @ok="handleSaveAdd"
    >
      <Form layout="vertical">
        <FormItem label="标题" required>
          <Input
            v-model:value="addForm.title"
            placeholder="请输入知识标题"
          />
        </FormItem>
        <FormItem label="分类" required>
          <Select
            v-model:value="addForm.category"
            placeholder="选择分类"
            style="width: 100%"
          >
            <SelectOption value="LAW">法规规范</SelectOption>
            <SelectOption value="STANDARD">行业标准</SelectOption>
            <SelectOption value="CASE">案例分析</SelectOption>
            <SelectOption value="TECH">技术方案</SelectOption>
          </Select>
        </FormItem>
        <FormItem label="内容" required>
          <Textarea
            v-model:value="addForm.content"
            :rows="6"
            placeholder="请输入知识内容"
          />
        </FormItem>
        <FormItem label="标签">
          <Select
            v-model:value="addForm.tags"
            mode="tags"
            placeholder="输入标签后回车"
            style="width: 100%"
          />
        </FormItem>
        <FormItem label="来源">
          <Input v-model:value="addForm.source" placeholder="知识来源" />
        </FormItem>
      </Form>
    </Modal>

    <!-- Detail Dialog -->
    <Modal
      v-model:visible="detailVisible"
      title="知识详情"
      :width="700"
      :footer="null"
      destroy-on-close
    >
      <template v-if="detailData">
        <div class="mb-4 flex items-center justify-between">
          <Tag :color="categoryTagColor(detailData.category)" size="small">
            {{ categoryLabel(detailData.category) }}
          </Tag>
          <span class="text-xs text-gray-400">
            更新于 {{ detailData.updateTime }}
          </span>
        </div>
        <h2 class="mb-3 text-lg font-semibold">
          {{ detailData.title }}
        </h2>
        <div class="mb-4 flex gap-1.5">
          <Tag
            v-for="tag in detailData.tags"
            :key="tag"
            size="small"
          >
            {{ tag }}
          </Tag>
        </div>
        <div
          class="max-h-[400px] overflow-y-auto whitespace-pre-wrap rounded-lg border p-4 text-sm leading-8"
        >
          {{ detailData.content }}
        </div>
        <div v-if="detailData.source" class="mt-3 text-xs text-gray-400">
          来源: {{ detailData.source }}
        </div>
      </template>
    </Modal>

    <!-- Enhance Progress Dialog -->
    <Modal
      v-model:visible="enhanceVisible"
      title="知识增强"
      :width="500"
      :footer="null"
      destroy-on-close
    >
      <div class="py-2">
        <Textarea
          v-model:value="enhanceQuery"
          :rows="3"
          placeholder="输入增强查询描述，如：个人信息保护法相关条款"
        />
        <Button
          type="primary"
          :loading="enhancing"
          block
          class="mt-3"
          @click="runEnhance"
        >
          {{ enhancing ? '正在增强...' : '开始增强' }}
        </Button>

        <div v-if="enhanceResult" class="mt-4">
          <div class="rounded-lg border p-4 text-center">
            <div class="mb-2 text-base font-medium">
              {{ enhanceResult.enhanced ? '增强完成' : '增强未完成' }}
            </div>
            <div class="mb-3 text-sm text-gray-500">
              {{ enhanceResult.message }}
            </div>
            <Tag
              v-if="enhanceResult.newEntries > 0"
              color="green"
            >
              新增 {{ enhanceResult.newEntries }} 条知识
            </Tag>
          </div>
        </div>
      </div>
    </Modal>
  </Page>
</template>
