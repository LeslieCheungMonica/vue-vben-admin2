import type { Router } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { useAccessStore, useUserStore } from '@vben/stores';
import { startProgress, stopProgress } from '@vben/utils';

import { getAuthUserInfo } from '#/api';
import { accessRoutes, coreRouteNames } from '#/router/routes';
import { useAuthStore } from '#/store';
import { getFirstAccessibleMenuPath } from '#/utils/menu-helper';

import { generateAccess } from './access';

/**
 * 通用守卫配置
 * @param router
 */
function setupCommonGuard(router: Router) {
  // 记录已经加载的页面
  const loadedPaths = new Set<string>();

  router.beforeEach((to) => {
    to.meta.loaded = loadedPaths.has(to.path);

    // 页面加载进度条
    if (!to.meta.loaded && preferences.transition.progress) {
      startProgress();
    }
    return true;
  });

  router.afterEach((to) => {
    // 记录页面是否加载,如果已经加载，后续的页面切换动画等效果不在重复执行

    loadedPaths.add(to.path);

    // 关闭页面加载进度条
    if (preferences.transition.progress) {
      stopProgress();
    }
  });
}

/**
 * 权限访问守卫配置
 * @param router
 */
function setupAccessGuard(router: Router) {
  router.beforeEach(async (to, from) => {
    const accessStore = useAccessStore();
    const userStore = useUserStore();
    const authStore = useAuthStore();

    // 基本路由，这些路由不需要进入权限拦截
    if (coreRouteNames.includes(to.name as string)) {
      if (to.path === LOGIN_PATH && accessStore.accessToken) {
        return decodeURIComponent(
          (to.query?.redirect as string) ||
            getFirstAccessibleMenuPath(accessStore.accessMenus) ||
            preferences.app.defaultHomePath,
        );
      }

      // 已登录用户访问内置页面（如个人中心）时，若菜单尚未加载则触发加载，
      // 避免刷新后侧边栏菜单消失
      if (accessStore.accessToken && !accessStore.isAccessChecked) {
        try {
          const userInfo =
            userStore.userInfo || (await authStore.fetchUserInfo());
          const userRoles = userInfo.roles ?? [];
          if (userRoles.length > 0) {
            const payload = await getAuthUserInfo();
            accessStore.setAccessCodes(payload.accessCodes);
          }
          const { accessibleMenus, accessibleRoutes } = await generateAccess({
            roles: userRoles,
            router,
            routes: accessRoutes,
          });
          accessStore.setAccessMenus(accessibleMenus);
          accessStore.setAccessRoutes(accessibleRoutes);
          accessStore.setIsAccessChecked(true);
        } catch (error) {
          console.error('[router] 生成权限路由失败，将重新登录', error);
          accessStore.setIsAccessChecked(false);
          await authStore.logout();
          return false;
        }
      }

      return true;
    }

    // accessToken 检查
    if (!accessStore.accessToken) {
      // 明确声明忽略权限访问权限，则可以访问
      if (to.meta.ignoreAccess) {
        return true;
      }

      // 没有访问权限，跳转登录页面
      if (to.fullPath !== LOGIN_PATH) {
        return {
          path: LOGIN_PATH,
          // 如不需要，直接删除 query
          query:
            to.fullPath === preferences.app.defaultHomePath
              ? {}
              : { redirect: encodeURIComponent(to.fullPath) },
          // 携带当前跳转的页面，登录后重新跳转该页面
          replace: true,
        };
      }
      return to;
    }

    // 是否已经生成过动态路由
    if (accessStore.isAccessChecked) {
      return true;
    }

    // 生成路由表
    // 当前登录用户拥有的角色标识列表
    const userInfo = userStore.userInfo || (await authStore.fetchUserInfo());
    const userRoles = userInfo.roles ?? [];

    // 同步权限码（页面刷新后 accessCodes 走持久化，这里保持一致）
    if (userRoles.length > 0) {
      const payload = await getAuthUserInfo();
      accessStore.setAccessCodes(payload.accessCodes);
    }

    // 生成菜单和路由，任何异常都降级为「重新登录」，避免白屏
    let accessibleMenus;
    let accessibleRoutes;
    try {
      ({ accessibleMenus, accessibleRoutes } = await generateAccess({
        roles: userRoles,
        router,
        // 则会在菜单中显示，但是访问会被重定向到403
        routes: accessRoutes,
      }));
    } catch (error) {
      console.error('[router] 生成权限路由失败，将重新登录', error);
      accessStore.setIsAccessChecked(false);
      await authStore.logout();
      return false;
    }

    // 保存菜单信息和路由信息
    accessStore.setAccessMenus(accessibleMenus);
    accessStore.setAccessRoutes(accessibleRoutes);
    accessStore.setIsAccessChecked(true);
    const firstMenuPath = getFirstAccessibleMenuPath(accessStore.accessMenus);
    const redirectPath = (from.query.redirect ??
      (to.path === preferences.app.defaultHomePath
        ? firstMenuPath || preferences.app.defaultHomePath
        : to.fullPath)) as string;

    return {
      ...router.resolve(decodeURIComponent(redirectPath)),
      replace: true,
    };
  });
}

/**
 * 项目守卫配置
 * @param router
 */
function createRouterGuard(router: Router) {
  /** 通用 */
  setupCommonGuard(router);
  /** 权限访问 */
  setupAccessGuard(router);
}

export { createRouterGuard };
