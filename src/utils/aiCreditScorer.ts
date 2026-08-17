import { Customer } from '../types';

export interface CustomerAiScoreBreakdown {
  assetQuality: number; // 0-100 资产质量分
  creditHealth: number; // 0-100 征信健康分
  intentUrgency: number; // 0-100 意向紧迫度
  followUpEngagement: number; // 0-100 跟进活跃度
  riskResistance: number; // 0-100 综合抗风险力
}

export interface CustomerAiScoreResult {
  overallScore: number; // 0-100 综合信用转化分
  scoreTier: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'C';
  tierLabel: string;
  conversionProbability: number; // 0-100% 预计放款转化概率
  riskLevel: '极低风险' | '低风险' | '中等风险' | '较高风险' | '高危关注';
  badgeColor: {
    bg: string;
    text: string;
    border: string;
    ring: string;
  };
  breakdown: CustomerAiScoreBreakdown;
  diagnosisHighlights: string[]; // 优势亮点
  riskAlerts: string[]; // 风险与优化举措
  recommendedAction: string; // 下一步攻坚策略建议
}

/**
 * 动态计算客户 AI 信用与转化评分
 * 综合客户资产画像、人行征信、跟进记录频次与最新意向标签多维度动态加权
 */
export function calculateCustomerAiScore(customer: Customer): CustomerAiScoreResult {
  // 1. 资产质量得分 (Asset Quality, 权重 25%)
  let assetScore = 50;
  if (customer.property?.hasProperty) {
    assetScore += 25;
    if (customer.property.ownershipType === '全款房') assetScore += 10;
    if ((customer.property.availableMortgageSpace || 0) >= 100) assetScore += 10;
  }
  if (customer.business?.hasEnterprise) {
    assetScore += 15;
    if (customer.business.taxGrade === 'A' || customer.business.taxGrade === 'B') assetScore += 10;
    if ((customer.business.annualInvoicedAmount || 0) >= 300) assetScore += 10;
  }
  if (customer.salary?.providentFundMonthlyDeposit && customer.salary.providentFundMonthlyDeposit >= 1000) {
    assetScore += 15;
  }
  assetScore = Math.min(100, Math.max(20, assetScore));

  // 2. 征信健康得分 (Credit Health, 权重 25%)
  let creditScore = 80;
  const cs = customer.creditSummary;
  if (cs) {
    if (cs.hasCurrentOverdue) creditScore -= 35;
    if (cs.hasContinuous3Accumulated6) creditScore -= 30;
    if (cs.badDebtsOrDisposal || cs.dishonestDebtor) creditScore -= 45;
    
    // 近期查询扣分
    if (cs.queryCount1Month > 3) creditScore -= 12;
    else if (cs.queryCount2Month > 5) creditScore -= 10;
    else if (cs.queryCount2Month <= 2) creditScore += 8;

    // 信用卡使用率
    if (cs.creditCardUtilizationRate > 85) creditScore -= 12;
    else if (cs.creditCardUtilizationRate < 50 && cs.creditCardTotalLimit > 0) creditScore += 6;

    // 小贷笔数
    if (cs.microLoanCount > 4) creditScore -= 18;
    else if (cs.microLoanCount === 0) creditScore += 8;
  }
  creditScore = Math.min(100, Math.max(15, creditScore));

  // 3. 意向紧迫度 (Intent & Urgency, 权重 20%)
  let intentScore = 60;
  switch (customer.grade) {
    case 'S': intentScore = 96; break;
    case 'A': intentScore = 85; break;
    case 'B': intentScore = 70; break;
    case 'C': intentScore = 50; break;
    case 'D': intentScore = 30; break;
  }
  if (customer.urgency === '急需(3天内)') intentScore += 10;
  else if (customer.urgency === '储备对比(1月内)') intentScore -= 5;
  
  if (customer.intentTag === 'high_intent') intentScore += 12;
  else if (customer.intentTag === 'no_need') intentScore -= 30;
  else if (customer.intentTag === 'invalid_number') intentScore = 15;
  intentScore = Math.min(100, Math.max(10, intentScore));

  // 4. 跟进活跃与反馈得分 (Follow-up Engagement, 权重 15%)
  let followUpScore = 50;
  const followUps = customer.followUps || [];
  const followUpCount = followUps.length;
  
  if (followUpCount >= 5) followUpScore += 25;
  else if (followUpCount >= 2) followUpScore += 15;
  else if (followUpCount === 1) followUpScore += 8;
  else followUpScore -= 15;

  // 最近跟进时间
  if (customer.lastContactDate?.includes('今天') || customer.lastContactDate?.includes('刚刚') || customer.lastContactDate?.includes('小时')) {
    followUpScore += 15;
  } else if (customer.lastContactDate?.includes('昨天')) {
    followUpScore += 8;
  } else if (customer.lastContactDate?.includes('天前') && parseInt(customer.lastContactDate) > 7) {
    followUpScore -= 15;
  }

  // 最新跟进记录关键词加减分
  if (followUps.length > 0) {
    const latestContent = followUps[0].content || '';
    if (latestContent.includes('预约') || latestContent.includes('面签') || latestContent.includes('已批') || latestContent.includes('补齐')) {
      followUpScore += 15;
    } else if (latestContent.includes('拒绝') || latestContent.includes('利息太高') || latestContent.includes('不办了')) {
      followUpScore -= 15;
    }
  }
  followUpScore = Math.min(100, Math.max(10, followUpScore));

  // 5. 综合抗风险力 (Risk Resistance, 权重 15%)
  let riskScore = 65;
  if (customer.status === 'deal_in_progress' || customer.status === 'disbursed') riskScore += 20;
  if (customer.channel === 'referral') riskScore += 10;
  if (customer.channelAgentName) riskScore += 5;
  if (customer.status === 'in_pool') riskScore -= 15;
  riskScore = Math.min(100, Math.max(20, riskScore));

  // 综合加权总分
  const overallScore = Math.round(
    assetScore * 0.25 +
    creditScore * 0.25 +
    intentScore * 0.20 +
    followUpScore * 0.15 +
    riskScore * 0.15
  );

  // 评级与标签
  let scoreTier: CustomerAiScoreResult['scoreTier'] = 'BBB';
  let tierLabel = '良好 · 稳健推进';
  let conversionProbability = 60;
  let riskLevel: CustomerAiScoreResult['riskLevel'] = '中等风险';
  let badgeColor = {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    ring: 'ring-blue-100',
  };

  if (overallScore >= 90) {
    scoreTier = 'AAA';
    tierLabel = '极优 · 高净值速办';
    conversionProbability = 94;
    riskLevel = '极低风险';
    badgeColor = {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      ring: 'ring-emerald-100',
    };
  } else if (overallScore >= 80) {
    scoreTier = 'AA';
    tierLabel = '优质 · 高成单概率';
    conversionProbability = 85;
    riskLevel = '低风险';
    badgeColor = {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      ring: 'ring-blue-100',
    };
  } else if (overallScore >= 70) {
    scoreTier = 'A';
    tierLabel = '良好 · 资质符合';
    conversionProbability = 72;
    riskLevel = '中等风险';
    badgeColor = {
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-200',
      ring: 'ring-indigo-100',
    };
  } else if (overallScore >= 60) {
    scoreTier = 'BBB';
    tierLabel = '中等 · 需补件增信';
    conversionProbability = 58;
    riskLevel = '中等风险';
    badgeColor = {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      ring: 'ring-amber-100',
    };
  } else if (overallScore >= 45) {
    scoreTier = 'BB';
    tierLabel = '关注 · 存在瑕疵';
    conversionProbability = 36;
    riskLevel = '较高风险';
    badgeColor = {
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200',
      ring: 'ring-orange-100',
    };
  } else {
    scoreTier = 'C';
    tierLabel = '预警 · 转化阻力大';
    conversionProbability = 18;
    riskLevel = '高危关注';
    badgeColor = {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      ring: 'ring-rose-100',
    };
  }

  // 优势诊断
  const diagnosisHighlights: string[] = [];
  if (customer.property?.hasProperty) {
    diagnosisHighlights.push(`名下持有${customer.property.communityName || '优质房产'}，可用抵押净值空间达 ¥${customer.property.availableMortgageSpace || 100}万`);
  }
  if (customer.business?.hasEnterprise && (customer.business.taxGrade === 'A' || customer.business.taxGrade === 'B')) {
    diagnosisHighlights.push(`企业纳税评级${customer.business.taxGrade}级，符合银税直通车秒级授信白名单`);
  }
  if (cs && !cs.hasCurrentOverdue && cs.queryCount2Month <= 3) {
    diagnosisHighlights.push(`征信近2月查询仅${cs.queryCount2Month}次，无当前逾期，征信通道清洁`);
  }
  if (customer.grade === 'S' || customer.urgency === '急需(3天内)') {
    diagnosisHighlights.push(`客户借款需求强烈（${customer.urgency}），决策周期短、促成窗口极佳`);
  }
  if (diagnosisHighlights.length === 0) {
    diagnosisHighlights.push('具备基础身份与流水资质，可匹配普惠消费信用贷');
  }

  // 风险与优化建议
  const riskAlerts: string[] = [];
  if (cs?.hasCurrentOverdue) {
    riskAlerts.push('存在当前逾期：需先结清欠款并出具非恶意结清证明方可准入');
  }
  if (cs && cs.queryCount2Month >= 5) {
    riskAlerts.push(`近2个月征信查询已达${cs.queryCount2Month}次：建议走抵押增信或人工特批通道，切勿盲目线上测额`);
  }
  if (cs && cs.creditCardUtilizationRate > 80) {
    riskAlerts.push(`信用卡使用率达${cs.creditCardUtilizationRate}%（负债偏高）：建议搭配低息先息后本方案置换`);
  }
  if (cs && cs.microLoanCount >= 4) {
    riskAlerts.push(`存在${cs.microLoanCount}笔网贷记录：多数大行有网贷门槛，建议优先做网贷结清重组`);
  }
  if (followUps.length === 0) {
    riskAlerts.push('档案尚无跟进记录：线索处于静默期，建议4小时内发起首电破冰');
  }
  if (riskAlerts.length === 0) {
    riskAlerts.push('暂无高危风险指标，保持标准化报审流程推进即可');
  }

  // 下一步攻坚策略建议
  let recommendedAction = '建议主推国有大行低息产品，预约本周面签';
  if (customer.property?.hasProperty) {
    recommendedAction = '建议主推【10年期房产抵押先息后本】，重点测算二抵免过桥空间，快速邀约下户';
  } else if (customer.business?.hasEnterprise) {
    recommendedAction = '建议主推【企业税票秒批纯信用贷】，指导企业税局线上授权，先出额度锁客';
  } else if (customer.salary?.providentFundMonthlyDeposit) {
    recommendedAction = '建议主推【公积金白领信用贷】，年化3.0%起秒批，随借随还无抵押';
  } else if (cs?.queryCount2Month && cs.queryCount2Month >= 5) {
    recommendedAction = '征信查询偏多，推荐走城商行人工下户方案或房产增信特批通道，避免机审被拒';
  }

  return {
    overallScore,
    scoreTier,
    tierLabel,
    conversionProbability,
    riskLevel,
    badgeColor,
    breakdown: {
      assetQuality: assetScore,
      creditHealth: creditScore,
      intentUrgency: intentScore,
      followUpEngagement: followUpScore,
      riskResistance: riskScore,
    },
    diagnosisHighlights,
    riskAlerts,
    recommendedAction,
  };
}
