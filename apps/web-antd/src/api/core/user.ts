import type { UserInfo } from '@vben/types';

import { getAuthUserInfo } from './auth';

/**
 * 获取用户信息（真实后端：POST /auth/user_info）
 */
export async function getUserInfoApi(): Promise<UserInfo> {
  const payload = await getAuthUserInfo();
  return payload.userInfo;
}
