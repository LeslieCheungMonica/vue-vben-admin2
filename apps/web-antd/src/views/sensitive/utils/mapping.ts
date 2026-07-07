/** 敏感类型英文 → 中文映射 */
export const sensitiveTypeMap: Record<string, string> = {
  ID_CARD: '身份证号',
  PHONE: '手机号码',
  BANK_CARD: '银行卡号',
  NAME: '姓名',
  ADDRESS: '地址',
  EMAIL: '邮箱',
  IP: 'IP地址',
  MIXED: '综合',
  PASSWORD: '密码',
};

/** 风险等级英文 → 中文映射 */
export const riskLevelMap: Record<string, string> = {
  CRITICAL: '严重',
  HIGH: '高危',
  MEDIUM: '中危',
  LOW: '低危',
};

/** 风险等级对应的颜色 */
export const riskLevelColorMap: Record<string, string> = {
  CRITICAL: 'red',
  HIGH: 'orange',
  MEDIUM: 'blue',
  LOW: 'green',
};

/** 获取敏感类型中文名 */
export function getSensitiveTypeName(type: string): string {
  return sensitiveTypeMap[type] || type;
}

/** 获取风险等级中文名 */
export function getRiskLevelName(level: string): string {
  return riskLevelMap[level] || level;
}

/** 获取风险等级颜色 */
export function getRiskLevelColor(level: string): string {
  return riskLevelColorMap[level] || 'blue';
}
