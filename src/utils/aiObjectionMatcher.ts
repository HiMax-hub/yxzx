// AI Objection Handling Matcher & Pacifying Speech Advisor

export interface MatchedObjectionSuggestion {
  id: string;
  category: 'rate' | 'fee' | 'credit' | 'docs' | 'no_need' | 'mortgage_risk' | 'compare' | 'privacy' | 'family';
  title: string;
  triggerKeywords: string[];
  psychologicalInsight: string; // 客户底层顾虑分析
  soothingScript: string; // 金牌安抚与化解话术
  summaryText: string; // 格式化跟进纪要
}

export const POPULAR_OBJECTION_SUGGESTIONS: MatchedObjectionSuggestion[] = [
  {
    id: 'obj-rate',
    category: 'rate',
    title: '客户嫌利息高 / 利率贵',
    triggerKeywords: ['利息高', '利息贵', '利率高', '年化高', '月供大', '贵了', '太高了', '成本高'],
    psychologicalInsight: '客户将银行综合经营贷与民间高利借贷混淆，或单纯以此作为压价与推脱借口。',
    soothingScript: '“王总，非常理解您对资金成本的考量！目前国有大行普惠金融专案年化已降至3.05%-3.65%历史极低位，而且我们为您匹配的是【10年期先息后本】方案。100万借款每个月利息仅2500多元，随借随还按天计息，不提款不花一分钱。相比您企业利润率和随时抓住商机的周转效率，资金成本几乎可以忽略不计！”',
    summaryText: '【AI异议化解·利息顾虑】向客户解析银行普惠先息后本模式（年化3.05%-3.65%），对比日息与月供还款弹性，引导将授信作为低成本备用库。客户顾虑缓解。',
  },
  {
    id: 'obj-fee',
    category: 'fee',
    title: '客户质疑中介服务费 / 为什么不直接找银行',
    triggerKeywords: ['服务费', '中介费', '手续费', '抽成', '提成', '为什么要找你们', '自己去银行', '中介'],
    psychologicalInsight: '客户误以为直接找银行网点更快更便宜，忽视了银行审批门槛、隐形偏好及盲目自申被拒导致征信弄花的风险。',
    soothingScript: '“李总，很多客户一开始也想直接去网点，但往往因为资料格式不符或网点当月没有优惠额度指标直接被机审拒绝，不仅留下查询记录，半年内都无法再申！我们熟悉全城40多家银行支行实时风控偏好与绿色通道，专人合规辅导报审，帮您多批50-100万额度、利率压低1-2个点，省下的利息远超我们的专业咨询费，而且全程先批贷后付费，不成功0费用！”',
    summaryText: '【AI异议化解·服务价值】向客户阐明助贷机构在银行渠道配对、征信保护、特批降息及提额方面的专业壁垒，强调“批复满意后付费”。客户认可并同意由我方协助报审。',
  },
  {
    id: 'obj-credit',
    category: 'credit',
    title: '征信查询多 / 有网贷 / 有微粒贷 / 怕被拒',
    triggerKeywords: ['查多了', '查询多', '网贷', '微粒贷', '借呗', '逾期', '征信花', '征信不好', '黑名单', '怕过不了'],
    psychologicalInsight: '客户深知自身征信存在小瑕疵，有强烈的自卑心理或担心被银行反复查询加重征信恶化。',
    soothingScript: '“张总，您完全不用担心！大数据时代很多企业主都用过微粒贷或查过额度，这是非常普遍的。关键在于【千万不能再盲目在手机上乱点】，每点一次就多一次硬查询！我们有合作银行专属的‘绿色人工预审’通道，在不产生任何征信查询记录的前提下帮您做方案置换与征信重组，用低息银行大额资金一次性结清零散网贷，还能快速养好征信！”',
    summaryText: '【AI异议化解·征信瑕疵】针对客户网贷偏多与征信查询顾虑，制定“人工绿色初审+低息重组结清网贷”方案，避免客户盲目点测，指导客户锁定专属名额。',
  },
  {
    id: 'obj-no-need',
    category: 'no_need',
    title: '客户反馈目前不缺钱 / 以后再说',
    triggerKeywords: ['不缺钱', '不需要', '不用了', '现在不用', '以后再说', '暂时不用', '先不要', '有钱'],
    psychologicalInsight: '企业当下现金流尚可，缺乏“晴天修屋顶”的资金储备意识，或属于敷衍式礼貌挂断。',
    soothingScript: '“陈总，太好了！说明贵司当前经营非常稳健！现代做企业讲究‘晴天借伞、雨天收伞’，真正急用钱时去银行审批往往来不及。银行这笔专案最大的优势是【额度有效期3-5年，随借随还，不提款不收任何利息】。现在政策好、利率低，我们先帮您把额度批下来作为企业的0成本应急备用金库，需要时手机上秒提，不需要就放着备用，有备无患！”',
    summaryText: '【AI异议化解·储备意识】引导客户建立“晴天储备授信库”理念，强调“先批备用、不提不计息、按日随借随还”，客户同意先申请预审批授信额度。',
  },
  {
    id: 'obj-mortgage-risk',
    category: 'mortgage_risk',
    title: '担心房产抵押风险 / 怕房产被查封',
    triggerKeywords: ['抵押房产', '拿房子抵押', '怕查封', '房子被收', '抵押麻烦', '不想抵押', '名下房子'],
    psychologicalInsight: '对不动产抵押存在过度恐惧，误将银行抵押与民间高利抵押混为一谈。',
    soothingScript: '“刘姐您放心！我们对接的全是正规国有大行（工农中建交及招商银行），抵押权人直接是银行总行，完全受银保监会与民法典严格保护。只要按时还利息，房屋所有权与居住使用权完全在您手中。而且现在支持‘二抵免过桥’，原来按揭不用结清，银行只在房管局做线上附记登记，流程规范透明，完全没有任何产权风险。”',
    summaryText: '【AI异议化解·房产抵押安全】向客户科普国有银行合规抵押机制与二抵线上登记流程，打消产权与民间风险顾虑，客户同意进一步查验房产净值空间。',
  },
  {
    id: 'obj-compare',
    category: 'compare',
    title: '客户还要再对比别家 / 货比三家',
    triggerKeywords: ['再看看', '对比一下', '考虑考虑', '问问别家', '货比三家', '别的银行', '再想想'],
    psychologicalInsight: '缺乏紧迫感，对当前方案的不可替代性存疑，或处于犹豫摇摆期。',
    soothingScript: '“赵总，货比三家绝对是应该的！但融资和买普通商品不同，金融产品的关键在于【政策窗口期与名额】。本批次大行普惠优惠利率是按季度配额的，本周正是窗口期节点。建议今天先把基础资料递交系统锁住当前低息名额，批下来后您拿到正式批复再从容对比，批复出来不满意完全可以放弃，但现在不锁定名额政策一变就可能上浮0.5%！”',
    summaryText: '【AI异议化解·货比三家】向客户强调银行普惠利率季度配额与“先锁定名额、批后再比、不满意可撤”机制，消除犹豫情绪，促成即刻递交资料。',
  },
  {
    id: 'obj-docs',
    category: 'docs',
    title: '客户嫌资料太繁琐 / 准备麻烦',
    triggerKeywords: ['资料多', '麻烦', '手续繁', '准备材料', '太麻烦', '不想弄', '没时间'],
    psychologicalInsight: '精力有限，反感繁杂的报表与证明，需要极简的保姆式服务。',
    soothingScript: '“周总，完全理解您平时业务忙！我们现在全流程提供‘管家式极简申报’：您只需要在微信上拍一下身份证和营业执照，其余银行流水、税局授权、资产评估等全部由我们的专属专员协助线上调取和整理，我们帮您跑腿填单，您只需要在最后面签时抽空花20分钟核身即可！”',
    summaryText: '【AI异议化解·材料繁琐】向客户承诺提供保姆式极简代办服务（线上授权+专人跑腿+极速面签），降低客户时间成本，客户同意发来基础证件。',
  },
  {
    id: 'obj-privacy',
    category: 'privacy',
    title: '担心个人隐私泄露 / 接到骚扰电话',
    triggerKeywords: ['隐私', '信息泄露', '骚扰电话', '个人信息', '安全吗', '泄露'],
    psychologicalInsight: '曾被不良中介倒卖信息骚扰，对助贷行业存在防备与信任危机。',
    soothingScript: '“孙总，您的担心非常关键！我们机构是依法在金融局备案的正规持牌助贷中心，内部全面实施金融级数据脱敏与加密防泄漏系统，全流程直接对接银行专线，未经您本人授权绝不外传任何资料。办完之后系统自动归档加密，绝不会给您带来任何后续骚扰！”',
    summaryText: '【AI异议化解·隐私安全】向客户出具持牌合规与银行直连专线承诺，强调金融级脱敏系统保护，成功建立信任。',
  },
];

/**
 * 根据输入文本或跟进纪要自动匹配最符合的异议化解话术
 */
export function matchObjectionFromText(text: string): MatchedObjectionSuggestion | null {
  if (!text || !text.trim()) return null;
  const lower = text.toLowerCase();

  for (const obj of POPULAR_OBJECTION_SUGGESTIONS) {
    for (const kw of obj.triggerKeywords) {
      if (lower.includes(kw.toLowerCase())) {
        return obj;
      }
    }
  }
  return null;
}
