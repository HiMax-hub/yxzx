import React, { useState, useMemo } from 'react';
import { 
  X, 
  ArrowRightLeft, 
  Users, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Printer, 
  Copy, 
  Download, 
  Check, 
  Trash2, 
  ShieldCheck, 
  Clock, 
  Layers, 
  ChevronRight, 
  Search,
  Building,
  UserCheck,
  Award
} from 'lucide-react';
import { Customer, LoanCase, UserAccount, SystemConfig, CustomerGrade } from '../../types';
import { useEscToClose } from '../../utils/useEscToClose';
import { exportCsv, timestampedFilename } from '../../utils/exportUtils';

interface EmployeeHandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserAccount[];
  currentUser: UserAccount;
  customers: Customer[];
  loanCases: LoanCase[];
  initialUserId?: string;
  onExecuteHandover: (payload: {
    fromUserId: string;
    selectedCustomerIds: string[];
    selectedCaseIds: string[];
    reassignMode: 'pool' | 'user';
    targetUserId?: string;
    deleteAccountAfterHandover: boolean;
    confirmationNote?: string;
  }) => void;
}

export const EmployeeHandoverModal: React.FC<EmployeeHandoverModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUser,
  customers,
  loanCases,
  initialUserId,
  onExecuteHandover,
}) => {
  useEscToClose(isOpen, onClose);

  // 1. 离职交接人选择
  const [fromUserId, setFromUserId] = useState<string>(() => {
    if (initialUserId) return initialUserId;
    const firstConsultant = users.find((u) => u.role === 'consultant');
    return firstConsultant ? firstConsultant.id : users[0]?.id || '';
  });

  // 2. 接收方式与承接人
  const [reassignMode, setReassignMode] = useState<'user' | 'pool'>('user');
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [deleteAccountAfterHandover, setDeleteAccountAfterHandover] = useState(true);

  // 3. 勾选状态管理
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);

  // 4. 搜索与筛选
  const [customerSearch, setCustomerSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [caseSearch, setCaseSearch] = useState('');

  // 5. 交接完成后的《交接确认书》展示模式
  const [generatedLetter, setGeneratedLetter] = useState<{
    fromUser: UserAccount;
    targetUser?: UserAccount | null;
    reassignMode: 'user' | 'pool';
    handoverTime: string;
    supervisor: string;
    handedCustomers: Customer[];
    handedCases: LoanCase[];
    note: string;
  } | null>(null);

  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // 当前交接人信息
  const fromUser = useMemo(() => {
    return users.find((u) => u.id === fromUserId) || users[0];
  }, [users, fromUserId]);

  // 可选的在职接收人列表 (排除交接人本人)
  const availableTargetUsers = useMemo(() => {
    return users.filter((u) => u.id !== fromUserId && u.status === 'active');
  }, [users, fromUserId]);

  // 初始化设置默认承接人
  React.useEffect(() => {
    if (availableTargetUsers.length > 0 && (!targetUserId || targetUserId === fromUserId)) {
      const defaultTarget = availableTargetUsers.find((u) => u.role === 'consultant') || availableTargetUsers[0];
      setTargetUserId(defaultTarget ? defaultTarget.id : '');
    }
  }, [availableTargetUsers, fromUserId, targetUserId]);

  // 该离职员工名下的客户列表
  const ownedCustomers = useMemo(() => {
    if (!fromUser) return [];
    return customers.filter((c) => (c.ownerId ? c.ownerId === fromUser.id : c.ownerName === fromUser.name));
  }, [customers, fromUser]);

  // 该离职员工名下的未结案在途工单
  const ownedUnclosedCases = useMemo(() => {
    if (!fromUser) return [];
    return loanCases.filter((c) => {
      const belongs = c.consultantId ? c.consultantId === fromUser.id : c.consultantName === fromUser.name;
      const isUnclosed = c.stage !== 'post_loan'; // 包含在途报审及放款结算阶段
      return belongs && isUnclosed;
    });
  }, [loanCases, fromUser]);

  // 切换员工时，默认全选该员工的名下客户和未结案工单
  React.useEffect(() => {
    if (fromUser) {
      const custIds = customers
        .filter((c) => (c.ownerId ? c.ownerId === fromUser.id : c.ownerName === fromUser.name))
        .map((c) => c.id);
      const caseIds = loanCases
        .filter((c) => {
          const belongs = c.consultantId ? c.consultantId === fromUser.id : c.consultantName === fromUser.name;
          return belongs && c.stage !== 'post_loan';
        })
        .map((c) => c.id);

      setSelectedCustomerIds(custIds);
      setSelectedCaseIds(caseIds);
      setGeneratedLetter(null);
    }
  }, [fromUserId, customers, loanCases]);

  // 过滤后的客户列表
  const filteredCustomers = useMemo(() => {
    return ownedCustomers.filter((c) => {
      const matchSearch = !customerSearch.trim() || c.name.includes(customerSearch.trim()) || c.phone.includes(customerSearch.trim());
      const matchGrade = gradeFilter === 'all' || c.grade === gradeFilter;
      return matchSearch && matchGrade;
    });
  }, [ownedCustomers, customerSearch, gradeFilter]);

  // 过滤后的工单列表
  const filteredCases = useMemo(() => {
    return ownedUnclosedCases.filter((c) => {
      return !caseSearch.trim() || 
        c.customerName.includes(caseSearch.trim()) || 
        (c.caseNumber && c.caseNumber.includes(caseSearch.trim())) ||
        c.productName.includes(caseSearch.trim());
    });
  }, [ownedUnclosedCases, caseSearch]);

  // 客户勾选辅助函数
  const handleToggleCustomer = (id: string) => {
    setSelectedCustomerIds((prev) => 
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllCustomers = () => {
    setSelectedCustomerIds(ownedCustomers.map((c) => c.id));
  };

  const handleDeselectAllCustomers = () => {
    setSelectedCustomerIds([]);
  };

  // 工单勾选辅助函数
  const handleToggleCase = (id: string) => {
    setSelectedCaseIds((prev) => 
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllCases = () => {
    setSelectedCaseIds(ownedUnclosedCases.map((c) => c.id));
  };

  const handleDeselectAllCases = () => {
    setSelectedCaseIds([]);
  };

  // 执行交接与确认书生成
  const handleExecute = () => {
    if (!fromUser) return;
    if (reassignMode === 'user' && !targetUserId) {
      window.alert('请选择在职的接收业务顾问或主管');
      return;
    }

    const targetUser = reassignMode === 'user' ? users.find((u) => u.id === targetUserId) : null;
    const handedCustomers = ownedCustomers.filter((c) => selectedCustomerIds.includes(c.id));
    const handedCases = ownedUnclosedCases.filter((c) => selectedCaseIds.includes(c.id));
    const nowStr = new Date().toLocaleString('zh-CN', { hour12: false });

    // 触发父级回调执行数据更新
    onExecuteHandover({
      fromUserId: fromUser.id,
      selectedCustomerIds,
      selectedCaseIds,
      reassignMode,
      targetUserId: targetUser?.id,
      deleteAccountAfterHandover,
      confirmationNote: `于 ${nowStr} 完成离职交接，客户数: ${handedCustomers.length} 户，未结案工单: ${handedCases.length} 笔。`,
    });

    // 本地生成交接确认书供打印与复制
    setGeneratedLetter({
      fromUser,
      targetUser,
      reassignMode,
      handoverTime: nowStr,
      supervisor: `${currentUser.name} (${currentUser.roleTitle})`,
      handedCustomers,
      handedCases,
      note: deleteAccountAfterHandover ? '已同步注销该离职员工账号' : '保留员工账号停用状态',
    });
  };

  // 生成确认书文本
  const letterTextContent = useMemo(() => {
    if (!generatedLetter) return '';
    const { fromUser, targetUser, reassignMode, handoverTime, supervisor, handedCustomers, handedCases } = generatedLetter;

    return `
======================================================
  雁讯金融咨询 (Yanxun Capital) · 员工离职业务交接确认书
======================================================

【交接基本信息】
- 移交员工（离职人员）: ${fromUser.name}（工号/账号: ${fromUser.username} | 所属部门: ${fromUser.department} | 原岗位: ${fromUser.roleTitle}）
- 承接人员（接收人）: ${reassignMode === 'user' ? `${targetUser?.name}（所属部门: ${targetUser?.department} | 岗位: ${targetUser?.roleTitle}）` : '全司公共公海客户池（自动开放抢单认领）'}
- 监交人员（审批主管）: ${supervisor}
- 交接生效时间: ${handoverTime}

------------------------------------------------------
【一、移交客户资产统计（共 ${handedCustomers.length} 户）】
${handedCustomers.map((c, i) => `${i + 1}. 客户姓名: ${c.name} | 电话: ${c.phone} | 评级: ${c.grade}级 | 需求金额: ¥${c.requestedAmount || 0}万 | 资金用途: ${c.purpose} | 状态: ${c.status}`).join('\n')}

------------------------------------------------------
【二、移交在途/未结案进件工单明细（共 ${handedCases.length} 笔）】
${handedCases.map((c, i) => `${i + 1}. 工单号: ${c.caseNumber || c.id} | 客户: ${c.customerName} | 报审银行: ${c.lenderBank || c.lenderInstitution} | 申请/批贷额: ¥${c.approvedAmount || c.appliedAmount || 0}万 | 审批节点: ${c.stage} (${c.subStageStatus || '跟进中'})`).join('\n')}

------------------------------------------------------
【三、合规承诺与保密协议条款】
1. 移交员工确认已将名下全部客户信息、进件资质、银行经办联系方式及历史沟通台账完整移交，未私自留存、复制或向任何第三方泄露商业机密与客户隐私。
2. 移交员工承诺自离职之日起，恪守竞业限制与合规准则，严禁私自联系公司存量客户进行飞单或转介至竞争机构。
3. 承接人员已完整核验上述移交客户档案与工单节点，自交接生效之日起正式接管并履行后续跟进出单职责。

------------------------------------------------------
【四、三方签字确认】

移交人签字（离职员工）: ____________________   日期: ______年___月___日

承接人签字（接收顾问）: ____________________   日期: ______年___月___日

监交人签字（部门主管）: ____________________   日期: ______年___月___日
======================================================
    `.trim();
  }, [generatedLetter]);

  // 复制文本
  const handleCopyLetter = () => {
    navigator.clipboard.writeText(letterTextContent);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  // 打印确认书
  const handlePrintLetter = () => {
    window.print();
  };

  // 导出交接明细 CSV
  const handleExportDetailsCSV = () => {
    if (!generatedLetter) return;
    const headers = ['类型', '编号/姓名', '联系电话', '等级/产品', '需求/申报额(万)', '审批阶段/状态', '接收人'];
    const custRows = generatedLetter.handedCustomers.map((c) => [
      '客户资产',
      c.name,
      c.phone,
      `${c.grade}级`,
      c.requestedAmount || 0,
      c.status,
      generatedLetter.targetUser?.name || '公共公海池',
    ]);
    const caseRows = generatedLetter.handedCases.map((c) => [
      '在途工单',
      c.caseNumber || c.id,
      c.customerPhone,
      c.productName,
      c.approvedAmount || c.appliedAmount || 0,
      c.stage,
      generatedLetter.targetUser?.name || '公共公海池',
    ]);
    exportCsv(timestampedFilename(`员工离职交接清单_${generatedLetter.fromUser.name}`), headers, [...custRows, ...caseRows]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-white text-slate-900 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shadow-xs">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  一键员工离职交接与业务划拨工作台
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  安全合规交接
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                支持批量勾选在途客户资产与未结案工单，精准转交在职顾问或回收公海，并一键生成标准交接确认书
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Two Modes (1. Handover Operation Mode vs 2. Generated Confirmation Letter Mode) */}
        {!generatedLetter ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* Step 1: Select Offboarding Employee & Handover Destination */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              {/* Select From User */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1">
                  <Users className="w-3.5 h-3.5 text-rose-600" />
                  <span>选择离职 / 交接员工 *</span>
                </label>
                <select
                  value={fromUserId}
                  onChange={(e) => setFromUserId(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-rose-500 cursor-pointer"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.roleTitle.split(' ')[0]} - {u.department})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Target Reassign Destination */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
                  <span>交接资产去向 *</span>
                </label>
                <div className="flex items-center space-x-2">
                  <select
                    value={reassignMode}
                    onChange={(e) => setReassignMode(e.target.value as 'user' | 'pool')}
                    className="p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="user">指定在职顾问承接</option>
                    <option value="pool">全部释放至公海客户池</option>
                  </select>

                  {reassignMode === 'user' && (
                    <select
                      value={targetUserId}
                      onChange={(e) => setTargetUserId(e.target.value)}
                      className="flex-1 p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      {availableTargetUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.department})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Account Deletion Option */}
              <div className="flex flex-col justify-end">
                <label className="flex items-center space-x-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition">
                  <input
                    type="checkbox"
                    checked={deleteAccountAfterHandover}
                    onChange={(e) => setDeleteAccountAfterHandover(e.target.checked)}
                    className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    交接完成后同步删除/注销该员工账号
                  </span>
                </label>
              </div>
            </div>

            {/* Quick Stats Pill */}
            <div className="flex items-center justify-between text-xs px-2 text-slate-600">
              <div className="flex items-center space-x-3">
                <span>
                  该员工名下客户: <strong className="text-slate-900 font-bold">{ownedCustomers.length}</strong> 户 (已勾选 <strong className="text-blue-600 font-bold">{selectedCustomerIds.length}</strong> 户)
                </span>
                <span>·</span>
                <span>
                  未结案在途进件: <strong className="text-slate-900 font-bold">{ownedUnclosedCases.length}</strong> 笔 (已勾选 <strong className="text-amber-600 font-bold">{selectedCaseIds.length}</strong> 笔)
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    handleSelectAllCustomers();
                    handleSelectAllCases();
                  }}
                  className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  一键全选全部资产
                </button>
              </div>
            </div>

            {/* Step 2: Dual Visual Tables (Customers & Unclosed Cases) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left 7 Cols: Customer Portfolio Checkbox List */}
              <div className="lg:col-span-7 border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white flex flex-col max-h-[380px]">
                {/* Table Header with Search & Filter */}
                <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-slate-800 text-xs">
                      1. 客户资产交接清单 ({selectedCustomerIds.length}/{ownedCustomers.length})
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      placeholder="搜索客户..."
                      className="w-24 sm:w-28 px-2 py-1 text-[11px] bg-white border border-slate-200 rounded focus:outline-none"
                    />
                    <select
                      value={gradeFilter}
                      onChange={(e) => setGradeFilter(e.target.value)}
                      className="px-1.5 py-1 text-[11px] bg-white border border-slate-200 rounded focus:outline-none cursor-pointer"
                    >
                      <option value="all">全部评级</option>
                      <option value="S">S级</option>
                      <option value="A">A级</option>
                      <option value="B">B级</option>
                      <option value="C">C级</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleSelectAllCustomers}
                      className="px-1.5 py-1 text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer"
                    >
                      全选
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAllCustomers}
                      className="px-1.5 py-1 text-[11px] text-slate-500 hover:underline cursor-pointer"
                    >
                      清空
                    </button>
                  </div>
                </div>

                {/* Table Rows */}
                <div className="flex-1 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-50/70 border-b border-slate-100 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 w-8 text-center">
                          <input
                            type="checkbox"
                            checked={selectedCustomerIds.length > 0 && selectedCustomerIds.length === ownedCustomers.length}
                            onChange={(e) => e.target.checked ? handleSelectAllCustomers() : handleDeselectAllCustomers()}
                            className="rounded border-slate-300 text-blue-600 cursor-pointer"
                          />
                        </th>
                        <th className="px-2 py-2 font-bold text-slate-600">客户姓名</th>
                        <th className="px-2 py-2 font-bold text-slate-600">联系电话</th>
                        <th className="px-2 py-2 font-bold text-slate-600 text-center">等级</th>
                        <th className="px-2 py-2 font-bold text-slate-600 text-right">意向金额</th>
                        <th className="px-2 py-2 font-bold text-slate-600">资金用途</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredCustomers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-slate-400">
                            暂无可交接客户
                          </td>
                        </tr>
                      ) : (
                        filteredCustomers.map((c) => {
                          const isSelected = selectedCustomerIds.includes(c.id);
                          return (
                            <tr 
                              key={c.id} 
                              onClick={() => handleToggleCustomer(c.id)}
                              className={`transition cursor-pointer ${
                                isSelected ? 'bg-blue-50/60 hover:bg-blue-50' : 'hover:bg-slate-50'
                              }`}
                            >
                              <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleCustomer(c.id)}
                                  className="rounded border-slate-300 text-blue-600 cursor-pointer"
                                />
                              </td>
                              <td className="px-2 py-2 font-bold text-slate-900 whitespace-nowrap">
                                {c.name}
                              </td>
                              <td className="px-2 py-2 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                                {c.phone}
                              </td>
                              <td className="px-2 py-2 text-center">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  c.grade === 'S' ? 'bg-rose-100 text-rose-700' :
                                  c.grade === 'A' ? 'bg-amber-100 text-amber-700' :
                                  'bg-blue-100 text-blue-700'
                                }`}>
                                  {c.grade}级
                                </span>
                              </td>
                              <td className="px-2 py-2 text-right font-mono font-bold text-blue-700 whitespace-nowrap">
                                ¥{c.requestedAmount || 0}万
                              </td>
                              <td className="px-2 py-2 text-slate-600 truncate max-w-[100px]">
                                {c.purpose}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right 5 Cols: Unclosed Cases Checkbox List */}
              <div className="lg:col-span-5 border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white flex flex-col max-h-[380px]">
                {/* Table Header with Actions */}
                <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-amber-600" />
                    <span className="font-bold text-slate-800 text-xs">
                      2. 未结案工单 ({selectedCaseIds.length}/{ownedUnclosedCases.length})
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleSelectAllCases}
                      className="px-1.5 py-1 text-[11px] text-amber-600 hover:underline font-semibold cursor-pointer"
                    >
                      全选
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAllCases}
                      className="px-1.5 py-1 text-[11px] text-slate-500 hover:underline cursor-pointer"
                    >
                      清空
                    </button>
                  </div>
                </div>

                {/* Table Rows */}
                <div className="flex-1 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-50/70 border-b border-slate-100 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 w-8 text-center">
                          <input
                            type="checkbox"
                            checked={selectedCaseIds.length > 0 && selectedCaseIds.length === ownedUnclosedCases.length}
                            onChange={(e) => e.target.checked ? handleSelectAllCases() : handleDeselectAllCases()}
                            className="rounded border-slate-300 text-amber-600 cursor-pointer"
                          />
                        </th>
                        <th className="px-2 py-2 font-bold text-slate-600">客户/工单</th>
                        <th className="px-2 py-2 font-bold text-slate-600">贷款产品</th>
                        <th className="px-2 py-2 font-bold text-slate-600 text-right">金额</th>
                        <th className="px-2 py-2 font-bold text-slate-600">阶段</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredCases.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-slate-400">
                            暂无在途未结案工单
                          </td>
                        </tr>
                      ) : (
                        filteredCases.map((c) => {
                          const isSelected = selectedCaseIds.includes(c.id);
                          return (
                            <tr 
                              key={c.id} 
                              onClick={() => handleToggleCase(c.id)}
                              className={`transition cursor-pointer ${
                                isSelected ? 'bg-amber-50/60 hover:bg-amber-50' : 'hover:bg-slate-50'
                              }`}
                            >
                              <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleCase(c.id)}
                                  className="rounded border-slate-300 text-amber-600 cursor-pointer"
                                />
                              </td>
                              <td className="px-2 py-2">
                                <div className="font-bold text-slate-900">{c.customerName}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{c.caseNumber || c.id}</div>
                              </td>
                              <td className="px-2 py-2 text-slate-700 truncate max-w-[110px]" title={c.productName}>
                                {c.productName}
                              </td>
                              <td className="px-2 py-2 text-right font-mono font-bold text-amber-700 whitespace-nowrap">
                                ¥{c.approvedAmount || c.appliedAmount || 0}万
                              </td>
                              <td className="px-2 py-2 whitespace-nowrap">
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  {c.stage}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Step 3: Formal Confirmation Letter Generated View (Ready to print / copy) */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-100">
            {/* Top Success Banner */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-900">
                    一键离职交接流转已成功执行！
                  </h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    已完成 {generatedLetter.handedCustomers.length} 位客户与 {generatedLetter.handedCases.length} 笔在途工单的权属转移，并已自动记录系统审计与客户流转跟进日志。
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleCopyLetter}
                  className="px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-2xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedSuccess ? '已复制文本！' : '复制确认书'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintLetter}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>打印确认书 / 导出PDF</span>
                </button>
              </div>
            </div>

            {/* Formal Document Preview Paper Container */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-300 shadow-md max-w-3xl mx-auto space-y-6 text-slate-800 font-sans print:shadow-none print:border-none print:p-0">
              {/* Document Header */}
              <div className="text-center pb-4 border-b-2 border-slate-900 space-y-1">
                <div className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                  YANXUN CAPITAL · OFFBOARDING PROTOCOL
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  员工离职业务交接确认书与合规承诺协议
                </h1>
                <p className="text-xs text-slate-500">
                  交接单据唯一编号：HO-{Date.now().toString().slice(-8)} · 生效日期：{generatedLetter.handoverTime}
                </p>
              </div>

              {/* Handover Parties Table */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <div className="text-slate-400">移交人 (离职员工)</div>
                  <div className="font-bold text-slate-900 mt-0.5">{generatedLetter.fromUser.name}</div>
                  <div className="text-[11px] text-slate-500">{generatedLetter.fromUser.department}</div>
                </div>
                <div>
                  <div className="text-slate-400">承接人 (接收顾问)</div>
                  <div className="font-bold text-blue-700 mt-0.5">
                    {generatedLetter.targetUser ? generatedLetter.targetUser.name : '全司公共公海池'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {generatedLetter.targetUser ? generatedLetter.targetUser.department : '公共线索资源池'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">监交人 (审批主管)</div>
                  <div className="font-bold text-slate-900 mt-0.5">{currentUser.name}</div>
                  <div className="text-[11px] text-slate-500">{currentUser.roleTitle.split(' ')[0]}</div>
                </div>
                <div>
                  <div className="text-slate-400">交接资产汇总</div>
                  <div className="font-bold text-rose-600 mt-0.5">
                    {generatedLetter.handedCustomers.length} 户客户 / {generatedLetter.handedCases.length} 笔工单
                  </div>
                  <div className="text-[11px] text-slate-500">
                    需求总额 ¥{generatedLetter.handedCustomers.reduce((s, c) => s + (c.requestedAmount || 0), 0)}万
                  </div>
                </div>
              </div>

              {/* Section 1: Customer Portfolio */}
              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <span>一、移交存量客户资产清单 ({generatedLetter.handedCustomers.length} 户)</span>
                </h3>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="p-2 font-bold text-slate-600">序号</th>
                        <th className="p-2 font-bold text-slate-600">客户姓名</th>
                        <th className="p-2 font-bold text-slate-600">联系电话</th>
                        <th className="p-2 font-bold text-slate-600 text-center">评级</th>
                        <th className="p-2 font-bold text-slate-600 text-right">意向金额</th>
                        <th className="p-2 font-bold text-slate-600">资金用途</th>
                        <th className="p-2 font-bold text-slate-600">当前跟进结论</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {generatedLetter.handedCustomers.map((c, i) => (
                        <tr key={c.id}>
                          <td className="p-2 font-mono text-slate-400">{i + 1}</td>
                          <td className="p-2 font-bold text-slate-900">{c.name}</td>
                          <td className="p-2 font-mono text-slate-600">{c.phone}</td>
                          <td className="p-2 text-center font-bold text-blue-700">{c.grade}级</td>
                          <td className="p-2 text-right font-mono font-bold">¥{c.requestedAmount || 0}万</td>
                          <td className="p-2 text-slate-600">{c.purpose}</td>
                          <td className="p-2 text-slate-500 truncate max-w-[140px]">{c.followUps?.[0]?.content || '待首访沟通'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 2: Unclosed Loan Cases */}
              <div className="space-y-2">
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>二、移交在途/未结案进件工单清单 ({generatedLetter.handedCases.length} 笔)</span>
                </h3>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="p-2 font-bold text-slate-600">序号</th>
                        <th className="p-2 font-bold text-slate-600">工单号</th>
                        <th className="p-2 font-bold text-slate-600">客户姓名</th>
                        <th className="p-2 font-bold text-slate-600">贷款产品与资方</th>
                        <th className="p-2 font-bold text-slate-600 text-right">申报/批贷额</th>
                        <th className="p-2 font-bold text-slate-600">当前审批节点</th>
                        <th className="p-2 font-bold text-slate-600">备忘待办</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {generatedLetter.handedCases.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-3 text-center text-slate-400">无在途未结案工单</td>
                        </tr>
                      ) : (
                        generatedLetter.handedCases.map((c, i) => (
                          <tr key={c.id}>
                            <td className="p-2 font-mono text-slate-400">{i + 1}</td>
                            <td className="p-2 font-mono text-slate-700">{c.caseNumber || c.id}</td>
                            <td className="p-2 font-bold text-slate-900">{c.customerName}</td>
                            <td className="p-2 text-slate-700">{c.productName} ({c.lenderBank || c.lenderInstitution})</td>
                            <td className="p-2 text-right font-mono font-bold text-blue-700">¥{c.approvedAmount || c.appliedAmount || 0}万</td>
                            <td className="p-2 font-bold text-amber-700">{c.stage}</td>
                            <td className="p-2 text-slate-500">{c.subStageStatus || '待推进'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 3: Legal & Confidentiality Undertakings */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 text-slate-600 leading-relaxed">
                <h4 className="font-bold text-slate-900 text-xs">三、员工离职合规与客户数据保密承诺</h4>
                <p>
                  1. <strong>资产完整移交承诺</strong>：移交员工确认已将名下所属全部客户资源、跟进底账、银行渠道对接人信息及进件材料完整移交，未私自保留、复制、转录或向任何第三方披露。
                </p>
                <p>
                  2. <strong>反飞单与竞业限制</strong>：移交员工承诺自离职生效之日起，严禁私自联系、招揽或撬动公司存量客户，严禁从事飞单、同业拉客及损害雁讯咨询合法权益之行为。
                </p>
                <p>
                  3. <strong>承接履约声明</strong>：承接人员已完整核实上述客户档案及工单进度，自本协议签字之日起承担后续跟进出单与服务责任。
                </p>
              </div>

              {/* Section 4: Signature Blocks */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-slate-300 text-xs">
                <div className="space-y-4">
                  <div className="text-slate-500">移交人签字 (离职员工)：</div>
                  <div className="border-b border-slate-400 h-8 flex items-end font-bold text-slate-900">
                    {generatedLetter.fromUser.name}
                  </div>
                  <div className="text-[11px] text-slate-400">日期: {generatedLetter.handoverTime.split(' ')[0]}</div>
                </div>

                <div className="space-y-4">
                  <div className="text-slate-500">承接人签字 (接手顾问)：</div>
                  <div className="border-b border-slate-400 h-8 flex items-end font-bold text-slate-900">
                    {generatedLetter.targetUser ? generatedLetter.targetUser.name : '（公共公海池托管）'}
                  </div>
                  <div className="text-[11px] text-slate-400">日期: {generatedLetter.handoverTime.split(' ')[0]}</div>
                </div>

                <div className="space-y-4">
                  <div className="text-slate-500">监交人签字 (部门主管/超管)：</div>
                  <div className="border-b border-slate-400 h-8 flex items-end font-bold text-slate-900">
                    {currentUser.name}
                  </div>
                  <div className="text-[11px] text-slate-400">日期: {generatedLetter.handoverTime.split(' ')[0]}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              {!generatedLetter ? '执行交接后将自动更新客户与工单归属，不可逆转' : '确认书已生成，支持导出或打印'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {!generatedLetter ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleExecute}
                  disabled={selectedCustomerIds.length === 0 && selectedCaseIds.length === 0}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>执行一键交接并生成确认书 ({selectedCustomerIds.length + selectedCaseIds.length})</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleExportDetailsCSV}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>导出明细 CSV</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-xs"
                >
                  完成并退出
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
