import { LoanCase, Customer } from '../types';

export interface CaseOverdueInfo {
  isOverdue: boolean;
  stageKey: 'initial_review' | 'supplementary_needed' | 'normal';
  stageLabel: string;
  elapsedHours: number;
  overdueHours: number; // 超过24小时的部分
  urgencyLevel: 'critical' | 'warning' | 'normal';
  stagnationReason: string;
  badgeText: string;
  badgeClass: string;
  cardHighlightClass: string;
}

export interface ExpediteTemplateOption {
  id: 'to_lender' | 'to_borrower' | 'to_internal';
  title: string;
  targetRoleName: string;
  targetPerson: string;
  targetContact: string;
  channel: 'wechat' | 'sms' | 'system';
  subject: string;
  content: string;
  urgencyTip: string;
  defaultActionLabel: string;
}

// 审批超时判定使用系统实时时间（正式版：不再使用演示基准时间）
const BASELINE_TIMESTAMP = Date.now();

/**
 * 计算进件工单在‘初审’或‘待补件’阶段的停滞时长与超时状态
 */
export function getCaseOverdueInfo(loanCase: LoanCase): CaseOverdueInfo {
  // 仅在‘初审’ (submission / pre_screen) 或 ‘待补件’ (docs_collection) 阶段生效
  const isInitialReview = loanCase.stage === 'submission' || loanCase.stage === 'pre_screen';
  const isSupplementary = loanCase.stage === 'docs_collection';

  if (!isInitialReview && !isSupplementary) {
    return {
      isOverdue: false,
      stageKey: 'normal',
      stageLabel: '正常推进',
      elapsedHours: 0,
      overdueHours: 0,
      urgencyLevel: 'normal',
      stagnationReason: '',
      badgeText: '',
      badgeClass: '',
      cardHighlightClass: '',
    };
  }

  // 获取最后更新时间 (优先取 timeline 最新时间戳，否则取 submittedAt)
  let lastActivityTime = BASELINE_TIMESTAMP;
  if (loanCase.timeline && loanCase.timeline.length > 0) {
    const latestItem = loanCase.timeline[loanCase.timeline.length - 1];
    if (latestItem.timestamp) {
      const parsed = new Date(latestItem.timestamp.replace(' ', 'T')).getTime();
      if (!isNaN(parsed)) {
        lastActivityTime = parsed;
      }
    }
  } else if (loanCase.submittedAt) {
    const parsed = new Date(loanCase.submittedAt.replace(' ', 'T')).getTime();
    if (!isNaN(parsed)) {
      lastActivityTime = parsed;
    }
  }

  const now = Math.max(BASELINE_TIMESTAMP, Date.now());
  const diffMs = Math.max(0, now - lastActivityTime);
  const elapsedHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
  const isOverdue = elapsedHours >= 24;
  const overdueHours = Math.max(0, Math.round((elapsedHours - 24) * 10) / 10);

  const stageKey = isInitialReview ? 'initial_review' : 'supplementary_needed';
  const stageLabel = isInitialReview ? '待初审' : '待补件';
  const urgencyLevel: 'critical' | 'warning' | 'normal' = !isOverdue 
    ? 'normal' 
    : elapsedHours >= 36 
      ? 'critical' 
      : 'warning';

  let stagnationReason = loanCase.subStageStatus || '';
  if (!stagnationReason) {
    stagnationReason = isInitialReview
      ? '报审资方信贷系统后超24小时无初审反馈，需催办资方客户经理推进审核'
      : '已下发补件清单超24小时未见补充材料递交，需催促借款人尽快补齐原件';
  }

  const badgeText = isOverdue
    ? urgencyLevel === 'critical'
      ? `🚨 ${stageLabel}停滞 ${elapsedHours}h (超标${overdueHours}h)`
      : `⚠️ ${stageLabel}停滞 ${elapsedHours}h`
    : `⏱️ 处理中 (${elapsedHours}h)`;

  const badgeClass = isOverdue
    ? urgencyLevel === 'critical'
      ? 'bg-rose-50 text-rose-700 border-rose-300 ring-1 ring-rose-300/50'
      : 'bg-amber-50 text-amber-700 border-amber-300 ring-1 ring-amber-300/40'
    : 'bg-blue-50 text-blue-700 border-blue-200';

  const cardHighlightClass = isOverdue
    ? urgencyLevel === 'critical'
      ? 'border-rose-300 bg-rose-50/20 shadow-xs ring-1 ring-rose-400/30'
      : 'border-amber-300 bg-amber-50/20 shadow-xs ring-1 ring-amber-400/30'
    : '';

  return {
    isOverdue,
    stageKey,
    stageLabel,
    elapsedHours,
    overdueHours,
    urgencyLevel,
    stagnationReason,
    badgeText,
    badgeClass,
    cardHighlightClass,
  };
}

/**
 * 自动生成‘一键催办’针对不同对象（资方审批人、借款人、内部督办）的定制化消息模板
 */
export function generateExpediteTemplates(
  loanCase: LoanCase,
  customer?: Customer,
  overdueInfo?: CaseOverdueInfo
): ExpediteTemplateOption[] {
  const info = overdueInfo || getCaseOverdueInfo(loanCase);
  const custName = loanCase.customerName || customer?.name || '客户';
  const caseId = loanCase.caseNumber || loanCase.id;
  const appliedAmount = loanCase.appliedAmount || loanCase.applyAmount || 100;
  const bankName = loanCase.lenderBank || loanCase.lenderInstitution || '合作银行';
  const managerName = loanCase.lenderManagerName || '经办客户经理';
  const managerPhone = loanCase.lenderManagerPhone || '138-xxxx-xxxx';
  const custPhone = loanCase.customerPhone || customer?.phone || '138-xxxx-xxxx';
  const productName = loanCase.productName || '助贷产品';
  const elapsed = info.elapsedHours || 28;

  // 1. 催资方 / 银行风控经理 (针对初审超时)
  const toLenderTemplate: ExpediteTemplateOption = {
    id: 'to_lender',
    title: '催资方审批人 (加急初审)',
    targetRoleName: '报审机构经办',
    targetPerson: `${bankName} · ${managerName}`,
    targetContact: managerPhone,
    channel: 'wechat',
    subject: `【工单初审催办】${custName} - ${productName} (¥${appliedAmount}万)`,
    content: `【工单加急初审申请】\n${managerName}您好！关于我司报审的借款人【${custName}】${productName}（工单审批号：${caseId}，申报金额：¥${appliedAmount}万元），目前于【初审报审】节点已停留超 ${elapsed} 小时无进度更新。\n\n客户征信优质、企业开票流水充足且资金周转需求迫切。恳请您协助跟进总行/分行初审通道，优先推进资质核准与批复出函！如有需沟通或补录信息请随时联系我，十分感谢您的鼎力支持！🙏`,
    urgencyTip: '适用于初审报审超过 24h 资方无反馈，以客观资质优势与合规诉求促进资方客户经理优先提单。',
    defaultActionLabel: '复制资方微信催办函',
  };

  // 2. 催借款客户 (针对待补件超时)
  const toBorrowerTemplate: ExpediteTemplateOption = {
    id: 'to_borrower',
    title: '催借款人补件 (避免工单失效)',
    targetRoleName: '借款人 / 客户',
    targetPerson: custName,
    targetContact: custPhone,
    channel: 'sms',
    subject: `【重要补件提醒】您的 ${productName} ¥${appliedAmount}万 审批进度更新`,
    content: `【${bankName}普惠金融·加急补件提醒】\n${custName}您好！您的【${productName}】（申请额度：¥${appliedAmount}万元，工单号：${caseId}）已进入总行审批绿色通道。为确保您本批次特批优惠利率（年化${loanCase.interestRate || '3.X'}%）及预授信额度有效，请您于今日尽快补充提供：\n【${loanCase.subStageStatus || '近6个月对公银行流水及不动产权属原件'}】。\n如超期未补，系统将自动关闭绿色通道。资料电子版可通过微信或本系统直接回传，咨询热线：${loanCase.consultantName || '专属顾问'}。`,
    urgencyTip: '适用于待补件阶段超 24h 未交材料，强调利率优惠与额度有效期，增强客户紧迫感。',
    defaultActionLabel: '复制客户催交通知短信',
  };

  // 3. 内部协同督办纪要 (发风控主管/部门协同群)
  const toInternalTemplate: ExpediteTemplateOption = {
    id: 'to_internal',
    title: '内部协同督办 (风控主管/团队群)',
    targetRoleName: '风控部门 / 督办专员',
    targetPerson: '风控评审组 / 业务主管',
    targetContact: '内部钉钉/企微协同群',
    channel: 'system',
    subject: `【审批超时风险督办】工单 ${caseId} 在【${info.stageLabel}】节点已停滞 ${elapsed}h`,
    content: `【进件审批超时督办通知】\n• 工单单号：${caseId}\n• 借款客户：${custName}（${customer?.grade || 'A'}级）\n• 申报产品：${bankName} - ${productName}\n• 申请金额：¥${appliedAmount}万元\n• 当前节点：${info.stageLabel}（已停滞 ${elapsed} 小时，超标 ${info.overdueHours}h）\n• 停滞原因：${info.stagnationReason}\n• 经办顾问：${loanCase.consultantName || '业务顾问'}\n• 对接资方经理：${managerName} (${managerPhone})\n\n请风控主管与业务线负责人介入协同督办，确保在今日下班前完成初审批复或完成补件闭环。`,
    urgencyTip: '适用于案件严重超时（>36h），同步内部风控主管协助打通银行分行审批绿色通道。',
    defaultActionLabel: '复制内部督办纪要',
  };

  return [toLenderTemplate, toBorrowerTemplate, toInternalTemplate];
}
