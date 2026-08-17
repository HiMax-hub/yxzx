import { IntentTag, CustomerGrade } from '../types';

export interface IntentTagOption {
  id: IntentTag;
  label: string;
  emoji: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  border: string;
  targetGrade: CustomerGrade;
  suggestedUrgency: '急需(3天内)' | '正常(1-2周)' | '储备对比(1月内)';
  suggestedNextTime: string;
  poolDaysBonus: number; // 增加/减少公海保护期天数
  defaultTemplate: string;
  automationSummary: string;
}

export const INTENT_TAG_CONFIGS: Record<IntentTag, IntentTagOption> = {
  high_intent: {
    id: 'high_intent',
    label: '高意向',
    emoji: '🔥',
    color: 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100',
    badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
    badgeText: '高意向 (S/A级优先)',
    border: 'border-rose-400',
    targetGrade: 'S',
    suggestedUrgency: '急需(3天内)',
    suggestedNextTime: '明日 10:00 (预约面签/下户)',
    poolDaysBonus: 30, // 延长公海保护至30天
    defaultTemplate: '【高意向客户】沟通达成：客户贷款意向极高，认可当前融资利率与抵押方案，已约定携带身份证、房本原件前往网点进行下户面签，优先提级跟进。',
    automationSummary: '自动化规则触发 ⚡: 客户意向评级升为【S级】· 跟进优先级调至【最高(3天内)】· 自动延长公海流转保护至 30 天',
  },
  need_callback: {
    id: 'need_callback',
    label: '需回访',
    emoji: '📅',
    color: 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100',
    badgeBg: 'bg-blue-100 text-blue-800 border-blue-300',
    badgeText: '需回访 (A/B级跟进)',
    border: 'border-blue-400',
    targetGrade: 'A',
    suggestedUrgency: '正常(1-2周)',
    suggestedNextTime: '下周一 14:30 (复核材料/再次沟通)',
    poolDaysBonus: 15, // 保护期重置为15天
    defaultTemplate: '【需回访跟进】沟通达成：客户正在对比各行利息与还款方式，对方案有一定兴趣，已发送产品比对表，约定近期再次致电沟通方案细节。',
    automationSummary: '自动化规则触发 ⚡: 客户意向评级升为【A级】· 跟进优先级设为【正常(1-2周)】· 自动安排待办提醒 & 保护期重置为 15 天',
  },
  no_need: {
    id: 'no_need',
    label: '暂无需求',
    emoji: '⏸️',
    color: 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
    badgeText: '暂无需求 (C级沉淀)',
    border: 'border-amber-400',
    targetGrade: 'C',
    suggestedUrgency: '储备对比(1月内)',
    suggestedNextTime: '1个月后 (定期关怀/新品推送)',
    poolDaysBonus: 5, // 缩短保护期，准备沉淀
    defaultTemplate: '【暂无近期需求】沟通反馈：客户目前资金流尚属充裕，短期暂无大额融资需求，已加微信建立长期联系，后续有新低息政策时定期推送。',
    automationSummary: '自动化规则触发 ⚡: 客户意向评级降为【C级】· 跟进优先级降至【低频(1月内)】· 保护期缩短至 5 天以加速资源流动',
  },
  invalid_number: {
    id: 'invalid_number',
    label: '无效号码',
    emoji: '🚫',
    color: 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200',
    badgeBg: 'bg-slate-200 text-slate-800 border-slate-300',
    badgeText: '无效/空号/拒接 (D级)',
    border: 'border-slate-400',
    targetGrade: 'D',
    suggestedUrgency: '储备对比(1月内)',
    suggestedNextTime: '暂停外呼 (进入无效名单)',
    poolDaysBonus: 0, // 0天保护期，建议直接释放或淘汰
    defaultTemplate: '【无效电话/停机拒接】沟通反馈：外呼提示空号/停机/秒挂或非本人，已连续呼叫无应答，标记为无效号码并降低档案权重。',
    automationSummary: '自动化规则触发 ⚡: 客户意向评级直接降为【D级】· 优先级降至最低 · 保护期归零并建议释放至公海沉睡池',
  },
};

export const INTENT_TAG_LIST: IntentTagOption[] = Object.values(INTENT_TAG_CONFIGS);
