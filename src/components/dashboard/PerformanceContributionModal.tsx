import React, { useState, useMemo } from 'react';
import { 
  X, 
  Trophy, 
  TrendingUp, 
  Users, 
  Coins, 
  Building2, 
  Layers, 
  Download, 
  Printer, 
  Search, 
  Filter, 
  Award, 
  CheckCircle2, 
  Percent, 
  Calendar,
  Sparkles,
  ArrowUpRight,
  ChevronRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { Customer, LoanCase, UserAccount, SystemConfig } from '../../types';
import { useEscToClose } from '../../utils/useEscToClose';
import { exportCsv, timestampedFilename } from '../../utils/exportUtils';

interface PerformanceContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  loanCases: LoanCase[];
  customers: Customer[];
  users: UserAccount[];
  currentUser: UserAccount;
  systemConfig?: SystemConfig;
}

export const PerformanceContributionModal: React.FC<PerformanceContributionModalProps> = ({
  isOpen,
  onClose,
  loanCases,
  customers,
  users,
  currentUser,
  systemConfig,
}) => {
  useEscToClose(isOpen, onClose);

  const [activeTab, setActiveTab] = useState<'consultants' | 'categories' | 'departments' | 'cases'>('consultants');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  // 当月已放款工单（真实数据源：stage 为 disbursement 或 post_loan，或者已批复有效放款）
  const disbursedCases = useMemo(() => {
    return loanCases.filter(
      (c) => c.stage === 'disbursement' || c.stage === 'post_loan' || (c.approvedAmount && c.approvedAmount > 0)
    );
  }, [loanCases]);

  // 核心团队宏观统计
  const teamMetrics = useMemo(() => {
    const totalDisbursedWan = disbursedCases.reduce((sum, c) => sum + (c.approvedAmount || c.appliedAmount || 0), 0);
    const targetWan = systemConfig?.monthlyTeamTargetWan || users.reduce((sum, u) => sum + (u.monthlyTargetWan || 0), 0) || 5000;
    const progressPercent = targetWan > 0 ? Math.round((totalDisbursedWan / targetWan) * 1000) / 10 : 0;
    const remainingWan = Math.max(0, targetWan - totalDisbursedWan);
    const totalServiceFeeYuan = disbursedCases.reduce((sum, c) => sum + (c.serviceFeeTotal || 0), 0);
    const totalCasesCount = disbursedCases.length;
    const avgDealSizeWan = totalCasesCount > 0 ? Math.round((totalDisbursedWan / totalCasesCount) * 10) / 10 : 0;

    // 日历时间进度
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const calendarProgress = Math.round((now.getDate() / daysInMonth) * 100);

    return {
      totalDisbursedWan,
      targetWan,
      progressPercent,
      remainingWan,
      totalServiceFeeYuan,
      totalCasesCount,
      avgDealSizeWan,
      calendarProgress,
    };
  }, [disbursedCases, systemConfig, users]);

  // 1. 顾问贡献排行
  const consultantContributions = useMemo(() => {
    // 找出所有在职顾问及曾放款人员
    const consultantMap = new Map<string, {
      id: string;
      name: string;
      department: string;
      roleTitle: string;
      targetWan: number;
      disbursedWan: number;
      caseCount: number;
      serviceFeeYuan: number;
      cases: LoanCase[];
    }>();

    // 先用 users 建立基础
    users.forEach((u) => {
      consultantMap.set(u.id, {
        id: u.id,
        name: u.name,
        department: u.department || '未分配部门',
        roleTitle: u.roleTitle,
        targetWan: u.monthlyTargetWan || 200,
        disbursedWan: 0,
        caseCount: 0,
        serviceFeeYuan: 0,
        cases: [],
      });
    });

    // 汇总放款
    disbursedCases.forEach((c) => {
      let matchedUser = users.find((u) => u.id === c.consultantId || u.name === c.consultantName);
      const key = matchedUser ? matchedUser.id : (c.consultantId || c.consultantName || 'unknown');
      if (!consultantMap.has(key)) {
        consultantMap.set(key, {
          id: key,
          name: c.consultantName || '未知顾问',
          department: '助贷业务部',
          roleTitle: '业务顾问',
          targetWan: 200,
          disbursedWan: 0,
          caseCount: 0,
          serviceFeeYuan: 0,
          cases: [],
        });
      }
      const item = consultantMap.get(key)!;
      const amt = c.approvedAmount || c.appliedAmount || 0;
      item.disbursedWan += amt;
      item.caseCount += 1;
      item.serviceFeeYuan += c.serviceFeeTotal || 0;
      item.cases.push(c);
    });

    const list = Array.from(consultantMap.values()).map((c) => {
      const avgDeal = c.caseCount > 0 ? Math.round((c.disbursedWan / c.caseCount) * 10) / 10 : 0;
      const targetPercent = c.targetWan > 0 ? Math.round((c.disbursedWan / c.targetWan) * 1000) / 10 : 0;
      const shareOfTeam = teamMetrics.totalDisbursedWan > 0
        ? Math.round((c.disbursedWan / teamMetrics.totalDisbursedWan) * 1000) / 10
        : 0;

      return {
        ...c,
        avgDeal,
        targetPercent,
        shareOfTeam,
      };
    });

    // 过滤掉完全无目标且无放款的非业务人员（如仅财务/系统）如果不是顾问
    return list
      .filter((c) => c.disbursedWan > 0 || c.targetWan > 0)
      .sort((a, b) => b.disbursedWan - a.disbursedWan || b.caseCount - a.caseCount);
  }, [disbursedCases, users, teamMetrics.totalDisbursedWan]);

  // 2. 产品类别贡献分布
  const categoryContributions = useMemo(() => {
    const map = new Map<string, {
      category: string;
      disbursedWan: number;
      caseCount: number;
      serviceFeeYuan: number;
      banks: Set<string>;
    }>();

    disbursedCases.forEach((c) => {
      const cat = c.productCategory || '其他贷款';
      if (!map.has(cat)) {
        map.set(cat, {
          category: cat,
          disbursedWan: 0,
          caseCount: 0,
          serviceFeeYuan: 0,
          banks: new Set(),
        });
      }
      const item = map.get(cat)!;
      item.disbursedWan += c.approvedAmount || c.appliedAmount || 0;
      item.caseCount += 1;
      item.serviceFeeYuan += c.serviceFeeTotal || 0;
      if (c.lenderBank || c.lenderInstitution) {
        item.banks.add(c.lenderBank || c.lenderInstitution);
      }
    });

    const list = Array.from(map.values()).map((item) => {
      const shareOfTeam = teamMetrics.totalDisbursedWan > 0
        ? Math.round((item.disbursedWan / teamMetrics.totalDisbursedWan) * 1000) / 10
        : 0;
      const avgDeal = item.caseCount > 0 ? Math.round((item.disbursedWan / item.caseCount) * 10) / 10 : 0;
      return {
        ...item,
        shareOfTeam,
        avgDeal,
        bankCount: item.banks.size,
      };
    });

    return list.sort((a, b) => b.disbursedWan - a.disbursedWan);
  }, [disbursedCases, teamMetrics.totalDisbursedWan]);

  // 3. 部门贡献分析
  const departmentContributions = useMemo(() => {
    const map = new Map<string, {
      department: string;
      disbursedWan: number;
      targetWan: number;
      caseCount: number;
      consultantCount: number;
      consultantNames: string[];
      serviceFeeYuan: number;
    }>();

    consultantContributions.forEach((c) => {
      const dept = c.department || '综合业务部';
      if (!map.has(dept)) {
        map.set(dept, {
          department: dept,
          disbursedWan: 0,
          targetWan: 0,
          caseCount: 0,
          consultantCount: 0,
          consultantNames: [],
          serviceFeeYuan: 0,
        });
      }
      const item = map.get(dept)!;
      item.disbursedWan += c.disbursedWan;
      item.targetWan += c.targetWan;
      item.caseCount += c.caseCount;
      item.consultantCount += 1;
      item.consultantNames.push(c.name);
      item.serviceFeeYuan += c.serviceFeeYuan;
    });

    return Array.from(map.values()).map((d) => {
      const completionRate = d.targetWan > 0 ? Math.round((d.disbursedWan / d.targetWan) * 1000) / 10 : 0;
      const shareOfTeam = teamMetrics.totalDisbursedWan > 0
        ? Math.round((d.disbursedWan / teamMetrics.totalDisbursedWan) * 1000) / 10
        : 0;
      const perCapitaWan = d.consultantCount > 0 ? Math.round((d.disbursedWan / d.consultantCount) * 10) / 10 : 0;
      return {
        ...d,
        completionRate,
        shareOfTeam,
        perCapitaWan,
      };
    }).sort((a, b) => b.disbursedWan - a.disbursedWan);
  }, [consultantContributions, teamMetrics.totalDisbursedWan]);

  // 4. 筛选明细工单
  const filteredCases = useMemo(() => {
    return disbursedCases.filter((c) => {
      const matchSearch = !searchTerm.trim() ||
        c.customerName.includes(searchTerm.trim()) ||
        (c.caseNumber && c.caseNumber.includes(searchTerm.trim())) ||
        c.consultantName.includes(searchTerm.trim()) ||
        c.productName.includes(searchTerm.trim());
      
      const matchCategory = categoryFilter === 'all' || c.productCategory === categoryFilter;
      const matchDept = departmentFilter === 'all' || (() => {
        const u = users.find((usr) => usr.id === c.consultantId || usr.name === c.consultantName);
        return u?.department === departmentFilter;
      })();

      return matchSearch && matchCategory && matchDept;
    });
  }, [disbursedCases, searchTerm, categoryFilter, departmentFilter, users]);

  // 导出 CSV 报表
  const handleExportCSV = () => {
    if (activeTab === 'consultants') {
      const headers = ['排名', '顾问姓名', '所属部门', '放款规模(万元)', '放款笔数', '笔均金额(万)', '月度目标(万)', '个人达成率(%)', '全队贡献占比(%)', '服务费创收(元)'];
      const rows = consultantContributions.map((c, idx) => [
        idx + 1,
        c.name,
        c.department,
        c.disbursedWan,
        c.caseCount,
        c.avgDeal,
        c.targetWan,
        `${c.targetPercent}%`,
        `${c.shareOfTeam}%`,
        c.serviceFeeYuan,
      ]);
      exportCsv(timestampedFilename('团队顾问业绩贡献拆解'), headers, rows);
    } else if (activeTab === 'categories') {
      const headers = ['产品类别', '放款规模(万元)', '全队占比(%)', '放款笔数', '笔均金额(万)', '合作银行数', '服务费创收(元)'];
      const rows = categoryContributions.map((c) => [
        c.category,
        c.disbursedWan,
        `${c.shareOfTeam}%`,
        c.caseCount,
        c.avgDeal,
        c.bankCount,
        c.serviceFeeYuan,
      ]);
      exportCsv(timestampedFilename('贷款产品类别贡献拆解'), headers, rows);
    } else if (activeTab === 'departments') {
      const headers = ['部门名称', '放款总额(万元)', '部门目标(万)', '达成率(%)', '全队贡献占比(%)', '放款总笔数', '顾问人数', '人均产能(万/人)', '服务费创收(元)'];
      const rows = departmentContributions.map((d) => [
        d.department,
        d.disbursedWan,
        d.targetWan,
        `${d.completionRate}%`,
        `${d.shareOfTeam}%`,
        d.caseCount,
        d.consultantCount,
        d.perCapitaWan,
        d.serviceFeeYuan,
      ]);
      exportCsv(timestampedFilename('部门业绩贡献拆解'), headers, rows);
    } else {
      const headers = ['工单号', '客户姓名', '贷款产品', '产品类别', '资方银行', '放款金额(万元)', '批贷年化', '服务费(元)', '经办顾问', '放款时间'];
      const rows = filteredCases.map((c) => [
        c.caseNumber || c.id,
        c.customerName,
        c.productName,
        c.productCategory || '房抵贷',
        c.lenderBank || c.lenderInstitution,
        c.approvedAmount || c.appliedAmount || 0,
        `${c.interestRate}%`,
        c.serviceFeeTotal || 0,
        c.consultantName,
        c.disbursedAt || c.submittedAt || '-',
      ]);
      exportCsv(timestampedFilename('本月已放款工单明细'), headers, rows);
    }
  };

  // 打印预览
  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-white text-slate-900 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-xs">
              <Trophy className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  本月团队放款业绩贡献详细拆解
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>动态核算中</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                基于当月全司放款工单与进件台账，多维度穿透分析顾问、产品类别、部门贡献与放款明细
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition cursor-pointer"
              title="导出当前维度报表到 Excel / CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>导出报表</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top 4 KPI Highlight Tiles */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
          <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>团队实际放款规模</span>
              <Coins className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-1.5 flex items-baseline space-x-1">
              <span className="text-xs font-bold text-slate-500">¥</span>
              <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                {teamMetrics.totalDisbursedWan.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400">万元</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500 font-medium">
              目标 ¥{teamMetrics.targetWan}万 (达成 <strong className="text-blue-700 font-bold">{teamMetrics.progressPercent}%</strong>)
            </div>
          </div>

          <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>放款单量与笔均</span>
              <Layers className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-1.5 flex items-baseline space-x-1">
              <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                {teamMetrics.totalCasesCount}
              </span>
              <span className="text-xs text-slate-400">笔</span>
              <span className="text-xs text-slate-400 ml-2">笔均</span>
              <span className="text-lg font-bold text-emerald-700 font-mono">
                ¥{teamMetrics.avgDealSizeWan}万
              </span>
            </div>
            <div className="mt-1 text-[11px] text-emerald-600 font-medium flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>服务费创收: ¥{teamMetrics.totalServiceFeeYuan.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>当月业绩销冠</span>
              <Award className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-1.5 flex items-center space-x-2">
              <span className="text-base font-bold text-slate-900">
                {consultantContributions[0]?.name || '暂无'}
              </span>
              {consultantContributions[0] && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  ¥{consultantContributions[0].disbursedWan}万
                </span>
              )}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              贡献占比: <strong className="text-amber-700 font-bold">{consultantContributions[0]?.shareOfTeam || 0}%</strong>
            </div>
          </div>

          <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>放款主力产品类别</span>
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="mt-1.5 flex items-center space-x-2">
              <span className="text-base font-bold text-slate-900 truncate">
                {categoryContributions[0]?.category || '暂无'}
              </span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              放款 ¥{categoryContributions[0]?.disbursedWan || 0}万 (占 {categoryContributions[0]?.shareOfTeam || 0}%)
            </div>
          </div>
        </div>

        {/* Tab Navigation Navigation */}
        <div className="px-4 sm:px-5 pt-3 border-b border-slate-200 bg-white flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex space-x-1 sm:space-x-2 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('consultants')}
              className={`pb-2.5 px-3 border-b-2 transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'consultants'
                  ? 'border-blue-600 text-blue-600 font-black'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>按顾问业绩贡献榜 ({consultantContributions.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('categories')}
              className={`pb-2.5 px-3 border-b-2 transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'categories'
                  ? 'border-blue-600 text-blue-600 font-black'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>按产品类别贡献 ({categoryContributions.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('departments')}
              className={`pb-2.5 px-3 border-b-2 transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'departments'
                  ? 'border-blue-600 text-blue-600 font-black'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>按部门贡献分析 ({departmentContributions.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('cases')}
              className={`pb-2.5 px-3 border-b-2 transition flex items-center space-x-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'cases'
                  ? 'border-blue-600 text-blue-600 font-black'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>已放款明细工单 ({disbursedCases.length})</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 pb-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="sm:hidden p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs"
              title="导出"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* TAB 1: 按顾问业绩贡献榜 */}
          {activeTab === 'consultants' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>共统计 {consultantContributions.length} 位业务顾问放款与目标完成情况</span>
                <span>排序方式：按放款总金额由高到低</span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-3.5 py-3 font-bold text-slate-600 text-center w-12">排名</th>
                        <th className="px-3.5 py-3 font-bold text-slate-600">顾问姓名</th>
                        <th className="px-3.5 py-3 font-bold text-slate-600">所属部门</th>
                        <th className="px-3.5 py-3 font-bold text-slate-600 text-right">本月放款规模</th>
                        <th className="px-3.5 py-3 font-bold text-slate-600 text-center">放款笔数</th>
                        <th className="px-3.5 py-3 font-bold text-slate-600 text-right">笔均金额</th>
                        <th className="px-3.5 py-3 font-bold text-slate-600 text-right">个人目标</th>
                        <th className="px-3.5 py-3 font-bold text-slate-600 text-center w-28">个人达成率</th>
                        <th className="px-3.5 py-3 font-bold text-slate-600 text-center w-28">团队贡献占比</th>
                        <th className="px-3.5 py-3 font-bold text-slate-600 text-right">服务费创收</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {consultantContributions.map((c, index) => {
                        const isTop1 = index === 0 && c.disbursedWan > 0;
                        const isTop2 = index === 1 && c.disbursedWan > 0;
                        const isTop3 = index === 2 && c.disbursedWan > 0;

                        return (
                          <tr key={c.id} className="hover:bg-slate-50/80 transition">
                            <td className="px-3.5 py-3 text-center">
                              {isTop1 ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow-xs">
                                  1
                                </span>
                              ) : isTop2 ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-900 font-bold text-xs">
                                  2
                                </span>
                              ) : isTop3 ? (
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700/60 text-white font-bold text-xs">
                                  3
                                </span>
                              ) : (
                                <span className="text-slate-400 font-mono text-xs">
                                  {index + 1}
                                </span>
                              )}
                            </td>

                            <td className="px-3.5 py-3 font-bold text-slate-900 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">
                                  {c.name.slice(0, 1)}
                                </div>
                                <span>{c.name}</span>
                              </div>
                            </td>

                            <td className="px-3.5 py-3 text-slate-500 whitespace-nowrap">
                              {c.department}
                            </td>

                            <td className="px-3.5 py-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                              ¥<span className="text-blue-700 text-sm font-black">{c.disbursedWan.toLocaleString()}</span>万
                            </td>

                            <td className="px-3.5 py-3 text-center font-bold text-slate-700">
                              {c.caseCount} 笔
                            </td>

                            <td className="px-3.5 py-3 text-right font-mono text-slate-600">
                              ¥{c.avgDeal}万
                            </td>

                            <td className="px-3.5 py-3 text-right font-mono text-slate-500">
                              ¥{c.targetWan}万
                            </td>

                            <td className="px-3.5 py-3">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[11px] font-bold">
                                  <span className={c.targetPercent >= 100 ? 'text-emerald-600' : 'text-blue-600'}>
                                    {c.targetPercent}%
                                  </span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className={`h-1.5 rounded-full transition-all duration-300 ${
                                      c.targetPercent >= 100 ? 'bg-emerald-500' : 'bg-blue-600'
                                    }`}
                                    style={{ width: `${Math.min(100, c.targetPercent)}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            <td className="px-3.5 py-3">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                                  <span>{c.shareOfTeam}%</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className="bg-amber-500 h-1.5 rounded-full transition-all duration-300"
                                    style={{ width: `${Math.min(100, c.shareOfTeam)}%` }}
                                  />
                                </div>
                              </div>
                            </td>

                            <td className="px-3.5 py-3 text-right font-mono text-emerald-700 font-semibold whitespace-nowrap">
                              ¥{c.serviceFeeYuan.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 按产品类别贡献 */}
          {activeTab === 'categories' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categoryContributions.map((cat, idx) => (
                  <div 
                    key={cat.category}
                    className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs hover:border-blue-300 transition space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
                          {idx + 1}
                        </span>
                        <h3 className="font-bold text-slate-900 text-sm">{cat.category}</h3>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                        占比 {cat.shareOfTeam}%
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-1 text-center bg-slate-50 rounded-lg p-2">
                      <div>
                        <div className="text-[10px] text-slate-400">放款总额</div>
                        <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                          ¥{cat.disbursedWan}万
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">放款笔数</div>
                        <div className="font-mono font-bold text-slate-700 text-sm mt-0.5">
                          {cat.caseCount} 笔
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">笔均金额</div>
                        <div className="font-mono font-bold text-emerald-700 text-sm mt-0.5">
                          ¥{cat.avgDeal}万
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>全司贡献规模进度条</span>
                        <span className="font-mono font-bold text-slate-700">{cat.disbursedWan} / {teamMetrics.totalDisbursedWan} 万</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full"
                          style={{ width: `${Math.min(100, cat.shareOfTeam)}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100">
                      <span>合作放款银行: {cat.bankCount} 家</span>
                      <span>贡献服务费: <strong className="text-emerald-700 font-mono font-bold">¥{cat.serviceFeeYuan.toLocaleString()}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: 按部门贡献分析 */}
          {activeTab === 'departments' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {departmentContributions.map((dept, idx) => (
                  <div key={dept.department} className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-blue-600" />
                        <h4 className="font-bold text-slate-900 text-sm">{dept.department}</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                        {dept.consultantCount} 人
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-slate-500">部门放款规模:</span>
                        <span className="text-lg font-black text-blue-700 font-mono">¥{dept.disbursedWan}万</span>
                      </div>
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-slate-500">部门月度目标:</span>
                        <span className="font-mono text-slate-700 font-bold">¥{dept.targetWan}万</span>
                      </div>
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-slate-500">人均产能:</span>
                        <span className="font-mono text-emerald-700 font-bold">¥{dept.perCapitaWan}万 / 人</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-slate-600">部门目标达成率</span>
                        <span className={dept.completionRate >= 100 ? 'text-emerald-600' : 'text-blue-600'}>
                          {dept.completionRate}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${dept.completionRate >= 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                          style={{ width: `${Math.min(100, dept.completionRate)}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
                      <span>占全队放款比: <strong className="text-slate-800 font-bold">{dept.shareOfTeam}%</strong></span>
                      <span>已出单 {dept.caseCount} 笔</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: 放款明细工单 */}
          {activeTab === 'cases' && (
            <div className="space-y-3">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="搜索客户姓名、工单号、顾问或产品..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="p-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="all">全产品类别</option>
                    {Array.from(new Set(disbursedCases.map((c) => c.productCategory || '房抵贷'))).map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>

                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="p-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="all">全部门</option>
                    {Array.from(new Set(users.map((u) => u.department))).filter(Boolean).map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cases Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-3.5 py-2.5 font-bold text-slate-600">工单号</th>
                        <th className="px-3.5 py-2.5 font-bold text-slate-600">客户姓名</th>
                        <th className="px-3.5 py-2.5 font-bold text-slate-600">贷款产品</th>
                        <th className="px-3.5 py-2.5 font-bold text-slate-600">产品类别</th>
                        <th className="px-3.5 py-2.5 font-bold text-slate-600">放款资方</th>
                        <th className="px-3.5 py-2.5 font-bold text-slate-600 text-right">放款金额</th>
                        <th className="px-3.5 py-2.5 font-bold text-slate-600 text-center">批贷利率</th>
                        <th className="px-3.5 py-2.5 font-bold text-slate-600 text-right">服务费创收</th>
                        <th className="px-3.5 py-2.5 font-bold text-slate-600">经办顾问</th>
                        <th className="px-3.5 py-2.5 font-bold text-slate-600">放款时间</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredCases.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                            未检索到符合条件的放款工单
                          </td>
                        </tr>
                      ) : (
                        filteredCases.map((c) => (
                          <tr key={c.id} className="hover:bg-slate-50 transition">
                            <td className="px-3.5 py-2.5 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                              {c.caseNumber || c.id}
                            </td>
                            <td className="px-3.5 py-2.5 font-bold text-slate-900 whitespace-nowrap">
                              {c.customerName}
                            </td>
                            <td className="px-3.5 py-2.5 text-slate-700 max-w-[180px] truncate" title={c.productName}>
                              {c.productName}
                            </td>
                            <td className="px-3.5 py-2.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                {c.productCategory || '房抵贷'}
                              </span>
                            </td>
                            <td className="px-3.5 py-2.5 text-slate-600 whitespace-nowrap">
                              {c.lenderBank || c.lenderInstitution || '合作银行'}
                            </td>
                            <td className="px-3.5 py-2.5 text-right font-mono font-bold text-blue-700 whitespace-nowrap">
                              ¥{(c.approvedAmount || c.appliedAmount || 0).toLocaleString()}万
                            </td>
                            <td className="px-3.5 py-2.5 text-center font-mono text-slate-600">
                              {c.interestRate ? `${c.interestRate}%` : '-'}
                            </td>
                            <td className="px-3.5 py-2.5 text-right font-mono text-emerald-700 font-semibold whitespace-nowrap">
                              ¥{(c.serviceFeeTotal || 0).toLocaleString()}
                            </td>
                            <td className="px-3.5 py-2.5 text-slate-800 font-semibold whitespace-nowrap">
                              {c.consultantName}
                            </td>
                            <td className="px-3.5 py-2.5 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                              {c.disbursedAt || c.submittedAt || '本月'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>数据源：雁讯业务中台放款台账与财务结算底表</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>导出当前报表</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
