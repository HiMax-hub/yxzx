import React from 'react';
import { PieChart as PieIcon, TrendingUp, Users, GitPullRequestDraft } from 'lucide-react';
import { Customer, LoanCase, ChannelSource } from '../../types';

interface ChannelAnalysisCardProps {
  customers: Customer[];
  loanCases: LoanCase[];
}

// 渠道中文映射与颜色
const CHANNEL_META: Record<ChannelSource, { label: string; color: string; bg: string; emoji: string }> = {
  telemarketing: { label: '电话外呼', color: 'text-blue-700', bg: 'bg-blue-100', emoji: '📞' },
  referral: { label: '老客转介绍', color: 'text-emerald-700', bg: 'bg-emerald-100', emoji: '🤝' },
  channel_agent: { label: '渠道合作', color: 'text-purple-700', bg: 'bg-purple-100', emoji: '🏢' },
  landing_page: { label: '线上落地页', color: 'text-amber-700', bg: 'bg-amber-100', emoji: '🌐' },
  self_developed: { label: '自主开发', color: 'text-rose-700', bg: 'bg-rose-100', emoji: '🎯' },
};

export const ChannelAnalysisCard: React.FC<ChannelAnalysisCardProps> = ({
  customers,
  loanCases,
}) => {
  const channels = Object.keys(CHANNEL_META) as ChannelSource[];
  const totalCustomers = customers.length;

  const stats = channels.map((ch) => {
    const channelCusts = customers.filter((c) => c.channel === ch);
    const count = channelCusts.length;
    const ratio = totalCustomers > 0 ? Math.round((count / totalCustomers) * 100) : 0;
    // 渠道进件转化：该渠道客户中有进件的比例
    const withCase = channelCusts.filter((c) => loanCases.some((l) => l.customerId === c.id)).length;
    const caseRate = count > 0 ? Math.round((withCase / count) * 100) : 0;
    // 高意向率（S/A级）
    const highIntent = channelCusts.filter((c) => c.grade === 'S' || c.grade === 'A').length;
    const highIntentRate = count > 0 ? Math.round((highIntent / count) * 100) : 0;
    return { ch, count, ratio, caseRate, highIntentRate, meta: CHANNEL_META[ch] };
  }).sort((a, b) => b.count - a.count);

  const totalCases = loanCases.length;
  const overallCaseRate = totalCustomers > 0 ? Math.round((totalCases / totalCustomers) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center">
              <PieIcon className="w-3.5 h-3.5" />
            </div>
            <span>获客渠道转化分析</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">各渠道获客量 · 进件转化率 · 高意向占比（管理层获客 ROI 视图）</p>
        </div>
        <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
          全司进件转化率 {overallCaseRate}%
        </span>
      </div>

      <div className="space-y-2">
        {totalCustomers === 0 ? (
          <div className="py-8 text-center">
            <Users className="w-8 h-8 text-slate-200 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-500">暂无获客数据</p>
            <p className="text-[10px] text-slate-400 mt-1">录入客户并标记获客渠道后，这里将展示各渠道转化对比</p>
          </div>
        ) : (
        stats.map((s) => (
          <div key={s.ch} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:border-purple-200 transition">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-[11px]">
                <span>{s.meta.emoji}</span>
                <span className="font-bold text-slate-800">{s.meta.label}</span>
                <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${s.meta.bg} ${s.meta.color}`}>
                  {s.count} 位 ({s.ratio}%)
                </span>
              </div>
              <div className="flex items-center gap-2 text-[9px] text-slate-500">
                <span className="flex items-center gap-0.5">
                  <GitPullRequestDraft className="w-2.5 h-2.5" />
                  进件转化 <strong className={s.caseRate >= 30 ? 'text-emerald-600' : 'text-slate-700'}>{s.caseRate}%</strong>
                </span>
                <span className="flex items-center gap-0.5">
                  <TrendingUp className="w-2.5 h-2.5" />
                  高意向 <strong className={s.highIntentRate >= 50 ? 'text-purple-600' : 'text-slate-700'}>{s.highIntentRate}%</strong>
                </span>
              </div>
            </div>
            {/* 渠道占比条 */}
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all"
                style={{ width: `${Math.max(s.ratio, s.count > 0 ? 6 : 0)}%` }}
              />
            </div>
          </div>
        )))}
      </div>

      <div className="mt-3 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100 text-[10px] text-slate-500 flex items-start gap-1.5">
        <Users className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>
          <strong className="text-slate-700">渠道策略提示: </strong>
          {stats[0] && stats[0].caseRate >= 30
            ? `${stats[0].meta.label}渠道进件转化率最高 (${stats[0].caseRate}%)，建议加大该渠道投放预算。`
            : '当前各渠道进件转化偏弱，建议重点跟进高意向客户并复盘话术有效性。'}
        </span>
      </div>
    </div>
  );
};
