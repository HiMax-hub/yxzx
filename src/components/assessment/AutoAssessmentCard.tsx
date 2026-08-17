import React, { useState } from 'react';
import { 
  Sparkles, 
  Building2, 
  Home, 
  Receipt, 
  CreditCard, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  RotateCcw,
  Sliders,
  ChevronRight,
  Send,
  Zap,
  Info
} from 'lucide-react';
import { Customer, MatchedProduct, SystemConfig } from '../../types';
import { INITIAL_PRODUCTS } from '../../data/mockData';

interface AutoAssessmentCardProps {
  customers: Customer[];
  onApplyLoan?: (customer: Customer) => void;
  onOpenWizard?: () => void;
  systemConfig?: SystemConfig;
  products?: MatchedProduct[];
}

export const AutoAssessmentCard: React.FC<AutoAssessmentCardProps> = ({
  customers,
  onApplyLoan,
  onOpenWizard,
  systemConfig,
  products,
}) => {
  // 产品数据源：优先使用 App 层传入的有效产品集（已剔除管理员删减），缺省回退内置产品库
  const productSource = products || INITIAL_PRODUCTS;
  // 成数参数：优先读取系统配置（超级管理员在「参数与策略总控」维护），缺省走默认值
  const ltvCfg = systemConfig?.ltvConfig || { residential: 0.7, commercial: 0.5, villa: 0.55 };
  const residentialLtvPct = Math.round((ltvCfg.residential || 0.7) * 100);
  const commercialLtvPct = Math.round((ltvCfg.commercial || 0.5) * 100);
  // Mode: select customer or custom quick test
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('custom');

  // Input states for auto-determination
  const [propertyValue, setPropertyValue] = useState<number>(350); // 房产评估值 (万)
  const [propertyExistingLoan, setPropertyExistingLoan] = useState<number>(120); // 一抵按揭余额 (万)
  const [propertyType, setPropertyType] = useState<'residential' | 'commercial'>('residential'); // 住宅 / 商业

  const [annualTaxWan, setAnnualTaxWan] = useState<number>(15); // 企业年纳税额 (万)
  const [taxGrade, setTaxGrade] = useState<'A' | 'B' | 'C' | 'M'>('A'); // 纳税信用等级
  const [annualInvoiceWan, setAnnualInvoiceWan] = useState<number>(600); // 年开票额 (万)

  const [providentFundMonthly, setProvidentFundMonthly] = useState<number>(2400); // 公积金月缴存额 (元)
  const [providentMonths, setProvidentMonths] = useState<number>(36); // 连续缴纳月数

  const [overdueCount2Years, setOverdueCount2Years] = useState<number>(0); // 2年内逾期次数
  const [maxOverdueDays, setMaxOverdueDays] = useState<number>(0); // 最高逾期天数
  const [queryCount2Months, setQueryCount2Months] = useState<number>(3); // 近2个月硬查询次数

  // If a customer is selected, prefill values
  const handleSelectCustomer = (custId: string) => {
    setSelectedCustomerId(custId);
    if (custId === 'custom') return;

    const target = customers.find((c) => c.id === custId);
    if (!target) return;

    if (target.property?.hasProperty) {
      setPropertyValue(target.property.estimatedValuation || 300);
      setPropertyExistingLoan(target.property.mortgageBalance || 0);
      setPropertyType(
        target.property.propertyType === '商铺' || target.property.propertyType === '写字楼' || target.property.propertyType === '工业厂房'
          ? 'commercial'
          : 'residential'
      );
    }
    if (target.business?.hasEnterprise) {
      setAnnualTaxWan(Math.round((target.business.annualInvoicedAmount || 0) * 0.03));
      const grade = target.business.taxGrade;
      setTaxGrade(grade === 'A' || grade === 'B' || grade === 'M' || grade === 'C' ? grade : 'A');
      setAnnualInvoiceWan(target.business.annualRevenueFlow || 400);
    }
    if (target.salary?.providentFundMonthlyDeposit > 0) {
      setProvidentFundMonthly(target.salary.providentFundMonthlyDeposit || 2000);
      setProvidentMonths(target.salary.providentFundMonths || 24);
    }
    if (target.creditSummary) {
      setOverdueCount2Years(target.creditSummary.hasContinuous3Accumulated6 ? 6 : 0);
      setMaxOverdueDays(target.creditSummary.hasCurrentOverdue ? 30 : 0);
      setQueryCount2Months(target.creditSummary.queryCount2Month || 2);
    }
  };

  // =================== AUTO-DETERMINATION CALCULATION ===================
  // 1. 房产抵押空间判定
  const mortgageLtv = propertyType === 'residential' ? (ltvCfg.residential || 0.7) : (ltvCfg.commercial || 0.5); // 成数参数化：普通住宅 / 商办厂房
  const maxGrossMortgage = Math.round(propertyValue * mortgageLtv * 10) / 10;
  const netMortgageSpace = Math.max(0, Math.round((maxGrossMortgage - propertyExistingLoan) * 10) / 10);

  // 2. 企业税金贷判定
  let taxMultiplier = 6;
  if (taxGrade === 'A') taxMultiplier = 8;
  else if (taxGrade === 'B') taxMultiplier = 6;
  else if (taxGrade === 'M') taxMultiplier = 4;
  else taxMultiplier = 0;

  const maxTaxLoanWan = Math.min(300, Math.round(annualTaxWan * taxMultiplier * 10) / 10);
  const maxInvoiceLoanWan = Math.min(200, Math.round(annualInvoiceWan * 0.12 * 10) / 10);

  // 3. 公积金信用贷判定
  const baseSalary = providentFundMonthly / 0.12;
  const maxProvidentLoanWan = Math.min(100, Math.round((baseSalary * 28) / 10000 * 10) / 10);

  // 4. 征信红线与资质评级判定
  const hasSevereOverdue = maxOverdueDays >= 90 || overdueCount2Years >= 6; // 连三累六
  const hasHighQueries = queryCount2Months > 6; // 查询超标

  let autoGrade: 'S' | 'A' | 'B' | 'C' | 'D' = 'B';
  let gradeReason = '';

  if (hasSevereOverdue) {
    autoGrade = 'D';
    gradeReason = '触发银行风控红线：存在严重逾期（连三累六或超90天），需走特殊增信或非银抵押渠道';
  } else if (hasHighQueries) {
    autoGrade = 'C';
    gradeReason = '近2个月硬查询偏多（>6次），征信偏花，需规避强看查询频次的国有行';
  } else if (netMortgageSpace >= 100 && overdueCount2Years === 0 && queryCount2Months <= 3) {
    autoGrade = 'S';
    gradeReason = '极度优质房抵资产 + 零逾期纯白/良好征信，银行秒批优质准入客户';
  } else if (maxTaxLoanWan >= 80 || (providentFundMonthly >= 2000 && overdueCount2Years <= 2)) {
    autoGrade = 'A';
    gradeReason = '优质纳税/公积金流水 + 征信合规，可直接走国有大行低息信用/税金贷';
  } else {
    autoGrade = 'B';
    gradeReason = '常规资质客户，适配合规股份制银行或持牌机构';
  }

  // 5. 资方产品自动判定推荐 (Auto Product Match)
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const matchedRecommendedProducts: MatchedProduct[] = productSource.filter((p) => {
    if (autoGrade === 'D') return p.category === '房抵贷' && p.bankName.includes('小贷');
    if (netMortgageSpace >= 50 && p.category === '房抵贷') return true;
    if (maxTaxLoanWan >= 30 && p.category === '税金贷') return true;
    if (maxProvidentLoanWan >= 20 && p.category === '公积金贷') return true;
    // 装修用途客户额外推荐装修分期
    if (selectedCustomer?.purpose === 'home_renovation' && p.category === '装修分期') return true;
    // 政采贷/设备融资租赁/票据贴现等企业专属性产品不进个人普通推荐
    return p.category === '消费信用贷';
  }).slice(0, 3);

  const getGradeColor = (g: string) => {
    switch (g) {
      case 'S': return 'bg-emerald-500 text-white';
      case 'A': return 'bg-blue-600 text-white';
      case 'B': return 'bg-sky-500 text-white';
      case 'C': return 'bg-amber-500 text-white';
      case 'D': return 'bg-rose-500 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden text-slate-800">
      {/* Card Header */}
      <div className="p-4.5 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-blue-50/50 via-white to-indigo-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900">贷款资质智能自动判定引擎</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                实时自动测算
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              输入资产流水数据，系统自动核算抵押净额、税金倍数、征信红线与最高授信
            </p>
          </div>
        </div>

        {/* Customer Select / Fast Toggle */}
        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-xs text-slate-500 font-medium">快速载入客户:</span>
          <select
            value={selectedCustomerId}
            onChange={(e) => handleSelectCustomer(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 cursor-pointer max-w-[180px]"
          >
            <option value="custom">⚡ 自定义测算参数</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.grade}级 · {c.phone.slice(-4)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Flow: 2-Column Responsive Form & Auto-Determined Result */}
      <div className="p-4.5 sm:p-6 space-y-6">
        
        {/* Input Parameters Stream */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Section 1: Property */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800">
                <Home className="w-4 h-4 text-blue-600" />
                <span>房产抵押数据</span>
              </div>
              <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded">
                成数 {propertyType === 'residential' ? `${residentialLtvPct}%` : `${commercialLtvPct}%`}
              </span>
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 mb-1">房产市场评估值 (万元):</label>
              <input
                type="number"
                value={propertyValue}
                onChange={(e) => setPropertyValue(Number(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 mb-1">一抵/按揭尚欠余额 (万元):</label>
              <input
                type="number"
                value={propertyExistingLoan}
                onChange={(e) => setPropertyExistingLoan(Number(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 mb-1">房屋性质分类:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPropertyType('residential')}
                  className={`py-1 rounded text-xs font-medium border transition cursor-pointer ${
                    propertyType === 'residential'
                      ? 'bg-blue-600 text-white border-blue-600 font-bold'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  普通住宅 ({residentialLtvPct / 10}成)
                </button>
                <button
                  type="button"
                  onClick={() => setPropertyType('commercial')}
                  className={`py-1 rounded text-xs font-medium border transition cursor-pointer ${
                    propertyType === 'commercial'
                      ? 'bg-blue-600 text-white border-blue-600 font-bold'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  商办/厂房 ({commercialLtvPct / 10}成)
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Enterprise Tax */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span>企业税票数据</span>
              </div>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                倍数 {taxMultiplier}x
              </span>
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 mb-1">近一年实缴纳税额 (万元):</label>
              <input
                type="number"
                value={annualTaxWan}
                onChange={(e) => setAnnualTaxWan(Number(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 mb-1">纳税信用等级:</label>
              <div className="grid grid-cols-4 gap-1">
                {(['A', 'B', 'M', 'C'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setTaxGrade(g)}
                    className={`py-1 rounded text-xs font-bold border transition cursor-pointer ${
                      taxGrade === g
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    {g} 级
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 mb-1">近一年有效开票总额 (万元):</label>
              <input
                type="number"
                value={annualInvoiceWan}
                onChange={(e) => setAnnualInvoiceWan(Number(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Section 3: Salary & Credit Check */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800">
                <CreditCard className="w-4 h-4 text-purple-600" />
                <span>公积金 & 征信情况</span>
              </div>
              <span className="text-[10px] text-purple-600 font-bold bg-purple-50 px-1.5 py-0.5 rounded">
                风控预检
              </span>
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 mb-1">公积金个人月缴额 (元):</label>
              <input
                type="number"
                value={providentFundMonthly}
                onChange={(e) => setProvidentFundMonthly(Number(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 mb-1">近2年逾期次数 / 最长逾期天数:</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="逾期次数"
                  value={overdueCount2Years}
                  onChange={(e) => setOverdueCount2Years(Number(e.target.value) || 0)}
                  className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                />
                <input
                  type="number"
                  placeholder="最高逾期天数"
                  value={maxOverdueDays}
                  onChange={(e) => setMaxOverdueDays(Number(e.target.value) || 0)}
                  className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 mb-1">近2个月贷款/信用卡硬查询次数:</label>
              <input
                type="number"
                value={queryCount2Months}
                onChange={(e) => setQueryCount2Months(Number(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Auto-Determined Results Card Stream */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 border border-blue-100/80 space-y-4.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                🤖 智能判定综合结论:
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-extrabold shadow-xs ${getGradeColor(autoGrade)}`}>
                {autoGrade} 级准入资质
              </span>
            </div>
            
            <div className="text-xs text-slate-500 font-medium">
              判定依据: <span className="text-slate-800 font-semibold">{gradeReason}</span>
            </div>
          </div>

          {/* 3 Core Auto-Determined Space Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Metric 1: Mortgage Space */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-xs">
              <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
                <span>🏡 房抵净可贷净额</span>
                <span className="text-blue-600 font-bold">最高上限</span>
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                ¥{netMortgageSpace} <span className="text-xs font-normal text-slate-500">万元</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                评估 ¥{propertyValue}万 × {propertyType === 'residential' ? `${residentialLtvPct}%` : `${commercialLtvPct}%`} - 一抵 ¥{propertyExistingLoan}万
              </div>
            </div>

            {/* Metric 2: Tax Limit */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-xs">
              <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
                <span>💼 纳税/开票可贷额度</span>
                <span className="text-emerald-600 font-bold">免抵押信用</span>
              </div>
              <div className="text-xl font-bold font-mono text-emerald-600 mt-1">
                ¥{maxTaxLoanWan} <span className="text-xs font-normal text-slate-500">万元</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                年税 ¥{annualTaxWan}万 × {taxMultiplier}倍 (开票测算上限 ¥{maxInvoiceLoanWan}万)
              </div>
            </div>

            {/* Metric 3: Salary Limit */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-xs">
              <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
                <span>💳 公积金信用授信</span>
                <span className="text-purple-600 font-bold">工薪速批</span>
              </div>
              <div className="text-xl font-bold font-mono text-purple-600 mt-1">
                ¥{maxProvidentLoanWan} <span className="text-xs font-normal text-slate-500">万元</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                月缴 ¥{providentFundMonthly}元 × 28倍基数放大
              </div>
            </div>
          </div>

          {/* Matched Products Flow */}
          <div className="pt-2">
            <div className="text-xs font-bold text-slate-800 mb-2.5 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>自动判定的最佳资方报审产品方案:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {matchedRecommendedProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="p-3 bg-white rounded-xl border border-slate-200 hover:border-blue-300 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{prod.productName}</span>
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                        {prod.bankName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-2">
                      <span className="text-slate-400">年化利率:</span>
                      <span className="font-mono font-bold text-blue-600">{prod.interestRateRange}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="text-slate-400">授信上限:</span>
                      <span className="font-mono font-bold text-slate-800">¥{prod.maxAmount}万</span>
                    </div>
                  </div>

                  <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-emerald-600 font-medium">审批约{prod.estimatedApprovalDays}天</span>
                    <button
                      onClick={() => {
                        const targetCust = customers.find(c => c.id === selectedCustomerId) || customers[0];
                        if (targetCust && onApplyLoan) onApplyLoan(targetCust);
                      }}
                      className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] transition cursor-pointer"
                    >
                      一键发起进件
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
