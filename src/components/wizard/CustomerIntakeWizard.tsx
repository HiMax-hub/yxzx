import React, { useState, useEffect } from 'react';
import { 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Upload, 
  FileText, 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  Sparkles, 
  Building, 
  Home, 
  Car, 
  Receipt, 
  Wallet, 
  CreditCard, 
  Smartphone, 
  Monitor, 
  CheckCircle2, 
  X, 
  HelpCircle, 
  Send, 
  Calculator, 
  Share2, 
  FileCheck,
  RefreshCw,
  PhoneCall,
  UserCheck,
  Store
} from 'lucide-react';
import { 
  Customer, 
  CustomerGrade, 
  MainSubjectType, 
  LoanPurpose, 
  CreditReportSummary, 
  PropertyAsset, 
  VehicleAsset, 
  BusinessQualification, 
  SalaryQualification, 
  MatchedProduct,
  SystemConfig
} from '../../types';
import { 
  calculatePropertyMortgageSpace, 
  calculateProvidentFundLimit, 
  calculateTaxInvoiceLimit, 
  runRiskAssessment, 
  calculateCreditScorecard,
  calculateRepaymentPlan
} from '../../utils/calculator';
import { INITIAL_PRODUCTS } from '../../data/mockData';
import { useEscToClose } from '../../utils/useEscToClose';

interface CustomerIntakeWizardProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: { name: string; id: string } | null;
  onSaveCustomer: (customer: Customer, autoSubmitToPipeline?: boolean) => void;
  onGenerateSharePoster?: (customer: Customer) => void;
  systemConfig?: SystemConfig;
  products?: MatchedProduct[];
}

export const CustomerIntakeWizard: React.FC<CustomerIntakeWizardProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSaveCustomer,
  onGenerateSharePoster,
  systemConfig,
  products,
}) => {
  // 产品数据源：优先使用 App 层传入的有效产品集（已剔除管理员删减），缺省回退内置产品库
  const productSource = products || INITIAL_PRODUCTS;
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isOcrProcessing, setIsOcrProcessing] = useState<boolean>(false);

  // ESC 关闭
  useEscToClose(isOpen, onClose);

  // Step 1 State: Identity & Intent（不预填示例数据，身份证填写后自动推算性别/年龄）
  const [name, setName] = useState('');
  const [idCard, setIdCard] = useState('');
  const [gender, setGender] = useState<'男' | '女'>('男');
  const [age, setAge] = useState(0);
  const [phone, setPhone] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('未婚');
  const [nativePlace, setNativePlace] = useState('');

  const [requestedAmount, setRequestedAmount] = useState<number>(100); // 万元
  const [requestedTermYears, setRequestedTermYears] = useState<number>(3);
  const [loanPurpose, setLoanPurpose] = useState<LoanPurpose>('business_flow');
  const [urgency, setUrgency] = useState<'急需(3天内)' | '正常(1-2周)' | '储备对比(1月内)'>('正常(1-2周)');
  const [subjectType, setSubjectType] = useState<MainSubjectType>('mortgage');

  // Step 2 State: Credit Summary
  const [creditSummary, setCreditSummary] = useState<CreditReportSummary>({
    hasCurrentOverdue: false,
    currentOverdueAmount: 0,
    hasContinuous3Accumulated6: false,
    badDebtsOrDisposal: false,
    dishonestDebtor: false,
    queryCount1Month: 1,
    queryCount2Month: 3,
    queryCount6Month: 5,
    microLoanCount: 1,
    microLoanBalance: 2,
    creditCardTotalLimit: 30,
    creditCardUsedLimit: 12,
    creditCardUtilizationRate: 40,
    creditLoanBalance: 20,
  });

  // Step 3 State: Asset Qualification Modules（默认不预填资产，由业务员按客户实际情况勾选录入）
  const [hasProperty, setHasProperty] = useState(false);
  const [propertyType, setPropertyType] = useState<'住宅' | '别墅' | '商铺' | '写字楼' | '工业厂房'>('住宅');
  const [propertyCommunity, setPropertyCommunity] = useState('');
  const [propertyArea, setPropertyArea] = useState(0);
  const [estimatedValuation, setEstimatedValuation] = useState(0); // 万元
  const [mortgageBalance, setMortgageBalance] = useState(0); // 万元
  const [ownershipType, setOwnershipType] = useState<'全款房' | '按揭房' | '已抵押'>('全款房');

  const [hasSalary, setHasSalary] = useState(false);
  const [companyType, setCompanyType] = useState<'央企国企' | '上市公司' | '事业单位' | '优质民企' | '普通私企' | '自由职业'>('普通私企');
  const [bankCardSalary, setBankCardSalary] = useState(0);
  const [providentFundMonthlyDeposit, setProvidentFundMonthlyDeposit] = useState(0);
  const [providentFundMonths, setProvidentFundMonths] = useState(0);

  const [hasBusiness, setHasBusiness] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [annualInvoicedAmount, setAnnualInvoicedAmount] = useState(0); // 万元
  const [taxGrade, setTaxGrade] = useState<'A' | 'B' | 'M' | 'C' | '无评级'>('B');

  // 个体商户经营资质（借款主体类型=个体商户时使用：营业执照+经营流水+经营年限）
  const [merchantRevenue, setMerchantRevenue] = useState(0); // 近1年经营流水 (万元)
  const [merchantYears, setMerchantYears] = useState(1); // 营业执照经营年限

  const [hasVehicle, setHasVehicle] = useState(false);
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [vehicleValuation, setVehicleValuation] = useState(0);

  // 身份证填写后自动推算年龄与性别（18位二代证：第7-14位出生日期，第17位奇男偶女）
  const handleIdCardChange = (val: string) => {
    setIdCard(val);
    const cleaned = val.trim();
    if (/^\d{17}[\dXx]$/.test(cleaned)) {
      const birthYear = parseInt(cleaned.slice(6, 10), 10);
      const birthMonth = parseInt(cleaned.slice(10, 12), 10);
      const birthDay = parseInt(cleaned.slice(12, 14), 10);
      const now = new Date();
      let calcAge = now.getFullYear() - birthYear;
      if (now.getMonth() + 1 < birthMonth || (now.getMonth() + 1 === birthMonth && now.getDate() < birthDay)) {
        calcAge -= 1;
      }
      setAge(calcAge >= 0 ? calcAge : 0);
      setGender(parseInt(cleaned[16], 10) % 2 === 1 ? '男' : '女');
    }
  };

  // Derived Calculations
  // 成数参数化：优先读取系统配置（超级管理员可调），缺省走默认 住宅70%/商办50%/别墅55%
  const ltvCfg = systemConfig?.ltvConfig || { residential: 0.7, commercial: 0.5, villa: 0.55 };
  const mortgageSpaceResult = calculatePropertyMortgageSpace(
    propertyType,
    hasProperty ? estimatedValuation : 0,
    hasProperty ? mortgageBalance : 0,
    ltvCfg
  );

  const providentFundLimit = calculateProvidentFundLimit(
    hasSalary ? providentFundMonthlyDeposit : 0,
    hasSalary ? providentFundMonths : 0
  );

  const isMerchant = subjectType === 'merchant';
  const businessBaseWan = isMerchant ? merchantRevenue : annualInvoicedAmount;

  const taxInvoiceLimit = calculateTaxInvoiceLimit(
    hasBusiness ? businessBaseWan : 0,
    taxGrade
  );

  const propertyAssetObj: PropertyAsset = {
    hasProperty,
    propertyType,
    ownershipType,
    certificateNumber: '粤(2021)深圳市不动产权第0092812号',
    city: '深圳市',
    district: '南山区',
    communityName: propertyCommunity,
    areaSqMeters: propertyArea,
    estimatedValuation,
    mortgageBalance,
    availableMortgageSpace: mortgageSpaceResult.availableSpace,
  };

  const vehicleAssetObj: VehicleAsset = {
    hasVehicle,
    brandModel: vehicleBrand,
    purchaseYear: 2023,
    ownershipType: '全款',
    estimatedValuation: vehicleValuation,
  };

  const businessObj: BusinessQualification = {
    hasEnterprise: hasBusiness,
    companyName: isMerchant ? companyName || '个体工商户' : companyName,
    unifiedSocialCode: '91440300MA5EXXX991',
    taxGrade,
    annualInvoicedAmount: businessBaseWan,
    previousYearInvoicedAmount: Math.round(businessBaseWan * 0.9),
    annualRevenueFlow: isMerchant ? businessBaseWan : Math.round(annualInvoicedAmount * 1.2),
    shareholdingRatio: isMerchant ? 100 : 70,
    operatingYears: isMerchant ? merchantYears : 4,
    legalDisputes: false,
  };

  const salaryObj: SalaryQualification = {
    companyType,
    bankCardSalary,
    providentFundMonthlyDeposit,
    providentFundMonths,
    socialSecurityBase: bankCardSalary,
    socialSecurityMonths: providentFundMonths,
  };

  const riskResult = runRiskAssessment(creditSummary, propertyAssetObj, businessObj, salaryObj, systemConfig?.creditRedlines);
  const scoreResult = calculateCreditScorecard(
    creditSummary,
    propertyAssetObj,
    businessObj,
    salaryObj
  );

  // Filter Matched Products
  const matchedProducts: MatchedProduct[] = productSource.map((prod) => {
    let score = 85;
    if (prod.category === '房抵贷' && hasProperty) score += 10;
    if (prod.category === '税金贷' && hasBusiness) score += 8;
    if (prod.category === '公积金贷' && hasSalary) score += 9;
    if (prod.category === '消费信用贷' && hasSalary) score += 6;
    if (prod.category === '装修分期' && loanPurpose === 'home_renovation') score += 8;
    // 个体商户专属：商户经营贷/发票流水贷强匹配
    if (isMerchant && (prod.category === '商户经营贷' || prod.category === '发票流水贷')) score += 12;
    if (isMerchant && hasProperty && prod.category === '房抵贷') score += 6;
    if (riskResult.hardStoppers.length > 0) score -= 40;
    return {
      ...prod,
      matchScore: Math.min(99, Math.max(50, score)),
    };
  }).sort((a, b) => b.matchScore - a.matchScore);

  // 正式版：无演示 OCR 填充（真实 OCR 由银行/外部接口对接，此处手动填单）

  const handleFinalSubmit = (autoPipeline: boolean) => {
    // 黑名单拦截：命中手机号或身份证时禁止建档进件（超级管理员在「黑名单管理」维护）
    const blackHits = (systemConfig?.blacklist || []).filter(
      (b) => (b.phone && b.phone === phone) || (b.idCard && b.idCard.toUpperCase() === idCard.toUpperCase())
    );
    if (blackHits.length > 0) {
      window.alert(
        `⚠️ 风控拦截：该客户已列入黑名单（${blackHits.map((b) => b.reason).join('、')}），禁止建档进件。如有异议请联系超级管理员处理。`
      );
      return;
    }

    const newCustomer: Customer = {
      id: `c-${Date.now().toString().slice(-4)}`,
      name,
      phone,
      idCard,
      grade: scoreResult.grade as CustomerGrade,
      subjectType,
      requestedAmount,
      requestedTermYears,
      purpose: loanPurpose,
      urgency,
      channel: 'self_developed',
      ownerName: currentUser?.name || '待分配',
      ownerId: currentUser?.id,
      status: 'active',
      poolReturnCountdownDays: 15,
      lastContactDate: '刚刚',
      idCardInfo: {
        name,
        idNumber: idCard,
        gender,
        age,
        address: nativePlace,
      },
      creditSummary,
      property: propertyAssetObj,
      vehicle: vehicleAssetObj,
      business: businessObj,
      salary: salaryObj,
      scoreBreakdown: scoreResult.scores,
      matchedProducts,
      followUps: [
        {
          id: `f-${Date.now()}`,
          date: '今日 ' + new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          type: 'visit',
          operator: currentUser?.name || '系统建档',
          content: `完成4步资质建档与初审，意向申贷 ¥${requestedAmount}万元，风控初评等级【${scoreResult.grade}级】。`,
        },
      ],
      createdAt: new Date().toISOString().split('T')[0],
      notes: `意向资金 ¥${requestedAmount}万，期限 ${requestedTermYears}年，用途：${loanPurpose === 'business_flow' ? '流动资金' : '消费置业'}。`,
    };

    onSaveCustomer(newCustomer, autoPipeline);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[92vh] text-[#1E293B]">
        
        {/* Header */}
        <div className="px-5 py-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center space-x-2">
                <span>客户智能建档向导</span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                  移动卡片流
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                OCR秒级识别、硬伤红线拦截与银行产品智能初审
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4-Step Progress Bar Header */}
        <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-200 shrink-0">
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            {[
              { num: 1, title: '1. 身份意向' },
              { num: 2, title: '2. 征信初筛' },
              { num: 3, title: '3. 资质资产' },
              { num: 4, title: '4. 方案匹配' },
            ].map((step) => {
              const isCurrent = currentStep === step.num;
              const isPast = currentStep > step.num;
              return (
                <div
                  key={step.num}
                  onClick={() => setCurrentStep(step.num)}
                  className={`flex items-center space-x-1.5 p-1.5 sm:p-2 rounded-xl border transition cursor-pointer ${
                    isCurrent
                      ? 'bg-white border-blue-500 text-blue-700 shadow-2xs'
                      : isPast
                      ? 'bg-white border-slate-200 text-slate-700'
                      : 'bg-transparent border-transparent text-slate-400'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      isPast
                        ? 'bg-emerald-500 text-white'
                        : isCurrent
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isPast ? <Check className="w-3 h-3" /> : step.num}
                  </div>
                  <span className="text-xs font-semibold truncate">{step.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Wizard Main Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50">
          
          {/* STEP 1: 身份建档与借款意向 */}
          {currentStep === 1 && (
            <div className="space-y-4 max-w-2xl mx-auto">
              {/* Section A: Basic Info */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 shadow-2xs">
                <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5 pb-2 border-b border-slate-100">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span>借款主体身份基本信息</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-500 mb-1">客户姓名</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">手机号码</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">身份证号</label>
                    <input
                      type="text"
                      value={idCard}
                      onChange={(e) => handleIdCardChange(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">婚姻状况</label>
                    <select
                      value={maritalStatus}
                      onChange={(e) => setMaritalStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="未婚">未婚</option>
                      <option value="已婚">已婚</option>
                      <option value="离异">离异</option>
                      <option value="丧偶">丧偶</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">年龄 (自动推算)</label>
                    <input
                      type="number"
                      value={age}
                      readOnly
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">户籍省市</label>
                    <input
                      type="text"
                      value={nativePlace}
                      onChange={(e) => setNativePlace(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section B: Loan Intent */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 shadow-2xs">
                <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5 pb-2 border-b border-slate-100">
                  <Wallet className="w-4 h-4 text-emerald-600" />
                  <span>借款意向与融资金额</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-500 mb-1">期望金额 (万元)</label>
                    <input
                      type="number"
                      value={requestedAmount}
                      onChange={(e) => setRequestedAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold focus:bg-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">借款期限</label>
                    <select
                      value={requestedTermYears}
                      onChange={(e) => setRequestedTermYears(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value={1}>1 年 (短期周转)</option>
                      <option value={3}>3 年 (中期企税/信用)</option>
                      <option value={5}>5 年 (标准房抵/经营)</option>
                      <option value={10}>10 年 (大额低息房抵)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">资金用途</label>
                    <select
                      value={loanPurpose}
                      onChange={(e) => setLoanPurpose(e.target.value as LoanPurpose)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="business_flow">企业经营流动资金</option>
                      <option value="equipment_purchase">采购原材料/设备</option>
                      <option value="home_renovation">房屋装修/大宗消费</option>
                      <option value="debt_consolidation">债务优化降息替换</option>
                      <option value="personal_consumption">个人备用金</option>
                    </select>
                  </div>
                </div>

                {/* Subject Type Switcher */}
                <div className="pt-2">
                  <label className="block text-slate-500 text-xs mb-2">借款主体类型</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {[
                      { type: 'salary' as MainSubjectType, label: '个人工薪消费', icon: Wallet },
                      { type: 'business' as MainSubjectType, label: '小微企业税贷', icon: Building },
                      { type: 'merchant' as MainSubjectType, label: '个体商户经营', icon: Store },
                      { type: 'mortgage' as MainSubjectType, label: '大额资产抵押', icon: Home },
                    ].map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => setSubjectType(item.type)}
                        className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center cursor-pointer ${
                          subjectType === item.type
                            ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <item.icon className="w-4 h-4 mb-1" />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: 征信速评与初筛 */}
          {currentStep === 2 && (
            <div className="space-y-4 max-w-2xl mx-auto">
              {/* Risk Diagnostic Summary */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2 shadow-2xs">
                <div className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>实时风控预警诊断</span>
                </div>

                {riskResult.hardStoppers.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                    🔴 触发一票否决：{riskResult.hardStoppers.join('，')}
                  </div>
                )}

                {riskResult.warningFlags.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                    🟡 瑕疵提示：{riskResult.warningFlags.join('，')}
                  </div>
                )}

                {riskResult.bonusPoints.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
                    🟢 优质亮点：{riskResult.bonusPoints.join('，')}
                  </div>
                )}
              </div>

              {/* Structured Inputs */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 shadow-2xs">
                <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5 pb-2 border-b border-slate-100">
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                  <span>逾期履约与红线指标 (一票否决)</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-500 mb-1">当前存在逾期?</label>
                    <select
                      value={creditSummary.hasCurrentOverdue ? 'true' : 'false'}
                      onChange={(e) => setCreditSummary({ ...creditSummary, hasCurrentOverdue: e.target.value === 'true' })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:bg-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="false">否 (无逾期)</option>
                      <option value="true">是 (有当前逾期)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">近2年连三累六?</label>
                    <select
                      value={creditSummary.hasContinuous3Accumulated6 ? 'true' : 'false'}
                      onChange={(e) => setCreditSummary({ ...creditSummary, hasContinuous3Accumulated6: e.target.value === 'true' })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:bg-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="false">否 (正常)</option>
                      <option value="true">是 (有连三累六)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">呆账/资产处置?</label>
                    <select
                      value={creditSummary.badDebtsOrDisposal ? 'true' : 'false'}
                      onChange={(e) => setCreditSummary({ ...creditSummary, badDebtsOrDisposal: e.target.value === 'true' })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:bg-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="false">无</option>
                      <option value="true">有 (秒拒)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Inquiry & Utilization */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 shadow-2xs">
                <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5 pb-2 border-b border-slate-100">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span>查询频次与信用卡使用率 (DSR)</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-500 mb-1">近1月查询 (次)</label>
                    <input
                      type="number"
                      value={creditSummary.queryCount1Month}
                      onChange={(e) => setCreditSummary({ ...creditSummary, queryCount1Month: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">近半年查询 (次)</label>
                    <input
                      type="number"
                      value={creditSummary.queryCount6Month}
                      onChange={(e) => setCreditSummary({ ...creditSummary, queryCount6Month: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">信用卡已用 (万)</label>
                    <input
                      type="number"
                      value={creditSummary.creditCardUsedLimit}
                      onChange={(e) => setCreditSummary({ ...creditSummary, creditCardUsedLimit: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">未结清小贷 (笔)</label>
                    <input
                      type="number"
                      value={creditSummary.microLoanCount}
                      onChange={(e) => setCreditSummary({ ...creditSummary, microLoanCount: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: 资质与资产补充 */}
          {currentStep === 3 && (
            <div className="space-y-4 max-w-2xl mx-auto">
              {/* Floating Capacity Live Result */}
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                <div className="text-xs text-blue-950 font-bold">
                  {isMerchant
                    ? `测算授信空间：商户流水核额最高 ¥${taxInvoiceLimit.max}万 · 房抵净值 ¥${mortgageSpaceResult.availableSpace}万`
                    : `测算授信空间：房抵净值 ¥${mortgageSpaceResult.availableSpace}万 · 税金贷最高 ¥${taxInvoiceLimit.max}万`}
                </div>
              </div>

              {/* Property Card */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-900">
                    <Home className="w-4 h-4 text-blue-600" />
                    <span>房产资产与抵押空间</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={hasProperty}
                    onChange={(e) => setHasProperty(e.target.checked)}
                    className="w-4 h-4 accent-blue-600 cursor-pointer"
                  />
                </div>

                {hasProperty && (
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-500 mb-1">房产类型</label>
                      <select
                        value={propertyType}
                        onChange={(e) => setPropertyType(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                      >
                        <option value="住宅">普通住宅 (7成)</option>
                        <option value="别墅">别墅 (5.5成)</option>
                        <option value="商铺">商业商铺 (5成)</option>
                        <option value="写字楼">商务写字楼 (5成)</option>
                        <option value="工业厂房">工业厂房 (5成)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-500 mb-1">权属状态</label>
                      <select
                        value={ownershipType}
                        onChange={(e) => setOwnershipType(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                      >
                        <option value="全款房">全款房 (红本一抵)</option>
                        <option value="按揭房">按揭房 (二抵加按)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-500 mb-1">预估市场估值 (万)</label>
                      <input
                        type="number"
                        value={estimatedValuation}
                        onChange={(e) => setEstimatedValuation(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 mb-1">尚欠银行按揭 (万)</label>
                      <input
                        type="number"
                        value={mortgageBalance}
                        onChange={(e) => setMortgageBalance(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Salary & Business */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Salary */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <div className="flex items-center space-x-1 text-xs font-bold text-slate-900">
                      <Wallet className="w-3.5 h-3.5 text-cyan-600" />
                      <span>公积金/工薪资质</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={hasSalary}
                      onChange={(e) => setHasSalary(e.target.checked)}
                      className="w-3.5 h-3.5 accent-blue-600 cursor-pointer"
                    />
                  </div>
                  {hasSalary && (
                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="block text-slate-500 mb-0.5">公积金月缴 (元)</label>
                        <input
                          type="number"
                          value={providentFundMonthlyDeposit}
                          onChange={(e) => setProvidentFundMonthlyDeposit(Number(e.target.value))}
                          className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Business (企业纳税 or 个体户经营) */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <div className="flex items-center space-x-1 text-xs font-bold text-slate-900">
                      <Receipt className="w-3.5 h-3.5 text-purple-600" />
                      <span>{isMerchant ? '个体户经营资质' : '企业纳税资质'}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={hasBusiness}
                      onChange={(e) => setHasBusiness(e.target.checked)}
                      className="w-3.5 h-3.5 accent-blue-600 cursor-pointer"
                    />
                  </div>
                  {hasBusiness && (
                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="block text-slate-500 mb-0.5">{isMerchant ? '营业执照名称' : '企业名称'}</label>
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 mb-0.5">{isMerchant ? '近1年经营流水 (万)' : '近1年开票 (万)'}</label>
                        <input
                          type="number"
                          value={isMerchant ? merchantRevenue : annualInvoicedAmount}
                          onChange={(e) =>
                            isMerchant
                              ? setMerchantRevenue(Number(e.target.value))
                              : setAnnualInvoicedAmount(Number(e.target.value))
                          }
                          className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                        />
                      </div>
                      {isMerchant ? (
                        <div>
                          <label className="block text-slate-500 mb-0.5">营业执照经营年限</label>
                          <select
                            value={merchantYears}
                            onChange={(e) => setMerchantYears(Number(e.target.value))}
                            className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer"
                          >
                            <option value={1}>满 1 年</option>
                            <option value={2}>满 2 年</option>
                            <option value={3}>满 3 年</option>
                            <option value={5}>满 5 年</option>
                          </select>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-slate-500 mb-0.5">纳税评级</label>
                          <select
                            value={taxGrade}
                            onChange={(e) => setTaxGrade(e.target.value as any)}
                            className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer"
                          >
                            <option value="A">A 级</option>
                            <option value="B">B 级</option>
                            <option value="M">M 级</option>
                            <option value="C">C 级</option>
                            <option value="无评级">无评级</option>
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: 初审评级与推荐 */}
          {currentStep === 4 && (
            <div className="space-y-4 max-w-2xl mx-auto">
              {/* Grade Overview Card */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400 font-semibold">综合资质评定等级</div>
                    <div className="text-3xl font-extrabold text-blue-600 font-mono mt-1">
                      {scoreResult.grade} 级
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">综合得分</div>
                    <div className="text-xl font-bold font-mono text-slate-800 mt-1">
                      {scoreResult.scores.overallScore} / 100
                    </div>
                  </div>
                </div>
              </div>

              {/* Matched Product Cards */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-800">
                  智能匹配金融机构产品方案 ({matchedProducts.length}套)
                </div>

                <div className="space-y-2">
                  {matchedProducts.slice(0, 3).map((prod) => (
                    <div key={prod.id} className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-slate-900">{prod.productName} ({prod.bankName})</div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          匹配度 {prod.matchScore}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <span>最高额度: <strong className="font-mono text-slate-900">¥{prod.maxAmount}万</strong></span>
                        <span>年化利率: <strong className="font-mono text-blue-600">{prod.interestRateRange}</strong></span>
                        <span>返佣: <strong>{prod.commissionRate}%</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation Buttons */}
        <div className="px-5 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>上一步</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center space-x-1 cursor-pointer"
              >
                <span>下一步 ({currentStep}/4)</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleFinalSubmit(false)}
                  className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  保存档案
                </button>
                <button
                  type="button"
                  onClick={() => handleFinalSubmit(true)}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center space-x-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>确认并直接发起报审</span>
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
