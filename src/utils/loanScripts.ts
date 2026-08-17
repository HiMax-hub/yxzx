// Professional Loan Consulting Script Library (话术库) for Loan Brokers & Financial Consultants

export interface LoanScriptItem {
  id: string;
  category: 'mortgage' | 'tax_invoice' | 'credit' | 'objection' | 'invitation' | 'archive';
  categoryName: string;
  title: string;
  tags: string[];
  scriptText: string;
  summaryTemplate: string; // Ready-to-paste follow-up note
  isCustom?: boolean;
}

export const PRESET_LOAN_SCRIPTS: LoanScriptItem[] = [
  // 1. 房产抵押贷 (Mortgage)
  {
    id: 'script-mort-1',
    category: 'mortgage',
    categoryName: '房产抵押贷',
    title: '一抵/二抵利息与成数优势解答',
    tags: ['房抵', '年化3.25%', '最高8成', '先息后本'],
    scriptText: '您好！我们合作的国有大行及股份行房抵专案，住宅评估价最高可做7-8成，年化利率低至3.25%-3.65%，最长授信10年，支持先息后本、随借随还，无提前还款违约金。若原有一抵按揭利率较高或额度不足，无需垫资结清即可直接办理二次抵押，最快3个工作日批复。',
    summaryTemplate: '【房抵方案沟通】向客户详细介绍了银行房产一抵/二抵专案（年化3.25%-3.65%，成数最高7-8成，先息后本10年期授信）。客户对先息后本及随借随还模式表示认可，已预约查验房产证与产调信息。',
  },
  {
    id: 'script-mort-2',
    category: 'mortgage',
    categoryName: '房产抵押贷',
    title: '房产抵押全流程与办理时效说明',
    tags: ['抵押流程', '时效3-5天', '下户面签'],
    scriptText: '办理房抵流程非常透明高效：第一步在线评估房产估值；第二步备齐身份证、房产证、流水报审初核；第三步银行风控专员下户核验并完成网点面签；第四步不动产登记中心办理线上抵押登记，登记完成后当天即可提款至指定账户。全流程正常3-5个工作日结案。',
    summaryTemplate: '【流程与时效告知】向客户普及房抵标准流转节点（线上评估→材料初审→下户面签→线上抵押登记→放款提额），预计3-5个工作日。已发送面签所需证件清单。',
  },

  // 2. 企业税票贷 / 发票贷 (Tax Invoice Business Loan)
  {
    id: 'script-tax-1',
    category: 'tax_invoice',
    categoryName: '企业税票贷',
    title: '纯信用发票贷准入条件与测算额度',
    tags: ['税票贷', '免抵押', '年开票200万+', '最高300万'],
    scriptText: '张总您好！针对您企业近一年的开票纳税情况，目前招行与微众银行的银税直连普惠贷非常合适：无需任何资产抵押，只要企业成立满1年、近12个月开票额在200万以上、纳税评级为A/B/M级，即可线上授权税局数据秒批最高300万纯信用额度，随借随还，按天计息。',
    summaryTemplate: '【税票贷准入测算】沟通企业税票贷纯信用方案。核实企业成立已超1年，年开票约300-500万，纳税评级良好。已指导客户准备税局账号授权秒级预审额度。',
  },
  {
    id: 'script-tax-2',
    category: 'tax_invoice',
    categoryName: '企业税票贷',
    title: '负债偏高/征信查询多企业的增信方案',
    tags: ['负债化解', '征信查询多', '抵押增信', '联合授信'],
    scriptText: '李总，针对您目前企业他行有部分负债或近期机构查询次数较多的情况，我们可以通过“优质商户流水+稳定上下游采购合同”走分行绿色审批通道，或者采用法人名下房产进行抵押增信，不仅能冲抵征信查询负面影响，还能把综合融资成本降低1.5个百分点。',
    summaryTemplate: '【负债与征信优化方案】针对客户近期征信查询偏多及现有经营负债，制定了“流水+合同补件增信”策略，避免盲目被拒，客户认可补充辅助资产材料。',
  },

  // 3. 工薪公积金/保单信用贷 (Personal Credit Loan)
  {
    id: 'script-credit-1',
    category: 'credit',
    categoryName: '个人信用贷',
    title: '公积金/打卡工资信用贷方案介绍',
    tags: ['公积金贷', '月缴500+', '单笔最高50万', '先息后本'],
    scriptText: '您好！只要您在当前单位连续缴纳公积金满6-12个月，单边月缴存额在500元以上，即可申请合作商业银行的公积金白领信用贷，单家银行最高可授信50万，额度可多笔叠加，年化利率3.0%-3.8%，无需抵押担保，线上提款秒到账。',
    summaryTemplate: '【公积金信用贷沟通】核实客户公积金连续缴存达标，符合优质白领客群准入。测算预授信额度约30-50万元，已协助客户通过手机银行预查额度。',
  },

  // 4. 客户疑虑与异议化解 (Objection Handling)
  {
    id: 'script-obj-1',
    category: 'objection',
    categoryName: '异议化解',
    title: '为什么通过专业助贷机构办理更划算？',
    tags: ['服务价值', '省时省息', '绿色通道', '避免盲目查询'],
    scriptText: '王总，许多客户自己直接去银行网点往往因为产品政策不熟悉被系统拒贷，留下征信查询记录影响后续申请。我们熟悉全城40多家银行不同支行的实时风控偏好与隐形门槛，能为您精准匹配利息最低、成数最高、审批最宽松的通道，并全程协助风控材料包装合规报审，为您节省数十天时间与数万元利息支出。',
    summaryTemplate: '【机构价值与服务费解答】向客户阐明助贷机构在银行渠道偏好匹配、征信保护、大额降息通道等方面的专业价值，客户顾虑消除，同意由我们统一协调申报。',
  },
  {
    id: 'script-obj-2',
    category: 'objection',
    categoryName: '异议化解',
    title: '客户嫌利息高/想观望降息时的解答',
    tags: ['降息周期', '先批后用', '额度锁定', '随时置换'],
    scriptText: '赵总，目前市场利率已处于历史低位区间，且银行批复的额度通常具备3-5年的有效使用期，现在办理是“先批备用、不提款不产生任何利息”。先把最高额度和低利率锁定下来，未来企业资金有周转需求时随时可以在手机上一秒提现，完全不耽误商机。',
    summaryTemplate: '【额度锁定与备用价值引导】向客户强调“先批后用、不提不计息”原则，帮助客户锁定当前优惠利率窗口，客户同意先提交初审批复额度作为备用金。',
  },

  // 5. 邀约面签与催交资料 (Invitation & Document Collection)
  {
    id: 'script-inv-1',
    category: 'invitation',
    categoryName: '邀约与催件',
    title: '银行网点下户面签邀约话术',
    tags: ['面签邀约', '绿色通道', '携带证件', '专属排期'],
    scriptText: '陈总您好！您申请的这笔大额授信方案已经通过银行系统初步预审，已为您预约了明天上午10:00在【经办银行分行财富中心】的专属绿色通道。请您携带本人身份证原件、结婚证、房产证明即可，我们顾问会全程陪同您办理，预计半小时内完成面签核身。',
    summaryTemplate: '【面签邀约确认】已与客户电话确认下户面签时间，提醒携带身份证原件及资产证明。约定由专属顾问陪同至经办银行绿色通道完成签约。',
  },
  {
    id: 'script-inv-2',
    category: 'invitation',
    categoryName: '邀约与催件',
    title: '审批待补件温馨提醒话术',
    tags: ['待补件', '银行催收', '流水补充', '24小时时效'],
    scriptText: '刘总您好！银行信审风控部门正在加急审批您的申请，目前仅需补充【近6个月对公银行流水明细】与【最新经营场所租赁合同】。为确保本周五前顺利放款，烦请您今天下午5点前通过微信发送扫描件，我第一时间递交给信审主管复核！',
    summaryTemplate: '【补件催办记录】已向客户发出待补件清单（对公流水与租赁合同），说明银行审批时效节点，客户承诺今日下班前补齐材料。',
  },

  // 6. 无意向/风控不符归档善后 (Archive & Nurture)
  {
    id: 'script-arc-1',
    category: 'archive',
    categoryName: '归档与培育',
    title: '暂时资质不符客户的养征信与定期激活',
    tags: ['养征信', '定期回访', '转介绍', '转贷时机'],
    scriptText: '孙女士，根据本次银行风控反馈，建议您近3个月内不要再频繁申请网络小额贷款或信用卡分期，将个人信用卡使用率控制在50%以内。3个月后征信评分回升，我们再为您申请大额低息银行抵押贷。后续有任何资金问题随时微信联系我！',
    summaryTemplate: '【资质辅导与长线维护】详细告知客户当前征信查询偏多的原因，给出3个月养征信降负债建议。客户态度友好，设为长线培育池并在3个月后定期回访。',
  },
];

const LOCAL_STORAGE_SCRIPTS_KEY = 'loan_crm_custom_scripts_v1';

export function getCustomLoanScripts(): LoanScriptItem[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_SCRIPTS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to read custom scripts', e);
  }
  return [];
}

export function saveCustomLoanScript(script: Omit<LoanScriptItem, 'id' | 'isCustom'>): LoanScriptItem {
  const newScript: LoanScriptItem = {
    ...script,
    id: `custom-script-${Date.now()}`,
    isCustom: true,
  };
  const existing = getCustomLoanScripts();
  const updated = [newScript, ...existing];
  try {
    localStorage.setItem(LOCAL_STORAGE_SCRIPTS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save custom script', e);
  }
  return newScript;
}

export function getAllLoanScripts(): LoanScriptItem[] {
  const custom = getCustomLoanScripts();
  return [...custom, ...PRESET_LOAN_SCRIPTS];
}
