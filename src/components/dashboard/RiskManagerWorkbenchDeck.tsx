import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Clock,
  AlertTriangle,
  FileCheck2,
  TrendingDown,
  Building,
  CheckCircle2,
  ChevronRight,
  GitPullRequestDraft,
  PhoneCall,
  Send,
  Eye,
} from 'lucide-react';
import { Customer, LoanCase, UserAccount } from '../../types';

interface RiskManagerWorkbenchDeckProps {
  currentUser: UserAccount;
  customers: Customer[];
  loanCases: LoanCase[];
  onNavigate: (nav: string) => void;
  onOpenCustomerDetail: (customer: Customer) => void;
  onOpenExpediteModal: (loanCase: LoanCase, customer?: Customer) => void;
}

export const RiskManagerWorkbenchDeck: React.FC<RiskManagerWorkbenchDeckProps> = ({
  currentUser,
  customers,
  loanCases,
  onNavigate,
  onOpenCustomerDetail,
  onOpenExpediteModal,
}) => {
  // 各流程阶段案卷统计
  const stages = [
    { key: 'pre_screen', label: '资质初审', color: 'bg-slate-100 text-slate-700' },
    { key: 'docs_collection', label: '资料收集', color: 'bg-amber-100 text-amber-700' },
    { key: 'submission', label: '报审银行', color: 'bg-blue-100 text-blue-700' },
    { key: 'interview_visit', label: '下户面签', color: 'bg-purple-100 text-purple-700' },
    { key: 'approval', label: '终审批复', color: 'bg-indigo-100 text-indigo-700' },
    { key: 'disbursement', label: '放款结算', color: 'bg-emerald-100 text-emerald-700' },
  ];

  // 统计在途案卷
  const inPipelineCases = loanCases.filter(
    (l) => l.stage !== 'disbursement' && l.stage !== 'post_loan'
  );

  // 报审银行在途工单
  const bankSubmissionCases = loanCases.filter(
    (l) => l.stage === 'submission' || l.stage === 'docs_collection'
  );

  // 待复核资料清单
  const docsPendingCases = loanCases.filter((l) => l.stage === 'docs_collection');

  return (
    <div className="space-y-5">
      {/* 1. 风控与权证排期大屏 */}
      <div className="bg-gradient-to-br from-rose-50/70 via-white to-slate-50 text-slate-900 rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden border border-rose-200/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 flex-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center space-x-1">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                <span>权证与风控合规作业总台</span>
              </span>
              <span className="text-xs text-slate-600 font-medium">
                负责人: {currentUser.name}
              </span>
            </div>

            <div className="flex items-baseline space-x-4">
              <div>
                <span className="text-xs text-slate-500 block mb-0.5">全司在途进件总额</span>
                <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-slate-900">
                  ¥{inPipelineCases.reduce((sum, l) => sum + (l.appliedAmount || 0), 0).toLocaleString()}
                </span>
                <span className="text-sm text-slate-600 font-sans ml-1">万元</span>
              </div>
              <div className="pl-4 border-l border-slate-200">
                <span className="text-xs text-slate-500 block mb-0.5">在审工单总数</span>
                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-rose-600">
                  {inPipelineCases.length} 笔
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              严格把控银行产品准入合规门槛，排查征信多头借贷、负债率红线及抵押物净值风险
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-200 pt-4 lg:pt-0 lg:pl-6">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-[11px] text-slate-500 font-medium">待初审/补件工单</div>
              <div className="text-lg font-bold font-mono text-amber-700 mt-1">
                {docsPendingCases.length} 笔
              </div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-[11px] text-slate-500 font-medium">已批复待放款</div>
              <div className="text-lg font-bold font-mono text-emerald-700 mt-1">
                {loanCases.filter(l => l.stage === 'approval').length} 笔
              </div>
            </div>
            <button
              onClick={() => onNavigate('pipeline')}
              className="col-span-2 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <GitPullRequestDraft className="w-3.5 h-3.5" />
              <span>进入进件流转看板审核</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. 进件 6 阶段在途排期全景卡片 */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <FileCheck2 className="w-4 h-4 text-blue-600" />
            <span>权证报审与批复阶段排期大表</span>
          </h3>
          <span className="text-xs text-slate-400">实时工单流速监控</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {stages.map((st) => {
            const list = loanCases.filter((l) => l.stage === st.key);
            const sumWan = list.reduce((sum, l) => sum + (l.appliedAmount || 0), 0);
            return (
              <div
                key={st.key}
                onClick={() => onNavigate('pipeline')}
                className="p-3.5 bg-slate-50 hover:bg-blue-50/60 rounded-xl border border-slate-200/70 transition cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${st.color}`}>
                    {st.label}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition" />
                </div>
                <div className="text-xl font-bold font-mono text-slate-900 mt-2">
                  {list.length} <span className="text-xs font-normal text-slate-400">笔</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1 font-mono">
                  ¥{sumWan} 万元
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. 银行报审在途卡点工单 + 贷后风险速递 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 银行报审在途卡点工单 */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <Building className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                银行报审卡点与材料复核 ({bankSubmissionCases.length})
              </h3>
            </div>
            <span className="text-[11px] text-blue-600 font-semibold">
              权证专员对接银行
            </span>
          </div>

          <div className="space-y-2">
            {bankSubmissionCases.slice(0, 4).map((c) => (
              <div
                key={c.id}
                className="p-3 bg-slate-50 hover:bg-blue-50/40 rounded-xl border border-slate-200/70 transition flex items-center justify-between gap-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-xs truncate">{c.customerName}</span>
                    <span className="text-[10px] px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded font-semibold">
                      {c.productName}
                    </span>
                    <span className="text-slate-800 font-mono font-bold text-xs">¥{c.appliedAmount}万</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                    顾问: {c.consultantName} · 进件时间: {c.submittedAt || '今日 09:30'}
                  </div>
                </div>

                <button
                  onClick={() => onOpenExpediteModal(c)}
                  className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-2xs flex items-center space-x-1 cursor-pointer shrink-0"
                >
                  <Send className="w-3 h-3" />
                  <span>推进银行</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 贷后风险雷达速递 */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                贷后风险雷达速递 (涉诉/逾期预警)
              </h3>
            </div>
            <button
              onClick={() => onNavigate('post_loan')}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center space-x-0.5 cursor-pointer"
            >
              <span>处置台</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            <div className="p-3 bg-rose-50/40 rounded-xl border border-rose-200/70 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-900 text-xs">成都xx商贸有限公司 (李总)</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-rose-100 text-rose-800 rounded font-semibold">
                    新增涉诉执行
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  在贷余额 ¥180万 · 预警：法院执行标的 ¥25万，建议启动现场核验
                </p>
              </div>
              <button
                onClick={() => onNavigate('post_loan')}
                className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer shrink-0"
              >
                立即处置
              </button>
            </div>

            <div className="p-3 bg-amber-50/40 rounded-xl border border-amber-200/70 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-900 text-xs">赵女士 (个人房抵贷)</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded font-semibold">
                    还款倒计时 2天
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  本期应还 ¥14,200 · 智能还款短信与微信提醒已自动下发
                </p>
              </div>
              <button
                onClick={() => onNavigate('post_loan')}
                className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer shrink-0"
              >
                查看台账
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
