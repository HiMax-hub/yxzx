import React from 'react';
import {
  TrendingUp,
  Target,
  Coins,
  Flame,
  Clock,
  PhoneCall,
  Sparkles,
  Zap,
  ChevronRight,
  AlertTriangle,
  FileText,
  UserCheck,
  Award,
  ArrowUpRight,
} from 'lucide-react';
import { Customer, LoanCase, UserAccount, SystemConfig } from '../../types';
import { calculateConsultantCommission, DEFAULT_COMMISSION_TIERS } from '../../utils/calculator';

interface ConsultantWorkbenchDeckProps {
  currentUser: UserAccount;
  customers: Customer[];
  loanCases: LoanCase[];
  systemConfig?: SystemConfig;
  onNavigate: (nav: string) => void;
  onOpenCustomerDetail: (customer: Customer) => void;
  onStartCall: (customer: Customer) => void;
  onOpenWizard: () => void;
  onOpenQuickFollowUp: (customer: Customer, caseItem?: LoanCase, prefillTag?: string) => void;
}

export const ConsultantWorkbenchDeck: React.FC<ConsultantWorkbenchDeckProps> = ({
  currentUser,
  customers,
  loanCases,
  systemConfig,
  onNavigate,
  onOpenCustomerDetail,
  onStartCall,
  onOpenWizard,
  onOpenQuickFollowUp,
}) => {
  // 名下私海客户（排除公海）
  const myCustomers = customers.filter(
    (c) => (c.ownerId ? c.ownerId === currentUser.id : c.ownerName === currentUser.name) && c.status !== 'in_pool'
  );

  // 名下进件
  const myCases = loanCases.filter(
    (l) => (l.consultantId ? l.consultantId === currentUser.id : l.consultantName === currentUser.name)
  );

  // 当月放款总额 (万元)
  const disbursedCases = myCases.filter(
    (l) => l.stage === 'disbursement' || l.stage === 'post_loan' || l.approvedAmount
  );
  const totalDisbursedWan = disbursedCases.reduce(
    (sum, l) => sum + (l.approvedAmount || l.appliedAmount || 0),
    0
  );

  // 目标达成率
  const monthlyTargetWan = currentUser.monthlyTargetWan || 500;
  const achievementRate = Math.min(100, Math.round((totalDisbursedWan / monthlyTargetWan) * 100));

  // 阶梯提成计算
  const tiers = systemConfig?.commissionTiers?.length
    ? systemConfig.commissionTiers
    : DEFAULT_COMMISSION_TIERS;
  const myReceivedFees = myCases.reduce(
    (sum, l) => sum + (l.serviceFeeDepositPaid || 0) + (l.serviceFeeBalancePaid || 0),
    0
  );
  const commissionResult = calculateConsultantCommission(myReceivedFees, totalDisbursedWan, tiers);

  // 下一档阶梯差距
  const currentTierIndex = tiers.findIndex(
    (t) => totalDisbursedWan >= t.minWan && (t.maxWan >= 9999 || totalDisbursedWan < t.maxWan)
  );
  const nextTier = currentTierIndex !== -1 && currentTierIndex < tiers.length - 1 ? tiers[currentTierIndex + 1] : null;
  const diffToNextTierWan = nextTier ? Math.max(0, nextTier.minWan - totalDisbursedWan) : 0;

  // 高意向 S/A 级重点跟进客户
  const highIntentCustomers = myCustomers.filter((c) => c.grade === 'S' || c.grade === 'A');

  // 即将掉入公海的预警客户（3天未跟进）
  const atRiskCustomers = myCustomers.filter(
    (c) => c.lastContactDate?.includes('前') || c.status === 'in_pool' || (c.poolReturnCountdownDays !== undefined && c.poolReturnCountdownDays <= 3)
  ).slice(0, 3);

  return (
    <div className="space-y-4">
      {/* 1. 业务员个人战报与阶梯提成冲刺卡 (Sales Sprint Deck) - 浅色化现代设计 */}
      <div className="bg-white border border-slate-200/90 shadow-xs rounded-2xl p-5 sm:p-6 relative overflow-hidden">
        {/* 背景装饰光效 */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* 左侧：放款进度与提成阶梯 */}
          <div className="space-y-3 flex-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center space-x-1">
                <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span>顾问当月业绩看板</span>
              </span>
              <span className="text-xs text-slate-500 font-medium">
                月度个人目标: ¥{monthlyTargetWan} 万元
              </span>
            </div>

            <div className="flex items-baseline space-x-3">
              <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-slate-900">
                ¥{totalDisbursedWan.toLocaleString()}
              </span>
              <span className="text-sm text-slate-500 font-sans">
                万元 (达成率 <strong className="text-blue-700 text-base">{achievementRate}%</strong>)
              </span>
            </div>

            {/* 达成进度条 */}
            <div className="space-y-1.5 max-w-xl">
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(5, achievementRate))}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>起步 0万</span>
                {nextTier && diffToNextTierWan > 0 ? (
                  <span className="text-amber-700 font-semibold">
                    再放款 ¥{diffToNextTierWan}万 解锁【{nextTier.tierName} {nextTier.rate}%点位】
                  </span>
                ) : (
                  <span className="text-emerald-700 font-semibold">已解锁最高【卓越档 30%】提成点位！</span>
                )}
                <span>目标 {monthlyTargetWan}万</span>
              </div>
            </div>
          </div>

          {/* 右侧：预计个人提成与快捷操作 */}
          <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-4 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6">
            <div className="text-left lg:text-right">
              <div className="text-xs text-slate-500 font-medium flex items-center lg:justify-end space-x-1">
                <Coins className="w-3.5 h-3.5 text-amber-500" />
                <span>当月预计应发提成</span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-600 mt-1">
                ¥{commissionResult.commissionAmount.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                当前点位: <span className="font-bold text-slate-900">{commissionResult.rate}%</span> ({commissionResult.tierName})
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={onOpenWizard}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>录入新客户</span>
              </button>
              <button
                onClick={() => onNavigate('pipeline')}
                className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition flex items-center space-x-1 cursor-pointer"
              >
                <span>跟进进件</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 顾问重点关注两栏：高意向私海待跟进池 + 掉公海预警 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 左栏：高意向私海待跟进池 */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                <Flame className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                名下高意向私海客户 ({highIntentCustomers.length})
              </h3>
            </div>
            <button
              onClick={() => onNavigate('crm')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-0.5 cursor-pointer"
            >
              <span>查看全部</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {highIntentCustomers.slice(0, 4).map((c) => (
              <div
                key={c.id}
                className="p-3 bg-slate-50 hover:bg-blue-50/50 rounded-xl border border-slate-200/70 transition flex items-center justify-between gap-2"
              >
                <div
                  className="cursor-pointer flex-1 min-w-0"
                  onClick={() => onOpenCustomerDetail(c)}
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-xs truncate">{c.name}</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      c.grade === 'S' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {c.grade}级意向
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                      {c.phone}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                    需求: {c.requestedAmount ? `${c.requestedAmount}万` : '待测算'} · {c.property?.hasProperty ? '有房抵押' : '信用贷'} · {c.followUps?.length ? `跟进${c.followUps.length}次` : '今日未跟进'}
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  <button
                    onClick={() => onStartCall(c)}
                    className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shadow-2xs flex items-center space-x-1 cursor-pointer"
                    title="一键拨号"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span className="text-[11px] hidden sm:inline">外呼</span>
                  </button>
                  <button
                    onClick={() => onOpenQuickFollowUp(c)}
                    className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[11px] font-medium transition cursor-pointer"
                    title="快捷登记跟进小结"
                  >
                    记录
                  </button>
                </div>
              </div>
            ))}

            {highIntentCustomers.length === 0 && (
              <div className="py-6 text-center text-xs text-slate-400">
                暂无高意向客户，建议从公海线索池认领新线索
              </div>
            )}
          </div>
        </div>

        {/* 右栏：掉公海倒计时保护预警 */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                私海客户掉保预警
              </h3>
            </div>
            <span className="text-[11px] text-amber-600 font-semibold">
              超期未跟进将自动释放至公海
            </span>
          </div>

          <div className="space-y-2">
            {atRiskCustomers.map((c) => (
              <div
                key={c.id}
                className="p-3 bg-amber-50/40 rounded-xl border border-amber-200/70 flex items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-xs">{c.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded font-semibold">
                      倒计时 ≤ 2天
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    上次跟进: {c.lastContactDate || '7天前'} · 立即跟进刷新保护期
                  </p>
                </div>

                <button
                  onClick={() => onStartCall(c)}
                  className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow-2xs flex items-center space-x-1 cursor-pointer shrink-0"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>立即跟进</span>
                </button>
              </div>
            ))}

            {atRiskCustomers.length === 0 && (
              <div className="py-6 text-center text-xs text-emerald-600 font-medium flex items-center justify-center space-x-1">
                <UserCheck className="w-4 h-4" />
                <span>名下私海客户均在安全保护期内，维护良好！</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
