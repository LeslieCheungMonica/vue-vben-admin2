import type { BasicUserInfo } from '@vben-core/typings';

/** 用户信息 */
interface UserInfo extends BasicUserInfo {
  /**
   * 用户描述
   */
  desc: string;

  /**
   * accessToken
   */
  token: string;
}

export type { UserInfo };
