import React, { useState } from 'react';
import { 
  Coins, 
  TrendingUp, 
  DollarSign, 
  Receipt, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  Percent, 
  FileText, 
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  Download
} from 'lucide-react';
import { LoanCase, UserAccount, UserRole, SystemConfig } from '../../types';
import { calculateConsultantCommission, DEFAULT_COMMISSION_TIERS } from '../../utils/calculator';
import { exportCsv, timestampedFilename } from '../../utils/exportUtils';
import { CommissionTargetTrendChart } from './CommissionTargetTrendChart';
import { FinanceOverviewDashboard } from './FinanceOverviewDashboard';
import { isConsultant as isConsultantRole, isFinanceAdmin as isFinanceRole, isSuperAdmin as isSuperAdminRole, isAdmin as isAdminRole } from '../../utils/permissions';

interface FinancialSettlementProps {
  loanCases: LoanCase[];
  setLoanCases: React.Dispatch<React.SetStateAction<LoanCase[]>>;
  currentUser: UserAccount;
  isMasked: boolean;
  systemConfig?: SystemConfig; // 提成档位唯一真相源
}

export const FinancialSettlement: React.FC<FinancialSettlementProps> = ({
  loanCases,
  setLoanCases,
  currentUser,
  isMasked,
  systemConfig,
}) => {
  const isConsultant = isConsultantRole(currentUser.role);
  const isFinance = isFinanceRole(currentUser.role);
  const isSuperAdmin = isSuperAdminRole(currentUser.role);
  const isAdmin = isAdminRole(currentUser.role);
  // 结算操作权限：财务/超管/系统管理员（主管仅只读统览）
  const canSettle = isFinance || isSuperAdmin || isAdmin;

  // Filter cases for consultant（用 consultantId 外键，兼容旧数据回退姓名）
  const filteredCases = isConsultant
    ? loanCases.filter((c) => (c.consultantId ? c.consultantId === currentUser.id : c.consultantName === currentUser.name))
    : loanCases;

  const totalFeeReceivable = filteredCases.reduce((acc, curr) => acc + (curr.serviceFeeTotal || 0), 0);
  const totalDepositReceived = filteredCases.reduce((acc, curr) => acc + (curr.serviceFeeDepositPaid || 0), 0);
  const totalBalanceReceived = filteredCases.reduce((acc, curr) => acc + (curr.serviceFeeBalancePaid || 0), 0);
  const totalReceived = totalDepositReceived + totalBalanceReceived;
  const totalPendingBalance = totalFeeReceivable - totalReceived;

  // Monthly Volume (万元)
  const currentDisbursedVolumeWan = filteredCases
    .filter((l) => l.stage === 'disbursement' || l.stage === 'post_loan' || l.approvedAmount)
    .reduce((acc, curr) => acc + (curr.approvedAmount || curr.appliedAmount || 0), 0);

  const commissionTiers = systemConfig?.commissionTiers?.length
    ? systemConfig.commissionTiers
    : DEFAULT_COMMISSION_TIERS;
  const commissionCalc = calculateConsultantCommission(totalReceived, currentDisbursedVolumeWan, commissionTiers);

  const handleMarkFeeSettled = (caseId: string) => {
    setLoanCases((prev) =>
      prev.map((item) => {
        if (item.id === caseId) {
          const balanceNeeded = (item.serviceFeeTotal || 0) - (item.serviceFeeDepositPaid || 0);
          return {
            ...item,
            serviceFeeBalancePaid: balanceNeeded,
            isFeeSettled: true,
            timeline: [
              ...item.timeline,
              {
                timestamp: new Date().toLocaleString('zh-CN', { hour12: false }),
                stage: item.stage,
                operator: `${currentUser.name} (财务核算)`,
                description: `服务费全额结清 ¥${item.serviceFeeTotal}，财务对账入账成功`,
                isKeyNode: true,
              },
            ],
          };
        }
        return item;
      })
    );
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto text-[#1E293B]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Coins className="w-5 h-5 text-blue-600" />
            <span>财务核算中心与阶梯提成体系</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isConsultant 
              ? `当前处于【业务顾问】视图：仅统计您名下 (${filteredCases.length}) 笔业务的实收服务费与个人应发提成` 
              : isFinance
                ? `当前处于【财务结算】视图：全盘放款清算、服务费对账确认与全员佣金打款审核`
                : `当前处于【管理统览】视图：全盘放款清算、服务费对账与佣金核算（主管仅只读，不可发起结算）`}
          </p>
        </div>

        {canSettle && (
          <div className="flex items-center space-x-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>财务总账双人复核已授权</span>
          </div>
        )}

        {/* 结算明细导出（财务/管理对账刚需） */}
        <button
          onClick={() => {
            const stageLabel: Record<string, string> = {
              pre_screen: '资质初审', docs_collection: '资料收集', submission: '报审银行',
              interview_visit: '下户面签', approval: '审批批复', disbursement: '放款结算', post_loan: '贷后管理',
            };
            exportCsv(
              timestampedFilename('服务费结算明细'),
              ['工单编号', '客户姓名', '产品', '阶段', '申报金额(万)', '批贷金额(万)', '服务费率%', '应收服务费(元)', '已收定金(元)', '已收尾款(元)', '是否结清', '经办顾问'],
              filteredCases.map((l) => [
                l.caseNumber || l.id,
                l.customerName,
                l.productName,
                stageLabel[l.stage] || l.stage,
                l.appliedAmount ?? l.applyAmount ?? 0,
                l.approvedAmount ?? '',
                l.serviceFeeRate ?? '',
                l.serviceFeeTotal ?? '',
                l.serviceFeeDepositPaid ?? '',
                l.serviceFeeBalancePaid ?? '',
                l.isFeeSettled ? '已结清' : '未结清',
                l.consultantName,
              ])
            );
          }}
          className="px-3.5 py-2 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
          title="导出当前筛选条件下的结算明细 (CSV)"
        >
          <Download className="w-3.5 h-3.5" />
          <span>导出明细</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
          <div className="text-xs text-slate-500 font-medium mb-1">
            {isConsultant ? '名下应收服务费' : '全司累计应收服务费'}
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            ¥{totalFeeReceivable.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-2">共 {filteredCases.length} 笔进件工单</div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
          <div className="text-xs text-slate-500 font-medium mb-1">已实收服务费 (定金+尾款)</div>
          <div className="text-2xl font-bold text-emerald-600 font-mono">
            ¥{totalReceived.toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-600 mt-2 font-medium">
            实收回款率 {totalFeeReceivable > 0 ? Math.round((totalReceived / totalFeeReceivable) * 100) : 100}%
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
          <div className="text-xs text-slate-500 font-medium mb-1">待结清尾款余额</div>
          <div className="text-2xl font-bold text-orange-500 font-mono">
            ¥{totalPendingBalance.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-2">放款后即时催缴录入</div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
          <div className="text-xs text-slate-500 font-medium mb-1">
            {isConsultant ? '本月顾问应发提成' : '全员当月预估佣金支出'}
          </div>
          <div className="text-2xl font-bold text-blue-600 font-mono">
            ¥{commissionCalc.commissionAmount.toLocaleString()}
          </div>
          <div className="text-[10px] text-blue-600 mt-2 font-medium">
            当前达成: {commissionCalc.tierName} ({commissionCalc.rate}%)
          </div>
        </div>
      </div>

      {/* 财务经营与回款全景可视化看板 (Recharts: 放款规模、预期服务费创收、回款比例) */}
      <FinanceOverviewDashboard
        loanCases={filteredCases}
        currentUser={currentUser}
      />

      {/* Recharts Monthly & Quarterly Commission Income vs Target Trends */}
      <CommissionTargetTrendChart
        loanCases={filteredCases}
        currentUser={currentUser}
      />

      {/* Commission Tier Progress Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>业务顾问月度阶梯提成晋级通道</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              当月放款累计 ¥{currentDisbursedVolumeWan} 万元，已解锁 {commissionCalc.tierName}
            </p>
          </div>
          <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full self-start sm:self-auto">
            提成点位: {commissionCalc.rate}%
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {commissionTiers.map((tier) => {
            const isActive = currentDisbursedVolumeWan >= tier.minWan &&
              (tier.maxWan >= 9999 || currentDisbursedVolumeWan < tier.maxWan);
            const isReached = currentDisbursedVolumeWan >= tier.minWan;
            return (
              <div key={tier.tierName + tier.minWan} className={`p-4 rounded-xl border text-xs ${isReached ? (isActive ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-500' : 'bg-blue-50 border-blue-200') : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">
                    {tier.tierName} ({tier.maxWan >= 9999 ? `${tier.minWan}万以上` : `${tier.minWan} ~ ${tier.maxWan}万`})
                  </span>
                  {isActive && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-600 text-white rounded">当前档位</span>
                  )}
                </div>
                <div className={`text-lg font-bold mt-1 font-mono ${tier.rate >= 30 ? 'text-purple-600' : tier.rate >= 25 ? 'text-indigo-600' : 'text-blue-600'}`}>
                  {tier.rate}%
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {tier.maxWan >= 9999 ? '全司顶尖合伙人提成' : tier.rate >= 25 ? '达成规模享受更高点位' : tier.rate >= 20 ? '达成率达标即可晋级' : '起步提成点位'}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Settlement Table (Desktop Table + Mobile Responsive Cards) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">进件工单财务收缴与结算明细表</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">实时双人复核对账与尾款核销</p>
          </div>
          <span className="text-xs text-slate-400">共 {filteredCases.length} 笔记录</span>
        </div>

        {/* 1. 移动端折叠卡片流 (Mobile View < md) */}
        <div className="md:hidden divide-y divide-slate-100 p-3 space-y-3">
          {filteredCases.map((row) => (
            <div key={row.id} className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{row.customerName}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{row.caseNumber}</div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${row.isFeeSettled ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {row.isFeeSettled ? '已结清' : '待结尾款'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/60">
                <div>
                  <span className="text-slate-400 text-[11px]">产品类别:</span>
                  <div className="font-medium text-slate-800 truncate">{row.productName}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">放款金额:</span>
                  <div className="font-bold text-slate-900 font-mono">¥{row.appliedAmount} 万元</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">应收服务费 ({row.serviceFeeRate}%):</span>
                  <div className="font-bold text-indigo-700 font-mono">¥{row.serviceFeeTotal?.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">定金/尾款已收:</span>
                  <div className="text-slate-700 font-mono">
                    定:¥{row.serviceFeeDepositPaid?.toLocaleString() || 0} / 尾:¥{row.serviceFeeBalancePaid?.toLocaleString() || 0}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">业务提成:</span>
                  <div className="font-bold text-blue-600 font-mono">¥{row.commissionAmount?.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px]">经办顾问:</span>
                  <div className="text-slate-700">{row.consultantName}</div>
                </div>
              </div>

              {canSettle && !row.isFeeSettled && (
                <div className="pt-2 border-t border-slate-200/60 flex justify-end">
                  <button
                    onClick={() => handleMarkFeeSettled(row.id)}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center justify-center space-x-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    <span>确认尾款已全额收回并对账</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 2. 桌面端完整明细表格 (Desktop View >= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">工单 / 客户</th>
                <th className="px-4 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">放款产品</th>
                <th className="px-4 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">放款金额</th>
                <th className="px-4 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">服务费率</th>
                <th className="px-4 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">应收服务费 (元)</th>
                <th className="px-4 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">已收定金 / 尾款</th>
                <th className="px-4 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">业务提成 (元)</th>
                <th className="px-4 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">经办顾问</th>
                <th className="px-6 py-3.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">状态 / 操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCases.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{row.customerName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{row.caseNumber}</div>
                  </td>
                  <td className="px-4 py-4 text-slate-700">{row.productName}</td>
                  <td className="px-4 py-4 font-mono font-bold text-slate-900">¥{row.appliedAmount} 万</td>
                  <td className="px-4 py-4 font-mono text-slate-700">{row.serviceFeeRate}%</td>
                  <td className="px-4 py-4 font-mono font-bold text-slate-900">
                    ¥{row.serviceFeeTotal?.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 font-mono text-slate-600">
                    <div>定金: ¥{row.serviceFeeDepositPaid?.toLocaleString()}</div>
                    <div className="text-[11px] text-emerald-600">尾款: ¥{row.serviceFeeBalancePaid?.toLocaleString()}</div>
                  </td>
                  <td className="px-4 py-4 font-mono font-semibold text-blue-600">
                    ¥{row.commissionAmount?.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 text-slate-600 font-medium">{row.consultantName}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${row.isFeeSettled ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {row.isFeeSettled ? '已结清' : '待结尾款'}
                      </span>
                      {canSettle && !row.isFeeSettled && (
                        <button
                          onClick={() => handleMarkFeeSettled(row.id)}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold border border-emerald-200 transition cursor-pointer"
                        >
                          确认尾款已收
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
