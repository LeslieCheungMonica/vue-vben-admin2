import { MOCK_CODES, MOCK_USERS } from '#/config/mock-data';

const MOCK_USERNAME_KEY = 'mock_current_username';

// 当前登录用户名（用于 mock 模式下获取用户信息和权限码），持久化到 localStorage
let _currentUsername = localStorage.getItem(MOCK_USERNAME_KEY) ?? '';

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

/**
 * 登录（mock 模式，直接从 mock-data 读取数据）
 */
export async function loginApi(data: AuthApi.LoginParams) {
  const { password, username } = data;
  if (!password || !username) {
    throw new Error('Username and password are required');
  }
  const findUser = MOCK_USERS.find(
    (item) => item.username === username && item.password === password,
  );
  if (!findUser) {
    throw new Error('Username or password is incorrect.');
  }
  _currentUsername = findUser.username;
  localStorage.setItem(MOCK_USERNAME_KEY, _currentUsername);
  return {
    ...findUser,
    accessToken: `mock-access-token-${findUser.username}`,
  };
}

/**
 * 刷新accessToken（mock 模式）
 */
export async function refreshTokenApi() {
  return {
    data: `mock-access-token-${_currentUsername}`,
    status: 0,
  };
}

/**
 * 退出登录（mock 模式）
 */
export async function logoutApi() {
  _currentUsername = '';
  localStorage.removeItem(MOCK_USERNAME_KEY);
  return { data: null };
}

/** 获取当前登录用户名（供 mock 模式下其他接口使用） */
export function getCurrentUsername() {
  return _currentUsername;
}

/**
 * 获取用户权限码（mock 模式，直接从 mock-data 读取数据）
 */
export async function getAccessCodesApi() {
  const codes =
    MOCK_CODES.find((item) => item.username === _currentUsername)?.codes ?? [];
  return codes;
}
