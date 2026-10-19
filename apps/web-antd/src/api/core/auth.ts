import type { UserInfo } from '@vben/types';

import { fetchPublicKey, resetPublicKeyCache, rsaEncrypt } from '#/utils/rsa-encrypt';

import { systemPost } from './system-common';

export namespace AuthApi {
  /** 登录接口参数 */
  export interface LoginParams {
    password?: string;
    username?: string;
  }

  /** 登录接口返回值 */
  export interface LoginResult {
    accessToken: string;
  }

  export interface RefreshTokenResult {
    data: string;
    status: number;
  }
}

/** /auth/user_info 的聚合结果：用户信息 + 权限码 + 菜单可见性数据 */
export interface AuthUserInfoPayload {
  accessCodes: string[];
  managedMenuNames: string[];
  userInfo: UserInfo;
  visibleMenuNames: string[];
}

// 同一次登录会话内复用一次 /auth/user_info 请求（登录时 fetchUserInfo 与
// getAccessCodesApi 会并行调用，避免重复请求）
let userInfoPromise: null | Promise<AuthUserInfoPayload> = null;

async function requestUserInfo(): Promise<AuthUserInfoPayload> {
  const raw = await systemPost<any>('/auth/user_info', {});
  const info = raw?.user_info ?? {};
  return {
    accessCodes: raw?.access_codes ?? [],
    managedMenuNames: raw?.managed_menu_names ?? [],
    visibleMenuNames: raw?.visible_menu_names ?? [],
    userInfo: {
      avatar: '',
      desc: '',
      realName: info.real_name || info.username || '',
      roles: info.roles ?? [],
      token: '',
      userId: String(info.user_id ?? ''),
      username: info.username ?? '',
    },
  };
}

export function getAuthUserInfo(): Promise<AuthUserInfoPayload> {
  if (!userInfoPromise) {
    userInfoPromise = requestUserInfo().catch((error) => {
      userInfoPromise = null;
      throw error;
    });
  }
  return userInfoPromise;
}

export function resetAuthUserInfoCache() {
  userInfoPromise = null;
}

/**
 * 登录
 */
export async function loginApi(
  data: AuthApi.LoginParams,
): Promise<AuthApi.LoginResult> {
  // 获取 RSA 公钥并加密密码
  await fetchPublicKey();
  const encryptedPassword = rsaEncrypt(data.password ?? '');

  const raw = await systemPost<any>('/auth/login', {
    password: encryptedPassword,
    username: data.username ?? '',
  });
  // 换账号后必须丢弃上一个账号的用户信息/菜单缓存
  resetAuthUserInfoCache();
  return { accessToken: raw?.access_token ?? '' };
}

/**
 * 刷新 accessToken（refresh_token 走 HttpOnly Cookie，无需前端传参）
 */
export async function refreshTokenApi(): Promise<AuthApi.RefreshTokenResult> {
  const raw = await systemPost<any>('/auth/refresh', {});
  return { data: raw?.data ?? '', status: 0 };
}

/**
 * 退出登录
 */
export async function logoutApi() {
  resetAuthUserInfoCache();
  await systemPost('/auth/logout', {});
  return { data: null };
}

/**
 * 获取当前用户权限码
 */
export async function getAccessCodesApi(): Promise<string[]> {
  const payload = await getAuthUserInfo();
  return payload.accessCodes;
}
