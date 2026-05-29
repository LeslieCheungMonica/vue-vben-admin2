import type { RouteRecordRaw } from 'vue-router';

import { mergeRouteModules, traverseTreeValues } from '@vben/utils';

import { menuConfig } from '#/config/menu';
import { coreRoutes, fallbackNotFoundRoute } from './core';

const dynamicRouteFiles = import.meta.glob('./modules/**/*.ts', {
  eager: true,
});

// 有需要可以自行打开注释，并创建文件夹
// const externalRouteFiles = import.meta.glob('./external/**/*.ts', { eager: true });
// const staticRouteFiles = import.meta.glob('./static/**/*.ts', { eager: true });

/** 动态路由 */
const rawDynamicRoutes: RouteRecordRaw[] = mergeRouteModules(dynamicRouteFiles);

/** 根据菜单配置隐藏菜单项（路由保留，避免404） */
function applyMenuConfig(routes: RouteRecordRaw[]): RouteRecordRaw[] {
  return routes.map((route: RouteRecordRaw) => {
    const name = route.name as string;
    const cfg = menuConfig[name];
    const parentItem = typeof cfg === 'object' ? cfg : undefined;
    const parentHidden = parentItem ? !parentItem.visible : cfg === false;

    if (parentHidden) {
      return {
        ...route,
        meta: { ...route.meta, hideInMenu: true },
        children: route.children
          ? route.children.map((child: RouteRecordRaw) => ({
              ...child,
              meta: { ...child.meta, hideInMenu: true },
            }))
          : route.children,
      } as RouteRecordRaw;
    }

    if (parentItem?.children && route.children) {
      return {
        ...route,
        children: route.children.map((child: RouteRecordRaw) => {
          const childName = child.name as string;
          if (parentItem.children![childName] === false) {
            return {
              ...child,
              meta: { ...child.meta, hideInMenu: true },
            } as RouteRecordRaw;
          }
          return child;
        }),
      } as RouteRecordRaw;
    }

    return route;
  });
}

const dynamicRoutes: RouteRecordRaw[] = applyMenuConfig(rawDynamicRoutes);

/** 外部路由列表，访问这些页面可以不需要Layout，可能用于内嵌在别的系统(不会显示在菜单中) */
// const externalRoutes: RouteRecordRaw[] = mergeRouteModules(externalRouteFiles);
// const staticRoutes: RouteRecordRaw[] = mergeRouteModules(staticRouteFiles);
const staticRoutes: RouteRecordRaw[] = [];
const externalRoutes: RouteRecordRaw[] = [];

/** 路由列表，由基本路由、外部路由和404兜底路由组成
 *  无需走权限验证（会一直显示在菜单中） */
const routes: RouteRecordRaw[] = [
  ...coreRoutes,
  ...externalRoutes,
  fallbackNotFoundRoute,
];

/** 基本路由列表，这些路由不需要进入权限拦截 */
const coreRouteNames = traverseTreeValues(coreRoutes, (route) => route.name);

/** 有权限校验的路由列表，包含动态路由和静态路由 */
const accessRoutes = [...dynamicRoutes, ...staticRoutes];
export { accessRoutes, coreRouteNames, routes };
