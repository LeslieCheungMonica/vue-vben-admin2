import type { MenuRecordRaw } from '@vben/types';

/**
 * 从可访问菜单树中获取第一个叶子菜单的路径。
 * 递归向下查找，直到找到没有 children 的菜单项。
 */
export function getFirstAccessibleMenuPath(
  menus: MenuRecordRaw[],
): string | undefined {
  for (const menu of menus) {
    if (menu.children?.length) {
      const childPath = getFirstAccessibleMenuPath(menu.children);
      if (childPath) return childPath;
    } else {
      return menu.path;
    }
  }
  return undefined;
}
