<script lang="ts" setup>
import type { SystemRoleOption } from '#/api';

import { reactive, ref, watch } from 'vue';

import {
  Form,
  FormItem,
  Input,
  InputPassword,
  message,
  Modal,
  Select,
  Switch,
} from 'ant-design-vue';

import {
  createUserApi,
  extractApiError,
  getRoleOptionsApi,
  getUserDetailApi,
  updateUserApi,
} from '#/api';

const props = defineProps<{
  /** 为空表示新增，否则为编辑的用户 id */
  recordId: null | number;
}>();

const emit = defineEmits<{ success: [] }>();

const open = defineModel<boolean>('open', { default: false });

const submitting = ref(false);
const roleOptions = ref<SystemRoleOption[]>([]);

const form = reactive({
  email: '',
  mobile: '',
  password: '',
  realName: '',
  remark: '',
  roleIds: [] as number[],
  status: 1,
  username: '',
});

const passwordRules = [
  {
    validator: (_rule: unknown, value: string) => {
      if (!props.recordId && !value) {
        return Promise.reject(new Error('请输入初始密码'));
      }
      if (value && !/^(?=.*[A-Za-z])(?=.*\d)[\S\s]{6,32}$/.test(value)) {
        return Promise.reject(new Error('密码需为 6-32 位且同时包含字母和数字'));
      }
      return Promise.resolve();
    },
  },
];

const roleSelectOptions = ref<{ label: string; value: number }[]>([]);

function resetForm() {
  Object.assign(form, {
    email: '',
    mobile: '',
    password: '',
    realName: '',
    remark: '',
    roleIds: [],
    status: 1,
    username: '',
  });
}

async function loadRoleOptions() {
  try {
    roleOptions.value = await getRoleOptionsApi();
    roleSelectOptions.value = roleOptions.value.map((item) => ({
      label: `${item.name}（${item.code}）`,
      value: item.id,
    }));
  } catch (error) {
    message.error(extractApiError(error, '角色列表获取失败'));
  }
}

async function loadDetail(id: number) {
  try {
    const detail = await getUserDetailApi(id);
    Object.assign(form, {
      email: detail.email,
      mobile: detail.mobile,
      password: '',
      realName: detail.realName,
      remark: detail.remark,
      roleIds: detail.roleIds,
      status: detail.status,
      username: detail.username,
    });
  } catch (error) {
    message.error(extractApiError(error, '用户详情获取失败'));
  }
}

watch(open, async (visible) => {
  if (!visible) {
    return;
  }
  resetForm();
  await loadRoleOptions();
  if (props.recordId) {
    await loadDetail(props.recordId);
  }
});

function handleStatusChange(checked: boolean | number | string) {
  form.status = checked ? 1 : 0;
}

async function handleOk() {
  if (!form.roleIds.length) {
    message.error('请选择至少一个角色');
    return;
  }
  submitting.value = true;
  try {
    if (props.recordId) {
      await updateUserApi({ ...form, id: props.recordId });
      message.success('保存成功');
    } else {
      await createUserApi({ ...form });
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
    :title="props.recordId ? '编辑用户' : '新增用户'"
    :width="640"
    cancel-text="取消"
    ok-text="保存"
    @ok="handleOk"
  >
    <Form :label-col="{ span: 5 }" class="pt-4">
      <FormItem label="用户名" required>
        <Input
          v-model:value="form.username"
          :disabled="Boolean(props.recordId)"
          :maxlength="32"
          placeholder="3-32 位字母、数字或下划线"
        />
      </FormItem>
      <FormItem label="姓名" required>
        <Input
          v-model:value="form.realName"
          :maxlength="32"
          placeholder="请输入姓名"
        />
      </FormItem>
      <FormItem v-if="!props.recordId" :rules="passwordRules" label="初始密码" required>
        <InputPassword
          v-model:value="form.password"
          :maxlength="32"
          placeholder="6-32 位，需包含字母和数字"
        />
      </FormItem>
      <FormItem label="手机号">
        <Input
          v-model:value="form.mobile"
          :maxlength="20"
          placeholder="请输入手机号"
        />
      </FormItem>
      <FormItem label="邮箱">
        <Input
          v-model:value="form.email"
          :maxlength="128"
          placeholder="请输入邮箱"
        />
      </FormItem>
      <FormItem label="角色" required>
        <Select
          v-model:value="form.roleIds"
          :options="roleSelectOptions"
          mode="multiple"
          placeholder="请选择角色"
        />
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
