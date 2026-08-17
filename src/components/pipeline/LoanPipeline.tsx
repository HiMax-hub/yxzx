import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GitPullRequestDraft, 
  FileText, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  Plus, 
  Building, 
  ShieldCheck, 
  AlertCircle, 
  ArrowRight, 
  Upload, 
  FileCheck,
  Send,
  Layers,
  Calendar,
  X,
  ArrowRightLeft,
  Filter,
  Search,
  Check,
  GripVertical,
  MoveHorizontal,
  Download,
  Coins,
  TrendingUp,
  LayoutGrid,
  ListFilter,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { LoanCase, DealStage, UserAccount } from '../../types';
import { CopyButton } from '../common/CopyButton';
import { ClickablePhone } from '../common/ClickablePhone';
import { isConsultant as isConsultantRole, canReassign as canReassignRole, isFinanceAdmin as isFinanceRole } from '../../utils/permissions';
import { exportCsv, timestampedFilename } from '../../utils/exportUtils';

interface LoanPipelineProps {
  loanCases: LoanCase[];
  setLoanCases: React.Dispatch<React.SetStateAction<LoanCase[]>>;
  currentUser: UserAccount;
  users: UserAccount[];
  isMasked: boolean;
  onOpenNewCaseModal: () => void;
  onAdvanceStage?: (deal: LoanCase, nextStage: DealStage) => void;
}

const STAGES: { id: DealStage; label: string; short: string; desc: string; color: string; badgeColor: string; bgSoft: string; iconNumber: number }[] = [
  { id: 'pre_screen', label: '1. 资质初审', short: '初审', desc: '产品匹配与初评', color: 'border-blue-500', badgeColor: 'bg-blue-50 text-blue-700 border-blue-200', bgSoft: 'bg-blue-50/40', iconNumber: 1 },
  { id: 'docs_collection', label: '2. 资料收集', short: '收资', desc: '征信/房产/流水', color: 'border-cyan-500', badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200', bgSoft: 'bg-cyan-50/40', iconNumber: 2 },
  { id: 'submission', label: '3. 机构进件', short: '进件', desc: '银行信贷系统报审', color: 'border-indigo-500', badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200', bgSoft: 'bg-indigo-50/40', iconNumber: 3 },
  { id: 'interview_visit', label: '4. 面签下户', short: '下户', desc: '实地核验与面签', color: 'border-purple-500', badgeColor: 'bg-purple-50 text-purple-700 border-purple-200', bgSoft: 'bg-purple-50/40', iconNumber: 4 },
  { id: 'approval', label: '5. 审批批复', short: '批复', desc: '核定额度与利率', color: 'border-amber-500', badgeColor: 'bg-amber-50 text-amber-700 border-amber-200', bgSoft: 'bg-amber-50/40', iconNumber: 5 },
  { id: 'disbursement', label: '6. 放款结算', short: '放款', desc: '凭证归档与结算', color: 'border-emerald-500', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200', bgSoft: 'bg-emerald-50/40', iconNumber: 6 },
  { id: 'post_loan', label: '7. 贷后管理', short: '贷后', desc: '还款提醒与转贷', color: 'border-teal-500', badgeColor: 'bg-teal-50 text-teal-700 border-teal-200', bgSoft: 'bg-teal-50/40', iconNumber: 7 },
];

export const LoanPipeline: React.FC<LoanPipelineProps> = ({
  loanCases,
  setLoanCases,
  currentUser,
  users,
  isMasked,
  onOpenNewCaseModal,
  onAdvanceStage,
}) => {
  const isConsultant = isConsultantRole(currentUser.role);
  const isRisk = currentUser.role === 'risk_manager';
  const isFinance = isFinanceRole(currentUser.role);
  const canReassign = canReassignRole(currentUser.role);

  const [selectedCase, setSelectedCase] = useState<LoanCase | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [consultantFilter, setConsultantFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  // Drag and Drop States
  const [draggedCaseId, setDraggedCaseId] = useState<string | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<DealStage | null>(null);
  const [dragToast, setDragToast] = useState<{
    customerName: string;
    fromLabel: string;
    toLabel: string;
  } | null>(null);

  const stageGroupMap: Record<string, DealStage[]> = {
    'group_pre': ['pre_screen', 'docs_collection'],
    'group_risk': ['submission', 'interview_visit'],
    'group_signing': ['approval'],
    'group_disbursement': ['disbursement', 'post_loan'],
  };

  const isStageMatched = (dealStage: DealStage, filter: string) => {
    if (filter === 'all') return true;
    if (stageGroupMap[filter]) {
      return stageGroupMap[filter].includes(dealStage);
    }
    return dealStage === filter;
  };

  // Base accessible cases by role & consultant
  const baseAccessibleCases = useMemo(() => {
    return loanCases.filter((c) => {
      if (isConsultant && (c.consultantId ? c.consultantId !== currentUser.id : c.consultantName !== currentUser.name)) return false;
      if (!isConsultant && consultantFilter !== 'all' && c.consultantName !== consultantFilter) return false;
      return true;
    });
  }, [loanCases, isConsultant, currentUser.id, currentUser.name, consultantFilter]);

  // Filter cases
  const filteredCases = useMemo(() => {
    return baseAccessibleCases.filter((c) => {
      if (!isStageMatched(c.stage, stageFilter)) return false;
      if (searchKeyword.trim()) {
        const query = searchKeyword.toLowerCase().trim();
        const matchName = c.customerName.toLowerCase().includes(query);
        const matchCaseNum = (c.caseNumber || '').toLowerCase().includes(query);
        const matchBank = (c.lenderBank || '').toLowerCase().includes(query);
        const matchProduct = (c.productName || '').toLowerCase().includes(query);
        const matchPhone = (c.customerPhone || '').includes(query);
        if (!matchName && !matchCaseNum && !matchBank && !matchProduct && !matchPhone) {
          return false;
        }
      }
      return true;
    });
  }, [baseAccessibleCases, stageFilter, searchKeyword]);

  // Pipeline Financial Metrics HUD
  const pipelineMetrics = useMemo(() => {
    const totalApplyingWan = baseAccessibleCases
      .filter(c => ['pre_screen', 'docs_collection', 'submission', 'interview_visit'].includes(c.stage))
      .reduce((sum, c) => sum + (c.appliedAmount || 0), 0);

    const approvedPendingWan = baseAccessibleCases
      .filter(c => c.stage === 'approval')
      .reduce((sum, c) => sum + (c.approvedAmount || c.appliedAmount || 0), 0);

    const disbursedWan = baseAccessibleCases
      .filter(c => ['disbursement', 'post_loan'].includes(c.stage))
      .reduce((sum, c) => sum + (c.approvedAmount || c.appliedAmount || 0), 0);

    const totalServiceFeeYuan = baseAccessibleCases
      .reduce((sum, c) => sum + (c.serviceFeeTotal || 0), 0);

    return {
      totalApplyingWan,
      approvedPendingWan,
      disbursedWan,
      totalServiceFeeYuan
    };
  }, [baseAccessibleCases]);

  const handleAdvanceStage = (deal: LoanCase, nextStage: DealStage) => {
    const currentIdx = STAGES.findIndex((s) => s.id === deal.stage);
    const nextIdx = STAGES.findIndex((s) => s.id === nextStage);
    if (nextIdx < currentIdx || nextIdx === currentIdx) {
      return;
    }
    const stageInfo = STAGES.find(s => s.id === nextStage);
    const nowStr = new Date().toLocaleString('zh-CN', { hour12: false });
    
    const updated: LoanCase = {
      ...deal,
      stage: nextStage,
      subStageStatus: `推进至 ${stageInfo?.label} 节点`,
      timeline: [
        ...deal.timeline,
        {
          timestamp: nowStr,
          stage: nextStage,
          operator: `${currentUser.name} (${currentUser.roleTitle})`,
          description: `工单推进至【${stageInfo?.label}】阶段`,
          isKeyNode: true,
        },
      ],
    };

    setLoanCases(prev => prev.map(item => item.id === deal.id ? updated : item));
    if (selectedCase && selectedCase.id === deal.id) {
      setSelectedCase(updated);
    }
    onAdvanceStage?.(updated, nextStage);
  };

  const handleDropToStage = (caseId: string, targetStage: DealStage) => {
    const targetDeal = loanCases.find((c) => c.id === caseId);
    if (!targetDeal || targetDeal.stage === targetStage) return;

    const fromStageInfo = STAGES.find((s) => s.id === targetDeal.stage);
    const toStageInfo = STAGES.find((s) => s.id === targetStage);

    handleAdvanceStage(targetDeal, targetStage);

    setDragToast({
      customerName: targetDeal.customerName,
      fromLabel: fromStageInfo?.label || '原阶段',
      toLabel: toStageInfo?.label || '新阶段',
    });

    setTimeout(() => {
      setDragToast(null);
    }, 3500);
  };

  const handleReassignCase = (deal: LoanCase, targetConsultant: string) => {
    const nowStr = new Date().toLocaleString('zh-CN', { hour12: false });
    const oldConsultant = deal.consultantName;
    const targetConsultantUser = users.find((u) => u.name === targetConsultant);

    const updated: LoanCase = {
      ...deal,
      consultantName: targetConsultant,
      consultantId: targetConsultantUser?.id,
      timeline: [
        ...deal.timeline,
        {
          timestamp: nowStr,
          stage: deal.stage,
          operator: `${currentUser.name} (${currentUser.roleTitle})`,
          description: `【管理调单】进件工单从顾问 [${oldConsultant}] 调整指派给 [${targetConsultant}]`,
          isKeyNode: true,
        },
      ],
    };

    setLoanCases(prev => prev.map(item => item.id === deal.id ? updated : item));
    if (selectedCase && selectedCase.id === deal.id) {
      setSelectedCase(updated);
    }
  };

  return (
    <div className="loan-pipeline-container p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1700px] mx-auto text-slate-800">
      
      {/* 1. Header & Identity */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-xs">
            <GitPullRequestDraft className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                贷款业务7阶段报审与进件看板
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                7阶段全流程审批
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isConsultant 
                ? `顾问视图：经办中的 (${filteredCases.length}) 笔报审工单` 
                : isRisk
                  ? `风控统览：全司 (${filteredCases.length}) 笔报审工单，支持风控核验与调单`
                  : isFinance
                    ? `财务核算：全司 (${filteredCases.length}) 笔报审工单流转与结算台账`
                    : `管理全景：全司 (${filteredCases.length}) 笔工单，支持拖拽流转与调配`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {!isConsultant && (
            <select
              value={consultantFilter}
              onChange={(e) => setConsultantFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">全公司所有顾问</option>
              <option value="公共公海池">(未分配) 公海池待指派</option>
              {users
                .filter((u) => u.role === 'consultant')
                .map((cons) => (
                  <option key={cons.id} value={cons.name}>
                    顾问: {cons.name} ({cons.department})
                  </option>
                ))}
            </select>
          )}

          <button
            onClick={() => {
              const stageLabel: Record<string, string> = {
                pre_screen: '资质初审', docs_collection: '资料收集', submission: '报审银行',
                interview_visit: '下户面签', approval: '审批批复', disbursement: '放款结算', post_loan: '贷后管理',
              };
              exportCsv(
                timestampedFilename('进件工单明细'),
                ['工单编号', '客户姓名', '手机号', '产品', '资方', '阶段', '申请金额(万)', '批贷金额(万)', '年化利率%', '期限(月)', '还款方式', '服务费(元)', '经办顾问', '报审时间'],
                filteredCases.map((l) => [
                  l.caseNumber || l.id,
                  l.customerName,
                  l.customerPhone,
                  l.productName,
                  l.lenderInstitution || l.lenderBank,
                  stageLabel[l.stage] || l.stage,
                  l.appliedAmount ?? 0,
                  l.approvedAmount ?? '',
                  l.interestRate ?? '',
                  l.termMonths ?? '',
                  l.repaymentType === 'interest_first' ? '先息后本' : '等额本息',
                  l.serviceFeeTotal ?? '',
                  l.consultantName,
                  l.submittedAt,
                ])
              );
            }}
            className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer"
            title="导出当前工单 CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>导出工单</span>
          </button>

          {!isFinance && (
            <button
              onClick={onOpenNewCaseModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>新建进件工单</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Pipeline Financial HUD Summary (4 Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-medium text-slate-500 flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>在审申请规模</span>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              ¥{pipelineMetrics.totalApplyingWan.toLocaleString()} <span className="text-xs font-normal text-slate-400">万</span>
            </div>
            <div className="text-[11px] text-blue-600 font-medium">初审/收资/报审/下户</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            审
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-medium text-slate-500 flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
              <span>已获批复待放款</span>
            </div>
            <div className="text-2xl font-black text-amber-700 font-mono">
              ¥{pipelineMetrics.approvedPendingWan.toLocaleString()} <span className="text-xs font-normal text-slate-400">万</span>
            </div>
            <div className="text-[11px] text-amber-600 font-medium">审批批复等待签约放款</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            批
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-medium text-slate-500 flex items-center space-x-1">
              <Coins className="w-3.5 h-3.5 text-emerald-600" />
              <span>已放款入账总额</span>
            </div>
            <div className="text-2xl font-black text-emerald-700 font-mono">
              ¥{pipelineMetrics.disbursedWan.toLocaleString()} <span className="text-xs font-normal text-slate-400">万</span>
            </div>
            <div className="text-[11px] text-emerald-600 font-medium">放款结算与转贷管理</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            放
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-medium text-slate-500 flex items-center space-x-1">
              <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
              <span>应收服务费池</span>
            </div>
            <div className="text-2xl font-black text-purple-700 font-mono">
              ¥{(pipelineMetrics.totalServiceFeeYuan / 10000).toFixed(1)} <span className="text-xs font-normal text-slate-400">万</span>
            </div>
            <div className="text-[11px] text-purple-600 font-medium">咨询服务创收总值</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            收
          </div>
        </div>
      </div>

      {/* 3. 7 Standard Stage Header Strip & View Switcher */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Quick Group Filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-700 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              <span>流程分段:</span>
            </span>

            {[
              { id: 'all', label: '全流程', count: baseAccessibleCases.length },
              { id: 'group_pre', label: '1. 预审初评', count: baseAccessibleCases.filter(c => ['pre_screen', 'docs_collection'].includes(c.stage)).length },
              { id: 'group_risk', label: '2. 进件下户', count: baseAccessibleCases.filter(c => ['submission', 'interview_visit'].includes(c.stage)).length },
              { id: 'group_signing', label: '3. 批复签约', count: baseAccessibleCases.filter(c => c.stage === 'approval').length },
              { id: 'group_disbursement', label: '4. 放款贷后', count: baseAccessibleCases.filter(c => ['disbursement', 'post_loan'].includes(c.stage)).length },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setStageFilter(item.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  stageFilter === item.id
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{item.label}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                  stageFilter === item.id ? 'bg-blue-700 text-white' : 'bg-white text-slate-600'
                }`}>
                  {item.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box & View Mode */}
          <div className="flex items-center space-x-2">
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索单号/客户/银行/产品..."
                className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 transition"
              />
              {searchKeyword && (
                <button
                  type="button"
                  onClick={() => setSearchKeyword('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* View Switcher */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                  viewMode === 'kanban' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="看板流转模式"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                  viewMode === 'list' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="列表清单模式"
              >
                <ListFilter className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 7 Stage Interactive Horizontal Flow Stepper */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-2 border-t border-slate-100">
          {STAGES.map((s) => {
            const count = baseAccessibleCases.filter(c => c.stage === s.id).length;
            const amountWan = baseAccessibleCases
              .filter(c => c.stage === s.id)
              .reduce((sum, c) => sum + (c.approvedAmount || c.appliedAmount || 0), 0);
            const isSelected = stageFilter === s.id;

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setStageFilter(isSelected ? 'all' : s.id)}
                className={`p-2.5 rounded-xl text-left transition cursor-pointer border ${
                  isSelected
                    ? 'bg-blue-50/80 border-blue-500 ring-1 ring-blue-500 shadow-2xs'
                    : 'bg-slate-50/80 hover:bg-slate-100 border-slate-200/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>
                    {s.label}
                  </span>
                  <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                  }`}>
                    {count}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-1">
                  ¥{amountWan}万
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating Drag Success Toast */}
      <AnimatePresence>
        {dragToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-8 z-50 bg-white text-slate-900 px-4 py-3 rounded-2xl shadow-xl border border-emerald-200 flex items-center space-x-3 text-xs"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold flex items-center space-x-1 text-slate-900">
                <span>工单流转成功</span>
                <span className="text-emerald-700 font-normal">({dragToast.customerName})</span>
              </div>
              <div className="text-slate-500 text-[11px] flex items-center space-x-1.5 mt-0.5">
                <span>{dragToast.fromLabel}</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
                <span className="text-blue-700 font-bold">{dragToast.toLabel}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDragToast(null)}
              className="text-slate-400 hover:text-slate-700 p-1 ml-2 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Kanban Horizontal Swimlane View (7 Stages) */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3.5 overflow-x-auto pb-4 items-start">
          {STAGES.map((stage) => {
            const isStageActive = isStageMatched(stage.id, stageFilter);
            const casesInStage = filteredCases.filter((c) => c.stage === stage.id);
            const totalStageAmount = casesInStage.reduce(
              (acc, curr) => acc + (curr.approvedAmount || curr.appliedAmount || 0),
              0
            );
            const isColumnDropTarget = dragOverStageId === stage.id;

            return (
              <div
                key={stage.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (dragOverStageId !== stage.id) {
                    setDragOverStageId(stage.id);
                  }
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    if (dragOverStageId === stage.id) {
                      setDragOverStageId(null);
                    }
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const caseId = e.dataTransfer.getData('text/plain') || draggedCaseId;
                  if (caseId) {
                    handleDropToStage(caseId, stage.id);
                  }
                  setDraggedCaseId(null);
                  setDragOverStageId(null);
                }}
                className={`rounded-2xl border transition-all duration-200 flex flex-col min-w-[210px] overflow-hidden ${
                  isColumnDropTarget
                    ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-500 shadow-md scale-[1.01]'
                    : isStageActive
                    ? 'bg-slate-50 border-slate-200/90 shadow-2xs'
                    : 'bg-slate-50/40 border-slate-200/40 opacity-60'
                }`}
              >
                {/* Column Header */}
                <div className={`p-3 bg-white border-t-3 ${stage.color} border-b border-slate-100 flex items-center justify-between`}>
                  <div>
                    <div className="font-bold text-xs text-slate-800 flex items-center gap-1">
                      <span>{stage.label}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      ¥{totalStageAmount}万 ({casesInStage.length}笔)
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${stage.badgeColor}`}>
                    {casesInStage.length}
                  </span>
                </div>

                {/* Drop Zone Visual Indicator */}
                {isColumnDropTarget && (
                  <div className="m-2 p-2.5 bg-blue-100 border-2 border-dashed border-blue-500 rounded-xl text-center text-xs font-bold text-blue-800 animate-pulse flex items-center justify-center space-x-1 shadow-xs">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <span>松开推进至【{stage.short}】</span>
                  </div>
                )}

                {/* Cases List in Column */}
                <div className="p-2.5 space-y-2.5 flex-1 overflow-y-auto max-h-[75vh]">
                  {casesInStage.length === 0 ? (
                    <div className="py-10 text-center text-slate-300 text-[11px] border border-dashed border-slate-200 rounded-xl bg-white/50">
                      暂无工单
                    </div>
                  ) : (
                    <AnimatePresence mode="popLayout">
                      {casesInStage.map((deal) => {
                        const isBeingDragged = draggedCaseId === deal.id;

                        return (
                          <motion.div
                            key={deal.id}
                            layout
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                            draggable={true}
                            onDragStart={(e) => {
                              (e as any).dataTransfer.setData('text/plain', deal.id);
                              (e as any).dataTransfer.effectAllowed = 'move';
                              setDraggedCaseId(deal.id);
                            }}
                            onDragEnd={() => {
                              setDraggedCaseId(null);
                              setDragOverStageId(null);
                            }}
                            onClick={() => setSelectedCase(deal)}
                            className={`bg-white p-3.5 rounded-xl border transition-all duration-200 space-y-2.5 select-none ${
                              isBeingDragged
                                ? 'opacity-40 border-dashed border-2 border-blue-500 scale-[0.98] shadow-lg ring-2 ring-blue-300'
                                : 'border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-400 cursor-grab active:cursor-grabbing'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <div className="flex items-center space-x-1.5 min-w-0">
                                <span className="text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing">
                                  <GripVertical className="w-3.5 h-3.5" />
                                </span>
                                <span className="font-bold text-xs text-slate-900 truncate">
                                  {deal.customerName}
                                </span>
                              </div>
                              <span className="text-[10px] px-1.5 py-0.2 bg-blue-50 text-blue-700 font-medium rounded shrink-0">
                                {deal.productCategory || '抵押/信用'}
                              </span>
                            </div>

                            <div className="text-xs font-mono font-black pl-4 text-slate-900">
                              ¥{deal.appliedAmount} 万元
                            </div>

                            {deal.customerPhone && (
                              <div className="pt-0.5 pl-4" onClick={(e) => e.stopPropagation()}>
                                <ClickablePhone
                                  phone={deal.customerPhone}
                                  customerName={deal.customerName}
                                  size="sm"
                                />
                              </div>
                            )}

                            <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1.5 border-t border-slate-100 pl-0.5">
                              <span className="truncate max-w-[95px] font-medium text-slate-500">{deal.lenderBank}</span>
                              <span className="font-medium text-slate-700 shrink-0">{deal.consultantName}</span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View (Desktop Table + Mobile Cards) */
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden">
          {/* Mobile Card List (< md) */}
          <div className="md:hidden divide-y divide-slate-100 p-3 space-y-3">
            {filteredCases.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                未找到符合当前阶段筛选或关键词的进件工单
              </div>
            ) : (
              filteredCases.map((deal) => (
                <div
                  key={deal.id}
                  onClick={() => setSelectedCase(deal)}
                  className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-2.5 cursor-pointer active:scale-[0.99] transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <span>{deal.customerName}</span>
                        <span className="text-xs text-blue-600 font-mono font-bold">¥{deal.appliedAmount}万</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{deal.caseNumber}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      {STAGES.find((s) => s.id === deal.stage)?.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/60 text-slate-600">
                    <div>
                      <span className="text-slate-400 text-[11px]">资方/产品: </span>
                      <span className="font-medium text-slate-800">{deal.lenderBank} ({deal.productName})</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px]">经办顾问: </span>
                      <span className="font-medium text-slate-800">{deal.consultantName}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex justify-end">
                    <span className="text-xs text-blue-600 font-semibold flex items-center space-x-1">
                      <span>查看全案审批与推进</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5 pl-4">工单编号</th>
                  <th className="p-3.5">借款主体 / 联系电话</th>
                  <th className="p-3.5">报审机构 / 产品</th>
                  <th className="p-3.5">申请金额 (万)</th>
                  <th className="p-3.5">当前审批阶段</th>
                  <th className="p-3.5">经办顾问</th>
                  <th className="p-3.5 text-right pr-4">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      未找到符合当前阶段筛选或关键词的进件工单
                    </td>
                  </tr>
                ) : (
                  filteredCases.map((deal) => (
                    <tr key={deal.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 pl-4 font-mono text-slate-700 font-bold">
                        <div className="flex items-center gap-1">
                          <span>{deal.caseNumber}</span>
                          <CopyButton text={deal.caseNumber || deal.id} title="复制单号" />
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 flex items-center gap-1">
                          <span>{deal.customerName}</span>
                          <CopyButton text={deal.customerName} title="复制姓名" />
                        </div>
                        {deal.customerPhone && (
                          <div className="mt-1">
                            <ClickablePhone
                              phone={deal.customerPhone}
                              customerName={deal.customerName}
                              size="sm"
                            />
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-700">
                        <div className="font-semibold text-slate-800">{deal.lenderBank}</div>
                        <div className="text-[10px] text-slate-400">{deal.productName}</div>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-slate-900">¥{deal.appliedAmount} 万</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {STAGES.find(s => s.id === deal.stage)?.label}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600 font-medium">{deal.consultantName}</td>
                      <td className="p-3.5 pr-4 text-right">
                        <button
                          onClick={() => setSelectedCase(deal)}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                        >
                          详情抽屉 →
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Case Details Drawer Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right text-slate-800">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-bold text-slate-900">{selectedCase.customerName} - 进件报审全案</h2>
                  <CopyButton text={selectedCase.customerName} title="复制姓名" />
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                    {STAGES.find(s => s.id === selectedCase.stage)?.label}
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-mono mt-1 flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1">
                    <span>工单号: {selectedCase.caseNumber}</span>
                    <CopyButton text={selectedCase.caseNumber || selectedCase.id} title="复制工单号" />
                  </span>
                  <span>· 申报资方: {selectedCase.lenderBank} ({selectedCase.productName})</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 space-y-6 flex-1 overflow-y-auto text-xs">
              {/* Financial Metrics Strip */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <div className="text-slate-400">申请借款金额</div>
                  <div className="text-lg font-black font-mono text-slate-900 mt-0.5">¥{selectedCase.appliedAmount} 万</div>
                </div>
                <div>
                  <div className="text-slate-400">批贷年化利率</div>
                  <div className="text-lg font-black font-mono text-blue-600 mt-0.5">{selectedCase.interestRate}%</div>
                </div>
                <div>
                  <div className="text-slate-400">咨询服务费收入</div>
                  <div className="text-lg font-black font-mono text-emerald-600 mt-0.5">¥{selectedCase.serviceFeeTotal?.toLocaleString()}</div>
                </div>
              </div>

              {/* Stage Flow Advancing Buttons */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-800">流转推进工单至下一节点:</div>
                <div className="flex flex-wrap gap-2">
                  {STAGES.map((s) => {
                    const stageIdx = STAGES.findIndex((st) => st.id === selectedCase.stage);
                    const targetIdx = STAGES.findIndex((st) => st.id === s.id);
                    const isPast = targetIdx < stageIdx;
                    const isCurrent = targetIdx === stageIdx;
                    const canAdvance = !isPast && !isCurrent && !isFinance;
                    return (
                      <button
                        key={s.id}
                        onClick={() => handleAdvanceStage(selectedCase, s.id)}
                        disabled={!canAdvance}
                        title={isFinance ? '财务结算角色仅可查看' : isPast ? '已流转阶段不可回退' : undefined}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                          isCurrent
                            ? 'bg-blue-600 text-white font-bold cursor-default shadow-xs'
                            : isPast || isFinance
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Manager Reassign Action */}
              {canReassign && (
                <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-2">
                  <div className="font-bold text-purple-900 flex items-center space-x-1.5">
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>主管调单权限：重新指派经办顾问</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <select
                      value={selectedCase.consultantName}
                      onChange={(e) => handleReassignCase(selectedCase, e.target.value)}
                      className="px-3 py-1.5 bg-white border border-purple-300 rounded-xl text-xs font-bold text-slate-900 cursor-pointer"
                    >
                      {users
                        .filter((u) => u.role === 'consultant')
                        .map((cons) => (
                          <option key={cons.id} value={cons.name}>
                            顾问: {cons.name} ({cons.department})
                          </option>
                        ))}
                    </select>
                    <span className="text-[11px] text-purple-700">可将此审批单直接调配给其他顾问</span>
                  </div>
                </div>
              )}

              {/* Process Timeline */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-800">全流程节点流转日志:</div>
                <div className="space-y-3 border-l-2 border-slate-200 ml-2 pl-4 text-xs">
                  {selectedCase.timeline.map((node, i) => (
                    <div key={i} className="relative">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600 absolute -left-[21px] top-1" />
                      <div className="flex items-center justify-between text-slate-400 text-[11px]">
                        <span>{node.timestamp}</span>
                        <span className="font-semibold text-slate-700">{node.operator}</span>
                      </div>
                      <div className="text-slate-800 font-medium mt-0.5">{node.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Uploaded Documents */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-800">报审材料清单与合规凭证:</div>
                <div className="space-y-2">
                  {selectedCase.documents.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <div className="flex items-center space-x-2">
                        <FileCheck className="w-4 h-4 text-emerald-600" />
                        <span className="font-medium text-slate-800">{doc.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{doc.uploadedAt}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
