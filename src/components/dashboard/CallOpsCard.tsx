import React from 'react';
import {
  PhoneCall,
  CheckCircle2,
  Timer,
  RotateCcw,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  PhoneOff,
  XCircle,
  CalendarClock
} from 'lucide-react';
import { CallRecord, Customer } from '../../types';
import { DAILY_CALL_LIMIT_PER_PHONE } from '../../utils/compliance';

interface CallOpsCardProps {
  callRecords: CallRecord[];
  customers: Customer[];
  currentUserName: string;
  isConsultant: boolean;
  onStartCall: (customer: Customer) => void;
  onCompleteCallback: (callRecordId: string) => void;
  onOpenCustomerDetail: (customer: Customer) => void;
}

// 外呼结果标签中文映射
const OUTCOME_LABEL: Record<string, { label: string; color: string; emoji: string }> = {
  connected: { label: '已接通', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', emoji: '✅' },
  no_answer: { label: '无人接听', color: 'bg-amber-50 text-amber-700 border-amber-200', emoji: '📵' },
  busy: { label: '占线', color: 'bg-amber-50 text-amber-700 border-amber-200', emoji: '🕐' },
  rejected: { label: '拒接', color: 'bg-rose-50 text-rose-700 border-rose-200', emoji: '🚫' },
  callback_request: { label: '客户要求回拨', color: 'bg-blue-50 text-blue-700 border-blue-200', emoji: '📞' },
  invalid_number: { label: '空号/停机', color: 'bg-slate-100 text-slate-500 border-slate-200', emoji: '🪫' },
};

export const CallOpsCard: React.FC<CallOpsCardProps> = ({
  callRecords,
  customers,
  currentUserName,
  isConsultant,
  onStartCall,
  onCompleteCallback,
  onOpenCustomerDetail,
}) => {
  const todayStr = new Date().toLocaleDateString('en-CA');
  const todayRecords = callRecords.filter((r) => r.calledAt.slice(0, 10) === todayStr);
  // 顾问视角只统计自己；管理视角全司
  const myTodayRecords = isConsultant
    ? todayRecords.filter((r) => r.consultantName === currentUserName)
    : todayRecords;

  const dialCount = myTodayRecords.length;
  const connectedCount = myTodayRecords.filter((r) => r.outcome === 'connected' || r.durationSeconds > 0).length;
  const connectRate = dialCount > 0 ? Math.round((connectedCount / dialCount) * 100) : 0;
  const totalDuration = myTodayRecords.reduce((s, r) => s + (r.durationSeconds || 0), 0);
  const avgDuration = connectedCount > 0 ? Math.round(totalDuration / connectedCount) : 0;
  const formatDur = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}分${String(s).padStart(2, '0')}秒`;
  };

  // 待回拨任务：未接通且有回拨计划、尚未完成
  const callbackTasks = callRecords
    .filter((r) => r.callbackScheduledAt && !r.callbackCompleted)
    .filter((r) => (isConsultant ? r.consultantName === currentUserName : true))
    .sort((a, b) => a.calledAt.localeCompare(b.calledAt));

  const formatTime = (t: string) => {
    const m = t.match(/(\d{2}):(\d{2})/);
    return m ? `${m[1]}:${m[2]}` : t;
  };

  const todayCallbacks = callbackTasks.filter((r) => {
    const day = r.callbackScheduledAt?.includes('今日') || r.callbackScheduledAt?.includes('明日');
    return true; // 展示所有未完成回拨
  });

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-100 p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <PhoneCall className="w-3.5 h-3.5" />
            </div>
            <span>今日外呼作战台</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {isConsultant ? `顾问 ${currentUserName} · 今日外呼产能` : '全司今日外呼产能'} · 合规频次上限 {DAILY_CALL_LIMIT_PER_PHONE} 次/号/日
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          实时统计
        </span>
      </div>

      {/* 3 大核心指标 */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
            <PhoneCall className="w-3 h-3" />
            今日拨打量
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono mt-1">{dialCount}</div>
          <div className="text-[10px] text-slate-400">次外呼</div>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            接通率
          </div>
          <div className={`text-xl font-bold font-mono mt-1 ${connectRate >= 40 ? 'text-emerald-600' : connectRate >= 20 ? 'text-amber-600' : 'text-rose-600'}`}>
            {connectRate}%
          </div>
          <div className="text-[10px] text-slate-400">{connectedCount} 通接通</div>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
            <Timer className="w-3 h-3 text-blue-500" />
            平均通话
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono mt-1">{formatDur(avgDuration)}</div>
          <div className="text-[10px] text-slate-400">有效沟通时长</div>
        </div>
      </div>

      {/* 回拨任务队列 */}
      <div className="mt-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
            <RotateCcw className="w-3 h-3 text-amber-500" />
            未接通自动回拨队列 ({todayCallbacks.length})
          </span>
          <span className="text-[10px] text-slate-400">电销标准动作: 未接通必回拨</span>
        </div>
        {todayCallbacks.length === 0 ? (
          <div className="px-3 py-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100 text-[11px] text-emerald-700 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            回拨队列已清空，所有未接客户均已安排跟进
          </div>
        ) : (
          <div className="space-y-1.5">
            {todayCallbacks.slice(0, 4).map((rec) => {
              const cust = customers.find((c) => c.id === rec.customerId);
              const oc = OUTCOME_LABEL[rec.outcome] || OUTCOME_LABEL.no_answer;
              return (
                <div key={rec.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 hover:border-blue-200 transition group">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="shrink-0">{oc.emoji}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => cust && onOpenCustomerDetail(cust)}
                          className="text-[11px] font-bold text-slate-800 hover:text-blue-600 cursor-pointer truncate"
                        >
                          {rec.customerName}
                        </button>
                        <span className={`shrink-0 px-1 py-0.5 rounded text-[9px] font-bold border ${oc.color}`}>{oc.label}</span>
                      </div>
                      <div className="text-[9px] text-slate-400 truncate">
                        {rec.calledAt.slice(5, 16)} 外呼未接通
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-bold flex items-center gap-0.5">
                      <CalendarClock className="w-2.5 h-2.5" />
                      {rec.callbackScheduledAt}
                    </span>
                    {cust && (
                      <button
                        onClick={() => onStartCall(cust)}
                        className="px-2 py-1 rounded-lg bg-blue-600 text-white text-[10px] font-bold hover:bg-blue-700 transition cursor-pointer"
                        title="立即回拨"
                      >
                        回拨
                      </button>
                    )}
                    <button
                      onClick={() => onCompleteCallback(rec.id)}
                      className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
                      title="标记已回拨"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 今日外呼明细 */}
      <div className="mt-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold text-slate-700">今日外呼明细</span>
        </div>
        {myTodayRecords.length === 0 ? (
          <div className="px-3 py-3 rounded-lg border border-dashed border-slate-200 text-center text-[11px] text-slate-400">
            今日暂无外呼记录 · 点击客户卡片「呼叫」开始第一通
          </div>
        ) : (
          <div className="space-y-1">
            {myTodayRecords.slice(0, 5).map((rec) => {
              const oc = OUTCOME_LABEL[rec.outcome] || OUTCOME_LABEL.no_answer;
              return (
                <div key={rec.id} className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-50 text-[10px]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span>{oc.emoji}</span>
                    <span className="font-semibold text-slate-700 truncate">{rec.customerName}</span>
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-500">{rec.calledAt.slice(11, 16)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {rec.durationSeconds > 0 && (
                      <span className="text-slate-500 font-mono">{formatDur(rec.durationSeconds)}</span>
                    )}
                    <span className={`px-1 py-0.5 rounded text-[9px] font-bold border ${oc.color}`}>{oc.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
