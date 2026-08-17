import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  Clock,
  Send,
  Copy,
  Check,
  Building2,
  User,
  Phone,
  MessageSquare,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  BellRing,
  CheckCircle2
} from 'lucide-react';
import { LoanCase, Customer } from '../../types';
import { 
  getCaseOverdueInfo, 
  generateExpediteTemplates, 
  ExpediteTemplateOption,
  CaseOverdueInfo
} from '../../utils/approvalTaskReminders';
import { useEscToClose } from '../../utils/useEscToClose';

interface ExpediteReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  loanCase: LoanCase | null;
  customer?: Customer;
  onSendExpediteRecord?: (caseId: string, template: ExpediteTemplateOption, editedContent: string) => void;
  onStartCall?: (customer: Customer) => void;
}

export const ExpediteReminderModal: React.FC<ExpediteReminderModalProps> = ({
  isOpen,
  onClose,
  loanCase,
  customer,
  onSendExpediteRecord,
  onStartCall,
}) => {
  // Hooks must be called unconditionally — compute nullable values safely.
  const overdueInfo: CaseOverdueInfo | null = loanCase ? getCaseOverdueInfo(loanCase) : null;
  const templates: ExpediteTemplateOption[] = loanCase && overdueInfo
    ? generateExpediteTemplates(loanCase, customer ?? undefined, overdueInfo)
    : [];

  // 默认根据超时类型选中适用的模板
  const defaultTab = overdueInfo?.stageKey === 'supplementary_needed' ? 'to_borrower' : 'to_lender';
  const [activeTabId, setActiveTabId] = useState<'to_lender' | 'to_borrower' | 'to_internal'>(defaultTab);
  const [editedText, setEditedText] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSentSuccess, setIsSentSuccess] = useState(false);

  // ESC 关闭
  useEscToClose(isOpen, onClose);

  const activeTemplate = templates.find((t) => t.id === activeTabId) || templates[0];

  useEffect(() => {
    if (!loanCase || !overdueInfo) return;
    setActiveTabId(defaultTab);
    if (activeTemplate) {
      setEditedText(activeTemplate.content);
      setCopied(false);
      setIsSentSuccess(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loanCase?.id]);

  if (!isOpen || !loanCase || !overdueInfo) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(editedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = () => {
    if (onSendExpediteRecord) {
      onSendExpediteRecord(loanCase.id, activeTemplate, editedText);
    }
    setIsSentSuccess(true);
    setTimeout(() => {
      setIsSentSuccess(false);
      onClose();
    }, 1500);
  };

  const handleReset = () => {
    setEditedText(activeTemplate.content);
    setCopied(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-blue-500/10 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <BellRing className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">
                  进件审批超时·一键催办工作台
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${overdueInfo.badgeClass}`}>
                  {overdueInfo.badgeText}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                已自动根据超时节点（{overdueInfo.stageLabel}）与资方画像生成精准催办话术
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* 1. Case Basic Overview Strip */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/90 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-[10px] text-slate-400 block">借款客户 / 单号</span>
              <span className="font-bold text-slate-900 text-xs">
                {loanCase.customerName}
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">
                {loanCase.caseNumber || loanCase.id}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block">报审产品 / 金额</span>
              <span className="font-bold text-slate-900 text-xs">
                ¥{loanCase.appliedAmount || loanCase.applyAmount} 万元
              </span>
              <span className="text-[10px] text-slate-500 block truncate">
                {loanCase.productName}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block">报审资方 / 经理</span>
              <span className="font-bold text-slate-900 text-xs truncate block">
                {loanCase.lenderBank || loanCase.lenderInstitution}
              </span>
              <span className="text-[10px] text-slate-500 block">
                {loanCase.lenderManagerName} ({loanCase.lenderManagerPhone || '暂无电话'})
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block">停滞时长 / 状态</span>
              <span className="font-bold text-rose-600 text-xs block font-mono">
                {overdueInfo.elapsedHours} 小时未更新
              </span>
              <span className="text-[10px] text-amber-700 font-medium truncate block">
                {overdueInfo.stageLabel}超标 {overdueInfo.overdueHours}h
              </span>
            </div>
          </div>

          {/* 2. Overdue Warning Notice Banner */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 flex items-start space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold text-amber-900 block text-xs">
                超时停滞原因说明:
              </span>
              <p className="text-amber-800 text-[11px] mt-0.5 leading-relaxed">
                {overdueInfo.stagnationReason}
              </p>
            </div>
          </div>

          {/* 3. Template Selection Tabs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>选择催办对象与话术模板</span>
              </span>
              <span className="text-[11px] text-slate-400">
                可自由切换模板并支持二次编辑
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {templates.map((tpl) => {
                const isSelected = tpl.id === activeTabId;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setActiveTabId(tpl.id)}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-500 text-blue-900 ring-2 ring-blue-500/20 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs">
                        {tpl.title.split(' ')[0]}
                      </span>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      发送至: {tpl.targetPerson}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Target Recipient & Strategy Tip */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center space-x-2 text-slate-600">
              <span className="font-semibold text-slate-700">催办目标:</span>
              <span className="px-2 py-0.5 bg-white border border-slate-200 rounded font-medium text-slate-800">
                {activeTemplate.targetRoleName} · {activeTemplate.targetPerson} ({activeTemplate.targetContact})
              </span>
            </div>

            <div className="text-blue-700 bg-blue-50/80 px-2 py-0.5 rounded text-[10px] font-medium">
              💡 {activeTemplate.urgencyTip}
            </div>
          </div>

          {/* 5. Editable Message Content Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                <span>催办消息内容预览（可直接在此修改）:</span>
              </label>

              <button
                type="button"
                onClick={handleReset}
                className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center space-x-1 cursor-pointer"
                title="重置回默认模板"
              >
                <RefreshCw className="w-3 h-3" />
                <span>重置模板</span>
              </button>
            </div>

            <div className="relative">
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                rows={7}
                className="w-full rounded-xl border border-slate-300 p-3 text-xs leading-relaxed text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-hidden font-sans bg-slate-50/30 transition resize-none"
                placeholder="请输入或编辑催办消息内容..."
              />
            </div>
          </div>

          {/* Success Banner if sent */}
          {isSentSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 flex items-center space-x-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold text-xs">
                催办通知已成功生成并记录至工单推进时间轴与客户跟进日志！
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2">
            {customer && onStartCall && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onStartCall(customer);
                }}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                <span>直接拨打客户电话</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2 justify-end">
            <button
              type="button"
              onClick={handleCopy}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border ${
                copied
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>已复制到剪贴板</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{activeTemplate.defaultActionLabel}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSend}
              disabled={isSentSuccess}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>一键发送催办记录</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
