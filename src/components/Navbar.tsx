import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Eye, 
  Plus, 
  Calculator, 
  ChevronDown, 
  Clock, 
  LogOut, 
  Settings, 
  User, 
  Briefcase, 
  LayoutDashboard, 
  Users, 
  GitPullRequestDraft, 
  PackageSearch, 
  Coins, 
  Zap, 
  Sparkles,
  Menu,
  X,
  Search,
  Command
} from 'lucide-react';
import { UserAccount, UserRole, Customer, LoanCase } from '../types';
import { CommandPaletteModal } from './common/CommandPaletteModal';
import { canManageSystem } from '../utils/permissions';

interface NavbarProps {
  currentUser: UserAccount;
  onSwitchUser?: (user: UserAccount) => void;
  users: UserAccount[];
  customers?: Customer[];
  loanCases?: LoanCase[];
  isMasked: boolean;
  setIsMasked: (val: boolean) => void;
  currentNav: string;
  setCurrentNav: (tab: string) => void;
  counts: {
    myLeads: number;
    inProgressCases: number;
    postLoanAlerts?: number;
  };
  onOpenWizard: () => void;
  onOpenTools: () => void;
  onOpenSettings?: () => void;
  onOpenCustomerDetail?: (customer: Customer) => void;
  onOpenLoanCase?: (loanCase: LoanCase) => void;
  onStartCall?: (customer: Customer) => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onSwitchUser,
  users,
  customers = [],
  loanCases = [],
  isMasked,
  setIsMasked,
  currentNav,
  setCurrentNav,
  counts,
  onOpenWizard,
  onOpenTools,
  onOpenSettings,
  onOpenCustomerDetail,
  onOpenLoanCase,
  onStartCall,
  onLogout,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  // Global hotkey: Cmd+K / Ctrl+K or '/' to open search modal
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const str = now.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      setCurrentTimeStr(str);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return { label: '超级管理员', color: 'bg-red-50 text-red-700 border-red-200' };
      case 'admin':
        return { label: '系统管理员', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'finance_admin':
        return { label: '财务总监', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'risk_manager':
        return { label: '主管/风控', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'consultant':
      default:
        return { label: '业务顾问', color: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
  };

  const badge = getRoleBadge(currentUser.role);

  // 角色权限层级（数值越大权限越高）。快速切换账号仅允许切换至权限不高于自己的账号，
  // 杜绝非超管借切换账号实现权限提升（如顾问切到管理员/财务/风控账号）。
  const ROLE_LEVEL: Record<UserRole, number> = {
    super_admin: 4,
    admin: 3,
    risk_manager: 2,
    finance_admin: 2,
    consultant: 1,
  };
  const canSwitchToRole = (to: UserRole): boolean => {
    if (currentUser.role === 'super_admin') return true;
    return (ROLE_LEVEL[to] ?? 0) <= (ROLE_LEVEL[currentUser.role] ?? 0);
  };

  const navItems = [
    { id: 'workbench', label: '工作台', icon: LayoutDashboard, count: 0 },
    { id: 'assessment', label: '智能判定', icon: Zap, isNew: true },
    { id: 'crm', label: '客户档案', icon: Users, count: counts.myLeads },
    { id: 'pipeline', label: '进件流转', icon: GitPullRequestDraft, count: counts.inProgressCases },
    { id: 'post_loan', label: '贷后管理', icon: ShieldCheck, count: counts.postLoanAlerts || 0 },
    { id: 'products', label: '贷款产品', icon: PackageSearch, count: 0 },
    { id: 'finance', label: '提成结算', icon: Coins, count: 0 },
  ];

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 sm:px-6 flex-shrink-0 sticky top-0 z-30 shadow-xs">
      {/* Left: Brand Logo & Desktop Nav Tabs */}
      <div className="flex items-center space-x-4 lg:space-x-6">
        {/* Brand Icon */}
        <div 
          onClick={() => setCurrentNav('workbench')}
          className="flex items-center space-x-2.5 cursor-pointer select-none group"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs group-hover:bg-blue-700 transition">
            雁
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-bold text-slate-900 leading-tight">雁讯助贷 CRM</div>
            <div className="text-[10px] text-slate-400 font-mono">Mobile Card Flow</div>
          </div>
        </div>

        {/* Primary Desktop/Tablet Nav Pill Tabs (Stream-friendly) */}
        <nav className="hidden md:flex items-center space-x-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentNav(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  isActive
                    ? 'bg-white text-blue-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.isNew && (
                  <span className="text-[9px] font-bold bg-rose-500 text-white px-1 rounded-full">
                    自动
                  </span>
                )}
                {item.count !== undefined && item.count > 0 && !item.isNew && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Center: Global Quick Search Input / Spotlight Trigger */}
      <div className="flex-1 max-w-xs lg:max-w-md hidden md:block mx-3 lg:mx-6">
        <button
          type="button"
          onClick={() => setIsSearchModalOpen(true)}
          className="w-full flex items-center justify-between px-3 py-1.5 bg-slate-100/90 hover:bg-slate-100 text-slate-500 rounded-xl text-xs border border-slate-200/80 hover:border-blue-300 transition cursor-pointer shadow-2xs group"
          title="点击或按 ⌘K 快速搜索手机后4位、姓名首字母、进件单号"
        >
          <div className="flex items-center space-x-2 truncate">
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition shrink-0" />
            <span className="truncate text-slate-500 group-hover:text-slate-700">
              搜手机尾号(如 6789) / 拼音(zjx) / 单号...
            </span>
          </div>
          <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white rounded border border-slate-200 shadow-2xs shrink-0">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Controls: Intake Wizard, Masking Toggle, User Switcher */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Mobile Quick Search Button */}
        <button
          type="button"
          onClick={() => setIsSearchModalOpen(true)}
          className="md:hidden p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition cursor-pointer"
          title="全局快速搜索"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Quick Auto Intake Wizard Button */}
        <button
          onClick={onOpenWizard}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">录入客户</span>
        </button>

        {/* Loan Tools Modal */}
        <button
          onClick={onOpenTools}
          title="金融计算器与税费工具"
          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition cursor-pointer"
        >
          <Calculator className="w-4 h-4" />
        </button>

        {/* Data Masking Toggle */}
        <button
          onClick={() => setIsMasked(!isMasked)}
          className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer ${
            isMasked
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/60'
              : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100/60'
          }`}
          title="点击切换客户手机号与身份证脱敏保护"
        >
          <ShieldCheck className={`w-3.5 h-3.5 ${isMasked ? 'text-emerald-600' : 'text-amber-600'}`} />
          <span className="hidden sm:inline">{isMasked ? '已脱敏' : '明文核验'}</span>
        </button>

        {/* User Account Menu Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-slate-100 border border-slate-200 transition cursor-pointer text-left"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
              {currentUser.name.slice(0, 1)}
            </div>
            <div className="hidden lg:block text-left pr-1">
              <div className="text-xs font-bold text-slate-900 truncate max-w-[90px]">
                {currentUser.name}
              </div>
              <div className="text-[10px] text-slate-400 leading-none">
                {badge.label}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="p-2 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>{currentUser.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">{currentUser.department}</div>
              </div>

              {/* Quick Switch User Role（权限层级：仅可切换至权限不高于自己的角色账号；超管可切换任意账号） */}
              {onSwitchUser && (
                <div className="py-2 border-b border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">
                    快速切换角色账号
                  </div>
                  <div className="space-y-1">
                    {users.filter((u) => canSwitchToRole(u.role)).map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          onSwitchUser(u);
                          setShowUserMenu(false);
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between transition cursor-pointer ${
                          u.id === currentUser.id
                            ? 'bg-blue-50 text-blue-700 font-bold'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="truncate">{u.name} ({u.roleTitle.split(' ')[0]})</span>
                        {u.id === currentUser.id && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Settings & Logout（仅超管/系统管理员可见） */}
              <div className="pt-1">
                {onOpenSettings && canManageSystem(currentUser.role) && (
                  <button
                    onClick={() => {
                      onOpenSettings();
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-slate-700 hover:bg-slate-100 flex items-center space-x-2 transition cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span>系统与参数配置</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onLogout();
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-rose-600 hover:bg-rose-50 flex items-center space-x-2 transition cursor-pointer mt-1"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-500" />
                  <span>退出当前登录</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Global Command Palette & Spotlight Modal (Ctrl+K / Cmd+K) */}
      <CommandPaletteModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        currentUser={currentUser}
        currentNav={currentNav}
        onNavigate={(tab) => setCurrentNav(tab)}
        onOpenWizard={onOpenWizard}
        onOpenTools={onOpenTools}
        onOpenSettings={onOpenSettings}
        customers={customers}
        loanCases={loanCases}
        isMasked={isMasked}
        onOpenCustomerDetail={(cust) => {
          setIsSearchModalOpen(false);
          if (onOpenCustomerDetail) {
            onOpenCustomerDetail(cust);
          }
        }}
        onOpenLoanCase={(lc) => {
          setIsSearchModalOpen(false);
          if (onOpenLoanCase) {
            onOpenLoanCase(lc);
          }
        }}
        onStartCall={(cust) => {
          setIsSearchModalOpen(false);
          if (onStartCall) {
            onStartCall(cust);
          }
        }}
      />
    </header>
  );
};
