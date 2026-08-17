import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Download, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  Phone, 
  QrCode,
  Building,
  Home,
  Check
} from 'lucide-react';
import { Customer } from '../../types';

interface SharePosterModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
}

import { useEscToClose } from '../../utils/useEscToClose';

export const SharePosterModal: React.FC<SharePosterModalProps> = ({
  customer,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  // ESC 关闭
  useEscToClose(isOpen, onClose);

  if (!isOpen || !customer) return null;

  const handleCopyLink = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col text-[#1E293B]">
        
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Share2 className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-900">生成微信营销预审方案海报</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Poster Visual Preview */}
        <div className="p-5 flex justify-center bg-slate-100">
          <div className="w-full max-w-sm rounded-2xl bg-white border border-slate-200 p-5 space-y-4 shadow-md text-slate-800">
            
            {/* Top Brand */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="font-bold text-blue-600 text-sm tracking-tight">雁讯咨询 · 智选信贷</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Yanxun VIP Pre-approval</div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
                专属测算报告
              </span>
            </div>

            {/* Customer & Quote Header */}
            <div>
              <div className="text-xs text-slate-500 font-medium">尊敬的 {customer.name} (先生/女士)：</div>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                经资方准入模型初筛与测算，为您量身定制的融资授信方案如下：
              </p>
            </div>

            {/* Approved Amount & Rate */}
            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-center space-y-1">
              <div className="text-[11px] text-blue-700 font-semibold">预估最高可融资金额</div>
              <div className="text-3xl font-bold font-mono text-blue-600">
                ¥{customer.requestedAmount} <span className="text-sm font-normal">万元</span>
              </div>
              <div className="text-[11px] text-slate-500 pt-1">
                年化综合成本低至 <span className="font-bold font-mono text-blue-600">3.25%</span> · 最长 <span className="font-bold">{customer.requestedTermYears}年期</span>
              </div>
            </div>

            {/* Match highlight */}
            <div className="space-y-1.5 text-xs">
              <div className="font-semibold text-slate-800">推荐方案亮点:</div>
              <div className="flex items-center space-x-1.5 text-slate-600">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>国有/全国性股份制银行一类通道</span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-600">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>支持先息后本，随借随还无提前还款违约金</span>
              </div>
            </div>

            {/* QR Code & Consultant card */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                  李
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">李晓明 (资深金融顾问)</div>
                  <div className="text-[10px] text-slate-400 font-mono">TEL: 138-0000-8899</div>
                </div>
              </div>

              <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center">
                <QrCode className="w-8 h-8 text-slate-800" />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={handleCopyLink}
            className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition flex items-center space-x-1.5"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600 font-semibold">微信链接已复制!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>复制分享链接</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium shadow-sm transition"
          >
            保存海报到相册
          </button>
        </div>
      </div>
    </div>
  );
};
