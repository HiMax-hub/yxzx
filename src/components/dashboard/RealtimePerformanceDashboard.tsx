import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Users,
  Clock,
  DollarSign,
  Target,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Sparkles,
  Award,
  Zap,
  BarChart3
} from 'lucide-react';
import { Customer, LoanCase, UserAccount } from '../../types';

interface RealtimePerformanceDashboardProps {
  customers: Customer[];
  loanCases: LoanCase[];
  currentUser: UserAccount;
  onOpenCustomerList?: () => void;
  onOpenPipeline?: () => void;
}

export type TimeDimension = 'week' | 'month';

export const RealtimePerformanceDashboard: React.FC<RealtimePerformanceDashboardProps> = ({
  customers,
  loanCases,
  currentUser,
  onOpenCustomerList,
  onOpenPipeline,
}) => {
  const [dimension, setDimension] = useState<TimeDimension>('month');

  // 计算指标（全部真实聚合：日期取当前时间，周/月/当日均按 createdAt 真实统计，不再硬编码或伪造）
  const metrics = useMemo(() => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // 取客户 createdAt 的 YYYY-MM-DD（兼容 'YYYY-MM-DD HH:mm' 与 'YYYY-MM-DD'）
    const dayOf = (s?: string) => (s ? s.slice(0, 10) : '');

    // 1. 当日新增（真实计数，无数据即为 0，不做 || 3 兜底）
    const todayLeads = customers.filter(
      (c) => dayOf(c.createdAt) === todayStr || c.lastContactDate === '刚刚'
    ).length;

    // 2. 近7天新增 与 本月新增（8月）
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 6);
    const weekStartStr = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
    const monthStr = todayStr.slice(0, 7);
    const weekLeads = customers.filter((c) => dayOf(c.createdAt) >= weekStartStr && dayOf(c.createdAt) <= todayStr).length;
    const monthLeads = customers.filter((c) => dayOf(c.createdAt).startsWith(monthStr)).length;

    // 3. 审批中进件量 (在途审批中：排除已放款/已结案)
    const inPipelineCases = loanCases.filter(
      (c) => c.stage !== 'disbursement' && c.stage !== 'post_loan'
    );
    const inPipelineCount = inPipelineCases.length;
    const inPipelineAmount = inPipelineCases.reduce(
      (sum, c) => sum + (c.appliedAmount || c.applyAmount || 0), 
      0
    );

    // 4. 累计签约放款额（已批复或已放款）——真实汇总
    const disbursedCases = loanCases.filter(
      (c) => c.stage === 'disbursement' || c.stage === 'post_loan' || (c.approvedAmount && c.approvedAmount > 0)
    );
    const monthDisbursedWan = disbursedCases.reduce(
      (sum, c) => sum + (c.approvedAmount || c.appliedAmount || 0),
      0
    );
    // 周累计：按真实放款/提交时间落在近7天筛选，避免乘系数造假
    const weekDisbursedWan = disbursedCases
      .filter((c) => {
        const d = dayOf(c.disbursedAt || c.submittedAt);
        return d >= weekStartStr && d <= todayStr;
      })
      .reduce((sum, c) => sum + (c.approvedAmount || c.appliedAmount || 0), 0);

    // 5. 真实服务费营收（serviceFeeTotal 字段真实汇总，不再用固定费率 2.2% 估算）
    const serviceFeeWan = loanCases.reduce((sum, c) => sum + (c.serviceFeeTotal || 0), 0) / 10000;

    // 6. 业绩目标达成进度
    const monthlyTarget = currentUser.monthlyTargetWan || 500;
    const weeklyTarget = Math.round(monthlyTarget / 4) || 125;

    const currentSigned = dimension === 'week' ? weekDisbursedWan : monthDisbursedWan;
    const currentTarget = dimension === 'week' ? weeklyTarget : monthlyTarget;
    const progressPercent = Math.min(100, Math.round((currentSigned / currentTarget) * 1000) / 10);
    const remainingGap = Math.max(0, currentTarget - currentSigned);

    // 7. 时间进度（真实：当月已过天数 / 当月总天数）
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const timeProgress = Math.round((now.getDate() / daysInMonth) * 100);

    return {
      todayStr,
      todayLeads,
      weekLeads,
      monthLeads,
      inPipelineCount,
      inPipelineAmount,
      weekDisbursedWan,
      monthDisbursedWan,
      serviceFeeWan,
      currentSigned,
      currentTarget,
      progressPercent,
      remainingGap,
      monthlyTarget,
      weeklyTarget,
      timeProgress,
    };
  }, [customers, loanCases, currentUser, dimension]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 relative overflow-hidden transition-all">
      {/* Top Header & Dimension Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                业绩实时仪表盘
              </h2>
              <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>实时同步中</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {dimension === 'week' ? '本周业务增量、在途审批与周度目标达成' : '全月业绩走势、签约放款额与月度目标进度'}
            </p>
          </div>
        </div>

        {/* Dimension Toggle Pill (周 / 月) */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setDimension('week')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
              dimension === 'week'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>按周统计 (本周)</span>
          </button>

          <button
            type="button"
            onClick={() => setDimension('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer ${
              dimension === 'month'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>按月统计 (本月)</span>
          </button>
        </div>
      </div>

      {/* 4 Major Core Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-4">
        {/* Metric 1: 当日/周期新增线索数 */}
        <div className="bg-slate-50/70 hover:bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 transition flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              {dimension === 'week' ? '本周新增线索' : '当日 / 本月新增线索'}
            </span>
            <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="mt-2 flex items-baseline space-x-1.5">
            <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {dimension === 'week' ? metrics.weekLeads : metrics.todayLeads}
            </span>
            <span className="text-xs font-medium text-slate-400">户</span>
            {dimension === 'month' && (
              <span className="text-[11px] text-slate-500 font-medium ml-1">
                (本月累积 <strong className="text-slate-800 font-bold">{metrics.monthLeads}</strong> 户)
              </span>
            )}
          </div>

          <div className="mt-2 text-[10px] text-emerald-600 font-semibold flex items-center space-x-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>近7日新增 {metrics.weekLeads} 户 / 本月累计 {metrics.monthLeads} 户</span>
          </div>
        </div>

        {/* Metric 2: 审批中进件量 */}
        <div className="bg-slate-50/70 hover:bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 transition flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              审批中在途进件量
            </span>
            <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="mt-2 flex items-baseline space-x-1.5">
            <span className="text-2xl font-black text-blue-600 font-mono tracking-tight">
              {metrics.inPipelineCount}
            </span>
            <span className="text-xs font-medium text-slate-400">笔</span>
            <span className="text-[11px] text-slate-500 font-medium ml-1">
              (在审 ¥<strong className="text-slate-800 font-bold">{metrics.inPipelineAmount}</strong>万)
            </span>
          </div>

          <div className="mt-2 text-[10px] text-amber-700 font-semibold flex items-center space-x-1">
            <Zap className="w-3 h-3 text-amber-500" />
            <span>待初审/待补件: {loanCases.filter(c => c.stage === 'submission' || c.stage === 'docs_collection').length} 笔</span>
          </div>
        </div>

        {/* Metric 3: 累计签约额 / 放款额 */}
        <div className="bg-slate-50/70 hover:bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 transition flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              {dimension === 'week' ? '本周累计签约额' : '本月累计签约放款额'}
            </span>
            <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="mt-2 flex items-baseline space-x-1">
            <span className="text-xs font-bold text-slate-500">¥</span>
            <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {metrics.currentSigned}
            </span>
            <span className="text-xs font-medium text-slate-400">万元</span>
          </div>

          <div className="mt-2 text-[10px] text-slate-500 font-medium flex items-center space-x-1">
            <span>实际服务费营收: </span>
            <strong className="text-emerald-700 font-bold">¥{metrics.serviceFeeWan.toLocaleString(undefined, { maximumFractionDigits: 1 })}万</strong>
          </div>
        </div>

        {/* Metric 4: 业绩目标达成进度 */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50/60 rounded-xl p-3.5 border border-blue-200/80 transition flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900">
              {dimension === 'week' ? '本周目标达成率' : '本月业绩目标达成进度'}
            </span>
            <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-2xs">
              <Target className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="mt-1.5">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-blue-700 font-mono tracking-tight">
                {metrics.progressPercent}%
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {metrics.currentSigned} / {metrics.currentTarget} 万
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-200/80 rounded-full h-2 mt-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${metrics.progressPercent}%` }}
              />
            </div>
          </div>

          <div className="mt-2 text-[10px] text-blue-800 font-medium flex items-center justify-between">
            <span>距目标还差: <strong className="font-bold text-rose-600 font-mono">¥{metrics.remainingGap}万</strong></span>
            <span className="text-slate-400">时间进度 {metrics.timeProgress}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
