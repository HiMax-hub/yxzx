import React, { useState } from 'react';
import { 
  Calculator, 
  X, 
  Home, 
  Receipt, 
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { calculateRepaymentPlan, calculateMortgageSpace, calculateTaxLoanLimit } from '../../utils/calculator';
import { RepaymentType, SystemConfig } from '../../types';
import { useEscToClose } from '../../utils/useEscToClose';

interface LoanToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemConfig?: SystemConfig;
}

export const LoanToolsModal: React.FC<LoanToolsModalProps> = ({
  isOpen,
  onClose,
  systemConfig,
}) => {
  const [activeTab, setActiveTab] = useState<'repayment' | 'mortgage' | 'tax'>('repayment');

  // Repayment Calculator State
  const [amountWan, setAmountWan] = useState(100);
  const [termMonths, setTermMonths] = useState(36);
  const [annualRate, setAnnualRate] = useState(3.65);
  const [repayType, setRepayType] = useState<RepaymentType>('interest_first');

  // Mortgage Calculator State
  const [houseValuation, setHouseValuation] = useState(650);
  const [propertyType, setPropertyType] = useState<'residential' | 'commercial' | 'villa'>('residential');
  const [existingDebt, setExistingDebt] = useState(150);

  // Tax Calculator State
  const [annualInvoiceWan, setAnnualInvoiceWan] = useState(1200);
  const [taxGrade, setTaxGrade] = useState<'A' | 'B' | 'M' | 'C'>('A');

  // ESC 关闭
  useEscToClose(isOpen, onClose);

  if (!isOpen) return null;

  const repaymentResult = calculateRepaymentPlan(
    amountWan, 
    annualRate, 
    Math.max(1, Math.round(termMonths / 12)), 
    repayType === 'balloon' ? 'interest_first' : repayType
  );
  const mortgageResult = calculateMortgageSpace(houseValuation, propertyType, existingDebt, systemConfig?.ltvConfig);
  const taxResult = calculateTaxLoanLimit(annualInvoiceWan, taxGrade);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-[#1E293B]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                信贷多场景专业计算与测算工具箱
              </h2>
              <p className="text-xs text-slate-500">
                还款计划对比、房产二抵净值空间评估及企业税票贷授信额度测算
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-6">
          <button
            onClick={() => setActiveTab('repayment')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center space-x-2 ${
              activeTab === 'repayment'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>月供与还款方式计划测算</span>
          </button>
          <button
            onClick={() => setActiveTab('mortgage')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center space-x-2 ${
              activeTab === 'mortgage'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>房产抵押 / 二抵净值空间测算</span>
          </button>
          <button
            onClick={() => setActiveTab('tax')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center space-x-2 ${
              activeTab === 'tax'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>企业税票贷初审额度测算</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6 text-xs">
          {activeTab === 'repayment' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Input Form */}
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="font-bold text-slate-900 text-sm">参数输入</div>
                
                <div>
                  <label className="text-slate-600 block mb-1">贷款金额 (万元):</label>
                  <input
                    type="number"
                    value={amountWan}
                    onChange={(e) => setAmountWan(Number(e.target.value))}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-600 block mb-1">年化利率 (%):</label>
                  <input
                    type="number"
                    step="0.05"
                    value={annualRate}
                    onChange={(e) => setAnnualRate(Number(e.target.value))}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-600 block mb-1">借款期限 (月):</label>
                  <input
                    type="number"
                    value={termMonths}
                    onChange={(e) => setTermMonths(Number(e.target.value))}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-600 block mb-1">还款方式:</label>
                  <select
                    value={repayType}
                    onChange={(e) => setRepayType(e.target.value as RepaymentType)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="interest_first">先息后本 (每月只还利息，到期还本)</option>
                    <option value="equal_principal_interest">等额本息 (每月还款总金额固定)</option>
                    <option value="equal_principal">等额本金 (每月本金相同，利息逐月递减)</option>
                  </select>
                </div>
              </div>

              {/* Calculation Output */}
              <div className="p-5 rounded-xl bg-blue-50/60 border border-blue-200 flex flex-col justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-sm mb-4">测算结果汇总</div>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="text-slate-500">首月 / 常规月供金额</div>
                      <div className="text-2xl font-bold font-mono text-blue-600 mt-0.5">
                        ¥{repaymentResult.monthlyPayment.toLocaleString()} <span className="text-xs font-normal">元/月</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-blue-200">
                      <div>
                        <div className="text-slate-500">还款总利息</div>
                        <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                          ¥{repaymentResult.totalInterest.toLocaleString()} 元
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500">累计本息合计</div>
                        <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                          ¥{repaymentResult.totalRepayment.toLocaleString()} 元
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-blue-100 text-slate-700 leading-relaxed">
                      {repaymentResult.scheduleSummary}
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 mt-4">
                  * 注：实际还款金额以银行信贷系统最终审批借款合同为准。
                </div>
              </div>
            </div>
          )}

          {activeTab === 'mortgage' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="font-bold text-slate-900 text-sm">房产抵押评估参数</div>
                <div>
                  <label className="text-slate-600 block mb-1">房产预估总市值 (万元):</label>
                  <input
                    type="number"
                    value={houseValuation}
                    onChange={(e) => setHouseValuation(Number(e.target.value))}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-600 block mb-1">物业类型:</label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value as any)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="residential">商品住宅 (最高抵押率 70%)</option>
                    <option value="commercial">商铺/写字楼 (最高抵押率 50%)</option>
                    <option value="villa">独栋别墅/豪宅 (最高抵押率 60%)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 block mb-1">已有一抵/按揭贷款余额 (万元):</label>
                  <input
                    type="number"
                    value={existingDebt}
                    onChange={(e) => setExistingDebt(Number(e.target.value))}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="p-5 rounded-xl bg-blue-50/60 border border-blue-200 flex flex-col justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-sm mb-4">房抵净值测算结果</div>
                  <div className="space-y-4">
                    <div>
                      <div className="text-slate-500">可用二抵可贷净值空间</div>
                      <div className="text-3xl font-bold font-mono text-emerald-600 mt-1">
                        ¥{mortgageResult.availableSpace} <span className="text-sm font-normal">万元</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-blue-200">
                      <div>
                        <div className="text-slate-500">一抵总授信限额</div>
                        <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                          ¥{mortgageResult.maxLtvAmount} 万元
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-500">参考抵押成数</div>
                        <div className="text-base font-bold font-mono text-blue-600 mt-0.5">
                          {Math.round(mortgageResult.ltvRatio * 100)}%
                        </div>
                      </div>
                    </div>
                    <p className="p-3 bg-white rounded-lg border border-blue-100 text-slate-700">
                      {mortgageResult.availableSpace > 0 
                        ? `经测算，该房产仍有 ¥${mortgageResult.availableSpace} 万元抵押空间，可匹配各大商业银行经营性二抵贷。` 
                        : '经测算，当前按揭余额已达最高抵押率限额，建议考虑过桥垫资结清一抵后再行办理大额一抵经营贷。'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tax' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="font-bold text-slate-900 text-sm">企业开票与纳税参数</div>
                <div>
                  <label className="text-slate-600 block mb-1">近12个月有效开票金额 (万元):</label>
                  <input
                    type="number"
                    value={annualInvoiceWan}
                    onChange={(e) => setAnnualInvoiceWan(Number(e.target.value))}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-600 block mb-1">税务局纳税信用评级:</label>
                  <select
                    value={taxGrade}
                    onChange={(e) => setTaxGrade(e.target.value as any)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                  >
                    <option value="A">A 级 (极优，倍数最高 18%)</option>
                    <option value="B">B 级 (良好，倍数 14%)</option>
                    <option value="M">M 级 (新设立/正常纳税，倍数 10%)</option>
                    <option value="C">C 级 (轻微瑕疵，倍数 5%)</option>
                  </select>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-blue-50/60 border border-blue-200 flex flex-col justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-sm mb-4">企税贷初评授信额度</div>
                  <div className="space-y-4">
                    <div>
                      <div className="text-slate-500">预估银行纯信用最高授信</div>
                      <div className="text-3xl font-bold font-mono text-blue-600 mt-1">
                        ¥{taxResult.estimatedMaxLimit} <span className="text-sm font-normal">万元</span>
                      </div>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-blue-100 text-slate-700">
                      {taxResult.recommendedCombination}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-sm transition"
          >
            完成测算
          </button>
        </div>
      </div>
    </div>
  );
};
