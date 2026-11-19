import type { Router, RouteRecordRaw } from 'vue-router';

import type {
  ComponentRecordType,
  GenerateMenuAndRoutesOptions,
  RouteRecordStringComponent,
} from '@vben-core/typings';

import { mapTree } from '@vben-core/shared/utils';

type RouteComponentMap = Record<string, RouteRecordRaw['component']>;

/**
 * 判断路由是否在菜单中显示但访问时展示 403（让用户知悉功能并申请权限）
 */
function menuHasVisibleWithForbidden(route: RouteRecordRaw): boolean {
  return !!route.meta?.menuVisibleWithForbidden;
}

/**
 * 动态生成路由 - 后端方式
 * 对 meta.menuVisibleWithForbidden 为 true 的项直接替换为 403 组件，让用户知悉功能并申请权限。
 */
async function generateRoutesByBackend(
  options: GenerateMenuAndRoutesOptions,
): Promise<RouteRecordRaw[]> {
  const {
    fetchMenuListAsync,
    pageMap = {},
    forbiddenComponent,
  } = options;

  try {
    const menuRoutes = await fetchMenuListAsync?.();
    if (!menuRoutes) {
      return [];
    }

    const normalizePageMap: ComponentRecordType = {};

    for (const [key, value] of Object.entries(pageMap)) {
      normalizePageMap[normalizeViewPath(key)] = value;
    }

    const routeComponentMap = buildRouteComponentMap(
      options.routes,
      options.router,
    );
    let routes = convertRoutes(menuRoutes, normalizePageMap, routeComponentMap);

    if (forbiddenComponent) {
      routes = mapTree(routes, (route) => {
        if (menuHasVisibleWithForbidden(route)) {
          route.component = forbiddenComponent;
        }
        return route;
      });
    }

    return routes;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

function convertRoutes(
  routes: RouteRecordStringComponent[],
  pageMap: ComponentRecordType,
  routeComponentMap: RouteComponentMap,
): RouteRecordRaw[] {
  return convertRouteNodes(routes, '', pageMap, routeComponentMap);
}

function convertRouteNodes(
  nodes: RouteRecordStringComponent[],
  parentPath: string,
  pageMap: ComponentRecordType,
  routeComponentMap: RouteComponentMap,
): RouteRecordRaw[] {
  return nodes.map((node) => {
    const route = node as unknown as RouteRecordRaw;
    const { name } = node;
    const fullPath = resolveRoutePath(parentPath, node.path);

    if (!name) {
      console.error('route name is required', route);
    }

    const children = node.children?.length
      ? convertRouteNodes(node.children, fullPath, pageMap, routeComponentMap)
      : [];

    if (children.length > 0) {
      // 目录节点只负责分组，不挂载布局或页面组件。
      route.children = children;
      delete route.component;
    } else {
      const component = routeComponentMap[fullPath];
      if (component) {
        route.component = component;
      } else {
        console.error(`route component is invalid: ${fullPath}`, route);
        route.component = pageMap['/_core/fallback/not-found.vue'];
      }
    }

    return route;
  });
}

/**
 * 将前端静态路由拍平成「完整 URL -> 组件」映射，供后端菜单按 path 取组件。
 */
function buildRouteComponentMap(
  routes: RouteRecordRaw[],
  router: Router,
): RouteComponentMap {
  const componentMap: RouteComponentMap = {};

  const walk = (nodes: RouteRecordRaw[], parentPath: string) => {
    for (const node of nodes) {
      const fullPath = resolveRoutePath(parentPath, node.path);
      if (node.component) {
        componentMap[fullPath] = node.component;
      }
      if (node.children?.length) {
        walk(node.children, fullPath);
      }
    }
  };

  walk(routes, '');

  // 核心路由（如 /profile）已在 router 实例里，不在 accessRoutes 中，补进映射。
  for (const route of router.getRoutes()) {
    const component = route.components?.default;
    const path = normalizeRoutePath(route.path);
    if (component && !componentMap[path]) {
      componentMap[path] = component;
    }
  }

  return componentMap;
}

function resolveRoutePath(parentPath: string, path: string): string {
  const resolved = path.startsWith('/') ? path : `${parentPath}/${path}`;
  return normalizeRoutePath(resolved);
}

function normalizeRoutePath(path: string): string {
  const normalized = `/${path}`.replaceAll(/\/{2,}/g, '/');
  return normalized.length > 1
    ? normalized.replaceAll(/\/+$/g, '')
    : normalized;
}

function normalizeViewPath(path: string): string {
  // 去除相对路径前缀
  const normalizedPath = path.replace(/^(\.\/|\.\.\/)+/, '');

  // 确保路径以 '/' 开头
  const viewPath = normalizedPath.startsWith('/')
    ? normalizedPath
    : `/${normalizedPath}`;

  // 这里耦合了vben-admin的目录结构
  return viewPath.replace(/^\/views/, '');
}
export { generateRoutesByBackend };
