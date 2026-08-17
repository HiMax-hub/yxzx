import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
} from 'recharts';
import {
  Coins,
  TrendingUp,
  DollarSign,
  PieChart as PieIcon,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  Layers,
  AlertTriangle,
  Users,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import { LoanCase, UserAccount } from '../../types';
import { exportMultiSectionCsv, timestampedFilename } from '../../utils/exportUtils';
import { useToast } from '../../context/ToastContext';

interface FinanceOverviewDashboardProps {
  loanCases: LoanCase[];
  currentUser: UserAccount;
}

export const FinanceOverviewDashboard: React.FC<FinanceOverviewDashboardProps> = ({
  loanCases,
  currentUser,
}) => {
  const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'year'>('month');
  const { toast } = useToast();


  // 1. 核心财务指标计算
  const metrics = useMemo(() => {
    // 筛选有效进件
    const disbursedCases = loanCases.filter(
      (c) => c.stage === 'disbursement' || c.stage === 'post_loan' || c.approvedAmount
    );

    // 本月放款总额 (万元)
    const totalDisbursedWan = disbursedCases.reduce(
      (sum, c) => sum + (c.approvedAmount || c.appliedAmount || 0),
      0
    );

    // 应收预期服务费总额 (元)
    const totalExpectedFee = loanCases.reduce(
      (sum, c) => sum + (c.serviceFeeTotal || 0),
      0
    );

    // 已收定金 (元)
    const totalDeposit = loanCases.reduce(
      (sum, c) => sum + (c.serviceFeeDepositPaid || 0),
      0
    );

    // 已收尾款 (元)
    const totalBalance = loanCases.reduce(
      (sum, c) => sum + (c.serviceFeeBalancePaid || 0),
      0
    );

    // 已实收总金额 (元)
    const totalCollected = totalDeposit + totalBalance;

    // 待回款尾款 (元)
    const totalPending = Math.max(0, totalExpectedFee - totalCollected);

    // 实收回款比例 (%)
    const collectedRate = totalExpectedFee > 0
      ? Math.round((totalCollected / totalExpectedFee) * 1000) / 10
      : 100;

    // 平均服务费率 (%)
    const avgFeeRate = totalDisbursedWan > 0 && totalExpectedFee > 0
      ? Math.round(((totalExpectedFee / (totalDisbursedWan * 10000)) * 100) * 10) / 10
      : 2.2;

    return {
      totalDisbursedWan,
      totalExpectedFee,
      totalDeposit,
      totalBalance,
      totalCollected,
      totalPending,
      collectedRate,
      avgFeeRate,
      disbursedCount: disbursedCases.length,
      totalCasesCount: loanCases.length,
    };
  }, [loanCases]);

  // 2. 产品类别维度：放款金额 (万元) 与 预期服务费收入 (万元)
  const productCategoryData = useMemo(() => {
    const categoriesMap = new Map<string, { disbursedWan: number; feeYuan: number; count: number }>();

    loanCases.forEach((c) => {
      const cat = c.productCategory || (c.productName?.includes('抵押') ? '房抵经营贷' : c.productName?.includes('税') || c.productName?.includes('票') ? '企业信用贷' : c.productName?.includes('车') ? '车辆抵押贷' : '普惠消费贷');
      const current = categoriesMap.get(cat) || { disbursedWan: 0, feeYuan: 0, count: 0 };
      const disbursed = (c.stage === 'disbursement' || c.stage === 'post_loan') ? (c.approvedAmount || c.appliedAmount || 0) : (c.appliedAmount || 0);
      current.disbursedWan += disbursed;
      current.feeYuan += c.serviceFeeTotal || 0;
      current.count += 1;
      categoriesMap.set(cat, current);
    });

    const result = Array.from(categoriesMap.entries()).map(([name, val]) => ({
      category: name,
      disbursedWan: Math.round(val.disbursedWan),
      feeWan: Math.round((val.feeYuan / 10000) * 10) / 10,
      count: val.count,
    }));

    if (result.length === 0) {
      return [
        { category: '房抵经营贷', disbursedWan: 2450, feeWan: 49.0, count: 6 },
        { category: '企业税票贷', disbursedWan: 980, feeWan: 24.5, count: 12 },
        { category: '车辆抵押贷', disbursedWan: 420, feeWan: 12.6, count: 5 },
        { category: '大额保单贷', disbursedWan: 280, feeWan: 8.4, count: 4 },
      ];
    }
    return result;
  }, [loanCases]);

  // 3. 回款状态比例数据 (Pie Chart)
  const recoveryDistributionData = useMemo(() => {
    const settledCases = loanCases.filter((c) => c.isFeeSettled || (c.serviceFeeTotal && (c.serviceFeeDepositPaid || 0) + (c.serviceFeeBalancePaid || 0) >= c.serviceFeeTotal));
    const partialCases = loanCases.filter((c) => !c.isFeeSettled && (c.serviceFeeDepositPaid || 0) > 0);
    const unpaidCases = loanCases.filter((c) => !c.isFeeSettled && (!c.serviceFeeDepositPaid || c.serviceFeeDepositPaid === 0));

    const settledSum = settledCases.reduce((sum, c) => sum + (c.serviceFeeTotal || 0), 0);
    const partialCollectedSum = partialCases.reduce((sum, c) => sum + (c.serviceFeeDepositPaid || 0) + (c.serviceFeeBalancePaid || 0), 0);
    const partialPendingSum = partialCases.reduce((sum, c) => sum + (c.serviceFeeTotal || 0) - ((c.serviceFeeDepositPaid || 0) + (c.serviceFeeBalancePaid || 0)), 0);
    const unpaidSum = unpaidCases.reduce((sum, c) => sum + (c.serviceFeeTotal || 0), 0);

    const total = settledSum + partialCollectedSum + partialPendingSum + unpaidSum;

    if (total === 0) {
      return [
        { name: '已全额结清', value: 85, color: '#10B981', amountLabel: '85%' },
        { name: '已收定金待结尾款', value: 12, color: '#F59E0B', amountLabel: '12%' },
        { name: '待收首期定金', value: 3, color: '#3B82F6', amountLabel: '3%' },
      ];
    }

    return [
      { name: '已全额结清', value: Math.round(settledSum + partialCollectedSum), color: '#10B981', amountLabel: `¥${Math.round((settledSum + partialCollectedSum) / 10000)}万` },
      { name: '待收尾款余额', value: Math.round(partialPendingSum), color: '#F59E0B', amountLabel: `¥${Math.round(partialPendingSum / 10000)}万` },
      { name: '待收首期款', value: Math.round(unpaidSum), color: '#3B82F6', amountLabel: `¥${Math.round(unpaidSum / 10000)}万` },
    ].filter((item) => item.value > 0);
  }, [loanCases]);

  // 4. 顾问回款率与待催尾款榜单
  const consultantRecoveryData = useMemo(() => {
    const map = new Map<string, { consultant: string; receivable: number; collected: number; pending: number }>();

    loanCases.forEach((c) => {
      const name = c.consultantName || '未分配';
      const cur = map.get(name) || { consultant: name, receivable: 0, collected: 0, pending: 0 };
      const fee = c.serviceFeeTotal || 0;
      const rec = (c.serviceFeeDepositPaid || 0) + (c.serviceFeeBalancePaid || 0);
      cur.receivable += fee;
      cur.collected += rec;
      cur.pending += Math.max(0, fee - rec);
      map.set(name, cur);
    });

    const result = Array.from(map.values()).map((item) => {
      const rate = item.receivable > 0 ? Math.round((item.collected / item.receivable) * 100) : 100;
      return {
        ...item,
        receivableWan: Math.round((item.receivable / 10000) * 10) / 10,
        collectedWan: Math.round((item.collected / 10000) * 10) / 10,
        pendingWan: Math.round((item.pending / 10000) * 10) / 10,
        rate,
      };
    }).sort((a, b) => b.rate - a.rate);

    if (result.length === 0) {
      return [
        { consultant: '张强', receivableWan: 38.5, collectedWan: 35.0, pendingWan: 3.5, rate: 91 },
        { consultant: '李明', receivableWan: 26.0, collectedWan: 22.5, pendingWan: 3.5, rate: 86 },
        { consultant: '王敏', receivableWan: 18.2, collectedWan: 14.5, pendingWan: 3.7, rate: 80 },
        { consultant: '陈磊', receivableWan: 14.0, collectedWan: 10.5, pendingWan: 3.5, rate: 75 },
      ];
    }
    return result;
  }, [loanCases]);

  // 5. 导出财务月报 (Excel/CSV 多区块结构化报表)
  const handleExportMonthlyReport = () => {
    const timeLabel = timeRange === 'month' ? '本月经营月报' : timeRange === 'quarter' ? '季度财务专报' : '年度经营总报';
    const now = new Date();
    const dateStr = now.toLocaleDateString('zh-CN');

    // Section 1: 核心汇总指标
    const summaryHeaders = ['指标项', '数值', '单位', '说明'];
    const summaryRows = [
      ['报告统计时段', timeLabel, '-', `生成时间: ${dateStr}`],
      ['在贷与放款总额', metrics.totalDisbursedWan, '万元', `涉及落地放款 ${metrics.disbursedCount} 笔`],
      ['预期服务费应收总额', metrics.totalExpectedFee, '元', '全司预期毛服务费规模'],
      ['已收定金总额', metrics.totalDeposit, '元', '首期实收业务定金'],
      ['已收放款尾款总额', metrics.totalBalance, '元', '放款后实收清算尾款'],
      ['已实收服务费创收', metrics.totalCollected, '元', '全司净现金流入'],
      ['在途待催收尾款', metrics.totalPending, '元', '需顾问跟进催收到账'],
      ['整体服务费回款率', `${metrics.collectedRate}%`, '%', '实收 / 预期应收'],
      ['加权平均服务费率', `${metrics.avgFeeRate}%`, '%', '实收服务费 / 放款本金'],
      ['统计进件总工单数', metrics.totalCasesCount, '笔', '全流程各阶段工单'],
    ];

    // Section 2: 产品类别创收分解
    const productHeaders = ['贷款产品类别', '放款规模 (万元)', '创收服务费 (万元)', '进件单量 (笔)'];
    const productRows = productCategoryData.map((p) => [
      p.category,
      p.disbursedWan,
      p.feeWan,
      p.count,
    ]);

    // Section 3: 顾问回款与待催尾款榜单
    const consultantHeaders = ['经办顾问', '应收服务费 (万元)', '已收服务费 (万元)', '待催尾款 (万元)', '回款达成率 (%)'];
    const consultantRows = consultantRecoveryData.map((c) => [
      c.consultant,
      c.receivableWan,
      c.collectedWan,
      c.pendingWan,
      `${c.rate}%`,
    ]);

    // Section 4: 进件结算明细台账
    const caseHeaders = [
      '工单编号',
      '客户姓名',
      '借款主体',
      '资方银行',
      '贷款产品',
      '申请金额(万)',
      '批复/放款金额(万)',
      '应收服务费(元)',
      '已收定金(元)',
      '已收尾款(元)',
      '结算状态',
      '经办顾问',
      '当前阶段',
    ];
    const caseRows = loanCases.map((c) => [
      c.caseNumber || c.id,
      c.customerName,
      c.productName?.includes('税') || c.productName?.includes('票') || c.productCategory === '企业信用贷' ? '企业法人/商户' : '自然人借款人',
      c.lenderBank || c.lenderInstitution || '合作银行',
      c.productName,
      c.appliedAmount || 0,
      c.approvedAmount || c.appliedAmount || 0,
      c.serviceFeeTotal || 0,
      c.serviceFeeDepositPaid || 0,
      c.serviceFeeBalancePaid || 0,
      c.isFeeSettled ? '已结清' : (c.serviceFeeDepositPaid || 0) + (c.serviceFeeBalancePaid || 0) > 0 ? '部分回款' : '未收结算',
      c.consultantName || '未分配',
      c.stage,
    ]);

    const sections = [
      { title: `助贷业务财务经营月报 (${timeLabel})`, headers: summaryHeaders, rows: summaryRows },
      { title: '产品类别放款与创收构成', headers: productHeaders, rows: productRows },
      { title: '各顾问回款达成率与待催尾款明细', headers: consultantHeaders, rows: consultantRows },
      { title: '进件业务结算全流程台账明细', headers: caseHeaders, rows: caseRows },
    ];

    const filename = timestampedFilename(`助贷财务结算月报_${timeRange}`);
    exportMultiSectionCsv(filename, sections);
    toast.success('已成功导出财务月报表格 (Excel/CSV)', `已生成 ${sections.length} 个结构化报表区块，兼容 Excel 中文显示`);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-4 sm:p-6 space-y-6">
      {/* 顶部标题与时段切换 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Coins className="w-5 h-5" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              财务经营与回款监控看板
            </h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hidden sm:inline-block">
              实时对账同步
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            动态监测本月放款规模、预期服务费创收进账与已回款全景比例，防范坏账与尾款漏收
          </p>
        </div>

        {/* 右侧动作区：时间跨度快捷切换 & 导出财务月报 */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setTimeRange('month')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                timeRange === 'month' ? 'bg-white text-blue-600 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              本月经营
            </button>
            <button
              onClick={() => setTimeRange('quarter')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                timeRange === 'quarter' ? 'bg-white text-blue-600 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              本季度
            </button>
            <button
              onClick={() => setTimeRange('year')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                timeRange === 'year' ? 'bg-white text-blue-600 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              年度累计
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportMonthlyReport}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
            title="导出包含多维度 Recharts 可视化汇总与明细台账的 Excel/CSV 月报"
          >
            <Download className="w-3.5 h-3.5" />
            <span>导出财务月报 (Excel/CSV)</span>
          </button>
        </div>
      </div>

      {/* 4 大核心财务 KPI 矩阵 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: 本月放款总额 */}
        <div className="bg-gradient-to-br from-blue-50/60 to-white p-4.5 rounded-xl border border-blue-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">本月放款总额</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                {metrics.disbursedCount} 笔落地
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono mt-2">
              ¥{(metrics.totalDisbursedWan || 0).toLocaleString()} <span className="text-xs text-slate-500 font-sans font-normal">万元</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-3 pt-2.5 border-t border-blue-100/60 flex items-center justify-between">
            <span>平均费率约 {metrics.avgFeeRate}%</span>
            <span className="text-emerald-600 font-medium flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> 稳步放量
            </span>
          </div>
        </div>

        {/* KPI 2: 预期服务费收入 */}
        <div className="bg-gradient-to-br from-indigo-50/60 to-white p-4.5 rounded-xl border border-indigo-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">预期服务费应收</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
                毛利润包
              </span>
            </div>
            <div className="text-2xl font-bold text-indigo-700 font-mono mt-2">
              ¥{metrics.totalExpectedFee.toLocaleString()}
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-3 pt-2.5 border-t border-indigo-100/60 flex items-center justify-between">
            <span>定金已收 ¥{metrics.totalDeposit.toLocaleString()}</span>
            <span className="text-indigo-600 font-mono font-medium">
              ¥{Math.round(metrics.totalExpectedFee / 10000)} 万
            </span>
          </div>
        </div>

        {/* KPI 3: 已实收服务费 & 回款比例 */}
        <div className="bg-gradient-to-br from-emerald-50/60 to-white p-4.5 rounded-xl border border-emerald-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">已实收服务费</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                回款率 {metrics.collectedRate}%
              </span>
            </div>
            <div className="text-2xl font-bold text-emerald-600 font-mono mt-2">
              ¥{metrics.totalCollected.toLocaleString()}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-emerald-100/60">
            {/* 进度条 */}
            <div className="w-full h-1.5 bg-emerald-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, metrics.collectedRate))}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
              <span>实收定金+尾款</span>
              <span className="text-emerald-700 font-bold">{metrics.collectedRate}% 已入账</span>
            </div>
          </div>
        </div>

        {/* KPI 4: 待结清尾款余额 */}
        <div className="bg-gradient-to-br from-amber-50/60 to-white p-4.5 rounded-xl border border-amber-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">待回款尾款余额</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 flex items-center">
                <AlertTriangle className="w-3 h-3 mr-0.5 text-amber-600" /> 待催缴
              </span>
            </div>
            <div className="text-2xl font-bold text-amber-600 font-mono mt-2">
              ¥{metrics.totalPending.toLocaleString()}
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-3 pt-2.5 border-t border-amber-100/60 flex items-center justify-between">
            <span>放款后即时清算</span>
            <span className="text-amber-700 font-medium">财务一键对账核销</span>
          </div>
        </div>
      </div>

      {/* 可视化图表区：放款与服务费双轴图 + 回款比例环形图 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧 2/3: 各产品线放款金额 vs 预期服务费收入 */}
        <div className="lg:col-span-2 bg-slate-50/50 rounded-xl p-4 sm:p-5 border border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>各贷款产品线放款金额与预期服务费创收对比</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                蓝色柱体代表放款规模 (万元)，紫色折线代表该类别贡献的服务费收入 (万元)
              </p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center text-slate-600">
                <span className="w-3 h-3 rounded bg-blue-600 inline-block mr-1.5" /> 放款金额 (万)
              </span>
              <span className="flex items-center text-slate-600">
                <span className="w-3 h-1.5 rounded-full bg-purple-600 inline-block mr-1.5" /> 预期服务费 (万)
              </span>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={productCategoryData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                  unit="万"
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: '#8B5CF6' }}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                  unit="万"
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white/95 text-slate-900 text-xs p-3 rounded-xl shadow-xl border border-slate-200 space-y-1.5 z-50">
                          <div className="font-bold border-b border-slate-100 pb-1 text-slate-900">
                            {label} ({data.count} 笔工单)
                          </div>
                          <div className="flex items-center justify-between space-x-4 text-blue-700">
                            <span className="text-slate-500">放款总额:</span>
                            <span className="font-bold font-mono">¥{data.disbursedWan} 万元</span>
                          </div>
                          <div className="flex items-center justify-between space-x-4 text-purple-700">
                            <span className="text-slate-500">预期服务费:</span>
                            <span className="font-bold font-mono">¥{data.feeWan} 万元</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="disbursedWan"
                  fill="#2563EB"
                  radius={[4, 4, 0, 0]}
                  barSize={32}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="feeWan"
                  stroke="#8B5CF6"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#8B5CF6', stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 右侧 1/3: 服务费实收与回款状态比例 (Pie Chart) */}
        <div className="bg-slate-50/50 rounded-xl p-4 sm:p-5 border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                <PieIcon className="w-4 h-4 text-emerald-600" />
                <span>服务费已回款全景占比</span>
              </h3>
            </div>
            <p className="text-[11px] text-slate-500">
              已全额入账结清 vs 待收尾款余额分布
            </p>
          </div>

          <div className="h-52 relative flex items-center justify-center my-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={recoveryDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {recoveryDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any, item: any) => [
                    `${item?.payload?.amountLabel || `¥${Number(value || 0).toLocaleString()}元`}`,
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* 中心 KPI 指标 */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[11px] text-slate-400 font-medium">总回款率</span>
              <span className="text-xl font-bold text-slate-900 font-mono">
                {metrics.collectedRate}%
              </span>
            </div>
          </div>

          {/* 图例列表 */}
          <div className="space-y-1.5 pt-2 border-t border-slate-200/60 text-xs">
            {recoveryDistributionData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 font-medium">{item.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-800">{item.amountLabel || `¥${item.value}`}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 顾问回款率与待催收尾款进度排行 */}
      <div className="bg-slate-50/50 rounded-xl p-4 sm:p-5 border border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
            <Users className="w-4 h-4 text-blue-600" />
            <span>经办顾问服务费实收与回款率排行（财务督办）</span>
          </h3>
          <span className="text-xs text-slate-500">
            按回款达成率从高到低排序
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {consultantRecoveryData.slice(0, 4).map((c, idx) => (
            <div key={idx} className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">{c.consultant}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  c.rate >= 90 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : c.rate >= 75 ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  回款率 {c.rate}%
                </span>
              </div>
              <div className="mt-2 text-xs space-y-1">
                <div className="flex justify-between text-slate-500">
                  <span>应收: ¥{c.receivableWan}万</span>
                  <span className="text-emerald-600 font-medium">已收: ¥{c.collectedWan}万</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${c.rate >= 85 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min(100, Math.max(0, c.rate))}%` }}
                  />
                </div>
                {c.pendingWan > 0 && (
                  <div className="text-[10px] text-amber-600 text-right">
                    待催尾款: ¥{c.pendingWan} 万元
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
