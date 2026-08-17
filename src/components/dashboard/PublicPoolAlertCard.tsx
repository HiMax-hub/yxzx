import React from 'react';
import { 
  Clock, 
  AlertTriangle, 
  ArrowRight, 
  Users, 
  ShieldAlert, 
  RefreshCw, 
  Sparkles,
  Flame
} from 'lucide-react';
import { Customer } from '../../types';

interface PublicPoolAlertCardProps {
  customers: Customer[];
  onNavigateToPool: (filter?: string) => void;
}

export const PublicPoolAlertCard: React.FC<PublicPoolAlertCardProps> = ({
  customers,
  onNavigateToPool,
}) => {
  // Pool customers statistics（真实聚合：按 lastContactDate 距今静默天数分档）
  const poolCustomers = customers.filter(c => c.status === 'in_pool');

  const getDormantDays = (c: Customer): number => {
    if (!c.lastContactDate || c.lastContactDate === '刚刚') return 0;
    const d = new Date(c.lastContactDate.replace(' ', 'T'));
    if (isNaN(d.getTime())) return 0;
    return Math.floor((Date.now() - d.getTime()) / 86400000);
  };

  const inRange = (c: Customer, min: number, max: number) => {
    const days = getDormantDays(c);
    return days >= min && days <= max;
  };

  const dangerPool = poolCustomers.filter((c) => getDormantDays(c) >= 25);
  const warningPool = poolCustomers.filter((c) => inRange(c, 15, 24));
  const noticePool = poolCustomers.filter((c) => inRange(c, 7, 14));
  const freshPool = poolCustomers.filter((c) => getDormantDays(c) < 7);

  const dangerCount = dangerPool.length;
  const dangerAmount = dangerPool.reduce((s, c) => s + (c.requestedAmount || 0), 0);

  const warningCount = warningPool.length;
  const warningAmount = warningPool.reduce((s, c) => s + (c.requestedAmount || 0), 0);

  const noticeCount = noticePool.length;
  const noticeAmount = noticePool.reduce((s, c) => s + (c.requestedAmount || 0), 0);

  const freshCount = freshPool.length;
  const freshAmount = freshPool.reduce((s, c) => s + (c.requestedAmount || 0), 0);

  const totalPoolAmount = dangerAmount + warningAmount + noticeAmount + freshAmount;
  const totalPoolCount = dangerCount + warningCount + noticeCount + freshCount;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4.5 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">公海活跃度阶梯预警与潜客激活</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                30天沉睡回收机制
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              监控公海客户静默时间周期，点击任意预警色块可一键直达公海进行定向认领与清洗
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigateToPool('all')}
          className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1 self-start sm:self-auto cursor-pointer"
        >
          <span>进入公海大厅 ({totalPoolCount} 户)</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 4 Colored Risk Blocks */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Block 1: 🔴 Red Critical (>25 days, close to 30 days) */}
        <div
          onClick={() => onNavigateToPool('danger')}
          className="p-3.5 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100/50 border border-rose-200 hover:border-rose-400 hover:shadow-sm transition cursor-pointer flex flex-col justify-between space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-800 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
              <span>超期高危 (≥25天)</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-200/80 text-rose-900 font-bold">
              即刻回收
            </span>
          </div>

          <div>
            <div className="text-2xl font-black font-mono text-rose-700">
              {dangerCount} <span className="text-xs font-normal text-rose-600">户</span>
            </div>
            <div className="text-[11px] text-rose-600 font-mono mt-0.5">
              沉睡融资需求: ¥{dangerAmount} 万
            </div>
          </div>

          <div className="text-[10px] font-bold text-rose-700 group-hover:underline flex items-center justify-between pt-1 border-t border-rose-200/60">
            <span>一键紧急抢单认领</span>
            <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>

        {/* Block 2: 🟠 Orange Warning (15-24 days) */}
        <div
          onClick={() => onNavigateToPool('warning')}
          className="p-3.5 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200 hover:border-amber-400 hover:shadow-sm transition cursor-pointer flex flex-col justify-between space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>中度预警 (15-24天)</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-200/80 text-amber-900 font-bold">
              待回访
            </span>
          </div>

          <div>
            <div className="text-2xl font-black font-mono text-amber-700">
              {warningCount} <span className="text-xs font-normal text-amber-600">户</span>
            </div>
            <div className="text-[11px] text-amber-600 font-mono mt-0.5">
              沉睡融资需求: ¥{warningAmount} 万
            </div>
          </div>

          <div className="text-[10px] font-bold text-amber-700 group-hover:underline flex items-center justify-between pt-1 border-t border-amber-200/60">
            <span>二次激活回拨</span>
            <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>

        {/* Block 3: 🟡 Yellow Notice (7-14 days) */}
        <div
          onClick={() => onNavigateToPool('notice')}
          className="p-3.5 rounded-xl bg-gradient-to-br from-yellow-50/80 to-yellow-100/40 border border-yellow-200 hover:border-yellow-400 hover:shadow-sm transition cursor-pointer flex flex-col justify-between space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-yellow-800 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              <span>潜客蓄水 (7-14天)</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-yellow-200/80 text-yellow-900 font-bold">
              可盘活
            </span>
          </div>

          <div>
            <div className="text-2xl font-black font-mono text-yellow-800">
              {noticeCount} <span className="text-xs font-normal text-yellow-700">户</span>
            </div>
            <div className="text-[11px] text-yellow-700 font-mono mt-0.5">
              潜在融资需求: ¥{noticeAmount} 万
            </div>
          </div>

          <div className="text-[10px] font-bold text-yellow-800 group-hover:underline flex items-center justify-between pt-1 border-t border-yellow-200/60">
            <span>潜客匹配挑选</span>
            <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>

        {/* Block 4: 🟢 Green Fresh (<7 days) */}
        <div
          onClick={() => onNavigateToPool('fresh')}
          className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 hover:border-emerald-400 hover:shadow-sm transition cursor-pointer flex flex-col justify-between space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>新鲜资源 (&lt;7天)</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-200/80 text-emerald-900 font-bold">
              优质线索
            </span>
          </div>

          <div>
            <div className="text-2xl font-black font-mono text-emerald-700">
              {freshCount} <span className="text-xs font-normal text-emerald-600">户</span>
            </div>
            <div className="text-[11px] text-emerald-600 font-mono mt-0.5">
              新入池总额: ¥{freshAmount} 万
            </div>
          </div>

          <div className="text-[10px] font-bold text-emerald-700 group-hover:underline flex items-center justify-between pt-1 border-t border-emerald-200/60">
            <span>抢占先机跟进</span>
            <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>

      {/* Bottom Summary Bar */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>
            当前公海待盘活客户总计 <strong>{totalPoolCount} 户</strong>，潜在可转化贷款总规模约 <strong className="text-slate-900 font-mono font-bold">¥{totalPoolAmount.toLocaleString()} 万元</strong>
          </span>
        </div>
        <button
          type="button"
          onClick={() => onNavigateToPool('danger')}
          className="px-3 py-1 bg-white hover:bg-slate-100 text-blue-700 border border-slate-200 rounded-lg text-xs font-bold transition shadow-2xs self-end sm:self-auto cursor-pointer"
        >
          一键清洗沉睡客户 →
        </button>
      </div>
    </div>
  );
};
