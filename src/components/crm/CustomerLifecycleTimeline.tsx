import React, { useMemo } from 'react';
import { 
  UserPlus, 
  PhoneCall, 
  Sparkles, 
  FileText, 
  UserCheck, 
  CheckCircle2, 
  Coins, 
  Clock, 
  RotateCcw,
  AlertCircle,
  Building,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { Customer, LoanCase, FollowUpRecord } from '../../types';

interface CustomerLifecycleTimelineProps {
  customer: Customer;
  loanCases?: LoanCase[];
}

interface LifecycleStageMilestone {
  stageKey: string;
  stageName: string;
  stageOrder: number;
  status: 'completed' | 'current' | 'pending';
  timestamp?: string;
  durationLabel?: string;
  operatorName?: string;
  channelOrBank?: string;
  summaryText: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

export const CustomerLifecycleTimeline: React.FC<CustomerLifecycleTimelineProps> = ({
  customer,
  loanCases = [],
}) => {
  // Find associated loan case
  const relatedCase = useMemo(() => {
    return loanCases.find((lc) => lc.customerId === customer.id);
  }, [loanCases, customer.id]);

  // Compute structured lifecycle milestones based on actual customer logs and loan case stage
  const milestones: LifecycleStageMilestone[] = useMemo(() => {
    const list: LifecycleStageMilestone[] = [];
    const followUps = customer.followUps || [];
    
    // 1. Initial Intake / Source Acquisition
    const intakeDate = customer.createdAt || '2026-08-01 09:30';
    list.push({
      stageKey: 'intake',
      stageName: '获客建档',
      stageOrder: 1,
      status: 'completed',
      timestamp: intakeDate,
      operatorName: customer.ownerName || '李晓明',
      channelOrBank: customer.channel || '同业转介',
      summaryText: `来源渠道【${customer.channel || '系统录入'}】，初判意向【${customer.grade}级】`,
      icon: <UserPlus className="w-3.5 h-3.5" />,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-700',
    });

    // 2. Initial Telesales Screening & First Outreach
    const firstCallFollowUp = followUps.find((f) => f.type === 'phone' || f.type === 'wechat');
    const hasFollowUp = followUps.length > 0;
    list.push({
      stageKey: 'first_call',
      stageName: '首呼摸排',
      stageOrder: 2,
      status: hasFollowUp ? 'completed' : 'current',
      timestamp: firstCallFollowUp ? firstCallFollowUp.date : '建档当日完成',
      durationLabel: '首呼响应: 15分钟内',
      operatorName: firstCallFollowUp?.operator || customer.ownerName,
      summaryText: firstCallFollowUp ? `完成首通意向摸排：${firstCallFollowUp.content.slice(0, 32)}...` : '等待专属顾问首次外呼核验资金需求',
      icon: <PhoneCall className="w-3.5 h-3.5" />,
      iconBg: hasFollowUp ? 'bg-emerald-100' : 'bg-amber-100',
      iconColor: hasFollowUp ? 'text-emerald-700' : 'text-amber-700',
    });

    // 3. Asset Qualification & Scheme Matching
    const isUpgraded = customer.grade === 'S' || customer.grade === 'A' || customer.matchedProducts?.length > 0 || !!relatedCase;
    list.push({
      stageKey: 'solution_match',
      stageName: '方案定案',
      stageOrder: 3,
      status: isUpgraded ? 'completed' : hasFollowUp ? 'current' : 'pending',
      timestamp: followUps.length > 1 ? followUps[1].date : undefined,
      durationLabel: '方案测算',
      summaryText: customer.matchedProducts?.length
        ? `推荐【${customer.matchedProducts[0].productName}】最高测算 ¥${customer.matchedProducts[0].maxAmount}万`
        : '完成名下房产/税票/征信资质评估与产品匹配',
      icon: <Sparkles className="w-3.5 h-3.5" />,
      iconBg: isUpgraded ? 'bg-purple-100' : 'bg-slate-100',
      iconColor: isUpgraded ? 'text-purple-700' : 'text-slate-400',
    });

    // 4. Submission & Document Collection (进件报审)
    const hasSubmitted = !!relatedCase || followUps.some((f) => f.content.includes('进件') || f.content.includes('报审'));
    const isDocStage = relatedCase?.stage === 'docs_collection' || relatedCase?.stage === 'submission';
    list.push({
      stageKey: 'submission',
      stageName: '进件报审',
      stageOrder: 4,
      status: (relatedCase && relatedCase.stage !== 'pre_screen') ? 'completed' : isDocStage ? 'current' : 'pending',
      timestamp: relatedCase?.submittedAt || undefined,
      channelOrBank: relatedCase?.lenderBank || relatedCase?.lenderInstitution || '合作经办行',
      summaryText: relatedCase
        ? `已报审【${relatedCase.lenderBank || relatedCase.lenderInstitution} - ${relatedCase.productName}】，申报金额 ¥${relatedCase.appliedAmount}万`
        : '准备进件材料（身份证、流水、产调）报审银行',
      icon: <FileText className="w-3.5 h-3.5" />,
      iconBg: (relatedCase && relatedCase.stage !== 'pre_screen') ? 'bg-blue-100' : 'bg-slate-100',
      iconColor: (relatedCase && relatedCase.stage !== 'pre_screen') ? 'text-blue-700' : 'text-slate-400',
    });

    // 5. Site Interview & Bank Approval (下户面签 / 审批)
    const isApproved = relatedCase?.stage === 'approval' || relatedCase?.stage === 'disbursement' || relatedCase?.stage === 'post_loan';
    const isInterviewing = relatedCase?.stage === 'interview_visit';
    list.push({
      stageKey: 'approval',
      stageName: '面签审批',
      stageOrder: 5,
      status: isApproved ? 'completed' : isInterviewing ? 'current' : 'pending',
      timestamp: relatedCase?.disbursedAt || relatedCase?.submittedAt || undefined,
      summaryText: isApproved
        ? relatedCase?.approvedAmount || relatedCase?.appliedAmount
          ? `银行终审批复 ¥${relatedCase?.approvedAmount || relatedCase?.appliedAmount}万，利率 ${relatedCase?.interestRate || '—'}%`
          : '银行终审已批复，等待放款安排'
        : isInterviewing
        ? '银行客户经理已完成实地下户面签核身，等待终审出批复'
        : '银行风控下户实地核验与网点面签',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      iconBg: isApproved ? 'bg-emerald-100' : isInterviewing ? 'bg-amber-100' : 'bg-slate-100',
      iconColor: isApproved ? 'text-emerald-700' : isInterviewing ? 'text-amber-700' : 'text-slate-400',
    });

    // 6. Disbursement & Commission Settlement (放款结案)
    const isDisbursed = relatedCase?.stage === 'disbursement' || relatedCase?.stage === 'post_loan';
    list.push({
      stageKey: 'disbursement',
      stageName: '放款结案',
      stageOrder: 6,
      status: isDisbursed ? 'completed' : isApproved ? 'current' : 'pending',
      timestamp: isDisbursed ? (relatedCase?.disbursedAt || relatedCase?.submittedAt || undefined) : undefined,
      summaryText: isDisbursed
        ? `抵押登记完成，银行成功放款到公户，${relatedCase?.serviceFeeTotal ? `已结算助贷服务费 ¥${(relatedCase.serviceFeeTotal / 10000).toFixed(1)}万` : '服务费待财务确认结算'}`
        : '落实抵押登记/他项权证入库，银行放款并结算返佣',
      icon: <Coins className="w-3.5 h-3.5" />,
      iconBg: isDisbursed ? 'bg-emerald-100' : 'bg-slate-100',
      iconColor: isDisbursed ? 'text-emerald-700' : 'text-slate-400',
    });

    return list;
  }, [customer, relatedCase]);

  // Overall lifecycle summary metrics
  const completedCount = milestones.filter((m) => m.status === 'completed').length;
  const currentMilestone = milestones.find((m) => m.status === 'current') || milestones[milestones.length - 1];
  const progressPercent = Math.round((completedCount / milestones.length) * 100);

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-2xl border border-slate-200/90 p-3.5 sm:p-4 space-y-3">
      {/* Header with Title & Progress Meter */}
      <div className="flex items-center justify-between border-b border-slate-200/70 pb-2.5 flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-blue-600 text-white shadow-2xs">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-bold text-slate-900">客户生命周期与业务复盘全景图</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                当前节点: {currentMilestone.stageName}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              从公海/渠道获客录入至银行终审放款全流程链条追溯
            </p>
          </div>
        </div>

        {/* Progress Bar & Rate */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="text-right">
            <span className="text-[10px] text-slate-400">推进度: </span>
            <span className="font-bold text-blue-600 font-mono">{progressPercent}%</span>
          </div>
          <div className="w-20 bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Visual Timeline Stepper (Horizontal on Desktop, Stacked on Mobile) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-1.5 relative">
        {milestones.map((item, idx) => {
          const isCompleted = item.status === 'completed';
          const isCurrent = item.status === 'current';

          return (
            <div
              key={item.stageKey}
              className={`p-2.5 rounded-xl border transition relative flex flex-col justify-between ${
                isCurrent
                  ? 'bg-white border-blue-400 shadow-sm ring-2 ring-blue-500/20'
                  : isCompleted
                  ? 'bg-white/90 border-slate-200/90 hover:border-slate-300'
                  : 'bg-slate-50/50 border-slate-200/50 opacity-60'
              }`}
            >
              {/* Top Node Indicator & Stage Name */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${item.iconBg} ${item.iconColor}`}
                  >
                    {item.icon}
                  </div>

                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold font-mono ${
                      isCompleted
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : isCurrent
                        ? 'bg-blue-600 text-white animate-pulse'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isCompleted ? '已达成' : isCurrent ? '进行中' : `第${idx + 1}步`}
                  </span>
                </div>

                <div className="font-bold text-xs text-slate-800 flex items-center space-x-1">
                  <span>{item.stageName}</span>
                </div>

                {/* Brief Summary */}
                <p className="text-[10px] text-slate-500 leading-tight mt-1 line-clamp-2">
                  {item.summaryText}
                </p>
              </div>

              {/* Timestamp / Operator Footer */}
              <div className="mt-2 pt-1.5 border-t border-slate-100 text-[9px] text-slate-400 flex items-center justify-between">
                <span className="truncate">{item.timestamp ? item.timestamp.split(' ')[0] : '待推进'}</span>
                {item.operatorName && (
                  <span className="text-slate-600 font-medium truncate ml-1">{item.operatorName}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Case Key Details Quick Bar if active */}
      {relatedCase && (
        <div className="p-2.5 bg-white rounded-xl border border-slate-200/90 flex items-center justify-between text-xs flex-wrap gap-2">
          <div className="flex items-center space-x-2 text-slate-700">
            <Building className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="font-semibold">{relatedCase.lenderBank || relatedCase.lenderInstitution}</span>
            <span className="text-slate-400">·</span>
            <span>{relatedCase.productName}</span>
            <span className="text-slate-400">·</span>
            <span className="font-mono text-emerald-600 font-bold">
              申报 ¥{relatedCase.appliedAmount}万 {relatedCase.approvedAmount ? `(批复 ¥${relatedCase.approvedAmount}万)` : ''}
            </span>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center space-x-1 font-mono">
            <span>进件单号:</span>
            <strong className="text-slate-800">{relatedCase.caseNumber || relatedCase.id}</strong>
          </div>
        </div>
      )}
    </div>
  );
};
