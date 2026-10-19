import type { StatusResult } from './system-common';

import { systemPost } from './system-common';

export type SystemMenuType = 'catalog' | 'menu';

export interface SystemMenuItem {
  builtIn: boolean;
  children: SystemMenuItem[];
  component: string;
  createTime: string;
  hideInMenu: boolean;
  icon: string;
  id: number;
  menuUrl: string;
  name: string;
  orderNo: number;
  pid: number;
  remark: string;
  status: number;
  title: string;
  type: SystemMenuType;
  updateTime: string;
}

export interface SystemMenuTreeNode {
  children: SystemMenuTreeNode[];
  id: number;
  pid: number;
  title: string;
  type: SystemMenuType;
}

export interface SystemMenuQuery {
  status?: number;
  title?: string;
  type?: string;
}

export interface SystemMenuForm {
  component?: string;
  hideInMenu?: number;
  icon?: string;
  menuUrl?: string;
  name?: string;
  orderNo?: number;
  pid?: number;
  remark?: string;
  status?: number;
  title: string;
  type: SystemMenuType;
}

function mapMenu(raw: any): SystemMenuItem {
  return {
    builtIn: Boolean(raw?.built_in),
    children: (raw?.children ?? []).map((child: any) => mapMenu(child)),
    component: raw?.component ?? '',
    createTime: raw?.create_time ?? '',
    hideInMenu: Boolean(raw?.hide_in_menu),
    icon: raw?.icon ?? '',
    id: raw?.id,
    menuUrl: raw?.menu_url ?? '',
    name: raw?.name ?? '',
    orderNo: raw?.order_no ?? 0,
    pid: raw?.pid ?? 0,
    remark: raw?.remark ?? '',
    status: raw?.status ?? 1,
    title: raw?.title ?? '',
    type: raw?.type ?? 'menu',
    updateTime: raw?.update_time ?? '',
  };
}

function toPayload(data: SystemMenuForm) {
  return {
    component: data.component ?? '',
    hide_in_menu: data.hideInMenu ?? 0,
    icon: data.icon ?? '',
    menu_url: data.menuUrl ?? '',
    name: data.name ?? '',
    order_no: data.orderNo ?? 0,
    pid: data.pid ?? 0,
    remark: data.remark ?? '',
    status: data.status ?? 1,
    title: data.title,
    type: data.type,
  };
}

/** API-16 菜单列表（树形） */
export function getMenuListApi(
  query: SystemMenuQuery = {},
): Promise<SystemMenuItem[]> {
  return systemPost<any>('/system/menu_list', {
    status: query.status ?? -1,
    title: query.title ?? '',
    type: query.type ?? '',
  }).then((raw) => (raw?.items ?? []).map((item: any) => mapMenu(item)));
}

/** API-21 菜单树选择数据（角色授权抽屉使用） */
export function getMenuTreeSelectApi(): Promise<SystemMenuTreeNode[]> {
  const mapNode = (raw: any): SystemMenuTreeNode => ({
    children: (raw?.children ?? []).map((child: any) => mapNode(child)),
    id: raw?.id,
    pid: raw?.pid ?? 0,
    title: raw?.title ?? '',
    type: raw?.type ?? 'menu',
  });
  return systemPost<any>('/system/menu_tree_select', {}).then((raw) =>
    (raw?.items ?? []).map((item: any) => mapNode(item)),
  );
}

/** API-23 路由地址唯一性校验 */
export function menuPathExistsApi(menuUrl: string, id = 0) {
  return systemPost<{ exists: boolean }>('/system/menu_path_exists', {
    id,
    menu_url: menuUrl,
  }).then((raw) => Boolean(raw?.exists));
}

/** API-17 新增菜单 */
export function createMenuApi(data: SystemMenuForm) {
  return systemPost<{ id: number; message: string; status: string }>(
    '/system/menu_create',
    toPayload(data),
  );
}

/** API-18 编辑菜单 */
export function updateMenuApi(data: SystemMenuForm & { id: number }) {
  return systemPost<StatusResult>('/system/menu_update', {
    ...toPayload(data),
    id: data.id,
  });
}

/** API-19 菜单启停 */
export function updateMenuStatusApi(id: number, status: number) {
  return systemPost<StatusResult>('/system/menu_status', { id, status });
}

/** API-20 删除菜单 */
export function deleteMenuApi(id: number) {
  return systemPost<StatusResult>('/system/menu_delete', { id });
}
