import type { UserInfo } from '@vben/types';

import { getCurrentUsername } from './auth';
import { MOCK_USERS } from '#/config/mock-data';

/**
 * 获取用户信息（mock 模式，直接从 mock-data 读取数据）
 */
export async function getUserInfoApi(): Promise<UserInfo> {
  const username = getCurrentUsername();
  const user = MOCK_USERS.find((item) => item.username === username);
  if (!user) {
    throw new Error('User not found');
  }
  return {
    avatar: '',
    desc: '',
    homePath: user.homePath ?? '',
    userId: String(user.id),
    realName: user.realName,
    roles: user.roles,
    token: `mock-access-token-${user.username}`,
    username: user.username,
  };
}
