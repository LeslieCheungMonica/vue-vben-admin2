import type { PageResult } from './system-common';
import type { StatusResult } from './system-common';

import { fetchPublicKey, rsaEncrypt } from '#/utils/rsa-encrypt';

import { systemPost, toPageResult } from './system-common';

export interface SystemRoleBrief {
  code: string;
  id: number;
  name: string;
}

export interface SystemUserItem {
  builtIn: boolean;
  createTime: string;
  email: string;
  id: number;
  mobile: string;
  realName: string;
  remark: string;
  roles: SystemRoleBrief[];
  status: number;
  updateTime: string;
  username: string;
}

export interface SystemUserDetail extends SystemUserItem {
  roleIds: number[];
}

export interface SystemUserQuery {
  endTime?: string;
  mobile?: string;
  page?: number;
  pageSize?: number;
  realName?: string;
  startTime?: string;
  status?: number;
  username?: string;
}

export interface SystemUserForm {
  email?: string;
  mobile?: string;
  password?: string;
  realName: string;
  remark?: string;
  roleIds: number[];
  status: number;
  username?: string;
}

function mapRoleBrief(raw: any): SystemRoleBrief {
  return {
    code: raw?.code ?? '',
    id: raw?.id,
    name: raw?.name ?? '',
  };
}

function mapUser(raw: any): SystemUserItem {
  return {
    builtIn: Boolean(raw?.built_in),
    createTime: raw?.create_time ?? '',
    email: raw?.email ?? '',
    id: raw?.id,
    mobile: raw?.mobile ?? '',
    realName: raw?.real_name ?? '',
    remark: raw?.remark ?? '',
    roles: (raw?.roles ?? []).map((role: any) => mapRoleBrief(role)),
    status: raw?.status ?? 1,
    updateTime: raw?.update_time ?? '',
    username: raw?.username ?? '',
  };
}

function toBasePayload(data: SystemUserForm) {
  return {
    email: data.email ?? '',
    mobile: data.mobile ?? '',
    real_name: data.realName,
    remark: data.remark ?? '',
    role_ids: data.roleIds ?? [],
    status: data.status ?? 1,
  };
}

/** API-01 用户列表 */
export function getUserListApi(
  query: SystemUserQuery = {},
): Promise<PageResult<SystemUserItem>> {
  return systemPost<any>('/system/user_list', {
    end_time: query.endTime ?? '',
    mobile: query.mobile ?? '',
    page: query.page ?? 1,
    page_size: query.pageSize ?? 20,
    real_name: query.realName ?? '',
    start_time: query.startTime ?? '',
    status: query.status ?? -1,
    username: query.username ?? '',
  }).then((raw) => toPageResult(raw, mapUser));
}

/** API-02 用户详情 */
export function getUserDetailApi(id: number): Promise<SystemUserDetail> {
  return systemPost<any>('/system/user_detail', { id }).then((raw) => ({
    ...mapUser(raw?.item),
    roleIds: raw?.item?.role_ids ?? [],
  }));
}

/** API-03 新增用户 */
export async function createUserApi(data: SystemUserForm) {
  await fetchPublicKey();
  return systemPost<{ id: number; message: string; status: string }>(
    '/system/user_create',
    {
      ...toBasePayload(data),
      password: data.password ? rsaEncrypt(data.password) : '',
      username: data.username,
    },
  );
}

/** API-04 编辑用户（username 不可改，后端会忽略） */
export function updateUserApi(data: SystemUserForm & { id: number }) {
  return systemPost<StatusResult>('/system/user_update', {
    ...toBasePayload(data),
    id: data.id,
  });
}

/** API-05 删除用户 */
export function deleteUserApi(id: number) {
  return systemPost<StatusResult>('/system/user_delete', { id });
}

/** API-06 用户启停 */
export function updateUserStatusApi(id: number, status: number) {
  return systemPost<StatusResult>('/system/user_status', { id, status });
}

/** API-07 重置密码 */
export async function resetUserPasswordApi(id: number, password: string) {
  await fetchPublicKey();
  return systemPost<StatusResult>('/system/user_reset_password', {
    id,
    password: rsaEncrypt(password),
  });
}
