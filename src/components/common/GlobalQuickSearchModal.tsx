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
  AlertCircle
} from 'lucide-react';
import { Customer, LoanCase } from '../../types';
import { matchCustomer, matchLoanCase, getPinyinInitials } from '../../utils/pinyinUtils';
import { ClickablePhone } from './ClickablePhone';

interface GlobalQuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  loanCases: LoanCase[];
  isMasked: boolean;
  onOpenCustomerDetail: (customer: Customer) => void;
  onOpenLoanCase?: (loanCase: LoanCase) => void;
  onStartCall?: (customer: Customer) => void;
  onNavigateToPipeline?: (caseId?: string) => void;
}

import { useEscToClose } from '../../utils/useEscToClose';

export const GlobalQuickSearchModal: React.FC<GlobalQuickSearchModalProps> = ({
  isOpen,
  onClose,
  customers,
  loanCases,
  isMasked,
  onOpenCustomerDetail,
  onOpenLoanCase,
  onStartCall,
  onNavigateToPipeline,
}) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'customer' | 'case'>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  // ESC 关闭
  useEscToClose(isOpen, onClose);

  // Focus input automatically when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Global hotkey (Escape to close, Cmd+K / Ctrl+K handling)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Search matches
  const searchResults = useMemo(() => {
    const cleanQuery = query.trim();
    if (!cleanQuery) {
      return { matchedCustomers: [], matchedCases: [] };
    }

    const matchedCustomers = customers
      .map((c) => {
        const match = matchCustomer(c.name, c.phone, cleanQuery, c.notes);
        return { customer: c, match };
      })
      .filter((item) => item.match.isMatch);

    const matchedCases = loanCases
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
      .filter((item) => item.match.isMatch);

    return { matchedCustomers, matchedCases };
  }, [query, customers, loanCases]);

  const totalResultsCount =
    searchResults.matchedCustomers.length + searchResults.matchedCases.length;

  if (!isOpen) return null;

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case 'pre_screen':
        return { label: '资质初审', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'docs_collection':
        return { label: '资料收集', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'submission':
        return { label: '报审银行', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'interview_visit':
        return { label: '下户面签', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'approval':
        return { label: '审批批复', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'disbursement':
        return { label: '放款结算', color: 'bg-teal-50 text-teal-700 border-teal-200' };
      default:
        return { label: '审批中', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const getGradeBadgeColor = (grade: string) => {
    switch (grade) {
      case 'S':
        return 'bg-red-50 text-red-600 border-red-200 font-black';
      case 'A':
        return 'bg-amber-50 text-amber-600 border-amber-200 font-bold';
      case 'B':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-3 sm:px-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Backdrop click to close */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Main Spotlight Modal Box */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[82vh] z-10">
        
        {/* Search Header Input */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200/80 bg-slate-50/70 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>

          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="快速搜索: 手机后4位 (如 6789) / 姓名首字母 (如 zjx) / 进件单号..."
              className="w-full bg-white border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-3.5 py-2 text-sm sm:text-base text-slate-800 placeholder-slate-400 outline-none transition"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
            title="关闭 (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Suggestion Pills & Category Filters */}
        <div className="px-4 py-2 border-b border-slate-100 bg-white flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center space-x-1.5 overflow-x-auto py-0.5">
            <span className="text-slate-400 font-medium text-[11px] whitespace-nowrap">快捷筛选:</span>
            {[
              { id: 'all', label: `全部结果 (${totalResultsCount})` },
              { id: 'customer', label: `客户画像 (${searchResults.matchedCustomers.length})` },
              { id: 'case', label: `进件审批单 (${searchResults.matchedCases.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  activeCategory === tab.id
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Quick Search Tag Examples when input is empty */}
          {!query && (
            <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 overflow-x-auto">
              <span className="text-slate-400">试一试:</span>
              <button
                onClick={() => setQuery('6789')}
                className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/60 cursor-pointer font-mono"
              >
                尾号 6789
              </button>
              <button
                onClick={() => setQuery('zjx')}
                className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/60 cursor-pointer font-mono"
              >
                拼音 zjx
              </button>
              <button
                onClick={() => setQuery('001')}
                className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/60 cursor-pointer font-mono"
              >
                单号 001
              </button>
            </div>
          )}
        </div>

        {/* Search Results Scroll Area */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-4 min-h-[220px]">
          
          {/* Empty Query State (Initial Guide) */}
          {!query.trim() && (
            <div className="py-8 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">全局多维秒级定位</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                无需在各个菜单反复翻找，支持直接输入<strong className="text-slate-700 font-semibold">手机号后4位</strong>、
                <strong className="text-slate-700 font-semibold">姓名拼音首字母 (如: gxm)</strong>、
                <strong className="text-slate-700 font-semibold">借款人姓名</strong>或
                <strong className="text-slate-700 font-semibold">进件单号</strong>，点击即达详情画像。
              </p>
              
              {/* Quick Recent / Featured Candidates */}
              <div className="mt-6 text-left max-w-lg mx-auto">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>近期活跃客户直达候选</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {customers.slice(0, 4).map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        onClose();
                        onOpenCustomerDetail(c);
                      }}
                      className="p-2.5 rounded-xl border border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/40 transition cursor-pointer flex items-center justify-between group"
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs group-hover:bg-blue-600 group-hover:text-white transition">
                          {c.name.slice(0, 1)}
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-bold text-slate-800 flex items-center space-x-1">
                            <span>{c.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono font-normal">
                              ({getPinyinInitials(c.name)})
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            尾号 {c.phone.slice(-4)}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 transition" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* No Matches Found */}
          {query.trim() && totalResultsCount === 0 && (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">未找到与 "{query}" 匹配的内容</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                请检查手机号或拼音首字母是否正确。支持如 "0011"（手机尾号）、"zjx"（张锦祥首字母）或 "001"（单号）。
              </p>
            </div>
          )}

          {/* Customer Matches Section */}
          {query.trim() && (activeCategory === 'all' || activeCategory === 'customer') && searchResults.matchedCustomers.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>匹配的客户档案 ({searchResults.matchedCustomers.length})</span>
                </div>
                <span className="text-[10px] text-slate-400">点击直接打开360°客户画像</span>
              </div>

              <div className="space-y-2">
                {searchResults.matchedCustomers.map(({ customer, match }) => {
                  const initials = getPinyinInitials(customer.name);
                  const last4 = customer.phone.slice(-4);
                  return (
                    <div
                      key={customer.id}
                      onClick={() => {
                        onClose();
                        onOpenCustomerDetail(customer);
                      }}
                      className="p-3 bg-white hover:bg-blue-50/50 rounded-xl border border-slate-200/90 hover:border-blue-400 transition cursor-pointer shadow-2xs group flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition">
                          {customer.name.slice(0, 1)}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center space-x-2 flex-wrap">
                            <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
                              {customer.name}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                              首字母: {initials}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded border ${getGradeBadgeColor(customer.grade)}`}>
                              {customer.grade} 级意向
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              尾号: <strong className="text-blue-600 font-bold">{last4}</strong>
                            </span>
                          </div>

                          <div className="text-xs text-slate-500 mt-1 flex items-center space-x-2 flex-wrap">
                            <span>意向: <strong className="text-slate-800">¥{customer.requestedAmount}万</strong></span>
                            <span>•</span>
                            <span>{customer.property?.hasProperty ? `房产估值 ¥${customer.property.estimatedValuation}万` : customer.business?.hasEnterprise ? `企业年开票 ¥${customer.business.annualInvoicedAmount}万` : '工薪公积金客户'}</span>
                            <span>•</span>
                            <span className="text-slate-400">归属: {customer.ownerName}</span>
                          </div>

                          {/* Match Highlight Reason */}
                          {match.matchHighlight && (
                            <div className="mt-1.5 flex items-center space-x-1 text-[11px] text-emerald-700 font-medium bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md inline-flex">
                              <Zap className="w-3 h-3 text-emerald-600" />
                              <span>{match.matchHighlight}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Action buttons */}
                      <div className="flex items-center space-x-1.5 shrink-0 self-end sm:self-center">
                        {onStartCall && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onClose();
                              onStartCall(customer);
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-600 transition cursor-pointer text-xs flex items-center space-x-1"
                            title="一键拨号"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                            <span className="text-[11px]">外呼</span>
                          </button>
                        )}

                        <button
                          type="button"
                          className="px-2.5 py-1.5 rounded-lg bg-blue-600 group-hover:bg-blue-700 text-white text-xs font-semibold flex items-center space-x-1 transition shadow-2xs"
                        >
                          <span>查看画像</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Loan Cases Matches Section */}
          {query.trim() && (activeCategory === 'all' || activeCategory === 'case') && searchResults.matchedCases.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  <span>匹配的进件审批单 ({searchResults.matchedCases.length})</span>
                </div>
                <span className="text-[10px] text-slate-400">点击直达进件流转台</span>
              </div>

              <div className="space-y-2">
                {searchResults.matchedCases.map(({ loanCase, match }) => {
                  const stageBadge = getStageBadge(loanCase.stage);
                  const matchingCustomer = customers.find((c) => c.id === loanCase.customerId);
                  return (
                    <div
                      key={loanCase.id}
                      onClick={() => {
                        onClose();
                        if (onNavigateToPipeline) {
                          onNavigateToPipeline(loanCase.id);
                        } else if (matchingCustomer) {
                          onOpenCustomerDetail(matchingCustomer);
                        }
                      }}
                      className="p-3 bg-white hover:bg-indigo-50/50 rounded-xl border border-slate-200/90 hover:border-indigo-400 transition cursor-pointer shadow-2xs group flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition">
                          <Building className="w-4 h-4" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center space-x-2 flex-wrap">
                            <span className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition">
                              {loanCase.customerName}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                              {loanCase.caseNumber || loanCase.id}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded border font-semibold ${stageBadge.color}`}>
                              {stageBadge.label}
                            </span>
                          </div>

                          <div className="text-xs text-slate-600 mt-1 flex items-center space-x-2 flex-wrap">
                            <span className="font-semibold text-slate-800">{loanCase.productName}</span>
                            <span>•</span>
                            <span>申报额度: <strong className="text-indigo-600 font-mono font-bold">¥{loanCase.appliedAmount}万</strong></span>
                            <span>•</span>
                            <span className="text-slate-400">经办行: {loanCase.lenderInstitution || loanCase.lenderBank}</span>
                            <span>•</span>
                            <span className="text-slate-400">顾问: {loanCase.consultantName}</span>
                          </div>

                          {/* Substage & match reason */}
                          <div className="mt-1 flex items-center space-x-2 flex-wrap">
                            {match.matchHighlight && (
                              <span className="text-[11px] text-indigo-700 font-medium bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                                <Zap className="w-3 h-3 text-indigo-600" />
                                {match.matchHighlight}
                              </span>
                            )}
                            <span className="text-[11px] text-slate-400 truncate max-w-md">
                              进度: {loanCase.subStageStatus}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right direct jump button */}
                      <div className="shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-600 group-hover:bg-indigo-700 text-white text-xs font-semibold flex items-center space-x-1 transition shadow-2xs"
                        >
                          <span>查看工单</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Footer Shortcut Tips */}
        <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center space-x-3">
            <span>按 <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-600 font-mono shadow-2xs">ESC</kbd> 退出</span>
            <span>按 <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-600 font-mono shadow-2xs">⌘K</kbd> 随时唤起</span>
          </div>
          <div className="text-slate-500 font-medium">
            全库客户与进件实时极速索引
          </div>
        </div>

      </div>
    </div>
  );
};
