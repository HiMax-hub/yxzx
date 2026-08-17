import { Customer, CustomerGrade, PropertyAsset, SalaryQualification, BusinessQualification, CreditReportSummary, MatchedProduct } from '../types';

/**
 * 房产抵押可用额度测算
 * 住宅常规抵押率 70%，商办/厂房 50%（可用 ltvOverrides 覆盖，供系统配置驱动）
 */
export function calculatePropertyMortgageSpace(
  propertyType: string,
  valuation: number, // 万元
  mortgageBalance: number, // 剩余按揭 (万元)
  ltvOverrides?: { residential?: number; commercial?: number; villa?: number }
): { ltv: number; maxMortgageAmount: number; availableSpace: number } {
  let ltv = 0.70;
  if (propertyType === '别墅' || propertyType === '住宅') {
    ltv = ltvOverrides?.residential ?? 0.70;
  } else if (propertyType === '商铺' || propertyType === '写字楼') {
    ltv = ltvOverrides?.commercial ?? 0.50;
  } else if (propertyType === '工业厂房') {
    ltv = ltvOverrides?.commercial ?? 0.50;
  }
  if (propertyType === '别墅' && ltvOverrides?.villa != null) {
    ltv = ltvOverrides.villa;
  }
  
  const maxMortgageAmount = Math.round(valuation * ltv * 10) / 10;
  const availableSpace = Math.max(0, Math.round((maxMortgageAmount - mortgageBalance) * 10) / 10);
  return { ltv, maxMortgageAmount, availableSpace };
}

/**
 * 公积金信用贷预估额度 (万元)
 * 行业常规算法：公积金月缴存额 * 150~200倍，最高30~50万
 */
export function calculateProvidentFundLimit(monthlyDeposit: number, months: number): { min: number; max: number } {
  if (monthlyDeposit <= 0 || months < 6) return { min: 0, max: 0 };
  const base = (monthlyDeposit * 180) / 10000;
  const min = Math.min(50, Math.max(5, Math.round(base * 0.8 * 10) / 10));
  const max = Math.min(50, Math.max(10, Math.round(base * 1.2 * 10) / 10));
  return { min, max };
}

/**
 * 企业税票贷预估额度 (万元)
 * 行业常规：近1年开票额的 10%~15%，最高 300~500万
 */
export function calculateTaxInvoiceLimit(annualInvoiced: number, taxGrade: string): { min: number; max: number } {
  if (annualInvoiced <= 0 || taxGrade === 'C' || taxGrade === '无评级') {
    return { min: 0, max: 0 };
  }
  let multiplier = 0.12;
  if (taxGrade === 'A') multiplier = 0.15;
  if (taxGrade === 'B') multiplier = 0.12;
  if (taxGrade === 'M') multiplier = 0.08;

  const base = annualInvoiced * multiplier;
  const min = Math.min(500, Math.round(base * 0.85 * 10) / 10);
  const max = Math.min(500, Math.round(base * 1.15 * 10) / 10);
  return { min, max };
}

/**
 * 实时风控预检规则引擎
 */
export interface RiskCheckResult {
  hardStoppers: string[]; // 🔴 红色阻断：必须风控审批或一票否决
  warningFlags: string[]; // 🟡 黄色预警：进件瑕疵/需选择特定宽松机构
  bonusPoints: string[];  // 🟢 绿色加分：优质资质亮点
  riskLevel: 'low' | 'medium' | 'high' | 'blocked';
}

// 征信红线阈值（超级管理员在「参数与策略总控」维护，缺省走行业默认值）
export interface CreditRedlineConfig {
  query2MonthWarn?: number; // 近2月查询预警阈值（默认4）
  query2MonthHigh?: number; // 近2月查询高警戒阈值（默认6）
  creditCardUtilizationWarn?: number; // 信用卡使用率警戒 %（默认80）
  microLoanCountWarn?: number; // 网贷/小贷笔数预警（默认4）
  providentFundBonusMin?: number; // 公积金月缴加分下限（元，默认1500）
}

export function runRiskAssessment(
  credit: CreditReportSummary,
  property: PropertyAsset,
  business: BusinessQualification,
  salary: SalaryQualification,
  redlines?: CreditRedlineConfig
): RiskCheckResult {
  const hardStoppers: string[] = [];
  const warningFlags: string[] = [];
  const bonusPoints: string[] = [];

  // 可配置阈值（缺省行业默认值）
  const q2Warn = redlines?.query2MonthWarn ?? 4;
  const q2High = redlines?.query2MonthHigh ?? 6;
  const utilWarn = redlines?.creditCardUtilizationWarn ?? 80;
  const microWarn = redlines?.microLoanCountWarn ?? 4;
  const pfBonusMin = redlines?.providentFundBonusMin ?? 1500;

  // 1. 征信硬伤初筛
  if (credit.hasCurrentOverdue) {
    hardStoppers.push(`当前存在未结清逾期金额（¥${credit.currentOverdueAmount}元），传统银行将直接秒拒，须先结清或走特殊不良处理通道`);
  }
  if (credit.badDebtsOrDisposal) {
    hardStoppers.push('征信包含“呆账/资产处置/垫款/代偿”异常记录，触碰银行风控一票否决底线');
  }
  if (credit.dishonestDebtor) {
    hardStoppers.push('司法联网核查被列入“失信被执行人”，全渠道直接拦截进件');
  }
  if (credit.hasContinuous3Accumulated6) {
    hardStoppers.push('近2年存在“连三累六”（连续3次或累计6次逾期），主流优质银行难以准入，需筛选次级消金/抵押渠道');
  }

  // 2. 征信瑕疵与查询（阈值可配置）
  if (credit.queryCount2Month >= q2High) {
    warningFlags.push(`近2个月征信机构查询达 ${credit.queryCount2Month} 次（已超常规阈值${q2Warn}次），被判定多头借贷风险，建议优先报批对查询宽松的银行`);
  } else if (credit.queryCount2Month >= q2Warn) {
    warningFlags.push(`近2个月查询 ${credit.queryCount2Month} 次，略偏高，需尽量减少非必要网贷比价`);
  }

  if (credit.creditCardUtilizationRate > utilWarn) {
    warningFlags.push(`信用卡使用率高达 ${credit.creditCardUtilizationRate}%（超${utilWarn}%高负债警戒线），建议先进行部分额度归拢还款或提供充足流水对冲`);
  }

  if (credit.microLoanCount >= microWarn) {
    warningFlags.push(`名下有 ${credit.microLoanCount} 笔小贷/网贷未结清，部分国有银行有网贷笔数限制，需先结清小额网贷`);
  }

  // 3. 资质加分项
  if (!credit.hasCurrentOverdue && !credit.hasContinuous3Accumulated6 && credit.queryCount2Month <= 2) {
    bonusPoints.push('征信纯净度极高，近2年无严重逾期且查询次数少于3次（白金资质）');
  }

  if (property.hasProperty && property.ownershipType === '全款房') {
    bonusPoints.push(`红本在手全款优质房产（预估估值 ¥${property.estimatedValuation}万），可办大额一抵低息经营/消费贷`);
  } else if (property.hasProperty && property.availableMortgageSpace >= 50) {
    bonusPoints.push(`名下按揭房尚有超 ¥${property.availableMortgageSpace}万 净剩余抵押空间，支持二次抵押（二抵加按）`);
  }

  if (salary.providentFundMonthlyDeposit >= pfBonusMin && salary.providentFundMonths >= 12) {
    bonusPoints.push(`公积金月缴存 ¥${salary.providentFundMonthlyDeposit}元（连续超12个月），符合银行优质工薪白领低息秒批通道`);
  }

  if (business.hasEnterprise && business.taxGrade === 'A' && business.annualInvoicedAmount >= 200) {
    bonusPoints.push(`纳税等级 A 级且年开票超 ¥${business.annualInvoicedAmount}万，可直接申请多家国有/股份制银行秒级纯信用税金贷`);
  }

  let riskLevel: 'low' | 'medium' | 'high' | 'blocked' = 'low';
  if (hardStoppers.length > 0) {
    riskLevel = 'blocked';
  } else if (warningFlags.length >= 2) {
    riskLevel = 'high';
  } else if (warningFlags.length === 1) {
    riskLevel = 'medium';
  }

  return { hardStoppers, warningFlags, bonusPoints, riskLevel };
}

/**
 * 客户综合评级与评分卡引擎 (S/A/B/C/D)
 */
export function calculateCreditScorecard(
  credit: CreditReportSummary,
  property: PropertyAsset,
  business: BusinessQualification,
  salary: SalaryQualification
): {
  grade: CustomerGrade;
  scores: {
    credit: number;
    financial: number;
    asset: number;
    business: number;
    stability: number;
    overallScore: number;
  };
} {
  // 1. 征信分 (30%)
  let creditScore = 85;
  if (credit.hasCurrentOverdue) creditScore -= 50;
  if (credit.hasContinuous3Accumulated6) creditScore -= 30;
  if (credit.badDebtsOrDisposal) creditScore -= 60;
  if (credit.queryCount2Month > 5) creditScore -= (credit.queryCount2Month - 5) * 5;
  if (credit.creditCardUtilizationRate > 80) creditScore -= 15;
  if (credit.microLoanCount >= 3) creditScore -= 10;
  creditScore = Math.max(10, Math.min(100, creditScore));

  // 2. 财力分 (25%)
  let financialScore = 50;
  if (salary.bankCardSalary >= 20000) financialScore += 35;
  else if (salary.bankCardSalary >= 10000) financialScore += 25;
  else if (salary.bankCardSalary >= 5000) financialScore += 15;
  
  if (salary.providentFundMonthlyDeposit >= 2000) financialScore += 20;
  else if (salary.providentFundMonthlyDeposit >= 800) financialScore += 12;
  financialScore = Math.max(10, Math.min(100, financialScore));

  // 3. 资产分 (25%)
  let assetScore = 30;
  if (property.hasProperty) {
    if (property.ownershipType === '全款房') assetScore += 45;
    else assetScore += 30;
    if (property.estimatedValuation >= 300) assetScore += 20;
    else if (property.estimatedValuation >= 100) assetScore += 10;
  }
  assetScore = Math.max(10, Math.min(100, assetScore));

  // 4. 企业经营分 (10%)
  let businessScore = 40;
  if (business.hasEnterprise) {
    if (business.taxGrade === 'A') businessScore += 35;
    else if (business.taxGrade === 'B') businessScore += 25;
    if (business.annualInvoicedAmount >= 300) businessScore += 25;
  }
  businessScore = Math.max(10, Math.min(100, businessScore));

  // 5. 履约与稳定性分 (10%)
  let stabilityScore = 80;
  if (salary.socialSecurityMonths >= 24) stabilityScore += 15;
  if (credit.dishonestDebtor) stabilityScore = 10;
  stabilityScore = Math.max(10, Math.min(100, stabilityScore));

  // 综合总分
  const overallScore = Math.round(
    creditScore * 0.30 +
    financialScore * 0.25 +
    assetScore * 0.25 +
    businessScore * 0.10 +
    stabilityScore * 0.10
  );

  let grade: CustomerGrade = 'C';
  if (credit.hasCurrentOverdue || credit.badDebtsOrDisposal || credit.dishonestDebtor) {
    grade = 'D';
  } else if (overallScore >= 88) {
    grade = 'S';
  } else if (overallScore >= 75) {
    grade = 'A';
  } else if (overallScore >= 60) {
    grade = 'B';
  } else {
    grade = 'C';
  }

  return {
    grade,
    scores: {
      credit: creditScore,
      financial: financialScore,
      asset: assetScore,
      business: businessScore,
      stability: stabilityScore,
      overallScore,
    },
  };
}

/**
 * 还款计划计算器
 * 支持：先息后本 (interest_first)、等额本息 (equal_principal_interest)、等额本金 (equal_principal)
 */
export function calculateRepaymentPlan(
  principalWan: number, // 借款本金 (万元)
  annualRatePct: number, // 年化利率 % (如 3.85)
  termYears: number, // 年限
  type: 'interest_first' | 'equal_principal_interest' | 'equal_principal'
): {
  monthlyPayment: number; // 首月/常规月供 (元)
  totalInterest: number; // 总利息 (元)
  totalRepayment: number; // 本息合计 (元)
  scheduleSummary: string;
} {
  const principal = principalWan * 10000;
  const monthlyRate = (annualRatePct / 100) / 12;
  const totalMonths = termYears * 12;

  // 边界保护：本金/利率/期限异常时返回零值方案，避免除零与 NaN
  if (!isFinite(principal) || principal <= 0 || !isFinite(monthlyRate) || monthlyRate < 0 || totalMonths <= 0) {
    return {
      monthlyPayment: 0,
      totalInterest: 0,
      totalRepayment: 0,
      scheduleSummary: '请输入有效的借款金额、年化利率与期限',
    };
  }
  if (monthlyRate === 0) {
    // 零利率：仅归还本金
    return {
      monthlyPayment: Math.round(principal / totalMonths),
      totalInterest: 0,
      totalRepayment: principal,
      scheduleSummary: `零利率方案：本金分 ${totalMonths} 期归还，无利息`,
    };
  }

  if (type === 'interest_first') {
    // 先息后本：每月还利息，最后一期还本金
    const monthlyPayment = Math.round(principal * monthlyRate);
    const totalInterest = Math.round(monthlyPayment * totalMonths);
    const totalRepayment = principal + totalInterest;
    return {
      monthlyPayment,
      totalInterest,
      totalRepayment,
      scheduleSummary: `前 ${totalMonths - 1} 期每月仅还息 ¥${monthlyPayment.toLocaleString()}，最后一期归还本金 ¥${principal.toLocaleString()} 及当月利息`,
    };
  }

  if (type === 'equal_principal_interest') {
    // 等额本息：每月还款额固定
    const factor = Math.pow(1 + monthlyRate, totalMonths);
    const monthlyPayment = Math.round((principal * monthlyRate * factor) / (factor - 1));
    const totalRepayment = monthlyPayment * totalMonths;
    const totalInterest = totalRepayment - principal;
    return {
      monthlyPayment,
      totalInterest,
      totalRepayment,
      scheduleSummary: `每月固定还款 ¥${monthlyPayment.toLocaleString()}（含本金及利息），共 ${totalMonths} 期`,
    };
  }

  // 等额本金：每月还相同本金 + 剩余利息 (逐月递减)
  const monthlyPrincipal = principal / totalMonths;
  const firstMonthPayment = Math.round(monthlyPrincipal + principal * monthlyRate);
  const totalInterest = Math.round(((totalMonths + 1) * principal * monthlyRate) / 2);
  const totalRepayment = principal + totalInterest;
  const monthlyDecrease = Math.round(monthlyPrincipal * monthlyRate);

  return {
    monthlyPayment: firstMonthPayment,
    totalInterest,
    totalRepayment,
    scheduleSummary: `首月还款 ¥${firstMonthPayment.toLocaleString()}，之后每月递减约 ¥${monthlyDecrease.toLocaleString()}，共 ${totalMonths} 期`,
  };
}

/**
 * 业务员阶梯提成计算
 * 档位来自系统配置 systemConfig.commissionTiers（唯一真相源），缺省回退默认档位
 * 默认档位: 0-200万: 15%, 200-500万: 20%, 500-1000万: 25%, >1000万: 30%
 */
export interface CommissionTier {
  minWan: number;
  maxWan: number;
  rate: number;
  tierName: string;
}

export const DEFAULT_COMMISSION_TIERS: CommissionTier[] = [
  { minWan: 0, maxWan: 200, rate: 15, tierName: '基础档' },
  { minWan: 200, maxWan: 500, rate: 20, tierName: '进阶档' },
  { minWan: 500, maxWan: 1000, rate: 25, tierName: '精英档' },
  { minWan: 1000, maxWan: 9999, rate: 30, tierName: '卓越档' },
];

export function calculateConsultantCommission(
  serviceFeeIncome: number,
  monthlyDisbursedAmountWan: number,
  tiers?: CommissionTier[]
): {
  tierName: string;
  rate: number;
  commissionAmount: number;
  activeTier?: CommissionTier;
} {
  const tierList = tiers && tiers.length > 0 ? tiers : DEFAULT_COMMISSION_TIERS;
  // 命中最高档（放款额 >= 该档下限），否则基础档兜底
  let activeTier = tierList[0];
  for (const tier of tierList) {
    if (monthlyDisbursedAmountWan >= tier.minWan) {
      activeTier = tier;
    }
  }
  const rate = (activeTier.rate || 0) / 100;
  const commissionAmount = Math.round(serviceFeeIncome * rate);
  return {
    tierName: `${activeTier.tierName} (当月放款${formatTierRange(activeTier)}, 提成${activeTier.rate}%)`,
    rate: activeTier.rate,
    commissionAmount,
    activeTier,
  };
}

function formatTierRange(tier: CommissionTier): string {
  if (tier.maxWan >= 9999) return `≥${tier.minWan}万`;
  return `${tier.minWan}-${tier.maxWan}万`;
}

/**
 * 房产抵押净值与二抵空间测算
 */
export function calculateMortgageSpace(
  valuationWan: number,
  propertyType: 'residential' | 'commercial' | 'villa',
  existingDebtWan: number,
  ltvOverrides?: { residential?: number; commercial?: number; villa?: number }
): {
  maxLtvAmount: number;
  availableSpace: number;
  ltvRatio: number;
} {
  let ltvRatio = ltvOverrides?.residential ?? 0.70;
  if (propertyType === 'commercial') ltvRatio = ltvOverrides?.commercial ?? 0.50;
  if (propertyType === 'villa') ltvRatio = ltvOverrides?.villa ?? 0.55;

  const maxLtvAmount = Math.round(valuationWan * ltvRatio);
  const availableSpace = Math.max(0, maxLtvAmount - existingDebtWan);

  return { maxLtvAmount, availableSpace, ltvRatio };
}

/**
 * 企税票据授信额度测算
 */
export function calculateTaxLoanLimit(
  annualInvoiceWan: number,
  taxGrade: 'A' | 'B' | 'M' | 'C'
): {
  estimatedMaxLimit: number;
  multiplier: number;
  recommendedCombination: string;
} {
  let multiplier = 0.10;
  if (taxGrade === 'A') multiplier = 0.18;
  else if (taxGrade === 'B') multiplier = 0.14;
  else if (taxGrade === 'M') multiplier = 0.10;
  else if (taxGrade === 'C') multiplier = 0.05;

  const rawLimit = Math.round(annualInvoiceWan * multiplier);
  const estimatedMaxLimit = Math.min(500, Math.max(10, rawLimit)); // 单家银行上限500万

  let recommendedCombination = '建行惠懂你 + 微众微业贷 + 招行招企贷 (组合申请最高可叠加至1000万)';
  if (taxGrade === 'A') {
    recommendedCombination = '四大行国有税金贷低息主方案 (年化3.1%~3.65%) + 股份制银行秒批备用金';
  }

  return { estimatedMaxLimit, multiplier, recommendedCombination };
}

