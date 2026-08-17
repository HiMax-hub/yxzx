import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  PhoneCall, 
  Plus, 
  FileText, 
  Home, 
  Building, 
  Wallet, 
  Clock, 
  Send,
  UserCheck,
  ArrowRightLeft,
  CheckCircle2,
  X,
  BadgePercent,
  Sparkles,
  RotateCcw,
  Trash2,
  AlertTriangle,
  CheckSquare,
  Square,
  Layers,
  Handshake,
  LayoutGrid,
  ListFilter,
  Download,
  Flame,
  ArrowUpDown,
  Coins,
  ShieldCheck,
  Calendar,
  Check,
  ChevronRight,
  TrendingUp,
  Tag,
  Phone,
  MessageSquare,
  ExternalLink,
  Receipt,
  Store
} from 'lucide-react';
import { Customer, UserAccount, CallRecord, SystemConfig, LoanCase, FollowUpRecord, MainSubjectType, ChannelSource } from '../../types';
import { CopyButton } from '../common/CopyButton';
import { ClickablePhone } from '../common/ClickablePhone';
import { AiCustomerCreditScoreCard } from './AiCustomerCreditScoreCard';
import { AiObjectionSuggestionPopover } from '../common/AiObjectionSuggestionPopover';
import { canDeleteCustomer as canDeleteCustomerRole, canReassign as canReassignRole, isConsultant as isConsultantRole, isFinanceAdmin as isFinanceRole } from '../../utils/permissions';
import { exportCsv, timestampedFilename } from '../../utils/exportUtils';

interface CustomerManagementProps {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  currentUser: UserAccount;
  users: UserAccount[];
  isMasked: boolean;
  systemConfig?: SystemConfig;
  loanCases?: LoanCase[];
  callRecords?: CallRecord[];
  initialPoolFilter?: string | null;
  onConsumePoolFilter?: () => void;
  onOpenWizard: () => void;
  onOpenCustomerDetail: (customer: Customer) => void;
  onStartCall: (customer: Customer) => void;
  onApplyLoan: (customer: Customer) => void;
  onSharePoster: (customer: Customer) => void;
  onDeleteCustomer?: (customerId: string) => void;
  onBatchDeleteCustomers?: (customerIds: string[]) => void;
  onSendFollowUpReminder?: (customer: Customer) => void;
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({
  customers,
  setCustomers,
  currentUser,
  users,
  isMasked,
  systemConfig,
  loanCases = [],
  callRecords = [],
  initialPoolFilter,
  onConsumePoolFilter,
  onOpenWizard,
  onOpenCustomerDetail,
  onStartCall,
  onApplyLoan,
  onSharePoster,
  onDeleteCustomer,
  onBatchDeleteCustomers,
  onSendFollowUpReminder,
}) => {
  const isConsultant = isConsultantRole(currentUser.role);
  const isFinance = isFinanceRole(currentUser.role);
  const canDeleteCustomer = canDeleteCustomerRole(currentUser.role);
  const canReassign = canReassignRole(currentUser.role);

  // Tab & View States
  const [activeTab, setActiveTab] = useState<'my' | 'team' | 'pool' | 'deals'>(isConsultant ? 'my' : 'team');
  const [searchKey, setSearchKey] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'default' | 'amount_desc' | 'recent_contact' | 'grade'>('default');

  // 成交客户：贷后回访状态筛选
  const [followUpFilter, setFollowUpFilter] = useState<'all' | 'due' | 'soon' | 'ok'>('all');

  // 公海定向筛选
  const [poolDormantFilter, setPoolDormantFilter] = useState<string | null>(
    initialPoolFilter && initialPoolFilter !== 'all' ? initialPoolFilter : null
  );

  useEffect(() => {
    if (initialPoolFilter && initialPoolFilter !== 'all') {
      setActiveTab('pool');
      setPoolDormantFilter(initialPoolFilter);
    }
    if (initialPoolFilter === 'all') {
      setActiveTab('pool');
      setPoolDormantFilter(null);
    }
    if (onConsumePoolFilter && initialPoolFilter) {
      onConsumePoolFilter();
    }
  }, [initialPoolFilter, onConsumePoolFilter]);

  // Modal & Selection States
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);
  const [selectedCustomerForPreview, setSelectedCustomerForPreview] = useState<Customer | null>(null);
  const [reminderSuccessId, setReminderSuccessId] = useState<string | null>(null);

  // Reassignment Modal State
  const [reassignCustomer, setReassignCustomer] = useState<Customer | null>(null);
  const [isBatchReassign, setIsBatchReassign] = useState(false);
  const [targetConsultantName, setTargetConsultantName] = useState<string>(
    users.find((u) => u.role === 'consultant')?.name || '李晓明'
  );
  const [reassignSuccessMsg, setReassignSuccessMsg] = useState('');
  // 公海认领拦截提示（冷却期 / 每日上限），红色警示样式
  const [claimErrorMsg, setClaimErrorMsg] = useState('');

  // ===== 公海认领规则（抢单冷却 + 每日上限，来自总控「参数与策略总控」）=====
  const poolClaimCooldownHours = systemConfig?.poolRules?.claimCooldownHours ?? 24;
  const poolMaxClaimPerDay = systemConfig?.poolRules?.maxClaimPerDay ?? 20;

  // 判断跟进时间字符串是否属于今天（兼容 zh-CN "2026/8/17 04:20:30" 与 ISO 格式）
  const isTodayStr = (dateStr?: string): boolean => {
    if (!dateStr || dateStr === '刚刚') return false;
    const d = new Date(dateStr.replace(' ', 'T'));
    if (isNaN(d.getTime())) return false;
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  };

  // 当前用户今日已认领客户数（按认领系统记录统计）
  const countClaimedToday = (): number =>
    customers.filter((c) =>
      (c.followUps || []).some(
        (f) =>
          f.type === 'system' &&
          f.operator === currentUser.name &&
          (f.content.includes('公海捞取') || f.content.includes('批量捞取')) &&
          isTodayStr(f.date)
      )
    ).length;

  // 认领冷却检查：本人主动释放回公海后，冷却期内不得重复捞取（防抢单刷保护）
  const getCooldownRemainHours = (customer: Customer): number => {
    if (!poolClaimCooldownHours || poolClaimCooldownHours <= 0) return 0;
    const lastRelease = (customer.followUps || []).find(
      (f) => f.type === 'system' && f.content.includes('释放公海') && f.operator === currentUser.name
    );
    if (!lastRelease) return 0;
    const releasedAt = new Date(lastRelease.date.replace(' ', 'T'));
    if (isNaN(releasedAt.getTime())) return 0;
    const elapsedHours = (Date.now() - releasedAt.getTime()) / 3600000;
    if (elapsedHours >= poolClaimCooldownHours) return 0;
    return Math.ceil(poolClaimCooldownHours - elapsedHours);
  };

  const showClaimError = (msg: string) => {
    setClaimErrorMsg(msg);
    setTimeout(() => setClaimErrorMsg(''), 3500);
  };

  // Inline Quick Follow-up Input State
  const [quickFollowUpText, setQuickFollowUpText] = useState('');

  // 公海静默天数计算
  const getDormantDays = (c: Customer): number => {
    const latest = c.followUps && c.followUps.length > 0 ? c.followUps[0].date : c.lastContactDate;
    if (!latest || latest === '刚刚') return 0;
    const d = new Date(latest.replace(' ', 'T'));
    if (isNaN(d.getTime())) return 0;
    return Math.floor((Date.now() - d.getTime()) / 86400000);
  };

  // Base counts per tab
  const tabCounts = useMemo(() => {
    const myCount = customers.filter(c => c.status !== 'in_pool' && (c.ownerId === currentUser.id || c.ownerName === currentUser.name)).length;
    const teamCount = customers.filter(c => c.status !== 'in_pool').length;
    const poolCount = customers.filter(c => c.status === 'in_pool').length;
    const dealsCount = customers.filter(c => c.status === 'disbursed' || c.status === 'closed').length;
    return { myCount, teamCount, poolCount, dealsCount };
  }, [customers, currentUser.id, currentUser.name]);

  // Filtered customers list
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      // 1. Tab Scope
      if (activeTab === 'my') {
        if (c.status === 'in_pool') return false;
        if (isConsultant && (c.ownerId ? c.ownerId !== currentUser.id : c.ownerName !== currentUser.name)) {
          return false;
        }
      } else if (activeTab === 'team') {
        if (c.status === 'in_pool') return false;
      } else if (activeTab === 'pool') {
        if (c.status !== 'in_pool') return false;
        if (poolDormantFilter === 'urgent_30') {
          if (getDormantDays(c) < 30) return false;
        } else if (poolDormantFilter === 'dormant_15') {
          const d = getDormantDays(c);
          if (d < 15 || d >= 30) return false;
        }
      } else if (activeTab === 'deals') {
        if (c.status !== 'disbursed' && c.status !== 'closed') return false;
      }

      // 2. Search
      if (searchKey.trim()) {
        const q = searchKey.toLowerCase().trim();
        const hit =
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          (c.ownerName || '').toLowerCase().includes(q) ||
          (c.business?.companyName || '').toLowerCase().includes(q) ||
          (c.purpose || '').toLowerCase().includes(q);
        if (!hit) return false;
      }

      // 3. Dropdowns
      if (selectedGrade !== 'all' && c.grade !== selectedGrade) return false;
      if (selectedSubject !== 'all' && c.subjectType !== selectedSubject) return false;
      if (selectedChannel !== 'all' && c.channel !== selectedChannel) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'amount_desc') return (b.requestedAmount || 0) - (a.requestedAmount || 0);
      if (sortBy === 'grade') {
        const order: Record<string, number> = { S: 4, A: 3, B: 2, C: 1, D: 0 };
        return (order[b.grade] || 0) - (order[a.grade] || 0);
      }
      return 0;
    });
  }, [customers, activeTab, isConsultant, currentUser.id, currentUser.name, poolDormantFilter, searchKey, selectedGrade, selectedSubject, selectedChannel, sortBy]);

  // Keep preview customer in sync
  const activeCustomer = useMemo(() => {
    if (selectedCustomerForPreview) {
      const found = customers.find(c => c.id === selectedCustomerForPreview.id);
      if (found) return found;
    }
    return filteredCustomers[0] || null;
  }, [selectedCustomerForPreview, customers, filteredCustomers]);

  // Lead Flow Operations
  // 1. Claim Customer from Pool to Private Pool
  const handleClaimCustomer = (customer: Customer) => {
    // 公海认领规则拦截：抢单冷却
    const cooldownRemain = getCooldownRemainHours(customer);
    if (cooldownRemain > 0) {
      showClaimError(`该客户处于认领冷却期（本人释放后 ${poolClaimCooldownHours} 小时内不可重复捞取），剩余约 ${cooldownRemain} 小时`);
      return;
    }
    // 公海认领规则拦截：每日上限
    const claimedToday = countClaimedToday();
    if (poolMaxClaimPerDay > 0 && claimedToday >= poolMaxClaimPerDay) {
      showClaimError(`今日公海认领已达上限 ${poolMaxClaimPerDay} 户（公海规则），请明日再试`);
      return;
    }
    const nowStr = new Date().toLocaleString('zh-CN', { hour12: false });
    const updated: Customer = {
      ...customer,
      status: 'active',
      ownerName: currentUser.name,
      ownerId: currentUser.id,
      lastContactDate: '刚刚',
      poolReturnCountdownDays: systemConfig?.publicPoolAutoReturnDays || 15,
      followUps: [
        {
          id: `f-${Date.now()}`,
          date: nowStr,
          type: 'system',
          operator: currentUser.name,
          content: `【公海捞取】顾问 [${currentUser.name}] 从公海池捞取认领该客户，转入个人私海跟进。`,
        },
        ...(customer.followUps || []),
      ],
    };

    setCustomers(prev => prev.map(c => c.id === customer.id ? updated : c));
    setSelectedCustomerForPreview(updated);
  };

  // 2. Batch Claim Selected Pool Leads
  const handleBatchClaim = () => {
    if (selectedCustomerIds.length === 0) return;
    const nowStr = new Date().toLocaleString('zh-CN', { hour12: false });
    const autoDays = systemConfig?.publicPoolAutoReturnDays || 15;

    // 过滤出可认领客户：排除冷却期客户
    const claimableIds = selectedCustomerIds.filter((id) => {
      const c = customers.find((x) => x.id === id);
      return c && c.status === 'in_pool' && getCooldownRemainHours(c) === 0;
    });
    const cooldownBlocked = selectedCustomerIds.length - claimableIds.length;

    // 每日上限约束：最多认领剩余额度
    const claimedToday = countClaimedToday();
    const remainingCap = poolMaxClaimPerDay > 0 ? Math.max(0, poolMaxClaimPerDay - claimedToday) : claimableIds.length;
    const toClaimIds = claimableIds.slice(0, remainingCap);
    const capBlocked = claimableIds.length - toClaimIds.length;

    if (toClaimIds.length === 0) {
      showClaimError(
        cooldownBlocked > 0
          ? `所选客户均处于认领冷却期（本人释放后 ${poolClaimCooldownHours} 小时内不可重复捞取）`
          : `今日公海认领已达上限 ${poolMaxClaimPerDay} 户（公海规则），请明日再试`
      );
      return;
    }

    setCustomers(prev => prev.map(c => {
      if (toClaimIds.includes(c.id) && c.status === 'in_pool') {
        return {
          ...c,
          status: 'active',
          ownerName: currentUser.name,
          ownerId: currentUser.id,
          lastContactDate: '刚刚',
          poolReturnCountdownDays: autoDays,
          followUps: [
            {
              id: `f-${Date.now()}-${c.id}`,
              date: nowStr,
              type: 'system',
              operator: currentUser.name,
              content: `【批量捞取】顾问 [${currentUser.name}] 批量捞取认领该客户。`,
            },
            ...(c.followUps || []),
          ],
        };
      }
      return c;
    }));

    setSelectedCustomerIds([]);
    const blockedParts: string[] = [];
    if (cooldownBlocked > 0) blockedParts.push(`${cooldownBlocked} 户冷却中`);
    if (capBlocked > 0) blockedParts.push(`已达每日上限`);
    setReassignSuccessMsg(
      `成功批量捞取认领 ${toClaimIds.length} 位客户至私海${blockedParts.length > 0 ? `（跳过 ${blockedParts.join('、')}）` : ''}`
    );
    setTimeout(() => setReassignSuccessMsg(''), 3500);
  };

  // 3. Return Customer from Private Pool to Public Pool
  const handleReturnToPool = (customer: Customer) => {
    const nowStr = new Date().toLocaleString('zh-CN', { hour12: false });
    const updated: Customer = {
      ...customer,
      status: 'in_pool',
      ownerName: '公共公海池',
      ownerId: undefined,
      poolReturnCountdownDays: 0,
      followUps: [
        {
          id: `f-${Date.now()}`,
          date: nowStr,
          type: 'system',
          operator: currentUser.name,
          content: `【释放公海】顾问 [${currentUser.name}] 主动释放该客户档案至公共公海池。`,
        },
        ...(customer.followUps || []),
      ],
    };

    setCustomers(prev => prev.map(c => c.id === customer.id ? updated : c));
    setSelectedCustomerForPreview(updated);
  };

  // 4. Reassign Consultant (Manager Permission)
  const handleReassignExecute = () => {
    if (!targetConsultantName) return;
    const targetUser = users.find(u => u.name === targetConsultantName);
    const nowStr = new Date().toLocaleString('zh-CN', { hour12: false });

    if (isBatchReassign && selectedCustomerIds.length > 0) {
      setCustomers(prev => prev.map(c => {
        if (selectedCustomerIds.includes(c.id)) {
          return {
            ...c,
            status: 'active',
            ownerName: targetConsultantName,
            ownerId: targetUser?.id,
            lastContactDate: '刚刚',
            poolReturnCountdownDays: systemConfig?.publicPoolAutoReturnDays || 15,
            followUps: [
              {
                id: `f-${Date.now()}-${c.id}`,
                date: nowStr,
                type: 'system',
                operator: currentUser.name,
                content: `【主管调配】主管 [${currentUser.name}] 批量调单指派给顾问 [${targetConsultantName}]。`,
              },
              ...(c.followUps || []),
            ],
          };
        }
        return c;
      }));
      setReassignSuccessMsg(`已成功将 ${selectedCustomerIds.length} 位客户调配给顾问 ${targetConsultantName}`);
      setSelectedCustomerIds([]);
      setIsBatchReassign(false);
    } else if (reassignCustomer) {
      const updated: Customer = {
        ...reassignCustomer,
        status: 'active',
        ownerName: targetConsultantName,
        ownerId: targetUser?.id,
        lastContactDate: '刚刚',
        poolReturnCountdownDays: systemConfig?.publicPoolAutoReturnDays || 15,
        followUps: [
          {
            id: `f-${Date.now()}`,
            date: nowStr,
            type: 'system',
            operator: currentUser.name,
            content: `【主管调单】主管 [${currentUser.name}] 将客户指派给顾问 [${targetConsultantName}] 跟进。`,
          },
          ...(reassignCustomer.followUps || []),
        ],
      };
      setCustomers(prev => prev.map(c => c.id === reassignCustomer.id ? updated : c));
      setSelectedCustomerForPreview(updated);
      setReassignSuccessMsg(`客户 ${reassignCustomer.name} 已成功指派给顾问 ${targetConsultantName}`);
      setReassignCustomer(null);
    }

    setTimeout(() => setReassignSuccessMsg(''), 3000);
  };

  // 5. Add Follow-Up Note to active customer
  const handleAddQuickFollowUp = (customer: Customer) => {
    if (!quickFollowUpText.trim()) return;
    const nowStr = new Date().toLocaleString('zh-CN', { hour12: false });
    const newRecord: FollowUpRecord = {
      id: `f-${Date.now()}`,
      date: nowStr,
      type: 'phone',
      operator: currentUser.name,
      content: quickFollowUpText.trim(),
    };

    const updated: Customer = {
      ...customer,
      lastContactDate: '刚刚',
      poolReturnCountdownDays: systemConfig?.publicPoolAutoReturnDays || 15,
      followUps: [newRecord, ...(customer.followUps || [])],
    };

    setCustomers(prev => prev.map(c => c.id === customer.id ? updated : c));
    setSelectedCustomerForPreview(updated);
    setQuickFollowUpText('');
  };

  const getSubjectLabel = (s: MainSubjectType) => {
    switch (s) {
      case 'business': return '小微企业主';
      case 'merchant': return '个体工商户';
      case 'salary': return '工薪消费';
      case 'mortgage': return '房产抵押';
      default: return '个人客户';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto text-slate-800">
      
      {/* 1. Header & Identity */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-xs">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                客户档案与公海线索流转
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200">
                双栏高效流转
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              左侧客户池多维检索与批量操作，右侧全量画像解析与一键报审/外呼/公海流转
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            onClick={() => {
              exportCsv(
                timestampedFilename('客户档案明细'),
                ['客户姓名', '手机号', '等级', '主体类型', '意向额度(万)', '渠道来源', '所属顾问', '公海状态', '上次跟进', '创建时间'],
                filteredCustomers.map((c) => [
                  c.name,
                  c.phone,
                  c.grade,
                  getSubjectLabel(c.subjectType),
                  c.requestedAmount ?? '',
                  c.channel,
                  c.ownerName,
                  c.status === 'in_pool' ? '公海池' : '私海跟进中',
                  c.lastContactDate,
                  c.createdAt,
                ])
              );
            }}
            className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer"
            title="导出当前筛选客户 CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>导出客户</span>
          </button>

          {!isFinance && (
            <button
              onClick={onOpenWizard}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>新建客户进件</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Top Public/Private Lead Flow Action Strip (公海线索流转操作区置顶) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Main Navigation Tabs */}
          <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-xl overflow-x-auto shrink-0">
            <button
              onClick={() => setActiveTab('my')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'my'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>我的私海客户</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === 'my' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>
                {tabCounts.myCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('team')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'team'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>团队全量私海</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === 'team' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>
                {tabCounts.teamCount}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('pool');
                setPoolDormantFilter(null);
              }}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'pool'
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>公共公海线索池</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === 'pool' ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {tabCounts.poolCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('deals')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'deals'
                  ? 'bg-white text-emerald-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Handshake className="w-3.5 h-3.5" />
              <span>已放款结案客户</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === 'deals' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                {tabCounts.dealsCount}
              </span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索客户姓名/手机号/企业/用途..."
              value={searchKey}
              onChange={(e) => setSearchKey(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 transition"
            />
            {searchKey && (
              <button
                type="button"
                onClick={() => setSearchKey('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Lead Flow Control Bar with Batch Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* Left: Filters & Batch Selection Counter */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">所有意向等级</option>
              <option value="S">S级 · 房产/税票大额急用</option>
              <option value="A">A级 · 资质优良资料齐备</option>
              <option value="B">B级 · 需进一步沟通补件</option>
              <option value="C">C级 · 暂无强烈借款意向</option>
            </select>

            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">所有主体类型</option>
              <option value="business">小微企业法人/股东</option>
              <option value="merchant">个体工商户</option>
              <option value="salary">个人工薪消费</option>
              <option value="mortgage">房产抵押借款</option>
            </select>

            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">所有获客渠道</option>
              <option value="referral">老客转介绍 (referral)</option>
              <option value="landing_page">信息流落地页 (landing_page)</option>
              <option value="channel_agent">中介渠道报单 (channel_agent)</option>
              <option value="telemarketing">电销呼叫外拓 (telemarketing)</option>
              <option value="self_developed">顾问自拓开发 (self_developed)</option>
            </select>

            {selectedCustomerIds.length > 0 && (
              <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 font-bold text-xs flex items-center space-x-1">
                <span>已选中 {selectedCustomerIds.length} 位客户</span>
                <button
                  type="button"
                  onClick={() => setSelectedCustomerIds([])}
                  className="hover:text-blue-900 ml-1 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          {/* Right: Flow Buttons & Auto Return Notice */}
          <div className="flex items-center gap-2">
            {activeTab === 'pool' && selectedCustomerIds.length > 0 && (
              <button
                type="button"
                onClick={handleBatchClaim}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 shadow-xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>批量捞取至私海</span>
              </button>
            )}

            {canReassign && selectedCustomerIds.length > 0 && (
              <button
                type="button"
                onClick={() => setIsBatchReassign(true)}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 shadow-xs cursor-pointer"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>主管批量调单</span>
              </button>
            )}

            {canDeleteCustomer && selectedCustomerIds.length > 0 && (
              <button
                type="button"
                onClick={() => setIsBatchDeleteModalOpen(true)}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>批量删除</span>
              </button>
            )}

            <div className="text-[11px] text-slate-400 flex items-center space-x-1 pl-2">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>公海超期回收规则: <strong>{systemConfig?.publicPoolAutoReturnDays || 15}</strong> 天未跟进自动流转</span>
            </div>
          </div>
        </div>

        {/* Success Alert Banner */}
        {reassignSuccessMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-between animate-in fade-in">
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{reassignSuccessMsg}</span>
            </span>
            <button onClick={() => setReassignSuccessMsg('')} className="text-emerald-500 hover:text-emerald-700 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Claim Rule Warning Banner（公海认领冷却 / 每日上限拦截提示） */}
        {claimErrorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center justify-between animate-in fade-in">
            <span className="flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{claimErrorMsg}</span>
            </span>
            <button onClick={() => setClaimErrorMsg('')} className="text-rose-400 hover:text-rose-600 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 3. Main Dual-Column Responsive Layout (CSS Selector: .grid.gap-6 / Two-Column) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Fixed Scrollable Customer List (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 flex flex-col h-[calc(100vh-250px)] min-h-[620px]">
          
          {/* List Header Strip */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  if (selectedCustomerIds.length === filteredCustomers.length) {
                    setSelectedCustomerIds([]);
                  } else {
                    setSelectedCustomerIds(filteredCustomers.map(c => c.id));
                  }
                }}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
                title="全选 / 取消全选"
              >
                {selectedCustomerIds.length === filteredCustomers.length && filteredCustomers.length > 0 ? (
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                ) : (
                  <Square className="w-4 h-4 text-slate-300" />
                )}
              </button>
              <span className="text-xs font-bold text-slate-800">
                客户列表 ({filteredCustomers.length})
              </span>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs text-slate-500 bg-transparent border-0 font-medium focus:outline-none cursor-pointer"
            >
              <option value="default">默认排序</option>
              <option value="amount_desc">金额从大到小</option>
              <option value="grade">等级从高到低</option>
            </select>
          </div>

          {/* Scrollable Customer List */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {filteredCustomers.length === 0 ? (
              <div className="p-8 text-center text-slate-300 text-xs border border-dashed border-slate-200 rounded-xl my-4">
                暂无符合条件的客户档案
              </div>
            ) : (
              filteredCustomers.map((customer) => {
                const isSelected = activeCustomer?.id === customer.id;
                const isChecked = selectedCustomerIds.includes(customer.id);
                const isInPool = customer.status === 'in_pool';

                return (
                  <div
                    key={customer.id}
                    onClick={() => setSelectedCustomerForPreview(customer)}
                    className={`p-3.5 rounded-xl border transition-all duration-150 cursor-pointer relative select-none ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-400 ring-1 ring-blue-300 shadow-2xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200/90 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isChecked) {
                              setSelectedCustomerIds(prev => prev.filter(id => id !== customer.id));
                            } else {
                              setSelectedCustomerIds(prev => [...prev, customer.id]);
                            }
                          }}
                          className="text-slate-300 hover:text-slate-600 cursor-pointer"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>

                        <div>
                          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                            <span className="font-bold text-xs text-slate-900 truncate">
                              {customer.name}
                            </span>
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                              customer.grade === 'S'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : customer.grade === 'A'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-slate-100 text-slate-600'
                            }`}>
                              {customer.grade}级
                            </span>
                            <AiCustomerCreditScoreCard customer={customer} variant="mini" />
                            {isInPool && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                公海池
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-slate-400 font-mono mt-0.5" onClick={(e) => e.stopPropagation()}>
                            <ClickablePhone phone={customer.phone} customerName={customer.name} size="sm" />
                          </div>
                        </div>
                      </div>

                      {/* Loan Demand Tag & Amount */}
                      <div className="text-right shrink-0">
                        <div className="text-xs font-black font-mono text-slate-900">
                          ¥{customer.requestedAmount || 50} 万
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {getSubjectLabel(customer.subjectType)}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Metadata */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 mt-2 border-t border-slate-100">
                      <span className="truncate max-w-[130px]">
                        顾问: <strong className="text-slate-600 font-medium">{customer.ownerName}</strong>
                      </span>
                      <span>上次跟进: {customer.lastContactDate || '未联系'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Large Customer Detail & Lead Flow Operation Workspace (lg:col-span-7) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 flex flex-col h-[calc(100vh-250px)] min-h-[620px] overflow-y-auto">
          {activeCustomer ? (
            <div className="space-y-6">
              
              {/* Profile Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 font-black text-base flex items-center justify-center shadow-xs">
                    {activeCustomer.name.slice(0, 1)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-lg font-bold text-slate-900">{activeCustomer.name}</h2>
                      <CopyButton text={activeCustomer.name} title="复制姓名" />
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-black ${
                        activeCustomer.grade === 'S'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : activeCustomer.grade === 'A'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-600'
                      }`}>
                        {activeCustomer.grade}级意向客户
                      </span>
                      {activeCustomer.status === 'in_pool' ? (
                        <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          公共公海池
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          私海在跟 (顾问: {activeCustomer.ownerName})
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-1 flex items-center space-x-3">
                      <span>创建时间: {activeCustomer.createdAt}</span>
                      <span>渠道来源: {activeCustomer.channel}</span>
                    </div>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onStartCall(activeCustomer)}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>外呼拨打</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onApplyLoan(activeCustomer)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>一键报审</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenCustomerDetail(activeCustomer)}
                    className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition flex items-center space-x-1 cursor-pointer"
                    title="展开全屏画像"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>全景画像</span>
                  </button>
                </div>
              </div>

              {/* Lead Pool Flow Operations Quick Bar (捞取 / 释放 / 调单) */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="font-bold text-slate-700 flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>公海线索流转动作:</span>
                </div>

                <div className="flex items-center gap-2">
                  {activeCustomer.status === 'in_pool' ? (
                    <button
                      type="button"
                      onClick={() => handleClaimCustomer(activeCustomer)}
                      className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition flex items-center space-x-1 cursor-pointer shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>捞取认领至我的私海</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleReturnToPool(activeCustomer)}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition flex items-center space-x-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                      <span>释放回收至公海池</span>
                    </button>
                  )}

                  {canReassign && (
                    <button
                      type="button"
                      onClick={() => setReassignCustomer(activeCustomer)}
                      className="px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold rounded-xl transition flex items-center space-x-1 cursor-pointer"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>重新指派顾问</span>
                    </button>
                  )}
                </div>
              </div>

              {/* AI Auto-Scoring & Dynamic Rating Component */}
              <AiCustomerCreditScoreCard 
                customer={activeCustomer} 
                variant="full" 
                onOpenDetails={() => onOpenCustomerDetail(activeCustomer)} 
              />

              {/* Core Financial & Qualification Specifications Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-slate-400 text-[11px]">意向融资金额</div>
                  <div className="text-base font-black font-mono text-blue-600 mt-0.5">
                    ¥{activeCustomer.requestedAmount || 50} 万元
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-slate-400 text-[11px]">主体性质</div>
                  <div className="text-sm font-bold text-slate-800 mt-0.5">
                    {getSubjectLabel(activeCustomer.subjectType)}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-slate-400 text-[11px]">资金用途</div>
                  <div className="text-sm font-bold text-slate-800 mt-0.5">
                    {activeCustomer.purpose === 'business_flow' ? '企业经营周转' : activeCustomer.purpose === 'equipment_purchase' ? '采购进货设备' : '个人综合消费'}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-slate-400 text-[11px]">征信与资产</div>
                  <div className="text-sm font-bold text-emerald-700 mt-0.5 flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{activeCustomer.property?.hasProperty ? '产权房产抵押' : activeCustomer.business?.hasEnterprise ? '企业税票' : '优质个人征信'}</span>
                  </div>
                </div>
              </div>

              {/* Quick Add Follow-up Note with AI Objection Handling */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                    <span>快捷添加跟进纪要</span>
                  </span>
                  <span className="text-[11px] text-slate-400">上次跟进: {activeCustomer.lastContactDate || '暂无'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="输入本次沟通/回访进展（输入拒绝原因可智能推荐化解话术）..."
                    value={quickFollowUpText}
                    onChange={(e) => setQuickFollowUpText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddQuickFollowUp(activeCustomer);
                    }}
                    className="flex-1 px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddQuickFollowUp(activeCustomer)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs shrink-0"
                  >
                    记录跟进
                  </button>
                </div>

                {/* AI Objection Handling Float/Popover Suggestion */}
                <AiObjectionSuggestionPopover
                  currentText={quickFollowUpText}
                  onApplyScript={(script, summary) => {
                    setQuickFollowUpText(summary || script);
                  }}
                />
              </div>

              {/* Follow-up Timeline */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>历史跟进与公海流转记录:</span>
                  <span className="text-[11px] text-slate-400 font-normal">{activeCustomer.followUps?.length || 0} 条记录</span>
                </div>

                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {(!activeCustomer.followUps || activeCustomer.followUps.length === 0) ? (
                    <div className="p-4 text-center text-slate-300 text-xs border border-dashed border-slate-200 rounded-xl">
                      暂无跟进记录
                    </div>
                  ) : (
                    activeCustomer.followUps.map((f) => (
                      <div key={f.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                        <div className="flex items-center justify-between text-slate-400 text-[10px]">
                          <span>{f.date}</span>
                          <span className="font-semibold text-slate-600">{f.operator}</span>
                        </div>
                        <p className="text-slate-800 text-xs leading-relaxed font-medium">{f.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-slate-300">
              <Users className="w-12 h-12 mb-3" />
              <p className="text-sm font-bold text-slate-700">请在左侧选择一位客户查看详情</p>
            </div>
          )}
        </div>

      </div>

      {/* Reassign Consultant Modal */}
      {(reassignCustomer || isBatchReassign) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                <ArrowRightLeft className="w-4 h-4 text-purple-600" />
                <span>{isBatchReassign ? `批量重新指派顾问 (${selectedCustomerIds.length}位)` : `指派客户: ${reassignCustomer?.name}`}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setReassignCustomer(null);
                  setIsBatchReassign(false);
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">选择接收业务顾问:</label>
              <select
                value={targetConsultantName}
                onChange={(e) => setTargetConsultantName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 cursor-pointer focus:outline-none focus:border-blue-500"
              >
                {users
                  .filter((u) => u.role === 'consultant')
                  .map((cons) => (
                    <option key={cons.id} value={cons.name}>
                      {cons.name} ({cons.department} · {cons.roleTitle})
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3">
              <button
                type="button"
                onClick={() => {
                  setReassignCustomer(null);
                  setIsBatchReassign(false);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleReassignExecute}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                确认调配指派
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Delete Confirmation Modal */}
      {isBatchDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in">
            <div className="flex items-center space-x-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-sm font-bold text-slate-900">确认批量删除客户档案</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              您已选中 <strong className="text-rose-600 font-bold">{selectedCustomerIds.length}</strong> 位客户档案。删除后数据将无法直接恢复，请确认是否继续？
            </p>
            <div className="flex items-center justify-end space-x-2 pt-3">
              <button
                type="button"
                onClick={() => setIsBatchDeleteModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onBatchDeleteCustomers) {
                    onBatchDeleteCustomers(selectedCustomerIds);
                  } else {
                    setCustomers(prev => prev.filter(c => !selectedCustomerIds.includes(c.id)));
                  }
                  setSelectedCustomerIds([]);
                  setIsBatchDeleteModalOpen(false);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
