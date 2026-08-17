import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  Phone, 
  Calendar, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  ArrowRight, 
  TrendingUp, 
  ShieldCheck, 
  FileText, 
  Check, 
  Copy, 
  Share2, 
  UserCheck, 
  Coins, 
  RefreshCw, 
  AlertCircle, 
  Send, 
  MessageSquare, 
  Banknote,
  Plus
} from 'lucide-react';
import { PostLoanAccount, RepaymentScheduleItem, InspectionRecord, PostLoanRiskAlert } from '../../types';

interface PostLoanDetailModalProps {
  account: PostLoanAccount | null;
  isOpen: boolean;
  onClose: () => void;
  isMasked?: boolean;
  onSendReminder?: (account: PostLoanAccount) => void;
  onRegisterRepayment?: (account: PostLoanAccount, period: number) => void;
  onAddInspection?: (account: PostLoanAccount) => void;
  onResolveRiskAlert?: (alertId: string) => void;
  onStartRefinance?: (account: PostLoanAccount) => void;
}

export const PostLoanDetailModal: React.FC<PostLoanDetailModalProps> = ({
  account,
  isOpen,
  onClose,
  isMasked = false,
  onSendReminder,
  onRegisterRepayment,
  onAddInspection,
  onResolveRiskAlert,
  onStartRefinance,
}) => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'inspections' | 'risks' | 'refinance'>('schedule');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  if (!isOpen || !account) return null;

  const maskPhone = (phone: string) => {
    if (!isMasked || !phone) return phone;
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const getStatusBadge = (status: PostLoanAccount['repaymentStatus']) => {
    switch (status) {
      case 'normal':
        return { label: '正常还款中', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'upcoming_due':
        return { label: '还款日临近', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'overdue_m1':
        return { label: '逾期M1 (1-30天)', color: 'bg-rose-50 text-rose-700 border-rose-200 font-bold' };
      case 'overdue_m2':
        return { label: '逾期M2 (31-60天)', color: 'bg-rose-100 text-rose-800 border-rose-300 font-bold' };
      case 'settled':
      case 'early_settled':
        return { label: '已全额结清', color: 'bg-slate-100 text-slate-700 border-slate-300' };
      default:
        return { label: '在贷管理中', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const badge = getStatusBadge(account.repaymentStatus);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-200 text-slate-900 flex items-start justify-between gap-3 shrink-0">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-white text-slate-700 border border-slate-200 shadow-2xs">
                {account.caseNumber}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.color}`}>
                {badge.label}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {account.customerGrade}级客群
              </span>
            </div>

            <div className="flex items-center space-x-3 pt-1">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 truncate">
                {account.customerName}
              </h2>
              <span className="text-xs text-slate-500 truncate max-w-[200px] sm:max-w-none">
                {account.borrowerSubject}
              </span>
            </div>

            <p className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5">
              <span>放款资方: <strong className="text-slate-800">{account.lenderBank}</strong></span>
              <span>产品: <strong className="text-slate-800">{account.productName}</strong></span>
              <span>经办顾问: <strong className="text-slate-800">{account.consultantName}</strong></span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Key Financial Highlights Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 p-3 sm:p-5 bg-slate-50 border-b border-slate-200 text-xs shrink-0">
          <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="text-slate-400 text-[11px]">放款总额 / 当前在贷余额</div>
            <div className="text-sm sm:text-base font-black font-mono text-slate-900 mt-0.5">
              ¥{account.disbursedAmountWan}万 <span className="text-slate-400 text-xs font-normal">/ ¥{account.currentBalanceWan}万</span>
            </div>
          </div>

          <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="text-slate-400 text-[11px]">执行年化利率 / 还款方式</div>
            <div className="text-sm sm:text-base font-black font-mono text-blue-600 mt-0.5">
              {account.interestRate}% <span className="text-slate-600 text-xs font-normal">({account.repaymentType === 'interest_first' ? '先息后本' : '等额本息'})</span>
            </div>
          </div>

          <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="text-slate-400 text-[11px]">下期还款日 (每月{account.repaymentDayOfMonth}日)</div>
            <div className={`text-sm sm:text-base font-black font-mono mt-0.5 ${
              account.repaymentStatus === 'overdue_m1' ? 'text-rose-600' : 'text-slate-900'
            }`}>
              {account.nextRepaymentDate}
            </div>
          </div>

          <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="text-slate-400 text-[11px]">下期应还总金额</div>
            <div className={`text-sm sm:text-base font-black font-mono mt-0.5 ${
              account.repaymentStatus === 'overdue_m1' ? 'text-rose-600' : 'text-emerald-700'
            }`}>
              ¥{account.nextDueTotalYuan.toLocaleString()} 元
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 sm:px-6 pt-3 border-b border-slate-200 bg-white flex items-center space-x-2 overflow-x-auto shrink-0">
          {[
            { id: 'schedule', label: '还款计划明细', badge: account.schedules.length },
            { id: 'inspections', label: '贷后巡检与回访', badge: account.inspections.length },
            { id: 'risks', label: '风险异动排查', badge: account.riskAlerts.filter(a => !a.isResolved).length, isAlert: account.riskAlerts.some(a => !a.isResolved) },
            { id: 'refinance', label: '降息转贷/加贷潜能', badge: account.refinanceOpportunity ? 1 : 0 },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    tab.isAlert
                      ? 'bg-rose-100 text-rose-700'
                      : isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-600'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* TAB 1: Repayment Schedule */}
          {activeTab === 'schedule' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">还款计划表与自动扣款明细</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    绑定还款扣款账户：<strong className="text-slate-800">{account.repaymentBankName} ({account.repaymentAccount})</strong>
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  {onSendReminder && (
                    <button
                      type="button"
                      onClick={() => onSendReminder(account)}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold hover:bg-blue-100 transition flex items-center space-x-1 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>发送还款关怀</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Schedule Table / Mobile List */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                      <tr>
                        <th className="p-3">期数</th>
                        <th className="p-3">应还款日</th>
                        <th className="p-3">应还本金</th>
                        <th className="p-3">应还利息</th>
                        <th className="p-3">应还总额</th>
                        <th className="p-3">还款状态</th>
                        <th className="p-3">实扣明细/备注</th>
                        <th className="p-3 text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {account.schedules.map((sch) => (
                        <tr key={sch.period} className="hover:bg-slate-50/70 transition">
                          <td className="p-3 font-mono font-bold text-slate-800">
                            第 {sch.period} 期
                          </td>
                          <td className="p-3 font-mono text-slate-700">
                            {sch.dueDate}
                          </td>
                          <td className="p-3 font-mono font-medium text-slate-700">
                            {sch.principalWan > 0 ? `¥${sch.principalWan}万` : '—'}
                          </td>
                          <td className="p-3 font-mono font-medium text-slate-700">
                            ¥{(sch.interestWan * 10000).toFixed(0)}元
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-900">
                            ¥{sch.totalAmountYuan.toLocaleString()}
                          </td>
                          <td className="p-3">
                            {sch.status === 'paid' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1 w-fit">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>已足额还款</span>
                              </span>
                            )}
                            {sch.status === 'pending' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center space-x-1 w-fit">
                                <Clock className="w-3 h-3" />
                                <span>待还款</span>
                              </span>
                            )}
                            {sch.status === 'overdue' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200 flex items-center space-x-1 w-fit">
                                <AlertTriangle className="w-3 h-3" />
                                <span>逾期未还</span>
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-slate-500 text-[11px] max-w-[200px] truncate">
                            {sch.paidAt ? `实扣: ${sch.paidAt}` : sch.note || '等待银行自动代扣'}
                          </td>
                          <td className="p-3 text-right">
                            {sch.status !== 'paid' && onRegisterRepayment && (
                              <button
                                type="button"
                                onClick={() => onRegisterRepayment(account, sch.period)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition cursor-pointer"
                              >
                                登记还款
                              </button>
                            )}
                            {sch.status === 'paid' && (
                              <span className="text-slate-400 text-[11px]">已核销</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Inspections & Visits */}
          {activeTab === 'inspections' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">贷后回访与例行巡检档案</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    上次巡检: <strong className="text-slate-800">{account.lastInspectionDate || '无'}</strong> | 下次排查: <strong className="text-blue-600">{account.nextInspectionDate || '按计划执行'}</strong>
                  </p>
                </div>

                {onAddInspection && (
                  <button
                    type="button"
                    onClick={() => onAddInspection(account)}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition flex items-center space-x-1 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>新增巡检回访记录</span>
                  </button>
                )}
              </div>

              {account.inspections.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-400 text-xs">
                  暂无贷后巡检记录
                </div>
              ) : (
                <div className="space-y-3">
                  {account.inspections.map((ins) => (
                    <div key={ins.id} className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/90 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-slate-900 font-mono">
                            {ins.inspectionDate}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                            {ins.method === 'on_site' ? '🏢 实地下户' : ins.method === 'phone' ? '📞 电话回访' : '💬 微信/视频'}
                          </span>
                          <span className="text-xs text-slate-500">
                            巡检人: <strong>{ins.inspectorName}</strong>
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ins.repaymentCapacityRating === 'strong'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ins.repaymentCapacityRating === 'stable'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-rose-100 text-rose-800'
                          }`}>
                            还款能力评级: {ins.repaymentCapacityRating === 'strong' ? '极强' : ins.repaymentCapacityRating === 'stable' ? '稳定' : '吃紧/高风险'}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-100">
                        {ins.findings}
                      </p>

                      {ins.nextInspectionDate && (
                        <div className="text-[11px] text-slate-400">
                          建议下次巡检时间: {ins.nextInspectionDate}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Risk Alerts */}
          {activeTab === 'risks' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">贷后大数据风险与异动雷达</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  持续监测借款人征信多头借贷、涉诉被执行、纳税评级变动与抵押物查封状态
                </p>
              </div>

              {account.riskAlerts.length === 0 ? (
                <div className="p-8 text-center bg-emerald-50/50 rounded-xl border border-emerald-200 text-emerald-800 text-xs flex flex-col items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mb-2" />
                  <strong className="text-sm">风控健康度极佳</strong>
                  <span className="text-emerald-700 mt-1">未检测到任何抵押物异动、多头借贷或工商诉讼风险。</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {account.riskAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-xl border space-y-2.5 ${
                        alert.level === 'high'
                          ? 'bg-rose-50/70 border-rose-200'
                          : alert.level === 'medium'
                            ? 'bg-amber-50/70 border-amber-200'
                            : 'bg-blue-50/70 border-blue-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className={`w-4 h-4 shrink-0 ${
                            alert.level === 'high' ? 'text-rose-600' : 'text-amber-600'
                          }`} />
                          <h4 className="text-xs font-bold text-slate-900">{alert.title}</h4>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {alert.triggeredAt}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed">
                        {alert.description}
                      </p>

                      <div className="flex items-center justify-between pt-1 text-xs">
                        <span className="text-[11px] text-slate-500">
                          处理状态: {alert.isResolved ? '✅ 已排查解除' : '⚠️ 需重点跟进'}
                        </span>
                        {!alert.isResolved && onResolveRiskAlert && (
                          <button
                            type="button"
                            onClick={() => onResolveRiskAlert(alert.id)}
                            className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs"
                          >
                            标记已核实排查
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Refinance Opportunities */}
          {activeTab === 'refinance' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">存量客户降息转贷与加贷增额空间测算</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  基于 LPR 下行红利与资产升值空间，挖掘二次创收与客户省息双赢机会
                </p>
              </div>

              {!account.refinanceOpportunity ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-400 text-xs">
                  当前借款人执行利率已为市场最优梯队，暂未触发转贷或加贷推荐阈值。
                </div>
              ) : (
                <div className="p-5 bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/60 rounded-2xl border border-blue-200 space-y-4 shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-blue-100">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-bold text-blue-950">
                        {account.refinanceOpportunity.opportunityType === 'rate_reduction'
                          ? '🌟 降息置换转贷机会'
                          : '💰 房产净值加按增额机会'}
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white shadow-2xs">
                      预计年省息 ¥{account.refinanceOpportunity.estimatedAnnualSavingsYuan.toLocaleString()} 元
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-white rounded-xl border border-blue-100">
                      <div className="text-slate-400 text-[10px]">当前在贷年化</div>
                      <div className="text-sm font-black font-mono text-slate-700 mt-0.5">
                        {account.refinanceOpportunity.currentRate}%
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-blue-100">
                      <div className="text-slate-400 text-[10px]">预计可转年化</div>
                      <div className="text-sm font-black font-mono text-emerald-600 mt-0.5">
                        {account.refinanceOpportunity.targetRate}% (直降 {(account.refinanceOpportunity.currentRate - account.refinanceOpportunity.targetRate).toFixed(2)}%)
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-blue-100">
                      <div className="text-slate-400 text-[10px]">预计可增额度</div>
                      <div className="text-sm font-black font-mono text-blue-600 mt-0.5">
                        +¥{account.refinanceOpportunity.additionalAmountWan || 0} 万元
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-blue-100">
                      <div className="text-slate-400 text-[10px]">推荐目标产品</div>
                      <div className="text-xs font-bold text-slate-900 mt-0.5 truncate" title={account.refinanceOpportunity.recommendedProductName}>
                        {account.refinanceOpportunity.recommendedBank}
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-white/90 rounded-xl border border-blue-100 text-xs text-slate-700 leading-relaxed">
                    <strong>方案依据：</strong>{account.refinanceOpportunity.note}
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-2">
                    {onStartRefinance && (
                      <button
                        type="button"
                        onClick={() => onStartRefinance(account)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
                      >
                        <Coins className="w-3.5 h-3.5" />
                        <span>一键启动转贷进件申报</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <div className="text-xs text-slate-500">
            借款人联系电话: <strong className="text-slate-800 font-mono">{maskPhone(account.customerPhone)}</strong>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => copyToClipboard(`【贷后关怀】尊敬的${account.customerName}您好，您在${account.lenderBank}的贷款下期还款日为${account.nextRepaymentDate}，应存金额¥${account.nextDueTotalYuan}元，请确保扣款账户资金充足。`)}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1"
            >
              {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedText ? '已复制短信文案' : '复制还款短信'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              关闭
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
