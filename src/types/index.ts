export type CustomerGrade = 'S' | 'A' | 'B' | 'C' | 'D';
export type IntentTag = 'high_intent' | 'no_need' | 'need_callback' | 'invalid_number';

// 外呼结果标签（电销标准动作：接通/未接通原因分级）
export type CallOutcome = 'connected' | 'no_answer' | 'rejected' | 'busy' | 'invalid_number' | 'callback_request';

// 外呼记录（电销产能统计与回拨管理的唯一数据源）
export interface CallRecord {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  consultantId?: string;
  consultantName: string;
  calledAt: string; // 通话发起时间
  outcome: CallOutcome; // 结果标签
  durationSeconds: number; // 通话时长（接通才计时）
  note?: string; // 通话小结
  intentTag?: IntentTag; // 接通后的意向标签
  callbackScheduledAt?: string; // 未接通自动生成的回拨计划时间
  callbackCompleted?: boolean; // 回拨是否已完成
}
export type MainSubjectType = 'salary' | 'business' | 'merchant' | 'mortgage';
export type LoanPurpose = 'business_flow' | 'equipment_purchase' | 'personal_consumption' | 'home_renovation' | 'debt_consolidation' | 'other';
export type ChannelSource = 'landing_page' | 'referral' | 'self_developed' | 'channel_agent' | 'telemarketing';
export type DealStage = 'pre_screen' | 'docs_collection' | 'submission' | 'interview_visit' | 'approval' | 'disbursement' | 'post_loan';
export type RepaymentType = 'interest_first' | 'equal_principal_interest' | 'equal_principal' | 'balloon';
export type UserRole = 'super_admin' | 'admin' | 'consultant' | 'risk_manager' | 'finance_admin';

export interface UserAccount {
  id: string;
  username: string;
  /** @deprecated 明文密码仅用于向后兼容；正式存储一律使用 passwordHash（PBKDF2+盐值），明文会被迁移后清除 */
  password?: string;
  /** 密码哈希存储（PBKDF2-HMAC-SHA256 + 随机盐），格式见 passwordSecurity.ts */
  passwordHash?: string;
  name: string;
  role: UserRole;
  roleTitle: string;
  department: string;
  phone: string;
  avatar?: string;
  status: 'active' | 'disabled';
  mustChangePassword?: boolean; // 首次登录强制修改默认密码（正式版安全策略）
  createdAt: string;
  monthlyTargetWan?: number;
}

export interface BankProductPolicy {
  bankName: string;
  category: string;
  baseRateRange: string; // 利率基准区间，如 "3.45% - 4.35%"
  maxAmount: number; // 额度上限（万元）
  admissionRule: string; // 准入规则简述
  status: 'active' | 'paused';
}

// 跟进话术 / 客户异议模板（系统设置-常用话术模板管理维护）
export interface FollowUpScriptTemplate {
  id: string;
  category: string; // 类别：objection(客户异议)/phone(电话沟通)/materials(资料催收)/general(通用维护)/appointment(面签邀约) 等，可扩展
  categoryLabel?: string;
  title: string;
  content: string;
  enabled?: boolean;
}

export interface SystemConfig {
  companyName: string;
  monthlyTeamTargetWan?: number; // 团队月度放款目标额度（万元，默认5000万）
  publicPoolAutoReturnDays: number;
  dataMaskingDefault: boolean;
  commissionTiers: {
    minWan: number;
    maxWan: number;
    rate: number;
    tierName: string;
  }[];
  bankProductPolicies?: BankProductPolicy[]; // 银行产品准入配置（管理员手动维护）
  // ===== 评估与成数参数（超级管理员可配置，缺省走行业默认值）=====
  ltvConfig?: {
    residential: number; // 普通住宅成数，如 0.70
    commercial: number; // 商办/厂房成数，如 0.50
    villa: number; // 别墅成数，如 0.55
  };
  // ===== 征信红线阈值（风控引擎可配置）=====
  creditRedlines?: {
    query2MonthWarn: number; // 近2月查询预警阈值（默认4）
    query2MonthHigh: number; // 近2月查询高警戒阈值（默认6）
    creditCardUtilizationWarn: number; // 信用卡使用率警戒 %（默认80）
    microLoanCountWarn: number; // 网贷/小贷笔数预警（默认4）
    providentFundBonusMin: number; // 公积金月缴加分下限（元，默认1500）
  };
  // ===== 公海规则细化 =====
  poolRules?: {
    gradeReturnDays: { grade: CustomerGrade; days: number }[]; // S/A/B/C/D 分级回收天数
    claimCooldownHours: number; // 抢单冷却（小时）
    maxClaimPerDay: number; // 每人每日认领上限（户）
    sGradeProtectionDays: number; // S级高意向保护期（天）
  };
  // ===== 账号安全策略 =====
  securityPolicy?: {
    minPasswordLength: number; // 密码最小长度（默认6）
    requireComplexity: boolean; // 是否要求含字母+数字
    maxLoginFailures: number; // 连续登录失败锁定次数（0=不锁定）
    sessionTimeoutMinutes: number; // 会话超时（分钟，0=不超时）
  };
  // ===== 部门管理 =====
  departments?: { id: string; name: string; headName?: string; headId?: string }[];
  // ===== 黑名单管理 =====
  blacklist?: { id: string; phone?: string; idCard?: string; reason: string; addedAt: string; addedBy: string }[];
  // ===== 费用科目 =====
  feeCategories?: { id: string; name: string; rate: number; enabled: boolean }[];
  // ===== 脱敏规则 =====
  maskingRules?: { field: 'phone' | 'idCard' | 'address' | 'bankCard' | 'company'; enabled: boolean }[];
  // ===== 数据字典（跟进阶段/意向标签/资金用途）=====
  dictionaries?: {
    followUpStages?: string[];
    intentTags?: string[];
    loanPurposes?: string[];
  };
  // ===== 常用话术与客户异议模板库（管理员可增删改）=====
  followUpTemplates?: FollowUpScriptTemplate[];
}

export interface IDCardInfo {
  name: string;
  idNumber: string;
  gender: '男' | '女';
  age: number;
  ethnicity?: string;
  address: string;
  expiryDate?: string;
  avatarUrl?: string;
}

export interface CreditReportSummary {
  hasCurrentOverdue: boolean;
  currentOverdueAmount: number;
  hasContinuous3Accumulated6: boolean; // 近2年连三累六
  badDebtsOrDisposal: boolean; // 呆账/资产处置
  dishonestDebtor: boolean; // 失信被执行人
  queryCount1Month: number; // 近1月查询
  queryCount2Month: number; // 近2月查询
  queryCount6Month: number; // 近半年查询
  creditCardTotalLimit: number; // 万元
  creditCardUsedLimit: number; // 万元
  creditCardUtilizationRate: number; // 百分比
  creditLoanBalance: number; // 万元
  microLoanCount: number; // 网贷/小贷笔数
  microLoanBalance: number; // 万元
}

export interface PropertyAsset {
  hasProperty: boolean;
  propertyType: '住宅' | '别墅' | '商铺' | '写字楼' | '工业厂房';
  ownershipType: '全款房' | '按揭房' | '已抵押';
  certificateNumber: string;
  city: string;
  district: string;
  communityName: string;
  areaSqMeters: number;
  mortgageBalance: number; // 剩余按揭金额 (万)
  estimatedValuation: number; // 预估总市值 (万)
  availableMortgageSpace: number; // 可用抵押空间 (万)
}

export interface VehicleAsset {
  hasVehicle: boolean;
  brandModel: string;
  purchaseYear: number;
  ownershipType: '全款' | '按揭';
  estimatedValuation: number; // 万元
}

export interface BusinessQualification {
  hasEnterprise: boolean;
  companyName: string;
  unifiedSocialCode: string;
  taxGrade: 'A' | 'B' | 'C' | 'M' | '无评级';
  annualInvoicedAmount: number; // 近1年开票额 (万元)
  previousYearInvoicedAmount: number; // 前1年开票额 (万元)
  annualRevenueFlow: number; // 年流水 (万元)
  shareholdingRatio: number; // 持股比例 (%)
  operatingYears: number; // 经营年限
  legalDisputes: boolean; // 涉诉情况
}

export interface SalaryQualification {
  socialSecurityBase: number; // 社保基数 (元)
  socialSecurityMonths: number; // 连续缴纳月数
  providentFundMonthlyDeposit: number; // 公积金月存缴额 (元)
  providentFundMonths: number; // 连续缴纳月数
  bankCardSalary: number; // 月打卡工资 (元)
  companyType: '央企国企' | '上市公司' | '事业单位' | '优质民企' | '普通私企' | '自由职业';
}

export interface MatchedProduct {
  id: string;
  productName: string;
  bankName: string;
  category: '房抵贷' | '公积金贷' | '税金贷' | '消费信用贷' | '发票流水贷' | '车抵贷' | '保单放大贷' | '过桥垫资' | '供应链金融' | '商户经营贷' | '政采贷' | '设备融资租赁' | '装修分期' | '票据贴现';
  institutionType?: '国有大行' | '股份制银行' | '城商/农商行' | '持牌消费金融' | '信托/专项机构';
  maxAmount: number; // 万元
  minAmount: number;
  interestRateRange: string; // 如 "3.2% - 3.85%"
  repaymentType: RepaymentType;
  repaymentRule?: string; // 如 "前3年先息后本，后7年等额本息" 或 "按日计息，随借随还"
  maxTermYears: number;
  matchScore: number; // 0 - 100
  matchLevel: '高度推荐' | '备选方案' | '特殊准入';
  features: string[];
  requirements: string[];
  creditRequirements?: string[]; // 征信细则要求 (逾期/查询/负债)
  requiredMaterials?: string[]; // 进件材料清单
  targetAudience?: string; // 适用客群画像
  // 商户经营贷专属维度（商户贷成品库快速筛选）
  flowRequirement?: string; // 流水要求，如 "近12个月经营流水 ≥ 100万"
  operatingYearsRequirement?: string; // 经营年限要求，如 "营业执照满 1 年"
  paymentTerminalTypes?: string[]; // 支持收款终端类型，如 ['银联POS', '微信/支付宝']
  estimatedApprovalDays: number;
  commissionRate: number; // 返佣点位 %
}

export interface FollowUpRecord {
  id: string;
  date: string;
  type: 'phone' | 'wechat' | 'visit' | 'system';
  content: string;
  operator: string;
  intentTag?: IntentTag;
  audioDuration?: string;
  audioUrl?: string;
  nextFollowUpDate?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  idCard: string;
  grade: CustomerGrade;
  intentTag?: IntentTag;
  subjectType: MainSubjectType;
  requestedAmount: number; // 万元
  requestedTermYears: number;
  purpose: LoanPurpose;
  urgency: '急需(3天内)' | '正常(1-2周)' | '储备对比(1月内)';
  channel: ChannelSource;
  channelAgentName?: string;
  ownerName: string; // 归属业务顾问（展示用）
  ownerId?: string; // 归属业务顾问 ID（真实外键，用于归属匹配与离职交接）
  status: 'active' | 'in_pool' | 'deal_in_progress' | 'disbursed' | 'closed';
  poolReturnCountdownDays?: number; // 距离退回公海天数
  lastContactDate: string;
  nextContactDate?: string;
  
  // 详细档案
  idCardInfo: IDCardInfo;
  creditSummary: CreditReportSummary;
  property: PropertyAsset;
  vehicle: VehicleAsset;
  business: BusinessQualification;
  salary: SalaryQualification;
  
  // 评分与雷达
  scoreBreakdown: {
    credit: number; // 0-100
    financial: number; // 0-100
    asset: number; // 0-100
    business: number; // 0-100
    stability: number; // 0-100
    overallScore: number;
  };
  matchedProducts: MatchedProduct[];
  
  followUps: FollowUpRecord[];
  createdAt: string;
  notes?: string;
}

export interface LoanCase {
  id: string;
  caseNumber?: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  productId: string;
  productName: string;
  productCategory?: string;
  lenderBank?: string;
  lenderInstitution: string; // 资方银行/消金机构
  lenderBranch: string; // 支行/经办网点
  lenderManagerName: string; // 资方经办客户经理
  lenderManagerPhone: string;
  applyAmount: number; // 申报金额 (万)
  appliedAmount?: number; // 申报金额 (万) 别名
  approvedAmount?: number; // 批贷金额 (万)
  interestRate: number; // 批贷年化利率 %
  termMonths: number;
  repaymentType: RepaymentType;
  stage: DealStage;
  subStageStatus: string; // e.g. "等待银行下户评估", "需补充近3个月纳税证明"
  serviceFeeRate: number; // 服务费率 % (如 2.5%)
  serviceFeeTotal: number; // 应收服务费 (元)
  serviceFeeDepositPaid: number; // 已收定金
  serviceFeeBalancePaid: number; // 已收尾款
  isFeeSettled: boolean;
  commissionRate: number; // 业务员提成点位 %
  commissionAmount: number; // 提成金额
  channelRebateRate?: number; // 外部渠道返点 %
  channelRebateAmount?: number; // 渠道返点金额
  channelRebateStatus?: 'pending' | 'approved' | 'paid';
  submittedAt: string;
  disbursedAt?: string;
  nextRepaymentDate?: string;
  consultantName: string; // 经办顾问（展示用）
  consultantId?: string; // 经办顾问 ID（真实外键，用于业绩归属与调单）
  documents: {
    name: string;
    type: 'id_card' | 'credit_report' | 'house_deed' | 'business_license' | 'bank_statement' | 'tax_proof' | 'contract';
    url: string;
    isMasked: boolean;
    uploadedAt: string;
  }[];
  timeline: {
    timestamp: string;
    stage: DealStage;
    operator: string;
    description: string;
    isKeyNode?: boolean;
  }[];
}

export interface FinancialCommissionRecord {
  id: string;
  caseId: string;
  customerName: string;
  consultantName: string;
  disbursedAmount: number; // 万元
  serviceFeeReceived: number; // 元
  commissionTier: string; // 阶梯如 "20% (50-100万)"
  commissionAmount: number; // 元
  settlementStatus: 'pending' | 'approved' | 'paid';
  disbursedDate: string;
  settledDate?: string;
}

// ======================= 贷后客户管理系统专属数据结构 (Post-Loan Management) =======================

export interface RepaymentScheduleItem {
  period: number; // 期数，如 1, 2, 3...
  dueDate: string; // 应还款日，如 "2026-08-25"
  principalWan: number; // 应还本金（万元）
  interestWan: number; // 应还利息（万元）
  totalAmountYuan: number; // 应还总额（元）
  status: 'paid' | 'pending' | 'overdue';
  paidAt?: string;
  actualPaidAmountYuan?: number;
  paymentAccountMasked?: string; // 扣款银行账户，如 "招商银行 (尾号8892)"
  note?: string;
}

export interface PostLoanRiskAlert {
  id: string;
  postLoanId: string;
  customerId: string;
  customerName: string;
  type: 'overdue' | 'collateral_seizure' | 'tax_downgrade' | 'legal_dispute' | 'multi_loan' | 'credit_deterioration' | 'inspection_due';
  level: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  triggeredAt: string;
  isResolved: boolean;
  resolutionNote?: string;
  resolvedAt?: string;
}

export interface InspectionRecord {
  id: string;
  postLoanId: string;
  type: 'first_month_call' | 'routine_quarterly' | 'on_site_visit' | 'annual_review' | 'emergency_check';
  inspectionDate: string;
  inspectorName: string;
  inspectorId?: string;
  method: 'phone' | 'wechat' | 'on_site' | 'video';
  businessStatus: 'normal' | 'expansion' | 'revenue_declined' | 'closed_down' | 'relocated';
  repaymentCapacityRating: 'strong' | 'stable' | 'tight' | 'high_risk';
  findings: string;
  photosOrDocs?: string[];
  nextInspectionDate?: string;
}

export interface RefinanceOpportunity {
  id: string;
  postLoanId: string;
  customerId: string;
  customerName: string;
  opportunityType: 'rate_reduction' | 'top_up_cash' | 'debt_consolidation' | 'term_extension';
  currentRate: number; // 当前在贷年化利率 %
  targetRate: number; // 预计可转年化利率 %
  estimatedAnnualSavingsYuan: number; // 预计年省利息（元）
  additionalAmountWan?: number; // 预计可加贷额度（万元）
  recommendedProductId: string;
  recommendedProductName: string;
  recommendedBank: string;
  urgencyLevel: 'high' | 'medium' | 'low';
  salesStatus: 'discovered' | 'contacted' | 'intake_initiated' | 'declined';
  note?: string;
}

export interface PostLoanAccount {
  id: string;
  caseId: string; // 关联进件工单ID
  caseNumber: string; // 关联进件合同号/编号
  customerId: string; // 关联客户档案ID
  customerName: string;
  customerPhone: string;
  customerGrade: CustomerGrade;
  borrowerSubject: string; // 企业名或借款人全名
  
  // 贷款基本信息
  lenderBank: string; // 放款资方
  productCategory: string; // 产品类别
  productName: string;
  disbursedAmountWan: number; // 初始放款本金 (万)
  currentBalanceWan: number; // 剩余在贷本金余额 (万)
  interestRate: number; // 年化执行利率 %
  termMonths: number; // 贷款总期限 (月)
  repaymentType: RepaymentType;
  disbursedDate: string; // 放款起息日
  maturityDate: string; // 贷款到期日
  
  // 还款与账户
  repaymentDayOfMonth: number; // 每月还款日，如 20
  nextRepaymentDate: string; // 下期应还款日
  nextDuePrincipalWan: number; // 下期应还本金
  nextDueInterestWan: number; // 下期应还利息
  nextDueTotalYuan: number; // 下期应还总金额 (元)
  repaymentAccount: string; // 扣款银行卡号 (脱敏)
  repaymentBankName: string;
  
  // 状态与风险分级
  repaymentStatus: 'normal' | 'upcoming_due' | 'overdue_m1' | 'overdue_m2' | 'overdue_m3' | 'settled' | 'early_settled';
  overdueDays: number; // 当前逾期天数
  overdueAmountYuan: number; // 累计逾期未还金额
  riskLevel: 'safe' | 'low_risk' | 'medium_risk' | 'high_danger';
  
  // 经办顾问
  consultantName: string;
  consultantId?: string;
  
  // 关联明细
  schedules: RepaymentScheduleItem[];
  riskAlerts: PostLoanRiskAlert[];
  inspections: InspectionRecord[];
  refinanceOpportunity?: RefinanceOpportunity;
  
  lastInspectionDate?: string;
  nextInspectionDate?: string;
  lastCareReminderDate?: string; // 上次关怀提醒时间
  notes?: string;
}

