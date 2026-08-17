import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Clock, 
  Building2, 
  FileText, 
  AlertCircle, 
  MessageSquare, 
  PhoneCall, 
  ArrowRight,
  ShieldCheck,
  Calendar,
  Sparkles,
  Zap,
  AlertTriangle,
  Bot
} from 'lucide-react';
import { Customer, LoanCase, DealStage } from '../../types';
import { CopyButton } from '../common/CopyButton';
import { ClickablePhone } from '../common/ClickablePhone';
import { getCaseOverdueInfo } from '../../utils/approvalTaskReminders';

interface ExpandableCaseCardProps {
  deal: {
    id: string;
    customerName: string;
    customerPhone: string;
    loanType: string;
    amount: string;
    appliedAmountNum: number;
    node: string;
    status: string;
    statusColor: string;
    updatedAt: string;
    rawCase: LoanCase;
    rawCustomer: Customer;
  };
  onOpenQuickFollowUp: (customer: Customer, caseItem: LoanCase) => void;
  onStartCall: (customer: Customer) => void;
  onOpenAiCopilot?: (customer: Customer) => void;
  onOpenCustomerDetail: (customer: Customer) => void;
  onOpenExpediteModal?: (loanCase: LoanCase, customer?: Customer) => void;
  onNavigateToPipeline?: () => void;
}

// 7 Standard Loan Pipeline Stages
const PIPELINE_STAGES: { id: DealStage; label: string; stepNumber: number }[] = [
  { id: 'pre_screen', label: '1. 资质初审', stepNumber: 1 },
  { id: 'docs_collection', label: '2. 收集资料', stepNumber: 2 },
  { id: 'submission', label: '3. 进件报审', stepNumber: 3 },
  { id: 'interview_visit', label: '4. 下户面签', stepNumber: 4 },
  { id: 'approval', label: '5. 审批批复', stepNumber: 5 },
  { id: 'disbursement', label: '6. 抵押放款', stepNumber: 6 },
  { id: 'post_loan', label: '7. 贷后管理', stepNumber: 7 },
];

export const ExpandableCaseCard: React.FC<ExpandableCaseCardProps> = ({
  deal,
  onOpenQuickFollowUp,
  onStartCall,
  onOpenAiCopilot,
  onOpenCustomerDetail,
  onOpenExpediteModal,
  onNavigateToPipeline,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const currentStageIndex = PIPELINE_STAGES.findIndex(s => s.id === deal.rawCase.stage);
  const activeIndex = currentStageIndex !== -1 ? currentStageIndex : 0;
  const overdueInfo = getCaseOverdueInfo(deal.rawCase);

  return (
    <div 
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        overdueInfo.isOverdue
          ? overdueInfo.urgencyLevel === 'critical'
            ? 'border-rose-400 bg-rose-50/15 shadow-xs ring-1 ring-rose-400/30'
            : 'border-amber-400 bg-amber-50/15 shadow-xs ring-1 ring-amber-400/30'
          : isExpanded
            ? 'bg-white border-blue-400 shadow-md ring-1 ring-blue-400/30'
            : 'bg-white border-slate-200/90 hover:border-blue-300 hover:shadow-xs'
      }`}
    >
      {/* Primary Card Summary Row */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 sm:p-4.5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none"
      >
        <div className="flex items-start sm:items-center space-x-3">
          {/* Status Indicator Dot */}
          <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 sm:mt-0 ${
            overdueInfo.isOverdue ? 'bg-rose-500 animate-pulse' : 'bg-blue-600'
          }`} />
          
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="text-xs sm:text-sm font-bold text-slate-900">{deal.customerName}</span>
              
              {/* Grade Pill */}
              {deal.rawCustomer?.grade && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {deal.rawCustomer.grade} 级
                </span>
              )}

              {/* Clickable Phone */}
              {deal.customerPhone && (
                <div onClick={(e) => e.stopPropagation()}>
                  <ClickablePhone
                    phone={deal.customerPhone}
                    customerName={deal.customerName}
                    onCall={() => onStartCall(deal.rawCustomer)}
                    size="sm"
                  />
                </div>
              )}

              <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${deal.statusColor}`}>
                {deal.status}
              </span>

              {/* Overdue Badge */}
              {overdueInfo.isOverdue && (
                <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold font-mono border ${overdueInfo.badgeClass}`}>
                  {overdueInfo.badgeText}
                </span>
              )}
            </div>

            <div className="text-[11px] text-slate-500 mt-1 flex items-center flex-wrap gap-2">
              <span className="font-medium text-slate-700">{deal.loanType}</span>
              <span>·</span>
              <span>申请额度: <strong className="text-slate-900 font-mono font-bold">¥{Number(deal.amount).toLocaleString()}元</strong></span>
              <span>·</span>
              <span className="text-slate-400 font-mono flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                审批单号: {deal.id}
                <CopyButton text={deal.id} title="复制工单审批单号" />
              </span>
            </div>
          </div>
        </div>

        {/* Right Action & Chevron */}
        <div className="flex items-center justify-between sm:justify-end space-x-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
          <div className="text-right hidden md:block mr-1">
            <span className="text-[11px] text-slate-400 font-medium">当前阶段: </span>
            <strong className="text-xs text-blue-600 font-bold">{deal.node}</strong>
          </div>

          {/* One-Click Expedite Button for Overdue Tasks */}
          {overdueInfo.isOverdue && onOpenExpediteModal && (
            <div onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => onOpenExpediteModal(deal.rawCase, deal.rawCustomer)}
                className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white text-xs font-bold transition flex items-center space-x-1 cursor-pointer shadow-xs active:scale-95"
                title="一键生成催办消息并催办"
              >
                <Zap className="w-3.5 h-3.5 fill-white" />
                <span>一键催办</span>
              </button>
            </div>
          )}

          {/* Quick Follow-up button */}
          <div onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => onOpenQuickFollowUp(deal.rawCustomer, deal.rawCase)}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition flex items-center space-x-1 border border-emerald-200 cursor-pointer shadow-2xs"
              title="快速添加跟进记录"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>快速跟进</span>
            </button>
          </div>

          {/* AI 话术助手按钮 */}
          {onOpenAiCopilot && (
            <div onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => onOpenAiCopilot(deal.rawCustomer)}
                className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition flex items-center space-x-1 border border-indigo-200 cursor-pointer shadow-2xs"
                title="AI 生成该客户的专属话术（首呼/回访/微信/异议/邀约）"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>AI话术</span>
              </button>
            </div>
          )}

          <div onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => onOpenCustomerDetail(deal.rawCustomer)}
              className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition cursor-pointer"
            >
              详情
            </button>
          </div>

          {/* Accordion Toggle Chevron */}
          <button
            type="button"
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
            title={isExpanded ? '收起审批节点详情' : '展开详细审批流转节点'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Accordion Panel: 7 Approval Nodes & Process Bottlenecks */}
      {isExpanded && (
        <div className="px-4.5 pb-4.5 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-4 animate-in fade-in-50 duration-200 text-xs">
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>全流程审批节点流转进度 (7大标准阶段)</span>
            </span>
            <span className="text-[11px] text-slate-400">
              更新时间: {deal.rawCase.submittedAt || deal.updatedAt}
            </span>
          </div>

          {/* 7-Step Progress Timeline Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {PIPELINE_STAGES.map((stage, idx) => {
              const isPast = idx < activeIndex;
              const isCurrent = idx === activeIndex;

              return (
                <div
                  key={stage.id}
                  className={`p-2.5 rounded-xl border flex flex-col justify-between transition ${
                    isCurrent
                      ? overdueInfo.isOverdue
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : isPast
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-white text-slate-400 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono font-bold">
                      NODE 0{stage.stepNumber}
                    </span>
                    {isPast ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : isCurrent ? (
                      <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    ) : (
                      <Clock className="w-3 h-3 text-slate-300" />
                    )}
                  </div>

                  <div className="font-bold text-xs">
                    {stage.label.split('. ')[1]}
                  </div>

                  <div className={`text-[10px] mt-1 ${isCurrent ? 'text-amber-100' : isPast ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {isPast ? '已完成' : isCurrent ? (overdueInfo.isOverdue ? `超时停滞 (${overdueInfo.elapsedHours}h)` : '当前推进中') : '未开始'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sub-Stage Status / Bottleneck Note */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="space-y-1">
              <div className="flex items-center space-x-1.5 text-slate-800 font-bold">
                <AlertCircle className={`w-3.5 h-3.5 ${overdueInfo.isOverdue ? 'text-rose-500' : 'text-amber-500'}`} />
                <span>当前节点进展与办理要求:</span>
              </div>
              <p className="text-slate-600 pl-5 text-[11px]">
                {deal.rawCase.subStageStatus || '当前资质初审通过，资方正在复核征信与抵押物净值评估空间。'}
              </p>
            </div>

            <div className="flex items-center space-x-3 text-[11px] text-slate-500 pl-5 sm:pl-0 shrink-0">
              <div>
                <span>报审资方: </span>
                <strong className="text-slate-800">{deal.rawCase.lenderBank || '中国工商银行'}</strong>
              </div>
              <span>·</span>
              <div>
                <span>经办客户经理: </span>
                <strong className="text-slate-800">{deal.rawCase.lenderManagerName || '陈经理'}</strong>
              </div>
            </div>
          </div>

          {/* Bottom Fast Action Bar */}
          <div className="flex items-center justify-between pt-1">
            <div className="text-[11px] text-slate-400">
              归属顾问: <strong className="text-slate-700">{deal.rawCase.consultantName || '李晓明'}</strong> · 服务费率 {deal.rawCase.serviceFeeRate || 2.0}%
            </div>

            <div className="flex items-center space-x-2">
              {overdueInfo.isOverdue && onOpenExpediteModal && (
                <button
                  type="button"
                  onClick={() => onOpenExpediteModal(deal.rawCase, deal.rawCustomer)}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white text-xs font-bold transition flex items-center space-x-1 cursor-pointer shadow-xs"
                >
                  <Zap className="w-3.5 h-3.5 fill-white" />
                  <span>一键催办此节点</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onOpenQuickFollowUp(deal.rawCustomer, deal.rawCase)}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center space-x-1 cursor-pointer shadow-xs"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>录入本次跟进</span>
              </button>

              <button
                type="button"
                onClick={() => onStartCall(deal.rawCustomer)}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center space-x-1 cursor-pointer shadow-xs"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>立即外呼客户</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
