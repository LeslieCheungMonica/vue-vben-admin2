<script lang="ts" setup>
import type { SystemRoleItem } from '#/api';

import { reactive, ref, watch } from 'vue';

import {
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Modal,
  Switch,
} from 'ant-design-vue';

import { createRoleApi, extractApiError, updateRoleApi } from '#/api';

const props = defineProps<{
  /** 为空表示新增 */
  record: null | SystemRoleItem;
}>();

const emit = defineEmits<{ success: [] }>();

const open = defineModel<boolean>('open', { default: false });

const submitting = ref(false);

const form = reactive({
  code: '',
  name: '',
  remark: '',
  sort: 0,
  status: 1,
});

watch(open, (visible) => {
  if (!visible) {
    return;
  }
  Object.assign(form, {
    code: props.record?.code ?? '',
    name: props.record?.name ?? '',
    remark: props.record?.remark ?? '',
    sort: props.record?.sort ?? 0,
    status: props.record?.status ?? 1,
  });
});

function handleStatusChange(checked: boolean | number | string) {
  form.status = checked ? 1 : 0;
}

async function handleOk() {
  submitting.value = true;
  try {
    if (props.record) {
      await updateRoleApi({ ...form, id: props.record.id });
      message.success('保存成功');
    } else {
      await createRoleApi({ ...form });
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
    :confirm-loading="submitting"
    :destroy-on-close="true"
    :title="props.record ? '编辑角色' : '新增角色'"
    :width="560"
    cancel-text="取消"
    ok-text="保存"
    @ok="handleOk"
  >
    <Form :label-col="{ span: 5 }" class="pt-4">
      <FormItem label="角色编码" required>
        <Input
          v-model:value="form.code"
          :disabled="Boolean(props.record)"
          :maxlength="32"
          placeholder="字母开头，2-32 位字母数字下划线"
        />
      </FormItem>
      <FormItem label="角色名称" required>
        <Input
          v-model:value="form.name"
          :maxlength="32"
          placeholder="请输入角色名称"
        />
      </FormItem>
      <FormItem label="排序">
        <InputNumber v-model:value="form.sort" :min="0" class="w-full" />
      </FormItem>
      <FormItem label="状态">
        <Switch
          :checked="form.status === 1"
          checked-children="启用"
          un-checked-children="停用"
          @change="handleStatusChange"
        />
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
  </Modal>
</template>
