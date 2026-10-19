import type { RouteRecordStringComponent } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 获取当前用户可访问的菜单（后端驱动）。
 * 返回 RouteRecordStringComponent[] 格式，由 Vben 框架直接生成侧边栏和路由。
 */
export async function getAllMenusApi(): Promise<RouteRecordStringComponent[]> {
  return requestClient.get<RouteRecordStringComponent[]>('/system/menu_all');
}
