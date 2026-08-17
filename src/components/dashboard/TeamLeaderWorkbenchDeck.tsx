import React from 'react';
import {
  Users,
  TrendingUp,
  Target,
  Clock,
  AlertTriangle,
  Award,
  ArrowUpRight,
  Flame,
  CheckCircle2,
  PhoneCall,
  Send,
  Sparkles,
  ChevronRight,
  GitPullRequestDraft,
  Coins,
} from 'lucide-react';
import { Customer, LoanCase, UserAccount, SystemConfig } from '../../types';
import { TeamLeaderboardCard } from './TeamLeaderboardCard';
import { PublicPoolAlertCard } from './PublicPoolAlertCard';
import { DepartmentPerformanceStackedChart } from './DepartmentPerformanceStackedChart';

interface TeamLeaderWorkbenchDeckProps {
  currentUser: UserAccount;
  users: UserAccount[];
  customers: Customer[];
  loanCases: LoanCase[];
  systemConfig?: SystemConfig;
  onNavigate: (nav: string) => void;
  onOpenCustomerDetail: (customer: Customer) => void;
  onStartCall: (customer: Customer) => void;
  setPendingPoolFilter: (filter: string | null) => void;
  onOpenExpediteModal: (loanCase: LoanCase, customer?: Customer) => void;
}

export const TeamLeaderWorkbenchDeck: React.FC<TeamLeaderWorkbenchDeckProps> = ({
  currentUser,
  users,
  customers,
  loanCases,
  systemConfig,
  onNavigate,
  onOpenCustomerDetail,
  onStartCall,
  setPendingPoolFilter,
  onOpenExpediteModal,
}) => {
  // 顾问列表
  const consultants = users.filter((u) => u.role === 'consultant');

  // 全团队当月放款总额 (万元)
  const disbursedCases = loanCases.filter(
    (l) => l.stage === 'disbursement' || l.stage === 'post_loan' || l.approvedAmount
  );
  const totalTeamDisbursedWan = disbursedCases.reduce(
    (sum, l) => sum + (l.approvedAmount || l.appliedAmount || 0),
    0
  );

  // 团队月度总目标
  const teamTargetWan = systemConfig?.monthlyTeamTargetWan || currentUser.monthlyTargetWan || 3500;
  const teamAchievementRate = Math.min(100, Math.round((totalTeamDisbursedWan / teamTargetWan) * 100));

  // 团队总服务费创收 (元)
  const totalServiceFeeRevenue = loanCases.reduce(
    (sum, l) => sum + (l.serviceFeeTotal || 0),
    0
  );

  // 人均出单放款产能 (万元/人)
  const perCapitaDisbursedWan = consultants.length > 0
    ? Math.round((totalTeamDisbursedWan / consultants.length) * 10) / 10
    : 0;

  // 滞留超期进件（在途进件中超过48小时未推进的案卷，供主管督办）
  const stuckCases = loanCases.filter(
    (l) => l.stage !== 'disbursement' && l.stage !== 'post_loan' && (l.stage === 'submission' || l.stage === 'docs_collection')
  ).slice(0, 4);

  return (
    <div className="space-y-5">
      {/* 1. 团队主管战略指挥舱大屏 (Team Management Master Deck) */}
      <div className="bg-gradient-to-br from-indigo-50/80 via-white to-blue-50/50 text-slate-900 rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden border border-indigo-200/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 flex-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center space-x-1">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>销售部团队经营作战大盘</span>
              </span>
              <span className="text-xs text-slate-600 font-medium">
                主管: {currentUser.name} ({consultants.length} 位在编顾问)
              </span>
            </div>

            <div className="flex items-baseline space-x-4">
              <div>
                <span className="text-xs text-slate-500 block mb-0.5">全组实收放款总额</span>
                <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-slate-900">
                  ¥{totalTeamDisbursedWan.toLocaleString()}
                </span>
                <span className="text-sm text-slate-600 font-sans ml-1">万元</span>
              </div>
              <div className="pl-4 border-l border-slate-200">
                <span className="text-xs text-slate-500 block mb-0.5">总目标达成率</span>
                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600">
                  {teamAchievementRate}%
                </span>
              </div>
            </div>

            {/* 团队进度条 */}
            <div className="space-y-1.5 max-w-xl">
              <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden p-0.5 border border-slate-300/60">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(5, teamAchievementRate))}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-600">
                <span>月度放款目标: ¥{teamTargetWan} 万元</span>
                <span>人均产能: ¥{perCapitaDisbursedWan} 万/人</span>
              </div>
            </div>
          </div>

          {/* 右侧：关键指标汇总与快捷动作 */}
          <div className="grid grid-cols-2 gap-3 lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-200 pt-4 lg:pt-0 lg:pl-6">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-[11px] text-slate-500 font-medium">团队服务费创收</div>
              <div className="text-lg font-bold font-mono text-indigo-700 mt-1">
                ¥{Math.round(totalServiceFeeRevenue / 10000)} 万元
              </div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-[11px] text-slate-500 font-medium">在途审批工单</div>
              <div className="text-lg font-bold font-mono text-amber-700 mt-1">
                {loanCases.filter(l => l.stage !== 'disbursement' && l.stage !== 'post_loan').length} 笔
              </div>
            </div>
            <button
              onClick={() => onNavigate('crm')}
              className="col-span-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>分配公海线索给组员</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. 团队成员业绩排行榜 (Leaderboard) */}
      <TeamLeaderboardCard
        currentUser={currentUser}
        loanCases={loanCases}
        customers={customers}
        users={users}
      />

      {/* 3. 团队进件滞留风险督办台 + 公海线索池预警 (Two Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 进件滞留督办台 */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                团队在途进件停滞督办池 ({stuckCases.length})
              </h3>
            </div>
            <span className="text-[11px] text-amber-600 font-semibold">
              主管一键催办责任人
            </span>
          </div>

          <div className="space-y-2">
            {stuckCases.map((c) => (
              <div
                key={c.id}
                className="p-3 bg-slate-50 hover:bg-amber-50/40 rounded-xl border border-slate-200/70 transition flex items-center justify-between gap-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-xs truncate">{c.customerName}</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded font-semibold">
                      {c.stage === 'docs_collection' ? '待补件' : '报审中'}
                    </span>
                    <span className="text-slate-500 text-xs font-mono">¥{c.appliedAmount}万</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                    顾问: <strong className="text-slate-700">{c.consultantName}</strong> · 产品: {c.productName}
                  </div>
                </div>

                <button
                  onClick={() => onOpenExpediteModal(c)}
                  className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow-2xs flex items-center space-x-1 cursor-pointer shrink-0"
                >
                  <Send className="w-3 h-3" />
                  <span>督办催办</span>
                </button>
              </div>
            ))}

            {stuckCases.length === 0 && (
              <div className="py-6 text-center text-xs text-emerald-600 font-medium flex items-center justify-center space-x-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>全团队暂无滞留超时工单，流转通畅！</span>
              </div>
            )}
          </div>
        </div>

        {/* 公海线索流转与分配卡片 */}
        <PublicPoolAlertCard
          customers={customers}
          onNavigateToPool={(filter) => {
            setPendingPoolFilter(filter || 'in_pool');
            onNavigate('crm');
          }}
        />
      </div>

      {/* 4. 部门业绩完成率堆叠图 */}
      <DepartmentPerformanceStackedChart
        customers={customers}
        loanCases={loanCases}
        currentUser={currentUser}
        users={users}
        onNavigateToCRM={() => onNavigate('crm')}
        onNavigateToPipeline={() => onNavigate('pipeline')}
      />
    </div>
  );
};
