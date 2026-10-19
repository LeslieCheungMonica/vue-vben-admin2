import type { PageResult, StatusResult } from './system-common';

import { systemPost, toPageResult } from './system-common';

export interface SystemRoleItem {
  builtIn: boolean;
  code: string;
  createTime: string;
  id: number;
  menuCount: number;
  name: string;
  remark: string;
  sort: number;
  status: number;
  updateTime: string;
}

export interface SystemRoleOption {
  code: string;
  id: number;
  name: string;
}

export interface SystemRoleDetail extends SystemRoleItem {
  menuIds: number[];
}

export interface SystemRoleQuery {
  code?: string;
  name?: string;
  page?: number;
  pageSize?: number;
  status?: number;
}

export interface SystemRoleForm {
  code?: string;
  name: string;
  remark?: string;
  sort: number;
  status: number;
}

function mapRole(raw: any): SystemRoleItem {
  return {
    builtIn: Boolean(raw?.built_in),
    code: raw?.code ?? '',
    createTime: raw?.create_time ?? '',
    id: raw?.id,
    menuCount: raw?.menu_count ?? 0,
    name: raw?.name ?? '',
    remark: raw?.remark ?? '',
    sort: raw?.sort ?? 0,
    status: raw?.status ?? 1,
    updateTime: raw?.update_time ?? '',
  };
}

/** API-08 角色列表 */
export function getRoleListApi(
  query: SystemRoleQuery = {},
): Promise<PageResult<SystemRoleItem>> {
  return systemPost<any>('/system/role_list', {
    code: query.code ?? '',
    name: query.name ?? '',
    page: query.page ?? 1,
    page_size: query.pageSize ?? 20,
    status: query.status ?? -1,
  }).then((raw) => toPageResult(raw, mapRole));
}

/** API-09 角色下拉选项（仅启用角色） */
export function getRoleOptionsApi(): Promise<SystemRoleOption[]> {
  return systemPost<any>('/system/role_options', {}).then((raw) =>
    (raw?.items ?? []).map((item: any) => ({
      code: item?.code ?? '',
      id: item?.id,
      name: item?.name ?? '',
    })),
  );
}

/** API-10 角色详情（含已授权菜单 id） */
export function getRoleDetailApi(id: number): Promise<SystemRoleDetail> {
  return systemPost<any>('/system/role_detail', { id }).then((raw) => ({
    ...mapRole(raw?.item),
    menuIds: raw?.item?.menu_ids ?? [],
  }));
}

/** API-11 新增角色 */
export function createRoleApi(data: SystemRoleForm) {
  return systemPost<{ id: number; message: string; status: string }>(
    '/system/role_create',
    {
      code: data.code,
      name: data.name,
      remark: data.remark ?? '',
      sort: data.sort ?? 0,
      status: data.status ?? 1,
    },
  );
}

/** API-12 编辑角色 */
export function updateRoleApi(data: SystemRoleForm & { id: number }) {
  return systemPost<StatusResult>('/system/role_update', {
    id: data.id,
    name: data.name,
    remark: data.remark ?? '',
    sort: data.sort ?? 0,
    status: data.status ?? 1,
  });
}

/** API-13 角色启停 */
export function updateRoleStatusApi(id: number, status: number) {
  return systemPost<StatusResult>('/system/role_status', { id, status });
}

/** API-14 角色授权菜单（整体替换，后端会自动补齐祖先节点） */
export function assignRoleMenusApi(id: number, menuIds: number[]) {
  return systemPost<StatusResult>('/system/role_menus', {
    id,
    menu_ids: menuIds ?? [],
  });
}

/** API-15 删除角色 */
export function deleteRoleApi(id: number) {
  return systemPost<StatusResult>('/system/role_delete', { id });
}
