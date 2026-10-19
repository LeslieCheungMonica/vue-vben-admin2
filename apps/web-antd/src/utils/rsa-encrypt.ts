/**
 * RSA 公钥加密工具。
 * 前端通过 /auth/public_key 获取 RSA 公钥后，用 jsencrypt 加密密码字段。
 */
import JSEncrypt from 'jsencrypt';

import { baseRequestClient } from '#/api/request';

let _publicKey: null | string = null;
let _encryptor: JSEncrypt | null = null;

/** 从后端获取 RSA 公钥（同页面生命周期内只请求一次）。 */
export async function fetchPublicKey(): Promise<string> {
  if (_publicKey) {
    return _publicKey;
  }
  const response = await baseRequestClient.get('/auth/public_key');
  const body = response.data;
  // 后端统一响应格式：{ code: 0, data: { pem: "<PEM>" }, message: "" }
  _publicKey = body?.data?.pem ?? '';
  if (!_publicKey) {
    throw new Error('获取 RSA 公钥失败');
  }
  _encryptor = new JSEncrypt();
  _encryptor.setPublicKey(_publicKey);
  return _publicKey;
}

/**
 * 用 RSA 公钥加密明文，返回 base64 密文。
 * 调用前须先通过 fetchPublicKey() 获取公钥。
 */
export function rsaEncrypt(plainText: string): string {
  if (!_encryptor) {
    throw new Error('RSA 公钥尚未获取，请先调用 fetchPublicKey()');
  }
  const encrypted = _encryptor.encrypt(plainText);
  if (!encrypted) {
    throw new Error('RSA 加密失败');
  }
  return encrypted;
}

/** 清除缓存的公钥（用于测试或密钥轮换场景）。 */
export function resetPublicKeyCache() {
  _publicKey = null;
  _encryptor = null;
}
