import type { RouteRecordRaw } from 'vue-router';

/**
 * Profile 已移入 coreRoutes（Root 子路由），
 * 因为 backend 模式下 modules 路由会被后端接口替换，
 * 而个人中心是内置功能页，不走后端菜单管理。
 */
const routes: RouteRecordRaw[] = [];

export default routes;
