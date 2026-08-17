import React, { useState } from 'react';
import { 
  Sparkles, 
  Bot, 
  PhoneCall, 
  MessageSquare, 
  Zap, 
  ShieldAlert, 
  CheckCircle2, 
  Copy, 
  X, 
  Send,
  HelpCircle,
  TrendingUp,
  FileText,
  Lightbulb,
  ArrowRight,
  BrainCircuit,
  Swords,
  Layers,
  Award,
  AlertTriangle,
  Flame,
  Check,
  RefreshCw
} from 'lucide-react';
import { Customer, FollowUpRecord } from '../../types';
import { 
  generateAiScript, 
  AI_SCRIPT_SCENES, 
  AiScriptResult, 
  AiScriptScene, 
  AiToneStyle,
  OBJECTION_MATRIX,
  ObjectionItem,
  evaluateSimulatorResponse,
  SimulatorFeedback,
  INDUSTRY_ICEBREAKERS
} from '../../utils/aiPitchAdvisor';
import { useEscToClose } from '../../utils/useEscToClose';

interface AiTelesalesCopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onApplyFollowUpText?: (text: string) => void;
  onSaveFollowUpDirectly?: (customerId: string, record: FollowUpRecord) => void;
}

export const AiTelesalesCopilotModal: React.FC<AiTelesalesCopilotModalProps> = ({
  isOpen,
  onClose,
  customer,
  onApplyFollowUpText,
  onSaveFollowUpDirectly,
}) => {
  const [activeTab, setActiveTab] = useState<'personalized' | 'objections' | 'simulator' | 'icebreakers' | 'summarizer'>('personalized');
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  // 1. 客户专属话术 State
  const [selectedScene, setSelectedScene] = useState<AiScriptScene>('first_call');
  const [selectedTone, setSelectedTone] = useState<AiToneStyle>('professional');
  const [generatedScript, setGeneratedScript] = useState<AiScriptResult | null>(null);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);

  // 2. 异议库过滤 State
  const [selectedObjCategory, setSelectedObjCategory] = useState<string>('all');
  const [objSearchKeyword, setObjSearchKeyword] = useState<string>('');

  // 3. AI 对练模拟器 State
  const [selectedSimObjId, setSelectedSimObjId] = useState<string>(OBJECTION_MATRIX[0]?.id || 'obj-rate');
  const [userSimResponse, setUserSimResponse] = useState<string>('');
  const [simFeedback, setSimFeedback] = useState<SimulatorFeedback | null>(null);
  const [isEvaluatingSim, setIsEvaluatingSim] = useState(false);

  // 4. Call Summarizer State
  const [rawCallTranscript, setRawCallTranscript] = useState(
    '客户说最近做外贸订单急需周转150万，名下在南山有一套全款房估值700万，但上个月查了3次征信，怕过不了。另外想问能不能先息后本，每月压力小一点。'
  );
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [extractedSummary, setExtractedSummary] = useState<{
    grade: 'S' | 'A' | 'B' | 'C';
    purpose: string;
    urgency: string;
    assetHighlights: string;
    riskPoints: string;
    suggestedBank: string;
    standardCrmLog: string;
  } | null>(null);

  // ESC 关闭
  useEscToClose(isOpen, onClose);

  // 处理生成专属话术
  const handleGenerateScript = () => {
    if (!customer) {
      window.alert('请先从工作台/客户列表选择一位客户，再使用「客户专属话术生成器」。');
      return;
    }
    setIsGeneratingScript(true);
    setTimeout(() => {
      setGeneratedScript(generateAiScript(customer, selectedScene, selectedTone));
      setIsGeneratingScript(false);
    }, 280);
  };

  // 应用到跟进记录
  const handleApplyScriptToFollowUp = (textToApply?: string) => {
    const text = textToApply || (generatedScript ? `【AI${generatedScript.sceneLabel}话术】\n${generatedScript.script}` : '');
    if (!text) return;
    if (onApplyFollowUpText) {
      onApplyFollowUpText(text);
      onClose();
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  // 处理对练评估
  const handleEvaluateSim = () => {
    if (!userSimResponse.trim()) {
      window.alert('请输入您针对该异议的应答话术，再提交 AI 点评。');
      return;
    }
    setIsEvaluatingSim(true);
    const activeObj = OBJECTION_MATRIX.find((o) => o.id === selectedSimObjId);
    setTimeout(() => {
      setSimFeedback(evaluateSimulatorResponse(activeObj?.title || '', userSimResponse));
      setIsEvaluatingSim(false);
    }, 450);
  };

  // 处理通话纪要 AI 提炼
  const handleAnalyzeTranscript = () => {
    setIsAiGenerating(true);
    setTimeout(() => {
      setExtractedSummary({
        grade: 'S',
        purpose: '外贸供应链订单周转与原材料采购',
        urgency: '急需 (3-5天内放款到账)',
        assetHighlights: '南山区红本全款住宅估值700万，可用抵押净值空间约500万',
        riskPoints: '上月征信查询3次（偏多但未达风控红线，需规避强查行）',
        suggestedBank: '首选中国工商银行·房抵优贷（10年先息后本，利率3.15%，支持无缝续贷）',
        standardCrmLog: `【AI电销纪要】客户意向明确急需150万外贸订单周转，期望先息后本降低月供。名下南山全款住宅700万抵押空间充裕。近1月征信查询3次，建议避开强查询银行，首推工行10年期房抵方案（年化3.15%）。已约定明日上午10:00携带房本到店详谈。`,
      });
      setIsAiGenerating(false);
    }, 600);
  };

  const handleApplyToCrm = () => {
    if (!extractedSummary) return;
    if (onApplyFollowUpText) {
      onApplyFollowUpText(extractedSummary.standardCrmLog);
    }
    if (customer && onSaveFollowUpDirectly) {
      const record: FollowUpRecord = {
        id: `f-${Date.now()}`,
        date: '今日 ' + new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        type: 'phone',
        operator: '李晓明 (AI电销助手提炼)',
        content: extractedSummary.standardCrmLog,
        nextFollowUpDate: '明日 10:00 面签沟通',
      };
      onSaveFollowUpDirectly(customer.id, record);
    }
    onClose();
  };

  // 异议库筛选
  const filteredObjections = OBJECTION_MATRIX.filter((item) => {
    const matchCategory = selectedObjCategory === 'all' || item.categoryKey === selectedObjCategory;
    const matchSearch = !objSearchKeyword.trim() || 
      item.title.toLowerCase().includes(objSearchKeyword.toLowerCase()) ||
      item.psychology.toLowerCase().includes(objSearchKeyword.toLowerCase()) ||
      item.solutions.some((s) => s.script.toLowerCase().includes(objSearchKeyword.toLowerCase()));
    return matchCategory && matchSearch;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-900 animate-in zoom-in-95 max-h-[92vh]">
        {/* Top Header: Modern Refined Light Header */}
        <div className="p-4 sm:p-5 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">AI 智能电销与异议化解助手</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  助贷第一性实战大模型
                </span>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  实时联动客户画像
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {customer ? (
                  <span>
                    当前辅导客户: <strong className="text-slate-800">{customer.name}</strong> ({customer.grade}级意向 · 需求 <strong className="text-blue-600">¥{customer.requestedAmount}万</strong>)
                  </span>
                ) : (
                  '赋能销售顾问精准破冰、攻心化解客户抗拒、模拟实战对练与秒级提炼 CRM 纪要'
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            title="按 Esc 或点击关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation: Clean Refined Light Bar */}
        <div className="flex border-b border-slate-200 bg-slate-50/90 px-4 sm:px-6 text-xs font-semibold overflow-x-auto gap-1">
          {[
            { id: 'personalized' as const, label: '🎯 客户画像专属话术', icon: Sparkles, count: customer ? '已联动' : '未选客' },
            { id: 'objections' as const, label: '🛡️ 助贷实战异议攻心库', icon: ShieldAlert, count: `${OBJECTION_MATRIX.length}条` },
            { id: 'simulator' as const, label: '⚔️ AI 对练与抗拒模拟器', icon: Swords, badge: '金牌总监点评' },
            { id: 'icebreakers' as const, label: '⚡ 行业黄金开场白', icon: Zap, count: '前30秒' },
            { id: 'summarizer' as const, label: '✨ CRM 通话智能提炼', icon: FileText, badge: '一键入库' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-3.5 border-b-2 whitespace-nowrap transition cursor-pointer flex items-center space-x-1.5 ${
                  isActive
                    ? 'border-blue-600 text-blue-700 font-bold bg-white shadow-2xs'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {tab.badge}
                  </span>
                )}
                {tab.count && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-mono">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Modal Main Body */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-4 text-xs bg-slate-50/40">
          
          {/* ===================== TAB 1: 客户专属话术动态生成 ===================== */}
          {activeTab === 'personalized' && (
            <div className="space-y-4">
              {/* Banner */}
              <div className="p-3.5 bg-white border border-blue-200/80 rounded-xl shadow-2xs text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-slate-800">
                  <BrainCircuit className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    基于当前客户真实画像（资产规模 / 征信查询 / 经营流水 / 意向产品 / 历史跟进）动态组装，拒绝机械模板。
                  </span>
                </span>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 shrink-0">
                  支持切换 3 种语调风格
                </span>
              </div>

              {/* Customer Profile Card */}
              {customer ? (
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">客户姓名</span>
                    <strong className="text-slate-900 text-sm">{customer.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">意向与紧迫度</span>
                    <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[11px]">
                      {customer.grade}级意向 · {customer.urgency}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">资金需求与主体</span>
                    <strong className="text-slate-900">
                      ¥{customer.requestedAmount}万 ({customer.subjectType === 'mortgage' ? '房产抵押' : customer.subjectType === 'merchant' ? '个体商户' : customer.subjectType === 'business' ? '企业税票' : '个人信用'})
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">匹配主力产品</span>
                    <strong className="text-emerald-700 truncate block">
                      {customer.matchedProducts?.[0]?.productName || '工行·房抵优贷'}
                    </strong>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>当前未选中特定客户。系统将以标准小微企业主画像进行示例演示。建议在客户详情页中唤起以获得极致个性化话术！</span>
                  </div>
                </div>
              )}

              {/* Controls: Scene + Tone Selection */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>选择业务沟通场景：</span>
                  </span>

                  {/* Tone Style Selector */}
                  <div className="flex items-center space-x-1">
                    <span className="text-[11px] text-slate-500 mr-1">话术语调:</span>
                    {[
                      { id: 'professional' as const, label: '专业沉稳风' },
                      { id: 'aggressive' as const, label: '犀利逼单风' },
                      { id: 'caring' as const, label: '温情顾问风' },
                    ].map((tone) => (
                      <button
                        key={tone.id}
                        type="button"
                        onClick={() => { setSelectedTone(tone.id); setGeneratedScript(null); }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          selectedTone === tone.id
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {tone.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-2">
                  {AI_SCRIPT_SCENES.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => { setSelectedScene(s.id); setGeneratedScript(null); }}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        selectedScene === s.id
                          ? 'border-blue-600 bg-blue-50/70 shadow-2xs'
                          : 'border-slate-200 bg-white hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900 text-xs flex items-center gap-1">
                          <span>{s.icon}</span>
                          <span>{s.label}</span>
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-white text-slate-500 border border-slate-100">
                          {s.category}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 line-clamp-1">{s.desc}</div>
                    </button>
                  ))}
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleGenerateScript}
                    disabled={isGeneratingScript}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>{isGeneratingScript ? 'AI 正在深度组装话术...' : `立即生成「${AI_SCRIPT_SCENES.find((s) => s.id === selectedScene)?.label}」专属话术`}</span>
                  </button>
                </div>
              </div>

              {/* Generated Result Card */}
              {generatedScript && (
                <div className="p-5 rounded-xl bg-white border border-blue-200 shadow-sm space-y-3.5 animate-in fade-in-50">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>{generatedScript.title}</span>
                      </h4>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        语调模式: {generatedScript.toneStyle === 'aggressive' ? '犀利逼单' : generatedScript.toneStyle === 'caring' ? '温情顾问' : '专业金融'} · 场景: {generatedScript.sceneLabel}
                      </span>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                      {generatedScript.sceneLabel}
                    </span>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl text-slate-800 leading-relaxed text-xs border border-slate-200 font-mono whitespace-pre-wrap selection:bg-blue-100">
                    {generatedScript.script}
                  </div>

                  {generatedScript.complianceNote && (
                    <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{generatedScript.complianceNote}</span>
                    </div>
                  )}

                  <div className="space-y-1.5 bg-blue-50/30 p-3 rounded-lg border border-blue-100">
                    <div className="font-bold text-slate-800 text-xs flex items-center gap-1">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                      <span>金牌顾问使用要点 (Tips)：</span>
                    </div>
                    {generatedScript.tips.map((tip, i) => (
                      <div key={i} className="text-slate-600 text-xs flex gap-1.5">
                        <span className="text-blue-500 shrink-0 font-bold">•</span>
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400">
                      已自动适配当前客户征信与资产参数
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleCopy(generatedScript.script, 'personalized-script')}
                        className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold transition flex items-center space-x-1 cursor-pointer"
                      >
                        {copiedIndex === 'personalized-script' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedIndex === 'personalized-script' ? '已复制' : '复制完整话术'}</span>
                      </button>
                      {onApplyFollowUpText && (
                        <button
                          type="button"
                          onClick={() => handleApplyScriptToFollowUp()}
                          className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center space-x-1 cursor-pointer shadow-xs"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>一键应用到客户跟进</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===================== TAB 2: 助贷实战异议攻心库 ===================== */}
          {activeTab === 'objections' && (
            <div className="space-y-4">
              {/* Category Filter + Search Header */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                      <span>助贷业务员外呼高频 12+ 大抗拒点攻心剖析库</span>
                    </h4>
                    <p className="text-slate-500 text-xs mt-0.5">
                      每条异议包含「客户底层心理剖析」与多套「方案A/方案B实操话术」，直接拿来念，招招击中要害。
                    </p>
                  </div>

                  <input
                    type="text"
                    value={objSearchKeyword}
                    onChange={(e) => setObjSearchKeyword(e.target.value)}
                    placeholder="输入关键词搜索异议 (如：利息/服务费/征信)..."
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 w-full sm:w-64"
                  />
                </div>

                {/* Categories */}
                <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100">
                  {[
                    { id: 'all', label: '全部异议' },
                    { id: 'rate', label: '💰 利率对比与高息' },
                    { id: 'fee', label: '💳 嫌服务费/中介费贵' },
                    { id: 'credit', label: '🛡️ 征信多头与被拒阴影' },
                    { id: 'process', label: '📋 先息后本与怕麻烦' },
                    { id: 'competitor', label: '🤝 正在对比其他同行' },
                    { id: 'privacy', label: '🔒 配偶签字与隐私顾虑' },
                    { id: 'noneed', label: '☕ 暂无需求与备用金' },
                  ].map((cat) => {
                    const count = cat.id === 'all'
                      ? OBJECTION_MATRIX.length
                      : OBJECTION_MATRIX.filter((o) => o.categoryKey === cat.id).length;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedObjCategory(cat.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center space-x-1 ${
                          selectedObjCategory === cat.id
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <span>{cat.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          selectedObjCategory === cat.id ? 'bg-white/20 text-white' : 'bg-white text-slate-500'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Objections List */}
              <div className="space-y-3">
                {filteredObjections.map((obj) => (
                  <div key={obj.id} className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          {obj.category}
                        </span>
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{obj.title}</h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSimObjId(obj.id);
                          setActiveTab('simulator');
                        }}
                        className="px-2 py-1 rounded text-[11px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition flex items-center gap-1 cursor-pointer shrink-0"
                        title="用此异议开展 AI 对练模拟"
                      >
                        <Swords className="w-3 h-3" />
                        <span>AI 实战对练</span>
                      </button>
                    </div>

                    <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200/80 text-amber-900 text-xs leading-relaxed flex items-start gap-1.5">
                      <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>客户真实心理剖析：</strong>
                        <span>{obj.psychology}</span>
                      </div>
                    </div>

                    {/* Solutions */}
                    <div className="space-y-2.5">
                      {obj.solutions.map((sol, sIdx) => {
                        const copyId = `${obj.id}-${sIdx}`;
                        return (
                          <div key={sIdx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-blue-700 text-xs">{sol.label}</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-white text-slate-500 border border-slate-200">
                                  {sol.technique}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleCopy(sol.script, copyId)}
                                  className="px-2 py-0.5 rounded text-[11px] font-semibold bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 transition flex items-center gap-1 cursor-pointer"
                                >
                                  {copiedIndex === copyId ? (
                                    <>
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      <span className="text-emerald-600">已复制</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>复制话术</span>
                                    </>
                                  )}
                                </button>
                                {onApplyFollowUpText && (
                                  <button
                                    type="button"
                                    onClick={() => handleApplyScriptToFollowUp(`【化解客户异议】\n${sol.script}`)}
                                    className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1 cursor-pointer"
                                    title="填入客户跟进记录"
                                  >
                                    <Send className="w-3 h-3" />
                                    <span>填入跟进</span>
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="text-slate-800 leading-relaxed text-xs font-mono bg-white p-2.5 rounded-lg border border-slate-100">
                              {sol.script}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===================== TAB 3: AI 对练与抗拒模拟器 ===================== */}
          {activeTab === 'simulator' && (
            <div className="space-y-4">
              {/* Top Banner */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Award className="w-5 h-5 text-indigo-600" />
                    <h4 className="font-bold text-slate-900 text-sm">AI 销售实战对练与抗拒模拟器</h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      金牌总监 1对1 点评
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    实战检验您的化解应变话术
                  </span>
                </div>
                <p className="text-slate-500 text-xs leading-relaxed">
                  选择客户高频抗拒问题，输入您平时的应答话术。AI 将模拟金牌助贷总监进行<strong>【多维打分 (1-100分)】</strong>、<strong>【亮点分析】</strong>、<strong>【失分漏洞排雷】</strong>并给出<strong>【顶级优化示范话术】</strong>！
                </p>
              </div>

              {/* Practice Form */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    1. 选择要演练的客户高频异议场景：
                  </label>
                  <select
                    value={selectedSimObjId}
                    onChange={(e) => { setSelectedSimObjId(e.target.value); setSimFeedback(null); }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {OBJECTION_MATRIX.map((obj) => (
                      <option key={obj.id} value={obj.id}>
                        [{obj.category}] {obj.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      2. 输入您的应答话术 (模拟您在电话中会怎么对客户说)：
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setUserSimResponse('张总，我非常理解您的顾虑。其实我们帮您做的是10年先息后本的方案，月息只有2600多块，而且随借随还，我们提前做大数据合规预审不查征信。您看明天上午10点还是下午2点，我把测算表给您带过去？');
                      }}
                      className="text-[11px] text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>一键填入示例话术测试</span>
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={userSimResponse}
                    onChange={(e) => setUserSimResponse(e.target.value)}
                    placeholder="输入您的应答话术..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 text-xs font-mono"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-400">
                    提示：包含“先跟后带共情”、“量化价值收益”、“二选一指令”可获更高评分
                  </span>
                  <button
                    type="button"
                    onClick={handleEvaluateSim}
                    disabled={isEvaluatingSim}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Award className="w-4 h-4 text-amber-300" />
                    <span>{isEvaluatingSim ? 'AI 金牌总监深度评审中...' : '提交 AI 金牌总监点评打分'}</span>
                  </button>
                </div>
              </div>

              {/* Feedback Evaluation Result Card */}
              {simFeedback && (
                <div className="p-5 rounded-xl bg-white border border-indigo-200 shadow-md space-y-4 animate-in fade-in-50">
                  <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-lg text-white shadow-xs ${
                        simFeedback.score >= 85 ? 'bg-emerald-600' : simFeedback.score >= 75 ? 'bg-blue-600' : 'bg-amber-600'
                      }`}>
                        {simFeedback.score}分
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 text-sm">综合评级: {simFeedback.grade}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            总监评分卡
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{simFeedback.directorAdvice}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-1.5">
                      <div className="font-bold text-emerald-900 text-xs flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>话术亮点分析：</span>
                      </div>
                      {simFeedback.highlights.map((h, i) => (
                        <div key={i} className="text-emerald-800 text-[11px] flex gap-1.5">
                          <span className="font-bold">•</span>
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 space-y-1.5">
                      <div className="font-bold text-amber-900 text-xs flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>避坑与失分漏洞：</span>
                      </div>
                      {simFeedback.risks.map((r, i) => (
                        <div key={i} className="text-amber-800 text-[11px] flex gap-1.5">
                          <span className="font-bold">•</span>
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div className="font-bold text-slate-900 text-xs flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        <span>金牌总监优化示范话术 (推荐背诵掌握)：</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(simFeedback.improvedScript, 'sim-improved')}
                        className="text-[11px] text-indigo-600 hover:underline cursor-pointer flex items-center gap-1 font-semibold"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedIndex === 'sim-improved' ? '已复制' : '一键复制示范'}</span>
                      </button>
                    </div>
                    <p className="text-slate-800 leading-relaxed text-xs font-mono bg-white p-3 rounded-lg border border-slate-200">
                      {simFeedback.improvedScript}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===================== TAB 4: 行业黄金开场白 ===================== */}
          {activeTab === 'icebreakers' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>助贷前30秒黄金开口话术（首呼高转化率破冰切入点）</span>
                </h4>
                <p className="text-slate-500 text-xs mt-1">
                  依据借款人核心资产类别与融资产品分类，直击客户利益点，降低挂断率与防备心理：
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {INDUSTRY_ICEBREAKERS.map((item, idx) => {
                  const copyId = `ice-${idx}`;
                  return (
                    <div key={idx} className="p-4 rounded-xl bg-white border border-slate-200 space-y-3 shadow-2xs flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            {item.type}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(item.script, copyId)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 transition flex items-center gap-1 cursor-pointer"
                          >
                            {copiedIndex === copyId ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-600">已复制</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>复制开口话术</span>
                              </>
                            )}
                          </button>
                        </div>
                        <h4 className="font-bold text-slate-900 text-xs">{item.title}</h4>
                        <p className="p-3 bg-slate-50 rounded-xl text-slate-800 leading-relaxed text-xs border border-slate-200 font-mono">
                          {item.script}
                        </p>
                      </div>

                      {onApplyFollowUpText && (
                        <div className="pt-2 border-t border-slate-100 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleApplyScriptToFollowUp(`【黄金开场白】\n${item.script}`)}
                            className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Send className="w-3 h-3" />
                            <span>填入客户跟进记录</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===================== TAB 5: CRM 通话纪要一键提炼 ===================== */}
          {activeTab === 'summarizer' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                      输入电销通话速记 / 语音转文字原稿：
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setRawCallTranscript('客户李总做五金外贸急需200万进货，名下宝安有一套全款红本房估值600万，但上月查了4次征信，怕大行过不了。客户希望做先息后本，月供越低越好。');
                    }}
                    className="text-[11px] text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>填入外贸客户速记示例</span>
                  </button>
                </div>

                <textarea
                  rows={3}
                  value={rawCallTranscript}
                  onChange={(e) => setRawCallTranscript(e.target.value)}
                  placeholder="粘贴通话过程中的要点记录或语音识别文本..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 text-xs font-mono"
                />

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleAnalyzeTranscript}
                    disabled={isAiGenerating}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>{isAiGenerating ? 'AI 正在深度解析风控与纪要...' : '一键 AI 提炼 CRM 标准纪要'}</span>
                  </button>
                </div>
              </div>

              {extractedSummary && (
                <div className="p-5 rounded-xl bg-white border border-emerald-200 shadow-md space-y-3.5 animate-in fade-in-50">
                  <div className="flex items-center justify-between border-b border-emerald-100 pb-2.5">
                    <span className="font-bold text-emerald-900 text-sm flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>AI 结构化画像与风控初筛结果</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      意向评级: {extractedSummary.grade} 级客群
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div><strong className="text-slate-900">融资用途:</strong> {extractedSummary.purpose}</div>
                    <div><strong className="text-slate-900">紧迫程度:</strong> {extractedSummary.urgency}</div>
                    <div><strong className="text-slate-900">优势资产:</strong> {extractedSummary.assetHighlights}</div>
                    <div><strong className="text-slate-900">风控排雷:</strong> {extractedSummary.riskPoints}</div>
                    <div className="sm:col-span-2"><strong className="text-slate-900">推荐资方:</strong> {extractedSummary.suggestedBank}</div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="font-bold text-slate-900 text-xs">生成标准合规跟进日志：</div>
                    <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 text-xs leading-relaxed font-mono">
                      {extractedSummary.standardCrmLog}
                    </p>
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleCopy(extractedSummary.standardCrmLog, 'crm-log')}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                    >
                      {copiedIndex === 'crm-log' ? '已复制日志' : '仅复制日志文本'}
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyToCrm}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center space-x-1 cursor-pointer shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>直接落库至客户跟进档案</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Bottom Footer: Clean Refined Light Footer */}
        <div className="p-3.5 sm:px-6 bg-white border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
            <span>助贷专家实战模型 · 严守合规展业标准与隐私安全</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            完成并关闭
          </button>
        </div>
      </div>
    </div>
  );
};
