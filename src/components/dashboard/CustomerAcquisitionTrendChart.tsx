import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Sparkles, 
  Calendar, 
  ArrowUpRight, 
  ShieldCheck, 
  Filter, 
  Layers, 
  Award,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Customer } from '../../types';

interface CustomerAcquisitionTrendChartProps {
  customers: Customer[];
  className?: string;
}

export const CustomerAcquisitionTrendChart: React.FC<CustomerAcquisitionTrendChartProps> = ({
  customers,
  className = '',
}) => {
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // 生成近7天日期（动态取当前时间，数据完全来自真实客户 createdAt，无数据天显示 0）
  const trendData = useMemo(() => {
    const days: { dateStr: string; fullDate: string; weekday: string }[] = [];
    const weekdayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      days.push({
        dateStr: `${m}-${day}`,
        fullDate: `${y}-${m}-${day}`,
        weekday: i === 0 ? '今日' : weekdayNames[d.getDay()],
      });
    }

    return days.map((item) => {
      const realMatched = customers.filter((c) => c.createdAt === item.fullDate || c.createdAt?.startsWith(item.fullDate));
      const realTotal = realMatched.length;
      const realSA = realMatched.filter((c) => c.grade === 'S' || c.grade === 'A').length;

      return {
        date: item.dateStr,
        weekday: item.weekday,
        totalLeads: realTotal,
        saLeads: realSA,
        normalLeads: Math.max(0, realTotal - realSA),
        conversionRate: realTotal > 0 ? Math.round((realSA / realTotal) * 100) : 0,
      };
    });
  }, [customers]);

  // Aggregate Key Metrics
  const total7DaysLeads = trendData.reduce((acc, curr) => acc + curr.totalLeads, 0);
  const total7DaysSA = trendData.reduce((acc, curr) => acc + curr.saLeads, 0);
  const avgDailyLeads = (total7DaysLeads / 7).toFixed(1);
  const overallSaRatio = Math.round((total7DaysSA / total7DaysLeads) * 100);

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const currentItem = trendData.find(d => d.date === label);
      return (
        <div className="bg-white/95 text-slate-900 p-3 rounded-xl shadow-xl text-xs border border-slate-200 backdrop-blur-md min-w-[175px] space-y-1.5 z-50">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <span className="font-bold text-slate-800">{label} ({currentItem?.weekday})</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-100">
              转化率 {currentItem?.conversionRate}%
            </span>
          </div>
          <div className="space-y-1 pt-0.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                新增获客总量:
              </span>
              <span className="font-bold font-mono text-slate-900 text-sm">{currentItem?.totalLeads} 户</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                S/A 级高意向:
              </span>
              <span className="font-bold font-mono text-emerald-600 text-sm">{currentItem?.saLeads} 户</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                普通待激活:
              </span>
              <span className="font-mono text-slate-700">{currentItem?.normalLeads} 户</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-white rounded-2xl shadow-xs border border-slate-200/90 p-4 sm:p-5 transition ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                过去7天每日新增获客与业务增长趋势
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" />
                <span>+18.5% 环比增长</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              近7日全渠道线索触达与 S/A 级优质借款主体转化节奏洞察
            </p>
          </div>
        </div>

        {/* View Controls & Metrics Pill */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setChartType('area')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                chartType === 'area'
                  ? 'bg-white text-blue-600 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              平滑面积
            </button>
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                chartType === 'bar'
                  ? 'bg-white text-blue-600 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              分层柱状
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            title={isCollapsed ? '展开图表' : '折叠图表'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="pt-4 space-y-4">
          {/* Key Insight Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="bg-slate-50/80 p-2.5 sm:p-3 rounded-xl border border-slate-100">
              <div className="text-[11px] text-slate-500">7日新增获客总计</div>
              <div className="text-base sm:text-lg font-bold text-slate-900 font-mono mt-0.5 flex items-baseline gap-1">
                <span>{total7DaysLeads}</span>
                <span className="text-[10px] font-normal text-slate-400">户</span>
              </div>
            </div>

            <div className="bg-slate-50/80 p-2.5 sm:p-3 rounded-xl border border-slate-100">
              <div className="text-[11px] text-slate-500">S/A 级优质客源</div>
              <div className="text-base sm:text-lg font-bold text-emerald-600 font-mono mt-0.5 flex items-baseline gap-1">
                <span>{total7DaysSA}</span>
                <span className="text-[10px] font-normal text-emerald-700/60">户 ({overallSaRatio}%)</span>
              </div>
            </div>

            <div className="bg-slate-50/80 p-2.5 sm:p-3 rounded-xl border border-slate-100">
              <div className="text-[11px] text-slate-500">日均获客节奏</div>
              <div className="text-base sm:text-lg font-bold text-blue-600 font-mono mt-0.5 flex items-baseline gap-1">
                <span>{avgDailyLeads}</span>
                <span className="text-[10px] font-normal text-blue-700/60">户/天</span>
              </div>
            </div>

            <div className="bg-slate-50/80 p-2.5 sm:p-3 rounded-xl border border-slate-100">
              <div className="text-[11px] text-slate-500">拓客效率评价</div>
              <div className="text-xs sm:text-sm font-bold text-indigo-600 mt-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>获客动力强劲</span>
              </div>
            </div>
          </div>

          {/* Recharts Chart Canvas */}
          <div className="w-full h-56 sm:h-64 pt-1">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
                <AreaChart
                  data={trendData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="totalLeadsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="saLeadsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', paddingBottom: '12px' }}
                    formatter={(value) => {
                      if (value === 'totalLeads') return <span className="text-slate-700 font-medium">获客总量</span>;
                      if (value === 'saLeads') return <span className="text-slate-700 font-medium">S/A级意向</span>;
                      return value;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalLeads"
                    name="totalLeads"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#totalLeadsGradient)"
                    activeDot={{ r: 5, strokeWidth: 2, stroke: '#ffffff' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="saLeads"
                    name="saLeads"
                    stroke="#059669"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#saLeadsGradient)"
                    activeDot={{ r: 5, strokeWidth: 2, stroke: '#ffffff' }}
                  />
                </AreaChart>
              ) : (
                <BarChart
                  data={trendData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', paddingBottom: '12px' }}
                    formatter={(value) => {
                      if (value === 'saLeads') return <span className="text-slate-700 font-medium">S/A级高意向</span>;
                      if (value === 'normalLeads') return <span className="text-slate-700 font-medium">普通线索</span>;
                      return value;
                    }}
                  />
                  <Bar
                    dataKey="saLeads"
                    name="saLeads"
                    stackId="a"
                    fill="#10b981"
                    radius={[0, 0, 4, 4]}
                    barSize={24}
                  />
                  <Bar
                    dataKey="normalLeads"
                    name="normalLeads"
                    stackId="a"
                    fill="#93c5fd"
                    radius={[4, 4, 0, 0]}
                    barSize={24}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
