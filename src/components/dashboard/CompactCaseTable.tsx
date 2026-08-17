import React, { useState } from 'react';
import { 
  FileText, 
  MessageSquare, 
  PhoneCall, 
  CheckCircle2, 
  Clock, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Zap,
  AlertTriangle
} from 'lucide-react';
import { Customer, LoanCase } from '../../types';
import { CopyButton } from '../common/CopyButton';
import { ClickablePhone } from '../common/ClickablePhone';
import { getCaseOverdueInfo } from '../../utils/approvalTaskReminders';

interface CompactCaseTableProps {
  deals: {
    id: string;
    customerName: string;
    customerPhone: string;
    loanType: string;
    amount: string;
    appliedAmountNum: number;
    node: string;
    status: string;
    statusColor: string;
    updatedAt: string;
    rawCase: LoanCase;
    rawCustomer: Customer;
  }[];
  onOpenQuickFollowUp: (customer: Customer, caseItem: LoanCase) => void;
  onStartCall: (customer: Customer) => void;
  onOpenCustomerDetail: (customer: Customer) => void;
  onOpenExpediteModal?: (loanCase: LoanCase, customer?: Customer) => void;
  onOpenNodeDrawer?: (dealItem: any) => void;
}

export const CompactCaseTable: React.FC<CompactCaseTableProps> = ({
  deals,
  onOpenQuickFollowUp,
  onStartCall,
  onOpenCustomerDetail,
  onOpenExpediteModal,
}) => {
  const [selectedCaseModal, setSelectedCaseModal] = useState<any | null>(null);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
            <tr>
              <th className="py-3.5 px-4 whitespace-nowrap">工单审批单号</th>
              <th className="py-3.5 px-4 whitespace-nowrap">借款客户 / 联系电话</th>
              <th className="py-3.5 px-4 whitespace-nowrap">意向等级</th>
              <th className="py-3.5 px-4 whitespace-nowrap">报审机构 / 贷款产品</th>
              <th className="py-3.5 px-4 whitespace-nowrap">申请金额 (万)</th>
              <th className="py-3.5 px-4 whitespace-nowrap">当前审批节点 / 状态</th>
              <th className="py-3.5 px-4 whitespace-nowrap">更新时间</th>
              <th className="py-3.5 px-4 text-right whitespace-nowrap">快捷操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {deals.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  暂无匹配的待办案件
                </td>
              </tr>
            ) : (
              deals.map((item) => {
                const overdueInfo = getCaseOverdueInfo(item.rawCase);

                return (
                  <tr 
                    key={item.id} 
                    className={`transition group cursor-default ${
                      overdueInfo.isOverdue
                        ? overdueInfo.urgencyLevel === 'critical'
                          ? 'bg-rose-50/30 hover:bg-rose-50/50'
                          : 'bg-amber-50/30 hover:bg-amber-50/50'
                        : 'hover:bg-blue-50/30'
                    }`}
                  >
                    {/* Case Number */}
                    <td className="py-3.5 px-4 font-mono text-slate-600 font-bold whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <span>{item.id}</span>
                        <CopyButton text={item.id} title="复制工单审批单号" />
                      </div>
                    </td>

                    {/* Customer Name & Phone */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900 flex items-center gap-1">
                        <span>{item.customerName}</span>
                        <CopyButton text={item.customerName} title="复制客户姓名" />
                      </div>
                      {item.customerPhone && (
                        <div className="mt-0.5">
                          <ClickablePhone
                            phone={item.customerPhone}
                            customerName={item.customerName}
                            onCall={() => onStartCall(item.rawCustomer)}
                            size="sm"
                          />
                        </div>
                      )}
                    </td>

                    {/* Grade */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {item.rawCustomer?.grade ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {item.rawCustomer.grade} 级
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Product */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{item.rawCase.lenderBank || item.rawCase.lenderInstitution || '合作银行'}</div>
                      <div className="text-[10px] text-slate-400">{item.loanType}</div>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      ¥{item.appliedAmountNum} 万
                    </td>

                    {/* Node & Status */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1.5 flex-wrap gap-y-0.5">
                        <span className="font-semibold text-blue-700">{item.node}</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${item.statusColor}`}>
                          {item.status}
                        </span>

                        {overdueInfo.isOverdue && (
                          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold font-mono border ${overdueInfo.badgeClass}`}>
                            {overdueInfo.badgeText}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[180px] mt-0.5">
                        {item.rawCase.subStageStatus || '按流程推进中'}
                      </div>
                    </td>

                    {/* Update Time */}
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {item.updatedAt}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1">
                        {/* Expedite button if overdue */}
                        {overdueInfo.isOverdue && onOpenExpediteModal && (
                          <button
                            type="button"
                            onClick={() => onOpenExpediteModal(item.rawCase, item.rawCustomer)}
                            className="px-2 py-1 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-bold rounded-lg transition text-[11px] flex items-center space-x-0.5 cursor-pointer shadow-xs active:scale-95"
                            title="一键生成催办消息"
                          >
                            <Zap className="w-3 h-3 fill-white" />
                            <span>催办</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onOpenQuickFollowUp(item.rawCustomer, item.rawCase)}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg transition text-[11px] border border-emerald-200 shadow-2xs cursor-pointer"
                          title="快速录入跟进记录"
                        >
                          跟进
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedCaseModal(item)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition text-[11px] cursor-pointer"
                          title="查看7大审批节点"
                        >
                          节点
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenCustomerDetail(item.rawCustomer)}
                          className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg transition text-[11px] cursor-pointer"
                        >
                          详情 →
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mini Node Details Modal in Table View */}
      {selectedCaseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 text-xs text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  {selectedCaseModal.customerName} - 审批节点详情
                </h3>
                <div className="text-slate-400 font-mono text-[11px] mt-0.5">
                  工单号: {selectedCaseModal.id} · {selectedCaseModal.loanType}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCaseModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Stages overview */}
            <div className="space-y-2">
              <div className="font-bold text-slate-700">7大标准流转节点进度:</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: '1. 资质初审', status: '已完成' },
                  { name: '2. 收集资料', status: selectedCaseModal.rawCase.stage === 'docs_collection' ? '推进中' : '已完成' },
                  { name: '3. 进件报审', status: selectedCaseModal.rawCase.stage === 'submission' ? '推进中' : selectedCaseModal.rawCase.stage === 'pre_screen' || selectedCaseModal.rawCase.stage === 'docs_collection' ? '未开始' : '已完成' },
                  { name: '4. 下户面签', status: selectedCaseModal.rawCase.stage === 'interview_visit' ? '推进中' : selectedCaseModal.rawCase.stage === 'approval' || selectedCaseModal.rawCase.stage === 'disbursement' ? '已完成' : '未开始' },
                  { name: '5. 审批批复', status: selectedCaseModal.rawCase.stage === 'approval' ? '推进中' : selectedCaseModal.rawCase.stage === 'disbursement' ? '已完成' : '未开始' },
                  { name: '6. 抵押放款', status: selectedCaseModal.rawCase.stage === 'disbursement' ? '推进中' : '未开始' },
                  { name: '7. 贷后管理', status: selectedCaseModal.rawCase.stage === 'post_loan' ? '进行中' : '未开始' },
                ].map((s, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="font-medium text-slate-800">{s.name}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      s.status === '已完成' ? 'bg-emerald-100 text-emerald-800' : s.status === '推进中' || s.status === '进行中' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-500'
                    }`}>
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] space-y-1">
              <div className="font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>经办要求与备忘:</span>
              </div>
              <p>{selectedCaseModal.rawCase.subStageStatus || '暂无阻塞，请持续跟进资方审批流转'}</p>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const cust = selectedCaseModal.rawCustomer;
                  const cs = selectedCaseModal.rawCase;
                  setSelectedCaseModal(null);
                  onOpenQuickFollowUp(cust, cs);
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs cursor-pointer"
              >
                快速录入跟进
              </button>
              <button
                type="button"
                onClick={() => setSelectedCaseModal(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
