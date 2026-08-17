import React, { useState, useEffect, useRef } from 'react';
import { AuthPage } from './components/auth/AuthPage';
import { Navbar } from './components/Navbar';
import { Workbench } from './components/dashboard/Workbench';
import { CustomerManagement } from './components/crm/CustomerManagement';
import { LoanPipeline } from './components/pipeline/LoanPipeline';
import { ProductCatalog } from './components/products/ProductCatalog';
import { FinancialSettlement } from './components/finance/FinancialSettlement';
import { AutoAssessmentCard } from './components/assessment/AutoAssessmentCard';
import { PostLoanManagement } from './components/postloan/PostLoanManagement';
import { CustomerIntakeWizard } from './components/wizard/CustomerIntakeWizard';
import { CustomerDetailModal } from './components/crm/CustomerDetailModal';
import { LoanToolsModal } from './components/tools/LoanToolsModal';
import { SharePosterModal } from './components/common/SharePosterModal';
import { VirtualCallModal } from './components/common/VirtualCallModal';
import { ForceChangePasswordModal } from './components/common/ForceChangePasswordModal';
import { hashPassword } from './utils/passwordSecurity';
import { computeSuperAdminReset, migrateUsersPasswords, verifyUserPassword } from './utils/accountReset';
import { getStoragePrefix } from './utils/usePersistentState';
import { SystemSettingsModal } from './components/settings/SystemSettingsModal';
import { Customer, LoanCase, UserAccount, SystemConfig, FollowUpRecord, IntentTag, DealStage, CallRecord, PostLoanAccount } from './types';
import { INTENT_TAG_CONFIGS } from './utils/intentAutomation';
import { INITIAL_CUSTOMERS, INITIAL_LOAN_CASES, INITIAL_USERS, INITIAL_SYSTEM_CONFIG, INITIAL_CALL_RECORDS, INITIAL_PRODUCTS } from './data/mockData';
import { INITIAL_POST_LOAN_ACCOUNTS } from './data/postLoanMockData';
import { usePersistentState } from './utils/usePersistentState';
import { isConsultant as isConsultantRole, isFinanceAdmin as isFinanceRole } from './utils/permissions';
import { calculateConsultantCommission } from './utils/calculator';
import { LayoutDashboard, Users, GitPullRequestDraft, Zap, Coins, PackageSearch, ShieldCheck } from 'lucide-react';

export default function App() {
  // Authentication State
  const [users, setUsers] = usePersistentState<UserAccount[]>('users', INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  // 首次登录强制修改默认密码（正式版安全策略）
  const [forceChangePwdUser, setForceChangePwdUser] = useState<UserAccount | null>(null);

  // System Configuration State
  const [systemConfig, setSystemConfig] = usePersistentState<SystemConfig>('system_config', INITIAL_SYSTEM_CONFIG);
  const [isSystemSettingsOpen, setIsSystemSettingsOpen] = useState(false);

  // Navigation & View State
  const [currentNav, setCurrentNav] = useState('workbench');
  const [isMasked, setIsMasked] = useState(true);
  // 页面切换时主内容区滚动复位（保证进入每个模块都从顶部开始）
  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [currentNav]);
  // 公海定向筛选：从工作台预警卡跳转时携带，CustomerManagement 一次性消费
  const [pendingPoolFilter, setPendingPoolFilter] = useState<string | null>(null);

  // Business Data State（持久化：刷新后客户/进件不再丢失）
  const [customers, setCustomers] = usePersistentState<Customer[]>('customers', INITIAL_CUSTOMERS);
  const [loanCases, setLoanCases] = usePersistentState<LoanCase[]>('loan_cases', INITIAL_LOAN_CASES);
  // 贷后客户管理系统专属在贷主档案与资产台账（持久化）
  const [postLoanAccounts, setPostLoanAccounts] = usePersistentState<PostLoanAccount[]>('post_loan_accounts', INITIAL_POST_LOAN_ACCOUNTS);
  // 外呼记录（电销产能统计与回拨管理的唯一数据源，持久化）
  const [callRecords, setCallRecords] = usePersistentState<CallRecord[]>('call_records', INITIAL_CALL_RECORDS);

  // 产品库删减：管理员在「产品库」页面删减产品后，全系统匹配/展示同步移除（持久化）
  const [removedProductIds, setRemovedProductIds] = usePersistentState<string[]>('removed_products', []);
  const effectiveProducts = INITIAL_PRODUCTS.filter((p) => !removedProductIds.includes(p.id));

  // Modals
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [selectedCustomerForDetail, setSelectedCustomerForDetail] = useState<Customer | null>(null);
  const [selectedCustomerForCall, setSelectedCustomerForCall] = useState<Customer | null>(null);
  const [selectedCustomerForPoster, setSelectedCustomerForPoster] = useState<Customer | null>(null);

  // 业务数据与账号安全同步：仅当系统内不存在任何超管账号时（被误删/降级）补建默认超管；
  // 已有超管则绝不覆盖其账号密码，避免管理员改密后刷新被强制重置。
  useEffect(() => {
    setUsers((prev) => {
      if (prev.some((u) => u.role === 'super_admin')) return prev;
      const fallback = INITIAL_USERS.find((u) => u.role === 'super_admin');
      return fallback ? [fallback, ...prev] : prev;
    });

    setSystemConfig((prev) => {
      if (!prev.followUpTemplates || prev.followUpTemplates.length === 0) {
        return {
          ...prev,
          followUpTemplates: INITIAL_SYSTEM_CONFIG.followUpTemplates,
        };
      }
      return prev;
    });
  }, []);

  // 超级管理员凭据安全初始化（一次性）：
  // 1) 将遗留明文密码统一迁移为 PBKDF2+盐值哈希（明文清除，绝不落库）；
  // 2) 按安全规范将超管账号重置为 himax / a1988624（哈希存储、可正常登录）；
  // 3) 写入 localStorage 标记，确保仅执行一次，不覆盖管理员后续自主改密。
  useEffect(() => {
    const marker = 'yanxun_crm_v5_superadmin_reset_done';
    if (localStorage.getItem(marker)) return;
    (async () => {
      try {
        const prefix = getStoragePrefix();
        const raw = localStorage.getItem(prefix + 'users');
        const baseUsers: UserAccount[] = raw ? JSON.parse(raw) : users;
        const migrated = await migrateUsersPasswords(baseUsers);
        const { nextUsers, result } = await computeSuperAdminReset(migrated, {
          username: 'himax',
          newPassword: 'a1988624',
          executorRole: 'super_admin',
          requireChangePassword: false,
        });
        setUsers(nextUsers);
        if (result.ok) {
          localStorage.setItem(marker, '1');
        }
      } catch {
        // 初始化失败不影响正常登录，降级沿用现有账号数据
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 公海自动回收：lastContactDate 距今超过配置天数且未在公海的客户，自动回收至公共公海池
  useEffect(() => {
    const runAutoReturn = () => {
      setCustomers((prev) => {
        // 分级回收天数：优先取「参数与策略总控」中按客户等级配置的天数，缺省回退全局天数
        const gradeDaysMap: Record<string, number> = {};
        (systemConfig.poolRules?.gradeReturnDays || []).forEach((g) => {
          gradeDaysMap[g.grade] = g.days;
        });
        const now = new Date();
        const next = prev.map((c) => {
          if (c.status === 'in_pool') return c;
          // '刚刚' 表示当日已跟进，不算超期
          if (c.lastContactDate === '刚刚') return c;
          if (!c.lastContactDate) return c;
          const lastDate = new Date(c.lastContactDate.replace(' ', 'T'));
          if (isNaN(lastDate.getTime())) return c;
          const maxDays = gradeDaysMap[c.grade] ?? systemConfig.publicPoolAutoReturnDays ?? 15;
          const elapsedDays = Math.floor((now.getTime() - lastDate.getTime()) / 86400000);
          if (elapsedDays > maxDays) {
            return {
              ...c,
              status: 'in_pool' as const,
              ownerName: '公共公海池',
              ownerId: undefined,
              poolReturnCountdownDays: 0,
              followUps: [
                {
                  id: `f-auto-${Date.now()}-${c.id}`,
                  date: now.toLocaleString('zh-CN', { hour12: false }),
                  type: 'system' as const,
                  operator: '系统自动回收',
                  content: `【公海自动回收】客户（${c.grade}级）超过 ${maxDays} 天未有效跟进（上次跟进 ${c.lastContactDate}），已按公海流转规则自动释放回收至公共公海池。`,
                },
                ...(c.followUps || []),
              ],
            };
          }
          return c;
        });
        return next;
      });
    };

    // 启动时执行一次 + 每 60 秒巡检
    runAutoReturn();
    const timer = setInterval(runAutoReturn, 60000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [systemConfig.publicPoolAutoReturnDays, systemConfig.poolRules?.gradeReturnDays]);

  // Handlers
  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    // 正式版安全策略：默认密码账号首次登录必须强制改密
    if (user.mustChangePassword) {
      setForceChangePwdUser(user);
    }
  };

  const handleUpdatePassword = async (userId: string, newPassword: string) => {
    const passwordHash = await hashPassword(newPassword);
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, passwordHash, password: undefined, mustChangePassword: false }
          : u
      )
    );
    setCurrentUser((prev) =>
      prev && prev.id === userId
        ? { ...prev, passwordHash, password: undefined, mustChangePassword: false }
        : prev
    );
    setForceChangePwdUser(null);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // ===== 会话超时自动登出（总控后台「参数与策略总控」可配置，0=不超时）=====
  useEffect(() => {
    if (!currentUser) return;
    const timeoutMinutes = systemConfig.securityPolicy?.sessionTimeoutMinutes ?? 0;
    if (!timeoutMinutes || timeoutMinutes <= 0) return;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    const resetTimer = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        window.alert(`⏰ 已连续操作 ${timeoutMinutes} 分钟无活动，出于安全策略已自动退出登录。`);
        setCurrentUser(null);
      }, timeoutMinutes * 60 * 1000);
    };
    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'] as const;
    activityEvents.forEach((evt) => window.addEventListener(evt, resetTimer, { passive: true }));
    resetTimer();
    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      activityEvents.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, systemConfig.securityPolicy?.sessionTimeoutMinutes]);

  // 统一新建客户/进件入口：财务结算角色为只读，不提供业务新建操作
  const handleOpenWizard = () => {
    if (currentUser && isFinanceRole(currentUser.role)) return;
    setIsWizardOpen(true);
  };

  const handleSaveNewCustomer = (newCustomer: Customer) => {
    const assignedCustomer: Customer = {
      ...newCustomer,
      ownerName: currentUser ? currentUser.name : newCustomer.ownerName,
      ownerId: currentUser ? currentUser.id : newCustomer.ownerId,
    };
    setCustomers((prev) => [assignedCustomer, ...prev]);
    setIsWizardOpen(false);
  };

  const handleAddFollowUp = (customerId: string, record: FollowUpRecord) => {
    // 财务结算角色只读：不可添加业务跟进记录
    if (currentUser && isFinanceRole(currentUser.role)) return;
    let intentUpdates: Partial<Customer> = {};
    if (record.intentTag && INTENT_TAG_CONFIGS[record.intentTag]) {
      const tagConfig = INTENT_TAG_CONFIGS[record.intentTag];
      intentUpdates = {
        grade: tagConfig.targetGrade,
        urgency: tagConfig.suggestedUrgency,
        intentTag: record.intentTag,
        nextContactDate: record.nextFollowUpDate || tagConfig.suggestedNextTime,
        poolReturnCountdownDays: tagConfig.poolDaysBonus || systemConfig.publicPoolAutoReturnDays,
      };
    }

    setCustomers((prev) =>
      prev.map((c) =>
        c.id === customerId
          ? {
              ...c,
              poolReturnCountdownDays: intentUpdates.poolReturnCountdownDays ?? systemConfig.publicPoolAutoReturnDays,
              lastContactDate: '刚刚',
              ...intentUpdates,
              followUps: [record, ...c.followUps],
            }
          : c
      )
    );

    if (selectedCustomerForDetail && selectedCustomerForDetail.id === customerId) {
      setSelectedCustomerForDetail((prev) =>
        prev
          ? {
              ...prev,
              poolReturnCountdownDays: intentUpdates.poolReturnCountdownDays ?? systemConfig.publicPoolAutoReturnDays,
              lastContactDate: '刚刚',
              ...intentUpdates,
              followUps: [record, ...prev.followUps],
            }
          : null
      );
    }
  };

  // 记录外呼结果（电销产能统计 + 自动生成回拨计划）
  const handleRecordCall = (record: CallRecord) => {
    setCallRecords((prev) => [record, ...prev]);
  };

  // 完成回拨：将计划中的回拨标记为已完成
  const handleCompleteCallback = (callRecordId: string) => {
    setCallRecords((prev) =>
      prev.map((r) =>
        r.id === callRecordId ? { ...r, callbackCompleted: true } : r
      )
    );
  };

  // 进件阶段联动客户生命周期：放款 → 客户状态 disbursed；贷后结清 → closed；其他推进 → deal_in_progress
  const handleCaseStageChanged = (deal: LoanCase, nextStage: DealStage) => {
    const customerId = deal.customerId;
    if (!customerId) return;
    const nowStr = new Date().toLocaleString('zh-CN', { hour12: false });
    let status: 'active' | 'deal_in_progress' | 'in_pool' | 'disbursed' | 'closed' | undefined;
    let note = '';

    if (nextStage === 'disbursement') {
      status = 'disbursed';
      note = `【放款完成】进件工单 [${deal.caseNumber}] 已推进至放款结算，客户进入已放款状态，等待服务费结算。`;
    } else if (nextStage === 'post_loan') {
      status = 'closed';
      note = `【贷后结清】进件工单 [${deal.caseNumber}] 完成贷后管理，客户档案结案归档。`;
    } else {
      status = 'deal_in_progress';
    }

    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id !== customerId) return c;
        const followUps = [
          {
            id: `f-stage-${Date.now()}-${c.id}`,
            date: nowStr,
            type: 'system' as const,
            operator: currentUser ? currentUser.name : '系统',
            content: note || `【进件推进】关联工单 [${deal.caseNumber}] 推进至 ${nextStage} 阶段。`,
          },
          ...(c.followUps || []),
        ];
        return {
          ...c,
          status: status || c.status,
          followUps,
          lastContactDate: '刚刚',
        };
      })
    );
  };

  const handleStartApplyLoan = (customer: Customer) => {
    // 财务结算角色只读：不可发起银行报审进件
    if (currentUser && isFinanceRole(currentUser.role)) return;
    const operatorName = currentUser ? currentUser.name : '李晓明';
    const nowStr = new Date().toLocaleString('zh-CN', { hour12: false });
    const matched = customer.matchedProducts?.[0];
    // 从利率区间解析基准利率（取区间下限作为批复苏利率展示值）
    const parsedRate = matched?.interestRateRange
      ? parseFloat(matched.interestRateRange.replace('%', '').split('-')[0]?.trim() || '3.45')
      : 3.45;
    const baseAmount = customer.requestedAmount || matched?.minAmount || 150;

    // 费率从系统配置动态计算（总控「费用科目」+「阶梯提成」联动，不再硬编码）
    const feeCategories = systemConfig.feeCategories ?? [];
    const serviceFeeRate =
      feeCategories.find((f) => f.enabled && f.id === 'fee-service')?.rate ??
      feeCategories.find((f) => f.enabled && f.name === '贷款服务费')?.rate ??
      2.5;
    const depositRate =
      feeCategories.find((f) => f.enabled && f.id === 'fee-deposit')?.rate ??
      feeCategories.find((f) => f.enabled && f.name === '定金（进件诚意金）')?.rate ??
      0.5;
    const serviceFeeTotalYuan = Math.round(baseAmount * 10000 * (serviceFeeRate / 100));
    const depositPaidYuan = Math.round(baseAmount * 10000 * (depositRate / 100));
    const commCalc = calculateConsultantCommission(
      serviceFeeTotalYuan,
      baseAmount,
      systemConfig.commissionTiers?.length ? systemConfig.commissionTiers : undefined
    );

    const newCase: LoanCase = {
      id: `LC-${Date.now().toString().slice(-6)}`,
      caseNumber: `CASE-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      productId: matched?.id || 'prod-001',
      productName: matched?.productName || '工行·房抵E抵快贷',
      productCategory: matched?.category || '房抵贷',
      lenderBank: matched?.bankName || '中国工商银行',
      lenderInstitution: matched?.bankName || '中国工商银行',
      lenderBranch: '高新科技支行',
      lenderManagerName: '王经理',
      lenderManagerPhone: '138-0000-1122',
      applyAmount: baseAmount,
      appliedAmount: baseAmount,
      approvedAmount: baseAmount,
      interestRate: parsedRate,
      termMonths: (customer.requestedTermYears || 3) * 12,
      repaymentType: matched?.repaymentType || 'interest_first',
      stage: 'pre_screen',
      subStageStatus: '资质初审通过，已完成风控初评',
      serviceFeeRate,
      serviceFeeTotal: serviceFeeTotalYuan,
      serviceFeeDepositPaid: depositPaidYuan,
      serviceFeeBalancePaid: 0,
      isFeeSettled: false,
      commissionRate: commCalc.rate,
      commissionAmount: commCalc.commissionAmount,
      consultantName: operatorName,
      consultantId: currentUser ? currentUser.id : 'usr-consultant-1',
      submittedAt: nowStr,
      documents: [
        { name: `${customer.name}_身份证正反面 (已加密).jpg`, type: 'id_card', url: '#', isMasked: true, uploadedAt: nowStr.split(' ')[0] },
        { name: `${customer.name}_人行征信简版.pdf`, type: 'credit_report', url: '#', isMasked: true, uploadedAt: nowStr.split(' ')[0] },
      ],
      timeline: [
        {
          timestamp: nowStr,
          stage: 'pre_screen',
          operator: `${operatorName} (${currentUser?.roleTitle || '业务顾问'})`,
          description: '发起贷款报审进件，录入初审资质',
          isKeyNode: true,
        },
      ],
    };

    setLoanCases((prev) => [newCase, ...prev]);
    setCurrentNav('pipeline');
    if (selectedCustomerForDetail) {
      setSelectedCustomerForDetail(null);
    }
  };

  // User Deletion Handler (Super Admin & Admin only)
  const handleDeleteUser = (userId: string, reassignMode: 'pool' | 'user', targetUserId?: string) => {
    const deletedUser = users.find((u) => u.id === userId);
    if (!deletedUser) return;

    const targetUser = targetUserId ? users.find((u) => u.id === targetUserId) : null;
    const nowStr = new Date().toLocaleString('zh-CN', { hour12: false });

    // Update customer assignments（用 ownerId 外键精确匹配，兼容历史无 ownerId 的旧数据回退到姓名匹配）
    setCustomers((prev) =>
      prev.map((c) => {
        const belongsToDeleted = c.ownerId ? c.ownerId === deletedUser.id : c.ownerName === deletedUser.name;
        if (belongsToDeleted) {
          if (reassignMode === 'user' && targetUser) {
            return {
              ...c,
              ownerName: targetUser.name,
              ownerId: targetUser.id,
              poolReturnCountdownDays: 15,
              followUps: [
                ...c.followUps,
                {
                  id: `f-${Date.now()}-${Math.random()}`,
                  date: nowStr,
                  type: 'system' as const,
                  content: `【员工离职交接】原顾问 [${deletedUser.name}] 已被管理员删除，客户批量交接至新顾问 [${targetUser.name}]。`,
                  operator: currentUser?.name || '管理员',
                },
              ],
            };
          } else {
            // Return to public pool
            return {
              ...c,
              ownerName: '公共公海池',
              ownerId: undefined,
              status: 'in_pool' as const,
              followUps: [
                ...c.followUps,
                {
                  id: `f-${Date.now()}-${Math.random()}`,
                  date: nowStr,
                  type: 'system' as const,
                  content: `【员工离职回收】原顾问 [${deletedUser.name}] 已被管理员删除，客户已自动释放回收至全司公海池。`,
                  operator: currentUser?.name || '管理员',
                },
              ],
            };
          }
        }
        return c;
      })
    );

    // Reassign loan cases owned by deleted user
    setLoanCases((prev) =>
      prev.map((l) => {
        const belongsToDeleted = l.consultantId ? l.consultantId === deletedUser.id : l.consultantName === deletedUser.name;
        if (belongsToDeleted) {
          if (reassignMode === 'user' && targetUser) {
            return { ...l, consultantName: targetUser.name, consultantId: targetUser.id };
          }
          return { ...l, consultantName: '公共公海池', consultantId: undefined };
        }
        return l;
      })
    );

    // Remove user
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  // Customer Deletion Handler (Super Admin & Admin only)
  const handleDeleteCustomer = (customerId: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== customerId));
    setLoanCases((prev) => prev.filter((l) => l.customerId !== customerId));
    if (selectedCustomerForDetail?.id === customerId) {
      setSelectedCustomerForDetail(null);
    }
  };

  // Batch Customer Deletion Handler
  const handleBatchDeleteCustomers = (customerIds: string[]) => {
    const idSet = new Set(customerIds);
    setCustomers((prev) => prev.filter((c) => !idSet.has(c.id)));
    setLoanCases((prev) => prev.filter((l) => !idSet.has(l.customerId)));
    if (selectedCustomerForDetail && idSet.has(selectedCustomerForDetail.id)) {
      setSelectedCustomerForDetail(null);
    }
  };

  // 发送跟进提醒：向客户负责人写入内部通知，同步当前急迫度标签
  const handleSendFollowUpReminder = (customer: Customer) => {
    const nowStr = new Date().toLocaleString('zh-CN', { hour12: false });
    const urgencyLabel = customer.urgency || customer.intentTag || '待跟进';
    const owner = users.find((u) => u.id === customer.ownerId) || users.find((u) => u.name === customer.ownerName);
    const record: FollowUpRecord = {
      id: `f-reminder-${Date.now()}`,
      date: nowStr,
      type: 'system',
      operator: currentUser?.name || '系统',
      content: `【内部跟进提醒】已同步客户当前急迫度标签：${urgencyLabel}。请负责人 ${owner?.name || customer.ownerName} 尽快跟进，保持与客户的有效触达节奏。`,
      intentTag: customer.intentTag,
      nextFollowUpDate: customer.nextContactDate,
    };
    handleAddFollowUp(customer.id, record);
  };

  // If user is not logged in, show AuthPage (Pure Light Theme)
  if (!currentUser) {
    return (
      <AuthPage
        users={users}
        onLoginSuccess={handleLoginSuccess}
        securityPolicy={systemConfig.securityPolicy}
      />
    );
  }

  // Calculate filtered counts（用 ownerId/consultantId 外键精确匹配）
  const isConsultant = isConsultantRole(currentUser.role);
  const myLeadsCount = isConsultant
    ? customers.filter((c) => c.status !== 'in_pool' && (c.ownerId ? c.ownerId === currentUser.id : c.ownerName === currentUser.name)).length
    : customers.filter((c) => c.status !== 'in_pool').length;
  const inProgressCasesCount = isConsultant
    ? loanCases.filter((l) => (l.consultantId ? l.consultantId === currentUser.id : l.consultantName === currentUser.name) && l.stage !== 'disbursement' && l.stage !== 'post_loan').length
    : loanCases.filter((l) => l.stage !== 'disbursement' && l.stage !== 'post_loan').length;
  const postLoanAlertsCount = postLoanAccounts.filter(
    (a) => a.repaymentStatus === 'overdue_m1' || a.repaymentStatus === 'upcoming_due' || a.riskAlerts.some((r) => !r.isResolved)
  ).length;

  // 超级管理员专属：清空全部业务数据到出厂状态（保留产品库与系统配置）
  const handleResetData = () => {
    // 正式版语义：清空全部业务数据（客户/进件/外呼/员工）回到出厂状态，保留银行产品库与系统配置
    setUsers(INITIAL_USERS);
    setCustomers([]);
    setLoanCases([]);
    setPostLoanAccounts(INITIAL_POST_LOAN_ACCOUNTS);
    setCallRecords([]);
    setCurrentUser(null);
    setIsSystemSettingsOpen(false);
  };

  // 从 JSON 备份恢复数据（正式版灾难恢复/迁移刚需）
  const handleRestoreData = (payload: {
    users?: UserAccount[];
    customers?: Customer[];
    loanCases?: LoanCase[];
    postLoanAccounts?: PostLoanAccount[];
    callRecords?: CallRecord[];
    systemConfig?: SystemConfig;
  }) => {
    if (payload.users) setUsers(payload.users);
    if (payload.customers) setCustomers(payload.customers);
    if (payload.loanCases) setLoanCases(payload.loanCases);
    if (payload.postLoanAccounts) setPostLoanAccounts(payload.postLoanAccounts);
    if (payload.callRecords) setCallRecords(payload.callRecords);
    if (payload.systemConfig) setSystemConfig(payload.systemConfig);
    setCurrentUser(null); // 恢复后强制重新登录，刷新权限上下文
    setIsSystemSettingsOpen(false);
  };

  return (
    <div className="h-screen h-dvh w-screen flex flex-col bg-slate-50 font-sans text-slate-800 overflow-hidden selection:bg-blue-600 selection:text-white">
      
      {/* Top Light Responsive Navigation Bar with Global Search Entry */}
      <Navbar
        currentUser={currentUser}
        onSwitchUser={(user) => setCurrentUser(user)}
        users={users}
        customers={customers}
        loanCases={loanCases}
        isMasked={isMasked}
        setIsMasked={setIsMasked}
        currentNav={currentNav}
        setCurrentNav={setCurrentNav}
        counts={{
          myLeads: myLeadsCount,
          inProgressCases: inProgressCasesCount,
          postLoanAlerts: postLoanAlertsCount,
        }}
        onOpenWizard={handleOpenWizard}
        onOpenTools={() => setIsToolsOpen(true)}
        onOpenSettings={() => setIsSystemSettingsOpen(true)}
        onOpenCustomerDetail={(c) => setSelectedCustomerForDetail(c)}
        onStartCall={(c) => setSelectedCustomerForCall(c)}
        onLogout={handleLogout}
      />

      {/* Main Single Flow Scrollable Card Stream Area */}
      <main ref={mainRef} className="flex-1 overflow-y-auto min-h-0 bg-slate-50 pb-16 md:pb-6">
        {currentNav === 'workbench' && (
          <Workbench
            customers={customers}
            loanCases={loanCases}
            callRecords={callRecords}
            currentUser={currentUser}
            users={users}
            systemConfig={systemConfig}
            onNavigate={setCurrentNav}
            setPendingPoolFilter={setPendingPoolFilter}
            onOpenWizard={handleOpenWizard}
            onOpenCustomerDetail={(c) => setSelectedCustomerForDetail(c)}
            onStartCall={(c) => setSelectedCustomerForCall(c)}
            onAddFollowUp={handleAddFollowUp}
            onCompleteCallback={handleCompleteCallback}
          />
        )}

        {currentNav === 'assessment' && (
          <div className="p-3.5 sm:p-6 max-w-6xl mx-auto space-y-4">
            <AutoAssessmentCard
              customers={customers}
              onOpenWizard={handleOpenWizard}
              onApplyLoan={handleStartApplyLoan}
              systemConfig={systemConfig}
              products={effectiveProducts}
            />
          </div>
        )}

        {currentNav === 'crm' && (
          <CustomerManagement
            customers={customers}
            setCustomers={setCustomers}
            currentUser={currentUser}
            users={users}
            isMasked={isMasked}
            systemConfig={systemConfig}
            loanCases={loanCases}
            callRecords={callRecords}
            initialPoolFilter={pendingPoolFilter}
            onConsumePoolFilter={() => setPendingPoolFilter(null)}
            onOpenWizard={handleOpenWizard}
            onOpenCustomerDetail={(c) => setSelectedCustomerForDetail(c)}
            onStartCall={(c) => setSelectedCustomerForCall(c)}
            onApplyLoan={handleStartApplyLoan}
            onSharePoster={(c) => setSelectedCustomerForPoster(c)}
            onDeleteCustomer={handleDeleteCustomer}
            onBatchDeleteCustomers={handleBatchDeleteCustomers}
            onSendFollowUpReminder={handleSendFollowUpReminder}
          />
        )}

        {currentNav === 'pipeline' && (
          <LoanPipeline
            loanCases={loanCases}
            setLoanCases={setLoanCases}
            currentUser={currentUser}
            users={users}
            isMasked={isMasked}
            onOpenNewCaseModal={handleOpenWizard}
            onAdvanceStage={handleCaseStageChanged}
          />
        )}

        {currentNav === 'post_loan' && (
          <PostLoanManagement
            postLoanAccounts={postLoanAccounts}
            setPostLoanAccounts={setPostLoanAccounts}
            isMasked={isMasked}
            currentUser={currentUser}
            users={users}
            onOpenCustomerDetail={(customerId) => {
              const cust = customers.find((c) => c.id === customerId);
              if (cust) setSelectedCustomerForDetail(cust);
            }}
            onStartCall={(callTarget) => {
              const cust = customers.find((c) => c.phone === callTarget.phone || c.name === callTarget.name) || ({
                id: `cust-temp-${Date.now()}`,
                name: callTarget.name,
                phone: callTarget.phone,
                idCard: '51010019900101****',
                grade: 'A',
                intentTag: 'high_intent',
                status: 'disbursed',
                city: '成都',
                tags: ['在贷客户'],
                followUps: [],
              } as unknown as Customer);
              setSelectedCustomerForCall(cust);
            }}
            onStartApplyLoan={handleStartApplyLoan}
          />
        )}

        {currentNav === 'products' && (
          <ProductCatalog
            onSelectProductToMatch={handleOpenWizard}
            bankProductPolicies={systemConfig.bankProductPolicies}
            products={effectiveProducts}
            canManage={currentUser?.role === 'super_admin' || currentUser?.role === 'admin'}
            onRemoveProduct={(pid) => setRemovedProductIds((prev) => [...prev, pid])}
          />
        )}

        {currentNav === 'finance' && (
          <FinancialSettlement
            loanCases={loanCases}
            setLoanCases={setLoanCases}
            currentUser={currentUser}
            isMasked={isMasked}
            systemConfig={systemConfig}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Dock */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-md border-t border-slate-200 flex items-center justify-around px-1 z-40">
        <button
          onClick={() => setCurrentNav('workbench')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
            currentNav === 'workbench' ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">工作台</span>
        </button>

        <button
          onClick={() => setCurrentNav('assessment')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition relative ${
            currentNav === 'assessment' ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Zap className="w-4 h-4 text-blue-600" />
          <span className="text-[10px] mt-0.5">判定</span>
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-500" />
        </button>

        <button
          onClick={() => setCurrentNav('crm')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition relative ${
            currentNav === 'crm' ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Users className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">客户</span>
          {myLeadsCount > 0 && (
            <span className="absolute top-0.5 right-1 px-1 text-[8px] rounded-full bg-blue-600 text-white font-mono">
              {myLeadsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setCurrentNav('pipeline')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition relative ${
            currentNav === 'pipeline' ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <GitPullRequestDraft className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">进件</span>
          {inProgressCasesCount > 0 && (
            <span className="absolute top-0.5 right-1 px-1 text-[8px] rounded-full bg-amber-500 text-white font-mono">
              {inProgressCasesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setCurrentNav('post_loan')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition relative ${
            currentNav === 'post_loan' ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">贷后</span>
          {postLoanAlertsCount > 0 && (
            <span className="absolute top-0.5 right-1 px-1 text-[8px] rounded-full bg-rose-500 text-white font-mono">
              {postLoanAlertsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setCurrentNav('products')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
            currentNav === 'products' ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <PackageSearch className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">产品</span>
        </button>

        <button
          onClick={() => setCurrentNav('finance')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
            currentNav === 'finance' ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">结算</span>
        </button>
      </div>

      {/* Modals */}
      <CustomerIntakeWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        currentUser={currentUser}
        onSaveCustomer={handleSaveNewCustomer}
        systemConfig={systemConfig}
        products={effectiveProducts}
      />

      <CustomerDetailModal
        customer={selectedCustomerForDetail}
        isOpen={Boolean(selectedCustomerForDetail)}
        onClose={() => setSelectedCustomerForDetail(null)}
        isMasked={isMasked}
        currentUser={currentUser}
        loanCases={loanCases}
        onStartCall={(c) => {
          setSelectedCustomerForCall(c);
        }}
        onApplyLoan={handleStartApplyLoan}
        onSharePoster={(c) => {
          setSelectedCustomerForPoster(c);
        }}
        onAddFollowUp={handleAddFollowUp}
        onDeleteCustomer={handleDeleteCustomer}
      />

      <LoanToolsModal
        isOpen={isToolsOpen}
        onClose={() => setIsToolsOpen(false)}
        systemConfig={systemConfig}
      />

      <SharePosterModal
        customer={selectedCustomerForPoster}
        isOpen={Boolean(selectedCustomerForPoster)}
        onClose={() => setSelectedCustomerForPoster(null)}
      />

      <VirtualCallModal
        customer={selectedCustomerForCall}
        isOpen={Boolean(selectedCustomerForCall)}
        onClose={() => setSelectedCustomerForCall(null)}
        onSaveFollowUp={handleAddFollowUp}
        onRecordCall={handleRecordCall}
        callRecords={callRecords}
        currentUserName={currentUser?.name}
      />

      {/* 首次登录强制改密（正式版安全策略） */}
      {forceChangePwdUser && (
        <ForceChangePasswordModal
          user={forceChangePwdUser}
          onClose={() => setForceChangePwdUser(null)}
          systemConfig={systemConfig}
          onUpdatePassword={handleUpdatePassword}
          verifyCurrentPassword={async (pwd: string) =>
            forceChangePwdUser ? verifyUserPassword(forceChangePwdUser, pwd) : false
          }
        />
      )}

      <SystemSettingsModal
        isOpen={isSystemSettingsOpen}
        onClose={() => setIsSystemSettingsOpen(false)}
        users={users}
        currentUser={currentUser}
        customers={customers}
        loanCases={loanCases}
        callRecords={callRecords}
        onUpdateUsers={setUsers}
        onDeleteUser={handleDeleteUser}
        systemConfig={systemConfig}
        onUpdateConfig={setSystemConfig}
        onResetData={handleResetData}
        onRestoreData={handleRestoreData}
      />
    </div>
  );
}
