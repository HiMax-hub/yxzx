import React, { useState, useEffect } from 'react';
import { 
  X, 
  PhoneCall, 
  PhoneOff, 
  Mic, 
  Clock, 
  ShieldCheck, 
  Volume2, 
  CheckCircle2, 
  MessageSquare,
  Zap,
  Sparkles,
  ArrowRight,
  Flame,
  AlertTriangle,
  Bot,
  Copy,
  Check,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Send,
  BookOpen
} from 'lucide-react';
import { Customer, FollowUpRecord, IntentTag, CallRecord, CallOutcome } from '../../types';
import { INTENT_TAG_CONFIGS, INTENT_TAG_LIST } from '../../utils/intentAutomation';
import { generateAiIcebreakerAndAdvice, AiPitchSuggestion } from '../../utils/aiPitchAdvisor';
import { useEscToClose } from '../../utils/useEscToClose';
import { ScriptLibraryDrawer } from './ScriptLibraryDrawer';
import { AiObjectionSuggestionPopover } from './AiObjectionSuggestionPopover';
import { SmartPitchGuideSidebar } from './SmartPitchGuideSidebar';
import { isInDoNotDisturbTime, getDoNotDisturbMessage, isCallLimitExceeded, DAILY_CALL_LIMIT_PER_PHONE, detectViolationKeywords } from '../../utils/compliance';

interface VirtualCallModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveFollowUp: (customerId: string, record: FollowUpRecord) => void;
  onRecordCall?: (record: CallRecord) => void;
  callRecords?: CallRecord[];
  currentUserName?: string;
}

export const VirtualCallModal: React.FC<VirtualCallModalProps> = ({
  customer,
  isOpen,
  onClose,
  onSaveFollowUp,
  onRecordCall,
  callRecords = [],
  currentUserName = '当前顾问',
}) => {
  const [callState, setCallState] = useState<'dialing' | 'connected' | 'ended'>('dialing');
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [selectedIntent, setSelectedIntent] = useState<IntentTag>('high_intent');
  const [disposition, setDisposition] = useState(INTENT_TAG_CONFIGS.high_intent.defaultTemplate);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [isAiAdviceExpanded, setIsAiAdviceExpanded] = useState(true);
  const [isRegeneratingAi, setIsRegeneratingAi] = useState(false);
  const [isScriptDrawerOpen, setIsScriptDrawerOpen] = useState(false);
  const [isSmartGuideOpen, setIsSmartGuideOpen] = useState(false);

  // ESC 关闭
  useEscToClose(isOpen, onClose);
  // 外呼结果标签：connected=接通（已挂断后自动选）；未接通需选择原因
  const [callOutcome, setCallOutcome] = useState<CallOutcome>('connected');
  // 合规校验提示
  const [complianceNotice, setComplianceNotice] = useState<{ type: 'dnd' | 'limit' | 'violation'; message: string } | null>(null);

  // 未接通结果的回拨计划文案（自动生成）
  const outcomeCallbackMap: Record<Exclude<CallOutcome, 'connected'>, string> = {
    no_answer: '明日 09:30',
    rejected: '明日 14:00',
    busy: '明日 10:00',
    invalid_number: '',
    callback_request: '今日 16:00',
  };

  useEffect(() => {
    if (isOpen && customer) {
      setCallState('dialing');
      setDurationSeconds(0);
      setSelectedIntent('high_intent');
      setDisposition(INTENT_TAG_CONFIGS.high_intent.defaultTemplate);
      setIsAiAdviceExpanded(true);
      setIsScriptDrawerOpen(false);
      setCallOutcome('connected');
      setComplianceNotice(null);

      // 合规预检：勿扰时段 + 当日频次上限（电销监管红线）
      if (isInDoNotDisturbTime()) {
        setComplianceNotice({ type: 'dnd', message: getDoNotDisturbMessage() });
        setCallState('ended');
        return;
      }
      if (isCallLimitExceeded(callRecords, customer.phone)) {
        setComplianceNotice({
          type: 'limit',
          message: `该号码今日外呼已达上限（${DAILY_CALL_LIMIT_PER_PHONE} 次/日，防骚扰合规限制）。请明日再联系或通过其他合规渠道跟进。`,
        });
        setCallState('ended');
        return;
      }
      // 正式版：不自动接通，由顾问使用工作话机拨打后手动点击“已接通·开始计时”
    }
  }, [isOpen, customer]);

  useEffect(() => {
    let interval: any = null;
    if (callState === 'connected') {
      interval = setInterval(() => {
        setDurationSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState]);

  if (!isOpen || !customer) return null;

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSec = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSec.toString().padStart(2, '0')}`;
  };

  const handleHangup = () => {
    setCallState('ended');
    // 挂断视为已接通（有通话时长），未接通场景由结果标签选择
    if (durationSeconds > 0) {
      setCallOutcome('connected');
    }
  };

  const handleSelectOutcome = (outcome: CallOutcome) => {
    setCallOutcome(outcome);
  };

  const handleSelectIntentTag = (tag: IntentTag) => {
    setSelectedIntent(tag);
    const config = INTENT_TAG_CONFIGS[tag];
    setDisposition(config.defaultTemplate);
  };

  const currentIntentConfig = INTENT_TAG_CONFIGS[selectedIntent];
  const aiAdvice: AiPitchSuggestion = generateAiIcebreakerAndAdvice(customer, selectedIntent);

  const handleCopyText = (text: string, sectionKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionKey);
    setTimeout(() => {
      setCopiedSection(null);
    }, 2000);
  };

  const handleApplyAiOpeningToDisposition = (openingText: string) => {
    setDisposition((prev) => {
      const prefix = `[电销开场沟通] ${openingText}\n[客户反馈] `;
      return prefix;
    });
  };

  const handleApplyScriptToDisposition = (scriptText: string, summaryTemplate: string) => {
    setDisposition((prev) => {
      if (!prev.trim()) return summaryTemplate;
      return `${prev}\n${summaryTemplate}`;
    });
  };

  const handleRegenerateAi = () => {
    setIsRegeneratingAi(true);
    setTimeout(() => {
      setIsRegeneratingAi(false);
    }, 400);
  };

  const handleSaveAndClose = () => {
    // 合规红线：纪要中的违规敏感词检测（承诺批贷/绝对化用语）
    const violations = detectViolationKeywords(disposition);
    if (violations.some((v) => v.level === 'red')) {
      setComplianceNotice({
        type: 'violation',
        message: `⚠️ 纪要包含监管红线话术【${violations.filter((v) => v.level === 'red').map((v) => v.word).join('、')}】。请修改后保存（含承诺性表述将被审计追责）。`,
      });
      return;
    }

    const record: FollowUpRecord = {
      id: `f-${Date.now()}`,
      date: new Date().toLocaleString('zh-CN', { hour12: false }),
      type: 'phone',
      intentTag: selectedIntent,
      content: `[智能外呼通话 ${formatDuration(durationSeconds)}] 意向标签:【${currentIntentConfig.label}】。纪要：${disposition}`,
      operator: currentUserName,
      nextFollowUpDate: currentIntentConfig.suggestedNextTime,
    };

    onSaveFollowUp(customer.id, record);

    // 写入外呼记录（电销产能统计 + 未接通自动生成回拨计划）
    if (onRecordCall) {
      const connected = callOutcome === 'connected' || durationSeconds > 0;
      const effectiveOutcome: CallOutcome = connected ? 'connected' : callOutcome;
      const scheduled = !connected ? outcomeCallbackMap[callOutcome as Exclude<CallOutcome, 'connected'>] : undefined;
      onRecordCall({
        id: `call-${Date.now()}`,
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        consultantName: currentUserName,
        calledAt: new Date().toLocaleString('zh-CN', { hour12: false }),
        outcome: effectiveOutcome,
        durationSeconds: connected ? durationSeconds : 0,
        note: disposition,
        intentTag: connected ? selectedIntent : undefined,
        callbackScheduledAt: scheduled || undefined,
        callbackCompleted: false,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col text-[#1E293B] animate-in zoom-in-95 my-auto max-h-[92vh] relative">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <PhoneCall className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-800">外呼作业记录 · 合规外呼</span>
            <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-700 border border-blue-200 font-medium">
              通话结果分级留痕
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Smart Pitch Guide Sidebar Toggle */}
            <button
              type="button"
              onClick={() => setIsSmartGuideOpen(!isSmartGuideOpen)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer border ${
                isSmartGuideOpen
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
              }`}
              title="按开场/需求/异议/促成阶段智能引导话术"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>智能话术引导</span>
            </button>

            {/* Script Library Drawer Toggle Button */}
            <button
              type="button"
              onClick={() => setIsScriptDrawerOpen(!isScriptDrawerOpen)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer border ${
                isScriptDrawerOpen
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                  : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'
              }`}
              title="打开助贷常见业务答复与异议化解话术库"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>话术库</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Container */}
        <div className="overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Top Customer Status Bar */}
          <div className="text-center space-y-2">
            <div className="relative inline-block">
              <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg mx-auto shadow-md">
                {customer.name.slice(0, 1)}
              </div>
              {callState === 'connected' && (
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
              )}
            </div>

            <div>
              <div className="flex items-center justify-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">{customer.name}</h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  当前: {customer.grade} 级
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600">
                  额度: {customer.requestedAmount}万
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                外呼号码: {customer.phone} · 请使用工作话机拨打（系统不发起真实呼叫，仅记录通话结果）
              </p>
            </div>

            {/* Status badge */}
            <div className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700">
              {callState === 'dialing' && '待拨打 · 请使用工作话机拨打后点击开始计时'}
              {callState === 'connected' && `通话中 · ${formatDuration(durationSeconds)}`}
              {callState === 'ended' && `通话已结束 · 通话时长 ${formatDuration(durationSeconds)}`}
            </div>

            {/* 合规风控提示（勿扰时段/频次上限/违规话术） */}
            {complianceNotice && (
              <div className={`mt-2 px-3 py-2 rounded-xl text-left text-[11px] flex items-start gap-2 border ${
                complianceNotice.type === 'violation'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">{complianceNotice.type === 'violation' ? '合规红线拦截' : complianceNotice.type === 'dnd' ? '勿扰时段拦截' : '呼叫频次拦截'}: </span>
                  <span>{complianceNotice.message}</span>
                </div>
              </div>
            )}

            {/* 通话控制按钮：待拨打 → 接通计时 / 记录未接通；通话中 → 挂断 */}
            {callState === 'dialing' && (
              <div className="pt-1 flex items-center justify-center gap-3">
                <button
                  onClick={() => setCallState('connected')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer flex items-center space-x-1.5"
                  title="客户已接听，开始通话计时"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>已接通 · 开始计时</span>
                </button>
                <button
                  onClick={handleHangup}
                  className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer flex items-center space-x-1.5"
                  title="客户未接听/拒接，直接记录结果标签"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>未接通 · 记录结果</span>
                </button>
              </div>
            )}
            {callState === 'connected' && (
              <div className="pt-1">
                <button
                  onClick={handleHangup}
                  className="w-11 h-11 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center mx-auto shadow-lg transition active:scale-95 cursor-pointer"
                  title="挂断通话"
                >
                  <PhoneOff className="w-5 h-5" />
                </button>
                <div className="text-[10px] text-slate-400 mt-1">点击红色按钮挂断通话进入总结</div>
              </div>
            )}
          </div>

          {/* AI-Powered Realtime Pitch & Advice Module (Active in both connected & ended states) */}
          <div className="rounded-xl border border-indigo-100 bg-gradient-to-b from-indigo-50/70 to-slate-50 overflow-hidden shadow-xs">
            <div 
              className="px-3.5 py-2.5 bg-indigo-50/90 border-b border-indigo-100 flex items-center justify-between cursor-pointer select-none"
              onClick={() => setIsAiAdviceExpanded(!isAiAdviceExpanded)}
            >
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <span>AI 智能电销副驾 · 实时破冰与跟进建议</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-200/80 text-indigo-800">
                      意向关联: {currentIntentConfig.label}
                    </span>
                  </div>
                  <div className="text-[10px] text-indigo-700">
                    基于【{customer.name}·{customer.requestedAmount}万·{customer.subjectType === 'mortgage' ? '抵押' : customer.subjectType === 'merchant' ? '商户' : customer.subjectType === 'business' ? '企业' : '公积金信用'}】画像动态组装
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRegenerateAi();
                  }}
                  className={`p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded transition cursor-pointer ${isRegeneratingAi ? 'animate-spin' : ''}`}
                  title="刷新策略"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <div className="text-indigo-400">
                  {isAiAdviceExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>
            </div>

            {isAiAdviceExpanded && (
              <div className="p-3.5 space-y-3 text-xs">
                {/* 1. Dynamic Pitch Strategy Banner */}
                <div className="flex items-start justify-between bg-white p-2.5 rounded-lg border border-indigo-100 shadow-xs">
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                      <span>{aiAdvice.strategyTitle}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      <span className="font-semibold text-indigo-700">核心策略: </span>
                      {aiAdvice.focusPoint}
                    </p>
                  </div>
                  <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    {aiAdvice.urgencyTip.slice(0, 12)}...
                  </span>
                </div>

                {/* 2. Personalized Opening Script (Gold 30s) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                      <Bot className="w-3.5 h-3.5 text-blue-600" />
                      <span>黄金 30 秒个性化破冰开场白 (现成可读):</span>
                    </span>
                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopyText(aiAdvice.openingPitch, 'pitch')}
                        className="px-2 py-0.5 text-[10px] rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1 transition cursor-pointer"
                      >
                        {copiedSection === 'pitch' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600 font-bold">已复制话术</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-400" />
                            <span>复制话术</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyAiOpeningToDisposition(aiAdvice.openingPitch)}
                        className="px-2 py-0.5 text-[10px] rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1 font-medium transition cursor-pointer"
                        title="将话术填入下方纪要"
                      >
                        <Send className="w-2.5 h-2.5" />
                        <span>填入纪要</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-slate-200 text-slate-700 text-[11px] leading-relaxed relative group">
                    <p className="whitespace-pre-line">{aiAdvice.openingPitch}</p>
                  </div>
                </div>

                {/* 3. Objection Handling & Next Step Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  {/* Objection Defense */}
                  <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200/70 space-y-1">
                    <div className="font-bold text-amber-900 flex items-center gap-1">
                      <Lightbulb className="w-3 h-3 text-amber-600" />
                      <span>异议心智化解:</span>
                    </div>
                    <p className="text-slate-600 leading-snug">{aiAdvice.objectionDefense}</p>
                  </div>

                  {/* Next Step Recommendation */}
                  <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200/70 space-y-1">
                    <div className="font-bold text-emerald-900 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>行动建议与闭环:</span>
                    </div>
                    <p className="text-slate-600 leading-snug">{aiAdvice.nextStepRecommendation}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Call Ended: Intent Selector & Summary Form */}
          {callState === 'ended' && (
            <div className="space-y-3.5 pt-2 text-left text-xs border-t border-slate-100 animate-in fade-in duration-200">
              {/* 外呼结果标签（电销标准动作：接通/未接通原因分级，未接通自动生成回拨计划） */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-800 font-bold flex items-center gap-1.5">
                    <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
                    <span>外呼结果标签 (未接通需选择原因，自动排程回拨):</span>
                  </label>
                  <span className="text-[10px] text-slate-400">监管频次: 每号每日最多 {DAILY_CALL_LIMIT_PER_PHONE} 次</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'connected' as CallOutcome, label: '已接通', emoji: '✅', desc: '正常通话', color: 'bg-emerald-50 border-emerald-300 text-emerald-700' },
                      { id: 'no_answer' as CallOutcome, label: '无人接听', emoji: '📵', desc: '自动排程明日回拨', color: 'bg-amber-50 border-amber-300 text-amber-700' },
                      { id: 'busy' as CallOutcome, label: '占线/忙', emoji: '🕐', desc: '自动排程回拨', color: 'bg-amber-50 border-amber-300 text-amber-700' },
                      { id: 'rejected' as CallOutcome, label: '拒接', emoji: '🚫', desc: '尊重意愿稍后回访', color: 'bg-rose-50 border-rose-300 text-rose-700' },
                      { id: 'callback_request' as CallOutcome, label: '客户要求回拨', emoji: '📞', desc: '今日 16:00 回拨', color: 'bg-blue-50 border-blue-300 text-blue-700' },
                      { id: 'invalid_number' as CallOutcome, label: '空号/停机', emoji: '🪫', desc: '标记无效号码', color: 'bg-slate-100 border-slate-300 text-slate-600' },
                    ]
                  ).map((opt) => {
                    const isSelected = callOutcome === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectOutcome(opt.id)}
                        className={`p-2 rounded-xl border text-center transition flex items-center gap-2 cursor-pointer ${
                          isSelected ? `${opt.color} ring-2 ring-blue-500 font-bold` : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-sm">{opt.emoji}</span>
                        <span className="text-left">
                          <span className="block text-[11px] font-bold">{opt.label}</span>
                          <span className="block text-[9px] text-slate-400">{opt.desc}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                {callOutcome !== 'connected' && callOutcome !== 'invalid_number' && (
                  <div className="px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-[10px] text-blue-700 flex items-center gap-1.5">
                    <RefreshCw className="w-3 h-3" />
                    <span>未接通: 保存后将自动生成回拨任务 <strong>{outcomeCallbackMap[callOutcome as Exclude<CallOutcome, 'connected'>]}</strong>，出现在工作台「今日待办 · 回拨计划」中</span>
                  </div>
                )}
                {callOutcome === 'invalid_number' && (
                  <div className="px-2.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-[10px] text-slate-500 flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3" />
                    <span>空号/停机: 保存后该号码将标记为无效，不再进入外呼名单（防骚扰合规）</span>
                  </div>
                )}
              </div>

              {/* 4 Intent Tags Quick Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-800 font-bold flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>通话意向标签 (点击联动切换上方 AI 策略 & 自动化触发器):</span>
                  </label>
                  <span className="text-[10px] text-slate-400">实时匹配评级与跟进优先级</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {INTENT_TAG_LIST.map((tag) => {
                    const isSelected = selectedIntent === tag.id;
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleSelectIntentTag(tag.id)}
                        className={`p-2 rounded-xl border text-center transition flex flex-col items-center justify-center cursor-pointer ${
                          isSelected
                            ? `${tag.color} ring-2 ring-blue-500 shadow-xs font-bold`
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-base mb-0.5">{tag.emoji}</span>
                        <span className="text-xs font-bold">{tag.label}</span>
                        <span className="text-[9px] text-slate-400 mt-0.5">
                          自动升降为【{tag.targetGrade}级】
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Automation Trigger Live Preview Card */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 text-slate-700 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="flex items-center gap-1 text-blue-700">
                    <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    自动化触发器规则生效预演
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-blue-100 text-blue-800 font-mono">
                    自动触发器 ON
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-100 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-medium">客户评级调整:</span>
                    <span className="font-bold text-slate-900">{customer.grade} 级</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <span className="font-bold text-blue-600 px-1.5 py-0.2 bg-blue-50 rounded border border-blue-200">
                      {currentIntentConfig.targetGrade} 级 ({currentIntentConfig.label})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-medium">跟进优先级:</span>
                    <span className="font-semibold text-slate-800">{currentIntentConfig.suggestedUrgency}</span>
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-400 font-medium">智能排期:</span>
                    <span className="font-medium text-slate-700">{currentIntentConfig.suggestedNextTime}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 pt-0.5">
                    <span>🛡️ 公海保护: 重置保护期至 {currentIntentConfig.poolDaysBonus} 天</span>
                  </div>
                </div>
              </div>

              {/* Disposition Notes Form */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-600 font-semibold">外呼跟进纪要:</label>
                  <button
                    type="button"
                    onClick={() => setIsScriptDrawerOpen(true)}
                    className="text-blue-600 hover:text-blue-800 text-[11px] font-semibold flex items-center space-x-1 cursor-pointer"
                  >
                    <BookOpen className="w-3 h-3" />
                    <span>从话术库选择并粘贴</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={disposition}
                  onChange={(e) => {
                    setDisposition(e.target.value);
                    // 输入时实时检测违规话术（黄色提示不拦截，红色拦截）
                    const v = detectViolationKeywords(e.target.value);
                    if (v.some((x) => x.level === 'red')) {
                      setComplianceNotice({
                        type: 'violation',
                        message: `⚠️ 检测到监管红线话术【${v.filter((x) => x.level === 'red').map((x) => x.word).join('、')}】，保存将被拦截。${v.filter((x) => x.level === 'red')[0]?.reason || ''}`,
                      });
                    } else if (complianceNotice?.type === 'violation') {
                      setComplianceNotice(null);
                    }
                  }}
                  placeholder="记录通话沟通纪要、意向判定及下一步跟进（输入客户异议/拒绝原因将智能推荐安抚话术）..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 text-xs leading-relaxed"
                />

                {/* AI Objection Handling Float/Popover Suggestion */}
                <div className="mt-2">
                  <AiObjectionSuggestionPopover
                    currentText={disposition}
                    onApplyScript={(script, summary) => {
                      setDisposition((prev) => (prev ? `${prev}\n${summary || script}` : (summary || script)));
                    }}
                  />
                </div>

                {/* 敏感词实时检测结果 */}
                {(() => {
                  const v = detectViolationKeywords(disposition);
                  if (v.length === 0) return null;
                  return (
                    <div className={`mt-1 px-2.5 py-1.5 rounded-lg border text-[10px] space-y-0.5 ${
                      v.some((x) => x.level === 'red')
                        ? 'bg-rose-50 border-rose-200 text-rose-700'
                        : 'bg-amber-50 border-amber-200 text-amber-700'
                    }`}>
                      <div className="font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        合规话术检测: 命中 {v.length} 处敏感词
                      </div>
                      {v.map((hit) => (
                        <div key={hit.word} className="flex items-center gap-1">
                          <span className={`px-1 rounded font-mono font-bold ${hit.level === 'red' ? 'bg-rose-200' : 'bg-amber-200'}`}>{hit.word}</span>
                          <span className="text-slate-500">{hit.reason}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              <div className="flex justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 text-xs cursor-pointer"
                >
                  放弃记录
                </button>
                <button
                  type="button"
                  onClick={handleSaveAndClose}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition cursor-pointer flex items-center space-x-1.5"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>执行触发器并归档通话</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Embedded Script Library Drawer */}
        <ScriptLibraryDrawer
          isOpen={isScriptDrawerOpen}
          onClose={() => setIsScriptDrawerOpen(false)}
          onApplyScript={handleApplyScriptToDisposition}
        />

        {/* Smart Pitch Guide Sidebar Drawer */}
        <SmartPitchGuideSidebar
          isOpen={isSmartGuideOpen}
          onClose={() => setIsSmartGuideOpen(false)}
          onApplyScriptToInput={(script: string, summary?: string) => {
            handleApplyScriptToDisposition(script, summary || script);
          }}
        />
      </div>
    </div>
  );
};



