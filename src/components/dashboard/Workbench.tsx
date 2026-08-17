import React, { useState, useMemo } from 'react';
import { 
  Users, 
  TrendingUp, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  ArrowRight, 
  DollarSign, 
  Sparkles, 
  Building, 
  PhoneCall, 
  Home, 
  Receipt,
  ChevronRight,
  ShieldCheck,
  Calendar,
  Send,
  PieChart as PieIcon,
  Coins,
  Briefcase,
  Layers,
  ArrowUpRight,
  Zap,
  MessageSquare,
  X,
  Phone,
  UserCheck,
  ArrowDownUp,
  ArrowUpDown,
  Filter,
  Check,
  LayoutGrid,
  Table as TableIcon,
  GitPullRequestDraft,
  Bot,
  Flame,
  Award
} from 'lucide-react';
import { Customer, LoanCase, UserAccount, FollowUpRecord, IntentTag, CallRecord, SystemConfig } from '../../types';
import { isConsultant as isConsultantRole, isFinanceAdmin as isFinanceRole } from '../../utils/permissions';
import { INTENT_TAG_CONFIGS, INTENT_TAG_LIST } from '../../utils/intentAutomation';
import { AutoAssessmentCard } from '../assessment/AutoAssessmentCard';
import { CopyButton } from '../common/CopyButton';
import { ClickablePhone } from '../common/ClickablePhone';
import { CustomerAcquisitionTrendChart } from './CustomerAcquisitionTrendChart';
import { TodayTodoCapsules } from './TodayTodoCapsules';
import { TeamLeaderboardCard } from './TeamLeaderboardCard';
import { PublicPoolAlertCard } from './PublicPoolAlertCard';
import { ExpandableCaseCard } from './ExpandableCaseCard';
import { CompactCaseTable } from './CompactCaseTable';
import { AiTelesalesCopilotModal } from './AiTelesalesCopilotModal';
import { RealtimePerformanceDashboard } from './RealtimePerformanceDashboard';
import { TeamPerformanceTargetBanner } from './TeamPerformanceTargetBanner';
import { ApprovalTimeoutAlertBanner } from './ApprovalTimeoutAlertBanner';
import { ExpediteReminderModal } from './ExpediteReminderModal';
import { ExpediteTemplateOption } from '../../utils/approvalTaskReminders';
import { PipelineAmountDistributionChart } from './PipelineAmountDistributionChart';
import { DepartmentPerformanceStackedChart } from './DepartmentPerformanceStackedChart';
import { BusinessFunnelChart } from './BusinessFunnelChart';
import { CallOpsCard } from './CallOpsCard';
import { ChannelAnalysisCard } from './ChannelAnalysisCard';
import { ConsultantWorkbenchDeck } from './ConsultantWorkbenchDeck';
import { TeamLeaderWorkbenchDeck } from './TeamLeaderWorkbenchDeck';
import { RiskManagerWorkbenchDeck } from './RiskManagerWorkbenchDeck';
import { FinanceAdminWorkbenchDeck } from './FinanceAdminWorkbenchDeck';
import { WorkbenchTodoCard } from './WorkbenchTodoCard';
import { SmartPitchGuideSidebar } from '../common/SmartPitchGuideSidebar';
import { AiObjectionSuggestionPopover } from '../common/AiObjectionSuggestionPopover';
import { AiCustomerCreditScoreCard } from '../crm/AiCustomerCreditScoreCard';

interface WorkbenchProps {
  customers: Customer[];
  loanCases: LoanCase[];
  callRecords?: CallRecord[];
  currentUser: UserAccount;
  users: UserAccount[];
  systemConfig?: SystemConfig;
  onNavigate: (nav: string) => void;
  setPendingPoolFilter: (filter: string | null) => void;
  onOpenWizard: () => void;
  onOpenCustomerDetail: (customer: Customer) => void;
  onStartCall: (customer: Customer) => void;
  onAddFollowUp?: (customerId: string, record: FollowUpRecord) => void;
  onCompleteCallback?: (callRecordId: string) => void;
}

// 3 Standard Quick Follow-up Action Templates
const STANDARD_QUICK_TAGS = [
  {
    id: 'rejected',
    label: '已拒贷',
    color: 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200',
    dotColor: 'bg-rose-500',
    text: '【已拒贷】客户因[近期征信查询偏多/综合评分不足]暂未通过本次银行风控初审，已向客户详细解析原因，建议养征信及降负债3个月后再申请。',
  },
  {
    id: 'supp_docs',
    label: '补充资料',
    color: 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200',
    dotColor: 'bg-amber-500',
    text: '【补充资料】已电话/微信通知客户补充提供：①近6个月个人银行流水 ②房产抵押原件 ③近1年企业完税证明，约定2个工作日内补齐递交。',
  },
  {
    id: 'appointment',
    label: '预约下周',
    color: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200',
    dotColor: 'bg-blue-500',
    text: '【预约下周】已与客户沟通确认意向方案，预约下周一上午10:00携带身份证件与资产证明前往经办银行网点进行下户面签。',
  },
];

export const Workbench: React.FC<WorkbenchProps> = ({
  customers,
  loanCases,
  callRecords = [],
  currentUser,
  users,
  systemConfig,
  onNavigate,
  setPendingPoolFilter,
  onOpenWizard,
  onOpenCustomerDetail,
  onStartCall,
  onAddFollowUp,
  onCompleteCallback,
}) => {
  const [showQuickAssessment, setShowQuickAssessment] = useState(false);
  
  const isConsultant = isConsultantRole(currentUser.role);
  const isRisk = currentUser.role === 'risk_manager';
  const isFinance = isFinanceRole(currentUser.role);
  const isAdmin = currentUser.role === 'super_admin' || currentUser.role === 'admin';

  // Workspace Mode: 'simplified' (极简作业模式 - 默认，专注跟进出单) vs 'analytical' (全景分析模式 - 数据看板)
  // 默认极简作业，用户选择持久化到 localStorage
  const [workbenchMode, setWorkbenchMode] = useState<'simplified' | 'analytical'>(() => {
    try {
      const saved = localStorage.getItem('yanxun_crm_v3_workbench_mode');
      if (saved === 'simplified' || saved === 'analytical') return saved;
    } catch { /* ignore */ }
    return 'simplified';
  });
  const switchWorkbenchMode = (mode: 'simplified' | 'analytical') => {
    setWorkbenchMode(mode);
    try { localStorage.setItem('yanxun_crm_v3_workbench_mode', mode); } catch { /* ignore */ }
  };
  
  // Layout View Mode Switch: 'cards' (卡片流) vs 'table' (精简表格)
  const [layoutView, setLayoutView] = useState<'cards' | 'table'>('cards');

  // Super Admin Role View Override Switcher ('all' | 'consultant' | 'admin' | 'risk_manager' | 'finance_admin')
  const [adminSelectedRoleView, setAdminSelectedRoleView] = useState<string>('all');

  // AI Telesales Copilot Modal State
  const [isAiCopilotOpen, setIsAiCopilotOpen] = useState(false);
  const [copilotCustomer, setCopilotCustomer] = useState<Customer | null>(null);

  // Smart Pitch Guide Sidebar State (工作台电销/异议化解侧边式智能话术引导栏)
  const [isSmartGuideOpen, setIsSmartGuideOpen] = useState(false);

  // Expedite Reminder Modal State (进件审批超时一键催办弹窗)
  const [expediteModalTarget, setExpediteModalTarget] = useState<{
    isOpen: boolean;
    loanCase: LoanCase | null;
    customer?: Customer;
  }>({
    isOpen: false,
    loanCase: null,
    customer: undefined,
  });

  // Quick Follow Up Modal State
  const [quickFollowUpTarget, setQuickFollowUpTarget] = useState<{
    customer: Customer;
    caseItem?: LoanCase;
  } | null>(null);
  const [followUpType, setFollowUpType] = useState<'phone' | 'wechat' | 'visit' | 'system'>('phone');
  const [selectedIntentTag, setSelectedIntentTag] = useState<IntentTag | null>(null);
  const [followUpContent, setFollowUpContent] = useState('');
  const [followUpNextDate, setFollowUpNextDate] = useState('明天 10:00');
  const [isFollowUpSaved, setIsFollowUpSaved] = useState(false);

  // Filter datasets by Role（用 ownerId/consultantId 外键精确匹配，兼容旧数据回退姓名）
  const accessibleCustomers = isConsultant
    ? customers.filter((c) => (c.ownerId ? c.ownerId === currentUser.id : c.ownerName === currentUser.name) || c.status === 'in_pool')
    : customers;

  const accessibleCases = isConsultant
    ? loanCases.filter((l) => (l.consultantId ? l.consultantId === currentUser.id : l.consultantName === currentUser.name))
    : loanCases;

  // Dynamic Metrics
  const myActiveCustomers = accessibleCustomers.filter((c) => c.status !== 'in_pool');
  const myInPipelineCases = accessibleCases.filter((l) => l.stage !== 'disbursement' && l.stage !== 'post_loan');
  
  // 1. "今日新增获客数"（真实聚合：本地时区日期 + 刚跟进活跃客户，不再硬编码兜底）
  const todayStr = new Date().toLocaleDateString('en-CA'); // 本地时区 YYYY-MM-DD
  const todayNewLeadsCount = accessibleCustomers.filter(c => c.createdAt === todayStr || c.lastContactDate === '刚刚').length;
  
  // 2. "当前跟进中案件数"
  const currentInProgressCasesCount = myInPipelineCases.length;

  // 3. "本月预估佣金总额"
  const totalDisbursedWan = accessibleCases
    .filter((l) => l.stage === 'disbursement' || l.stage === 'post_loan' || l.approvedAmount)
    .reduce((acc, curr) => acc + (curr.approvedAmount || curr.appliedAmount || 0), 0);
  
  const estimatedMonthlyCommission = accessibleCases
    .reduce((acc, curr) => acc + (curr.commissionAmount || 0), 0);

  // 咨询服务费营收（真实汇总：已放款/结清进件的服务费）
  const serviceFeeRevenue = accessibleCases
    .filter((l) => l.stage === 'disbursement' || l.stage === 'post_loan')
    .reduce((acc, curr) => acc + (curr.serviceFeeTotal || 0), 0);

  // Todo Cases
  const pendingCases = accessibleCases.map((c) => ({
    id: c.caseNumber || c.id,
    customerName: c.customerName,
    customerPhone: c.customerPhone,
    loanType: c.productName,
    amount: `${(c.appliedAmount ?? c.applyAmount ?? 0) * 10000}`,
    appliedAmountNum: c.appliedAmount ?? c.applyAmount ?? 0,
    node: c.stage === 'pre_screen' ? '资质初审' : c.stage === 'docs_collection' ? '资料收集' : c.stage === 'submission' ? '报审银行' : c.stage === 'interview_visit' ? '下户面签' : c.stage === 'approval' ? '审批批复' : '放款结算',
    status: c.stage === 'docs_collection' ? '待补件' : c.stage === 'approval' ? '待面签' : '审批中',
    statusColor: c.stage === 'docs_collection' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-blue-50 text-blue-700 border border-blue-200',
    updatedAt: c.submittedAt || '今日 09:30',
    rawCase: c,
    rawCustomer: customers.find((cust) => cust.id === c.customerId) || customers[0],
  }));

  // Dynamic sorting for Tasks
  const [taskSortKey, setTaskSortKey] = useState<'follow_up_time' | 'grade' | 'priority' | 'amount'>('priority');
  const [taskSortOrder, setTaskSortOrder] = useState<'desc' | 'asc'>('desc');
  const [taskFilterStatus, setTaskFilterStatus] = useState<string>('all');

  const gradeRank: Record<string, number> = { S: 4, A: 3, B: 2, C: 1 };
  const priorityRank: Record<string, number> = {
    'docs_collection': 5, // 待补件 (最高优先级)
    'approval': 4,        // 待面签
    'interview_visit': 3, // 实地下户
    'submission': 2,      // 报审中
    'pre_screen': 1,      // 资质初审
  };

  const sortedPendingCases = useMemo(() => {
    let result = [...pendingCases];
    if (taskFilterStatus !== 'all') {
      result = result.filter(item => {
        if (taskFilterStatus === 'docs_collection') return item.rawCase.stage === 'docs_collection';
        if (taskFilterStatus === 'approval') return item.rawCase.stage === 'approval';
        if (taskFilterStatus === 'underway') return item.rawCase.stage !== 'docs_collection' && item.rawCase.stage !== 'approval';
        return true;
      });
    }

    return result.sort((a, b) => {
      let comparison = 0;
      if (taskSortKey === 'follow_up_time') {
        comparison = (b.rawCase.submittedAt || '').localeCompare(a.rawCase.submittedAt || '');
      } else if (taskSortKey === 'grade') {
        const gradeA = gradeRank[a.rawCustomer?.grade || 'B'] || 1;
        const gradeB = gradeRank[b.rawCustomer?.grade || 'B'] || 1;
        comparison = gradeB - gradeA;
      } else if (taskSortKey === 'priority') {
        const pA = priorityRank[a.rawCase.stage] || 0;
        const pB = priorityRank[b.rawCase.stage] || 0;
        if (pA !== pB) {
          comparison = pB - pA;
        } else {
          comparison = (b.appliedAmountNum || 0) - (a.appliedAmountNum || 0);
        }
      } else if (taskSortKey === 'amount') {
        comparison = (b.appliedAmountNum || 0) - (a.appliedAmountNum || 0);
      }

      return taskSortOrder === 'desc' ? comparison : -comparison;
    });
  }, [pendingCases, taskSortKey, taskSortOrder, taskFilterStatus]);

  // 真实产品分布：从客户匹配产品聚合（若数据为空则返回空数组，而非写死假数据）
  const productDistribution = useMemo(() => {
    const counter = new Map<string, number>();
    accessibleCustomers.forEach((c) => {
      const categories = new Set<string>();
      (c.matchedProducts || []).forEach((p) => {
        if (p.category) categories.add(p.category);
      });
      categories.forEach((cat) => counter.set(cat, (counter.get(cat) || 0) + 1));
    });
    const colorMap: Record<string, string> = {
      '房抵贷': '#2563eb',
      '税金贷': '#059669',
      '公积金贷': '#7c3aed',
      '消费信用贷': '#d97706',
      '商户经营贷': '#0891b2',
      '车抵贷': '#db2777',
      '供应链金融': '#16a34a',
      '政采贷': '#0369a1',
      '设备融资租赁': '#0f766e',
      '装修分期': '#b45309',
      '票据贴现': '#4d7c0f',
      '过桥垫资': '#be123c',
      '保单放大贷': '#c026d3',
    };
    return Array.from(counter.entries()).map(([name, value]) => ({
      name,
      value,
      color: colorMap[name] || '#64748b',
    }));
  }, [accessibleCustomers]);

  // Open Quick Follow Up with Optional Preset Tag
  const handleOpenQuickFollowUp = (customer: Customer, caseItem?: LoanCase, prefillTag?: string) => {
    setQuickFollowUpTarget({ customer, caseItem });
    setIsFollowUpSaved(false);
    
    if (prefillTag) {
      const matchStandard = STANDARD_QUICK_TAGS.find(t => t.label === prefillTag || t.id === prefillTag);
      const matchIntent = INTENT_TAG_LIST.find(t => t.label === prefillTag || t.id === prefillTag);
      
      if (matchIntent) {
        setSelectedIntentTag(matchIntent.id);
        setFollowUpContent(matchIntent.defaultTemplate);
        setFollowUpNextDate(matchIntent.suggestedNextTime);
      } else if (matchStandard) {
        setSelectedIntentTag(matchStandard.id === 'rejected' ? 'invalid_number' : matchStandard.id === 'appointment' ? 'high_intent' : 'need_callback');
        setFollowUpContent(matchStandard.text);
        setFollowUpNextDate(matchStandard.id === 'appointment' ? '下周一 10:00' : '明天 10:00');
      } else {
        setSelectedIntentTag(null);
        setFollowUpContent('');
      }
    } else {
      setSelectedIntentTag(null);
      setFollowUpContent('');
      setFollowUpNextDate('明天 10:00');
    }
    setFollowUpType('phone');
  };

  const handleSelectIntentInModal = (tagId: IntentTag) => {
    setSelectedIntentTag(tagId);
    const config = INTENT_TAG_CONFIGS[tagId];
    setFollowUpContent(config.defaultTemplate);
    setFollowUpNextDate(config.suggestedNextTime);
  };

  const handleSaveQuickFollowUp = (overrideText?: string) => {
    if (!quickFollowUpTarget) return;
    const finalContent = (overrideText || followUpContent).trim();
    if (!finalContent) return;

    const record: FollowUpRecord = {
      id: `f-${Date.now()}`,
      date: '今日 ' + new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      type: followUpType,
      operator: currentUser.name,
      intentTag: selectedIntentTag || undefined,
      content: finalContent,
      nextFollowUpDate: followUpNextDate,
    };

    if (onAddFollowUp) {
      onAddFollowUp(quickFollowUpTarget.customer.id, record);
    }

    setIsFollowUpSaved(true);
    setTimeout(() => {
      setQuickFollowUpTarget(null);
      setIsFollowUpSaved(false);
      setFollowUpContent('');
      setSelectedIntentTag(null);
    }, 800);
  };

  const handleQuickTagApplyAndSave = (tagText: string) => {
    setFollowUpContent(tagText);
    handleSaveQuickFollowUp(tagText);
  };

  const handleOpenAiCopilot = (customer?: Customer) => {
    setCopilotCustomer(customer || customers[0]);
    setIsAiCopilotOpen(true);
  };

  // Open Expedite Reminder Modal
  const handleOpenExpediteModal = (loanCase: LoanCase, customer?: Customer) => {
    const cust = customer || customers.find((c) => c.id === loanCase.customerId);
    setExpediteModalTarget({
      isOpen: true,
      loanCase,
      customer: cust,
    });
  };

  // Send & Log Expedite Reminder
  const handleSendExpediteRecord = (
    caseId: string,
    template: ExpediteTemplateOption,
    editedContent: string
  ) => {
    const targetCase = loanCases.find((c) => c.id === caseId || c.caseNumber === caseId);
    const targetCust = expediteModalTarget.customer || (targetCase ? customers.find((c) => c.id === targetCase.customerId) : undefined);

    if (targetCust && onAddFollowUp) {
      const record: FollowUpRecord = {
        id: `f-expedite-${Date.now()}`,
        date: '今日 ' + new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        type: 'system',
        operator: currentUser.name,
        intentTag: 'need_callback',
        content: `【超时一键催办】${template.title}\n催办对象: ${template.targetRoleName} ${template.targetPerson} (${template.targetContact})\n催办内容:\n${editedContent}`,
        nextFollowUpDate: '今日 16:00',
      };
      onAddFollowUp(targetCust.id, record);
    }
  };

  return (
    <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-5 max-w-5xl mx-auto text-[#1E293B]">
      
      {/* 0. 团队月度放款业绩总目标进度仪表盘（简洁精美进度条/达成率/贡献拆解） */}
      <TeamPerformanceTargetBanner
        loanCases={loanCases}
        customers={customers}
        users={users}
        currentUser={currentUser}
        systemConfig={systemConfig}
      />

      {/* 0.1. Realtime Performance Dashboard (工作台顶部简洁业绩实时仪表盘组件：当日新增线索、在途审批、累计签约、本月目标，支持周/月切换) */}
      <RealtimePerformanceDashboard
        customers={accessibleCustomers}
        loanCases={accessibleCases}
        currentUser={currentUser}
        onOpenCustomerList={() => onNavigate('crm')}
        onOpenPipeline={() => onNavigate('pipeline')}
      />

      {/* 0.05. Mode Switcher & User Greeting Bar */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-4.5 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            {currentUser.name.slice(0, 1)}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900">
                您好，{currentUser.name}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {currentUser.roleTitle}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentUser.role === 'consultant' && '业务顾问工作台：专注名下私海跟进、高意向客户外呼、保护期倒计时预警及阶梯提成冲刺。'}
              {currentUser.role === 'admin' && '团队主管工作台：通览全组放款大盘、顾问出单英雄榜、滞留工单催办及公海线索调配。'}
              {currentUser.role === 'risk_manager' && '权证风控工作台：严控银行准入红线、排查征信负债风险、推进报审卡点与贷后雷达处置。'}
              {currentUser.role === 'finance_admin' && '财务结算工作台：监控服务费创收与回款率、审核顾问阶梯提成、核销在途放款尾款。'}
              {currentUser.role === 'super_admin' && '全景运营驾驶舱：已聚合全司放款、风控、团队与财务核心数据，支持切换多角色视角。'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0 flex-wrap gap-y-1">
          {/* Mode Switcher Toggle (极简作业 vs 全景分析) */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-xl text-xs font-semibold border border-slate-200">
            <button
              type="button"
              onClick={() => switchWorkbenchMode('simplified')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                workbenchMode === 'simplified'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="切换为极简作业模式（界面简洁，隐藏冗余图表，专注出单）"
            >
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              <span>极简作业模式</span>
            </button>
            <button
              type="button"
              onClick={() => switchWorkbenchMode('analytical')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                workbenchMode === 'analytical'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="切换为全景图表分析模式（查看部门堆叠完成率、各阶段金额分布等深度图表）"
            >
              <PieIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span>全景图表看板</span>
            </button>
          </div>

          {/* AI Telesales Co-Pilot Button */}
          <button
            type="button"
            onClick={() => handleOpenAiCopilot()}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold shadow-2xs transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Bot className="w-3.5 h-3.5 text-blue-600" />
            <span>AI 话术助手</span>
          </button>

          {/* Smart Pitch Guide Sidebar Toggle Button (按通话阶段分层话术引导) */}
          <button
            type="button"
            onClick={() => setIsSmartGuideOpen(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xs transition flex items-center space-x-1.5 cursor-pointer border ${
              isSmartGuideOpen
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
            }`}
            title="按开场破冰 / 需求挖掘 / 异议化解 / 促成邀约四阶段分层引导话术，点击即用"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>智能话术引导</span>
          </button>

          {!isFinance && (
            <button
              onClick={onOpenWizard}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>向导建档</span>
            </button>
          )}
        </div>
      </div>

      {/* 0. 待办事项看板 (Top Daily Tasks Board) */}
      <WorkbenchTodoCard currentUser={currentUser} />

      {/* Super Admin Role Workbench Simulation Switcher */}
      {currentUser.role === 'super_admin' && (
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-slate-200 shadow-xs">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              超级管理权限
            </span>
            <span className="text-xs text-slate-600 font-medium">切换当前工作台业务逻辑视角：</span>
          </div>
          <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1 flex-wrap border border-slate-200/80">
            {[
              { key: 'all', label: '全景总览' },
              { key: 'consultant', label: '业务顾问逻辑' },
              { key: 'admin', label: '团队主管逻辑' },
              { key: 'risk_manager', label: '权证风控逻辑' },
              { key: 'finance_admin', label: '财务结算逻辑' },
            ].map((r) => (
              <button
                key={r.key}
                onClick={() => setAdminSelectedRoleView(r.key)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  adminSelectedRoleView === r.key
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ======================= ROLE SPECIFIC WORKBENCH DECKS ======================= */}
      {/* 1. 业务顾问工作台模块 */}
      {(currentUser.role === 'consultant' || (currentUser.role === 'super_admin' && adminSelectedRoleView === 'consultant')) && (
        <ConsultantWorkbenchDeck
          currentUser={currentUser}
          customers={customers}
          loanCases={loanCases}
          systemConfig={systemConfig}
          onNavigate={onNavigate}
          onOpenCustomerDetail={onOpenCustomerDetail}
          onStartCall={onStartCall}
          onOpenWizard={onOpenWizard}
          onOpenQuickFollowUp={handleOpenQuickFollowUp}
        />
      )}

      {/* 2. 团队主管工作台模块 */}
      {(currentUser.role === 'admin' || (currentUser.role === 'super_admin' && adminSelectedRoleView === 'admin')) && (
        <TeamLeaderWorkbenchDeck
          currentUser={currentUser}
          users={users}
          customers={customers}
          loanCases={loanCases}
          systemConfig={systemConfig}
          onNavigate={onNavigate}
          onOpenCustomerDetail={onOpenCustomerDetail}
          onStartCall={onStartCall}
          setPendingPoolFilter={setPendingPoolFilter}
          onOpenExpediteModal={handleOpenExpediteModal}
        />
      )}

      {/* 3. 权证风控主管工作台模块 */}
      {(currentUser.role === 'risk_manager' || (currentUser.role === 'super_admin' && adminSelectedRoleView === 'risk_manager')) && (
        <RiskManagerWorkbenchDeck
          currentUser={currentUser}
          customers={customers}
          loanCases={loanCases}
          onNavigate={onNavigate}
          onOpenCustomerDetail={onOpenCustomerDetail}
          onOpenExpediteModal={handleOpenExpediteModal}
        />
      )}

      {/* 4. 财务主管工作台模块 */}
      {(currentUser.role === 'finance_admin' || (currentUser.role === 'super_admin' && adminSelectedRoleView === 'finance_admin')) && (
        <FinanceAdminWorkbenchDeck
          currentUser={currentUser}
          loanCases={loanCases}
          onNavigate={onNavigate}
        />
      )}

      {/* Analytical Mode Exclusive Charts */}
      {workbenchMode === 'analytical' && (
        <>
          {/* 业务转化漏斗：意向客户 → 放款全链路 */}
          <BusinessFunnelChart
            customers={accessibleCustomers}
            loanCases={accessibleCases}
            onNavigateToCRM={() => onNavigate('crm')}
            onNavigateToPipeline={() => onNavigate('pipeline')}
          />

          {/* Recharts 贷款业务各阶段金额分布概览卡片 */}
          <PipelineAmountDistributionChart
            loanCases={accessibleCases}
            onNavigateToPipeline={() => onNavigate('pipeline')}
          />

          {/* 团队协作与各业务组本月业绩完成率对比 (堆叠柱状图) */}
          <DepartmentPerformanceStackedChart
            customers={customers}
            loanCases={loanCases}
            currentUser={currentUser}
            users={users}
            onNavigateToCRM={() => onNavigate('crm')}
            onNavigateToPipeline={() => onNavigate('pipeline')}
          />

          {/* 7日获客趋势图表 */}
          <CustomerAcquisitionTrendChart customers={accessibleCustomers} />
        </>
      )}

      {/* 0.1. 横向滑动的“今日待办”胶囊卡片区 (Today's Action Capsules) */}
      <TodayTodoCapsules
        customers={accessibleCustomers}
        loanCases={accessibleCases}
        onOpenQuickFollowUp={handleOpenQuickFollowUp}
        onStartCall={onStartCall}
        onOpenCustomerDetail={onOpenCustomerDetail}
      />

      {/* 0.15. 电销外呼作战台 + 获客渠道转化分析（电销产能与获客 ROI 核心视图） */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <CallOpsCard
          callRecords={callRecords}
          customers={accessibleCustomers}
          currentUserName={currentUser.name}
          isConsultant={isConsultant}
          onStartCall={onStartCall}
          onCompleteCallback={onCompleteCallback || (() => {})}
          onOpenCustomerDetail={onOpenCustomerDetail}
        />
        <ChannelAnalysisCard
          customers={accessibleCustomers}
          loanCases={accessibleCases}
        />
      </div>

      {/* 1.9 响应式三卡网格：高意向跟进 / 待办事项 / 进件实时状态（独立视觉区块 + 悬浮动效） */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {/* 区块一：高意向跟进 */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-4 sm:p-5 space-y-3 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-rose-200 group cursor-pointer"
          onClick={() => onNavigate('crm')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
              <div className="font-bold text-slate-900 text-sm">高意向跟进</div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
              {myActiveCustomers.filter(c => c.grade === 'S' || c.grade === 'A').length} 户
            </span>
          </div>
          <div className="space-y-1.5">
            {myActiveCustomers.filter(c => c.grade === 'S' || c.grade === 'A').slice(0, 3).map((c) => (
              <div key={c.id} className="flex items-center justify-between text-xs">
                <span className="text-slate-700 font-medium truncate">{c.name}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${c.grade === 'S' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                  {c.grade}级
                </span>
              </div>
            ))}
            {myActiveCustomers.filter(c => c.grade === 'S' || c.grade === 'A').length === 0 && (
              <div className="text-xs text-slate-400">暂无高意向客户</div>
            )}
          </div>
          <div className="pt-1 text-[11px] text-blue-600 font-semibold flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <span>进入客户库跟进</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* 区块二：待办事项 */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-4 sm:p-5 space-y-3 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-blue-200 group cursor-pointer"
          onClick={() => onNavigate('pipeline')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div className="font-bold text-slate-900 text-sm">待办事项</div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {sortedPendingCases.length} 笔
            </span>
          </div>
          <div className="space-y-1.5">
            {sortedPendingCases.slice(0, 3).map((deal) => (
              <div key={deal.id} className="flex items-center justify-between text-xs">
                <span className="text-slate-700 font-medium truncate">{deal.customerName}</span>
                <span className="text-[10px] text-slate-500">{deal.node}</span>
              </div>
            ))}
            {sortedPendingCases.length === 0 && (
              <div className="text-xs text-slate-400">暂无待办事项</div>
            )}
          </div>
          <div className="pt-1 text-[11px] text-blue-600 font-semibold flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <span>进入进件看板处理</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* 区块三：进件实时状态 */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-4 sm:p-5 space-y-3 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-emerald-200 group cursor-pointer"
          onClick={() => onNavigate('pipeline')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <GitPullRequestDraft className="w-4 h-4" />
              </div>
              <div className="font-bold text-slate-900 text-sm">进件实时状态</div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {myInPipelineCases.length} 笔在途
            </span>
          </div>
          <div className="space-y-1.5">
            {[
              { key: 'docs_collection', label: '待补件', color: 'bg-amber-100 text-amber-700' },
              { key: 'approval', label: '待批复', color: 'bg-blue-100 text-blue-700' },
              { key: 'interview_visit', label: '面签下户', color: 'bg-purple-100 text-purple-700' },
            ].map((s) => {
              const count = myInPipelineCases.filter(c => c.stage === s.key).length;
              return (
                <div key={s.key} className="flex items-center justify-between text-xs">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${s.color}`}>{s.label}</span>
                  <span className="font-mono font-bold text-slate-800">{count} 笔</span>
                </div>
              );
            })}
          </div>
          <div className="pt-1 text-[11px] text-emerald-600 font-semibold flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <span>查看审批流转</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* 2. Metric Stream Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1 */}
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/90 transition hover:shadow-sm">
          <div className="text-xs text-slate-500 font-medium mb-1">
            {isConsultant ? '名下跟进客户' : '全司活跃客户'}
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
            {myActiveCustomers.length} <span className="text-xs font-normal text-slate-400">户</span>
          </div>
          <div className="text-[10px] text-emerald-600 mt-1 font-semibold flex items-center space-x-1">
            <span>S/A 级意向: {myActiveCustomers.filter(c => c.grade === 'S' || c.grade === 'A').length} 户</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/90 transition hover:shadow-sm">
          <div className="text-xs text-slate-500 font-medium mb-1">
            {isConsultant ? '在途进件审批' : '全司在途进件'}
          </div>
          <div className="text-xl sm:text-2xl font-bold text-blue-600 font-mono">
            {myInPipelineCases.length} <span className="text-xs font-normal text-slate-400">笔</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            待补件/面签: {myInPipelineCases.filter(c => c.stage === 'docs_collection' || c.stage === 'interview_visit').length} 笔
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/90 transition hover:shadow-sm">
          <div className="text-xs text-slate-500 font-medium mb-1">
            {isConsultant ? '当月放款总额' : '全司放款总额'}
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
            ¥{totalDisbursedWan} <span className="text-xs font-normal text-slate-400">万元</span>
          </div>
          <div className="text-[10px] text-blue-600 mt-1 font-semibold">
            {currentUser.monthlyTargetWan
              ? `月度目标达成: ${Math.min(100, Math.round((totalDisbursedWan / currentUser.monthlyTargetWan) * 100))}% (目标 ¥${currentUser.monthlyTargetWan}万)`
              : '月度目标未设定'}
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/90 transition hover:shadow-sm">
          <div className="text-xs text-slate-500 font-medium mb-1">
            {isConsultant ? '预计应发提成' : '咨询服务费营收'}
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-600 font-mono">
            ¥{(isConsultant ? estimatedMonthlyCommission : serviceFeeRevenue).toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {isConsultant ? `基于 ${accessibleCases.length} 笔进件的佣金汇总` : `已放款 ${accessibleCases.filter(l => l.stage === 'disbursement' || l.stage === 'post_loan').length} 笔的服务费汇总`}
          </div>
        </div>
      </div>

      {/* Team Leaderboard (Analytical Mode only) */}
      {workbenchMode === 'analytical' && (
        <TeamLeaderboardCard
          currentUser={currentUser}
          loanCases={loanCases}
          customers={customers}
          users={users}
        />
      )}

      {/* 3. Automatic Determination Stream Card (自动判定模块) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800">
            <Zap className="w-4 h-4 text-blue-600" />
            <span>客户资质智能测算工具 (轻量速算)</span>
          </div>
          <button
            onClick={() => setShowQuickAssessment(!showQuickAssessment)}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
          >
            {showQuickAssessment ? '收起测算' : '展开测算工具'}
          </button>
        </div>

        {showQuickAssessment && (
          <AutoAssessmentCard
            customers={customers}
            onOpenWizard={onOpenWizard}
            onApplyLoan={() => onNavigate('pipeline')}
          />
        )}
      </div>

      {/* 3.8. 进件审批超时停滞高亮预警栏 (初审/待补件>24h超时自动归集 & 一键催办) */}
      <ApprovalTimeoutAlertBanner
        loanCases={accessibleCases}
        customers={accessibleCustomers}
        onOpenExpediteModal={handleOpenExpediteModal}
        onStartCall={onStartCall}
        onOpenCustomerDetail={onOpenCustomerDetail}
      />

      {/* 4. Active Pipeline & Todo Tasks Stream (With View Mode Switch & Accordion Expansion) */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-4.5 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-bold text-slate-900 text-sm sm:text-base">待办事项与实时进件审批节点</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                共 {sortedPendingCases.length} 笔待办
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              点击卡片可平滑展开7大审批节点流转进度，支持在卡片流与精简表格视图间随时切换
            </p>
          </div>

          {/* Right Controls: View Switcher & Sorting */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Layout View Switcher: Card Stream vs Compact Table */}
            <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-xs font-medium border border-slate-200/60">
              <button
                type="button"
                onClick={() => setLayoutView('cards')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer flex items-center space-x-1 ${
                  layoutView === 'cards'
                    ? 'bg-white text-blue-600 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="切换为卡片流视图 (支持平滑展开审批节点)"
              >
                <LayoutGrid className="w-3 h-3" />
                <span>卡片流视图</span>
              </button>

              <button
                type="button"
                onClick={() => setLayoutView('table')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer flex items-center space-x-1 ${
                  layoutView === 'table'
                    ? 'bg-white text-blue-600 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="切换为精简表格视图 (快速纵览大规模客户列表)"
              >
                <TableIcon className="w-3 h-3" />
                <span>精简表格视图</span>
              </button>
            </div>

            {/* Sort Key Selector */}
            <div className="flex items-center p-0.5 bg-slate-100 rounded-lg text-xs font-medium">
              <span className="text-[11px] text-slate-400 px-2 flex items-center gap-1">
                <ArrowDownUp className="w-3 h-3 text-slate-500" />
                <span>排序:</span>
              </span>
              {[
                { key: 'priority' as const, label: '优先级' },
                { key: 'follow_up_time' as const, label: '时间' },
                { key: 'grade' as const, label: '等级' },
                { key: 'amount' as const, label: '额度' },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTaskSortKey(item.key)}
                  className={`px-2 py-1 rounded-md text-[11px] transition cursor-pointer ${
                    taskSortKey === item.key
                      ? 'bg-white text-blue-600 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* View All Cases Button */}
            <button
              onClick={() => onNavigate('pipeline')}
              className="text-xs text-blue-600 font-bold hover:text-blue-800 flex items-center space-x-1 cursor-pointer pl-1"
            >
              <span>全部工单</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content View: Card Stream (with Accordion expansion) vs Compact Table */}
        {layoutView === 'cards' ? (
          <div className="space-y-2.5">
            {sortedPendingCases.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs">
                暂无待办案件
              </div>
            ) : (
              sortedPendingCases.map((deal) => (
                <ExpandableCaseCard
                  key={deal.id}
                  deal={deal}
                  onOpenQuickFollowUp={handleOpenQuickFollowUp}
                  onStartCall={onStartCall}
                  onOpenAiCopilot={handleOpenAiCopilot}
                  onOpenCustomerDetail={onOpenCustomerDetail}
                  onOpenExpediteModal={handleOpenExpediteModal}
                  onNavigateToPipeline={() => onNavigate('pipeline')}
                />
              ))
            )}
          </div>
        ) : (
          <CompactCaseTable
            deals={sortedPendingCases}
            onOpenQuickFollowUp={handleOpenQuickFollowUp}
            onStartCall={onStartCall}
            onOpenCustomerDetail={onOpenCustomerDetail}
            onOpenExpediteModal={handleOpenExpediteModal}
          />
        )}
      </div>

      {/* 5. 公海活跃度预警模块 & 信贷结构分布 (全景分析模式下展示) */}
      {workbenchMode === 'analytical' && (
        <div className="space-y-4">
          {/* Public Pool Alert Card with color blocks for >30 days inactivity */}
          <PublicPoolAlertCard
            customers={customers}
            onNavigateToPool={(filterKey) => {
              setPendingPoolFilter(filterKey || null);
              onNavigate('crm');
            }}
          />

          {/* Product Distribution Card */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-4.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center space-x-1.5">
                <PieIcon className="w-4 h-4 text-blue-600" />
                <span>信贷产品放款结构分布</span>
              </div>
              <span className="text-[11px] text-slate-400">
                {productDistribution.length > 0
                  ? `${productDistribution[0]?.name || '产品'}占比最高，共 ${productDistribution.length} 类产品`
                  : '暂无匹配产品数据'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1">
              {productDistribution.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="font-medium text-[11px]">{item.name}</span>
                    <span className="font-mono font-bold text-[12px]">{item.value}%</span>
                  </div>
                  <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${item.value}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Follow-up Modal with the 3 Standard Action Tags ("已拒贷", "补充资料", "预约下周") */}
      {quickFollowUpTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 text-[#1E293B]">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>录入跟进记录与办理进展</span>
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                      {quickFollowUpTarget.customer.grade} 级意向
                    </span>
                    <AiCustomerCreditScoreCard customer={quickFollowUpTarget.customer} variant="mini" />
                  </h3>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>客户: <strong>{quickFollowUpTarget.customer.name}</strong></span>
                    <span className="font-mono flex items-center gap-1">
                      {quickFollowUpTarget.customer.phone}
                      <CopyButton text={quickFollowUpTarget.customer.phone} title="复制手机号" />
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setQuickFollowUpTarget(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-3.5 text-xs">
              {/* Type Selector */}
              <div>
                <label className="block text-slate-500 font-medium mb-1.5">跟进方式</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'phone' as const, label: '电话沟通', icon: Phone },
                    { id: 'wechat' as const, label: '微信交流', icon: MessageSquare },
                    { id: 'visit' as const, label: '下户面签', icon: Home },
                    { id: 'system' as const, label: '进度同步', icon: CheckCircle2 },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setFollowUpType(t.id)}
                      className={`p-2 rounded-xl border text-center transition flex flex-col items-center justify-center cursor-pointer ${
                        followUpType === t.id
                          ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <t.icon className="w-3.5 h-3.5 mb-1" />
                      <span className="text-[11px]">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Intent Tags & Automation Trigger Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-800 font-bold flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>意向标签 (联动自动化触发器调整优先级):</span>
                  </label>
                  <span className="text-[10px] text-slate-400">点击自动匹配评级与周期</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {INTENT_TAG_LIST.map((tag) => {
                    const isSelected = selectedIntentTag === tag.id;
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleSelectIntentInModal(tag.id)}
                        className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                          isSelected
                            ? `${tag.color} ring-2 ring-blue-500 shadow-xs font-bold`
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center space-x-1">
                          <span>{tag.emoji}</span>
                          <span className="font-bold text-xs">{tag.label}</span>
                        </div>
                        <div className="text-[9px] text-slate-400 mt-0.5">
                          自动调为【{tag.targetGrade}级】
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Automation Rule Preview */}
                {selectedIntentTag && (
                  <div className="p-2 bg-blue-50/70 border border-blue-200 rounded-lg text-[11px] text-blue-800 space-y-0.5 animate-in fade-in">
                    <div className="font-bold flex items-center gap-1 text-blue-900">
                      <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span>{INTENT_TAG_CONFIGS[selectedIntentTag].automationSummary}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* 3 Prominent Requested Quick Tags: "已拒贷", "补充资料", "预约下周" */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-700 font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>快捷业务场景标签 (点击自动填充标准文案):</span>
                  </label>
                  <span className="text-[10px] text-slate-400">支持一键填充标准话术</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {STANDARD_QUICK_TAGS.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => {
                        setFollowUpContent(tag.text);
                        if (tag.id === 'rejected') setSelectedIntentTag('invalid_number');
                        if (tag.id === 'supp_docs') setSelectedIntentTag('need_callback');
                        if (tag.id === 'appointment') setSelectedIntentTag('high_intent');
                      }}
                      className={`p-2 rounded-xl border transition text-center flex flex-col items-center justify-center gap-1 cursor-pointer ${tag.color}`}
                    >
                      <div className="flex items-center space-x-1">
                        <span className={`w-2 h-2 rounded-full ${tag.dotColor}`} />
                        <span className="font-bold text-xs">{tag.label}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 line-clamp-1">点击自动填充</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 常用话术与异议模板下拉选择器（从系统设置中读取预设模板） */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-700 font-bold flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>常用跟进话术 / 客户异议原因模板:</span>
                  </label>
                  <span className="text-[10px] text-slate-400">选择即时填充，支持二次编辑</span>
                </div>

                <select
                  value=""
                  onChange={(e) => {
                    const tpl = (systemConfig?.followUpTemplates || []).find((t) => t.id === e.target.value);
                    if (tpl) {
                      setFollowUpContent(tpl.content);
                      if (tpl.category === 'objection') setSelectedIntentTag('need_callback');
                      if (tpl.category === 'appointment') setSelectedIntentTag('high_intent');
                      if (tpl.category === 'materials') setSelectedIntentTag('need_callback');
                    }
                  }}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500 transition cursor-pointer"
                >
                  <option value="" disabled>-- 快速选择常用话术或客户异议模板一键填入 --</option>
                  <optgroup label="🚨 客户异议与拒绝原因">
                    {(systemConfig?.followUpTemplates || [])
                      .filter((t) => t.category === 'objection')
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="📞 外呼沟通与未接回访">
                    {(systemConfig?.followUpTemplates || [])
                      .filter((t) => t.category === 'phone')
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="📋 资料补件与进件报审">
                    {(systemConfig?.followUpTemplates || [])
                      .filter((t) => t.category === 'materials')
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="🤝 面签邀约与银行下户">
                    {(systemConfig?.followUpTemplates || [])
                      .filter((t) => t.category === 'appointment')
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="🌿 日常关怀与政策推送">
                    {(systemConfig?.followUpTemplates || [])
                      .filter((t) => t.category === 'general')
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>

              {/* Content Textarea */}
              <div>
                <label className="block text-slate-500 font-medium mb-1.5">
                  跟进详细记录 <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={followUpContent}
                  onChange={(e) => setFollowUpContent(e.target.value)}
                  placeholder="请输入本次跟进沟通核心要点、客户资质补充、银行审批反馈或下一步行动计划..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none text-xs"
                />

                {/* AI Objection Handling Float/Popover Suggestion (输入客户拒绝原因自动推荐安抚话术) */}
                <div className="mt-2">
                  <AiObjectionSuggestionPopover
                    currentText={followUpContent}
                    onApplyScript={(script, summary) => {
                      setFollowUpContent((prev) => (prev ? `${prev}\n${summary || script}` : (summary || script)));
                    }}
                  />
                </div>
              </div>

              {/* Next Contact & Pool Protection */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">下次跟进提醒</label>
                  <input
                    type="text"
                    value={followUpNextDate}
                    onChange={(e) => setFollowUpNextDate(e.target.value)}
                    placeholder="如：明天 10:00"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-medium mb-1">公海流转保护</label>
                  <div className="px-2.5 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-medium text-xs">
                    自动重置 15 天保护期
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setQuickFollowUpTarget(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                取消
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleSaveQuickFollowUp()}
                  disabled={!followUpContent.trim() || isFollowUpSaved}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer ${
                    isFollowUpSaved
                      ? 'bg-emerald-600 text-white'
                      : followUpContent.trim()
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isFollowUpSaved ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>已保存并刷新档案</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>立即保存跟进</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Telesales Co-Pilot Modal */}
      <AiTelesalesCopilotModal
        isOpen={isAiCopilotOpen}
        onClose={() => setIsAiCopilotOpen(false)}
        customer={copilotCustomer}
        onApplyFollowUpText={(text) => {
          if (copilotCustomer) {
            handleOpenQuickFollowUp(copilotCustomer);
            setFollowUpContent(text);
          }
        }}
        onSaveFollowUpDirectly={onAddFollowUp}
      />

      {/* Smart Pitch Guide Sidebar (工作台电销与异议化解模块的侧边式智能话术引导栏：开场/需求/拒绝/促成四阶段语义色标) */}
      <SmartPitchGuideSidebar
        isOpen={isSmartGuideOpen}
        onClose={() => setIsSmartGuideOpen(false)}
        onApplyScriptToInput={(script: string, summary?: string) => {
          // 若跟进弹窗已打开则直接填入；否则自动打开首位可跟进客户弹窗并填入
          if (quickFollowUpTarget) {
            setFollowUpContent((prev) => (prev ? `${prev}\n${summary || script}` : (summary || script)));
          } else if (accessibleCustomers.length > 0) {
            const firstActive = accessibleCustomers.find((c) => c.status !== 'in_pool') || accessibleCustomers[0];
            handleOpenQuickFollowUp(firstActive);
            setFollowUpContent(summary || script);
          } else {
            navigator.clipboard.writeText(script);
          }
        }}
      />

      {/* Expedite Reminder Modal (进件审批超时一键催办弹窗) */}
      <ExpediteReminderModal
        isOpen={expediteModalTarget.isOpen}
        onClose={() => setExpediteModalTarget({ isOpen: false, loanCase: null, customer: undefined })}
        loanCase={expediteModalTarget.loanCase}
        customer={expediteModalTarget.customer}
        onSendExpediteRecord={handleSendExpediteRecord}
        onStartCall={onStartCall}
      />

    </div>
  );
};
