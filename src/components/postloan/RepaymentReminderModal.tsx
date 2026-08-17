import React, { useState } from 'react';
import { X, Send, Copy, Check, MessageSquare, Phone, BellRing, Sparkles, CheckCircle2 } from 'lucide-react';
import { PostLoanAccount } from '../../types';

interface RepaymentReminderModalProps {
  account: PostLoanAccount | null;
  isOpen: boolean;
  onClose: () => void;
  onSendSuccess: (accountId: string, message: string) => void;
  onStartCall?: (customerName: string, phone: string) => void;
}

export const RepaymentReminderModal: React.FC<RepaymentReminderModalProps> = ({
  account,
  isOpen,
  onClose,
  onSendSuccess,
  onStartCall,
}) => {
  const [channel, setChannel] = useState<'wechat' | 'sms'>('wechat');
  const [templateType, setTemplateType] = useState<'warm_care' | 'due_reminder' | 'urgent_overdue'>('due_reminder');
  const [copied, setCopied] = useState(false);
  const [isSent, setIsSent] = useState(false);

  if (!isOpen || !account) return null;

  const getMessageContent = () => {
    if (templateType === 'warm_care') {
      return `【雁讯金融·贷后关怀】尊敬的${account.customerName}先生/女士：您好！感谢您选择雁讯金融。温馨提示您在${account.lenderBank}的贷款下期还款日为${account.nextRepaymentDate}，预计本期应还息费¥${account.nextDueTotalYuan.toLocaleString()}元。如有任何转贷降息或资金周转需求，欢迎随时联系您的专属顾问${account.consultantName}。祝您生意兴隆！`;
    }
    if (templateType === 'urgent_overdue') {
      return `【雁讯金融·紧急催缴通知】尊敬的${account.customerName}：监测到您在${account.lenderBank}的贷款截至今日已逾期${account.overdueDays || 1}天，逾期金额¥${(account.overdueAmountYuan || account.nextDueTotalYuan).toLocaleString()}元。为避免资方上报人行征信黑名单并产生罚息与法律诉讼风险，请务必于今日将欠款存入还款专户(${account.repaymentAccount})。如有特殊困难请立即与我们联系协调。`;
    }
    return `【雁讯金融·还款温馨提示】尊敬的${account.customerName}：您在${account.lenderBank}的授信贷款下期还款日为${account.nextRepaymentDate}，本期应还款总额为¥${account.nextDueTotalYuan.toLocaleString()}元。请提前确保扣款账户(${account.repaymentBankName} ${account.repaymentAccount})余额充足，以免因余额不足扣款失败影响您的个人征信。`;
  };

  const messageText = getMessageContent();

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = () => {
    setIsSent(true);
    setTimeout(() => {
      onSendSuccess(account.id, messageText);
      setIsSent(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 text-slate-900 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BellRing className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-sm sm:text-base text-slate-900">发送还款提醒与贷后关怀</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 text-xs">
          {/* Customer info pill */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-900 text-sm">{account.customerName}</div>
              <div className="text-[11px] text-slate-500">{account.borrowerSubject}</div>
            </div>
            <div className="text-right">
              <div className="text-slate-400 text-[10px]">应还日 / 金额</div>
              <div className="font-mono font-bold text-blue-600 text-xs">
                {account.nextRepaymentDate} (¥{account.nextDueTotalYuan.toLocaleString()}元)
              </div>
            </div>
          </div>

          {/* Channel selector */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setChannel('wechat')}
              className={`p-2.5 rounded-xl border text-center font-bold transition flex items-center justify-center space-x-1.5 ${
                channel === 'wechat'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>微信专属关怀通知</span>
            </button>

            <button
              type="button"
              onClick={() => setChannel('sms')}
              className={`p-2.5 rounded-xl border text-center font-bold transition flex items-center justify-center space-x-1.5 ${
                channel === 'sms'
                  ? 'bg-blue-50 border-blue-300 text-blue-800'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Send className="w-4 h-4 text-blue-600" />
              <span>官方106短信通道</span>
            </button>
          </div>

          {/* Template selector */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">选择提醒话术模板</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTemplateType('due_reminder')}
                className={`p-2 rounded-xl border text-[11px] font-bold text-center transition ${
                  templateType === 'due_reminder'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                还款日前提醒
              </button>

              <button
                type="button"
                onClick={() => setTemplateType('warm_care')}
                className={`p-2 rounded-xl border text-[11px] font-bold text-center transition ${
                  templateType === 'warm_care'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                日常增值关怀
              </button>

              <button
                type="button"
                onClick={() => setTemplateType('urgent_overdue')}
                className={`p-2 rounded-xl border text-[11px] font-bold text-center transition ${
                  templateType === 'urgent_overdue'
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                }`}
              >
                逾期紧急催缴
              </button>
            </div>
          </div>

          {/* Message Preview Area */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700">推送内容预览 (可编辑)</label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center space-x-1"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? '已复制' : '复制文案'}</span>
              </button>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 leading-relaxed font-sans text-xs">
              {messageText}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2">
            {onStartCall && (
              <button
                type="button"
                onClick={() => {
                  onStartCall(account.customerName, account.customerPhone);
                  onClose();
                }}
                className="px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-xl font-bold transition flex items-center space-x-1"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>发起语音外呼</span>
              </button>
            )}

            <div className="flex items-center space-x-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-bold transition"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={isSent}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs transition flex items-center space-x-1.5"
              >
                {isSent ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>已发送通知...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>确认一键发送</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
