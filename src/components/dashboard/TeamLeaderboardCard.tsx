import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  TrendingUp, 
  Users, 
  Medal, 
  Sparkles, 
  ArrowUpRight, 
  Clock, 
  CheckCircle,
  Flame,
  Award
} from 'lucide-react';
import { UserAccount, LoanCase, Customer } from '../../types';

interface TeamLeaderboardCardProps {
  currentUser: UserAccount;
  loanCases: LoanCase[];
  customers: Customer[];
  users: UserAccount[];
}

export const TeamLeaderboardCard: React.FC<TeamLeaderboardCardProps> = ({
  currentUser,
  loanCases,
  customers,
  users,
}) => {
  const [activeMetric, setActiveMetric] = useState<'disbursed' | 'leads'>('disbursed');

  // 真实业绩排行：基于 users 中的业务顾问，用 consultantId/ownerId 外键聚合真实数据
  const teamMembers = useMemo(() => {
    const avatarBgs = ['bg-amber-500', 'bg-blue-600', 'bg-emerald-600', 'bg-purple-600', 'bg-rose-500', 'bg-cyan-600'];
    return users
      .filter((u) => u.role === 'consultant')
      .map((u, idx) => {
        const myCases = loanCases.filter((l) => (l.consultantId ? l.consultantId === u.id : l.consultantName === u.name));
        const myCusts = customers.filter((c) => (c.ownerId ? c.ownerId === u.id : c.ownerName === u.name));
        const disbursedWan = myCases
          .filter((l) => l.stage === 'disbursement' || l.stage === 'post_loan' || l.approvedAmount)
          .reduce((sum, l) => sum + (l.approvedAmount || l.appliedAmount || 0), 0);
        const inPipeline = myCases.filter((l) => l.stage !== 'disbursement' && l.stage !== 'post_loan').length;
        const leadsCount = myCusts.filter((c) => c.status !== 'in_pool').length;
        const targetWan = u.monthlyTargetWan || 0;
        const conversionRate = leadsCount > 0
          ? `${Math.round((myCusts.filter((c) => c.grade === 'S' || c.grade === 'A').length / leadsCount) * 1000) / 10}%`
          : '0%';
        return {
          id: u.id,
          name: u.name,
          roleTitle: u.roleTitle || '业务顾问',
          department: u.department || '助贷业务部',
          avatarBg: avatarBgs[idx % avatarBgs.length],
          monthlyTargetWan: targetWan,
          disbursedAmountWan: Math.round(disbursedWan * 10) / 10,
          intakeLeadsCount: leadsCount,
          inPipelineCases: inPipeline,
          conversionRate,
          isCurrentUser: currentUser.id === u.id,
        };
      })
      .filter((m) => m.intakeLeadsCount > 0 || m.disbursedAmountWan > 0 || m.inPipelineCases > 0);
  }, [users, loanCases, customers, currentUser]);

  // Sort list according to selected metric
  const sortedList = [...teamMembers].sort((a, b) => {
    if (activeMetric === 'disbursed') {
      return b.disbursedAmountWan - a.disbursedAmountWan;
    } else {
      return b.intakeLeadsCount - a.intakeLeadsCount;
    }
  });

  const maxVal = activeMetric === 'disbursed'
    ? Math.max(1, ...sortedList.map(m => m.disbursedAmountWan))
    : Math.max(1, ...sortedList.map(m => m.intakeLeadsCount));

  // Find current user rank
  const myRankIndex = sortedList.findIndex(m => m.isCurrentUser);
  const myRank = myRankIndex !== -1 ? myRankIndex + 1 : 2;
  const myData = sortedList[myRankIndex] || sortedList[1];

  // 动态计算与第1名的差距（按当前榜单口径）
  const top1Data = sortedList[0];
  const myMetricVal = activeMetric === 'disbursed' ? (myData?.disbursedAmountWan || 0) : (myData?.intakeLeadsCount || 0);
  const top1MetricVal = activeMetric === 'disbursed' ? (top1Data?.disbursedAmountWan || 0) : (top1Data?.intakeLeadsCount || 0);
  const gapToTop1 = Math.max(0, Math.round((top1MetricVal - myMetricVal) * 10) / 10);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4.5 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-1.5">
                <span>本月团队业务英雄风云榜</span>
                <span className="flex items-center gap-0.5 text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.2 rounded-full border border-amber-200">
                  <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                  实时战报
                </span>
              </h2>
              <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  数据更新频率：实时同步 (基于进件与客户数据自动聚合)
                </span>
                <span>·</span>
                <span className="text-slate-500">增强协作氛围与良性竞争</span>
              </div>
            </div>
          </div>
        </div>

        {/* Metric Switch Tabs */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-semibold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveMetric('disbursed')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center space-x-1.5 ${
              activeMetric === 'disbursed'
                ? 'bg-white text-blue-600 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>放款完成额榜</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMetric('leads')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center space-x-1.5 ${
              activeMetric === 'leads'
                ? 'bg-white text-blue-600 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>进件获客量榜</span>
          </button>
        </div>
      </div>

      {/* Leaderboard Table / Cards */}
      <div className="space-y-2.5">
        {sortedList.length === 0 ? (
          <div className="py-10 text-center">
            <Trophy className="w-8 h-8 text-slate-200 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600">暂无业务顾问业绩数据</p>
            <p className="text-xs text-slate-400 mt-1">创建顾问账号并产生客户/进件后，这里将自动生成团队排行</p>
          </div>
        ) : sortedList.map((member, index) => {
          const rank = index + 1;
          const isTop1 = rank === 1;
          const isTop2 = rank === 2;
          const isTop3 = rank === 3;
          const val = activeMetric === 'disbursed' ? member.disbursedAmountWan : member.intakeLeadsCount;
          const pct = Math.round((val / maxVal) * 100);
          const targetPct = Math.round((member.disbursedAmountWan / member.monthlyTargetWan) * 100);

          return (
            <div
              key={member.id}
              className={`p-3 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                member.isCurrentUser
                  ? 'bg-blue-50/50 border-blue-300 ring-1 ring-blue-300/60'
                  : isTop1
                  ? 'bg-amber-50/30 border-amber-200'
                  : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/60'
              }`}
            >
              {/* Left: Rank & Avatar & Name */}
              <div className="flex items-center space-x-3">
                {/* Rank Badge */}
                <div className="w-7 h-7 shrink-0 flex items-center justify-center font-bold text-xs">
                  {isTop1 ? (
                    <span className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-400 to-amber-300 text-amber-900 flex items-center justify-center shadow-xs text-xs font-black ring-2 ring-amber-200">
                      🥇
                    </span>
                  ) : isTop2 ? (
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-black ring-2 ring-slate-300">
                      🥈
                    </span>
                  ) : isTop3 ? (
                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-black ring-2 ring-amber-200">
                      🥉
                    </span>
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[11px] font-mono font-bold">
                      {rank}
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full ${member.avatarBg} text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0`}>
                  {member.name.slice(0, 1)}
                </div>

                {/* Name & Role */}
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-xs sm:text-sm text-slate-900">{member.name}</span>
                    {member.isCurrentUser && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-600 text-white">
                        我
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 font-normal">
                      {member.department}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2">
                    <span>月目标: ¥{member.monthlyTargetWan}万</span>
                    <span>·</span>
                    <span className="text-emerald-600 font-medium">达成率: {targetPct}%</span>
                  </div>
                </div>
              </div>

              {/* Right: Value & Progress Bar */}
              <div className="flex items-center justify-between sm:justify-end space-x-4 pl-10 sm:pl-0">
                <div className="w-24 sm:w-36 space-y-1">
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isTop1 ? 'bg-amber-500' : member.isCurrentUser ? 'bg-blue-600' : 'bg-slate-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="text-right shrink-0 min-w-[90px]">
                  {activeMetric === 'disbursed' ? (
                    <div>
                      <div className="font-mono font-black text-sm text-slate-900 flex items-baseline justify-end gap-0.5">
                        <span className="text-xs font-normal text-slate-400">¥</span>
                        <span>{member.disbursedAmountWan}</span>
                        <span className="text-[10px] font-normal text-slate-400">万</span>
                      </div>
                      <div className="text-[10px] text-slate-400">获客 {member.intakeLeadsCount} 户</div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-mono font-black text-sm text-blue-700 flex items-baseline justify-end gap-0.5">
                        <span>{member.intakeLeadsCount}</span>
                        <span className="text-[10px] font-normal text-slate-400">户获客</span>
                      </div>
                      <div className="text-[10px] text-slate-400">放款 ¥{member.disbursedAmountWan}万</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom User Comparison Banner */}
      <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50/60 rounded-xl border border-blue-200/80 flex items-center justify-between text-xs text-blue-900">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            您当前在全团队中位列 <strong>第 {myRank} 名</strong>
            {myRank === 1 ? '，独占鳌头，遥遥领先！' : myRank === 2 ? `，距第1名仅差 ${gapToTop1 > 0 ? `¥${gapToTop1}万` : '一步之遥'}，冲刺月度销冠！` : '，继续加油冲刺更高业绩提成档位！'}
          </span>
        </div>
        <div className="text-[11px] font-bold text-blue-700 shrink-0 hidden sm:block">
          昨日结算已入库
        </div>
      </div>
    </div>
  );
};
