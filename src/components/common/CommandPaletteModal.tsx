import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  X, 
  Users, 
  FileText, 
  Phone, 
  ArrowRight, 
  Building, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  ChevronRight,
  ExternalLink,
  PhoneCall,
  Zap,
  Tag,
  AlertCircle,
  PlusCircle,
  Calculator,
  LayoutDashboard,
  GitPullRequestDraft,
  Coins,
  PackageSearch,
  Settings,
  Download,
  Command,
  CornerDownLeft,
  ArrowUpDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Customer, LoanCase, UserAccount } from '../../types';
import { matchCustomer, matchLoanCase, getPinyinInitials } from '../../utils/pinyinUtils';
import { useEscToClose } from '../../utils/useEscToClose';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  currentNav: string;
  onNavigate: (tab: string) => void;
  onOpenWizard: () => void;
  onOpenTools: () => void;
  onOpenSettings?: () => void;
  customers: Customer[];
  loanCases: LoanCase[];
  isMasked: boolean;
  onOpenCustomerDetail?: (customer: Customer) => void;
  onOpenLoanCase?: (loanCase: LoanCase) => void;
  onStartCall?: (customer: Customer) => void;
}

interface PaletteAction {
  id: string;
  category: 'action' | 'navigation' | 'customer' | 'case';
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  iconColor?: string;
  badge?: string;
  shortcut?: string;
  perform: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentNav,
  onNavigate,
  onOpenWizard,
  onOpenTools,
  onOpenSettings,
  customers,
  loanCases,
  isMasked,
  onOpenCustomerDetail,
  onOpenLoanCase,
  onStartCall,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEscToClose(isOpen, onClose);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Base Quick Actions and Navigation
  const baseActions: PaletteAction[] = useMemo(() => {
    return [
      {
        id: 'action-intake',
        category: 'action',
        title: '新建客户档案与进件申请',
        subtitle: '打开客户进件录单向导 (Customer Intake Wizard)',
        icon: PlusCircle,
        iconColor: 'text-blue-600 bg-blue-50',
        badge: '快捷操作',
        shortcut: 'N',
        perform: () => {
          onClose();
          onOpenWizard();
        },
      },
      {
        id: 'action-calc',
        category: 'action',
        title: '助贷利息与税费计算器',
        subtitle: '房贷月供、等额本息/先息后本、税费与过桥成本推算',
        icon: Calculator,
        iconColor: 'text-indigo-600 bg-indigo-50',
        badge: '展业工具',
        shortcut: 'C',
        perform: () => {
          onClose();
          onOpenTools();
        },
      },
      {
        id: 'nav-workbench',
        category: 'navigation',
        title: '工作台总览 (Workbench)',
        subtitle: '个人看板、今日工作待办、待办跟进与业绩大盘',
        icon: LayoutDashboard,
        iconColor: 'text-slate-700 bg-slate-100',
        badge: currentNav === 'workbench' ? '当前页面' : '模块跳转',
        shortcut: '1',
        perform: () => {
          onClose();
          onNavigate('workbench');
        },
      },
      {
        id: 'nav-assessment',
        category: 'navigation',
        title: '智能初审与银行准入判定 (Assessment)',
        subtitle: '征信多头查询、负债率红线、房产抵押成数智能测算',
        icon: Zap,
        iconColor: 'text-amber-600 bg-amber-50',
        badge: currentNav === 'assessment' ? '当前页面' : '模块跳转',
        shortcut: '2',
        perform: () => {
          onClose();
          onNavigate('assessment');
        },
      },
      {
        id: 'nav-crm',
        category: 'navigation',
        title: '客户公私海档案管理 (CRM)',
        subtitle: '私海客户、公共公海池、意向等级划分与批量流转',
        icon: Users,
        iconColor: 'text-blue-600 bg-blue-50',
        badge: currentNav === 'crm' ? '当前页面' : '模块跳转',
        shortcut: '3',
        perform: () => {
          onClose();
          onNavigate('crm');
        },
      },
      {
        id: 'nav-pipeline',
        category: 'navigation',
        title: '进件流转与银行审批看板 (Pipeline)',
        subtitle: '全流程六阶段漏斗：资质初审→资料收集→报审→下户→批复→放款',
        icon: GitPullRequestDraft,
        iconColor: 'text-purple-600 bg-purple-50',
        badge: currentNav === 'pipeline' ? '当前页面' : '模块跳转',
        shortcut: '4',
        perform: () => {
          onClose();
          onNavigate('pipeline');
        },
      },
      {
        id: 'nav-postloan',
        category: 'navigation',
        title: '贷后资产管理与巡检预警 (Post-Loan)',
        subtitle: '在贷台账、还款计划核销、贷后回访与展期转贷',
        icon: ShieldCheck,
        iconColor: 'text-emerald-600 bg-emerald-50',
        badge: currentNav === 'post_loan' ? '当前页面' : '模块跳转',
        shortcut: '5',
        perform: () => {
          onClose();
          onNavigate('post_loan');
        },
      },
      {
        id: 'nav-products',
        category: 'navigation',
        title: '合作银行贷款产品库 (Products)',
        subtitle: '抵押贷、小微税票贷、工薪消费贷准入政策查询与对比',
        icon: PackageSearch,
        iconColor: 'text-orange-600 bg-orange-50',
        badge: currentNav === 'products' ? '当前页面' : '模块跳转',
        shortcut: '6',
        perform: () => {
          onClose();
          onNavigate('products');
        },
      },
      {
        id: 'nav-finance',
        category: 'navigation',
        title: '财务结算与佣金提成 (Finance)',
        subtitle: '服务费收缴、定金与尾款核销、顾问阶梯提成与导出月报',
        icon: Coins,
        iconColor: 'text-teal-600 bg-teal-50',
        badge: currentNav === 'finance' ? '当前页面' : '模块跳转',
        shortcut: '7',
        perform: () => {
          onClose();
          onNavigate('finance');
        },
      },
      ...(onOpenSettings
        ? [
            {
              id: 'action-settings',
              category: 'action' as const,
              title: '企业系统设置与策略总控 (System Settings)',
              subtitle: '用户权限、公海回收规则、阶梯提成档位、常用话术模板管理',
              icon: Settings,
              iconColor: 'text-slate-600 bg-slate-100',
              badge: '管理设置',
              shortcut: 'S',
              perform: () => {
                onClose();
                onOpenSettings();
              },
            },
          ]
        : []),
    ];
  }, [currentNav, onNavigate, onOpenWizard, onOpenTools, onOpenSettings, onClose]);

  // Customer & Loan Case matching actions
  const searchResults = useMemo(() => {
    const cleanQuery = query.trim();
    if (!cleanQuery) {
      return baseActions;
    }

    const lowerQuery = cleanQuery.toLowerCase();

    // 1. Filter base actions by title/subtitle/category
    const matchedBase = baseActions.filter((action) => {
      const matchText = `${action.title} ${action.subtitle || ''} ${action.badge || ''}`.toLowerCase();
      return matchText.includes(lowerQuery) || getPinyinInitials(action.title).includes(lowerQuery);
    });

    // 2. Search matched customers (up to 8 items)
    const customerActions: PaletteAction[] = customers
      .map((c) => {
        const match = matchCustomer(c.name, c.phone, cleanQuery, c.notes);
        return { customer: c, match };
      })
      .filter((item) => item.match.isMatch)
      .slice(0, 8)
      .map(({ customer }) => {
        const maskedPhone = isMasked
          ? customer.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
          : customer.phone;
        return {
          id: `cust-${customer.id}`,
          category: 'customer' as const,
          title: `${customer.name} · ${customer.grade}级客群`,
          subtitle: `电话: ${maskedPhone} | 意向金额: ¥${customer.requestedAmount || 0}万 | 归属: ${customer.ownerName || '公海'}`,
          icon: Users,
          iconColor: 'text-blue-600 bg-blue-50',
          badge: `${customer.grade}级`,
          perform: () => {
            onClose();
            if (onOpenCustomerDetail) {
              onOpenCustomerDetail(customer);
            } else {
              onNavigate('crm');
            }
          },
        };
      });

    // 3. Search matched loan cases (up to 6 items)
    const caseActions: PaletteAction[] = loanCases
      .map((l) => {
        const match = matchLoanCase(
          l.caseNumber || l.id,
          l.customerName,
          l.customerPhone,
          l.productName,
          l.lenderInstitution || l.lenderBank || '',
          cleanQuery
        );
        return { loanCase: l, match };
      })
      .filter((item) => item.match.isMatch)
      .slice(0, 6)
      .map(({ loanCase }) => {
        return {
          id: `case-${loanCase.id}`,
          category: 'case' as const,
          title: `工单 ${loanCase.caseNumber || loanCase.id} · ${loanCase.customerName}`,
          subtitle: `资方: ${loanCase.lenderBank || '待定'} | 产品: ${loanCase.productName} | 金额: ¥${loanCase.approvedAmount || loanCase.appliedAmount}万`,
          icon: FileText,
          iconColor: 'text-purple-600 bg-purple-50',
          badge: loanCase.stage,
          perform: () => {
            onClose();
            if (onOpenLoanCase) {
              onOpenLoanCase(loanCase);
            } else {
              onNavigate('pipeline');
            }
          },
        };
      });

    return [...matchedBase, ...customerActions, ...caseActions];
  }, [query, baseActions, customers, loanCases, isMasked, onOpenCustomerDetail, onOpenLoanCase, onNavigate, onClose]);

  // Adjust selected index when list changes
  useEffect(() => {
    setSelectedIndex((prev) => {
      if (searchResults.length === 0) return 0;
      return Math.min(prev, searchResults.length - 1);
    });
  }, [searchResults.length]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Keyboard navigation inside modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults[selectedIndex]) {
        searchResults[selectedIndex].perform();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-3 sm:px-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Palette Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -10 }}
        transition={{ duration: 0.15 }}
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[82vh] z-10"
      >
        {/* Search Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 bg-slate-50/70 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs shrink-0">
            <Command className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>

          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="输入命令、功能、模块名称或客户/工单拼音搜索 (如: 进件、新建、张三、138)..."
              className="w-full bg-transparent text-slate-900 placeholder-slate-400 text-sm sm:text-base font-medium focus:outline-none"
            />
          </div>

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSelectedIndex(0);
              }}
              className="p-1 text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="hidden sm:flex items-center space-x-1 text-[11px] text-slate-400 bg-white px-2 py-1 rounded-lg border border-slate-200">
            <span>ESC 关闭</span>
          </div>
        </div>

        {/* Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-slate-100/50">
          {searchResults.length === 0 ? (
            <div className="p-10 text-center text-slate-400">
              <Search className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-600">未找到匹配的命令或客户/工单</p>
              <p className="text-xs text-slate-400 mt-1">请尝试更换关键字或使用拼音首字母搜索</p>
            </div>
          ) : (
            searchResults.map((action, index) => {
              const isSelected = index === selectedIndex;
              const Icon = action.icon;
              return (
                <div
                  key={action.id}
                  data-index={index}
                  onClick={action.perform}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition ${
                    isSelected
                      ? 'bg-blue-50/90 text-blue-900 border border-blue-200/80 shadow-2xs'
                      : 'hover:bg-slate-50 text-slate-800 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div
                      className={`p-2 rounded-xl shrink-0 transition ${
                        action.iconColor || 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs sm:text-sm font-bold truncate">
                          {action.title}
                        </span>
                        {action.badge && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold shrink-0 ${
                            isSelected ? 'bg-blue-200/60 text-blue-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {action.badge}
                          </span>
                        )}
                      </div>
                      {action.subtitle && (
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {action.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 pl-3">
                    {action.shortcut && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-white border border-slate-200 text-slate-500 rounded font-semibold">
                        {action.shortcut}
                      </span>
                    )}
                    <div className={`p-1 rounded transition ${isSelected ? 'text-blue-600 opacity-100' : 'text-slate-300 opacity-0 group-hover:opacity-60'}`}>
                      <CornerDownLeft className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Hints */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">↓</kbd>
              <span>选择</span>
            </span>
            <span className="flex items-center space-x-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">Enter</kbd>
              <span>执行</span>
            </span>
            <span className="flex items-center space-x-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">Esc</kbd>
              <span>关闭</span>
            </span>
          </div>

          <div className="hidden sm:flex items-center space-x-1 text-slate-400">
            <span>支持拼音缩写 & 模糊检索</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
