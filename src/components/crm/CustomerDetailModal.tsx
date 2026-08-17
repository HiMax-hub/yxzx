import React, { useState } from 'react';
import { 
  X, 
  PhoneCall, 
  Home, 
  Building, 
  Wallet, 
  CreditCard, 
  Clock, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Share2, 
  Send, 
  Plus, 
  Mic, 
  Play, 
  MessageSquare,
  ShieldCheck,
  RotateCcw,
  Zap,
  Sparkles
} from 'lucide-react';
import { Customer, FollowUpRecord, UserRole, IntentTag, UserAccount } from '../../types';
import { canDeleteCustomer as canDeleteCustomerRole, isFinanceAdmin as isFinanceRole } from '../../utils/permissions';
import { INTENT_TAG_CONFIGS, INTENT_TAG_LIST } from '../../utils/intentAutomation';
import { CopyButton } from '../common/CopyButton';
import { ClickablePhone } from '../common/ClickablePhone';
import { CustomerLifecycleTimeline } from './CustomerLifecycleTimeline';
import { ScriptLibraryDrawer } from '../common/ScriptLibraryDrawer';
import { AiCustomerCreditScoreCard } from './AiCustomerCreditScoreCard';
import { AiObjectionSuggestionPopover } from '../common/AiObjectionSuggestionPopover';
import { Trash2, BookOpen } from 'lucide-react';
import { LoanCase, SystemConfig } from '../../types';
import { INITIAL_SYSTEM_CONFIG } from '../../data/mockData';
import { useEscToClose } from '../../utils/useEscToClose';
import { generateAiScript, AI_SCRIPT_SCENES, AiScriptResult, AiScriptScene } from '../../utils/aiPitchAdvisor';

interface CustomerDetailModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  isMasked: boolean;
  currentUser?: UserAccount;
  loanCases?: LoanCase[];
  systemConfig?: SystemConfig;
  onStartCall: (customer: Customer) => void;
  onApplyLoan: (customer: Customer) => void;
  onSharePoster: (customer: Customer) => void;
  onAddFollowUp: (customerId: string, record: FollowUpRecord) => void;
  onReturnToPool?: (customer: Customer) => void;
  onDeleteCustomer?: (customerId: string) => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  customer,
  isOpen,
  onClose,
  isMasked,
  currentUser,
  loanCases = [],
  systemConfig,
  onStartCall,
  onApplyLoan,
  onSharePoster,
  onAddFollowUp,
  onReturnToPool,
  onDeleteCustomer,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'credit' | 'followup' | 'products'>('profile');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteType, setNewNoteType] = useState<'phone' | 'wechat' | 'visit'>('wechat');
  const [selectedIntent, setSelectedIntent] = useState<IntentTag | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isScriptDrawerOpen, setIsScriptDrawerOpen] = useState(false);
  // AI 话术卡状态
  const [aiScene, setAiScene] = useState<AiScriptScene>('first_call');
  const [aiCopied, setAiCopied] = useState(false);

  // ESC 关闭
  useEscToClose(isOpen, onClose);

  if (!isOpen || !customer) return null;

  const canDelete = canDeleteCustomerRole(currentUser?.role || 'consultant');
  const isFinance = isFinanceRole(currentUser?.role || 'consultant');

  const maskPhone = (phone: string) => {
    if (!isMasked || !phone) return phone;
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  };

  const maskIdCard = (id: string) => {
    if (!isMasked || !id) return id;
    return id.replace(/(\d{6})\d{8}(\w{4})/, '$1********$2');
  };

  const handleSelectIntent = (tagId: IntentTag) => {
    setSelectedIntent(tagId);
    const config = INTENT_TAG_CONFIGS[tagId];
    setNewNoteContent(config.defaultTemplate);
  };

  const handleApplyScript = (scriptText: string, summaryTemplate: string) => {
    setNewNoteContent((prev) => {
      if (!prev.trim()) return summaryTemplate;
      return `${prev}\n${summaryTemplate}`;
    });
  };

  const handleSaveFollowUp = () => {
    if (!newNoteContent.trim()) return;

    const record: FollowUpRecord = {
      id: `f-${Date.now()}`,
      date: new Date().toLocaleString('zh-CN', { hour12: false }),
      type: newNoteType,
      intentTag: selectedIntent || undefined,
      content: newNoteContent,
      operator: currentUser?.name || '李晓明',
      nextFollowUpDate: selectedIntent ? INTENT_TAG_CONFIGS[selectedIntent].suggestedNextTime : '2026-08-18 10:00',
    };

    onAddFollowUp(customer.id, record);
    setNewNoteContent('');
    setSelectedIntent(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 sm:bg-slate-900/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-3xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right text-[#1E293B]">
        {/* Drawer Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
              {customer.name.slice(0, 1)}
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <h2 className="text-lg font-bold text-slate-900">{customer.name}</h2>
                <CopyButton text={customer.name} title="复制客户姓名" />
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                  {customer.grade} 级意向
                </span>
                <ClickablePhone
                  phone={customer.phone}
                  customerName={customer.name}
                  isMasked={isMasked}
                  onCall={() => onStartCall(customer)}
                  size="sm"
                />
              </div>
              <div className="text-xs text-slate-500 mt-0.5 font-mono flex items-center gap-1.5 flex-wrap">
                <span>身份证: {maskIdCard(customer.idCard)}</span>
                <CopyButton text={customer.idCard} title="复制身份证号" />
                <span>· 归属顾问: {customer.ownerName}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!isFinance && (
              <button
                onClick={() => onStartCall(customer)}
                className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                title="加密外呼"
              >
                <PhoneCall className="w-4 h-4" />
              </button>
            )}
            {!isFinance && (
              <button
                onClick={() => onSharePoster(customer)}
                className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
                title="营销海报"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-200 flex space-x-6 text-xs font-semibold bg-white">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 border-b-2 transition ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            资产与资质画像
          </button>
          <button
            onClick={() => setActiveTab('credit')}
            className={`py-3 border-b-2 transition ${
              activeTab === 'credit'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            人行征信速查
          </button>
          <button
            onClick={() => setActiveTab('followup')}
            className={`py-3 border-b-2 transition ${
              activeTab === 'followup'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            跟进轨迹 ({customer.followUps.length})
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`py-3 border-b-2 transition ${
              activeTab === 'products'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            智能匹配方案 ({customer.matchedProducts.length})
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-6 text-xs">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Dynamic AI Credit & Conversion Auto-Score Component */}
              <AiCustomerCreditScoreCard customer={customer} variant="full" />

              {/* Financing Target */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="font-bold text-slate-900 text-sm mb-2">融资需求意向</div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <div className="text-slate-400">意向融资金额</div>
                    <div className="text-base font-bold font-mono text-slate-900 mt-0.5">¥{customer.requestedAmount} 万</div>
                  </div>
                  <div>
                    <div className="text-slate-400">期望借款年限</div>
                    <div className="text-base font-bold font-mono text-slate-900 mt-0.5">{customer.requestedTermYears} 年</div>
                  </div>
                  <div>
                    <div className="text-slate-400">资金用途</div>
                    <div className="text-sm font-semibold text-blue-600 mt-0.5">
                      {customer.purpose === 'business_flow' ? '企业经营周转' : customer.purpose === 'home_renovation' ? '房屋装修' : '个人消费'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Property Details */}
              {customer.property.hasProperty && (
                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                    <Home className="w-4 h-4 text-blue-600" />
                    <span>名下不动产信息 ({customer.property.ownershipType})</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
                    <div className="flex items-center gap-1">
                      <span>房产小区: <span className="font-semibold text-slate-800">{customer.property.communityName}</span></span>
                      <CopyButton text={customer.property.communityName} title="复制房产小区" />
                    </div>
                    <div>建筑面积: <span className="font-semibold text-slate-800">{customer.property.areaSqMeters} ㎡</span></div>
                    <div>预估市值: <span className="font-semibold font-mono text-slate-800">¥{customer.property.estimatedValuation} 万</span></div>
                    <div>按揭余额: <span className="font-semibold font-mono text-slate-800">¥{customer.property.mortgageBalance} 万</span></div>
                    <div>可用抵押净值空间: <span className="font-semibold font-mono text-emerald-600">¥{customer.property.availableMortgageSpace} 万</span></div>
                  </div>
                </div>
              )}

              {/* Business Details */}
              {customer.business.hasEnterprise && (
                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                    <Building className="w-4 h-4 text-indigo-600" />
                    <span>企业经营与税票资质</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
                    <div className="flex items-center gap-1">
                      <span>企业名称: <span className="font-semibold text-slate-800">{customer.business.companyName}</span></span>
                      <CopyButton text={customer.business.companyName} title="复制企业名称" />
                    </div>
                    <div>成立年限: <span className="font-semibold text-slate-800">{customer.business.operatingYears} 年</span></div>
                    <div>年开票额: <span className="font-semibold font-mono text-slate-800">¥{customer.business.annualInvoicedAmount} 万</span></div>
                    <div>纳税等级: <span className="font-semibold text-blue-600">{customer.business.taxGrade} 级</span></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'credit' && (
            <div className="space-y-4">
              <AiCustomerCreditScoreCard customer={customer} variant="full" />
              
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="font-bold text-slate-900 mb-2">人行二代征信报告摘要</div>
                <div className="grid grid-cols-2 gap-3 text-slate-600">
                  <div>当前逾期: <span className="font-semibold text-slate-800">{customer.creditSummary.hasCurrentOverdue ? '存在逾期' : '无当前逾期 (正常)'}</span></div>
                  <div>近2年连三累六: <span className="font-semibold text-slate-800">{customer.creditSummary.hasContinuous3Accumulated6 ? '有 (硬伤)' : '无'}</span></div>
                  <div>近1月查询次数: <span className="font-semibold font-mono text-slate-800">{customer.creditSummary.queryCount1Month} 次</span></div>
                  <div>近2月查询次数: <span className="font-semibold font-mono text-slate-800">{customer.creditSummary.queryCount2Month} 次</span></div>
                  <div>信用卡使用率: <span className="font-semibold font-mono text-slate-800">{customer.creditSummary.creditCardUtilizationRate}%</span></div>
                  <div>小贷网贷笔数: <span className="font-semibold font-mono text-slate-800">{customer.creditSummary.microLoanCount} 笔</span></div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'followup' && (
            <div className="space-y-4">
              {/* Customer Lifecycle Timeline Visual Component */}
              <CustomerLifecycleTimeline
                customer={customer}
                loanCases={loanCases}
              />

              {/* Add Followup Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>意向标签快捷选择 (自动触发优先级调整):</span>
                  </div>
                  
                  {/* Script Library Trigger */}
                  <button
                    type="button"
                    onClick={() => setIsScriptDrawerOpen(true)}
                    className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition flex items-center space-x-1 cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span>话术库 / 一键粘贴</span>
                  </button>
                </div>

                {/* 4 Intent Tags */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {INTENT_TAG_LIST.map((tag) => {
                    const isSelected = selectedIntent === tag.id;
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleSelectIntent(tag.id)}
                        className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                          isSelected
                            ? `${tag.color} ring-2 ring-blue-500 shadow-xs font-bold`
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
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

                {/* Automation Preview */}
                {selectedIntent && (
                  <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-800 space-y-0.5">
                    <div className="font-bold flex items-center gap-1 text-blue-900">
                      <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span>{INTENT_TAG_CONFIGS[selectedIntent].automationSummary}</span>
                    </div>
                  </div>
                )}

                {/* 3 Standard Quick Tag Buttons */}
                <div className="space-y-1">
                  <div className="text-[11px] text-slate-500 font-semibold">快捷业务场景话术:</div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setNewNoteContent('【已拒贷】客户因[近期征信查询偏多/综合评分不足]暂未通过本次银行风控初审，已向客户详细解析原因，建议养征信及降负债3个月后再申请。');
                        setSelectedIntent('invalid_number');
                      }}
                      className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold transition text-center cursor-pointer"
                    >
                      🛑 已拒贷
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNewNoteContent('【补充资料】已电话/微信通知客户补充提供：①近6个月个人银行流水 ②房产抵押原件 ③近1年企业完税证明，约定2个工作日内补齐递交。');
                        setSelectedIntent('need_callback');
                      }}
                      className="p-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 text-[11px] font-bold transition text-center cursor-pointer"
                    >
                      📑 补充资料
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNewNoteContent('【预约下周】已与客户沟通确认意向方案，预约下周一上午10:00携带身份证件与资产证明前往经办银行网点进行下户面签。');
                        setSelectedIntent('high_intent');
                      }}
                      className="p-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold transition text-center cursor-pointer"
                    >
                      📅 预约下周
                    </button>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => setNewNoteType('wechat')}
                    className={`px-3 py-1 rounded-lg text-xs transition ${
                      newNoteType === 'wechat' ? 'bg-blue-600 text-white font-medium' : 'bg-white border border-slate-200 text-slate-700'
                    }`}
                  >
                    微信沟通
                  </button>
                  <button
                    onClick={() => setNewNoteType('phone')}
                    className={`px-3 py-1 rounded-lg text-xs transition ${
                      newNoteType === 'phone' ? 'bg-blue-600 text-white font-medium' : 'bg-white border border-slate-200 text-slate-700'
                    }`}
                  >
                    电话外呼
                  </button>
                  <button
                    onClick={() => setNewNoteType('visit')}
                    className={`px-3 py-1 rounded-lg text-xs transition ${
                      newNoteType === 'visit' ? 'bg-blue-600 text-white font-medium' : 'bg-white border border-slate-200 text-slate-700'
                    }`}
                  >
                    实地面谈
                  </button>
                </div>
                {/* 常用话术与异议原因模板下拉选择器 */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                      <span>常用跟进话术 / 异议原因预设:</span>
                    </span>
                    <span className="text-[10px] text-slate-400">选择即刻自动填入</span>
                  </div>
                  <select
                    value=""
                    onChange={(e) => {
                      const allTemplates = systemConfig?.followUpTemplates || INITIAL_SYSTEM_CONFIG.followUpTemplates || [];
                      const tpl = allTemplates.find((t) => t.id === e.target.value);
                      if (tpl) {
                        setNewNoteContent(tpl.content);
                        if (tpl.category === 'objection') setSelectedIntent('need_callback');
                        if (tpl.category === 'appointment') setSelectedIntent('high_intent');
                        if (tpl.category === 'materials') setSelectedIntent('need_callback');
                      }
                    }}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
                  >
                    <option value="" disabled>-- 快速选择常用话术或客户拒绝/异议模板 --</option>
                    <optgroup label="🚨 客户异议与拒绝原因">
                      {(systemConfig?.followUpTemplates || INITIAL_SYSTEM_CONFIG.followUpTemplates || [])
                        .filter((t) => t.category === 'objection')
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="📞 外呼沟通与未接回访">
                      {(systemConfig?.followUpTemplates || INITIAL_SYSTEM_CONFIG.followUpTemplates || [])
                        .filter((t) => t.category === 'phone')
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="📋 资料补件与进件报审">
                      {(systemConfig?.followUpTemplates || INITIAL_SYSTEM_CONFIG.followUpTemplates || [])
                        .filter((t) => t.category === 'materials')
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="🤝 面签邀约与银行下户">
                      {(systemConfig?.followUpTemplates || INITIAL_SYSTEM_CONFIG.followUpTemplates || [])
                        .filter((t) => t.category === 'appointment')
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="🌿 日常关怀与政策推送">
                      {(systemConfig?.followUpTemplates || INITIAL_SYSTEM_CONFIG.followUpTemplates || [])
                        .filter((t) => t.category === 'general')
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                    </optgroup>
                  </select>
                </div>

                <textarea
                  rows={3}
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="记录沟通要点、客户资金紧急程度、银行意向或资料收集进度（输入客户拒绝原因可自动推荐安抚话术）..."
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-xs"
                />

                {/* AI Objection Handling Suggestions */}
                <AiObjectionSuggestionPopover
                  currentText={newNoteContent}
                  onApplyScript={(script, summary) => {
                    setNewNoteContent(summary || script);
                  }}
                />

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveFollowUp}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition cursor-pointer"
                  >
                    保存跟进
                  </button>
                </div>
              </div>

              {/* Followup Timeline */}
              <div className="space-y-3 pt-2">
                {customer.followUps.map((item) => (
                  <div key={item.id} className="p-3 bg-white rounded-xl border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-700">{item.operator} ({item.type === 'phone' ? '电话' : item.type === 'wechat' ? '微信' : '系统'})</span>
                      <span>{item.date}</span>
                    </div>
                    <p className="text-slate-800 leading-relaxed">{item.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-3">
              {/* AI 客户专属话术卡（基于客户真实画像动态生成） */}
              {(() => {
                const aiScript: AiScriptResult = generateAiScript(customer, aiScene);
                return (
                  <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-600">
                          <Sparkles className="w-4 h-4" />
                        </span>
                        <div>
                          <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                            <span>AI 客户专属话术</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold">实时生成</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">{aiScript.title}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(aiScript.script);
                            setAiCopied(true);
                            setTimeout(() => setAiCopied(false), 2000);
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer ${
                            aiCopied ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{aiCopied ? '已复制' : '复制'}</span>
                        </button>
                        <button
                          onClick={() => {
                            setNewNoteType('phone');
                            setNewNoteContent(`【AI${aiScript.sceneLabel}话术】\n${aiScript.script}`);
                            setActiveTab('followup');
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center space-x-1 cursor-pointer"
                          title="填入跟进记录（可编辑后提交）"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>填入跟进</span>
                        </button>
                      </div>
                    </div>

                    {/* 场景切换 */}
                    <div className="flex flex-wrap gap-1.5">
                      {AI_SCRIPT_SCENES.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setAiScene(s.id)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                            aiScene === s.id
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'
                          }`}
                          title={s.desc}
                        >
                          {s.icon} {s.label}
                        </button>
                      ))}
                    </div>

                    {/* 话术正文 */}
                    <div className="p-3 rounded-lg bg-white border border-indigo-100 text-[11px] leading-relaxed text-slate-700 whitespace-pre-line">
                      {aiScript.script}
                    </div>

                    {/* 使用要点 + 合规提示 */}
                    {aiScript.tips.length > 0 && (
                      <div className="flex items-start space-x-1.5 text-[10px] text-slate-500">
                        <Zap className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                        <span>要点：{aiScript.tips.join('；')}</span>
                      </div>
                    )}
                    {aiScript.complianceNote && (
                      <div className="flex items-start space-x-1.5 text-[10px] text-rose-500">
                        <ShieldCheck className="w-3 h-3 shrink-0 mt-0.5" />
                        <span>合规提示：{aiScript.complianceNote}</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {customer.matchedProducts.map((p) => (
                <div key={p.id} className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-blue-600 font-semibold">{p.bankName}</div>
                      <div className="font-bold text-slate-900 text-sm">{p.productName}</div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                      匹配度 {p.matchScore}%
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-slate-600">
                    <div>参考利率: <span className="font-bold font-mono text-blue-600">{p.interestRateRange}</span></div>
                    <div>最高额度: <span className="font-bold font-mono text-slate-800">¥{p.maxAmount}万</span></div>
                    <div>最长年限: <span className="font-bold font-mono text-slate-800">{p.maxTermYears}年</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            {!isFinance && (
              <button
                onClick={() => onApplyLoan(customer)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-sm transition cursor-pointer"
              >
                一键发起银行报审进件
              </button>
            )}

            {canDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-semibold transition flex items-center space-x-1 cursor-pointer"
                title="管理员删除客户"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>删除客户档案</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-medium transition cursor-pointer"
          >
            关闭
          </button>
        </div>

        {/* Delete Confirmation inside drawer */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-60 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-3">
              <div className="flex items-center space-x-2 text-rose-600 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>确认删除【{customer.name}】？</span>
              </div>
              <p className="text-xs text-slate-600">
                此操作将永久抹除客户档案、资产评估及所有跟进进件记录，不可撤销。
              </p>
              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs cursor-pointer"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    if (onDeleteCustomer) onDeleteCustomer(customer.id);
                    setShowDeleteConfirm(false);
                    onClose();
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>确认彻底删除</span>
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Embedded Script Library Drawer */}
        <ScriptLibraryDrawer
          isOpen={isScriptDrawerOpen}
          onClose={() => setIsScriptDrawerOpen(false)}
          onApplyScript={handleApplyScript}
        />
      </div>
    </div>
  );
};
