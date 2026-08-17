import React from 'react';
import {
  AlertTriangle,
  Clock,
  Send,
  Building2,
  ChevronRight,
  ShieldAlert,
  Zap,
  Phone,
  Sparkles,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { LoanCase, Customer } from '../../types';
import { getCaseOverdueInfo, CaseOverdueInfo } from '../../utils/approvalTaskReminders';

interface ApprovalTimeoutAlertBannerProps {
  loanCases: LoanCase[];
  customers: Customer[];
  onOpenExpediteModal: (loanCase: LoanCase, customer?: Customer) => void;
  onStartCall?: (customer: Customer) => void;
  onOpenCustomerDetail?: (customer: Customer) => void;
}

export const ApprovalTimeoutAlertBanner: React.FC<ApprovalTimeoutAlertBannerProps> = ({
  loanCases,
  customers,
  onOpenExpediteModal,
  onStartCall,
  onOpenCustomerDetail,
}) => {
  // 筛选出所有处于‘初审’或‘待补件’超过24小时无更新的案件
  const overdueCases = loanCases
    .map((c) => {
      const info = getCaseOverdueInfo(c);
      const cust = customers.find((cust) => cust.id === c.customerId);
      return {
        loanCase: c,
        customer: cust,
        info,
      };
    })
    .filter((item) => item.info.isOverdue)
    .sort((a, b) => b.info.elapsedHours - a.info.elapsedHours);

  if (overdueCases.length === 0) {
    return (
      <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-2xs">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-emerald-900">
              审批流转时效健康监控:
            </span>
            <span className="text-xs text-emerald-700 ml-1.5 font-medium">
              当前所有进件初审与补件节点均在 24 小时黄金时效内正常推进，暂无停滞预警。
            </span>
          </div>
        </div>
        <span className="text-[10px] text-emerald-600 bg-emerald-100/60 px-2 py-0.5 rounded-full font-bold">
          SLA 达标率 100%
        </span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-orange-500/10 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-amber-200/80">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 text-white flex items-center justify-center shadow-xs">
            <AlertTriangle className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm sm:text-base font-bold text-amber-950 flex items-center gap-1.5">
                <span>进件审批超时停滞预警</span>
                <span className="px-2 py-0.2 rounded-full bg-rose-600 text-white text-[11px] font-mono font-bold shadow-2xs">
                  {overdueCases.length} 笔超时待办
                </span>
              </h3>
            </div>
            <p className="text-xs text-amber-800 mt-0.5">
              系统检测到以下进件处于【初审】或【待补件】阶段已停滞超过 24 小时无进度更新，请及时使用一键催办加快审批与补件
            </p>
          </div>
        </div>

        <div className="text-[11px] text-amber-900 bg-white/80 backdrop-blur-xs border border-amber-300 px-3 py-1.5 rounded-xl font-medium shadow-2xs flex items-center space-x-1 self-start sm:self-auto">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>初审/补件时效上限: <strong>24h</strong></span>
        </div>
      </div>

      {/* Overdue Cases List */}
      <div className="mt-3.5 space-y-2.5">
        {overdueCases.map(({ loanCase, customer, info }) => (
          <div
            key={loanCase.id}
            className="bg-white rounded-xl border border-amber-200/90 hover:border-amber-400 p-3.5 transition-all shadow-xs hover:shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3"
          >
            {/* Left Info */}
            <div className="flex items-start space-x-3">
              <div className={`mt-0.5 px-2 py-1 rounded-lg text-xs font-bold font-mono border whitespace-nowrap ${info.badgeClass}`}>
                {info.badgeText}
              </div>

              <div>
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <strong className="text-sm font-bold text-slate-900">
                    {loanCase.customerName}
                  </strong>
                  {customer?.grade && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {customer.grade} 级
                    </span>
                  )}
                  <span className="text-xs font-bold text-blue-700 font-mono">
                    ¥{loanCase.appliedAmount || loanCase.applyAmount}万
                  </span>
                  <span className="text-xs text-slate-600 font-medium">
                    · {loanCase.lenderBank || loanCase.lenderInstitution} ({loanCase.productName})
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    [{loanCase.caseNumber || loanCase.id}]
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  <span className="font-semibold text-slate-700">停滞瓶颈: </span>
                  {info.stagnationReason}
                </p>

                <div className="text-[11px] text-slate-400 mt-1 flex items-center space-x-3 flex-wrap">
                  <span>
                    报审经办: <strong className="text-slate-700">{loanCase.lenderManagerName} ({loanCase.lenderManagerPhone || '无电话'})</strong>
                  </span>
                  <span>·</span>
                  <span>
                    归属顾问: <strong className="text-slate-700">{loanCase.consultantName || '李晓明'}</strong>
                  </span>
                  <span>·</span>
                  <span>报审递交时间: {loanCase.submittedAt}</span>
                </div>
              </div>
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center space-x-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 justify-end">
              {customer && onStartCall && (
                <button
                  type="button"
                  onClick={() => onStartCall(customer)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition flex items-center space-x-1 cursor-pointer"
                  title="外呼联系客户"
                >
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  <span>电话跟进</span>
                </button>
              )}

              {customer && onOpenCustomerDetail && (
                <button
                  type="button"
                  onClick={() => onOpenCustomerDetail(customer)}
                  className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition cursor-pointer"
                >
                  查看工单
                </button>
              )}

              {/* Primary One-Click Expedite Button */}
              <button
                type="button"
                onClick={() => onOpenExpediteModal(loanCase, customer)}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs active:scale-95 animate-pulse hover:animate-none"
              >
                <Zap className="w-3.5 h-3.5 fill-white text-white" />
                <span>一键催办</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
