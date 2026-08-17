import { Customer, IntentTag } from '../types';

export interface AiPitchSuggestion {
  tag: IntentTag;
  strategyTitle: string;
  focusPoint: string;
  openingPitch: string;
  objectionDefense: string;
  nextStepRecommendation: string;
  urgencyTip: string;
}

/** AI 话术场景 */
export type AiScriptScene = 
  | 'first_call' 
  | 'follow_up' 
  | 'wechat' 
  | 'objection_rate' 
  | 'invite' 
  | 'reactivate'
  | 'close_deal'
  | 'refinance'
  | 'tax_boost';

export type AiToneStyle = 'professional' | 'aggressive' | 'caring';

export interface AiScriptResult {
  scene: AiScriptScene;
  sceneLabel: string;
  toneStyle: AiToneStyle;
  title: string;
  script: string;
  tips: string[];
  complianceNote?: string;
}

export interface ObjectionItem {
  id: string;
  title: string;
  category: string;
  psychology: string;
  categoryKey: 'rate' | 'fee' | 'credit' | 'process' | 'competitor' | 'privacy' | 'noneed';
  solutions: {
    label: string;
    technique: string;
    script: string;
  }[];
}

export interface SimulatorFeedback {
  score: number;
  grade: '卓越' | '优秀' | '良好' | '待提升';
  highlights: string[];
  risks: string[];
  improvedScript: string;
  directorAdvice: string;
}

/** 助贷实战 12+ 大高频异议攻心拆解库 (带心理洞察与多套实战方案) */
export const OBJECTION_MATRIX: ObjectionItem[] = [
  {
    id: 'obj-rate',
    title: '客户嫌利息高：“你们利息怎么这么贵？抖音广告才2.8%！”',
    category: '利率异议',
    categoryKey: 'rate',
    psychology: '客户被互联网营销超低广告利率吸引，并不清楚银行广告通常带有极高的隐性门槛与附加成本，存在认知偏差。',
    solutions: [
      {
        label: '方案A：基准与实操准入门槛拆解法',
        technique: '拆穿广告套路 + 还原真实IRR',
        script: `“张总，我非常理解您对资金成本的关注！网上广告的2.8%通常针对500强高管或特定首套房、征信零查询的极个别人群，实际过件率不足3%。我们给您匹配的国有行房抵年化3.15%是包含10年先息后本、随借随还的实际批贷方案，算下来100万每月利息仅2600多元，提前还款零违约金，综合使用成本比那些捆绑高额担保费的产品划算得多！”`,
      },
      {
        label: '方案B：资金时间价值与周转盈利对比法',
        technique: '用商业利润覆盖利息成本',
        script: `“王总，以您目前的进货周期，这笔150万资金投入能帮您抢下大宗原材料现金折扣，单笔利润率至少在15%-20%。用年化3.2%的极低资金杠杆撬动20%的经营净利，赚到的利润完全覆盖利息，商业上时间就是真金白银！”`,
      },
      {
        label: '方案C：倒推预算与反向定价法',
        technique: '掌握主动权 + 探寻客户真实心理底线',
        script: `“陈总，每家银行利息有高有低，关键看哪种还款方式最适合您的现金流。您心理预期的月供或资金成本大概在多少范围内？我直接按您的预算倒推，在全城合作银行中帮您筛选最贴合的低息通道！”`,
      },
    ],
  },
  {
    id: 'obj-fee',
    title: '客户嫌服务费贵：“为什么找你们还要收服务费？我自己去银行不行吗？”',
    category: '费用异议',
    categoryKey: 'fee',
    psychology: '客户低估了银行信贷申报的专业门槛，担心被中介赚差价，认为自己也能直接去网点办。',
    solutions: [
      {
        label: '方案A：省息空间远超服务费对比法',
        technique: '把服务费包装为投资回报',
        script: `“李总，您自己去网点不仅很难拿到总行特批的低息优惠，还很容易因产品政策不熟悉导致被拒留查记录。我们帮您从3.85%降到3.15%，100万贷款每年为您净省7000元利息，3年省下2万多，省下的利息完全覆盖了服务费，相当于您免费享受了全流程代办与最优通道！”`,
      },
      {
        label: '方案B：试错成本与征信保护说辞',
        technique: '痛点放大 + 规避拒贷黑名单风险',
        script: `“赵总，银行风控系统非常严格，一旦申报材料不规范被拒，半年内其他银行都无法准入。我们熟悉全城40多家银行各支行的实时风控尺度，提前做大数据预审合规包装，确保一枪过件，避免盲目查询弄花征信！”`,
      },
    ],
  },
  {
    id: 'obj-credit',
    title: '客户担心征信查花：“我最近点了几次网贷，会不会办不下来？”',
    category: '征信疑虑',
    categoryKey: 'credit',
    psychology: '客户对名下多头借贷产生自卑或恐惧，担心再次被拒造成征信进一步恶化。',
    solutions: [
      {
        label: '方案A：大数据合规预审不查征信承诺',
        technique: '打消心理顾虑 + 给出安全确定性',
        script: `“刘总，您千万不用担心！我们第一步采用的是合规大数据内部风控初筛系统，在预审阶段绝对不查您的人行征信，不留任何痕迹。我们会先帮您做征信健康诊断，排查雷区后走‘只看房产净值/税票开票’的宽松银行通道，确保十拿九稳才正式进件！”`,
      },
      {
        label: '方案B：小贷置换与征信净化方案',
        technique: '化危机为增值服务',
        script: `“周总，网贷多头不仅利息高达15%-24%，还会拉低您的信用评分。我们这笔大额低息银行贷款批下来后，可以直接把您名下零散的高息网贷一笔结清置换，不仅月供直接减半，3个月后您的征信也会彻底恢复优质！”`,
      },
    ],
  },
  {
    id: 'obj-repayment',
    title: '客户只想先息后本：“我不要等额本息，月供压力太大受不了！”',
    category: '还款方式',
    categoryKey: 'process',
    psychology: '小微企业主现金流紧绷，等额本息每月归还本金会严重挤占经营流动资金。',
    solutions: [
      {
        label: '方案A：10年期大额先息后本专属产品匹配',
        technique: '直击痛点 + 给出定制化产品',
        script: `“张总，非常懂您的需求！针对经营周转客户，我们主推的就是国有大行的‘小微经营贷’，授信10年期，每年无还本自动续贷，每月仅还利息。以100万为例，每月仅需2600多元利息，到期本金直接无缝滚动，绝不给您的生意现金流增添月供压力！”`,
      },
    ],
  },
  {
    id: 'obj-competitor',
    title: '客户已在对比同行：“我已经找了另一家中介在办了”',
    category: '同行竞争',
    categoryKey: 'competitor',
    psychology: '客户正在比价或已被其他中介画饼，但内心对进度和费用透明度仍存疑虑。',
    solutions: [
      {
        label: '方案A：专业把关与备选方案防截流法',
        technique: '不贬低对手 + 树立第三方专业顾问形象',
        script: `“孙总，多对比肯定是好事！方便问下对方给您报的是哪家银行、年化多少、先息还是等本吗？很多中介前期口头承诺低息，进件后又要求加收各种杂费。您可以把他们的方案和合同发我，我帮您免费把把关排排雷，万一那边审批卡壳，咱们随时无缝启动备选绿色通道！”`,
      },
    ],
  },
  {
    id: 'obj-family',
    title: '房产抵押怕家人知道：“我房子抵押不想让我老婆/老公知道”',
    category: '隐私顾虑',
    categoryKey: 'privacy',
    psychology: '客户有个人债务或生意投资不想引起家庭矛盾，急需单签合规通道。',
    solutions: [
      {
        label: '方案A：单人签字与经营主体隔离合规通道',
        technique: '提供合规单签方案 + 绝对隐私保护',
        script: `“郑总，我们非常理解您的隐私诉求。目前我们合作的部分股份制银行有针对产权人本人的单签经营贷产品，只要房产证为您单独所有或通过合规经营主体认定，即可走单人面签审批流程，全程隐私保护，不产生家庭打扰！”`,
      },
    ],
  },
  {
    id: 'obj-noneed',
    title: '客户说不急用钱：“我现在账上有钱，暂时不需要贷款”',
    category: '暂无需求',
    categoryKey: 'noneed',
    psychology: '缺乏危机意识或未意识到授信审批周期，习惯临时缺钱才到处借。',
    solutions: [
      {
        label: '方案A：0成本备用金与资金防火墙说辞',
        technique: '晴天借伞 + 顺境储备资金',
        script: `“刘总，顺境时储备资金，逆境时才能从容应对！现在央行普惠降息政策窗口期极佳，我们帮您先申请批复一个300万的授信额度。这个产品是‘批而不用不收任何利息’的，随用随提，不用就不花一分钱利息，相当于给企业免费办了一张大额资金安全网，关键时刻不用求人！”`,
      },
    ],
  },
  {
    id: 'obj-taxamount',
    title: '企业税贷额度不满意：“才批80万不够用，我要200万”',
    category: '额度异议',
    categoryKey: 'rate',
    psychology: '单家银行信用贷额度受限，无法满足客户大规模采购或周转需求。',
    solutions: [
      {
        label: '方案A：多银行联合授信与组合拳增信法',
        technique: '组合申报 + 额度拼装',
        script: `“黄总，纯税票贷单家银行通常上限在100万左右。针对您200万的缺口，我们采用‘招行税贷80万 + 微众流水贷70万 + 浦发开票贷60万’三家银行联合授信的组合方案，同步在线授权秒级提款，帮您一次性拼齐200万全部缺口，综合年化依然控制在3.8%以内！”`,
      },
    ],
  },
  {
    id: 'obj-trouble',
    title: '嫌准备资料麻烦：“要准备这么多流水房本，太麻烦不办了”',
    category: '流程抗拒',
    categoryKey: 'process',
    psychology: '对传统繁杂的银行审批产生心理畏难，期望极简放款。',
    solutions: [
      {
        label: '方案A：全程专人代办与极速线上秒核法',
        technique: '管家式代劳 + 降低客户行动阻力',
        script: `“陈姐，您千万不用担心手续繁琐！除了您必须亲自签署的面签合同外，所有的银行纳税查验、房产评估估值、流水合规整理和资方预审报件，全部由我们资深团队一对一全程代办协助。您只需要在微信上拍个照，剩下的我们全力跑通，最快3天直接批贷到您的个人一类卡！”`,
      },
    ],
  },
  {
    id: 'obj-rejected',
    title: '客户刚被拒贷：“我之前去某银行被拒了，你们肯定也不行”',
    category: '被拒阴影',
    categoryKey: 'credit',
    psychology: '产生自卑或怀疑情绪，认为所有银行风控标准完全一致。',
    solutions: [
      {
        label: '方案A：银行风控模型差异化与特批通道解析',
        technique: '专业排雷 + 重拾过件信心',
        script: `“吴总，每家银行的风控模型和偏好完全不同！建行可能看重公积金和近2个月查询，但微众和宁波银行更看重您的企业开票纳税与房产净值抵押空间。我们通过大数据风控初筛系统预审，帮您规避同质化拒贷雷区，走特批通道直接对接分行信贷主管，过件率达90%以上！”`,
      },
    ],
  },
];

/** 提取客户画像要素（供话术模板注入） */
function extractCustomerProfile(customer: Customer) {
  const name = customer.name || '客户';
  const surname = name.charAt(0);
  const title = surname ? `${surname}总/女士` : '您好';

  const subjectMap: Record<string, string> = {
    mortgage: '房产抵押',
    merchant: '个体商户经营',
    business: '企业税票/经营',
    personal: '个人信用/公积金',
  };
  const subject = subjectMap[customer.subjectType] || '综合融资';

  const topProduct = customer.matchedProducts?.[0];
  const productDesc = topProduct
    ? `「${topProduct.productName}」`
    : '我们为您匹配的专属方案';

  const property = customer.property;
  const hasProperty = property?.hasProperty;
  const propertyVal = property?.estimatedValuation || 0;

  const business = customer.business;
  const hasBusiness = business?.hasEnterprise;
  const annualSales = business?.annualInvoicedAmount || business?.annualRevenueFlow || 0;

  const credit = customer.creditSummary;
  const creditDesc = credit?.hasCurrentOverdue
    ? '当前有逾期记录，需走特批/养护方案'
    : (credit?.queryCount2Month || 0) > 3
      ? '近2月查询偏多，需规避强查询银行'
      : '征信资质优良，可冲刺低息通道';

  const lastFollowUp = customer.followUps?.[customer.followUps.length - 1];
  const lastFollowUpDesc = lastFollowUp
    ? `${lastFollowUp.date} ${lastFollowUp.type === 'phone' ? '电话' : lastFollowUp.type === 'wechat' ? '微信' : lastFollowUp.type === 'visit' ? '到访' : '系统'}跟进：${(lastFollowUp.content || '').slice(0, 40)}`
    : '暂无历史跟进记录，属首次触达';

  const urgency = customer.urgency || '正常(1-2周)';
  const amount = customer.requestedAmount || 100;

  return { name, title, subject, productDesc, hasProperty, propertyVal, hasBusiness, annualSales, creditDesc, lastFollowUpDesc, urgency, amount };
}

/** 场景清单（供 UI 渲染） */
export const AI_SCRIPT_SCENES: { id: AiScriptScene; label: string; icon: string; desc: string; category: string }[] = [
  { id: 'first_call', label: '首呼破冰', icon: '📞', desc: '新线索第一次外呼黄金开场', category: '开场触达' },
  { id: 'follow_up', label: '回访推进', icon: '🔄', desc: '基于上次跟进记录深度推进', category: '需求挖掘' },
  { id: 'wechat', label: '微信跟进', icon: '💬', desc: '短信/微信精炼三行高回复文本', category: '开场触达' },
  { id: 'objection_rate', label: '利率攻心', icon: '💰', desc: '嫌利息高与广告比价攻心应答', category: '异议破冰' },
  { id: 'invite', label: '邀约面签', icon: '📅', desc: '二选一默认成交约到店/面签', category: '促成签约' },
  { id: 'close_deal', label: '临门逼单', icon: '⚡', desc: '额度与特批名额倒计时逼单', category: '促成签约' },
  { id: 'refinance', label: '转贷降息', icon: '📉', desc: '存量高息转低息置换测算', category: '方案报价' },
  { id: 'tax_boost', label: '税票提额', icon: '🏢', desc: '纳税评级纯信用大额提额话术', category: '方案报价' },
  { id: 'reactivate', label: '失联激活', icon: '🔔', desc: '沉睡/失联客户利好政策唤醒', category: '客户盘活' },
];

/** 多场景与多风格 AI 话术动态生成器 */
export function generateAiScript(
  customer: Customer, 
  scene: AiScriptScene, 
  toneStyle: AiToneStyle = 'professional'
): AiScriptResult {
  const p = extractCustomerProfile(customer);
  const assetHook = p.hasProperty
    ? `名下${p.propertyVal ? `估值约${p.propertyVal}万的` : ''}房产有充裕净值空间`
    : p.hasBusiness
      ? `企业${p.annualSales ? `年营收约${p.annualSales}万` : '经营流水'}稳定`
      : '工薪与公积金缴存资质优良';

  const tonePrefix = toneStyle === 'aggressive'
    ? '【犀利逼单风格】'
    : toneStyle === 'caring'
      ? '【温情顾问风格】'
      : '【专业金融风格】';

  let title = '';
  let script = '';
  let tips: string[] = [];
  let complianceNote = '';
  let sceneLabel = '';

  switch (scene) {
    case 'first_call':
      sceneLabel = '首呼破冰';
      title = `${p.subject} · ${p.amount}万需求首呼开场 (${tonePrefix})`;
      if (toneStyle === 'aggressive') {
        script = `“${p.title}您好！我是雁讯咨询的融资主管。系统匹配到您有${p.amount}万${p.subject}资金需求，今天直截了当跟您汇报：目前工行针对${assetHook}给出了年化3.15%先息后本特惠通道，名额本周收官。您现在方便花1分钟对一下基础信息，我马上给您锁定这个指标吗？”`;
      } else if (toneStyle === 'caring') {
        script = `“${p.title}您好，打扰您了！我是雁讯咨询的融资顾问。看到您近期有在关注${p.amount}万${p.subject}周转方案，考虑到现在市场降息政策变动快，特地给您做个免费额度测算，让您心里有个底。不推销任何产品，您看今天方便简单沟通一两句吗？”`;
      } else {
        script = `“${p.title}您好！我是雁讯咨询的融资顾问。今天联系您是因为系统匹配到您的${p.subject}资金需求（约${p.amount}万）。${assetHook}，目前合作银行针对这类资质开通了专属低息绿色通道，${p.productDesc}批贷率达95%以上。方便简单交流两句，帮您免费做个额度预审吗？”`;
      }
      tips = [
        '前15秒说清「我是谁 + 为什么联系 + 对客户的核心价值」，不盲目报底价',
        `风控洞察：${p.creditDesc}，沟通中保护客户隐私`,
        '若客户质疑信息来源：告知为合作银行普惠小微大数据推荐白名单客户',
      ];
      complianceNote = '合规提示：首次触达必须明示机构真实身份，严禁承诺“包过/百分百批贷”。';
      break;

    case 'follow_up':
      sceneLabel = '回访推进';
      title = '基于历史跟进记录的二次深度回访';
      script = `“${p.title}您好！我是雁讯的融资顾问。上次跟您沟通了${p.subject}这笔${p.amount}万方案，今天跟您确认两点：一是方案测算的年化利率和10年先息后本模式是否都清晰了；二是银行这批低息指标有限，今天方便的话我帮您先做个系统预审锁定名额，避免政策收紧后利率上浮。您看今天上午方便把基础材料发我看看吗？”`;
      tips = [
        '回访目标单一化：每次只推进一个明确里程碑（意向确认 → 资料收取 → 邀约面签）',
        '提及上次沟通的具体细节可大幅提升信任感与接通意愿',
        '给出轻度行动指令，降低客户决策阻力',
      ];
      complianceNote = '合规提示：禁止使用虚假紧迫口吻，如“最后1小时/过期作废”等违规话术。';
      break;

    case 'wechat':
      sceneLabel = '微信跟进';
      title = '微信/短信三行精炼短文本触达';
      script = `[${p.name}您好，我是雁讯咨询顾问] 上次为您测算的${p.amount}万${p.subject}方案已生成：\n1️⃣ 年化低至3.15%，10年先息后本\n2️⃣ 随借随还，不提款0利息\n3️⃣ 资料线上预审，不查人行征信\n回复「1」给您发详细月供对比表，回复「2」帮您预约明日到店面签。`;
      tips = [
        '微信内容严格控制在3-5行内，要点用数字标明，视觉极佳',
        '给出明确的「数字回复」指令，大幅提高客户互动转化率',
        '未回复客户间隔3天再次以新利好触达，避免连续轰炸',
      ];
      complianceNote = '合规提示：短消息必须带有机构签名，严禁携带违规未知外链。';
      break;

    case 'objection_rate':
      sceneLabel = '利率攻心';
      title = '客户嫌利息高攻心破冰话术';
      script = `“${p.title}，非常理解您对资金成本的重视！您在网上看到的超低广告利率，实际批贷门槛极高，往往带有捆绑费用。我们给您报的是${p.productDesc}的真实过件方案，${p.hasProperty ? `以您${p.propertyVal ? `估值${p.propertyVal}万的房产` : '房产'}空间` : p.hasBusiness ? `以企业年营收${p.annualSales}万资质` : '以您的良好流水'}，100万月息仅2600多块。更重要的是‘批而不用不计息’，相当于办了一个随用随提的大额资金安全网。您心理可接受的月供大概在什么范围？我按您的预算倒推方案！”`;
      tips = [
        '先共情再拆解：对比“广告价格”与“真实批贷成本”，切忌与客户硬辩',
        '引导客户说出心理月供区间，掌握定价主动权',
        '强调资金备胎价值与随借随还灵活性',
      ];
      complianceNote = '合规提示：严禁恶意诋毁同业或银行，坚守客观专业原则。';
      break;

    case 'invite':
      sceneLabel = '邀约面签';
      title = '邀约到店/分行面签核验（临门二选一）';
      script = `“${p.title}您好！您申请的${p.amount}万${p.subject}方案已通过银行系统预审初筛，本周可安排面签核验。我已帮您预约了经办行的VIP绿色窗口，全程我陪同办理，预计半小时完成。您看明天上午10:00还是下午2:30更方便？我提前把需要携带的原件清单（身份证、${p.hasProperty ? '房产证、' : ''}公章/流水）发您，咱们争取这周内拿到正式批复！”`;
      tips = [
        '使用“二选一”默认成交法，避免问客户“来不来”',
        '面签前2小时发送微信温馨提醒并再次核对证件清单',
        '强调“已通过系统预审”给客户极强的确定性',
      ];
      complianceNote = '合规提示：邀约中的预审进度必须真实，禁止虚构审批结果。';
      break;

    case 'close_deal':
      sceneLabel = '临门逼单';
      title = '特批额度与降息指标收定逼单';
      script = `“${p.title}，跟您同步一个关键节点：经办行分行信贷主管刚给我反馈，本季度年化3.15%的小微特惠降息名额目前全省仅剩最后2个指标，明天下午17:00系统将自动关闭锁定窗口。您这边今天把协议和定金锁定下来，我立即替您录入系统占住这个利率，否则下周重新报件可能上浮到3.65%，每年多交好几万利息。咱们今天直接把流程定下来，您看可以吗？”`;
      tips = [
        '用真实的政策截止时效制造合理紧迫感',
        '量化迟疑的成本（如上浮后每年多付数万元利息）',
        '协助客户立刻采取行动，现场收定锁单',
      ];
      complianceNote = '合规提示：逼单话术需实事求是，禁止编造不存在的监管或总行指令。';
      break;

    case 'refinance':
      sceneLabel = '转贷降息';
      title = '存量高息房贷/经营贷降息置换话术';
      script = `“${p.title}您好！我是雁讯咨询的资深顾问。看到您名下有正在按揭/抵押的房产，目前央行连续降息，存量4.5%-5.8%的高息贷款可以通过合规经营抵押置换为年化3.15%的新方案。以您200万贷款为例，转贷后每年可直接净省3万多利息，10年下来省下一辆中高端轿车！而且我们可以为您配套无需提前垫资的无缝衔接通道，您看方便加个微信给您发转贷测算明细吗？”`;
      tips = [
        '直观量化降息收益（每年省几万、10年省一台车）',
        '打消资金周转顾虑：强调无需高息过桥垫资或有配套垫资方案',
      ];
      complianceNote = '合规提示：转贷操作必须符合当地监管要求与真实经营用途合规。';
      break;

    case 'tax_boost':
      sceneLabel = '税票提额';
      title = '企业纳税信用纯信用大额提额话术';
      script = `“${p.title}您好！恭喜贵司纳税评级达标！针对年纳税额和开票稳健的优质企业，目前招商与微众银行联合开通了‘银税直连’纯信用秒批通道。无需任何抵押物，纯凭近1年开票数据即可批复最高300万授信，按日计息、随借随还。今天测算不查人行征信，您看方便用手机授权1分钟查一下预审额度吗？”`;
      tips = [
        '强调纯信用、无抵押、按日计息的极度便利性',
        '通过手机银行/税局一键授权，降低操作门槛',
      ];
      complianceNote = '合规提示：指导税局授权时必须由企业法人亲自操作，严禁代持账号密码。';
      break;

    case 'reactivate':
    default:
      sceneLabel = '失联激活';
      title = '沉睡客户利好政策唤醒';
      script = `“${p.title}您好！我是雁讯咨询的顾问晓明，去年咱们沟通过${p.subject}的方案。今天联系是因为近期银行针对优质企业客群下发了一批开门红降息额度，比之前利率下调了将近0.5个百分点，且放宽了征信准入门槛。想着第一时间同步给您，如果您近期有周转规划，我帮您重新测算一下；如果没有也没关系，咱们加个微信，以后有政策变动随时为您更新！”`;
      tips = [
        '以“利好通报与政策更新”为由头，降低推销防备心',
        '给客户台阶：即便不需要也可以先恢复连接，重新建立信任',
      ];
      complianceNote = '合规提示：唤醒前核查号码合规性，若客户明确要求不再联系应及时加入免打扰。';
      break;
  }

  return {
    scene,
    sceneLabel,
    toneStyle,
    title,
    script,
    tips,
    complianceNote,
  };
}

/** AI 销售对练与情景模拟器打分与点评算法 */
export function evaluateSimulatorResponse(
  objectionTitle: string,
  userResponse: string
): SimulatorFeedback {
  const trimmed = userResponse.trim();
  const length = trimmed.length;

  let score = 75;
  const highlights: string[] = [];
  const risks: string[] = [];

  // 规则打分引擎
  if (length > 80) score += 8;
  if (length > 150) score += 5;
  if (length < 30) score -= 20;

  if (trimmed.includes('先息后本') || trimmed.includes('随借随还') || trimmed.includes('年化')) {
    score += 5;
    highlights.push('准确提及了助贷核心产品优势（如先息后本/随借随还/清晰年化）。');
  }

  if (trimmed.includes('理解') || trimmed.includes('确实') || trimmed.includes('明白您')) {
    score += 5;
    highlights.push('具备良好的先跟后带（共情与倾听）能力，先接纳客户情绪再展开说服。');
  } else {
    risks.push('缺少前置共情话术，容易直接陷入与客户抬杠争辩的被动局面。');
  }

  if (trimmed.includes('省') || trimmed.includes('利润') || trimmed.includes('划算') || trimmed.includes('价值')) {
    score += 4;
    highlights.push('能够将成本转化为商业投资回报与省息空间，逻辑具备说服力。');
  }

  if (trimmed.includes('包过') || trimmed.includes('绝对') || trimmed.includes('肯定能贷')) {
    score -= 15;
    risks.push('出现了违规承诺词（如包过/绝对），触碰了金融助贷合规监管红线。');
  }

  if (trimmed.includes('？') || trimmed.includes('吗') || trimmed.includes('您看') || trimmed.includes('方便')) {
    score += 3;
    highlights.push('结尾带有明确的引导性提问，成功将话语权和沟通主动权交还推进。');
  } else {
    risks.push('结尾缺少明确的行动指令或二选一提问，容易导致话题终结。');
  }

  score = Math.max(50, Math.min(98, score));

  const grade = score >= 90 ? '卓越' : score >= 80 ? '优秀' : score >= 70 ? '良好' : '待提升';

  const improvedScript = `“张总，我非常理解您对这一点的顾虑！针对您的具体情况，我们合作银行的方案核心优势在于【10年先息后本+随借随还】，100万月息仅需2600多元，而且在申报前通过合规大数据预审，不查人行征信，确保一枪过件。您看明天上午10点还是下午2点，我把详细测算表带给您当面沟通？”`;

  return {
    score,
    grade,
    highlights: highlights.length > 0 ? highlights : ['语言表达清晰流畅，回答态度真诚。'],
    risks: risks.length > 0 ? risks : ['整体逻辑较完整，可进一步强化紧迫感塑造。'],
    improvedScript,
    directorAdvice: score >= 85
      ? '表现出色！掌握了助贷顾问的核心促成技巧，建议保持节奏，在结尾二选一邀约上更果断。'
      : '仍有提升空间。记住黄金公式：【共情接纳】+【拆解对比/放大价值】+【化解痛点】+【二选一推进指令】。',
  };
}

/** 兼容旧版呼叫弹窗的 AI 破冰与策略生成函数 */
export function generateAiIcebreakerAndAdvice(customer: Customer, tag: IntentTag = 'high_intent'): AiPitchSuggestion {
  const isMortgage = customer.subjectType === 'mortgage' || !!customer.property?.hasProperty;
  const isBusiness = customer.subjectType === 'business' || customer.subjectType === 'merchant' || !!customer.business?.hasEnterprise;

  let strategyTitle = '普惠信贷快速破冰';
  let focusPoint = '强调低息普惠与随借随还优势';
  let openingPitch = `“${customer.name}您好！我是助贷中心的专属资金顾问。了解到您近期有资金周转需求，目前合作银行针对优质客户推出了超低年化利率方案，审批快、还款灵活。今天特地为您做个额度预审！”`;
  let objectionDefense = '若客户提及“利息高”，可重点对比民间融资成本与银行先息后本方案的实际月供压力。';
  let nextStepRecommendation = '收集基础资质信息，尽快在系统发起预审评估。';
  let urgencyTip = '本周利率窗口期特惠中';

  if (isMortgage) {
    strategyTitle = '房产抵押增额降息攻坚';
    focusPoint = '主打先息后本10年期、二抵免结清原按揭、月供极低';
    openingPitch = `“${customer.name}您好！关注到您在本地拥有不动产资产。当前国有大行普惠抵押贷迎来政策红利，年化低至3.15%，最长可做10年先息后本，而且支持二抵免过桥结清！100万月息仅2600多元，帮您大幅降低现有负债月供压力。”`;
    objectionDefense = '若客户嫌“抵押麻烦”，强调全程专人陪同面签下户，绿色审批通道最快3个工作日批复。';
    nextStepRecommendation = '核实房产坐落与按揭剩余本金，测算二抵可贷净值空间。';
    urgencyTip = '红本大额绿色通道审批中';
  } else if (isBusiness) {
    strategyTitle = '企业税票/流水免抵押信用授信';
    focusPoint = '主打纯信用无抵押、见票即贷、秒批随借随还';
    openingPitch = `“${customer.name}您好！根据贵司纳税与流水资质，银行企税直通车现已开放最高300万免抵押授信专案，年化3.85%起，随借随还按日计息，不提款不产生任何费用，非常适合作为企业的备用资金库！”`;
    objectionDefense = '若客户反馈“目前不缺钱”，引导将授信作为企业防范资金链波动的0成本应急备用金。';
    nextStepRecommendation = '索取近1年增值税纳税证明或基本户对账单，当场在线测算精准额度。';
    urgencyTip = '企税白名单限时提额';
  }

  return {
    tag,
    strategyTitle,
    focusPoint,
    openingPitch,
    objectionDefense,
    nextStepRecommendation,
    urgencyTip,
  };
}

/** 行业开场白精选列表 */
export const INDUSTRY_ICEBREAKERS = [
  {
    type: '房产抵押贷 (全款/按揭)',
    title: '房产净值低息先息后本破冰',
    script: `“您好张总，我是工行普惠金融特约服务中心的晓明。看到您在本地有一套优质不动产，目前四大行针对红本住宅推出了新一轮普惠小微降息政策，年化低至3.15%，最长可做10年先息后本，而且支持二抵免结清直接提额。今天特地致电为您做个资产净值预审，您看方便花1分钟了解下吗？”`,
  },
  {
    type: '企业税票/流水贷',
    title: '企业纳税信用免抵押秒批破冰',
    script: `“王总您好，我是助贷业务部的晓明。恭喜贵司纳税信用评级达标！目前微众与国有大行联合推出了‘企税直通车’，无需任何房产抵押，纯凭企业近1年开票流水即可秒批最高300万，年化3.85%起按日计息。近期有扩大生产或供应链采购的资金储备计划吗？”`,
  },
  {
    type: '工薪公积金信用贷',
    title: '优质白领纯信用秒批破冰',
    script: `“李女士您好，打扰您1分钟。建行针对本地连续缴纳公积金满1年的企事业单位员工，开通了纯信用秒批通道，额度最高50万，年化低至3.25%，纯线上提款随借随还。今天测算名额有限，帮您先锁定一个优惠利率通道可以吗？”`,
  },
  {
    type: '按揭房二次抵押贷',
    title: '不结清一抵按揭二次增额破冰',
    script: `“陈总您好！了解到您的住宅目前还有按揭贷款在还，现在银行推出了‘二抵免结清专案’，无需找过桥资金垫资结清按揭，可直接在房产剩余净值空间内追加最高200万授信，年化3.35%，3天放款。您看需要帮您测算下剩余抵押空间吗？”`,
  },
];
