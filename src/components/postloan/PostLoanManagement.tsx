import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  ArrowUpRight, 
  Phone, 
  MessageSquare, 
  FileText, 
  TrendingUp, 
  Building2, 
  Plus, 
  Eye, 
  ChevronRight, 
  Coins, 
  Check, 
  LayoutGrid, 
  List, 
  Download, 
  RefreshCw, 
  SlidersHorizontal,
  CreditCard,
  UserCheck,
  Zap,
  ArrowRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell, 
  PieChart, 
  Pie 
} from 'recharts';
import { PostLoanAccount, UserAccount, Customer, LoanCase, InspectionRecord, PostLoanRiskAlert } from '../../types';
import { PostLoanDetailModal } from './PostLoanDetailModal';
import { InspectionModal } from './InspectionModal';
import { RepaymentReminderModal } from './RepaymentReminderModal';

interface PostLoanManagementProps {
  postLoanAccounts: PostLoanAccount[];
  setPostLoanAccounts: React.Dispatch<React.SetStateAction<PostLoanAccount[]>>;
  currentUser: UserAccount | null;
  users?: UserAccount[];
  isMasked?: boolean;
  onOpenCustomerDetail?: (customerId: string) => void;
  onStartCall?: (customer: { name: string; phone: string }) => void;
  onStartApplyLoan?: (initialData?: any) => void;
}

export const PostLoanManagement: React.FC<PostLoanManagementProps> = ({
  postLoanAccounts,
  setPostLoanAccounts,
  currentUser,
  users = [],
  isMasked = false,
  onOpenCustomerDetail,
  onStartCall,
  onStartApplyLoan,
}) => {
  // Navigation & Sub-views
  const [activeTab, setActiveTab] = useState<'all' | 'repayments' | 'risks' | 'refinance' | 'inspections'>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedBank, setSelectedBank] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedConsultant, setSelectedConsultant] = useState<string>('all');

  // Modal states
  const [selectedAccountForDetail, setSelectedAccountForDetail] = useState<PostLoanAccount | null>(null);
  const [selectedAccountForInspection, setSelectedAccountForInspection] = useState<PostLoanAccount | null>(null);
  const [selectedAccountForReminder, setSelectedAccountForReminder] = useState<PostLoanAccount | null>(null);

  // Success Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const maskPhone = (phone: string) => {
    if (!isMasked || !phone) return phone;
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  };

  // Filtered accounts
  const filteredAccounts = useMemo(() => {
    return postLoanAccounts.filter((acc) => {
      // Role permission: if consultant, only see own cases unless admin/super_admin/risk
      const isManager = currentUser?.role === 'super_admin' || currentUser?.role === 'admin' || currentUser?.role === 'risk_manager' || currentUser?.role === 'finance_admin';
      if (!isManager && acc.consultantId && currentUser?.id && acc.consultantId !== currentUser.id) {
        return false;
      }

      // Tab specific filtering
      if (activeTab === 'repayments') {
        if (acc.repaymentStatus === 'settled' || acc.repaymentStatus === 'early_settled') return false;
      } else if (activeTab === 'risks') {
        if (acc.riskAlerts.filter(a => !a.isResolved).length === 0 && acc.repaymentStatus !== 'overdue_m1') return false;
      } else if (activeTab === 'refinance') {
        if (!acc.refinanceOpportunity) return false;
      }

      // Keyword search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = acc.customerName.toLowerCase().includes(query);
        const matchesSubject = acc.borrowerSubject.toLowerCase().includes(query);
        const matchesPhone = acc.customerPhone.includes(query);
        const matchesNumber = acc.caseNumber.toLowerCase().includes(query);
        const matchesBank = acc.lenderBank.toLowerCase().includes(query);
        if (!matchesName && !matchesSubject && !matchesPhone && !matchesNumber && !matchesBank) {
          return false;
        }
      }

      // Status filter
      if (selectedStatus !== 'all' && acc.repaymentStatus !== selectedStatus) {
        return false;
      }

      // Bank filter
      if (selectedBank !== 'all' && acc.lenderBank !== selectedBank) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && acc.productCategory !== selectedCategory) {
        return false;
      }

      // Consultant filter
      if (selectedConsultant !== 'all' && acc.consultantName !== selectedConsultant) {
        return false;
      }

      return true;
    });
  }, [postLoanAccounts, activeTab, searchQuery, selectedStatus, selectedBank, selectedCategory, selectedConsultant, currentUser]);

  // Key KPI metrics
  const metrics = useMemo(() => {
    const totalAUMWan = postLoanAccounts.reduce((sum, a) => sum + (a.currentBalanceWan || 0), 0);
    const totalDisbursedWan = postLoanAccounts.reduce((sum, a) => sum + (a.disbursedAmountWan || 0), 0);
    const upcomingCount = postLoanAccounts.filter((a) => a.repaymentStatus === 'upcoming_due').length;
    const overdueCount = postLoanAccounts.filter((a) => a.repaymentStatus === 'overdue_m1' || a.repaymentStatus === 'overdue_m2').length;
    const overdueAmount = postLoanAccounts.reduce((sum, a) => sum + (a.overdueAmountYuan || 0), 0);
    const refinanceCount = postLoanAccounts.filter((a) => !!a.refinanceOpportunity).length;
    const totalEstSavings = postLoanAccounts.reduce((sum, a) => sum + (a.refinanceOpportunity?.estimatedAnnualSavingsYuan || 0), 0);
    const pendingInspections = postLoanAccounts.filter((a) => a.riskAlerts.some(r => r.type === 'inspection_due' && !r.isResolved)).length;
    
    // Repayment rate
    const totalActive = postLoanAccounts.filter(a => a.repaymentStatus !== 'settled' && a.repaymentStatus !== 'early_settled').length;
    const normalCount = postLoanAccounts.filter(a => a.repaymentStatus === 'normal' || a.repaymentStatus === 'upcoming_due').length;
    const normalRate = totalActive > 0 ? ((normalCount / totalActive) * 100).toFixed(1) : '100.0';

    return {
      totalAUMWan,
      totalDisbursedWan,
      upcomingCount,
      overdueCount,
      overdueAmount,
      refinanceCount,
      totalEstSavings,
      pendingInspections,
      normalRate,
      totalCount: postLoanAccounts.length,
    };
  }, [postLoanAccounts]);

  // Chart data for repayment distribution
  const chartData = useMemo(() => {
    const bankGroups = new Map<string, number>();
    postLoanAccounts.forEach((acc) => {
      const bank = acc.lenderBank.slice(0, 4);
      bankGroups.set(bank, (bankGroups.get(bank) || 0) + acc.currentBalanceWan);
    });

    return Array.from(bankGroups.entries()).map(([name, amount]) => ({
      name,
      amount,
    }));
  }, [postLoanAccounts]);

  // Handlers
  const handleRegisterRepayment = (account: PostLoanAccount, period: number) => {
    setPostLoanAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id !== account.id) return acc;

        const updatedSchedules = acc.schedules.map((sch) => {
          if (sch.period === period) {
            return {
              ...sch,
              status: 'paid' as const,
              paidAt: new Date().toLocaleString('zh-CN', { hour12: false }),
              actualPaidAmountYuan: sch.totalAmountYuan,
              note: '手动核销登记还款',
            };
          }
          return sch;
        });

        // If this was overdue, recover status
        const isStillOverdue = updatedSchedules.some((s) => s.status === 'overdue');
        const nextPending = updatedSchedules.find((s) => s.status === 'pending');

        return {
          ...acc,
          repaymentStatus: isStillOverdue ? 'overdue_m1' : 'normal',
          overdueDays: isStillOverdue ? acc.overdueDays : 0,
          overdueAmountYuan: isStillOverdue ? acc.overdueAmountYuan : 0,
          riskLevel: isStillOverdue ? 'high_danger' : 'safe',
          nextRepaymentDate: nextPending?.dueDate || '按期执行中',
          schedules: updatedSchedules,
        };
      })
    );

    showToast(`已成功核销登记 ${account.customerName} 第${period}期还款！`);
  };

  const handleSaveInspection = (postLoanId: string, record: Partial<InspectionRecord>) => {
    const newRecord: InspectionRecord = {
      id: `ins-${Date.now()}`,
      postLoanId,
      type: record.type || 'routine_quarterly',
      inspectionDate: record.inspectionDate || new Date().toISOString().split('T')[0],
      inspectorName: record.inspectorName || currentUser?.name || '客户经理',
      inspectorId: currentUser?.id,
      method: record.method || 'phone',
      businessStatus: record.businessStatus || 'normal',
      repaymentCapacityRating: record.repaymentCapacityRating || 'stable',
      findings: record.findings || '例行回访核查正常',
      nextInspectionDate: record.nextInspectionDate,
    };

    setPostLoanAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id !== postLoanId) return acc;
        return {
          ...acc,
          lastInspectionDate: newRecord.inspectionDate,
          nextInspectionDate: newRecord.nextInspectionDate,
          inspections: [newRecord, ...acc.inspections],
        };
      })
    );

    showToast(`已成功保存对客户的贷后巡检回访记录！`);
  };

  const handleResolveRiskAlert = (alertId: string) => {
    setPostLoanAccounts((prev) =>
      prev.map((acc) => {
        const hasAlert = acc.riskAlerts.some((a) => a.id === alertId);
        if (!hasAlert) return acc;

        const updatedAlerts = acc.riskAlerts.map((a) => {
          if (a.id === alertId) {
            return {
              ...a,
              isResolved: true,
              resolvedAt: new Date().toISOString().split('T')[0],
              resolutionNote: '经核实已排查解除',
            };
          }
          return a;
        });

        return {
          ...acc,
          riskAlerts: updatedAlerts,
          riskLevel: updatedAlerts.some((a) => !a.isResolved && a.level === 'high') ? 'high_danger' : 'safe',
        };
      })
    );

    showToast('风险预警已标记为排查解除！');
  };

  const handleSendReminderSuccess = (accountId: string, msg: string) => {
    setPostLoanAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id !== accountId) return acc;
        return {
          ...acc,
          lastCareReminderDate: new Date().toISOString().split('T')[0],
        };
      })
    );
    showToast('还款提醒与贷后关怀已成功推送至客户！');
  };

  const handleStartRefinanceApplication = (account: PostLoanAccount) => {
    if (onStartApplyLoan && account.refinanceOpportunity) {
      onStartApplyLoan({
        customerName: account.customerName,
        phone: account.customerPhone,
        appliedAmountWan: (account.currentBalanceWan + (account.refinanceOpportunity.additionalAmountWan || 0)),
        intendedBank: account.refinanceOpportunity.recommendedBank,
        loanCategory: account.productCategory,
        notes: `【存量转贷】原${account.lenderBank}执行利率${account.interestRate}%，申请转贷至${account.refinanceOpportunity.recommendedProductName}，预计年省息¥${account.refinanceOpportunity.estimatedAnnualSavingsYuan}元。`,
      });
      showToast(`已将 ${account.customerName} 转贷方案带入进件申报流程！`);
    }
  };

  // Get unique bank names and categories for filters
  const uniqueBanks = Array.from(new Set(postLoanAccounts.map((a) => a.lenderBank)));
  const uniqueCategories = Array.from(new Set(postLoanAccounts.map((a) => a.productCategory)));
  const uniqueConsultants = Array.from(new Set(postLoanAccounts.map((a) => a.consultantName).filter(Boolean)));

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-white/95 text-slate-800 px-4 py-2.5 rounded-2xl shadow-xl border border-slate-200 backdrop-blur-md flex items-center space-x-2 text-xs animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                贷后客户管理系统
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                AUM 资产监控与二次转贷
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              基于助贷业务第一性原理，构建还款到期前关怀、大数据风险雷达预警、例行合规巡检与存量客户降息转贷/增额加贷的全生命周期资产管理平台。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const dueAccount = postLoanAccounts.find(a => a.repaymentStatus === 'upcoming_due' || a.repaymentStatus === 'overdue_m1');
                if (dueAccount) {
                  setSelectedAccountForReminder(dueAccount);
                } else {
                  showToast('当前暂无需要紧急提醒的客户');
                }
              }}
              className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>一键还款关怀</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('refinance')}
              className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>转贷加贷挖掘器 ({metrics.refinanceCount}户)</span>
            </button>
          </div>
        </div>

        {/* 6 Key Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3.5 mt-5">
          <div className="p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
              <span>在贷 AUM 余额</span>
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-base sm:text-xl font-black font-mono text-slate-900 mt-1">
              ¥{metrics.totalAUMWan}万
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              累计放款 ¥{metrics.totalDisbursedWan}万
            </div>
          </div>

          <div className="p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
              <span>正常还款履约率</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-base sm:text-xl font-black font-mono text-emerald-600 mt-1">
              {metrics.normalRate}%
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              在管客户 {metrics.totalCount} 户
            </div>
          </div>

          <div className="p-3 sm:p-4 bg-blue-50/70 rounded-2xl border border-blue-100">
            <div className="text-[11px] font-semibold text-blue-700 flex items-center justify-between">
              <span>临近还款客户</span>
              <Clock className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="text-base sm:text-xl font-black font-mono text-blue-700 mt-1">
              {metrics.upcomingCount} 户
            </div>
            <div className="text-[10px] text-blue-600 mt-0.5">
              本周内应扣还款
            </div>
          </div>

          <div className={`p-3 sm:p-4 rounded-2xl border ${
            metrics.overdueCount > 0
              ? 'bg-rose-50 border-rose-200'
              : 'bg-slate-50 border-slate-100'
          }`}>
            <div className={`text-[11px] font-semibold flex items-center justify-between ${
              metrics.overdueCount > 0 ? 'text-rose-700' : 'text-slate-500'
            }`}>
              <span>逾期风险关注</span>
              <AlertTriangle className={`w-3.5 h-3.5 ${metrics.overdueCount > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
            </div>
            <div className={`text-base sm:text-xl font-black font-mono mt-1 ${
              metrics.overdueCount > 0 ? 'text-rose-600' : 'text-slate-800'
            }`}>
              {metrics.overdueCount} 户
            </div>
            <div className={`text-[10px] mt-0.5 ${metrics.overdueCount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
              {metrics.overdueCount > 0 ? `逾期金额 ¥${metrics.overdueAmount}元` : '暂无不良逾期'}
            </div>
          </div>

          <div className="p-3 sm:p-4 bg-indigo-50/70 rounded-2xl border border-indigo-100">
            <div className="text-[11px] font-semibold text-indigo-700 flex items-center justify-between">
              <span>降息转贷潜客</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-base sm:text-xl font-black font-mono text-indigo-700 mt-1">
              {metrics.refinanceCount} 户
            </div>
            <div className="text-[10px] text-indigo-600 mt-0.5">
              预计年省息 ¥{(metrics.totalEstSavings / 10000).toFixed(2)}万
            </div>
          </div>

          <div className="p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
              <span>待例行巡检</span>
              <UserCheck className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-base sm:text-xl font-black font-mono text-slate-900 mt-1">
              {metrics.pendingInspections} 户
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              三季度排查待回访
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: '全部在贷档案', count: postLoanAccounts.length },
            { id: 'repayments', label: '还款提醒日历', count: metrics.upcomingCount + metrics.overdueCount, isAlert: metrics.overdueCount > 0 },
            { id: 'risks', label: '风险异动雷达', count: postLoanAccounts.filter(a => a.riskAlerts.some(r => !r.isResolved)).length, isDanger: metrics.overdueCount > 0 },
            { id: 'refinance', label: '降息转贷挖掘', count: metrics.refinanceCount, isHighlight: true },
            { id: 'inspections', label: '贷后巡检台账', count: postLoanAccounts.reduce((s, a) => s + a.inspections.length, 0) },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : tab.isDanger
                      ? 'bg-rose-100 text-rose-700'
                      : tab.isHighlight
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-200 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* View Mode Toggle & Quick Action */}
        <div className="flex items-center space-x-2 self-end sm:self-auto">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'cards' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="卡片视图"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="表格视图"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar (Mobile-Friendly Responsive) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
          
          {/* Keyword Search Input */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索借款人姓名 / 企业名称 / 手机号 / 资方银行..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none text-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-blue-500 outline-none text-xs"
            >
              <option value="all">还款状态 (全部)</option>
              <option value="normal">正常还款中</option>
              <option value="upcoming_due">还款日临近 (&lt;7天)</option>
              <option value="overdue_m1">逾期 M1 (1-30天)</option>
              <option value="early_settled">提前全额结清</option>
              <option value="settled">正常到期结清</option>
            </select>
          </div>

          {/* Bank filter */}
          <div>
            <select
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-blue-500 outline-none text-xs"
            >
              <option value="all">放款资方银行 (全部)</option>
              {uniqueBanks.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Product Category filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-blue-500 outline-none text-xs"
            >
              <option value="all">贷款产品类别 (全部)</option>
              {uniqueCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Active Filter summary and reset */}
        {(selectedStatus !== 'all' || selectedBank !== 'all' || selectedCategory !== 'all' || searchQuery) && (
          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs text-slate-500">
            <span>
              已筛选出 <strong>{filteredAccounts.length}</strong> 条在贷客户档案
            </span>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedStatus('all');
                setSelectedBank('all');
                setSelectedCategory('all');
                setSelectedConsultant('all');
              }}
              className="text-blue-600 hover:text-blue-700 font-bold"
            >
              重置所有筛选
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area: Cards or Table */}
      {filteredAccounts.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xs space-y-3">
          <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-base">未找到符合条件的贷后客户档案</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            尝试调整上方搜索关键词或还款状态筛选器。
          </p>
        </div>
      ) : viewMode === 'cards' ? (
        /* Card Flow Mode (Optimized for Mobile & Desktop) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {filteredAccounts.map((account) => {
            const isOverdue = account.repaymentStatus === 'overdue_m1' || account.repaymentStatus === 'overdue_m2';
            const isUpcoming = account.repaymentStatus === 'upcoming_due';
            const hasRefinance = Boolean(account.refinanceOpportunity);
            const unresolvedAlerts = account.riskAlerts.filter(a => !a.isResolved);

            return (
              <div
                key={account.id}
                className={`bg-white rounded-2xl sm:rounded-3xl border transition-all duration-200 hover:shadow-md flex flex-col justify-between overflow-hidden ${
                  isOverdue
                    ? 'border-rose-300 ring-2 ring-rose-100'
                    : isUpcoming
                      ? 'border-blue-300 shadow-2xs'
                      : 'border-slate-200/90 shadow-2xs'
                }`}
              >
                {/* Card Header */}
                <div className="p-4 sm:p-5 pb-3 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                          {account.caseNumber}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {account.customerGrade}客群
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 mt-1.5">
                        <h3 className="font-black text-slate-900 text-base">
                          {account.customerName}
                        </h3>
                        <span className="text-xs text-slate-400 truncate max-w-[140px]">
                          {account.borrowerSubject}
                        </span>
                      </div>
                    </div>

                    {/* Status badge */}
                    <div>
                      {account.repaymentStatus === 'normal' && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>正常还款</span>
                        </span>
                      )}
                      {account.repaymentStatus === 'upcoming_due' && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-blue-600 animate-pulse" />
                          <span>临近还款</span>
                        </span>
                      )}
                      {account.repaymentStatus === 'overdue_m1' && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-50 text-rose-700 border border-rose-300 flex items-center space-x-1">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          <span>逾期 {account.overdueDays}天</span>
                        </span>
                      )}
                      {(account.repaymentStatus === 'settled' || account.repaymentStatus === 'early_settled') && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                          已全额结清
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Loan & Product Specs */}
                  <div className="p-3 bg-slate-50/90 rounded-xl border border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-slate-400 text-[10px]">在贷余额 / 放款本金</div>
                      <div className="font-mono font-black text-slate-900 text-sm mt-0.5">
                        ¥{account.currentBalanceWan}万 <span className="text-slate-400 text-xs font-normal">/ ¥{account.disbursedAmountWan}万</span>
                      </div>
                    </div>

                    <div>
                      <div className="text-slate-400 text-[10px]">执行年化 / 方式</div>
                      <div className="font-mono font-black text-blue-600 text-sm mt-0.5">
                        {account.interestRate}% <span className="text-slate-500 text-[11px] font-normal font-sans">({account.repaymentType === 'interest_first' ? '先息后本' : '等额本息'})</span>
                      </div>
                    </div>

                    <div className="col-span-2 pt-1 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 truncate">
                        资方: <strong className="text-slate-800">{account.lenderBank}</strong> ({account.productCategory})
                      </span>
                      <span className="text-slate-400 font-mono">
                        每月{account.repaymentDayOfMonth}日还款
                      </span>
                    </div>
                  </div>

                  {/* Upcoming / Overdue Payment Highlight Bar */}
                  <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                    isOverdue
                      ? 'bg-rose-50/90 border-rose-200 text-rose-900'
                      : isUpcoming
                        ? 'bg-blue-50/80 border-blue-200 text-blue-950'
                        : 'bg-slate-50 border-slate-100 text-slate-700'
                  }`}>
                    <div className="flex items-center space-x-1.5">
                      <CreditCard className={`w-3.5 h-3.5 ${isOverdue ? 'text-rose-600' : isUpcoming ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span className="font-medium text-[11px]">
                        {isOverdue ? '逾期未还款' : '下期应还日'}: <strong className="font-mono">{account.nextRepaymentDate}</strong>
                      </span>
                    </div>
                    <div className="font-mono font-bold text-xs">
                      ¥{account.nextDueTotalYuan.toLocaleString()}元
                    </div>
                  </div>

                  {/* Risk Alert or Refinance Opportunity Pill */}
                  {unresolvedAlerts.length > 0 && (
                    <div className="p-2 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-900 flex items-center justify-between">
                      <div className="flex items-center space-x-1 truncate">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="truncate">{unresolvedAlerts[0].title}</span>
                      </div>
                      <span className="text-[10px] text-amber-700 font-bold shrink-0">需排查</span>
                    </div>
                  )}

                  {hasRefinance && (
                    <div className="p-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 text-[11px] text-blue-900 flex items-center justify-between">
                      <div className="flex items-center space-x-1 truncate">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate">转贷省息预计 ¥{account.refinanceOpportunity?.estimatedAnnualSavingsYuan}元/年</span>
                      </div>
                      <span className="text-[10px] text-blue-700 font-bold shrink-0">可转贷</span>
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-1.5">
                  <div className="flex items-center space-x-1 text-xs text-slate-500">
                    <span>顾问: {account.consultantName}</span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {onStartCall && (
                      <button
                        type="button"
                        onClick={() => onStartCall({ name: account.customerName, phone: account.customerPhone })}
                        className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition cursor-pointer"
                        title="电话联系"
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-600" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedAccountForReminder(account)}
                      className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">关怀提醒</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedAccountForDetail(account)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 shadow-2xs cursor-pointer"
                    >
                      <span>详情台账</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table Mode (Optimized for High Density Desktop Review) */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <tr>
                  <th className="p-3.5">合同编号</th>
                  <th className="p-3.5">借款人 / 主体</th>
                  <th className="p-3.5">资方 / 产品</th>
                  <th className="p-3.5">在贷余额</th>
                  <th className="p-3.5">年化利率</th>
                  <th className="p-3.5">下期还款日</th>
                  <th className="p-3.5">下期应还金额</th>
                  <th className="p-3.5">还款状态</th>
                  <th className="p-3.5">转贷/风控机会</th>
                  <th className="p-3.5 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-mono font-bold text-slate-700">
                      {account.caseNumber}
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{account.customerName}</div>
                      <div className="text-[11px] text-slate-400">{account.borrowerSubject}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-medium text-slate-800">{account.lenderBank}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[150px]">{account.productName}</div>
                    </td>
                    <td className="p-3.5 font-mono font-black text-slate-900">
                      ¥{account.currentBalanceWan}万
                    </td>
                    <td className="p-3.5 font-mono font-bold text-blue-600">
                      {account.interestRate}%
                    </td>
                    <td className="p-3.5 font-mono text-slate-700">
                      {account.nextRepaymentDate}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-900">
                      ¥{account.nextDueTotalYuan.toLocaleString()}
                    </td>
                    <td className="p-3.5">
                      {account.repaymentStatus === 'normal' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          正常还款
                        </span>
                      )}
                      {account.repaymentStatus === 'upcoming_due' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          还款日临近
                        </span>
                      )}
                      {account.repaymentStatus === 'overdue_m1' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-300">
                          逾期 {account.overdueDays}天
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">
                      {account.refinanceOpportunity ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          🌟 可转贷 (省{account.refinanceOpportunity.estimatedAnnualSavingsYuan}元)
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedAccountForReminder(account)}
                          className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition"
                        >
                          关怀
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedAccountForDetail(account)}
                          className="px-2.5 py-1 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-xs font-bold transition"
                        >
                          台账
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-modals */}
      <PostLoanDetailModal
        account={selectedAccountForDetail}
        isOpen={Boolean(selectedAccountForDetail)}
        onClose={() => setSelectedAccountForDetail(null)}
        isMasked={isMasked}
        onSendReminder={(acc) => {
          setSelectedAccountForDetail(null);
          setSelectedAccountForReminder(acc);
        }}
        onRegisterRepayment={handleRegisterRepayment}
        onAddInspection={(acc) => {
          setSelectedAccountForDetail(null);
          setSelectedAccountForInspection(acc);
        }}
        onResolveRiskAlert={handleResolveRiskAlert}
        onStartRefinance={handleStartRefinanceApplication}
      />

      <InspectionModal
        account={selectedAccountForInspection}
        isOpen={Boolean(selectedAccountForInspection)}
        onClose={() => setSelectedAccountForInspection(null)}
        onSaveInspection={handleSaveInspection}
      />

      <RepaymentReminderModal
        account={selectedAccountForReminder}
        isOpen={Boolean(selectedAccountForReminder)}
        onClose={() => setSelectedAccountForReminder(null)}
        onSendSuccess={handleSendReminderSuccess}
        onStartCall={(name, phone) => {
          if (onStartCall) onStartCall({ name, phone });
        }}
      />

    </div>
  );
};
