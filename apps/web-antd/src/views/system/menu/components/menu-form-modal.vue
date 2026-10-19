<script lang="ts" setup>
import type { SystemMenuItem, SystemMenuType } from '#/api';

import { reactive, ref, watch } from 'vue';

import { IconPicker } from '@vben/common-ui';

import {
  Button,
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Modal,
  Radio,
  Space,
  Switch,
  TreeSelect,
} from 'ant-design-vue';

import {
  createMenuApi,
  extractApiError,
  getMenuListApi,
  menuPathExistsApi,
  updateMenuApi,
} from '#/api';

const props = defineProps<{
  /** 新增子级时的父节点 id */
  parentId: number;
  /** 为空表示新增 */
  record: null | SystemMenuItem;
}>();

const emit = defineEmits<{ success: [] }>();

const open = defineModel<boolean>('open', { default: false });

const submitting = ref(false);
const treeLoading = ref(false);
const parentTreeData = ref<any[]>([]);

const form = reactive({
  hideInMenu: 0,
  icon: '',
  menuUrl: '',
  orderNo: 0,
  pid: 0,
  remark: '',
  status: 1,
  title: '',
  type: 'menu' as SystemMenuType,
});

const typeOptions = [
  { label: '目录', value: 'catalog' },
  { label: '菜单', value: 'menu' },
];

/** 构建父菜单选择树（排除编辑节点及其后代） */
function buildParentTree(
  items: SystemMenuItem[],
  excludeId?: number,
): any[] {
  const result: any[] = [];
  for (const item of items) {
    if (item.id === excludeId) {
      continue;
    }
    const children = item.children?.length
      ? buildParentTree(item.children, excludeId)
      : [];
    result.push({
      children: children.length > 0 ? children : undefined,
      id: item.id,
      title: item.title,
    });
  }
  return result;
}

async function loadParentTree() {
  treeLoading.value = true;
  try {
    const menuTree = await getMenuListApi({});
    parentTreeData.value = [
      {
        children: buildParentTree(menuTree, props.record?.id),
        id: 0,
        title: '根目录',
      },
    ];
  } catch (error) {
    message.error(extractApiError(error, '菜单数据获取失败'));
  } finally {
    treeLoading.value = false;
  }
}

watch(open, async (visible) => {
  if (!visible) {
    return;
  }
  const record = props.record;
  Object.assign(form, {
    hideInMenu: record?.hideInMenu ? 1 : 0,
    icon: record?.icon ?? '',
    menuUrl: record?.menuUrl ?? '',
    orderNo: record?.orderNo ?? 0,
    pid: record?.pid ?? props.parentId ?? 0,
    remark: record?.remark ?? '',
    status: record?.status ?? 1,
    title: record?.title ?? '',
    type: record?.type ?? 'menu',
  });
  await loadParentTree();
});

function handleStatusChange(checked: boolean | number | string) {
  form.status = checked ? 1 : 0;
}

function handleHideInMenuChange(checked: boolean | number | string) {
  form.hideInMenu = checked ? 1 : 0;
}

async function handleOk() {
  if (!form.title) {
    message.error('请填写菜单标题');
    return;
  }
  if (form.type === 'menu' && !form.menuUrl) {
    message.error('菜单类型下请填写菜单地址');
    return;
  }
  submitting.value = true;
  try {
    const id = props.record?.id ?? 0;
    // 前端预校验唯一性（后端仍会强校验并返回 409）
    if (form.menuUrl && (await menuPathExistsApi(form.menuUrl, id))) {
      message.error('菜单地址已存在');
      return;
    }

    const payload = { ...form };

    if (props.record) {
      await updateMenuApi({ ...payload, id: props.record.id });
      message.success('保存成功');
    } else {
      await createMenuApi(payload);
      message.success('新增成功');
    }
    open.value = false;
    emit('success');
  } catch (error) {
    message.error(extractApiError(error));
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Modal
    v-model:open="open"
    :title="props.record ? '编辑菜单' : '新增菜单'"
    :width="520"
  >
    <Form :label-col="{ span: 5 }" class="pt-4">
      <FormItem label="菜单类型" required>
        <Radio.Group
          v-model:value="form.type"
          :options="typeOptions"
          option-type="button"
        />
      </FormItem>
      <FormItem label="上级菜单">
        <TreeSelect
          v-model:value="form.pid"
          :field-names="{ children: 'children', label: 'title', value: 'id' }"
          :loading="treeLoading"
          :tree-data="parentTreeData"
          placeholder="不选则为根节点"
          tree-default-expand-all
        />
      </FormItem>
      <FormItem label="菜单标题" required>
        <Input
          v-model:value="form.title"
          :maxlength="32"
          placeholder="显示在菜单上的名称"
        />
      </FormItem>
      <FormItem v-if="form.type === 'menu'" label="菜单地址" required>
        <Input
          v-model:value="form.menuUrl"
          :maxlength="256"
          placeholder="如 /system/user"
        />
      </FormItem>
      <FormItem label="图标">
        <IconPicker v-model="form.icon" />
      </FormItem>
      <FormItem label="排序">
        <InputNumber v-model:value="form.orderNo" class="w-full" />
      </FormItem>
      <FormItem label="状态">
        <Switch
          :checked="form.status === 1"
          checked-children="启用"
          un-checked-children="停用"
          @change="handleStatusChange"
        />
      </FormItem>
      <FormItem label="隐藏菜单">
        <Switch
          :checked="form.hideInMenu === 1"
          checked-children="隐藏"
          un-checked-children="显示"
          @change="handleHideInMenuChange"
        />
        <div class="mt-1 text-xs text-gray-400">
          隐藏后不在侧边栏显示，但路由仍会注册（适用于详情页等）
        </div>
      </FormItem>
      <FormItem label="备注">
        <Input.TextArea
          v-model:value="form.remark"
          :maxlength="200"
          :rows="2"
          placeholder="请输入备注"
          show-count
        />
      </FormItem>
    </Form>
    <template #footer>
      <Space>
        <Button @click="open = false">取消</Button>
        <Button :loading="submitting" type="primary" @click="handleOk">
          保存
        </Button>
      </Space>
    </template>
  </Modal>
</template>
