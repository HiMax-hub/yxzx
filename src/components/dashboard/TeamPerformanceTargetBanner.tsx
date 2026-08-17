import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  TrendingUp, 
  Target, 
  ArrowUpRight, 
  ArrowRight, 
  Sparkles, 
  Coins, 
  ChevronRight,
  PieChart,
  Award,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import { LoanCase, UserAccount, SystemConfig, Customer } from '../../types';
import { PerformanceContributionModal } from './PerformanceContributionModal';

interface TeamPerformanceTargetBannerProps {
  loanCases: LoanCase[];
  customers: Customer[];
  users: UserAccount[];
  currentUser: UserAccount;
  systemConfig?: SystemConfig;
}

export const TeamPerformanceTargetBanner: React.FC<TeamPerformanceTargetBannerProps> = ({
  loanCases,
  customers,
  users,
  currentUser,
  systemConfig,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 聚合当月团队放款数据
  const performance = useMemo(() => {
    // 已放款工单（真实数据源：stage 为 disbursement 或 post_loan，或者已批复有效放款）
    const disbursedCases = loanCases.filter(
      (c) => c.stage === 'disbursement' || c.stage === 'post_loan' || (c.approvedAmount && c.approvedAmount > 0)
    );

    // 当月团队实际放款总额 (万元)
    const currentDisbursedWan = disbursedCases.reduce(
      (sum, c) => sum + (c.approvedAmount || c.appliedAmount || 0),
      0
    );

    // 团队目标金额 (万元)：优先系统总控配置，缺省汇总各顾问目标或默认 5000 万
    const targetWan = systemConfig?.monthlyTeamTargetWan || 
      users.filter(u => u.role === 'consultant').reduce((sum, u) => sum + (u.monthlyTargetWan || 0), 0) || 
      5000;

    // 达成百分比
    const progressPercent = targetWan > 0 ? Math.round((currentDisbursedWan / targetWan) * 1000) / 10 : 0;
    const remainingWan = Math.max(0, targetWan - currentDisbursedWan);

    // 累计服务费创收
    const serviceFeeTotalYuan = disbursedCases.reduce((sum, c) => sum + (c.serviceFeeTotal || 0), 0);

    // 日历时间进度计算
    const now = new Date();
    const currentDay = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const calendarPacingPercent = Math.round((currentDay / daysInMonth) * 100);
    const pacingDiff = Math.round((progressPercent - calendarPacingPercent) * 10) / 10;

    // 状态健康度判定
    const isPacingAhead = pacingDiff >= 0;
    const isCompleted = progressPercent >= 100;

    // 在途审批中总额
    const inPipelineWan = loanCases
      .filter((c) => c.stage !== 'disbursement' && c.stage !== 'post_loan')
      .reduce((sum, c) => sum + (c.appliedAmount || c.applyAmount || 0), 0);

    return {
      currentDisbursedWan,
      targetWan,
      progressPercent,
      remainingWan,
      serviceFeeTotalYuan,
      disbursedCount: disbursedCases.length,
      calendarPacingPercent,
      pacingDiff,
      isPacingAhead,
      isCompleted,
      inPipelineWan,
      currentMonth: now.getMonth() + 1,
    };
  }, [loanCases, systemConfig, users]);

  return (
    <>
      <div 
        onClick={() => setIsModalOpen(true)}
        className="group relative bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-blue-200/80 hover:border-blue-400 hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden"
      >
        {/* Subtle Background Accent Gradient */}
        <div className="absolute top-0 right-0 w-80 h-40 bg-gradient-to-bl from-blue-50/80 via-indigo-50/40 to-transparent rounded-bl-full pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-40 h-20 bg-amber-50/50 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left Column: Title & Key Target Numbers */}
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>{performance.currentMonth} 月团队放款业绩总控</span>
              </div>

              {performance.isCompleted ? (
                <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold animate-pulse">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>已提前超额达成目标！</span>
                </span>
              ) : performance.isPacingAhead ? (
                <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                  <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                  <span>进度超前日历 +{performance.pacingDiff}%</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
                  <Zap className="w-3 h-3 text-amber-600" />
                  <span>滞后日历进度 {Math.abs(performance.pacingDiff)}%，冲刺在审中</span>
                </span>
              )}
            </div>

            {/* Core Scale Presentation */}
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <div className="flex items-baseline space-x-1">
                <span className="text-xs text-slate-500 font-medium">团队本月放款:</span>
                <span className="text-sm text-blue-600 font-bold">¥</span>
                <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
                  {performance.currentDisbursedWan.toLocaleString()}
                </span>
                <span className="text-xs text-slate-500 font-medium">万</span>
              </div>

              <span className="text-slate-300 font-light">/</span>

              <div className="flex items-baseline space-x-1 text-slate-600 text-xs sm:text-sm">
                <span className="text-slate-500">目标额度</span>
                <span className="font-mono font-bold text-slate-800">¥{performance.targetWan}万</span>
              </div>

              <div className="text-xs text-slate-600 ml-auto lg:ml-2">
                距目标差 <strong className="text-amber-600 font-mono font-bold">¥{performance.remainingWan.toLocaleString()}万</strong>
              </div>
            </div>

            {/* Dynamic Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                <div className="flex items-center space-x-2">
                  <span className="text-slate-700 font-bold">达成百分比:</span>
                  <span className="text-lg font-black text-blue-700 font-mono tracking-tight">
                    {performance.progressPercent}%
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  自然时间进度 {performance.calendarPacingPercent}% · 已放款 {performance.disbursedCount} 笔
                </span>
              </div>

              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200/80 relative">
                <div
                  className="bg-gradient-to-r from-blue-500 via-indigo-500 to-amber-500 h-2.5 rounded-full transition-all duration-700 shadow-2xs"
                  style={{ width: `${Math.min(100, performance.progressPercent)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Fast KPI Metrics & Breakdown Entry Button */}
          <div className="flex lg:flex-col items-center lg:items-end justify-between gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
            <div className="flex items-center space-x-4 lg:space-x-3 text-right">
              <div>
                <div className="text-[10px] text-slate-500">服务费创收</div>
                <div className="text-xs sm:text-sm font-bold text-emerald-700 font-mono">
                  ¥{(performance.serviceFeeTotalYuan / 10000).toLocaleString(undefined, { maximumFractionDigits: 1 })}万
                </div>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <div>
                <div className="text-[10px] text-slate-500">在途审批蓄水</div>
                <div className="text-xs sm:text-sm font-bold text-blue-700 font-mono">
                  ¥{performance.inPipelineWan.toLocaleString()}万
                </div>
              </div>
            </div>

            {/* Click To Open Breakdown Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 active:scale-95 text-blue-700 text-xs font-bold transition flex items-center space-x-1.5 border border-blue-200 shadow-2xs cursor-pointer"
            >
              <PieChart className="w-3.5 h-3.5 text-blue-600" />
              <span>查看业绩贡献拆解</span>
              <ChevronRight className="w-3.5 h-3.5 text-blue-500 group-hover:translate-x-0.5 transition" />
            </button>
          </div>
        </div>
      </div>

      {/* Detailed Contribution Breakdown Modal */}
      <PerformanceContributionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        loanCases={loanCases}
        customers={customers}
        users={users}
        currentUser={currentUser}
        systemConfig={systemConfig}
      />
    </>
  );
};
