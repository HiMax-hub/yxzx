import { CallRecord } from '../types';

/**
 * 电销合规风控工具
 * 行业监管要求：外呼时段限制、呼叫频次限制、违规敏感词检测
 */

// 勿扰时段：21:00 - 次日 9:00 禁止外呼（监管红线 + 客户体验）
export const DO_NOT_DISTURB_START_HOUR = 21;
export const DO_NOT_DISTURB_END_HOUR = 9;

export function isInDoNotDisturbTime(now: Date = new Date()): boolean {
  const hour = now.getHours();
  if (hour >= DO_NOT_DISTURB_START_HOUR || hour < DO_NOT_DISTURB_END_HOUR) {
    return true;
  }
  return false;
}

export function getDoNotDisturbMessage(now: Date = new Date()): string {
  return `当前 ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')} 处于行业勿扰时段（${DO_NOT_DISTURB_START_HOUR}:00 - 次日${DO_NOT_DISTURB_END_HOUR}:00），禁止外呼。已自动转入【明日回拨计划】。`;
}

// 同一号码单日外呼上限（防骚扰合规）
export const DAILY_CALL_LIMIT_PER_PHONE = 3;

export function getTodayCallCount(callRecords: CallRecord[], phone: string): number {
  const today = new Date().toLocaleDateString('en-CA');
  return callRecords.filter(
    (r) => r.customerPhone === phone && r.calledAt.slice(0, 10) === today
  ).length;
}

export function isCallLimitExceeded(callRecords: CallRecord[], phone: string): boolean {
  return getTodayCallCount(callRecords, phone) >= DAILY_CALL_LIMIT_PER_PHONE;
}

// 违规敏感词库（监管明令禁止的承诺性/诱导性话术）
export const VIOLATION_KEYWORDS: { word: string; level: 'red' | 'yellow'; reason: string }[] = [
  { word: '保证批贷', level: 'red', reason: '承诺性话术，监管明令禁止（《个人贷款管理暂行办法》及广告法红线）' },
  { word: '100%下款', level: 'red', reason: '绝对化承诺用语，属虚假宣传' },
  { word: '包过', level: 'red', reason: '承诺性话术，禁止使用' },
  { word: '绝对能批', level: 'red', reason: '绝对化承诺用语' },
  { word: '无需征信', level: 'red', reason: '误导性宣传（任何正规贷款均查征信）' },
  { word: '无视黑白户', level: 'red', reason: '诱导高危客群，监管红线' },
  { word: '稳批', level: 'yellow', reason: '承诺性倾向用语，需谨慎' },
  { word: '内部渠道', level: 'yellow', reason: '暗示特殊渠道，易引发合规质疑' },
  { word: '特批', level: 'yellow', reason: '暗示内部特批通道，谨慎使用' },
  { word: '降息', level: 'yellow', reason: '需以银行当期利率为准，避免误导' },
];

export interface ViolationHit {
  word: string;
  level: 'red' | 'yellow';
  reason: string;
}

// 检测文本中的违规敏感词，返回命中列表（去重）
export function detectViolationKeywords(text: string): ViolationHit[] {
  if (!text) return [];
  const hits: ViolationHit[] = [];
  const seen = new Set<string>();
  for (const item of VIOLATION_KEYWORDS) {
    if (text.includes(item.word) && !seen.has(item.word)) {
      seen.add(item.word);
      hits.push({ word: item.word, level: item.level, reason: item.reason });
    }
  }
  return hits;
}
