import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

/**
 * 系统管理（用户 / 角色 / 菜单）。
 *
 * 说明（与需求 D-03 的偏差，已在交付说明中记录）：
 * - 这里 **不** 使用 `meta.authority` + `meta.menuVisibleWithForbidden`：
 *   vben 的 `generateRoutesByFrontend` 会对带 `menuVisibleWithForbidden` 的路由
 *   **无条件** 把 component 替换成 403 页面（不看当前用户是否有权限），
 *   会导致超管自己点进用户管理也看到 403；
 * - 也不使用 `meta.authority`：一旦角色不匹配，路由会被 filterTree 直接删除，
 *   手输 URL 落到 404 兜底页，而需求（TC-M4-05）要求跳 403；
 * - 因此可见性与 403 兜底统一由 `router/access.ts` 依据后端 RBAC 聚合结果
 *   （`visible_menu_names` / `managed_menu_names`）改写路由树：
 *   未授权节点 `hideInMenu=true` + component 替换为 403（路由保留，不删除）。
 *
 * 菜单 name 必须与后端 sys_menu 种子一致（System / SystemUser / SystemRole /
 * SystemMenu），RBAC 过滤按 name 匹配；置顶菜单的 order 取自 meta.order。
 */
const routes: RouteRecordRaw[] = [
  {
    name: 'System',
    path: '/system',
    redirect: '/system/user',
    meta: {
      icon: 'lucide:settings',
      order: 10,
      title: $t('page.system.title'),
    },
    children: [
      {
        name: 'SystemUser',
        path: '/system/user',
        component: () => import('#/views/system/user/index.vue'),
        meta: {
          icon: 'lucide:users',
          title: $t('page.system.user'),
        },
      },
      {
        name: 'SystemRole',
        path: '/system/role',
        component: () => import('#/views/system/role/index.vue'),
        meta: {
          icon: 'lucide:shield-check',
          title: $t('page.system.role'),
        },
      },
      {
        name: 'SystemMenu',
        path: '/system/menu',
        component: () => import('#/views/system/menu/index.vue'),
        meta: {
          icon: 'lucide:list-tree',
          title: $t('page.system.menu'),
        },
      },
    ],
  },
];

export default routes;
