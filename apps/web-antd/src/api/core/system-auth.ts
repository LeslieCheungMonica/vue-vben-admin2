import { systemPost } from './system-common';

export interface UserAccessInfo {
  accessCodes: string[];
  managedMenuNames: string[];
  roles: string[];
  visibleMenuNames: string[];
}

/** API-24 当前登录用户的角色 / 可见菜单 / 受管菜单 / 权限码 */
export function getUserAccessApi(): Promise<UserAccessInfo> {
  return systemPost<any>('/system/user_access', {}).then((raw) => ({
    accessCodes: raw?.access_codes ?? [],
    managedMenuNames: raw?.managed_menu_names ?? [],
    roles: raw?.roles ?? [],
    visibleMenuNames: raw?.visible_menu_names ?? [],
  }));
}
