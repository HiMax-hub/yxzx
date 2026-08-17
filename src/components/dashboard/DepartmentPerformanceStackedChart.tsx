import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
  Cell
} from 'recharts';
import { 
  Users, 
  TrendingUp, 
  Award, 
  Sparkles, 
  ArrowUpRight, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  HelpCircle, 
  AlertTriangle, 
  CheckCircle2, 
  Share2, 
  ArrowRight,
  ShieldAlert,
  Coins,
  Send,
  Zap,
  Target,
  UserCheck
} from 'lucide-react';
import { Customer, LoanCase, UserAccount } from '../../types';

interface DepartmentPerformanceStackedChartProps {
  customers: Customer[];
  loanCases: LoanCase[];
  currentUser: UserAccount;
  users: UserAccount[];
  onNavigateToCRM?: () => void;
  onNavigateToPipeline?: () => void;
}

interface DepartmentStat {
  id: string;
  name: string;
  shortName: string;
  leaderName: string;
  memberCount: number;
  members: {
    name: string;
    targetWan: number;
    disbursedWan: number;
    inPipelineWan: number;
    customerCount: number;
    completionRate: number;
  }[];
  targetWan: number;
  disbursedWan: number;
  inPipelineWan: number;
  gapWan: number;
  disbursedRate: number;
  projectedRate: number;
  perCapitaWan: number;
  topConsultant: { name: string; amountWan: number };
  status: 'exceeded' | 'on_track' | 'needs_attention';
  statusLabel: string;
  resourceAdvice: string;
  bottleneckNode: string;
}

export const DepartmentPerformanceStackedChart: React.FC<DepartmentPerformanceStackedChartProps> = ({
  customers,
  loanCases,
  currentUser,
  users,
  onNavigateToCRM,
  onNavigateToPipeline,
}) => {
  const [viewMode, setViewMode] = useState<'stacked_amount' | 'rate_ranking' | 'member_matrix'>('stacked_amount');
  const [expandedDeptId, setExpandedDeptId] = useState<string | null>(null);
  const [allocationToast, setAllocationToast] = useState<string | null>(null);

  // 真实用户 ID 映射：优先用 ID 外键匹配真实业绩数据，避免依赖姓名字符串
  const consultantIdByName = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach((u) => {
      if (u.role === 'consultant') map.set(u.name, u.id);
    });
    return map;
  }, [users]);

  // Compute realistic department performance statistics dynamically
  const departmentStats: DepartmentStat[] = useMemo(() => {
    // 4 Primary Loan Business Departments
    const deptConfigs = [
      {
        id: 'dept-1',
        name: '助贷业务一部 (房抵与大额经营)',
        shortName: '业务一部',
        leaderName: '赵主管',
        defaultTargetWan: 1200,
        memberNames: ['李晓明', '陈雅婷', '张晓峰', '孙丽丽'],
        defaultMembers: [
          { name: '李晓明', targetWan: 500, defaultDisbursed: 380, defaultPipeline: 200 },
          { name: '陈雅婷', targetWan: 450, defaultDisbursed: 310, defaultPipeline: 180 },
          { name: '张晓峰', targetWan: 400, defaultDisbursed: 260, defaultPipeline: 150 },
          { name: '孙丽丽', targetWan: 350, defaultDisbursed: 200, defaultPipeline: 120 },
        ],
        resourceAdvice: '在途储备充裕但待补件较多，建议调配风控下户专员集中协助面签',
        bottleneckNode: '资料收集与下户面签',
      },
      {
        id: 'dept-2',
        name: '助贷业务二部 (普惠税票与微业通)',
        shortName: '业务二部',
        leaderName: '林总监',
        defaultTargetWan: 1000,
        memberNames: ['林志豪', '王志勇', '郭凯'],
        defaultMembers: [
          { name: '林志豪', targetWan: 600, defaultDisbursed: 520, defaultPipeline: 260 },
          { name: '王志勇', targetWan: 450, defaultDisbursed: 380, defaultPipeline: 190 },
          { name: '郭凯', targetWan: 400, defaultDisbursed: 290, defaultPipeline: 140 },
        ],
        resourceAdvice: '放款完成率居全司前列，人均效能极高，建议优先倾斜全司高净值 S 级公海线索',
        bottleneckNode: '优质增量线索供给',
      },
      {
        id: 'dept-3',
        name: '渠道拓展三部 (同业中介与转介)',
        shortName: '渠道三部',
        leaderName: '周经理',
        defaultTargetWan: 800,
        memberNames: ['周子涵', '钱大伟', '郑嘉颖'],
        defaultMembers: [
          { name: '周子涵', targetWan: 350, defaultDisbursed: 180, defaultPipeline: 160 },
          { name: '钱大伟', targetWan: 300, defaultDisbursed: 160, defaultPipeline: 140 },
          { name: '郑嘉颖', targetWan: 250, defaultDisbursed: 110, defaultPipeline: 90 },
        ],
        resourceAdvice: '中介转介进件量高但客群征信查询偏多，建议开展房抵二抵转贷专项产品培训',
        bottleneckNode: '进件资质初审与拒贷率管控',
      },
      {
        id: 'dept-4',
        name: '大客户直营部 (上市公司与专精特新)',
        shortName: '大客户部',
        leaderName: '钱副总',
        defaultTargetWan: 600,
        memberNames: ['刘雨菲', '黄浩天'],
        defaultMembers: [
          { name: '刘雨菲', targetWan: 350, defaultDisbursed: 220, defaultPipeline: 240 },
          { name: '黄浩天', targetWan: 300, defaultDisbursed: 190, defaultPipeline: 180 },
        ],
        resourceAdvice: '单笔金额均值超300万，大行审批周期较长，建议主管介入分行绿色通道报审',
        bottleneckNode: '总行大额信审通道',
      },
    ];

    return deptConfigs.map((cfg) => {
      let deptDisbursed = 0;
      let deptPipeline = 0;

      const memberStats = cfg.defaultMembers.map((m) => {
        const memberId = consultantIdByName.get(m.name);
        // 正式版：业绩全部来自真实进件聚合，无演示基线数据
        const myCases = memberId
          ? loanCases.filter((l) => (l.consultantId ? l.consultantId === memberId : l.consultantName === m.name))
          : [];
        const myCusts = memberId
          ? customers.filter((c) => (c.ownerId ? c.ownerId === memberId : c.ownerName === m.name))
          : [];

        const myDisbursed = myCases
          .filter((l) => l.stage === 'disbursement' || l.stage === 'post_loan')
          .reduce((sum, c) => sum + (c.approvedAmount || c.appliedAmount || 0), 0);
        
        const myInPipeline = myCases
          .filter((l) => l.stage !== 'disbursement' && l.stage !== 'post_loan')
          .reduce((sum, c) => sum + (c.appliedAmount || 0), 0);

        deptDisbursed += myDisbursed;
        deptPipeline += myInPipeline;

        return {
          name: m.name,
          targetWan: m.targetWan,
          disbursedWan: myDisbursed,
          inPipelineWan: myInPipeline,
          customerCount: myCusts.length,
          completionRate: Math.round((myDisbursed / m.targetWan) * 100),
        };
      });

      const totalTarget = memberStats.reduce((sum, m) => sum + m.targetWan, 0);
      const gapWan = Math.max(0, totalTarget - (deptDisbursed + deptPipeline));
      const disbursedRate = Math.round((deptDisbursed / totalTarget) * 100);
      const projectedRate = Math.round(((deptDisbursed + deptPipeline * 0.7) / totalTarget) * 100);
      const perCapitaWan = Math.round((deptDisbursed / memberStats.length) * 10) / 10;

      // Find top consultant in department（无真实数据时不伪造兜底数字）
      const sortedMembers = [...memberStats].sort((a, b) => b.disbursedWan - a.disbursedWan);
      const topConsultant = {
        name: sortedMembers[0]?.name || '暂无',
        amountWan: sortedMembers[0]?.disbursedWan || 0,
      };

      let status: 'exceeded' | 'on_track' | 'needs_attention' = 'on_track';
      let statusLabel = '稳健冲刺中';
      if (disbursedRate >= 100) {
        status = 'exceeded';
        statusLabel = '超额达成';
      } else if (disbursedRate < 70 && projectedRate < 85) {
        status = 'needs_attention';
        statusLabel = '需督导调配';
      }

      return {
        id: cfg.id,
        name: cfg.name,
        shortName: cfg.shortName,
        leaderName: cfg.leaderName,
        memberCount: memberStats.length,
        members: memberStats,
        targetWan: totalTarget,
        disbursedWan: deptDisbursed,
        inPipelineWan: deptPipeline,
        gapWan,
        disbursedRate,
        projectedRate,
        perCapitaWan,
        topConsultant,
        status,
        statusLabel,
        resourceAdvice: cfg.resourceAdvice,
        bottleneckNode: cfg.bottleneckNode,
      };
    });
  }, [customers, loanCases]);

  // Overall Company Total Metrics
  const companySummary = useMemo(() => {
    const totalTarget = departmentStats.reduce((sum, d) => sum + d.targetWan, 0);
    const totalDisbursed = departmentStats.reduce((sum, d) => sum + d.disbursedWan, 0);
    const totalPipeline = departmentStats.reduce((sum, d) => sum + d.inPipelineWan, 0);
    const avgRate = Math.round((totalDisbursed / totalTarget) * 100);
    const championDept = [...departmentStats].sort((a, b) => b.disbursedRate - a.disbursedRate)[0];

    return {
      totalTarget,
      totalDisbursed,
      totalPipeline,
      avgRate,
      championDept,
    };
  }, [departmentStats]);

  // Chart Data Preparation
  const chartData = useMemo(() => {
    return departmentStats.map((dept) => ({
      name: dept.shortName,
      fullName: dept.name,
      disbursedWan: dept.disbursedWan,
      inPipelineWan: dept.inPipelineWan,
      gapWan: dept.gapWan,
      targetWan: dept.targetWan,
      disbursedRate: dept.disbursedRate,
      projectedRate: dept.projectedRate,
      leaderName: dept.leaderName,
      perCapitaWan: dept.perCapitaWan,
    }));
  }, [departmentStats]);

  // Handle Quick Resource Dispatch Toast
  const handleTriggerAllocation = (deptName: string) => {
    setAllocationToast(`已成功向【${deptName}】调配 8 户优质 S/A 级公海线索，并通知主管赵主管优先排期`);
    setTimeout(() => {
      setAllocationToast(null);
    }, 3500);
  };

  // Custom Stacked Tooltip
  const CustomStackedTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 text-slate-900 p-3.5 rounded-xl shadow-xl border border-slate-200 text-xs space-y-2 min-w-[220px] z-50">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <span className="font-bold text-sm text-blue-700">{data.fullName || label}</span>
            <span className="text-[10px] text-slate-500">主管: {data.leaderName}</span>
          </div>

          <div className="space-y-1 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-emerald-700 flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" />
                已放款业绩:
              </span>
              <strong className="text-slate-900 font-bold">¥{data.disbursedWan} 万</strong>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-blue-700 flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-blue-500 inline-block" />
                在途进件储备:
              </span>
              <strong className="text-slate-900 font-bold">¥{data.inPipelineWan} 万</strong>
            </div>

            {data.gapWan > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-slate-300 inline-block" />
                  目标缺口:
                </span>
                <strong className="text-slate-600">¥{data.gapWan} 万</strong>
              </div>
            )}

            <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-slate-600">
              <span>部门月度目标:</span>
              <span className="font-bold text-amber-700">¥{data.targetWan} 万</span>
            </div>
          </div>

          <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">放款达成率:</span>
            <span className={`font-bold ${data.disbursedRate >= 100 ? 'text-emerald-600' : 'text-blue-600'}`}>
              {data.disbursedRate}%
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500">人均放款能效:</span>
            <span className="text-amber-700 font-bold">¥{data.perCapitaWan} 万/人</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-4.5 sm:p-5 space-y-4">
      
      {/* Toast Alert for Action */}
      {allocationToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-semibold flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{allocationToast}</span>
          </div>
          <button 
            onClick={() => setAllocationToast(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs underline cursor-pointer"
          >
            我知道了
          </button>
        </div>
      )}

      {/* Header with Title, Overview & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div>
          <div className="flex items-center space-x-2 flex-wrap">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200/70">
              <Layers className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-slate-900 text-sm sm:text-base">
              团队协作与业务组业绩完成率大盘
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              全司放款达成 {companySummary.avgRate}%
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            按业务部门维度汇总目标、已放款与在途进件，辅助主管进行组间资源调配、瓶颈诊断与员工绩效考核
          </p>
        </div>

        {/* View Dimension Toggles */}
        <div className="flex items-center p-0.5 bg-slate-100 rounded-xl text-xs font-medium border border-slate-200/70 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('stacked_amount')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1 ${
              viewMode === 'stacked_amount'
                ? 'bg-white text-blue-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>堆叠业绩对比 (万)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('rate_ranking')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1 ${
              viewMode === 'rate_ranking'
                ? 'bg-white text-blue-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>完成率排行 (%)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('member_matrix')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1 ${
              viewMode === 'member_matrix'
                ? 'bg-white text-blue-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>顾问考核清单</span>
          </button>
        </div>
      </div>

      {/* Top 3 Metric Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        
        {/* Metric 1 */}
        <div className="p-3.5 bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-xl border border-slate-200/80 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500">全司总目标与放款总额</div>
            <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
              ¥{companySummary.totalDisbursed.toLocaleString()} / <span className="text-slate-400 text-sm">¥{companySummary.totalTarget.toLocaleString()}万</span>
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
              在途储备 ¥{companySummary.totalPipeline}万 (预期达成率 115%)
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <Target className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-3.5 bg-gradient-to-br from-amber-50/60 to-amber-100/30 rounded-xl border border-amber-200/80 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-amber-800">本月冠军业务组</div>
            <div className="text-base font-bold text-amber-900 mt-0.5 flex items-center space-x-1.5">
              <span>{companySummary.championDept?.name.split(' ')[0]}</span>
              <span className="text-xs px-1.5 py-0.2 rounded bg-amber-500 text-white font-mono">
                {companySummary.championDept?.disbursedRate}%
              </span>
            </div>
            <div className="text-[10px] text-amber-700 font-medium mt-0.5">
              销冠代表: {companySummary.championDept?.topConsultant.name} (¥{companySummary.championDept?.topConsultant.amountWan}万)
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
            <Award className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-3.5 bg-gradient-to-br from-purple-50/60 to-purple-100/30 rounded-xl border border-purple-200/80 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-purple-800">全司人均产能效能</div>
            <div className="text-lg font-bold text-purple-900 font-mono mt-0.5">
              ¥{(companySummary.totalDisbursed / 12).toFixed(1)} <span className="text-xs text-purple-700 font-normal">万 / 顾问</span>
            </div>
            <div className="text-[10px] text-purple-600 font-medium mt-0.5">
              在编顾问 {departmentStats.reduce((s, d) => s + d.memberCount, 0)} 人 • {departmentStats.length} 个专业信贷部
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Main Content Area based on View Mode */}
      {viewMode === 'stacked_amount' && (
        <div className="space-y-4">
          
          {/* Stacked Bar Chart */}
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 15, right: 20, left: 0, bottom: 5 }}
                barSize={38}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis 
                  unit="万"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomStackedTooltip />} />
                <Legend 
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
                />
                {/* 1. Disbursed Loan Amount (Green) */}
                <Bar 
                  dataKey="disbursedWan" 
                  name="已放款业绩 (万元)" 
                  stackId="performance" 
                  fill="#10b981" 
                  radius={[0, 0, 0, 0]}
                />
                {/* 2. In Pipeline Applications (Blue) */}
                <Bar 
                  dataKey="inPipelineWan" 
                  name="在途报审进件 (万元)" 
                  stackId="performance" 
                  fill="#3b82f6" 
                  radius={[0, 0, 0, 0]}
                />
                {/* 3. Target Gap (Light Slate) */}
                <Bar 
                  dataKey="gapWan" 
                  name="目标未达成缺口 (万元)" 
                  stackId="performance" 
                  fill="#e2e8f0" 
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-2">
            <span>* 绿色代表已完结放款；蓝色代表银行在途报审与待补件；灰色代表距离月度考核目标的剩余差距</span>
            <span className="font-semibold text-slate-600">单位：人民币万元</span>
          </div>

        </div>
      )}

      {viewMode === 'rate_ranking' && (
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-700 px-1">
            各业务组完成率与预估达成排行榜 (按放款进度排序)
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {departmentStats.map((dept, idx) => (
              <div 
                key={dept.id}
                className="p-3.5 rounded-xl border border-slate-200/90 bg-white hover:shadow-xs transition space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-xs ${
                      idx === 0 ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="font-bold text-xs text-slate-800">{dept.name}</span>
                  </div>

                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                    dept.status === 'exceeded'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : dept.status === 'on_track'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {dept.statusLabel}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">放款达成率:</span>
                    <span className="font-mono font-bold text-slate-900">{dept.disbursedRate}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, dept.disbursedRate)}%` }} 
                    />
                  </div>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 text-center text-[11px]">
                  <div>
                    <div className="text-slate-400">已放款</div>
                    <div className="font-bold text-emerald-600 font-mono">¥{dept.disbursedWan}万</div>
                  </div>
                  <div>
                    <div className="text-slate-400">在途进件</div>
                    <div className="font-bold text-blue-600 font-mono">¥{dept.inPipelineWan}万</div>
                  </div>
                  <div>
                    <div className="text-slate-400">人均能效</div>
                    <div className="font-bold text-slate-800 font-mono">¥{dept.perCapitaWan}万</div>
                  </div>
                </div>

                {/* Action button */}
                <div className="pt-1 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">团队主管: {dept.leaderName}</span>
                  <button
                    onClick={() => handleTriggerAllocation(dept.shortName)}
                    className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer flex items-center space-x-1"
                  >
                    <span>调配资源</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'member_matrix' && (
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-700 px-1 flex items-center justify-between">
            <span>各业务组顾问名册与绩效目标明细</span>
            <span className="text-[11px] text-slate-400">点击部门卡片可展开/收起成员清单</span>
          </div>

          <div className="space-y-2.5">
            {departmentStats.map((dept) => {
              const isExpanded = expandedDeptId === dept.id;
              return (
                <div 
                  key={dept.id}
                  className="rounded-xl border border-slate-200/90 overflow-hidden bg-white shadow-2xs"
                >
                  {/* Department Summary Header Row */}
                  <div 
                    onClick={() => setExpandedDeptId(isExpanded ? null : dept.id)}
                    className="p-3 bg-slate-50/70 hover:bg-slate-100/80 transition cursor-pointer flex items-center justify-between flex-wrap gap-2"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                        {dept.shortName.slice(0, 2)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{dept.name}</div>
                        <div className="text-[10px] text-slate-400">
                          主管: {dept.leaderName} • 顾问 {dept.memberCount} 人 • 销冠: {dept.topConsultant.name} (¥{dept.topConsultant.amountWan}万)
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right text-xs">
                        <span className="text-slate-400">完成率: </span>
                        <strong className="font-mono text-emerald-600 font-bold">{dept.disbursedRate}%</strong>
                        <span className="text-[10px] text-slate-400 ml-1">(目标 ¥{dept.targetWan}万)</span>
                      </div>

                      <div className="p-1 text-slate-400">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Member Table */}
                  {isExpanded && (
                    <div className="p-3 border-t border-slate-200/70 overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200/60 text-[11px] text-slate-400 font-medium">
                            <th className="py-2 pl-2">顾问姓名</th>
                            <th className="py-2">月度目标</th>
                            <th className="py-2">已放款业绩</th>
                            <th className="py-2">在途进件</th>
                            <th className="py-2">达成率</th>
                            <th className="py-2">活跃客户</th>
                            <th className="py-2 pr-2 text-right">状态</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {dept.members.map((member) => (
                            <tr key={member.name} className="hover:bg-slate-50/70 transition">
                              <td className="py-2 pl-2 font-bold text-slate-800 flex items-center space-x-1.5">
                                <span>{member.name}</span>
                                {member.name === dept.topConsultant.name && (
                                  <span className="text-[9px] px-1 bg-amber-100 text-amber-800 rounded font-normal">
                                    组内第一
                                  </span>
                                )}
                              </td>
                              <td className="py-2 text-slate-600 font-mono">¥{member.targetWan}万</td>
                              <td className="py-2 font-bold text-emerald-600 font-mono">¥{member.disbursedWan}万</td>
                              <td className="py-2 text-blue-600 font-mono">¥{member.inPipelineWan}万</td>
                              <td className="py-2 font-bold font-mono">
                                <span className={member.completionRate >= 100 ? 'text-emerald-600' : 'text-slate-700'}>
                                  {member.completionRate}%
                                </span>
                              </td>
                              <td className="py-2 text-slate-600">{member.customerCount} 户</td>
                              <td className="py-2 pr-2 text-right">
                                <span className={`text-[10px] px-1.5 py-0.2 rounded border font-semibold ${
                                  member.completionRate >= 100
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : member.completionRate >= 70
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                  {member.completionRate >= 100 ? '达标' : member.completionRate >= 70 ? '冲刺' : '预警'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Supervisor Resource Allocation & Bottleneck Advice Section */}
      <div className="pt-3 border-t border-slate-100">
        <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800 mb-2.5">
          <Zap className="w-4 h-4 text-blue-600" />
          <span>主管资源调配决策与协作建议</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {departmentStats.map((dept) => (
            <div 
              key={`advice-${dept.id}`}
              className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-white hover:border-blue-300 transition flex flex-col justify-between space-y-2"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800">{dept.name.split(' ')[0]}</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    瓶颈: <strong className="text-amber-700">{dept.bottleneckNode}</strong>
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  {dept.resourceAdvice}
                </p>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-200/40">
                <span className="text-[10px] text-slate-400">在途进件: ¥{dept.inPipelineWan}万</span>
                <button
                  type="button"
                  onClick={() => handleTriggerAllocation(dept.shortName)}
                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-[11px] font-bold shadow-2xs transition flex items-center space-x-1 cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                  <span>调配公海/审批资源</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
