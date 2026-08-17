import React, { useMemo } from 'react';
import { Filter, TrendingUp, ArrowDown } from 'lucide-react';
import { Customer, LoanCase, DealStage } from '../../types';

interface BusinessFunnelChartProps {
  customers: Customer[];
  loanCases: LoanCase[];
  onNavigateToCRM?: () => void;
  onNavigateToPipeline?: () => void;
}

// 全链路阶段顺序：意向客户 → 建档在跟 → 资质初审 → 资料收集 → 机构进件 → 审批批复 → 放款结算
const FUNNEL_STAGES: { key: string; label: string; desc: string }[] = [
  { key: 'lead', label: '意向客户', desc: '全量在库客户（含公海）' },
  { key: 'active', label: '建档在跟', desc: '已分配且非公海的活跃客户' },
  { key: 'applied', label: '发起进件', desc: '已创建贷款进件工单' },
  { key: 'submission', label: '机构报审', desc: '提交至银行/消金系统' },
  { key: 'approval', label: '审批批复', desc: '获得批复额度' },
  { key: 'disbursement', label: '放款结算', desc: '已放款或贷后管理' },
];

export const BusinessFunnelChart: React.FC<BusinessFunnelChartProps> = ({
  customers,
  loanCases,
  onNavigateToCRM,
  onNavigateToPipeline,
}) => {
  const funnelData = useMemo(() => {
    const leadCount = customers.length;
    const activeCount = customers.filter((c) => c.status !== 'in_pool').length;
    const appliedCount = loanCases.length;

    // 进件阶段映射到漏斗层级
    const submissionCount = loanCases.filter((l) => {
      const order: DealStage[] = ['submission', 'interview_visit', 'approval', 'disbursement', 'post_loan'];
      return order.includes(l.stage);
    }).length;
    const approvalCount = loanCases.filter((l) =>
      l.stage === 'approval' || l.stage === 'disbursement' || l.stage === 'post_loan'
    ).length;
    const disbursementCount = loanCases.filter((l) =>
      l.stage === 'disbursement' || l.stage === 'post_loan'
    ).length;

    const raw = [
      leadCount,
      activeCount,
      appliedCount,
      submissionCount,
      approvalCount,
      disbursementCount,
    ];

    return FUNNEL_STAGES.map((stage, i) => ({
      ...stage,
      value: raw[i],
      // 转化率 = 当前层 / 上一层
      conversionRate: i === 0 ? 100 : raw[i - 1] > 0 ? Math.round((raw[i] / raw[i - 1]) * 100) : 0,
    }));
  }, [customers, loanCases]);

  const maxValue = Math.max(1, ...funnelData.map((f) => f.value));
  const overallConversion = funnelData.length > 0 && funnelData[0].value > 0
    ? Math.round((funnelData[funnelData.length - 1].value / funnelData[0].value) * 100)
    : 0;

  // 渐变色阶（从蓝到绿，越深代表越接近放款）
  const stageColors = ['#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#059669', '#047857'];

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-5 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>业务转化漏斗 · 意向客户 → 放款全链路</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            从线索到放款的各阶段客户量与逐层转化率，重点反映公积金/工薪贷等标准化产品的转化路径
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[11px] text-slate-400">全链路转化率</span>
          <span className="text-lg font-bold text-emerald-600 font-mono">{overallConversion}%</span>
        </div>
      </div>

      {/* Funnel Bars */}
      <div className="space-y-3">
        {funnelData.map((stage, i) => {
          const widthPct = Math.max(6, Math.round((stage.value / maxValue) * 100));
          const conversionDisplay = i === 0
            ? '—'
            : `${stage.conversionRate}%`;
          const isHighDrop = i > 0 && stage.conversionRate < 50;

          return (
            <div key={stage.key} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-slate-700">{stage.label}</span>
                  <span className="text-[10px] text-slate-400">{stage.desc}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="font-mono font-bold text-slate-900">{stage.value}</span>
                  {i > 0 && (
                    <span className={`inline-flex items-center space-x-0.5 font-mono text-[11px] font-semibold ${
                      isHighDrop ? 'text-rose-600' : 'text-slate-500'
                    }`}>
                      <ArrowDown className="w-3 h-3" />
                      <span>{conversionDisplay}</span>
                    </span>
                  )}
                </div>
              </div>
              <div className="h-6 bg-slate-100 rounded-lg overflow-hidden">
                <div
                  className="h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                  style={{ width: `${widthPct}%`, backgroundColor: stageColors[i] }}
                >
                  {stage.value > 0 && (
                    <span className="text-[10px] font-bold text-white/90 font-mono">
                      {stage.value} 户
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
        <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          <span>数据实时聚合自客户库与进件流转状态</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onNavigateToCRM}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold border border-slate-200 transition cursor-pointer"
          >
            查看客户库
          </button>
          <button
            onClick={onNavigateToPipeline}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-semibold border border-blue-200 transition cursor-pointer"
          >
            查看进件看板
          </button>
        </div>
      </div>
    </div>
  );
};
