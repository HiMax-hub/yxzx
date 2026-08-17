import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  ShieldCheck, 
  Users, 
  Coins, 
  Clock, 
  Building, 
  Check, 
  Lock, 
  CheckCircle2, 
  UserCheck, 
  UserX, 
  Plus,
  Trash2,
  Save,
  AlertTriangle,
  ArrowRightLeft,
  UserPlus,
  FileCheck2,
  Activity,
  Search,
  Percent,
  Sliders,
  Eye,
  Download,
  Database,
  RefreshCw,
  HardDrive,
  Upload,
  Ban,
  Gauge,
  ShieldAlert,
  ChevronUp,
  ChevronDown,
  Zap,
  FileText,
  Copy,
  MessageSquare,
  Edit
} from 'lucide-react';
import { UserAccount, SystemConfig, UserRole, Customer, LoanCase, BankProductPolicy, CallRecord, CustomerGrade, FollowUpScriptTemplate } from '../../types';
import { buildDefaultBankPolicies, INITIAL_SYSTEM_CONFIG } from '../../data/mockData';
import { useEscToClose } from '../../utils/useEscToClose';
import { hashPassword } from '../../utils/passwordSecurity';
import { EmployeeHandoverModal } from './EmployeeHandoverModal';

interface AuditLogItem {
  id: string;
  timestamp: string;
  operator: string;
  operatorRole: string;
  actionType: 'user_manage' | 'customer_transfer' | 'rule_change' | 'commission_payout' | 'data_export';
  actionTitle: string;
  details: string;
  ipAddress: string;
}

const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'log-1',
    timestamp: '2026-08-15 11:42:19',
    operator: '张伟 (超管)',
    operatorRole: 'super_admin',
    actionType: 'customer_transfer',
    actionTitle: '批量调配离职人员存量客户',
    details: '将离职顾问 [王强] 名下 6 位在途客户重新划拨分配给 [李晓明]',
    ipAddress: '192.168.1.102',
  },
  {
    id: 'log-2',
    timestamp: '2026-08-15 10:15:04',
    operator: '系统自动执行引擎',
    operatorRole: 'system',
    actionType: 'rule_change',
    actionTitle: '公海池未跟进客户自动回收',
    details: '检测到客户 [陈建国] 超过15天未有新增外呼/跟进记录，已自动清除归属人并退回公海',
    ipAddress: '127.0.0.1 (System Cron)',
  },
  {
    id: 'log-3',
    timestamp: '2026-08-14 17:30:22',
    operator: '赵财务 (财务结算)',
    operatorRole: 'finance_admin',
    actionType: 'commission_payout',
    actionTitle: '核定当月顾问阶梯提成方案',
    details: '对 8 月第一批放款单据 (累计 ¥1,280万) 完成服务费返点核算与提成结算审批',
    ipAddress: '192.168.1.118',
  },
  {
    id: 'log-4',
    timestamp: '2026-08-14 14:08:50',
    operator: '张伟 (超管)',
    operatorRole: 'super_admin',
    actionType: 'user_manage',
    actionTitle: '修改岗位权限矩阵与账号状态',
    details: '将用户 [孙晓丽] 岗位调整为 [业务顾问]，设定月度放款目标额度为 ¥200万',
    ipAddress: '192.168.1.102',
  },
];

interface SystemSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserAccount[];
  currentUser: UserAccount;
  customers: Customer[];
  loanCases: LoanCase[];
  callRecords?: CallRecord[];
  onUpdateUsers: (updatedUsers: UserAccount[]) => void;
  onDeleteUser: (userId: string, reassignMode: 'pool' | 'user', targetUserId?: string) => void;
  systemConfig: SystemConfig;
  onUpdateConfig: (updatedConfig: SystemConfig) => void;
  onResetData?: () => void; // 超级管理员专属：清空业务数据到出厂状态（保留产品库与系统配置）
  onRestoreData?: (payload: {
    users?: UserAccount[];
    customers?: Customer[];
    loanCases?: LoanCase[];
    callRecords?: CallRecord[];
    systemConfig?: SystemConfig;
  }) => void; // 从 JSON 备份恢复数据
}

export const SystemSettingsModal: React.FC<SystemSettingsModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUser,
  customers,
  loanCases,
  callRecords = [],
  onUpdateUsers,
  onDeleteUser,
  systemConfig,
  onUpdateConfig,
  onResetData,
  onRestoreData,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'rules' | 'tiers' | 'audit' | 'handover' | 'product_policy' | 'params' | 'departments' | 'blacklist' | 'system' | 'templates'>('users');
  const [localConfig, setLocalConfig] = useState<SystemConfig>(systemConfig);
  const [localUsers, setLocalUsers] = useState<UserAccount[]>(users);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(INITIAL_AUDIT_LOGS);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // ESC 关闭
  useEscToClose(isOpen, onClose);
  // 数据恢复导入（从 JSON 备份恢复）
  const [restoreMsg, setRestoreMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.users)) {
          setRestoreMsg({ ok: false, text: '备份文件格式无效：缺少 users 数据，请确认选择的是本系统导出的 JSON 备份文件。' });
          return;
        }
        if (window.confirm(`确认从备份恢复数据？将覆盖当前 ${parsed.customers?.length ?? 0} 客户 / ${parsed.loanCases?.length ?? 0} 进件 / ${parsed.users.length} 员工。恢复前建议先导出当前数据。`)) {
          onRestoreData?.({
            users: parsed.users,
            customers: parsed.customers || [],
            loanCases: parsed.loanCases || [],
            callRecords: parsed.callRecords || [],
            systemConfig: parsed.systemConfig || undefined,
          });
          setRestoreMsg({ ok: true, text: `数据恢复成功：已导入 ${parsed.users.length} 员工 / ${parsed.customers?.length ?? 0} 客户 / ${parsed.loanCases?.length ?? 0} 进件。` });
          pushAuditLog('从备份恢复数据', `导入 ${parsed.customers?.length ?? 0} 客户 / ${parsed.loanCases?.length ?? 0} 进件 / ${parsed.users.length} 员工`, 'data_export');
        }
      } catch {
        setRestoreMsg({ ok: false, text: '备份文件解析失败：文件可能已损坏或不是有效的 JSON 备份。' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // 银行产品准入配置（可编辑的利率基准/额度上限/准入规则）
  const [localPolicies, setLocalPolicies] = useState<BankProductPolicy[]>(
    systemConfig.bankProductPolicies || []
  );

  // 新增贷款产品表单（管理员/超级管理员可增删产品，保存后同步至产品匹配与产品库）
  const [showAddPolicy, setShowAddPolicy] = useState(false);
  const [newPolicy, setNewPolicy] = useState<BankProductPolicy>({
    bankName: '',
    category: '商户经营贷',
    baseRateRange: '',
    maxAmount: 100,
    admissionRule: '',
    status: 'active',
  });
  const [policyFormError, setPolicyFormError] = useState('');

  const handleAddPolicy = () => {
    const trimmed = {
      bankName: newPolicy.bankName.trim(),
      category: newPolicy.category.trim(),
      baseRateRange: newPolicy.baseRateRange.trim(),
      admissionRule: newPolicy.admissionRule.trim(),
    };
    if (!trimmed.bankName || !trimmed.category || !trimmed.baseRateRange || !trimmed.admissionRule) {
      setPolicyFormError('银行名称、产品类别、利率区间、准入规则均为必填项');
      return;
    }
    if (!(newPolicy.maxAmount > 0)) {
      setPolicyFormError('额度上限必须大于 0');
      return;
    }
    const dup = localPolicies.some(
      (p) => p.bankName.trim() === trimmed.bankName && p.category.trim() === trimmed.category
    );
    if (dup) {
      setPolicyFormError(`产品「${trimmed.bankName} · ${trimmed.category}」已存在，请勿重复添加`);
      return;
    }
    setLocalPolicies([...localPolicies, { ...newPolicy, ...trimmed }]);
    setNewPolicy({ bankName: '', category: '商户经营贷', baseRateRange: '', maxAmount: 100, admissionRule: '', status: 'active' });
    setPolicyFormError('');
    setShowAddPolicy(false);
  };

  const handleDeletePolicy = (idx: number) => {
    const target = localPolicies[idx];
    if (!target) return;
    if (!window.confirm(`确认删除产品「${target.bankName} · ${target.category}」？删除后产品匹配与产品库将不再展示该准入政策，且不可恢复。`)) return;
    setLocalPolicies(localPolicies.filter((_, i) => i !== idx));
  };

  // 一键恢复默认全类别准入库（从产品库自动派生，覆盖全部银行×产品类别）
  const handleRestoreDefaultPolicies = () => {
    const derived = buildDefaultBankPolicies();
    if (!window.confirm(`确认将银行产品准入配置恢复为默认全类别准入库（共 ${derived.length} 条，覆盖房抵/税金/公积金/消费/商户/车抵/政采/租赁/装修/票据等全部类别）？当前自定义配置将被覆盖。`)) return;
    setLocalPolicies(derived);
    pushAuditLog('恢复银行产品默认准入库', `由产品库自动派生 ${derived.length} 条准入政策，覆盖全部产品类别`, 'rule_change');
  };

  // ===== 顾问月度放款阶梯提成自定义（可编辑/增删/排序/实时预览）=====
  const [tierError, setTierError] = useState<string | null>(null);
  const [tierPreviewWan, setTierPreviewWan] = useState(300);

  const validateTiers = (tiers: { minWan: number; maxWan: number; rate: number; tierName: string }[]): string | null => {
    if (!tiers || tiers.length === 0) return '至少保留一个提成档位';
    const sorted = [...tiers].sort((a, b) => a.minWan - b.minWan);
    if (sorted[0].minWan !== 0) return '首档起始放款必须为 0 万';
    for (let i = 0; i < sorted.length; i++) {
      const t = sorted[i];
      if (t.minWan >= t.maxWan) return `「${t.tierName || `第${i + 1}档`}」区间无效：起始放款必须小于截止放款`;
      if (i > 0 && t.minWan !== sorted[i - 1].maxWan) return `「${t.tierName || `第${i + 1}档`}」与上一档区间不连续（需无缝衔接）`;
      if (t.rate < 0 || t.rate > 100) return `「${t.tierName || `第${i + 1}档`}」提成比例需在 0% - 100% 之间`;
      if (!t.tierName || !t.tierName.trim()) return `第 ${i + 1} 档请填写档位名称`;
    }
    if (sorted[sorted.length - 1].maxWan < 9999) return '最后一档截止放款需为 9999（表示无上限）';
    return null;
  };

  const setTiers = (next: { minWan: number; maxWan: number; rate: number; tierName: string }[]) => {
    const sorted = [...next].sort((a, b) => a.minWan - b.minWan);
    setLocalConfig((prev) => ({ ...prev, commissionTiers: sorted }));
    setTierError(validateTiers(sorted));
  };

  const updateTier = (idx: number, patch: Partial<{ minWan: number; maxWan: number; rate: number; tierName: string }>) => {
    const next = localConfig.commissionTiers.map((t, i) => (i === idx ? { ...t, ...patch } : t));
    setTiers(next);
  };

  const handleAddTier = () => {
    const tiers = [...localConfig.commissionTiers];
    const last = tiers[tiers.length - 1];
    if (!last) { setTiers([{ minWan: 0, maxWan: 9999, rate: 15, tierName: '基础档' }]); return; }
    if (last.maxWan >= 9999) {
      // 将无上限档拆分为两档，新档插在其前：继承其起点，区间取中点
      const mid = Math.round(last.minWan + (last.maxWan - last.minWan) / 2);
      tiers.splice(tiers.length - 1, 0, {
        minWan: last.minWan,
        maxWan: Math.max(mid, last.minWan + 100),
        rate: Math.max(5, last.rate - 5),
        tierName: `自定义档${tiers.length}`,
      });
      tiers[tiers.length - 1] = { ...last, minWan: tiers[tiers.length - 2].maxWan };
      setTiers(tiers);
    } else {
      setTiers([...tiers, { minWan: last.maxWan, maxWan: 9999, rate: Math.min(100, last.rate + 5), tierName: `自定义档${tiers.length + 1}` }]);
    }
  };

  const handleDeleteTier = (idx: number) => {
    if (localConfig.commissionTiers.length <= 1) { setTierError('至少保留一个提成档位'); return; }
    const target = localConfig.commissionTiers[idx];
    if (!window.confirm(`确认删除档位「${target.tierName}（${target.minWan}万 ~ ${target.maxWan >= 9999 ? '无上限' : target.maxWan + '万'} · ${target.rate}%）」？`)) return;
    const next = localConfig.commissionTiers.filter((_, i) => i !== idx);
    // 删除后修正衔接：若删除了中间档，把前一档的截止改为后一档起点
    const sorted = [...next].sort((a, b) => a.minWan - b.minWan);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].minWan !== sorted[i - 1].maxWan) {
        sorted[i] = { ...sorted[i], minWan: sorted[i - 1].maxWan };
      }
    }
    setTiers(sorted);
  };

  const handleMoveTier = (idx: number, dir: -1 | 1) => {
    const next = [...localConfig.commissionTiers];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    setTiers(next);
  };

  const tierPreview = (() => {
    const sorted = [...localConfig.commissionTiers].sort((a, b) => a.minWan - b.minWan);
    return sorted.filter((t) => tierPreviewWan >= t.minWan).pop() || null;
  })();

  // ===== 常用跟进话术与客户异议原因模板管理 =====
  const [templateFilter, setTemplateFilter] = useState<'all' | 'objection' | 'phone' | 'materials' | 'appointment' | 'general'>('all');
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [templateForm, setTemplateForm] = useState<{
    id: string;
    title: string;
    category: string;
    content: string;
  }>({
    id: '',
    title: '',
    category: 'objection',
    content: '',
  });
  const [templateError, setTemplateError] = useState<string | null>(null);

  const handleSaveTemplateForm = () => {
    if (!templateForm.title.trim() || !templateForm.content.trim()) {
      setTemplateError('话术标题和详细内容均为必填项');
      return;
    }
    const currentList = localConfig.followUpTemplates || INITIAL_SYSTEM_CONFIG.followUpTemplates || [];
    if (editingTemplateId) {
      const updated = currentList.map((t) =>
        t.id === editingTemplateId ? { ...t, ...templateForm } : t
      );
      setLocalConfig((prev) => ({ ...prev, followUpTemplates: updated }));
      pushAuditLog('修改跟进话术模板', `更新模板「${templateForm.title}」`, 'rule_change');
    } else {
      const newTpl: FollowUpScriptTemplate = {
        id: `tpl-${Date.now()}`,
        title: templateForm.title.trim(),
        category: templateForm.category,
        content: templateForm.content.trim(),
      };
      setLocalConfig((prev) => ({ ...prev, followUpTemplates: [...currentList, newTpl] }));
      pushAuditLog('新增跟进话术模板', `添加模板「${newTpl.title}」`, 'rule_change');
    }
    setEditingTemplateId(null);
    setShowAddTemplate(false);
    setTemplateForm({ id: '', title: '', category: 'objection', content: '' });
    setTemplateError(null);
  };

  const handleDeleteTemplate = (id: string) => {
    const currentList = localConfig.followUpTemplates || INITIAL_SYSTEM_CONFIG.followUpTemplates || [];
    const target = currentList.find((t) => t.id === id);
    if (!target) return;
    if (!window.confirm(`确认删除话术模板「${target.title}」？`)) return;
    const updated = currentList.filter((t) => t.id !== id);
    setLocalConfig((prev) => ({ ...prev, followUpTemplates: updated }));
    pushAuditLog('删除跟进话术模板', `删除模板「${target.title}」`, 'rule_change');
  };

  const handleRestoreDefaultTemplates = () => {
    if (!window.confirm(`确认将跟进话术与客户异议模板重置为系统出厂预设（共 ${INITIAL_SYSTEM_CONFIG.followUpTemplates?.length || 8} 条标准模板）？当前自定义内容将被覆盖。`)) return;
    setLocalConfig((prev) => ({ ...prev, followUpTemplates: INITIAL_SYSTEM_CONFIG.followUpTemplates || [] }));
    pushAuditLog('重置跟进话术模板', `恢复系统默认 ${INITIAL_SYSTEM_CONFIG.followUpTemplates?.length || 8} 条预设话术`, 'rule_change');
  };

  // ===== 参数与策略总控：默认值兜底（localStorage 旧数据缺少新字段时使用）=====
  const LTV_DEFAULT = { residential: 0.7, commercial: 0.5, villa: 0.55 };
  const CREDIT_DEFAULT = { query2MonthWarn: 4, query2MonthHigh: 6, creditCardUtilizationWarn: 80, microLoanCountWarn: 4, providentFundBonusMin: 1500 };
  const POOL_DEFAULT = {
    gradeReturnDays: [
      { grade: 'S' as CustomerGrade, days: 30 },
      { grade: 'A' as CustomerGrade, days: 15 },
      { grade: 'B' as CustomerGrade, days: 10 },
      { grade: 'C' as CustomerGrade, days: 7 },
      { grade: 'D' as CustomerGrade, days: 5 },
    ],
    claimCooldownHours: 24,
    maxClaimPerDay: 20,
    sGradeProtectionDays: 30,
  };
  const SECURITY_DEFAULT = { minPasswordLength: 6, requireComplexity: true, maxLoginFailures: 5, sessionTimeoutMinutes: 120 };
  const FEE_DEFAULT = [
    { id: 'fee-service', name: '贷款服务费', rate: 2.5, enabled: true },
    { id: 'fee-deposit', name: '定金（进件诚意金）', rate: 0.5, enabled: true },
    { id: 'fee-consult', name: '融资咨询费', rate: 1.0, enabled: true },
  ];
  const MASKING_DEFAULT = [
    { field: 'phone' as const, enabled: true },
    { field: 'idCard' as const, enabled: true },
    { field: 'address' as const, enabled: true },
    { field: 'bankCard' as const, enabled: true },
    { field: 'company' as const, enabled: false },
  ];

  const ltvCfg = { ...LTV_DEFAULT, ...(localConfig.ltvConfig || {}) };
  const creditCfg = { ...CREDIT_DEFAULT, ...(localConfig.creditRedlines || {}) };
  const poolCfg = { ...POOL_DEFAULT, ...(localConfig.poolRules || {}) };
  const securityCfg = { ...SECURITY_DEFAULT, ...(localConfig.securityPolicy || {}) };
  const feeCats = localConfig.feeCategories || FEE_DEFAULT;
  const maskingCfg = localConfig.maskingRules || MASKING_DEFAULT;
  const dictCfg = localConfig.dictionaries || { followUpStages: [], intentTags: [], loanPurposes: [] };
  const deptList = localConfig.departments || [];
  const blackList = localConfig.blacklist || [];

  const patchLocal = (patch: Partial<SystemConfig>) =>
    setLocalConfig((prev) => ({ ...prev, ...patch }));

  // 部门/黑名单/费用科目 新增表单状态
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptError, setNewDeptError] = useState('');
  const [newBlackPhone, setNewBlackPhone] = useState('');
  const [newBlackIdCard, setNewBlackIdCard] = useState('');
  const [newBlackReason, setNewBlackReason] = useState('');
  const [newBlackError, setNewBlackError] = useState('');
  const [newFeeName, setNewFeeName] = useState('');
  const [newFeeRate, setNewFeeRate] = useState(2.5);
  const [newFeeError, setNewFeeError] = useState('');

  const handleAddDepartment = () => {
    const name = newDeptName.trim();
    if (!name) { setNewDeptError('请输入部门名称'); return; }
    if (deptList.some((d) => d.name === name)) { setNewDeptError('部门已存在'); return; }
    patchLocal({
      departments: [...deptList, { id: `dept-${Date.now()}`, name }],
    });
    setNewDeptName('');
    setNewDeptError('');
  };

  const handleDeleteDepartment = (id: string) => {
    const target = deptList.find((d) => d.id === id);
    if (!target) return;
    const inUse = localUsers.some((u) => u.department === target.name);
    if (inUse && !window.confirm(`部门「${target.name}」仍有员工归属，删除后这些员工将保留原部门名称显示，请谨慎操作。仍要删除吗？`)) return;
    if (!inUse && !window.confirm(`确认删除部门「${target.name}」？`)) return;
    patchLocal({ departments: deptList.filter((d) => d.id !== id) });
  };

  const handleAddBlacklist = () => {
    const phone = newBlackPhone.trim();
    const idCard = newBlackIdCard.trim();
    if (!phone && !idCard) { setNewBlackError('手机号或身份证号至少填写一项'); return; }
    if (phone && !/^1\d{10}$/.test(phone)) { setNewBlackError('手机号格式不正确（11位，1开头）'); return; }
    if (idCard && !/^\d{17}[\dXx]$/.test(idCard)) { setNewBlackError('身份证号格式不正确'); return; }
    const dup = blackList.some((b) => (phone && b.phone === phone) || (idCard && b.idCard === idCard));
    if (dup) { setNewBlackError('该号码/证件已在黑名单中'); return; }
    patchLocal({
      blacklist: [
        ...blackList,
        {
          id: `black-${Date.now()}`,
          phone: phone || undefined,
          idCard: idCard || undefined,
          reason: newBlackReason.trim() || '风控黑名单',
          addedAt: new Date().toISOString().slice(0, 10),
          addedBy: currentUser?.name || '超级管理员',
        },
      ],
    });
    setNewBlackPhone(''); setNewBlackIdCard(''); setNewBlackReason(''); setNewBlackError('');
  };

  const handleDeleteBlacklist = (id: string) => {
    if (!window.confirm('确认将该客户移出黑名单？')) return;
    patchLocal({ blacklist: blackList.filter((b) => b.id !== id) });
  };

  const handleAddFeeCategory = () => {
    const name = newFeeName.trim();
    if (!name) { setNewFeeError('请输入费用科目名称'); return; }
    if (!(newFeeRate >= 0)) { setNewFeeError('费率必须 ≥ 0'); return; }
    patchLocal({
      feeCategories: [...feeCats, { id: `fee-${Date.now()}`, name, rate: newFeeRate, enabled: true }],
    });
    setNewFeeName(''); setNewFeeRate(2.5); setNewFeeError('');
  };

  const handleDeleteFeeCategory = (id: string) => {
    if (!window.confirm('确认删除该费用科目？')) return;
    patchLocal({ feeCategories: feeCats.filter((f) => f.id !== id) });
  };

  // Private pool capacity rule
  const [privatePoolCapacity, setPrivatePoolCapacity] = useState<number>(50);
  const [sGradeProtectionDays, setSGradeProtectionDays] = useState<number>(30);

  // User Deletion Modal State
  const [userToDelete, setUserToDelete] = useState<UserAccount | null>(null);
  // 重置密码弹窗（正式版安全：管理员可重置任意用户密码，被重置用户下次登录需改密）
  const [resetPwdTarget, setResetPwdTarget] = useState<UserAccount | null>(null);
  const [resetPwdValue, setResetPwdValue] = useState('');
  const [resetPwdError, setResetPwdError] = useState('');
  const [reassignOption, setReassignOption] = useState<'pool' | 'user'>('pool');
  const [targetConsultantId, setTargetConsultantId] = useState<string>('');

  // Add User Form State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('123456');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('138-0000-0000');
  const [newDepartment, setNewDepartment] = useState('助贷业务一部');
  const [newRole, setNewRole] = useState<UserRole>('consultant');
  const [newMonthlyTarget, setNewMonthlyTarget] = useState<number>(150);
  const [addError, setAddError] = useState('');

  // 一键员工离职交接弹窗状态
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [handoverInitialUserId, setHandoverInitialUserId] = useState<string | undefined>(undefined);

  // 权限保护提示（越权/系统自保拦截时展示）
  // 注意：所有 Hook 必须声明在条件早退（if (!isOpen) return null）之前，
  // 否则打开弹窗时 Hook 数量变化会触发 React “Rendered more hooks” 崩溃，导致点击设置无效
  const [permError, setPermError] = useState('');

  if (!isOpen) return null;

  const isSuperAdmin = currentUser.role === 'super_admin';
  const isAdmin = currentUser.role === 'admin';
  const canManagePersonnel = isSuperAdmin || isAdmin;

  // 系统自保：当前启用状态下的超级管理员集合（用于“最后一个超管不可降级/停用/删除”保护）
  const activeSuperAdmins = localUsers.filter(
    (u) => u.role === 'super_admin' && u.status === 'active'
  );
  const isLastActiveSuperAdmin = (target: UserAccount): boolean =>
    target.role === 'super_admin' &&
    target.status === 'active' &&
    activeSuperAdmins.length === 1 &&
    activeSuperAdmins[0].id === target.id;

  // 审计日志写入（统一入口，敏感操作留痕）
  const pushAuditLog = (actionTitle: string, details: string, actionType: AuditLogItem['actionType'] = 'user_manage') => {
    const newLog: AuditLogItem = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toLocaleString('zh-CN', { hour12: false }),
      operator: `${currentUser.name} (${currentUser.roleTitle.split(' ')[0]})`,
      operatorRole: currentUser.role,
      actionType,
      actionTitle,
      details,
      ipAddress: '192.168.1.102',
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Check if current user can delete a specific target user
  const canDeleteTargetUser = (target: UserAccount): boolean => {
    if (target.id === currentUser.id) return false;
    if (isSuperAdmin) return true;
    if (isAdmin) {
      return target.role === 'consultant' || target.role === 'finance_admin' || target.role === 'risk_manager';
    }
    return false;
  };

  const handleToggleUserStatus = (userId: string) => {
    const target = localUsers.find((u) => u.id === userId);
    if (!target) return;

    // 系统自保：不能停用自己（纵深防御）
    if (target.id === currentUser.id) {
      setPermError('系统保护：不能停用当前登录账号');
      return;
    }
    // 权限层级：仅超管可停用超管
    if (target.role === 'super_admin' && !isSuperAdmin) {
      setPermError('权限受限：仅超级管理员可以停用超级管理员账号');
      return;
    }
    // 系统自保：最后一个活跃超管不可停用
    if (target.status === 'active' && isLastActiveSuperAdmin(target)) {
      setPermError('系统保护：必须保留至少一个启用状态的超级管理员，无法停用该账号');
      return;
    }
    // 同级约束：管理员不能停用其他管理员
    if (isAdmin && target.role === 'admin' && target.id !== currentUser.id) {
      setPermError('权限受限：系统管理员不能停用其他管理员账号');
      return;
    }

    setPermError('');
    const nextStatus = target.status === 'active' ? 'disabled' : 'active';
    setLocalUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, status: nextStatus }
          : u
      )
    );
    pushAuditLog(
      nextStatus === 'disabled' ? `停用员工账号 [${target.name}]` : `重新启用员工账号 [${target.name}]`,
      `岗位: ${target.roleTitle}, 状态: ${nextStatus === 'disabled' ? '已停用' : '已启用'}`,
      'user_manage'
    );
  };

  const handleChangeUserRole = (userId: string, newRole: UserRole) => {
    const roleTitleMap: Record<UserRole, string> = {
      super_admin: '超级管理员 (全局最高权限)',
      admin: '系统管理员 (业务与权限管理)',
      consultant: '业务顾问 (初级/资深)',
      risk_manager: '团队主管 / 风控专员',
      finance_admin: '财务管理 / 结算专员',
    };

    const target = localUsers.find((u) => u.id === userId);
    if (!target) return;
    if (target.role === newRole) return;

    // 权限层级：仅超管可授予/调整超管角色
    if (newRole === 'super_admin' && !isSuperAdmin) {
      setPermError('权限受限：仅超级管理员可以授予超级管理员角色');
      return;
    }
    if (target.role === 'super_admin' && !isSuperAdmin) {
      setPermError('权限受限：仅超级管理员可以调整超级管理员岗位');
      return;
    }
    // 系统自保：最后一个活跃超管不可降级
    if (target.role === 'super_admin' && newRole !== 'super_admin' && isLastActiveSuperAdmin(target)) {
      setPermError('系统保护：必须保留至少一个启用状态的超级管理员，无法降级该账号');
      return;
    }
    // 同级约束：管理员不能调整其他管理员岗位
    if (isAdmin && target.role === 'admin' && target.id !== currentUser.id) {
      setPermError('权限受限：系统管理员不能调整其他管理员的岗位');
      return;
    }

    setPermError('');
    setLocalUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, role: newRole, roleTitle: roleTitleMap[newRole] }
          : u
      )
    );
    pushAuditLog(
      `调整员工岗位 [${target.name}]`,
      `岗位: ${target.roleTitle} → ${roleTitleMap[newRole]}`,
      'user_manage'
    );
  };

  const handleChangeUserTarget = (userId: string, targetWan: number) => {
    setLocalUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, monthlyTargetWan: targetWan }
          : u
      )
    );
  };

  const handleConfirmDeleteUser = () => {
    if (!userToDelete) return;

    // 系统自保：最后一个活跃超管不可删除
    if (isLastActiveSuperAdmin(userToDelete)) {
      setPermError('系统保护：必须保留至少一个启用状态的超级管理员，无法删除该账号');
      setUserToDelete(null);
      return;
    }
    // 纵深防御：非超管不能删除超管（UI 已禁用，此处再拦一道）
    if (userToDelete.role === 'super_admin' && !isSuperAdmin) {
      setPermError('权限受限：仅超级管理员可以删除超级管理员账号');
      setUserToDelete(null);
      return;
    }

    onDeleteUser(userToDelete.id, reassignOption, targetConsultantId);
    setLocalUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));

    pushAuditLog(
      `删除员工账号 [${userToDelete.name}] 并交接客户`,
      `原岗位: ${userToDelete.roleTitle}, 交接方式: ${reassignOption === 'pool' ? '自动回收至公海池' : `指定转移给顾问 ID: ${targetConsultantId}`}`,
      'user_manage'
    );

    setUserToDelete(null);
  };

  const handleOpenHandoverModal = (userId?: string) => {
    setHandoverInitialUserId(userId);
    setIsHandoverModalOpen(true);
  };

  const handleExecuteHandoverFromModal = (payload: {
    fromUserId: string;
    selectedCustomerIds: string[];
    selectedCaseIds: string[];
    reassignMode: 'pool' | 'user';
    targetUserId?: string;
    deleteAccountAfterHandover: boolean;
    confirmationNote?: string;
  }) => {
    const fromUser = localUsers.find((u) => u.id === payload.fromUserId);
    const targetUser = payload.targetUserId ? localUsers.find((u) => u.id === payload.targetUserId) : null;
    const fromName = fromUser?.name || '离职员工';
    const targetName = targetUser?.name || (payload.reassignMode === 'user' ? '指定顾问' : '公共公海池');

    // 触发全局交接划拨与账号处理
    onDeleteUser(payload.fromUserId, payload.reassignMode, payload.targetUserId);

    if (payload.deleteAccountAfterHandover) {
      setLocalUsers((prev) => prev.filter((u) => u.id !== payload.fromUserId));
    }

    pushAuditLog(
      `一键员工离职交接与业务划拨 [${fromName} → ${targetName}]`,
      `划拨客户: ${payload.selectedCustomerIds.length} 户, 工单: ${payload.selectedCaseIds.length} 笔, 账号处理: ${payload.deleteAccountAfterHandover ? '已删除' : '已保留'}`,
      'customer_transfer'
    );
  };

  const handleAddNewUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newName.trim()) {
      setAddError('请填写完整的用户名和员工姓名');
      return;
    }
    if (localUsers.some((u) => u.username.toLowerCase() === newUsername.trim().toLowerCase())) {
      setAddError('该用户名已存在，请换一个');
      return;
    }

    const roleTitleMap: Record<UserRole, string> = {
      super_admin: '超级管理员 (全局最高权限)',
      admin: '系统管理员 (业务与权限管理)',
      consultant: '业务顾问 (初级/资深)',
      risk_manager: '团队主管 / 风控专员',
      finance_admin: '财务管理 / 结算专员',
    };

    // 纵深防御：仅超管可创建超管账号（UI 已限制选项，此处再拦一道）
    if (newRole === 'super_admin' && !isSuperAdmin) {
      setAddError('权限受限：仅超级管理员可以创建超级管理员账号');
      return;
    }

    // 密码以 PBKDF2+盐值哈希存储，明文绝不落库
    const passwordHash = await hashPassword(newPassword || 'a1988624');

    const newUser: UserAccount = {
      id: `usr-${Date.now().toString().slice(-4)}`,
      username: newUsername.trim(),
      passwordHash,
      mustChangePassword: true, // 正式版安全策略：新员工首次登录强制修改初始密码
      name: newName.trim(),
      role: newRole,
      roleTitle: roleTitleMap[newRole],
      department: newDepartment,
      phone: newPhone,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      monthlyTargetWan: newMonthlyTarget || 150,
    };

    const updated = [...localUsers, newUser];
    setLocalUsers(updated);
    onUpdateUsers(updated);

    pushAuditLog(
      `创建新员工账号 [${newUser.name}]`,
      `用户名: ${newUser.username}, 所属部门: ${newUser.department}, 岗位: ${newUser.roleTitle}, 月度目标: ¥${newUser.monthlyTargetWan}万`,
      'user_manage'
    );

    setShowAddUserModal(false);
    setNewUsername('');
    setNewName('');
    setAddError('');
  };

  // 重置用户密码（正式版安全：重置后该用户下次登录必须修改密码）
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetPwdError('');
    if (!resetPwdTarget) return;
    if (resetPwdValue.length < 8) {
      setResetPwdError('新密码长度至少 8 位');
      return;
    }
    if (!/[a-zA-Z]/.test(resetPwdValue) || !/\d/.test(resetPwdValue)) {
      setResetPwdError('新密码必须同时包含字母和数字');
      return;
    }
    // 密码以 PBKDF2+盐值哈希存储
    const passwordHash = await hashPassword(resetPwdValue);
    const updated = localUsers.map((u) =>
      u.id === resetPwdTarget.id
        ? { ...u, passwordHash, password: undefined, mustChangePassword: true }
        : u
    );
    setLocalUsers(updated);
    onUpdateUsers(updated);
    pushAuditLog(
      `重置员工密码 [${resetPwdTarget.name}]`,
      `用户名: ${resetPwdTarget.username}，已重置登录密码并要求下次登录修改`,
      'user_manage'
    );
    setResetPwdTarget(null);
    setResetPwdValue('');
  };

  const handleSaveAll = () => {
    // 阶梯提成档位校验：不合法则阻止保存
    const tierCheck = validateTiers(localConfig.commissionTiers);
    if (tierCheck) {
      setActiveTab('tiers');
      setTierError(tierCheck);
      window.alert(`⚠️ 阶梯提成配置未通过校验：${tierCheck}`);
      return;
    }
    onUpdateConfig({
      ...localConfig,
      bankProductPolicies: localPolicies,
      // 同步公海规则：S级保护期与「公海流转」标签页保持一致
      poolRules: { ...POOL_DEFAULT, ...(localConfig.poolRules || {}), sGradeProtectionDays },
    });
    onUpdateUsers(localUsers);
    pushAuditLog(
      '核定当月顾问阶梯提成方案',
      `共 ${localConfig.commissionTiers.length} 档：${localConfig.commissionTiers.map((t) => `${t.tierName} ${t.minWan}-${t.maxWan >= 9999 ? '∞' : t.maxWan}万@${t.rate}%`).join(' / ')}`,
      'commission_payout'
    );
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  const otherConsultants = localUsers.filter(
    (u) => u.id !== userToDelete?.id && u.role === 'consultant' && u.status === 'active'
  );

  const ownedCustomersCount = userToDelete 
    ? customers.filter((c) => (c.ownerId ? c.ownerId === userToDelete.id : c.ownerName === userToDelete.name)).length 
    : 0;

  // ===== 企业总控台导航分组（信息架构：组织 → 业务 → 风控 → 合规 → 系统）=====
  const navGroups: {
    label: string;
    items: { key: 'users' | 'rules' | 'tiers' | 'audit' | 'handover' | 'product_policy' | 'params' | 'departments' | 'blacklist' | 'system' | 'templates'; label: string; icon: React.ReactNode; badge?: string }[];
  }[] = [
    {
      label: '组织与人员',
      items: [
        { key: 'users', label: '员工账号与考核', icon: <Users className="w-4 h-4" />, badge: String(localUsers.length) },
        { key: 'departments', label: '部门管理', icon: <Building className="w-4 h-4" /> },
        { key: 'handover', label: '离职交接概览', icon: <ArrowRightLeft className="w-4 h-4" /> },
      ],
    },
    {
      label: '业务与规则',
      items: [
        { key: 'rules', label: '公海流转与私海上限', icon: <Clock className="w-4 h-4" /> },
        { key: 'tiers', label: '月度放款阶梯提成', icon: <Coins className="w-4 h-4" /> },
        { key: 'templates', label: '常用话术模板管理', icon: <MessageSquare className="w-4 h-4" />, badge: String((localConfig.followUpTemplates || INITIAL_SYSTEM_CONFIG.followUpTemplates || []).length) },
        { key: 'product_policy', label: '银行产品准入配置', icon: <Sliders className="w-4 h-4" /> },
      ],
    },
    {
      label: '风控与策略',
      items: [
        { key: 'params', label: '参数与策略总控', icon: <Gauge className="w-4 h-4" /> },
        { key: 'blacklist', label: '黑名单管理', icon: <Ban className="w-4 h-4" />, badge: String(blackList.length) },
      ],
    },
    {
      label: '合规与审计',
      items: [{ key: 'audit', label: '敏感操作审计日志', icon: <Activity className="w-4 h-4" /> }],
    },
    ...(isSuperAdmin
      ? [{
          label: '系统与数据',
          items: [{ key: 'system' as const, label: '系统数据管理', icon: <Database className="w-4 h-4" /> }],
        }]
      : []),
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-[#1E293B]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  系统底层配置与企业总控后台
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {currentUser.roleTitle}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                组织与权限 · 业务规则 · 风控策略 · 合规审计 · 系统数据 一体化总控
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-500">
              当前模块：{navGroups.flatMap((g) => g.items).find((i) => i.key === activeTab)?.label}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body: 分组导航 + 内容面板（企业总控台布局） */}
        <div className="flex-1 flex min-h-0 flex-col md:flex-row">
          {/* 移动端：横向快捷导航 */}
          <nav className="md:hidden flex items-center gap-1.5 border-b border-slate-200 bg-white px-3 py-2 overflow-x-auto shrink-0">
            {navGroups.flatMap((g) => g.items).map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-semibold flex items-center space-x-1.5 whitespace-nowrap transition cursor-pointer ${
                  activeTab === item.key
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    activeTab === item.key ? 'bg-white/20' : 'bg-white text-slate-500'
                  }`}>{item.badge}</span>
                )}
              </button>
            ))}
          </nav>

          {/* 桌面端：左侧分组导航 */}
          <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-slate-200 bg-slate-50/80 overflow-y-auto py-4 px-3 space-y-5">
            {navGroups.map((group) => (
              <div key={group.label}>
                <div className="px-2.5 mb-1.5 text-[10px] font-bold tracking-wider text-slate-400">
                  {group.label}
                </div>
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setActiveTab(item.key)}
                      className={`w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg text-xs transition cursor-pointer text-left group ${
                        activeTab === item.key
                          ? 'bg-blue-600 text-white font-semibold shadow-sm'
                          : 'text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-xs font-medium'
                      }`}
                    >
                      <span className={`shrink-0 ${activeTab === item.key ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'}`}>
                        {item.icon}
                      </span>
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                          activeTab === item.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>{item.badge}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div className="mt-auto px-2.5 pt-4 text-[10px] leading-relaxed text-slate-400 border-t border-slate-200/80">
              💡 各模块修改后需点击右下角「保存全局配置」按钮才会写入并立即生效
            </div>
          </aside>

          {/* Tab Content */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs bg-slate-50/50">
          {savedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 font-semibold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>系统全局配置与人员权限变更已成功保存并立即生效！</span>
            </div>
          )}

          {/* Tab 1: Users Management */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                    <span>全司员工账号、权限与月度业绩目标矩阵</span>
                    <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-normal">
                      超级管理员/管理员具备人员增删、调单与配额权
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    支持按顾问分配月度放款目标额度 (万元)，变更岗位角色或彻底删除离职业务员并批量交接存量客户
                  </p>
                </div>

                {canManagePersonnel && (
                  <button
                    type="button"
                    onClick={() => setShowAddUserModal(true)}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-xs shadow-xs transition cursor-pointer shrink-0"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>添加新员工</span>
                  </button>
                )}
              </div>

              {permError && (
                <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  <span className="flex items-center space-x-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{permError}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setPermError('')}
                    className="text-rose-500 hover:text-rose-700 font-bold cursor-pointer"
                    title="关闭提示"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-bold text-slate-600">用户名 / 工号</th>
                      <th className="px-4 py-3 font-bold text-slate-600">真实姓名</th>
                      <th className="px-4 py-3 font-bold text-slate-600">所属部门</th>
                      <th className="px-4 py-3 font-bold text-slate-600">月度业绩目标</th>
                      <th className="px-4 py-3 font-bold text-slate-600">当前岗位角色</th>
                      <th className="px-4 py-3 font-bold text-slate-600">名下客户</th>
                      <th className="px-4 py-3 font-bold text-slate-600">状态</th>
                      <th className="px-4 py-3 font-bold text-slate-600 text-right">操作管理</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {localUsers.map((u) => {
                      const userCustCount = customers.filter((c) => (c.ownerId ? c.ownerId === u.id : c.ownerName === u.name)).length;
                      const isSelf = u.id === currentUser.id;
                      const canDelete = canDeleteTargetUser(u);

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                            <div className="flex items-center space-x-1.5">
                              <span>{u.username}</span>
                              {isSelf && (
                                <span className="text-[9px] bg-blue-100 text-blue-700 font-bold px-1 rounded">当前登录</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-900">
                            {u.name}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {u.department}
                          </td>
                          <td className="px-4 py-3">
                            {u.role === 'consultant' ? (
                              <div className="flex items-center space-x-1">
                                <span className="text-slate-400">¥</span>
                                <input
                                  type="number"
                                  value={u.monthlyTargetWan || 150}
                                  onChange={(e) => handleChangeUserTarget(u.id, Number(e.target.value))}
                                  className="w-16 p-1 bg-white border border-slate-200 rounded text-xs font-mono font-bold text-slate-900 focus:border-blue-500 focus:outline-none"
                                />
                                <span className="text-slate-500 text-[11px]">万</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px]">管理岗考核</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={u.role}
                              disabled={!isSuperAdmin && u.role === 'super_admin'}
                              onChange={(e) => handleChangeUserRole(u.id, e.target.value as UserRole)}
                              className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-800 font-semibold focus:border-blue-500 focus:outline-none cursor-pointer"
                            >
                              <option value="consultant">业务顾问 (个人私海)</option>
                              <option value="risk_manager">团队主管 / 风控专员 (初审/调单)</option>
                              <option value="finance_admin">财务结算 / 核算专员</option>
                              <option value="admin">系统管理员 (全司数据/人员管理)</option>
                              {isSuperAdmin && <option value="super_admin">超级管理员 (最高控制权)</option>}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono font-semibold text-slate-700">
                              {userCustCount} 户
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                u.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-rose-100 text-rose-700'
                              }`}
                            >
                              {u.status === 'active' ? '正常启用' : '已停用'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              {!isSelf && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleUserStatus(u.id)}
                                  className={`px-2 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                                    u.status === 'active'
                                      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                      : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                  }`}
                                >
                                  {u.status === 'active' ? '停用' : '启用'}
                                </button>
                              )}

                              {canManagePersonnel && !isSelf && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenHandoverModal(u.id)}
                                  className="px-2 py-1 rounded text-[11px] font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 transition flex items-center space-x-1 cursor-pointer border border-amber-200"
                                  title="发起离职交接与业务划拨"
                                >
                                  <ArrowRightLeft className="w-3 h-3 text-amber-600" />
                                  <span>离职交接</span>
                                </button>
                              )}

                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setUserToDelete(u);
                                    setReassignOption('pool');
                                    setTargetConsultantId(otherConsultants[0]?.id || '');
                                  }}
                                  className="px-2 py-1 rounded text-[11px] font-semibold bg-rose-50 text-rose-600 hover:bg-rose-100 transition flex items-center space-x-1 cursor-pointer border border-rose-200"
                                  title="删除业务员账号"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>删除</span>
                                </button>
                              )}

                              {/* 重置密码（正式版安全：管理员重置后用户下次登录强制改密） */}
                              {!isSelf && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setResetPwdTarget(u);
                                    setResetPwdValue('');
                                    setResetPwdError('');
                                  }}
                                  className="px-2 py-1 rounded text-[11px] font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 transition flex items-center space-x-1 cursor-pointer border border-blue-200"
                                  title="重置该员工的登录密码"
                                >
                                  <Lock className="w-3 h-3" />
                                  <span>重置密码</span>
                                </button>
                              )}
                            </div>
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

          {/* Tab 2: Rules */}
          {activeTab === 'rules' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-4 shadow-2xs">
                <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>公海客户池流转与自动回收规则</span>
                </div>
                <p className="text-slate-500 leading-relaxed text-xs">
                  业务顾问认领或被分配线索后，若在设定天数内无任何有效跟进记录（电话、微信或面签），系统将在每日凌晨自动清空归属人并退回公共线索池，供全司重新抢单认领。
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">
                      无跟进自动退回公海时限 (天):
                    </label>
                    <select
                      value={localConfig.publicPoolAutoReturnDays}
                      onChange={(e) =>
                        setLocalConfig({
                          ...localConfig,
                          publicPoolAutoReturnDays: Number(e.target.value),
                        })
                      }
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold focus:border-blue-500 focus:outline-none cursor-pointer"
                    >
                      <option value={3}>3 天 (极度紧迫，快速流转)</option>
                      <option value={7}>7 天 (常规高周转节奏)</option>
                      <option value={15}>15 天 (当前推荐标准配置)</option>
                      <option value={30}>30 天 (长线大额客户适用)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">
                      敏感信息脱敏全局默认状态:
                    </label>
                    <select
                      value={localConfig.dataMaskingDefault ? '1' : '0'}
                      onChange={(e) =>
                        setLocalConfig({
                          ...localConfig,
                          dataMaskingDefault: e.target.value === '1',
                        })
                      }
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold focus:border-blue-500 focus:outline-none cursor-pointer"
                    >
                      <option value="1">默认开启 (手机/身份证加密掩码)</option>
                      <option value="0">默认关闭 (直接显示明文)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Private Pool Capacity Limits */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-4 shadow-2xs">
                <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>顾问私海上限与高净值线索保护机制</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">
                      单个业务顾问私海持有客户上限 (户):
                    </label>
                    <select
                      value={privatePoolCapacity}
                      onChange={(e) => setPrivatePoolCapacity(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold focus:border-blue-500 focus:outline-none cursor-pointer"
                    >
                      <option value={30}>30 户 (严格控制，专注转化)</option>
                      <option value={50}>50 户 (标准负荷配置)</option>
                      <option value={80}>80 户 (资深顾问放宽)</option>
                      <option value={150}>150 户 (不限制)</option>
                    </select>
                    <p className="text-[11px] text-slate-400 mt-1">达到上限后将无法在公海继续认领或接收新线索</p>
                  </div>

                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">
                      S级/房抵高意向客户保护期 (天):
                    </label>
                    <select
                      value={sGradeProtectionDays}
                      onChange={(e) => setSGradeProtectionDays(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold focus:border-blue-500 focus:outline-none cursor-pointer"
                    >
                      <option value={15}>15 天保护期</option>
                      <option value={30}>30 天保护期 (推荐)</option>
                      <option value={60}>60 天保护期 (长周期大额方案)</option>
                    </select>
                    <p className="text-[11px] text-slate-400 mt-1">保护期内即使跟进频次较低亦不会直接被系统掉保流转</p>
                  </div>
                </div>
              </div>

              {/* Team Performance Target Configuration */}
              <div className="p-4 rounded-xl bg-white border border-blue-200/80 space-y-3 shadow-2xs">
                <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                  <Gauge className="w-4 h-4 text-blue-600" />
                  <span>全司月度团队放款总目标额度（工作台大盘基准）</span>
                </div>
                <p className="text-slate-500 leading-relaxed text-xs">
                  设定全团队当月放款规模考核总目标。工作台顶部仪表盘将实时依据当前全司放款累计金额自动计算达成率、剩余缺口及各顾问业绩贡献拆解。
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">
                      团队月度放款考核总目标:
                    </label>
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-400 font-bold text-sm">¥</span>
                      <input
                        type="number"
                        min={10}
                        step={50}
                        value={localConfig.monthlyTeamTargetWan ?? 5000}
                        onChange={(e) =>
                          setLocalConfig({
                            ...localConfig,
                            monthlyTeamTargetWan: Math.max(10, Number(e.target.value) || 0),
                          })
                        }
                        className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-bold font-mono focus:border-blue-500 focus:bg-white focus:outline-none text-sm"
                        placeholder="如: 5000"
                      />
                      <span className="text-slate-600 font-bold text-xs shrink-0">万元</span>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center text-[11px] text-slate-500 bg-blue-50/60 p-3 rounded-lg border border-blue-100">
                    <span className="font-bold text-blue-800 mb-0.5">💡 实时联动说明</span>
                    <span>修改后点击底部「保存配置」，工作台顶部仪表盘将立即无缝刷新目标基准与达成百分比。</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Partner Banks Channels Master */}
          {/* Tab 4: Commission Tiers */}
          {activeTab === 'tiers' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                    <Coins className="w-4 h-4 text-amber-500" />
                    <span>顾问月度放款阶梯提成档位设置</span>
                  </div>
                  <p className="text-slate-500 text-xs mt-0.5">
                    根据顾问当月累计放款规模（万元）自动匹配提成比例。支持自定义档位名称、区间与点位，可新增 / 删除 / 排序，保存后财务结算页即时生效。
                  </p>
                </div>
                <button
                  onClick={handleAddTier}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>新增档位</span>
                </button>
              </div>

              {tierError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-[11px] font-semibold flex items-center space-x-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{tierError}</span>
                </div>
              )}

              {/* 档位编辑区 */}
              <div className="space-y-2.5">
                {localConfig.commissionTiers.map((tier, idx) => (
                  <div key={`${tier.tierName}-${idx}`} className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs items-end">
                      <div className="md:col-span-1">
                        <label className="block text-slate-500 mb-1">档位名称</label>
                        <input
                          value={tier.tierName}
                          onChange={(e) => updateTier(idx, { tierName: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:bg-white focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 mb-1">起始放款 (万)</label>
                        <input
                          type="number"
                          value={tier.minWan}
                          onChange={(e) => updateTier(idx, { minWan: Number(e.target.value) })}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:bg-white focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 mb-1">截止放款 (万) <span className="text-slate-400">9999=无上限</span></label>
                        <input
                          type="number"
                          value={tier.maxWan}
                          onChange={(e) => updateTier(idx, { maxWan: Number(e.target.value) })}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono focus:bg-white focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 mb-1">提成比例 (%)</label>
                        <input
                          type="number"
                          value={tier.rate}
                          onChange={(e) => updateTier(idx, { rate: Number(e.target.value) })}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold focus:bg-white focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div className="flex items-end justify-end space-x-1.5">
                        <button
                          onClick={() => handleMoveTier(idx, -1)}
                          disabled={idx === 0}
                          className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                          title="上移档位"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveTier(idx, 1)}
                          disabled={idx === localConfig.commissionTiers.length - 1}
                          className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                          title="下移档位"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTier(idx)}
                          disabled={localConfig.commissionTiers.length <= 1}
                          className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                          title="删除档位"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 text-[11px] text-slate-400">
                      命中区间：当月放款 ≥ {tier.minWan}万 且 &lt; {tier.maxWan >= 9999 ? '无上限' : `${tier.maxWan}万`} → 提成 {tier.rate}%
                    </div>
                  </div>
                ))}
              </div>

              {/* 实时预览 */}
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-2.5">
                <div className="flex items-center space-x-2 text-xs font-bold text-blue-900">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <span>提成档位实时预览</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                  <div>
                    <label className="block text-slate-500 mb-1 text-xs">模拟顾问当月放款额 (万元)</label>
                    <input
                      type="number"
                      value={tierPreviewWan}
                      onChange={(e) => setTierPreviewWan(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="text-xs">
                    {tierPreview ? (
                      <div className="flex items-center space-x-2 text-blue-900">
                        <span className="px-2 py-1 rounded-lg bg-white border border-blue-200 font-bold">
                          命中「{tierPreview.tierName}」→ 提成 {tierPreview.rate}%
                        </span>
                        <span className="text-slate-500">
                          服务费 ¥{Math.round((tierPreviewWan * 10000 * 0.015) * (tierPreview.rate / 100)).toLocaleString()}（按 1.5% 服务费率估算）
                        </span>
                      </div>
                    ) : (
                      <span className="text-rose-500 font-semibold">未命中任何档位（配置不完整）</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Security & Audit Logs */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <span>系统安全合规与敏感操作审计日志</span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    全程追溯记录员工增删、客户划拨转移、公海自动回收、提成结算与配置变更操作
                  </p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-bold text-slate-600">时间戳</th>
                      <th className="px-4 py-3 font-bold text-slate-600">操作人 / 角色</th>
                      <th className="px-4 py-3 font-bold text-slate-600">操作类别</th>
                      <th className="px-4 py-3 font-bold text-slate-600">操作详情与变更内容</th>
                      <th className="px-4 py-3 font-bold text-slate-600 text-right">来源 IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                          {log.timestamp}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                          {log.operator}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.actionType === 'customer_transfer' ? 'bg-purple-100 text-purple-700' :
                            log.actionType === 'user_manage' ? 'bg-blue-100 text-blue-700' :
                            log.actionType === 'commission_payout' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {log.actionTitle}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700 leading-relaxed">
                          {log.details}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-400 text-[11px] whitespace-nowrap">
                          {log.ipAddress}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          )}

          {/* Tab 6: 一键员工离职交接面板 */}
          {activeTab === 'handover' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-rose-50 via-amber-50 to-blue-50 p-4 rounded-2xl border border-rose-200/80">
                <div>
                  <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                      <ArrowRightLeft className="w-4 h-4" />
                    </div>
                    <span className="text-base font-black text-slate-900">一键员工离职交接与业务划拨面板</span>
                  </div>
                  <p className="text-slate-600 text-xs mt-1 leading-relaxed max-w-2xl">
                    支持在员工离职/岗位变动时，以可视化列表形式批量勾选需要转交的客户和在途工单，指定新归属人或退回公海，并一键生成标准化《员工离职业务交接确认书》。
                  </p>
                </div>
                {canManagePersonnel && (
                  <button
                    type="button"
                    onClick={() => handleOpenHandoverModal()}
                    className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center space-x-1.5 shrink-0 cursor-pointer active:scale-95"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    <span>发起一键离职交接向导</span>
                  </button>
                )}
              </div>

              {/* 统计指标卡片 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-[11px] font-bold text-slate-500">业务顾问总数</div>
                  <div className="text-xl font-black font-mono text-slate-900 mt-1">
                    {localUsers.filter((u) => u.role === 'consultant').length} <span className="text-xs font-normal text-slate-500">人</span>
                  </div>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-[11px] font-bold text-slate-500">顾问名下存量客户</div>
                  <div className="text-xl font-black font-mono text-blue-700 mt-1">
                    {customers.filter((c) => c.status !== 'in_pool' && c.ownerName !== '公共公海池').length} <span className="text-xs font-normal text-slate-500">户</span>
                  </div>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-[11px] font-bold text-slate-500">在途待结案工单</div>
                  <div className="text-xl font-black font-mono text-amber-600 mt-1">
                    {loanCases.filter((l) => l.stage !== 'disbursement' && l.stage !== 'post_loan').length} <span className="text-xs font-normal text-slate-500">笔</span>
                  </div>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-[11px] font-bold text-slate-500">累计放款总规模</div>
                  <div className="text-xl font-black font-mono text-emerald-600 mt-1">
                    ¥{loanCases.filter((l) => l.stage === 'disbursement' || l.stage === 'post_loan').reduce((s, l) => s + (l.approvedAmount || l.appliedAmount || 0), 0)} <span className="text-xs font-normal text-slate-500">万</span>
                  </div>
                </div>
              </div>

              {/* 顾问列表与交接操作表 */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span>顾问资产分布与一键交接名册</span>
                  </div>
                  <span className="text-[11px] text-slate-400">点击「一键离职交接」即可精细勾选客户/工单并生成确认书</span>
                </div>
                <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 font-bold">顾问姓名</th>
                      <th className="px-4 py-3 font-bold">所属部门</th>
                      <th className="px-4 py-3 font-bold text-center">名下客户数</th>
                      <th className="px-4 py-3 font-bold text-center">在途未结案工单</th>
                      <th className="px-4 py-3 font-bold text-center">累计已放款(万)</th>
                      <th className="px-4 py-3 font-bold text-center">意向客群分级</th>
                      <th className="px-4 py-3 font-bold text-center">账号状态</th>
                      <th className="px-4 py-3 font-bold text-right">交接操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {localUsers
                      .filter((u) => u.role === 'consultant')
                      .map((consultant) => {
                        const ownedCustomers = customers.filter((c) => (c.ownerId ? c.ownerId === consultant.id : c.ownerName === consultant.name));
                        const ownedCases = loanCases.filter((l) => (l.consultantId ? l.consultantId === consultant.id : l.consultantName === consultant.name));
                        const pendingCases = ownedCases.filter((l) => l.stage !== 'disbursement' && l.stage !== 'post_loan');
                        const disbursedWan = ownedCases
                          .filter((l) => l.stage === 'disbursement' || l.stage === 'post_loan')
                          .reduce((s, l) => s + (l.approvedAmount || l.appliedAmount || 0), 0);
                        const gradeDist = ownedCustomers.reduce<Record<string, number>>((acc, c) => {
                          acc[c.grade] = (acc[c.grade] || 0) + 1;
                          return acc;
                        }, {});

                        return (
                          <tr key={consultant.id} className="hover:bg-slate-50/80 transition">
                            <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[11px]">
                                  {consultant.name.slice(0, 1)}
                                </div>
                                <span>{consultant.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{consultant.department}</td>
                            <td className="px-4 py-3 text-center font-bold text-blue-700">
                              {ownedCustomers.length > 0 ? `${ownedCustomers.length} 户` : <span className="text-slate-300 font-normal">0</span>}
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-amber-600">
                              {pendingCases.length > 0 ? `${pendingCases.length} 笔` : <span className="text-slate-300 font-normal">0</span>}
                            </td>
                            <td className="px-4 py-3 text-center font-mono font-bold text-emerald-700">
                              ¥{disbursedWan}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex flex-wrap gap-1 justify-center">
                                {Object.entries(gradeDist).map(([g, n]) => (
                                  <span key={g} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px] font-bold">
                                    {g}级×{n}
                                  </span>
                                ))}
                                {Object.keys(gradeDist).length === 0 && <span className="text-slate-300">—</span>}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${consultant.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                {consultant.status === 'active' ? '正常' : '已停用'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              {canManagePersonnel && (
                                <div className="flex items-center justify-end space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenHandoverModal(consultant.id)}
                                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                                    title="发起一键离职交接（勾选客户/工单并生成交接确认书）"
                                  >
                                    <ArrowRightLeft className="w-3.5 h-3.5 text-rose-600" />
                                    <span>一键离职交接</span>
                                  </button>
                                </div>
                              )}
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

          {/* Tab 7: 银行产品准入配置 */}
          {activeTab === 'product_policy' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                    <Sliders className="w-4 h-4 text-emerald-600" />
                    <span>银行产品准入配置（利率基准 / 额度上限 / 准入规则）</span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    根据最新信贷政策维护各银行 × 产品类别的利率基准区间、授信额度上限与准入硬性规则，保存后同步至业务员产品匹配逻辑与产品库（当前共 {localPolicies.length} 条准入政策，覆盖 {new Set(localPolicies.map((p) => p.category)).size} 个产品类别）
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleRestoreDefaultPolicies}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer border border-slate-200"
                    title="从产品库自动派生全类别默认准入政策（覆盖房抵/税金/公积金/消费/商户/车抵/政采/租赁/装修/票据等）"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>恢复默认全类别准入库</span>
                  </button>
                  {canManagePersonnel && (
                    <button
                      onClick={() => {
                        setShowAddPolicy(!showAddPolicy);
                        setPolicyFormError('');
                      }}
                      className="ml-3 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{showAddPolicy ? '收起新增表单' : '新增贷款产品'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 新增贷款产品表单 */}
              {showAddPolicy && canManagePersonnel && (
                <div className="p-4 bg-white border border-emerald-200 rounded-xl shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                      <Plus className="w-3.5 h-3.5 text-emerald-600" />
                      <span>新增贷款产品</span>
                    </div>
                    <button
                      onClick={() => setShowAddPolicy(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">银行名称 *</label>
                      <input
                        value={newPolicy.bankName}
                        onChange={(e) => setNewPolicy({ ...newPolicy, bankName: e.target.value })}
                        placeholder="如：招商银行"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">产品类别 *</label>
                      <input
                        value={newPolicy.category}
                        onChange={(e) => setNewPolicy({ ...newPolicy, category: e.target.value })}
                        placeholder="如：商户经营贷"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">利率基准区间 *</label>
                      <input
                        value={newPolicy.baseRateRange}
                        onChange={(e) => setNewPolicy({ ...newPolicy, baseRateRange: e.target.value })}
                        placeholder="如：3.45% - 4.35%"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">额度上限(万) *</label>
                      <input
                        type="number"
                        min="1"
                        value={newPolicy.maxAmount}
                        onChange={(e) => setNewPolicy({ ...newPolicy, maxAmount: Number(e.target.value) || 0 })}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2 lg:col-span-1">
                      <label className="block text-[11px] text-slate-500 mb-1">初始状态</label>
                      <select
                        value={newPolicy.status}
                        onChange={(e) => setNewPolicy({ ...newPolicy, status: e.target.value as 'active' | 'paused' })}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:border-emerald-500 focus:outline-none cursor-pointer"
                      >
                        <option value="active">生效中</option>
                        <option value="paused">已暂停</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2 lg:col-span-5">
                      <label className="block text-[11px] text-slate-500 mb-1">准入规则 *</label>
                      <input
                        value={newPolicy.admissionRule}
                        onChange={(e) => setNewPolicy({ ...newPolicy, admissionRule: e.target.value })}
                        placeholder="如：营业执照满1年，近12个月经营流水≥100万，征信无连三累六"
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  {policyFormError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-600 font-semibold">
                      {policyFormError}
                    </div>
                  )}
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => { setShowAddPolicy(false); setPolicyFormError(''); }}
                      className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleAddPolicy}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5 inline mr-1" />确认新增
                    </button>
                  </div>
                </div>
              )}

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-bold text-slate-600">银行</th>
                      <th className="px-4 py-3 font-bold text-slate-600">产品类别</th>
                      <th className="px-4 py-3 font-bold text-slate-600">利率基准区间</th>
                      <th className="px-4 py-3 font-bold text-slate-600">额度上限(万)</th>
                      <th className="px-4 py-3 font-bold text-slate-600">准入规则</th>
                      <th className="px-4 py-3 font-bold text-slate-600 text-center">状态</th>
                      <th className="px-4 py-3 font-bold text-slate-600 text-center">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {localPolicies.map((policy, idx) => (
                      <tr key={`${policy.bankName}-${idx}`} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            value={policy.bankName}
                            onChange={(e) => {
                              const next = [...localPolicies];
                              next[idx] = { ...next[idx], bankName: e.target.value };
                              setLocalPolicies(next);
                            }}
                            className="w-24 p-1.5 bg-slate-50 border border-slate-200 rounded text-[11px] font-semibold text-slate-800 focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            value={policy.category}
                            onChange={(e) => {
                              const next = [...localPolicies];
                              next[idx] = { ...next[idx], category: e.target.value };
                              setLocalPolicies(next);
                            }}
                            className="w-24 p-1.5 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-500 focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            value={policy.baseRateRange}
                            onChange={(e) => {
                              const next = [...localPolicies];
                              next[idx] = { ...next[idx], baseRateRange: e.target.value };
                              setLocalPolicies(next);
                            }}
                            className="w-28 p-1.5 bg-slate-50 border border-slate-200 rounded text-[11px] font-mono focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={policy.maxAmount}
                            onChange={(e) => {
                              const next = [...localPolicies];
                              next[idx] = { ...next[idx], maxAmount: Number(e.target.value) };
                              setLocalPolicies(next);
                            }}
                            className="w-20 p-1.5 bg-slate-50 border border-slate-200 rounded text-[11px] font-mono focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            value={policy.admissionRule}
                            onChange={(e) => {
                              const next = [...localPolicies];
                              next[idx] = { ...next[idx], admissionRule: e.target.value };
                              setLocalPolicies(next);
                            }}
                            className="w-full min-w-48 p-1.5 bg-slate-50 border border-slate-200 rounded text-[11px] focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => {
                              const next = [...localPolicies];
                              next[idx] = { ...next[idx], status: next[idx].status === 'active' ? 'paused' : 'active' };
                              setLocalPolicies(next);
                            }}
                            className={`px-2 py-1 rounded-full text-[10px] font-bold transition cursor-pointer ${
                              policy.status === 'active'
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                : 'bg-slate-100 text-slate-500 border border-slate-300'
                            }`}
                          >
                            {policy.status === 'active' ? '生效中' : '已暂停'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleDeletePolicy(idx)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                            title="删除该产品（不可恢复）"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-700">
                💡 提示：此处维护的准入规则将作为业务员进件时的匹配依据，并同步展示在产品库页面。支持新增 / 删除 / 编辑（银行、类别、利率、额度、规则、状态），修改后请点击底部「保存全局配置」按钮，数据会写入本地持久化存储。
              </div>
            </div>
          )}

          {/* Tab: 参数与策略总控（成数/征信红线/公海规则/安全策略/费用科目/脱敏/字典） */}
          {activeTab === 'params' && (
            <div className="space-y-4">
              {/* 抵押成数参数 */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 shadow-2xs">
                <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                  <Percent className="w-4 h-4 text-blue-600" />
                  <span>房产抵押成数参数（影响自动评估 / 额度测算 / 进件预估）</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { key: 'residential', label: '普通住宅成数', val: Math.round(ltvCfg.residential * 100) },
                    { key: 'commercial', label: '商办/厂房成数', val: Math.round(ltvCfg.commercial * 100) },
                    { key: 'villa', label: '别墅成数', val: Math.round(ltvCfg.villa * 100) },
                  ].map((item) => (
                    <div key={item.key}>
                      <label className="text-slate-700 font-semibold block mb-1">{item.label} (%):</label>
                      <input
                        type="number"
                        min={10}
                        max={100}
                        value={item.val}
                        onChange={(e) =>
                          patchLocal({
                            ltvConfig: { ...ltvCfg, [item.key]: Number(e.target.value) / 100 },
                          })
                        }
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold font-mono focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400">当前默认：普通住宅 70% · 商办/厂房 50% · 别墅 55%。修改后保存即全局生效。</p>
              </div>

              {/* 征信红线阈值 */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 shadow-2xs">
                <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>征信红线与预警阈值（风控引擎参数）</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">近2月查询预警阈值 (次):</label>
                    <input type="number" min={1} max={30} value={creditCfg.query2MonthWarn}
                      onChange={(e) => patchLocal({ creditRedlines: { ...creditCfg, query2MonthWarn: Number(e.target.value) } })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold" />
                  </div>
                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">近2月查询高警戒阈值 (次):</label>
                    <input type="number" min={1} max={30} value={creditCfg.query2MonthHigh}
                      onChange={(e) => patchLocal({ creditRedlines: { ...creditCfg, query2MonthHigh: Number(e.target.value) } })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold" />
                  </div>
                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">信用卡使用率警戒 (%):</label>
                    <input type="number" min={10} max={100} value={creditCfg.creditCardUtilizationWarn}
                      onChange={(e) => patchLocal({ creditRedlines: { ...creditCfg, creditCardUtilizationWarn: Number(e.target.value) } })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold" />
                  </div>
                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">网贷/小贷笔数预警:</label>
                    <input type="number" min={1} max={20} value={creditCfg.microLoanCountWarn}
                      onChange={(e) => patchLocal({ creditRedlines: { ...creditCfg, microLoanCountWarn: Number(e.target.value) } })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">公积金月缴加分下限 (元):</label>
                    <input type="number" min={0} step={100} value={creditCfg.providentFundBonusMin}
                      onChange={(e) => patchLocal({ creditRedlines: { ...creditCfg, providentFundBonusMin: Number(e.target.value) } })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold" />
                  </div>
                </div>
              </div>

              {/* 公海规则细化 */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 shadow-2xs">
                <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>公海客户池规则细化（分级回收 / 抢单冷却 / 每日认领上限）</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-slate-600 font-semibold text-xs">按客户等级自动回收天数:</div>
                    {poolCfg.gradeReturnDays.map((g) => (
                      <div key={g.grade} className="flex items-center space-x-2">
                        <span className="w-16 text-xs font-bold text-slate-700">{g.grade} 级客户</span>
                        <select
                          value={g.days}
                          onChange={(e) =>
                            patchLocal({
                              poolRules: {
                                ...poolCfg,
                                gradeReturnDays: poolCfg.gradeReturnDays.map((x) =>
                                  x.grade === g.grade ? { ...x, days: Number(e.target.value) } : x
                                ),
                              },
                            })
                          }
                          className="flex-1 p-1.5 bg-white border border-slate-300 rounded-lg font-bold cursor-pointer"
                        >
                          <option value={3}>3 天</option>
                          <option value={5}>5 天</option>
                          <option value={7}>7 天</option>
                          <option value={10}>10 天</option>
                          <option value={15}>15 天</option>
                          <option value={30}>30 天</option>
                          <option value={60}>60 天</option>
                        </select>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-slate-700 font-semibold block mb-1">抢单/认领冷却 (小时):</label>
                      <input type="number" min={0} max={168} value={poolCfg.claimCooldownHours}
                        onChange={(e) => patchLocal({ poolRules: { ...poolCfg, claimCooldownHours: Number(e.target.value) } })}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold" />
                    </div>
                    <div>
                      <label className="text-slate-700 font-semibold block mb-1">每人每日认领上限 (户):</label>
                      <input type="number" min={1} max={200} value={poolCfg.maxClaimPerDay}
                        onChange={(e) => patchLocal({ poolRules: { ...poolCfg, maxClaimPerDay: Number(e.target.value) } })}
                        className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold" />
                    </div>
                    <p className="text-[11px] text-slate-400">S级保护期与「公海流转与私海上限」标签页联动，保存时自动同步。</p>
                  </div>
                </div>
              </div>

              {/* 账号安全策略 */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 shadow-2xs">
                <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-rose-600" />
                  <span>账号安全策略（密码规则 / 登录锁定 / 会话超时）</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">密码最小长度:</label>
                    <input type="number" min={4} max={32} value={securityCfg.minPasswordLength}
                      onChange={(e) => patchLocal({ securityPolicy: { ...securityCfg, minPasswordLength: Number(e.target.value) } })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold" />
                  </div>
                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">要求字母+数字组合:</label>
                    <select
                      value={securityCfg.requireComplexity ? '1' : '0'}
                      onChange={(e) => patchLocal({ securityPolicy: { ...securityCfg, requireComplexity: e.target.value === '1' } })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold cursor-pointer"
                    >
                      <option value="1">要求（推荐）</option>
                      <option value="0">不要求</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">连续失败锁定次数 (0=不锁定):</label>
                    <input type="number" min={0} max={20} value={securityCfg.maxLoginFailures}
                      onChange={(e) => patchLocal({ securityPolicy: { ...securityCfg, maxLoginFailures: Number(e.target.value) } })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold" />
                  </div>
                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">会话超时 (分钟, 0=不超时):</label>
                    <input type="number" min={0} max={1440} step={10} value={securityCfg.sessionTimeoutMinutes}
                      onChange={(e) => patchLocal({ securityPolicy: { ...securityCfg, sessionTimeoutMinutes: Number(e.target.value) } })}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold" />
                  </div>
                </div>
              </div>

              {/* 费用科目 */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                    <Coins className="w-4 h-4 text-amber-600" />
                    <span>费用科目与费率（财务结算 / 服务费核算）</span>
                  </div>
                </div>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2 font-bold text-slate-600">科目名称</th>
                        <th className="px-3 py-2 font-bold text-slate-600">费率 (%)</th>
                        <th className="px-3 py-2 font-bold text-slate-600 text-center">启用</th>
                        <th className="px-3 py-2 font-bold text-slate-600 text-center">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {feeCats.map((f) => (
                        <tr key={f.id} className="hover:bg-slate-50">
                          <td className="px-3 py-2 font-semibold text-slate-800">{f.name}</td>
                          <td className="px-3 py-2">
                            <input
                              type="number" min={0} step={0.1} value={f.rate}
                              onChange={(e) =>
                                patchLocal({
                                  feeCategories: feeCats.map((x) =>
                                    x.id === f.id ? { ...x, rate: Number(e.target.value) } : x
                                  ),
                                })
                              }
                              className="w-24 p-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                patchLocal({
                                  feeCategories: feeCats.map((x) =>
                                    x.id === f.id ? { ...x, enabled: !x.enabled } : x
                                  ),
                                })
                              }
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border cursor-pointer transition ${
                                f.enabled
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-slate-100 text-slate-400 border-slate-200'
                              }`}
                            >
                              {f.enabled ? '启用中' : '已停用'}
                            </button>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteFeeCategory(f.id)}
                              className="p-1 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-end space-x-2">
                  <div className="flex-1">
                    <label className="text-slate-600 font-semibold block mb-1 text-[11px]">新增科目名称</label>
                    <input type="text" value={newFeeName} onChange={(e) => setNewFeeName(e.target.value)}
                      placeholder="如：加急通道费"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg" />
                  </div>
                  <div className="w-24">
                    <label className="text-slate-600 font-semibold block mb-1 text-[11px]">费率 (%)</label>
                    <input type="number" min={0} step={0.1} value={newFeeRate} onChange={(e) => setNewFeeRate(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold" />
                  </div>
                  <button type="button" onClick={handleAddFeeCategory}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-pointer">
                    <Plus className="w-3.5 h-3.5" />
                    <span>添加</span>
                  </button>
                </div>
                {newFeeError && <div className="text-rose-600 text-[11px] font-semibold">{newFeeError}</div>}
              </div>

              {/* 脱敏规则 */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 shadow-2xs">
                <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                  <Eye className="w-4 h-4 text-indigo-600" />
                  <span>敏感信息脱敏规则（按字段控制掩码开关）</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {maskingCfg.map((m) => (
                    <div key={m.field} className="p-2.5 rounded-lg border border-slate-200 flex flex-col items-center space-y-1.5">
                      <span className="text-xs font-bold text-slate-700">
                        {{ phone: '手机号', idCard: '身份证号', address: '住址', bankCard: '银行卡', company: '单位名称' }[m.field] || m.field}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          patchLocal({
                            maskingRules: maskingCfg.map((x) =>
                              x.field === m.field ? { ...x, enabled: !x.enabled } : x
                            ),
                          })
                        }
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold border cursor-pointer transition ${
                          m.enabled
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-400 border-slate-200'
                        }`}
                      >
                        {m.enabled ? '掩码开启' : '明文显示'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 数据字典 */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 shadow-2xs">
                <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                  <FileCheck2 className="w-4 h-4 text-cyan-600" />
                  <span>业务数据字典（跟进阶段 / 资金用途，逗号分隔维护）</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">跟进阶段字典:</label>
                    <input
                      type="text"
                      value={(dictCfg.followUpStages || []).join(',')}
                      onChange={(e) =>
                        patchLocal({
                          dictionaries: { ...dictCfg, followUpStages: e.target.value.split(/[,，]/).map((s) => s.trim()).filter(Boolean) },
                        })
                      }
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                      placeholder="初步沟通,需求挖掘,方案报价,面签核验,进件提交,审批跟进,放款落地,贷后维护"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">意向标签字典:</label>
                    <input
                      type="text"
                      value={(dictCfg.intentTags || []).join(',')}
                      onChange={(e) =>
                        patchLocal({
                          dictionaries: { ...dictCfg, intentTags: e.target.value.split(/[,，]/).map((s) => s.trim()).filter(Boolean) },
                        })
                      }
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                      placeholder="high_intent,need_callback,no_need,invalid_number"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-semibold block mb-1">资金用途字典:</label>
                    <input
                      type="text"
                      value={(dictCfg.loanPurposes || []).join(',')}
                      onChange={(e) =>
                        patchLocal({
                          dictionaries: { ...dictCfg, loanPurposes: e.target.value.split(/[,，]/).map((s) => s.trim()).filter(Boolean) },
                        })
                      }
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                      placeholder="business_flow,equipment_purchase,home_renovation,debt_consolidation,personal_consumption"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: 部门管理 */}
          {activeTab === 'departments' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                    <Building className="w-4 h-4 text-blue-600" />
                    <span>组织架构与部门管理</span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    维护公司部门清单，员工账号的新增/编辑可从部门列表中选择归属
                  </p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-bold text-slate-600">部门名称</th>
                      <th className="px-4 py-3 font-bold text-slate-600">负责人</th>
                      <th className="px-4 py-3 font-bold text-slate-600 text-center">员工数</th>
                      <th className="px-4 py-3 font-bold text-slate-600 text-center">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {deptList.length === 0 && (
                      <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">暂无部门，请先添加</td></tr>
                    )}
                    {deptList.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3 font-semibold text-slate-800">{d.name}</td>
                        <td className="px-4 py-3 text-slate-600">{d.headName || '—'}</td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-slate-700">
                          {localUsers.filter((u) => u.department === d.name).length}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteDepartment(d.id)}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"
                            title="删除部门"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                <div className="font-bold text-slate-900 text-sm">新增部门</div>
                <div className="flex items-end space-x-2">
                  <div className="flex-1">
                    <label className="text-slate-600 font-semibold block mb-1 text-[11px]">部门名称</label>
                    <input
                      type="text"
                      value={newDeptName}
                      onChange={(e) => setNewDeptName(e.target.value)}
                      placeholder="如：销售三部 / 电销一组"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddDepartment}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>添加部门</span>
                  </button>
                </div>
                {newDeptError && <div className="text-rose-600 text-[11px] font-semibold">{newDeptError}</div>}
              </div>
            </div>
          )}

          {/* Tab: 黑名单管理 */}
          {activeTab === 'blacklist' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                    <Ban className="w-4 h-4 text-rose-600" />
                    <span>客户黑名单管理（录入进件时自动拦截提醒）</span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    命中黑名单手机号或身份证的客户在建档、进件时将收到风控拦截提示
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                <div className="font-bold text-slate-900 text-sm">添加黑名单</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input type="text" value={newBlackPhone} onChange={(e) => setNewBlackPhone(e.target.value)}
                    placeholder="手机号（11位）"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg" />
                  <input type="text" value={newBlackIdCard} onChange={(e) => setNewBlackIdCard(e.target.value)}
                    placeholder="身份证号（18位）"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg" />
                  <input type="text" value={newBlackReason} onChange={(e) => setNewBlackReason(e.target.value)}
                    placeholder="拉黑原因（如：欺诈/拒贷/骚扰）"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg" />
                </div>
                <div className="flex items-center space-x-3">
                  <button type="button" onClick={handleAddBlacklist}
                    className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-pointer">
                    <Ban className="w-3.5 h-3.5" />
                    <span>加入黑名单</span>
                  </button>
                  {newBlackError && <div className="text-rose-600 text-[11px] font-semibold">{newBlackError}</div>}
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-bold text-slate-600">手机号</th>
                      <th className="px-4 py-3 font-bold text-slate-600">身份证号</th>
                      <th className="px-4 py-3 font-bold text-slate-600">拉黑原因</th>
                      <th className="px-4 py-3 font-bold text-slate-600">操作人</th>
                      <th className="px-4 py-3 font-bold text-slate-600">日期</th>
                      <th className="px-4 py-3 font-bold text-slate-600 text-center">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {blackList.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">黑名单为空</td></tr>
                    )}
                    {blackList.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3 font-mono font-bold text-slate-800">{b.phone || '—'}</td>
                        <td className="px-4 py-3 font-mono text-slate-600">{b.idCard ? `${b.idCard.slice(0, 6)}********${b.idCard.slice(-4)}` : '—'}</td>
                        <td className="px-4 py-3 text-rose-600 font-semibold">{b.reason}</td>
                        <td className="px-4 py-3 text-slate-600">{b.addedBy}</td>
                        <td className="px-4 py-3 text-slate-500">{b.addedAt}</td>
                        <td className="px-4 py-3 text-center">
                          <button type="button" onClick={() => handleDeleteBlacklist(b.id)}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded cursor-pointer" title="移出黑名单">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 常用话术模板与异议库管理 */}
          {activeTab === 'templates' && (
            <div className="space-y-4">
              {/* Top Banner */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                      <span>跟进话术模板与客户异议库总控</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                        实时同步跟进选择器
                      </span>
                    </div>
                    <p className="text-slate-500 leading-relaxed text-xs mt-1">
                      统一沉淀销售顾问高转化跟进话术、异议破冰策略与面签话术，支持插入动态变量标签并自动同步至全员客户跟进弹窗。
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleRestoreDefaultTemplates}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer flex items-center space-x-1"
                      title="重置为出厂预设的8条标准化话术"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>恢复预设</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTemplateId(null);
                        setTemplateForm({ id: '', title: '', category: 'objection', content: '' });
                        setTemplateError(null);
                        setShowAddTemplate(true);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition flex items-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>新建话术模板</span>
                    </button>
                  </div>
                </div>

                {/* Category Filters */}
                <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100">
                  {[
                    { id: 'all', label: '全部话术' },
                    { id: 'objection', label: '🚨 客户异议/抗拒' },
                    { id: 'phone', label: '📞 电话沟通' },
                    { id: 'materials', label: '📋 资料催收' },
                    { id: 'appointment', label: '🤝 线下邀约面签' },
                    { id: 'general', label: '🌿 日常关怀' },
                  ].map((cat) => {
                    const count = cat.id === 'all'
                      ? (localConfig.followUpTemplates || []).length
                      : (localConfig.followUpTemplates || []).filter((t) => t.category === cat.id).length;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setTemplateFilter(cat.id as any)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center space-x-1 ${
                          templateFilter === cat.id
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <span>{cat.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          templateFilter === cat.id ? 'bg-white/20 text-white' : 'bg-white text-slate-500'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Add / Edit Form Modal or Inline Card */}
              {showAddTemplate && (
                <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 shadow-sm space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                    <span className="text-xs font-bold text-blue-900 flex items-center space-x-1.5">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>{editingTemplateId ? '编辑跟进话术模板' : '新增跟进话术模板'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddTemplate(false);
                        setEditingTemplateId(null);
                        setTemplateError(null);
                      }}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {templateError && (
                    <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-600 font-semibold flex items-center space-x-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{templateError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        话术标题 / 异议主题 <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={templateForm.title}
                        onChange={(e) => setTemplateForm({ ...templateForm, title: e.target.value })}
                        placeholder="例如：客户嫌利息偏高异议破冰话术..."
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        话术分类 <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={templateForm.category}
                        onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value as any })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      >
                        <option value="objection">🚨 客户异议/抗拒</option>
                        <option value="phone">📞 电话沟通</option>
                        <option value="materials">📋 资料催收</option>
                        <option value="appointment">🤝 线下邀约面签</option>
                        <option value="general">🌿 日常关怀</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-700">
                        话术详细内容模板 <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex items-center space-x-1 text-[10px] text-slate-500">
                        <span>点击插入动态变量:</span>
                        {['{客户姓名}', '{融资金额}', '{银行名称}', '{贷款利率}', '{经办顾问}'].map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => setTemplateForm((prev) => ({ ...prev, content: prev.content + tag }))}
                            className="px-1.5 py-0.5 bg-white border border-slate-200 hover:border-blue-300 text-blue-600 rounded font-mono cursor-pointer"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea
                      rows={4}
                      value={templateForm.content}
                      onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
                      placeholder="输入话术正文，支持换行与占位变量..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddTemplate(false);
                        setEditingTemplateId(null);
                        setTemplateError(null);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveTemplateForm}
                      className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition flex items-center space-x-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>保存话术模板</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Template Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {((localConfig.followUpTemplates || INITIAL_SYSTEM_CONFIG.followUpTemplates || []).filter(
                  (t) => templateFilter === 'all' || t.category === templateFilter
                )).map((tpl) => {
                  const getCategoryLabel = (cat: string) => {
                    switch (cat) {
                      case 'objection':
                        return { label: '客户异议', color: 'bg-rose-50 text-rose-700 border-rose-200' };
                      case 'phone':
                        return { label: '电话沟通', color: 'bg-blue-50 text-blue-700 border-blue-200' };
                      case 'materials':
                        return { label: '资料催收', color: 'bg-amber-50 text-amber-700 border-amber-200' };
                      case 'appointment':
                        return { label: '邀约面签', color: 'bg-purple-50 text-purple-700 border-purple-200' };
                      case 'general':
                      default:
                        return { label: '日常关怀', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
                    }
                  };
                  const badge = getCategoryLabel(tpl.category);

                  return (
                    <div
                      key={tpl.id}
                      className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-200 hover:shadow-2xs transition flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${badge.color}`}>
                            {badge.label}
                          </span>
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(tpl.content);
                                alert(`已复制话术模板「${tpl.title}」至剪贴板`);
                              }}
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                              title="复制话术文本"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTemplateId(tpl.id);
                                setTemplateForm({
                                  id: tpl.id,
                                  title: tpl.title,
                                  category: tpl.category,
                                  content: tpl.content,
                                });
                                setTemplateError(null);
                                setShowAddTemplate(true);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded cursor-pointer"
                              title="编辑话术"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTemplate(tpl.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                              title="删除话术"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 leading-snug">{tpl.title}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/80 p-2.5 rounded-lg border border-slate-100 font-mono whitespace-pre-wrap">
                          {tpl.content}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 text-xs font-medium transition cursor-pointer"
            >
              关闭窗口
            </button>
            <span className="hidden sm:flex items-center space-x-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              变更需保存后生效 · 操作将记录至审计日志
            </span>
          </div>
          <button
            onClick={handleSaveAll}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>保存全局配置与权限变更</span>
          </button>
        </div>
      </div>

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">确认删除员工账号？</h3>
                <p className="text-xs text-rose-600 font-semibold">此操作将移除该账号且不可恢复</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div>员工姓名: <strong className="text-slate-900">{userToDelete.name}</strong> ({userToDelete.username})</div>
              <div>所属岗位: <span className="text-blue-700 font-semibold">{userToDelete.roleTitle}</span> · {userToDelete.department}</div>
              <div>名下关联客户: <span className="text-rose-600 font-bold font-mono">{ownedCustomersCount}</span> 位</div>
            </div>

            {ownedCustomersCount > 0 && (
              <div className="space-y-2 text-xs">
                <label className="font-semibold text-slate-800 block">
                  名下存量客户与进件处理方案:
                </label>
                <div className="space-y-2">
                  <label className="flex items-start space-x-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name="reassignOption"
                      checked={reassignOption === 'pool'}
                      onChange={() => setReassignOption('pool')}
                      className="mt-0.5 text-blue-600"
                    />
                    <div>
                      <span className="font-bold text-slate-800">全部自动回收至【公海客户池】(推荐)</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">清空原归死人，交由全司顾问重新抢单认领</p>
                    </div>
                  </label>

                  <label className="flex items-start space-x-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name="reassignOption"
                      checked={reassignOption === 'user'}
                      onChange={() => setReassignOption('user')}
                      className="mt-0.5 text-blue-600"
                    />
                    <div className="flex-1">
                      <span className="font-bold text-slate-800">直接批量调配转移给指定顾问</span>
                      {reassignOption === 'user' && (
                        <select
                          value={targetConsultantId}
                          onChange={(e) => setTargetConsultantId(e.target.value)}
                          className="w-full mt-2 p-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 font-semibold focus:border-blue-500 focus:outline-none"
                        >
                          {otherConsultants.map((oc) => (
                            <option key={oc.id} value={oc.id}>
                              {oc.name} ({oc.department})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>确认彻底删除</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal（正式版安全：重置后用户下次登录强制改密） */}
      {resetPwdTarget && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleResetPasswordSubmit}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <Lock className="w-4 h-4 text-blue-600" />
                <span>重置员工登录密码</span>
              </div>
              <button type="button" onClick={() => setResetPwdTarget(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              为员工 <strong className="text-slate-800">{resetPwdTarget.name}</strong>（{resetPwdTarget.username}）设置新的登录密码。设置后该员工下次登录时将被强制要求修改密码，请通过安全渠道告知员工。
            </p>
            {resetPwdError && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{resetPwdError}</span>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">新登录密码（至少 8 位，含字母与数字）</label>
              <input
                type="text"
                value={resetPwdValue}
                onChange={(e) => setResetPwdValue(e.target.value)}
                placeholder="例如: Abc123456"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-end space-x-3 pt-1">
              <button type="button" onClick={() => setResetPwdTarget(null)} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer">
                取消
              </button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer">
                确认重置密码
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add New User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleAddNewUserSubmit} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2 text-slate-900">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold">创建新员工账号</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {addError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs">
                {addError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">登录工号 / 用户名:</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="例如: consultant3"
                  required
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">初始登录密码:</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="默认 123456"
                  required
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">真实姓名:</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="例如: 孙晓丽"
                  required
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">联系电话:</label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="手机号"
                  required
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">所属部门:</label>
                <select
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                >
                  {deptList.length > 0 ? (
                    deptList.map((d) => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))
                  ) : (
                    <>
                      <option value="助贷业务一部">助贷业务一部</option>
                      <option value="助贷业务二部">助贷业务二部</option>
                      <option value="风控评审部">风控评审部</option>
                      <option value="运营管理中心">运营管理中心</option>
                      <option value="财务结算部">财务结算部</option>
                    </>
                  )}
                </select>
                {deptList.length === 0 && (
                  <p className="text-[11px] text-slate-400 mt-1">未配置部门清单，可在「部门管理」标签页维护</p>
                )}
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">月度业绩目标 (万元):</label>
                <input
                  type="number"
                  value={newMonthlyTarget}
                  onChange={(e) => setNewMonthlyTarget(Number(e.target.value))}
                  placeholder="例如 150"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">岗位角色与权限:</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold text-blue-600 focus:bg-white focus:border-blue-500 focus:outline-none"
              >
                <option value="consultant">业务顾问 (个人名下私海)</option>
                <option value="risk_manager">团队主管 / 风控专员</option>
                <option value="finance_admin">财务结算专员</option>
                <option value="admin">系统管理员</option>
                {isSuperAdmin && <option value="super_admin">超级管理员</option>}
              </select>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition flex items-center space-x-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>立即创建并生效</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 超级管理员专属：系统数据管理 */}
      {activeTab === 'system' && isSuperAdmin && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-4 shadow-2xs">
            <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Database className="w-4 h-4 text-blue-600" />
              <span>系统数据规模总览</span>
            </div>
            <p className="text-slate-500 leading-relaxed text-xs">
              实时统计当前系统内各业务实体的数据规模与本地存储占用（数据持久化于浏览器 localStorage，前缀 yanxun_crm_v3）。
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
              {[
                { label: '员工账号', value: localUsers.length, color: 'bg-blue-50 text-blue-700 border-blue-200' },
                { label: '客户档案', value: customers.length, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                { label: '进件工单', value: loanCases.length, color: 'bg-amber-50 text-amber-700 border-amber-200' },
                { label: '在途进件', value: loanCases.filter((c) => c.stage !== 'disbursement' && c.stage !== 'post_loan').length, color: 'bg-purple-50 text-purple-700 border-purple-200' },
                { label: '停用账号', value: localUsers.filter((u) => u.status === 'disabled').length, color: 'bg-rose-50 text-rose-700 border-rose-200' },
              ].map((item) => (
                <div key={item.label} className={`rounded-xl border p-3 text-center ${item.color}`}>
                  <div className="text-xl font-black font-mono">{item.value}</div>
                  <div className="text-[11px] font-semibold mt-0.5 opacity-80">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 shadow-2xs">
            <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <HardDrive className="w-4 h-4 text-emerald-600" />
              <span>本地存储占用</span>
            </div>
            <p className="text-slate-500 leading-relaxed text-xs">
              浏览器 localStorage 当前占用：
              <strong className="text-slate-800 font-mono">
                {(JSON.stringify(localStorage).length / 1024).toFixed(1)} KB
              </strong>
              （含全部客户、进件、员工与配置数据）。
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 shadow-2xs">
            <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Download className="w-4 h-4 text-blue-600" />
              <span>数据导出备份</span>
            </div>
            <p className="text-slate-500 leading-relaxed text-xs">
              导出当前全部业务数据为 JSON 备份文件（含员工账号、客户档案、进件工单与系统配置），可用于本地归档或迁移。
            </p>
            <button
              type="button"
              onClick={() => {
                const payload = {
                  exportedAt: new Date().toISOString(),
                  version: 'yanxun_crm_v3',
                  users: localUsers,
                  customers,
                  loanCases,
                  callRecords,
                  systemConfig: localConfig,
                };
                const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `crm-backup-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
                pushAuditLog('导出全量数据备份', `数据规模: ${customers.length} 客户 / ${loanCases.length} 进件 / ${localUsers.length} 员工`, 'data_export');
              }}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>导出全量数据 (JSON)</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 shadow-2xs">
            <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <Upload className="w-4 h-4 text-blue-600" />
              <span>数据恢复导入</span>
            </div>
            <p className="text-slate-500 leading-relaxed text-xs">
              从之前导出的 JSON 备份文件恢复全部业务数据（员工/客户/进件/外呼/配置），用于数据迁移或灾难恢复。恢复会覆盖当前数据，请谨慎操作。
            </p>
            {restoreMsg && (
              <div className={`p-2.5 rounded-lg border text-xs ${restoreMsg.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                {restoreMsg.text}
              </div>
            )}
            <input ref={fileInputRef} type="file" accept=".json,application/json" className="hidden" onChange={handleRestoreFile} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>选择备份文件并恢复</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-white border border-rose-200 space-y-3 shadow-2xs">
            <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 text-rose-600" />
              <span>清空业务数据（危险操作）</span>
            </div>
            <p className="text-slate-500 leading-relaxed text-xs">
              清空全部业务数据（客户/进件/外呼/员工账号）回到出厂状态，仅保留银行产品库与系统配置。此操作不可撤销，建议先导出备份。
            </p>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('确认清空全部业务数据？此操作将删除当前所有客户、进件、外呼记录与员工账号（产品库与系统配置保留），且不可恢复。建议先导出备份。')) {
                  onResetData?.();
                  pushAuditLog('清空系统业务数据', '全部业务数据已清空至出厂状态（保留产品库与配置）', 'data_export');
                }
              }}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>清空业务数据</span>
            </button>
          </div>
        </div>
      )}

      {/* 一键员工离职交接与业务划拨弹窗 */}
      <EmployeeHandoverModal
        isOpen={isHandoverModalOpen}
        onClose={() => {
          setIsHandoverModalOpen(false);
          setHandoverInitialUserId(undefined);
        }}
        users={localUsers}
        currentUser={currentUser}
        customers={customers}
        loanCases={loanCases}
        initialUserId={handoverInitialUserId}
        onExecuteHandover={handleExecuteHandoverFromModal}
      />
    </div>
  );
};
