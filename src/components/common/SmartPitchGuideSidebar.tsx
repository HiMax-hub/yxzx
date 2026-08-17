import React, { useState } from 'react';
import { 
  X, 
  Search, 
  Sparkles, 
  PhoneCall, 
  Copy, 
  CheckCircle2, 
  Send, 
  BookOpen, 
  Layers, 
  Zap, 
  ChevronRight, 
  ShieldCheck, 
  TrendingUp, 
  Tag, 
  Filter,
  Check
} from 'lucide-react';

export type CallStage = 'opening' | 'discovery' | 'objection' | 'closing';

export interface StageScriptItem {
  id: string;
  stage: CallStage;
  title: string;
  subTitle: string;
  tags: string[];
  script: string;
  actionAdvice: string;
  summaryTemplate: string;
}

export const STAGE_SCRIPT_ITEMS: StageScriptItem[] = [
  // 1. 开场破冰 (Opening)
  {
    id: 'op-1',
    stage: 'opening',
    title: '普惠低息信贷快速破冰',
    subTitle: '主打低息普惠、先息后本、随借随还',
    tags: ['首电', '普惠专案', '年化3.15%起', '随借随还'],
    script: '“您好！我是助贷中心的专属资深融资顾问。打扰您半分钟，主要向您同步合作国有大行近期推出的低息普惠借款红利专案，年化低至3.15%起，最长可做10年先息后本，而且随借随还按天计息。今天特地为您做个线上额度预审！”',
    actionAdvice: '语气热情真诚，重点抛出“先息后本、低月供”核心优势，抓住客户前10秒黄金注意力。',
    summaryTemplate: '【首电破冰】向客户同步合作大行低息普惠方案（年化3.15%起、10年先息后本、随借随还），客户初步建立了解。',
  },
  {
    id: 'op-2',
    stage: 'opening',
    title: '房产二抵增额免过桥破冰',
    subTitle: '针对名下有房客户，主打不用结清原按揭',
    tags: ['房产抵押', '二抵免过桥', '最高8成', '大额低息'],
    script: '“李总您好！了解到您名下在本地有不动产。目前国有大行针对优质业主推出了【二次抵押免结清】专案，您原有的银行按揭不用结清，即可直接按当前市值做二次放大授信，利率降至3.25%，最快3天批复，帮助您大幅释放房产沉睡净值！”',
    actionAdvice: '核实客户房产小区与按揭大致余额，引导测算可贷二抵空间。',
    summaryTemplate: '【房产二抵破冰】沟通房产二抵免过桥专案（年化3.25%，成数最高8成），引导客户查验房产净值空间。',
  },
  {
    id: 'op-3',
    stage: 'opening',
    title: '企业税票免抵押秒批破冰',
    subTitle: '针对小微法人/个体户，纯信用秒批300万',
    tags: ['税票贷', '免抵押', '银税直连', '秒出额度'],
    script: '“张总您好！关注到贵司经营与纳税情况良好，银行企税直通车现已开放最高300万免抵押纯信用授信，凭增值税票线上授权秒批，按日计息，不提款不产生任何费用，非常适合作为企业的0成本应急备用金库！”',
    actionAdvice: '引导客户将授信作为防范资金链波动的备用库，降低提款抗拒。',
    summaryTemplate: '【企税破冰】推荐银行企税直连秒批纯信用授信（最高300万、随借随还），客户同意了解纳税测额。',
  },
  {
    id: 'op-4',
    stage: 'opening',
    title: '公积金/保单白领信用贷破冰',
    subTitle: '针对工薪白领，凭公积金/打卡工资办大额信用贷',
    tags: ['公积金', '打卡工资', '白领专享', '单笔50万'],
    script: '“王女士您好！合作商业银行针对公积金连续缴存客户推出了白领专享信用贷，年化低至3.0%，无需抵押，单笔最高50万，手机上一分钟即可测出授信额度，非常适合近期大额消费或装修周转！”',
    actionAdvice: '询问公积金月缴金额，测算10-30倍授信放大额度。',
    summaryTemplate: '【公积金信用贷破冰】向客户介绍公积金专属低息信用贷方案，约定协助手机端预核额度。',
  },

  // 2. 需求挖掘 (Discovery)
  {
    id: 'disc-1',
    stage: 'discovery',
    title: '资金缺口与用款时间摸底',
    subTitle: '核实资金紧急程度与实际缺口金额',
    tags: ['缺口测算', '用款紧急度', '还款期限'],
    script: '“请问您这次资金周转大概需要多少金额？预计什么时间要用到账上？这笔资金主要是用于企业进货订金、采购设备，还是日常资金链过渡？我们好根据您的时间节点匹配最快审批通道。”',
    actionAdvice: '判断客户紧急程度（3天内急用 / 1-2周正常 / 储备对比），匹配对应时效的银行资方。',
    summaryTemplate: '【需求摸底】核实客户实际资金缺口约XX万元，预计XX日前需到位，资金主要用于企业经营周转。',
  },
  {
    id: 'disc-2',
    stage: 'discovery',
    title: '不动产与资产净值摸排',
    subTitle: '摸清房产性质、面积、按揭余额与抵押意向',
    tags: ['房产摸底', '全款/按揭', '市值估算'],
    script: '“您目前在本地这套房产位于哪个小区？大概面积多大？目前按揭还剩多少本金没结清？是您个人名下还是夫妻共有？我们可以在银行内网先免费帮您评估一下最高能贷出多少净值空间。”',
    actionAdvice: '获取小区名称、面积、按揭余额，立即在系统输入估值测算成数。',
    summaryTemplate: '【资产摸排】客户名下房产位于XX小区，面积约XX㎡，按揭尚余XX万，估算二抵可用净值空间约XX万元。',
  },
  {
    id: 'disc-3',
    stage: 'discovery',
    title: '征信概况与查询频次摸排',
    subTitle: '提前排查近2月查询与逾期网贷风险',
    tags: ['征信摸排', '近期查询', '网贷小贷', '逾期排查'],
    script: '“为了给您匹配通过率最高、不走弯路的银行产品，想先向您了解一下：近两个月您在手机上或者银行申请过其他贷款或信用卡吗？名下有没有微粒贷、借呗等零散借款？近两年有没有逾期记录？我们好提前帮您规避风控红线。”',
    actionAdvice: '态度温和，强调“提前摸底是为了保护征信不被盲目机审拒贷”。',
    summaryTemplate: '【征信摸排】客户近2月查询约X次，名下有/无少量网贷，近两年征信还款记录良好/有轻微逾期需出具结清证明。',
  },

  // 3. 异议化解 (Objection Handling)
  {
    id: 'obj-1',
    stage: 'objection',
    title: '化解客户嫌利息高 / 嫌成本贵',
    subTitle: '对比民间成本与先息后本超低月供',
    tags: ['异议攻坚', '利息高', '先息后本', '日息仅几块'],
    script: '“王总非常理解！但我们为您申请的是银行普惠专案，年化低至3.05%，而且是10年先息后本。100万借款每月利息才2500元，平均每天才80多块钱，随借随还！您企业随便一单货款周转的利润都远高于这个成本，完全不影响日常现金流！”',
    actionAdvice: '拆解为日息与月息数字，强调现金流缓冲价值与利润对比。',
    summaryTemplate: '【异议化解·利息】向客户解析银行普惠先息后本月息与日息成本，消除高成本顾虑。客户对月供方案表示满意。',
  },
  {
    id: 'obj-2',
    stage: 'objection',
    title: '化解客户质疑中介服务费',
    subTitle: '强调专业银行通道偏好、降息提额与批复后付费',
    tags: ['异议攻坚', '服务费', '先批后付', '避免盲查被拒'],
    script: '“李总，客户自己去网点往往因材料不规范直接被系统拒贷，征信弄花了半年都不能再办。我们熟悉全城40多家银行支行实时风控偏好与特批通道，帮您利息降低1-2个点、额度多批几十万，省下的利息远超咨询费，而且全程【先批贷后付费，不成功0费用】！”',
    actionAdvice: '强调安全感与利益兜底（不成功不收费，省下的利息远超服务费）。',
    summaryTemplate: '【异议化解·中介费】阐明助贷机构在渠道撮合、特批降息及征信保护方面的价值，客户同意由我方全程协助。',
  },
  {
    id: 'obj-3',
    stage: 'objection',
    title: '化解客户“目前不缺钱 / 以后再说”',
    subTitle: '引导晴天储备授信，先批备用不提不计息',
    tags: ['异议攻坚', '不缺钱', '晴天修屋顶', '不提不收息'],
    script: '“张总太好了！说明您企业经营很稳健！做企业讲究‘晴天借伞、雨天收伞’，等真正急用钱时银行审批往往来不及。这笔额度有效期3-5年，随借随还，不提款不花一分钱！我们先帮您把大额低息额度锁定下来作为企业的备用资金库，有备无患！”',
    actionAdvice: '强调授信的备用金属性，0持有成本，随时随地可用。',
    summaryTemplate: '【异议化解·不缺钱】引导客户建立0成本备用授信意识（先批备用、不提不计息），客户同意先做额度审批。',
  },
  {
    id: 'obj-4',
    stage: 'objection',
    title: '化解客户担心房产抵押风险',
    subTitle: '普及正规银行合规二抵登记与民法典保护',
    tags: ['异议攻坚', '抵押安全', '国有大行', '产权完全自主'],
    script: '“陈姐您放心！我们对接的全是正规国有大行，抵押权人是银行总行，受国家法律严格保护。房屋所有权与居住使用权完全在您手中，而且现在支持二抵免过桥，不结清原按揭直接线上附记，没有任何产权风险！”',
    actionAdvice: '打消民间抵押的恐惧心理，突出国有大行合规权威。',
    summaryTemplate: '【异议化解·房产抵押安全】普及正规银行二抵登记与产权安全机制，打消客户顾虑。',
  },

  // 4. 促成邀约 (Closing / Booking)
  {
    id: 'clos-1',
    stage: 'closing',
    title: '锁定本周优惠利率名额逼单',
    subTitle: '强调季度优惠利率配额与窗口期紧迫感',
    tags: ['促成逼单', '利率窗口期', '限时锁定', '即刻递交'],
    script: '“赵总，目前大行这批年化3.15%特惠利率是按季度配额的，本周正是窗口期节点。建议今天先把身份证和营业执照发我，我帮您在系统锁定当前超低利率名额，批复出来您完全满意再做决定，现在不锁下周政策调整可能就上浮了！”',
    actionAdvice: '制造窗口期紧迫感，促使客户当场发送证件资料。',
    summaryTemplate: '【促成逼单】强调季度优惠利率配额窗口期，促成客户即刻提交身份证与营业执照锁额。',
  },
  {
    id: 'clos-2',
    stage: 'closing',
    title: '预约银行网点下户面签邀约',
    subTitle: '明确面签时间、地点、携带证件与专人陪同',
    tags: ['面签邀约', '绿色通道', '携带证件', '专属排期'],
    script: '“王总好消息！您的方案已经通过银行系统初步预审，已为您预约了明天上午10:00在【银行分行财富中心】的专属绿色通道。请携带本人身份证原件和房产证，我们的专属顾问会全程陪同您办理，预计半小时内完成面签核身！”',
    actionAdvice: '二选一法则敲定时间（明天上午10点还是下午2点），明确专人陪同降低心理负担。',
    summaryTemplate: '【面签邀约】已与客户电话确认下户面签时间，提醒携带身份证与房产证明，约定专属顾问陪同。',
  },
  {
    id: 'clos-3',
    stage: 'closing',
    title: '管家式极简线上代办催件',
    subTitle: '极简化流程，降低客户时间精力成本',
    tags: ['催交材料', '管家代办', '拍照微信发', '20分钟面签'],
    script: '“刘总，您平时业务忙，我们全程提供管家式极简代办：您只需在微信把身份证、营业执照拍个照片发我，其余流水调取和报审材料整理全部由我们专员帮您跑腿做好，您只需要最后面签花20分钟核身即可！”',
    actionAdvice: '降低行动门槛，把繁琐工作全部揽下，让客户只需拍照。',
    summaryTemplate: '【催交材料】告知管家式代办服务流程，客户同意通过微信发送证件照片。',
  },
];

interface SmartPitchGuideSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyScriptToInput?: (script: string, summary?: string) => void;
  className?: string;
  defaultStage?: CallStage;
}

export const SmartPitchGuideSidebar: React.FC<SmartPitchGuideSidebarProps> = ({
  isOpen,
  onClose,
  onApplyScriptToInput,
  className = '',
  defaultStage = 'opening',
}) => {
  const [activeStage, setActiveStage] = useState<CallStage | 'all'>(defaultStage);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const stageConfig = {
    opening: {
      name: '开场破冰',
      icon: '🚀',
      badge: 'bg-blue-50 text-blue-700 border-blue-200',
      activeTab: 'bg-blue-600 text-white',
      borderAccent: 'border-blue-200 hover:border-blue-400',
      tagBadge: 'bg-blue-50 text-blue-700 border-blue-100',
    },
    discovery: {
      name: '需求挖掘',
      icon: '🔍',
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      activeTab: 'bg-indigo-600 text-white',
      borderAccent: 'border-indigo-200 hover:border-indigo-400',
      tagBadge: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    },
    objection: {
      name: '异议化解',
      icon: '🛡️',
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
      activeTab: 'bg-amber-600 text-white',
      borderAccent: 'border-amber-200 hover:border-amber-400',
      tagBadge: 'bg-amber-50 text-amber-700 border-amber-100',
    },
    closing: {
      name: '促成邀约',
      icon: '⚡',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      activeTab: 'bg-emerald-600 text-white',
      borderAccent: 'border-emerald-200 hover:border-emerald-400',
      tagBadge: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    },
  };

  const filteredScripts = STAGE_SCRIPT_ITEMS.filter((item) => {
    if (activeStage !== 'all' && item.stage !== activeStage) return false;
    if (searchKeyword.trim()) {
      const kw = searchKeyword.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(kw);
      const matchScript = item.script.toLowerCase().includes(kw);
      const matchTags = item.tags.some(t => t.toLowerCase().includes(kw));
      return matchTitle || matchScript || matchTags;
    }
    return true;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApply = (item: StageScriptItem) => {
    if (onApplyScriptToInput) {
      onApplyScriptToInput(item.script, item.summaryTemplate);
    } else {
      handleCopy(item.id, item.script);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
      
      {/* Header */}
      <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-2xs font-bold">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-slate-900">智能话术引导栏</h3>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                电销实时辅助
              </span>
            </div>
            <p className="text-[10px] text-slate-400">分阶段金牌话术 · 点击即用无需切页</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
          title="关闭引导栏"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="p-3 bg-white border-b border-slate-100">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="搜索关键词（如：先息后本、利息高、二抵、税票、面签）..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 transition"
          />
          {searchKeyword && (
            <button
              type="button"
              onClick={() => setSearchKeyword('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Stage Tabs (4 Stages with Distinct Semantic Tokens) */}
      <div className="grid grid-cols-5 p-2 bg-slate-50 border-b border-slate-200/80 gap-1 text-[11px] font-bold">
        <button
          type="button"
          onClick={() => setActiveStage('all')}
          className={`py-1.5 rounded-lg text-center transition cursor-pointer ${
            activeStage === 'all'
              ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          全部 ({STAGE_SCRIPT_ITEMS.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveStage('opening')}
          className={`py-1.5 rounded-lg text-center transition cursor-pointer flex flex-col items-center justify-center ${
            activeStage === 'opening'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-blue-700'
          }`}
        >
          <span>🚀 开场</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveStage('discovery')}
          className={`py-1.5 rounded-lg text-center transition cursor-pointer flex flex-col items-center justify-center ${
            activeStage === 'discovery'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-indigo-700'
          }`}
        >
          <span>🔍 需求</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveStage('objection')}
          className={`py-1.5 rounded-lg text-center transition cursor-pointer flex flex-col items-center justify-center ${
            activeStage === 'objection'
              ? 'bg-amber-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-amber-700'
          }`}
        >
          <span>🛡️ 拒绝</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveStage('closing')}
          className={`py-1.5 rounded-lg text-center transition cursor-pointer flex flex-col items-center justify-center ${
            activeStage === 'closing'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'text-slate-600 hover:text-emerald-700'
          }`}
        >
          <span>⚡ 促成</span>
        </button>
      </div>

      {/* Script List Scroll Area (Tiered Cards Layout) */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/50">
        {filteredScripts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl my-4">
            未找到匹配的话术模板，换个关键词试试
          </div>
        ) : (
          filteredScripts.map((item) => {
            const config = stageConfig[item.stage];
            const isCopied = copiedId === item.id;

            return (
              <div
                key={item.id}
                className={`p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition-all duration-150 space-y-2.5 relative group`}
              >
                {/* Card Title & Stage Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${config.badge}`}>
                        {config.icon} {config.name}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">{item.subTitle}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopy(item.id, item.script)}
                      className={`p-1.5 rounded-lg border text-[11px] font-semibold transition cursor-pointer ${
                        isCopied
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                      title="复制话术到剪贴板"
                    >
                      {isCopied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApply(item)}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-bold transition flex items-center space-x-1 cursor-pointer"
                      title="一键填入至当前跟进记录/纪要输入框"
                    >
                      <Send className="w-3 h-3" />
                      <span>填入</span>
                    </button>
                  </div>
                </div>

                {/* Script Body Box */}
                <div className="p-2.5 bg-slate-50/70 rounded-lg border border-slate-100 text-[11px] leading-relaxed text-slate-800 whitespace-pre-line font-normal select-text">
                  {item.script}
                </div>

                {/* Action Advice Tip */}
                <div className="flex items-start space-x-1 text-[10px] text-slate-500 leading-snug">
                  <span className="text-blue-500 font-bold shrink-0">💡 技巧:</span>
                  <span>{item.actionAdvice}</span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-100">
                  {item.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className={`px-1.5 py-0.2 rounded text-[9px] font-medium border ${config.tagBadge}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info Strip */}
      <div className="p-3 bg-white border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between shrink-0">
        <span className="flex items-center space-x-1 text-slate-400">
          <BookOpen className="w-3.5 h-3.5" />
          <span>共 {STAGE_SCRIPT_ITEMS.length} 条助贷标准动作库</span>
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          收起侧栏
        </button>
      </div>

    </div>
  );
};
