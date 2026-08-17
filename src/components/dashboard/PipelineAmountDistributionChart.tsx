import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LabelList
} from 'recharts';
import {
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  Layers,
  ArrowRight,
  Sparkles,
  Info,
  Building2,
  DollarSign
} from 'lucide-react';
import { LoanCase } from '../../types';

interface PipelineAmountDistributionChartProps {
  loanCases: LoanCase[];
  onNavigateToPipeline?: () => void;
}

// 颜色系统配置
const STAGE_COLORS = {
  pre_screen: '#3B82F6',       // 蓝色 - 资质初审
  docs_collection: '#06B6D4',  // 青色 - 资料收集
  submission: '#6366F1',       // 靛蓝 - 机构进件
  interview_visit: '#8B5CF6',  // 紫色 - 面签下户
  approval: '#F59E0B',         // 琥珀色 - 审批批复
  disbursement: '#10B981',     // 翠绿色 - 放款结算
  post_loan: '#14B8A6',        // 青绿 - 贷后管理
};

const STAGE_GROUPS = [
  {
    key: 'pre_screen',
    name: '资质初审',
    subStages: ['pre_screen'],
    color: '#3B82F6',
    desc: '初审评级与方案匹配',
  },
  {
    key: 'docs_collection',
    name: '资料收集',
    subStages: ['docs_collection'],
    color: '#06B6D4',
    desc: '流水征信与权证收集',
  },
  {
    key: 'submission',
    name: '机构进件',
    subStages: ['submission'],
    color: '#6366F1',
    desc: '银行信贷系统报审中',
  },
  {
    key: 'interview_visit',
    name: '待面签/下户',
    subStages: ['interview_visit'],
    color: '#8B5CF6',
    desc: '实地验房下户与面签',
  },
  {
    key: 'approval',
    name: '已审批待放',
    subStages: ['approval'],
    color: '#F59E0B',
    desc: '批复下达与合同签署',
  },
  {
    key: 'disbursement',
    name: '已放款/结案',
    subStages: ['disbursement', 'post_loan'],
    color: '#10B981',
    desc: '凭证归档与贷后服务',
  },
];

export const PipelineAmountDistributionChart: React.FC<PipelineAmountDistributionChartProps> = ({
  loanCases,
  onNavigateToPipeline,
}) => {
  const [chartType, setChartType] = useState<'bar' | 'donut'>('bar');
  const [activeStageKey, setActiveStageKey] = useState<string | null>(null);

  // 统计各阶段案件数量与金额
  const distributionData = useMemo(() => {
    return STAGE_GROUPS.map((group) => {
      const matchedCases = loanCases.filter((c) => group.subStages.includes(c.stage));
      const totalAmountWan = matchedCases.reduce((sum, c) => {
        return sum + (c.approvedAmount || c.appliedAmount || c.applyAmount || 0);
      }, 0);
      const count = matchedCases.length;
      const avgAmountWan = count > 0 ? Math.round((totalAmountWan / count) * 10) / 10 : 0;

      return {
        key: group.key,
        name: group.name,
        color: group.color,
        desc: group.desc,
        amount: totalAmountWan,
        count: count,
        avgAmount: avgAmountWan,
      };
    });
  }, [loanCases]);

  // 总计指标
  const summary = useMemo(() => {
    const totalPipelineAmount = distributionData.reduce((sum, item) => sum + item.amount, 0);
    const totalPipelineCount = distributionData.reduce((sum, item) => sum + item.count, 0);
    const inReviewAmount = distributionData
      .filter((d) => ['submission', 'interview_visit', 'approval'].includes(d.key))
      .reduce((sum, item) => sum + item.amount, 0);
    const disbursedAmount = distributionData
      .filter((d) => d.key === 'disbursement')
      .reduce((sum, item) => sum + item.amount, 0);

    return {
      totalPipelineAmount,
      totalPipelineCount,
      inReviewAmount,
      disbursedAmount,
    };
  }, [distributionData]);

  // 饼图数据 (过滤掉金额为 0 的项保证图表美观)
  const pieData = useMemo(() => {
    const valid = distributionData.filter((d) => d.amount > 0);
    if (valid.length === 0) {
      return [{ name: '暂无数据', amount: 1, color: '#CBD5E1', count: 0, avgAmount: 0 }];
    }
    return valid;
  }, [distributionData]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4.5 sm:p-5 space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shadow-xs">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                贷款业务各阶段金额分布与流转漏斗
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200">
                实时资产大盘
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              可视分析各报审阶段（初审、进件、待面签、已批复、已放款）资产规模与笔数分布
            </p>
          </div>
        </div>

        {/* View Switcher & Action */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`px-2.5 py-1 text-xs rounded-lg font-bold transition flex items-center space-x-1 cursor-pointer ${
                chartType === 'bar'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>柱状金额分布</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType('donut')}
              className={`px-2.5 py-1 text-xs rounded-lg font-bold transition flex items-center space-x-1 cursor-pointer ${
                chartType === 'donut'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PieIcon className="w-3.5 h-3.5" />
              <span>占比环形图</span>
            </button>
          </div>

          {onNavigateToPipeline && (
            <button
              type="button"
              onClick={onNavigateToPipeline}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold px-2.5 py-1.5 rounded-xl hover:bg-blue-50 transition flex items-center space-x-0.5 cursor-pointer"
            >
              <span>进入进件看板</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Mini KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
          <span className="text-[11px] text-slate-500 block">全阶段工单总规模</span>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-xs font-bold text-slate-500">¥</span>
            <span className="text-lg sm:text-xl font-black text-slate-900 font-mono">
              {summary.totalPipelineAmount.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400">万 ({summary.totalPipelineCount}笔)</span>
          </div>
        </div>

        <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200/80">
          <span className="text-[11px] text-indigo-900 font-medium block">在途报审/审批额</span>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-xs font-bold text-indigo-600">¥</span>
            <span className="text-lg sm:text-xl font-black text-indigo-700 font-mono">
              {summary.inReviewAmount.toLocaleString()}
            </span>
            <span className="text-xs text-indigo-500">万 (进件/面签/批复)</span>
          </div>
        </div>

        <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80">
          <span className="text-[11px] text-emerald-900 font-medium block">已完成放款金额</span>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-xs font-bold text-emerald-600">¥</span>
            <span className="text-lg sm:text-xl font-black text-emerald-700 font-mono">
              {summary.disbursedAmount.toLocaleString()}
            </span>
            <span className="text-xs text-emerald-500">万 (已放款出账)</span>
          </div>
        </div>

        <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80">
          <span className="text-[11px] text-amber-900 font-medium block">平均单笔申报金额</span>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-xs font-bold text-amber-600">¥</span>
            <span className="text-lg sm:text-xl font-black text-amber-700 font-mono">
              {summary.totalPipelineCount > 0 
                ? (Math.round((summary.totalPipelineAmount / summary.totalPipelineCount) * 10) / 10) 
                : 0}
            </span>
            <span className="text-xs text-amber-600">万元/户</span>
          </div>
        </div>
      </div>

      {/* Main Recharts Visualization Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center pt-2">
        {/* Left/Center Chart Container */}
        <div className="lg:col-span-8 h-64 sm:h-72 w-full">
          {chartType === 'bar' ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={distributionData}
                margin={{ top: 15, right: 15, left: -10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#475569' }}
                  tickLine={false}
                  axisLine={{ stroke: '#CBD5E1' }}
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={false}
                  unit="万"
                />
                <Tooltip
                  cursor={{ fill: '#F1F5F9' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const percent = summary.totalPipelineAmount > 0 
                        ? Math.round((data.amount / summary.totalPipelineAmount) * 1000) / 10 
                        : 0;
                      return (
                        <div className="bg-white/95 text-slate-900 p-3 rounded-xl shadow-xl text-xs border border-slate-200 space-y-1 z-50">
                          <div className="font-bold flex items-center gap-1.5 text-sm text-slate-900">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                            <span>{data.name}</span>
                          </div>
                          <div className="text-slate-500 text-[11px]">{data.desc}</div>
                          <div className="pt-1.5 border-t border-slate-100 space-y-0.5">
                            <div className="flex justify-between gap-4">
                              <span className="text-slate-500">总金额:</span>
                              <span className="font-bold font-mono text-emerald-600">¥{data.amount} 万元</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-slate-500">工单笔数:</span>
                              <span className="font-mono text-slate-900">{data.count} 笔</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-slate-500">平均单笔:</span>
                              <span className="font-mono text-amber-600 font-semibold">¥{data.avgAmount} 万</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-slate-500">大盘占比:</span>
                              <span className="font-mono text-blue-600 font-semibold">{percent}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="amount"
                  radius={[8, 8, 0, 0]}
                  name="阶段总金额 (万元)"
                >
                  {distributionData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      opacity={activeStageKey === null || activeStageKey === entry.key ? 1 : 0.4}
                    />
                  ))}
                  <LabelList
                    dataKey="amount"
                    position="top"
                    formatter={(val: any) => (Number(val) > 0 ? `¥${val}万` : '')}
                    style={{ fontSize: '10px', fontWeight: 'bold', fill: '#475569' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="amount"
                  nameKey="name"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`pie-cell-${index}`}
                      fill={entry.color}
                      stroke="#FFFFFF"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const percent = summary.totalPipelineAmount > 0 
                        ? Math.round((data.amount / summary.totalPipelineAmount) * 1000) / 10 
                        : 0;
                      return (
                        <div className="bg-white/95 text-slate-900 p-2.5 rounded-xl shadow-lg border border-slate-200 text-xs space-y-1 z-50">
                          <div className="font-bold flex items-center gap-1.5 text-slate-900">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                            <span>{data.name}</span>
                          </div>
                          <div className="text-emerald-600 font-mono font-bold">
                            ¥{data.amount} 万元 ({percent}%)
                          </div>
                          <div className="text-slate-500 text-[11px]">
                            {data.count} 笔工单 · 均件 ¥{data.avgAmount}万
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Right Stage Legend & Fast Metric Cards */}
        <div className="lg:col-span-4 space-y-2 max-h-72 overflow-y-auto pr-1">
          {distributionData.map((stage) => {
            const percent = summary.totalPipelineAmount > 0 
              ? Math.round((stage.amount / summary.totalPipelineAmount) * 100) 
              : 0;
            const isHovered = activeStageKey === stage.key;

            return (
              <div
                key={stage.key}
                onMouseEnter={() => setActiveStageKey(stage.key)}
                onMouseLeave={() => setActiveStageKey(null)}
                className={`p-2 rounded-xl border transition cursor-default flex items-center justify-between text-xs ${
                  isHovered
                    ? 'bg-blue-50/60 border-blue-300 shadow-2xs'
                    : 'bg-slate-50/60 hover:bg-slate-50 border-slate-200/70'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: stage.color }}
                  />
                  <div>
                    <span className="font-bold text-slate-800">{stage.name}</span>
                    <span className="text-[10px] text-slate-400 ml-1.5 font-mono">
                      ({stage.count}笔)
                    </span>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <span className="font-black text-slate-900">¥{stage.amount}万</span>
                  <span className="text-[10px] text-slate-400 ml-1.5">({percent}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
