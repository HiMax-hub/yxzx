/**
 * 核心业务逻辑冒烟测试（正式版发布回归）
 * 覆盖：AI 信用评分引擎 / 异议匹配引擎 / 提成计算 / 合规敏感词 / 权限层级 / 意向自动化
 * 运行：node scripts/smoke-test.mjs（先由 esbuild 打包，见 package.json "test:smoke"）
 */
import assert from 'node:assert';
import { calculateCustomerAiScore } from '../src/utils/aiCreditScorer';
import { matchObjectionFromText, POPULAR_OBJECTION_SUGGESTIONS } from '../src/utils/aiObjectionMatcher';
import { calculateConsultantCommission, DEFAULT_COMMISSION_TIERS } from '../src/utils/calculator';
import { detectViolationKeywords } from '../src/utils/compliance';
import { isSuperAdmin, isConsultant, canViewAllBusiness } from '../src/utils/permissions';
import { INTENT_TAG_LIST } from '../src/utils/intentAutomation';

let passed = 0;
let failed = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e: any) {
    failed++;
    console.error(`  ✗ ${name}: ${e.message}`);
  }
}

console.log('== 1. AI 信用评分引擎 ==');
// 构造高意向优质客户（有房产+无逾期+多条跟进+高紧追度）
const goodCustomer: any = {
  id: 'c1', name: '测试客户A', grade: 'S', requestedAmount: 200,
  property: { hasProperty: true, propertyType: 'residential', estimatedValue: 500, mortgageBalance: 100 },
  creditSummary: { hasCurrentOverdue: false, queryCount2Month: 1 },
  urgency: '一周内急用',
  followUps: [
    { id: 'f1', date: '刚刚', type: 'phone', content: '客户意向强烈', operator: '张强' },
    { id: 'f2', date: '昨天', type: 'wechat', content: '已加微信发送方案', operator: '张强' },
  ],
  subjectType: 'mortgage',
};
test('高意向客户评分应为 A 级及以上（≥70 分）', () => {
  const r = calculateCustomerAiScore(goodCustomer);
  assert.ok(r.overallScore >= 70, `实际得分 ${r.overallScore}`);
  assert.ok(['AAA', 'AA', 'A'].includes(r.scoreTier), `实际等级 ${r.scoreTier}`);
});

// 低质量客户（有当前逾期+无资产+无跟进）——必须先于依赖它的测试定义
const badCustomer: any = {
  id: 'c2', name: '测试客户B', grade: 'D', requestedAmount: 5,
  property: { hasProperty: false },
  creditSummary: { hasCurrentOverdue: true, queryCount2Month: 9 },
  urgency: '',
  followUps: [],
  subjectType: 'credit',
};

test('优质客户评分应显著高于低质量客户', () => {
  const good = calculateCustomerAiScore(goodCustomer);
  const bad = calculateCustomerAiScore(badCustomer);
  assert.ok(good.overallScore - bad.overallScore >= 30, `差距仅 ${good.overallScore - bad.overallScore}`);
});

test('低质量客户评分应低于 50 分', () => {
  const r = calculateCustomerAiScore(badCustomer);
  assert.ok(r.overallScore < 50, `实际得分 ${r.overallScore}`);
});

test('评分五维拆解应完整（5 项均在 0-100）', () => {
  const r = calculateCustomerAiScore(goodCustomer);
  const dims = [r.breakdown.assetQuality, r.breakdown.creditHealth, r.breakdown.intentUrgency, r.breakdown.followUpEngagement, r.breakdown.riskResistance];
  dims.forEach((d) => assert.ok(d >= 0 && d <= 100, `维度 ${d} 越界`));
});

console.log('== 2. 异议匹配引擎 ==');
test('输入"利息太高"应命中利息类异议', () => {
  const m = matchObjectionFromText('客户反馈利息太高了，觉得不划算');
  assert.ok(m, '未命中任何异议');
  assert.match(m.title, /利息|利率|成本/);
});
test('输入"不需要不用了"应命中暂无需求类', () => {
  const m = matchObjectionFromText('客户说现在不缺钱，以后再说');
  assert.ok(m, '未命中');
  assert.match(m.title, /不缺钱|暂无|需求/);
});
test('话术库非空且字段完整', () => {
  assert.ok(POPULAR_OBJECTION_SUGGESTIONS.length >= 5, `仅 ${POPULAR_OBJECTION_SUGGESTIONS.length} 条`);
  POPULAR_OBJECTION_SUGGESTIONS.forEach((s: any) => {
    assert.ok(s.id && s.title && s.soothingScript && s.summaryText, '字段缺失');
  });
});

console.log('== 3. 提成阶梯计算 ==');
test('阶梯提成按档位计算', () => {
  const r = calculateConsultantCommission(50, 150, DEFAULT_COMMISSION_TIERS);
  assert.ok(r.rate >= 15, `rate=${r.rate}`);
  assert.ok(r.commissionAmount > 0, '提成金额应为正');
});
test('超高档位封顶 30%', () => {
  const r = calculateConsultantCommission(500, 1500, DEFAULT_COMMISSION_TIERS);
  assert.ok(r.rate <= 30, `rate=${r.rate}`);
});

console.log('== 4. 合规敏感词检测 ==');
test('承诺批贷等红色违规词应被拦截', () => {
  const v = detectViolationKeywords('跟客户保证批贷绝对没问题，100%下款');
  assert.ok(v.some((x: any) => x.level === 'red'), `未检测到红词: ${JSON.stringify(v)}`);
});
test('正常话术不应误报', () => {
  const v = detectViolationKeywords('今天天气不错，跟进客户沟通还款方案');
  assert.ok(v.length === 0, `误报: ${v.map((x: any) => x.word).join(',')}`);
});

console.log('== 5. 权限层级 ==');
test('超管权限判定', () => {
  assert.ok(isSuperAdmin('super_admin'));
  assert.ok(!isSuperAdmin('consultant'));
});
test('顾问权限隔离（不可看全量业务）', () => {
  assert.ok(!canViewAllBusiness('consultant'));
  assert.ok(canViewAllBusiness('super_admin'));
  assert.ok(canViewAllBusiness('admin'));
  assert.ok(isConsultant('consultant'));
});

console.log('== 6. 意向标签配置 ==');
test('4 类意向标签配置完整（高意向/需回拨/暂无需求/无效）', () => {
  assert.strictEqual(INTENT_TAG_LIST.length, 4);
  const ids = INTENT_TAG_LIST.map((t) => t.id);
  assert.ok(ids.includes('high_intent'));
  assert.ok(ids.includes('no_need'));
});

console.log(`\n结果: ${passed} 通过, ${failed} 失败`);
if (failed > 0) process.exit(1);
