import React, { useState } from 'react';
import { X, Calendar, ShieldCheck, User, FileText, CheckCircle2 } from 'lucide-react';
import { PostLoanAccount, InspectionRecord } from '../../types';

interface InspectionModalProps {
  account: PostLoanAccount | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveInspection: (postLoanId: string, record: Partial<InspectionRecord>) => void;
}

export const InspectionModal: React.FC<InspectionModalProps> = ({
  account,
  isOpen,
  onClose,
  onSaveInspection,
}) => {
  const [method, setMethod] = useState<'phone' | 'wechat' | 'on_site' | 'video'>('phone');
  const [businessStatus, setBusinessStatus] = useState<'normal' | 'expansion' | 'revenue_declined' | 'closed_down'>('normal');
  const [repaymentRating, setRepaymentRating] = useState<'strong' | 'stable' | 'tight' | 'high_risk'>('stable');
  const [findings, setFindings] = useState('');
  const [nextDate, setNextDate] = useState('2026-11-15');

  if (!isOpen || !account) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!findings.trim()) return;

    onSaveInspection(account.id, {
      type: method === 'on_site' ? 'on_site_visit' : 'routine_quarterly',
      inspectionDate: new Date().toISOString().split('T')[0],
      inspectorName: account.consultantName || '客户经理',
      method,
      businessStatus: businessStatus as any,
      repaymentCapacityRating: repaymentRating,
      findings,
      nextInspectionDate: nextDate,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 text-slate-900 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-sm sm:text-base text-slate-900">登记贷后巡检与回访台账</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-slate-500">客户对象：</span>
            <strong className="text-slate-900 font-bold ml-1">{account.customerName}</strong>
            <span className="text-slate-400 ml-2">({account.borrowerSubject})</span>
            <div className="text-[11px] text-slate-500 mt-1">
              放款银行: {account.lenderBank} | 剩余本金: ¥{account.currentBalanceWan}万
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">巡检方式</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-blue-500 outline-none"
              >
                <option value="phone">📞 电话例行回访</option>
                <option value="wechat">💬 微信交流沟通</option>
                <option value="on_site">🏢 实地下户走访</option>
                <option value="video">📹 远程视频核验</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">经营状态判断</label>
              <select
                value={businessStatus}
                onChange={(e) => setBusinessStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-blue-500 outline-none"
              >
                <option value="normal">正常稳健运营</option>
                <option value="expansion">产值/规模扩张中</option>
                <option value="revenue_declined">营收下滑/账期延长</option>
                <option value="closed_down">停业/歇业高危</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">还款能力综合评级</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { val: 'strong', label: '极充裕', color: 'peer-checked:bg-emerald-600 peer-checked:text-white' },
                { val: 'stable', label: '平稳', color: 'peer-checked:bg-blue-600 peer-checked:text-white' },
                { val: 'tight', label: '偏紧', color: 'peer-checked:bg-amber-600 peer-checked:text-white' },
                { val: 'high_risk', label: '高危', color: 'peer-checked:bg-rose-600 peer-checked:text-white' },
              ].map((item) => (
                <label key={item.val} className="cursor-pointer">
                  <input
                    type="radio"
                    name="repaymentRating"
                    value={item.val}
                    checked={repaymentRating === item.val}
                    onChange={(e) => setRepaymentRating(e.target.value as any)}
                    className="peer sr-only"
                  />
                  <div className={`p-2 text-center rounded-xl border border-slate-200 bg-slate-50 font-bold transition hover:bg-slate-100 ${item.color}`}>
                    {item.label}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              巡检发现与回访备忘 <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
              placeholder="请输入本次贷后巡检核实的经营情况、开票流水、还款资金准备或风险隐患..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none resize-none leading-relaxed text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">建议下次巡检时间</label>
            <input
              type="date"
              value={nextDate}
              onChange={(e) => setNextDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:border-blue-500 outline-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-bold transition"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs transition"
            >
              保存巡检记录
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
