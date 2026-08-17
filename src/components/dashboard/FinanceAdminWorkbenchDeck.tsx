import React from 'react';
import {
  Coins,
  DollarSign,
  TrendingUp,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ChevronRight,
  Download,
  Users,
} from 'lucide-react';
import { LoanCase, UserAccount } from '../../types';
import { FinanceOverviewDashboard } from '../finance/FinanceOverviewDashboard';

interface FinanceAdminWorkbenchDeckProps {
  currentUser: UserAccount;
  loanCases: LoanCase[];
  onNavigate: (nav: string) => void;
}

export const FinanceAdminWorkbenchDeck: React.FC<FinanceAdminWorkbenchDeckProps> = ({
  currentUser,
  loanCases,
  onNavigate,
}) => {
  // 未结清尾款的工单
  const pendingSettlementCases = loanCases.filter(
    (l) => (l.stage === 'disbursement' || l.stage === 'post_loan') && !l.isFeeSettled
  );

  return (
    <div className="space-y-5">
      {/* 财务经营与回款可视化看板 */}
      <FinanceOverviewDashboard
        loanCases={loanCases}
        currentUser={currentUser}
      />

      {/* 财务快捷待办两栏：待催缴尾款工单 + 佣金打款审核 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 待催缴尾款工单 */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                <Receipt className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                放款后待收尾款工单 ({pendingSettlementCases.length})
              </h3>
            </div>
            <button
              onClick={() => onNavigate('settlement')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-0.5 cursor-pointer"
            >
              <span>财务结算中心</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2">
            {pendingSettlementCases.slice(0, 4).map((c) => {
              const pendingBalance = (c.serviceFeeTotal || 0) - (c.serviceFeeDepositPaid || 0) - (c.serviceFeeBalancePaid || 0);
              return (
                <div
                  key={c.id}
                  className="p-3 bg-slate-50 hover:bg-amber-50/40 rounded-xl border border-slate-200/70 transition flex items-center justify-between gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-xs truncate">{c.customerName}</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded font-semibold">
                        待结尾款: ¥{pendingBalance.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                      经办顾问: {c.consultantName} · 放款: ¥{c.appliedAmount}万 · 应收总计: ¥{c.serviceFeeTotal?.toLocaleString()}
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate('settlement')}
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer shrink-0"
                  >
                    对账核销
                  </button>
                </div>
              );
            })}

            {pendingSettlementCases.length === 0 && (
              <div className="py-6 text-center text-xs text-emerald-600 font-medium flex items-center justify-center space-x-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>所有已放款工单服务费均已全额结清入账！</span>
              </div>
            )}
          </div>
        </div>

        {/* 顾问月度提成结算核算 */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                业务顾问阶梯提成审核核发
              </h3>
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>财务双人复核就绪</span>
            </span>
          </div>

          <div className="p-4 bg-blue-50/40 rounded-xl border border-blue-100 text-xs space-y-2">
            <div className="flex justify-between font-bold text-slate-900">
              <span>当月全员预估应发提成佣金:</span>
              <span className="font-mono text-blue-700 text-sm">
                ¥{loanCases.reduce((sum, l) => sum + (l.commissionAmount || 0), 0).toLocaleString()} 元
              </span>
            </div>
            <p className="text-slate-500 text-[11px]">
              依据各顾问当月实际回款金额与放款阶梯档位（15% ~ 30%）自动结算，已收服务费为提成发放前置条件。
            </p>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => onNavigate('settlement')}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-2xs transition cursor-pointer"
              >
                前往核对提成明细单
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
