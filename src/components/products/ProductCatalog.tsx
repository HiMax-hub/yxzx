import React, { useState, useMemo } from 'react';
import { 
  PackageSearch, 
  Building2, 
  CheckCircle2, 
  Search, 
  Filter, 
  Percent, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  ChevronRight, 
  Sparkles, 
  Store, 
  CreditCard, 
  Landmark, 
  Receipt, 
  Wallet, 
  Timer, 
  TrendingUp, 
  SlidersHorizontal, 
  Sliders, 
  X, 
  Banknote, 
  Car, 
  Trash2, 
  Coins, 
  Zap, 
  ArrowRight, 
  FileCheck, 
  UserCheck, 
  Check, 
  XCircle, 
  AlertCircle, 
  HelpCircle, 
  BarChart2, 
  Layers, 
  ArrowUpDown, 
  RefreshCw, 
  User,
  Info,
  Calendar,
  FileText,
  Copy,
  ExternalLink,
  ChevronDown,
  LayoutGrid,
  List
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { MatchedProduct, BankProductPolicy } from '../../types';
import { INITIAL_PRODUCTS } from '../../data/mockData';

interface ProductCatalogProps {
  onSelectProductToMatch?: (product: MatchedProduct) => void;
  bankProductPolicies?: BankProductPolicy[];
  products?: MatchedProduct[];
  canManage?: boolean;
  onRemoveProduct?: (productId: string) => void;
}

interface CategoryItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  badgeCount?: number;
  isMerchant?: boolean;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  onSelectProductToMatch,
  bankProductPolicies,
  products,
  canManage,
  onRemoveProduct,
}) => {
  const productSource = products || INITIAL_PRODUCTS;

  // View Layout Mode: Cards vs Compact List
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Search, Category & Bank Filters
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [institutionFilter, setInstitutionFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'match_desc' | 'rate_asc' | 'amount_desc' | 'time_asc'>('match_desc');
  const [showChart, setShowChart] = useState<boolean>(true);

  // Customer Persona Simulation State (左侧客户画像需求模拟)
  const [customerType, setCustomerType] = useState<'individual' | 'business' | 'merchant'>('business');
  const [targetAmountWan, setTargetAmountWan] = useState<number>(100);
  const [hasRealEstate, setHasRealEstate] = useState<boolean>(true);
  const [hasTaxRecord, setHasTaxRecord] = useState<boolean>(true);
  const [hasProvidentFund, setHasProvidentFund] = useState<boolean>(false);
  const [hasMerchantFlow, setHasMerchantFlow] = useState<boolean>(false);
  const [creditQuality, setCreditQuality] = useState<'excellent' | 'normal' | 'minor_issue'>('excellent');
  const [maxExpectedRate, setMaxExpectedRate] = useState<number>(6.5);

  // Detail Modal State
  const [detailProduct, setDetailProduct] = useState<MatchedProduct | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Preset Customer Scenarios (快捷一键套用画像)
  const applyPresetScenario = (type: 'mortgage' | 'tax' | 'merchant' | 'salary') => {
    if (type === 'mortgage') {
      setCustomerType('business');
      setTargetAmountWan(300);
      setHasRealEstate(true);
      setHasTaxRecord(true);
      setHasProvidentFund(false);
      setHasMerchantFlow(false);
      setCreditQuality('excellent');
      setMaxExpectedRate(4.0);
      setActiveCategory('房抵贷');
    } else if (type === 'tax') {
      setCustomerType('business');
      setTargetAmountWan(100);
      setHasRealEstate(false);
      setHasTaxRecord(true);
      setHasProvidentFund(false);
      setHasMerchantFlow(false);
      setCreditQuality('excellent');
      setMaxExpectedRate(4.5);
      setActiveCategory('税金贷');
    } else if (type === 'merchant') {
      setCustomerType('merchant');
      setTargetAmountWan(50);
      setHasRealEstate(false);
      setHasTaxRecord(false);
      setHasProvidentFund(false);
      setHasMerchantFlow(true);
      setCreditQuality('normal');
      setMaxExpectedRate(6.0);
      setActiveCategory('商户经营贷');
    } else if (type === 'salary') {
      setCustomerType('individual');
      setTargetAmountWan(30);
      setHasRealEstate(false);
      setHasTaxRecord(false);
      setHasProvidentFund(true);
      setHasMerchantFlow(false);
      setCreditQuality('excellent');
      setMaxExpectedRate(5.5);
      setActiveCategory('公积金贷');
    }
  };

  const handleResetSimulator = () => {
    setCustomerType('business');
    setTargetAmountWan(100);
    setHasRealEstate(true);
    setHasTaxRecord(true);
    setHasProvidentFund(false);
    setHasMerchantFlow(false);
    setCreditQuality('excellent');
    setMaxExpectedRate(6.5);
    setActiveCategory('all');
    setInstitutionFilter('all');
    setSearchQuery('');
    setSortBy('match_desc');
  };

  // Distinct Partner Banks
  const institutionList = useMemo(() => {
    const set = new Set<string>();
    productSource.forEach(p => {
      if (p.bankName) set.add(p.bankName);
    });
    return Array.from(set);
  }, [productSource]);

  // Categories Definition with real counts
  const categoriesList: CategoryItem[] = useMemo(() => [
    { id: 'all', name: '全部信贷产品', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: '房抵贷', name: '房产抵押贷', icon: <Building2 className="w-3.5 h-3.5" /> },
    { id: '税金贷', name: '企业税票贷', icon: <Receipt className="w-3.5 h-3.5" /> },
    { id: '公积金贷', name: '公积金消费贷', icon: <Wallet className="w-3.5 h-3.5" /> },
    { id: '消费信用贷', name: '消费信用贷', icon: <CreditCard className="w-3.5 h-3.5" /> },
    { id: '商户经营贷', name: '商户经营贷', icon: <Store className="w-3.5 h-3.5" />, isMerchant: true },
    { id: '车抵贷', name: '车辆抵押贷', icon: <Car className="w-3.5 h-3.5" /> },
    { id: '政采贷', name: '政采/供应链金融', icon: <Landmark className="w-3.5 h-3.5" /> },
  ], []);

  const countByCategory = (catId: string) => {
    if (catId === 'all') return productSource.length;
    return productSource.filter((p) => p.category === catId).length;
  };

  // Intelligent Policy Matching Scoring Engine
  const scoredProducts = useMemo(() => {
    return productSource.map((p) => {
      let score = 70;
      const passedPoints: string[] = [];
      const restrictedPoints: string[] = [];

      // 1. 融资金额匹配 (Amount Fit)
      if (targetAmountWan >= p.minAmount && targetAmountWan <= p.maxAmount) {
        score += 12;
        passedPoints.push(`融资金额 ¥${targetAmountWan}万 符合单笔授信区间 [${p.minAmount}-${p.maxAmount}万]`);
      } else if (targetAmountWan > p.maxAmount) {
        score -= 25;
        restrictedPoints.push(`需求金额 ¥${targetAmountWan}万 超过该产品最高单笔上限 ¥${p.maxAmount}万`);
      } else {
        score += 5;
        passedPoints.push(`融资金额满足基本起贷门槛 (≥¥${p.minAmount}万)`);
      }

      // 2. 资产/资质硬性准入匹配 (Asset & Entity Requirements)
      if (p.category === '房抵贷') {
        if (hasRealEstate) {
          score += 15;
          passedPoints.push('借款人名下有商品房产，符合房产抵押风控底线');
        } else {
          score -= 40;
          restrictedPoints.push('核心硬性要求：必须提供商品房/别墅等产权房产做抵押');
        }
      }

      if (p.category === '税金贷') {
        if (hasTaxRecord) {
          score += 15;
          passedPoints.push('企业纳税记录合规（B级以上/年纳税超2万），满足税票贷准入');
        } else {
          score -= 35;
          restrictedPoints.push('核心硬性要求：企业需连续纳税满1年且无重大欠税记录');
        }
      }

      if (p.category === '公积金贷' || p.category === '消费信用贷') {
        if (hasProvidentFund || customerType === 'individual') {
          score += 15;
          passedPoints.push('借款人具备公积金缴存或稳定打卡工薪，满足信用进件要求');
        } else {
          score -= 10;
          restrictedPoints.push('建议具备连续缴纳公积金或稳定打卡月薪以提升批核率');
        }
      }

      if (p.category === '商户经营贷') {
        if (hasMerchantFlow || customerType === 'merchant') {
          score += 15;
          passedPoints.push('实体经营POS机/聚合扫码流水满足商户准入');
        } else {
          score -= 25;
          restrictedPoints.push('核心要求：需提供实体商户营业执照与POS/扫码对公流水');
        }
      }

      // 3. 征信健康度核验 (Credit Quality)
      if (creditQuality === 'excellent') {
        score += 8;
        passedPoints.push('征信极佳：近2年无逾期，征信查询频次合规');
      } else if (creditQuality === 'normal') {
        score += 0;
        passedPoints.push('征信良好：偶有轻微逾期，多数产品可正常进件');
      } else if (creditQuality === 'minor_issue') {
        if (p.category === '房抵贷' || p.category === '车抵贷') {
          score -= 5;
          restrictedPoints.push('抵押类产品对轻微征信瑕疵容忍度较高，可通过沟通加批');
        } else {
          score -= 22;
          restrictedPoints.push('纯信用/税票贷对近期连3累6逾期或高频查询有拦截风险');
        }
      }

      // 4. 期望利率匹配 (Interest Rate Expectations)
      const parsedMinRate = parseFloat(p.interestRateRange.replace(/[^\d.]/g, '')) || 3.5;
      if (parsedMinRate <= maxExpectedRate) {
        score += 5;
        passedPoints.push(`产品起步年化 ${p.interestRateRange} 满足期望 (≤${maxExpectedRate}%)`);
      } else {
        restrictedPoints.push(`产品参考利率高于客户心理预期`);
      }

      // 补充产品特色
      p.requirements.forEach(req => {
        if (!passedPoints.some(pt => pt.includes(req.slice(0, 4))) && !restrictedPoints.some(rp => rp.includes(req.slice(0, 4)))) {
          passedPoints.push(req);
        }
      });

      const finalScore = Math.max(20, Math.min(99, score));
      return {
        ...p,
        matchScore: finalScore,
        passedPoints,
        restrictedPoints
      };
    });
  }, [productSource, customerType, targetAmountWan, hasRealEstate, hasTaxRecord, hasProvidentFund, hasMerchantFlow, creditQuality, maxExpectedRate]);

  // Filtered & Ranked Products
  const filteredProducts = useMemo(() => {
    return scoredProducts.filter((p) => {
      if (activeCategory !== 'all' && p.category !== activeCategory) return false;
      if (institutionFilter !== 'all' && p.bankName !== institutionFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hit =
          p.productName.toLowerCase().includes(q) ||
          p.bankName.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.requirements.some(r => r.toLowerCase().includes(q)) ||
          p.features.some(f => f.toLowerCase().includes(q));
        if (!hit) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'match_desc') return b.matchScore - a.matchScore;
      if (sortBy === 'rate_asc') {
        const rateA = parseFloat(a.interestRateRange.replace(/[^\d.]/g, '')) || 99;
        const rateB = parseFloat(b.interestRateRange.replace(/[^\d.]/g, '')) || 99;
        return rateA - rateB;
      }
      if (sortBy === 'amount_desc') return b.maxAmount - a.maxAmount;
      if (sortBy === 'time_asc') return (a.estimatedApprovalDays || 5) - (b.estimatedApprovalDays || 5);
      return 0;
    });
  }, [scoredProducts, activeCategory, searchQuery, institutionFilter, sortBy]);

  // Match tier stats
  const matchStats = useMemo(() => {
    const topRecommended = filteredProducts.filter(p => p.matchScore >= 85).length;
    const basicPassed = filteredProducts.filter(p => p.matchScore >= 65 && p.matchScore < 85).length;
    const needSupplement = filteredProducts.filter(p => p.matchScore < 65).length;
    return { topRecommended, basicPassed, needSupplement };
  }, [filteredProducts]);

  // Recharts Data: 利率区间分布
  const rateChartData = useMemo(() => {
    const buckets: Record<string, { range: string; count: number; desc: string }> = {
      'tier1': { range: '3.0%-3.8%', count: 0, desc: '特惠国企/房抵' },
      'tier2': { range: '3.8%-4.5%', count: 0, desc: '主流企税/优质' },
      'tier3': { range: '4.5%-6.0%', count: 0, desc: '商户/工薪消费' },
      'tier4': { range: '6.0%-8.5%', count: 0, desc: '持牌消金/急用' },
    };

    filteredProducts.forEach(p => {
      const minRate = parseFloat(p.interestRateRange.replace(/[^\d.]/g, '')) || 4.0;
      if (minRate < 3.8) buckets['tier1'].count += 1;
      else if (minRate < 4.5) buckets['tier2'].count += 1;
      else if (minRate < 6.0) buckets['tier3'].count += 1;
      else buckets['tier4'].count += 1;
    });

    return Object.values(buckets);
  }, [filteredProducts]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto text-slate-800">
      
      {/* 1. Header & Identity Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-xs shrink-0">
            <PackageSearch className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                资方信贷产品库与准入政策匹配
              </h1>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200">
                实时政策匹配引擎
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              基于客户画像（主体、额度、资产、征信、利率），智能测算资方银行准入政策、阻断拦截点与利率区间对比
            </p>
          </div>
        </div>

        {/* Global Statistics Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
            <span className="text-slate-400">总产品库:</span>
            <strong className="font-mono text-slate-900">{productSource.length}</strong>
            <span className="text-slate-400">款</span>
          </div>

          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
            <span className="text-slate-400">合作资方:</span>
            <strong className="font-mono text-slate-900">{institutionList.length}</strong>
            <span className="text-slate-400">家</span>
          </div>

          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>当前匹配池: <strong>{filteredProducts.length}</strong> 款</span>
          </div>
        </div>
      </div>

      {/* 2. Full-Width Global Filter & Category Navigation Bar (全面重构顶部分类与检索区，彻底消除挤压与横向滚动条) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
        
        {/* Category Pills Navigation (Clean wrap, no squished scrollbars) */}
        <div>
          <div className="text-xs font-bold text-slate-500 mb-2 flex items-center justify-between">
            <span>信贷产品分类专区</span>
            <span className="text-[11px] text-slate-400 font-normal">点击快速筛选特定贷款类型</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {categoriesList.map((cat) => {
              const isActive = activeCategory === cat.id;
              const count = countByCategory(cat.id);

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                    isActive
                      ? cat.isMerchant
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className={isActive ? 'text-white' : 'text-slate-500'}>{cat.icon}</span>
                  <span>{cat.name}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200/70 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Secondary Filter & Search Toolbar */}
        <div className="pt-3 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Preset Persona Quick Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-600 flex items-center space-x-1 mr-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>快速画像套用:</span>
            </span>

            <button
              type="button"
              onClick={() => applyPresetScenario('mortgage')}
              className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 transition cursor-pointer font-medium"
            >
              🏢 大额房抵 (300万/低息)
            </button>

            <button
              type="button"
              onClick={() => applyPresetScenario('tax')}
              className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 transition cursor-pointer font-medium"
            >
              📑 企业税票 (100万/免抵押)
            </button>

            <button
              type="button"
              onClick={() => applyPresetScenario('merchant')}
              className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 transition cursor-pointer font-medium"
            >
              🏪 个体商户 (50万/流水贷)
            </button>

            <button
              type="button"
              onClick={() => applyPresetScenario('salary')}
              className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 transition cursor-pointer font-medium"
            >
              💼 工薪公积金 (30万/消费)
            </button>
          </div>

          {/* Search, Bank Institution & Sorting Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Institution Filter */}
            <select
              value={institutionFilter}
              onChange={(e) => setInstitutionFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">所有资方银行 ({institutionList.length}家)</option>
              {institutionList.map(inst => (
                <option key={inst} value={inst}>{inst}</option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="match_desc">🎯 准入匹配度最高</option>
              <option value="rate_asc">📉 年化利率最低优先</option>
              <option value="amount_desc">💰 授信额度最大优先</option>
              <option value="time_asc">⚡ 审批时效最快优先</option>
            </select>

            {/* Search Input */}
            <div className="relative w-full sm:w-52">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索产品名/资方/准入规则..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === 'cards' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="卡片图文对照模式"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="紧凑表格对比模式"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* 3. Main Dual-Column Workflow Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Customer Persona Simulator (借款人画像与需求模拟器) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-5 sticky top-20">
          
          {/* Simulator Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs">
                1
              </div>
              <h2 className="text-sm font-bold text-slate-900">借款人画像与准入要素模拟</h2>
            </div>
            
            <button
              type="button"
              onClick={handleResetSimulator}
              className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center space-x-1 font-bold transition cursor-pointer"
              title="重置模拟参数"
            >
              <RefreshCw className="w-3 h-3" />
              <span>重置条件</span>
            </button>
          </div>

          {/* Persona Dimension 1: Entity Type */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">借款主体性质</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'business', label: '小微企业主' },
                { id: 'merchant', label: '个体工商户' },
                { id: 'individual', label: '个人工薪族' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setCustomerType(t.id as any)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold border transition cursor-pointer text-center ${
                    customerType === t.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Persona Dimension 2: Target Amount */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">意向融资金额</span>
              <span className="font-mono font-black text-blue-600 text-sm">¥{targetAmountWan} 万元</span>
            </div>
            <input
              type="range"
              min={10}
              max={1500}
              step={10}
              value={targetAmountWan}
              onChange={(e) => setTargetAmountWan(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            {/* Quick Amount Pills */}
            <div className="flex items-center justify-between gap-1 pt-1">
              {[30, 50, 100, 300, 500, 1000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setTargetAmountWan(amt)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition cursor-pointer ${
                    targetAmountWan === amt
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {amt}万
                </button>
              ))}
            </div>
          </div>

          {/* Persona Dimension 3: Core Collateral & Financial Assets */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-bold text-slate-700 block">核心资产与增信凭证</label>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setHasRealEstate(!hasRealEstate)}
                className={`p-2.5 rounded-xl border flex items-center justify-between transition cursor-pointer text-left ${
                  hasRealEstate 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold' 
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <span className="flex items-center space-x-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>名下商品房产</span>
                </span>
                {hasRealEstate ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-300" />}
              </button>

              <button
                type="button"
                onClick={() => setHasTaxRecord(!hasTaxRecord)}
                className={`p-2.5 rounded-xl border flex items-center justify-between transition cursor-pointer text-left ${
                  hasTaxRecord 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold' 
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <span className="flex items-center space-x-1.5">
                  <Receipt className="w-3.5 h-3.5 text-indigo-600" />
                  <span>连续纳税记录</span>
                </span>
                {hasTaxRecord ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-300" />}
              </button>

              <button
                type="button"
                onClick={() => setHasMerchantFlow(!hasMerchantFlow)}
                className={`p-2.5 rounded-xl border flex items-center justify-between transition cursor-pointer text-left ${
                  hasMerchantFlow 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold' 
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <span className="flex items-center space-x-1.5">
                  <Store className="w-3.5 h-3.5 text-amber-600" />
                  <span>商户扫码流水</span>
                </span>
                {hasMerchantFlow ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-300" />}
              </button>

              <button
                type="button"
                onClick={() => setHasProvidentFund(!hasProvidentFund)}
                className={`p-2.5 rounded-xl border flex items-center justify-between transition cursor-pointer text-left ${
                  hasProvidentFund 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold' 
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <span className="flex items-center space-x-1.5">
                  <Wallet className="w-3.5 h-3.5 text-purple-600" />
                  <span>连续公积金社保</span>
                </span>
                {hasProvidentFund ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <X className="w-3.5 h-3.5 text-slate-300" />}
              </button>
            </div>
          </div>

          {/* Persona Dimension 4: Credit Quality */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">征信记录状态</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'excellent', label: '极佳无逾期' },
                { id: 'normal', label: '良好(偶有)' },
                { id: 'minor_issue', label: '轻微逾期/多查' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCreditQuality(c.id as any)}
                  className={`py-1.5 px-1 rounded-xl text-xs font-semibold border transition cursor-pointer text-center ${
                    creditQuality === c.id
                      ? 'bg-blue-50 text-blue-700 border-blue-300 font-bold shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Persona Dimension 5: Expected Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">期望最高年化利率</span>
              <span className="font-mono font-bold text-slate-900">{maxExpectedRate}% 以内</span>
            </div>
            <input
              type="range"
              min={3.0}
              max={12.0}
              step={0.1}
              value={maxExpectedRate}
              onChange={(e) => setMaxExpectedRate(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Live Simulator Summary Box */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-2">
            <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span className="flex items-center space-x-1.5 text-blue-700">
                <Sparkles className="w-3.5 h-3.5" />
                <span>实时准入测算统计</span>
              </span>
              <span className="text-[11px] font-mono font-bold text-slate-500">共匹配 {filteredProducts.length} 款</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="text-[10px] text-emerald-700 font-bold">高度推荐</div>
                <div className="text-sm font-black font-mono text-emerald-800 mt-0.5">{matchStats.topRecommended} 款</div>
              </div>
              <div className="p-2 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="text-[10px] text-blue-700 font-bold">基本准入</div>
                <div className="text-sm font-black font-mono text-blue-800 mt-0.5">{matchStats.basicPassed} 款</div>
              </div>
              <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="text-[10px] text-amber-700 font-bold">需补资质</div>
                <div className="text-sm font-black font-mono text-amber-800 mt-0.5">{matchStats.needSupplement} 款</div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
              💡 提示：调整左侧画像要素时，右侧卡片将自动重新计算风控阻断点、准入要件与综合匹配度分值。
            </p>
          </div>

        </div>

        {/* Right Column: Matched Products & Policy Cards Grid (智能准入政策对照与产品匹配池) */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* Collapsible Rate Distribution Chart Header */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BarChart2 className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-900">匹配产品年化利率梯队分布</span>
                <span className="text-[11px] text-slate-400 font-normal">
                  （平均审批时效约 2.2 工作日）
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowChart(!showChart)}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center space-x-1 cursor-pointer font-medium"
              >
                <span>{showChart ? '收起图表' : '展开图表'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showChart ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {showChart && (
              <div className="pt-2 border-t border-slate-100">
                <div className="h-28 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rateChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="range" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '11px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                        formatter={(val: any) => [`${val} 款信贷产品`, '入库数量']}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {rateChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#3B82F6' : index === 1 ? '#6366F1' : index === 2 ? '#8B5CF6' : '#F59E0B'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Product View Mode 1: Cards View */}
          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProducts.length === 0 ? (
                <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-xs">
                  <PackageSearch className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-800">未找到符合当前画像或筛选条件的产品</p>
                  <p className="text-xs text-slate-400 mt-1">请尝试在左侧调整意向金额或点击「重置条件」</p>
                  <button
                    type="button"
                    onClick={handleResetSimulator}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-blue-700 transition cursor-pointer"
                  >
                    重置所有筛选画像
                  </button>
                </div>
              ) : (
                filteredProducts.map((p) => {
                  const isTopMatch = p.matchScore >= 85;
                  const isGoodMatch = p.matchScore >= 65 && p.matchScore < 85;

                  return (
                    <div
                      key={p.id}
                      className={`bg-white rounded-2xl border transition-all duration-200 p-5 flex flex-col justify-between hover:shadow-md ${
                        isTopMatch
                          ? 'border-blue-300 ring-1 ring-blue-100'
                          : 'border-slate-200/90'
                      }`}
                    >
                      <div className="space-y-3.5">
                        
                        {/* Card Header & Match Score Badge */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center space-x-1.5">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                {p.bankName}
                              </span>
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                                {p.category}
                              </span>
                            </div>
                            <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-1.5 line-clamp-1" title={p.productName}>
                              {p.productName}
                            </h3>
                          </div>

                          {/* Match Score Badge */}
                          <div className="text-right shrink-0">
                            <div className={`px-2.5 py-1 rounded-xl text-xs font-black inline-flex items-center space-x-1 ${
                              isTopMatch
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : isGoodMatch
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              <span>准入度</span>
                              <span className="font-mono text-sm font-black">{p.matchScore}%</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {isTopMatch ? '极高推荐' : isGoodMatch ? '基本准入' : '需增补资质'}
                            </div>
                          </div>
                        </div>

                        {/* Key Financial Parameters Matrix */}
                        <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                          <div>
                            <div className="text-slate-400 text-[10px]">年化利率</div>
                            <div className="text-xs sm:text-sm font-black font-mono text-blue-600 mt-0.5 truncate">
                              {p.interestRateRange}
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-400 text-[10px]">最高授信</div>
                            <div className="text-xs sm:text-sm font-black font-mono text-slate-900 mt-0.5">
                              ¥{p.minAmount}-{p.maxAmount}万
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-400 text-[10px]">审批时效</div>
                            <div className="text-xs sm:text-sm font-black font-mono text-slate-900 mt-0.5">
                              {p.estimatedApprovalDays || 3} 工作日
                            </div>
                          </div>
                        </div>

                        {/* Bank Policy Contrast Matrix (银行准入政策对照矩阵) */}
                        <div className="space-y-1.5 text-xs">
                          <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                            <span>银行准入政策对照点:</span>
                            <span className="text-slate-400 font-normal">多维核验</span>
                          </div>

                          {/* Passed Checkpoints */}
                          <div className="space-y-1">
                            {p.passedPoints.slice(0, 2).map((pt, i) => (
                              <div key={`pass-${i}`} className="flex items-start space-x-1.5 p-1.5 rounded-lg bg-emerald-50/70 border border-emerald-100 text-emerald-900 text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span className="leading-tight line-clamp-1">{pt}</span>
                              </div>
                            ))}
                          </div>

                          {/* Restricted Points */}
                          {p.restrictedPoints.length > 0 && (
                            <div className="space-y-1">
                              {p.restrictedPoints.slice(0, 2).map((rp, i) => (
                                <div key={`res-${i}`} className="flex items-start space-x-1.5 p-1.5 rounded-lg bg-rose-50/70 border border-rose-100 text-rose-900 text-[11px]">
                                  <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                                  <span className="leading-tight line-clamp-1">{rp}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Product Highlights */}
                        <div className="flex flex-wrap gap-1">
                          {p.features.slice(0, 3).map((f, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                              ✓ {f}
                            </span>
                          ))}
                        </div>

                      </div>

                      {/* Card Footer & Actions */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-3 text-xs">
                        <div className="text-[11px] text-slate-500">
                          渠道返佣: <strong className="text-slate-800 font-mono font-bold">{p.commissionRate}%</strong>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => setDetailProduct(p)}
                            className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
                          >
                            准入细则
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (onSelectProductToMatch) onSelectProductToMatch(p);
                            }}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 shadow-xs cursor-pointer"
                          >
                            <span>选定报审</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Product View Mode 2: Compact Table View */}
          {viewMode === 'table' && (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="p-3.5">资方及产品名称</th>
                      <th className="p-3.5">贷款类别</th>
                      <th className="p-3.5">准入匹配度</th>
                      <th className="p-3.5">参考年化利率</th>
                      <th className="p-3.5">授信额度</th>
                      <th className="p-3.5">时效</th>
                      <th className="p-3.5">返佣</th>
                      <th className="p-3.5 text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{p.productName}</div>
                          <div className="text-[11px] text-slate-400">{p.bankName}</div>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {p.category}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-lg text-xs font-black font-mono ${
                            p.matchScore >= 85 ? 'bg-emerald-50 text-emerald-700' : p.matchScore >= 65 ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {p.matchScore}%
                          </span>
                        </td>
                        <td className="p-3.5 font-bold font-mono text-blue-600">{p.interestRateRange}</td>
                        <td className="p-3.5 font-bold font-mono text-slate-800">¥{p.minAmount}-{p.maxAmount}万</td>
                        <td className="p-3.5 text-slate-600">{p.estimatedApprovalDays || 3} 天</td>
                        <td className="p-3.5 font-bold font-mono text-slate-700">{p.commissionRate}%</td>
                        <td className="p-3.5 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => setDetailProduct(p)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                          >
                            准入细则
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (onSelectProductToMatch) onSelectProductToMatch(p);
                            }}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer transition"
                          >
                            选定报审
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* 4. Product Policy Detail & Material Checklist Modal */}
      {detailProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 border border-slate-200 animate-in fade-in max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {detailProduct.bankName} · {detailProduct.category}
                  </span>
                  <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                    detailProduct.matchScore >= 85 ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                  }`}>
                    画像匹配评分: {detailProduct.matchScore}分
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{detailProduct.productName}</h3>
              </div>

              <button
                type="button"
                onClick={() => setDetailProduct(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Core Financial Parameters */}
            <div className="grid grid-cols-4 gap-2.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
              <div>
                <div className="text-slate-400 text-[11px]">年化利率</div>
                <div className="text-sm font-black font-mono text-blue-600 mt-0.5">{detailProduct.interestRateRange}</div>
              </div>
              <div>
                <div className="text-slate-400 text-[11px]">授信额度区间</div>
                <div className="text-sm font-black font-mono text-slate-900 mt-0.5">¥{detailProduct.minAmount}-{detailProduct.maxAmount}万</div>
              </div>
              <div>
                <div className="text-slate-400 text-[11px]">最长授信期限</div>
                <div className="text-sm font-black font-mono text-slate-900 mt-0.5">{detailProduct.maxTermYears || 5} 年</div>
              </div>
              <div>
                <div className="text-slate-400 text-[11px]">审批时效</div>
                <div className="text-sm font-black font-mono text-slate-900 mt-0.5">{detailProduct.estimatedApprovalDays || 3} 工作日</div>
              </div>
            </div>

            {/* Policy Admission Rules & Restraints */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>银行准入政策与风控底线规则</span>
              </div>

              <div className="space-y-1.5 text-xs">
                {detailProduct.requirements.map((req, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start space-x-2 text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{req}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Credit Quality & Query Requirements */}
            {detailProduct.creditRequirements && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>征信要求与查询频次限制</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs text-slate-700">
                  {detailProduct.creditRequirements.map((cr, idx) => (
                    <div key={idx} className="flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span>{cr}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Required Materials Checklist */}
            {detailProduct.requiredMaterials && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>必备报审进件材料清单 ({detailProduct.requiredMaterials.length}项)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(detailProduct.requiredMaterials?.join('、') || '')}
                    className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center space-x-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedText ? '已复制材料清单' : '一键复制清单'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {detailProduct.requiredMaterials.map((mat, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center space-x-2 text-slate-700">
                      <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span>{mat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDetailProduct(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                关闭
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onSelectProductToMatch) onSelectProductToMatch(detailProduct);
                  setDetailProduct(null);
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
              >
                <span>立即选用此产品发起报审</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
