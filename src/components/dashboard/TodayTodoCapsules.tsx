import React, { useRef } from 'react';
import { 
  Calendar, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  PhoneCall, 
  MessageSquare, 
  Sparkles, 
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Phone
} from 'lucide-react';
import { Customer, LoanCase } from '../../types';
import { ClickablePhone } from '../common/ClickablePhone';

interface TodayTodoCapsulesProps {
  customers: Customer[];
  loanCases: LoanCase[];
  onOpenQuickFollowUp: (customer: Customer, caseItem?: LoanCase, prefillTag?: string) => void;
  onStartCall: (customer: Customer) => void;
  onOpenCustomerDetail: (customer: Customer) => void;
}

export const TodayTodoCapsules: React.FC<TodayTodoCapsulesProps> = ({
  customers,
  loanCases,
  onOpenQuickFollowUp,
  onStartCall,
  onOpenCustomerDetail,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // 真实聚合今日待办：① nextContactDate 落在今天/明天 → 回访提醒；② 在途进件存在待办节点 → 跟进任务
  const activeCustomers = customers.filter(c => c.status !== 'in_pool' && c.status !== 'closed');
  const todayTasks = (() => {
    const tasks: {
      customer: Customer;
      time: string;
      actionTitle: string;
      badge: string;
      badgeColor: string;
      productName: string;
      amountWan: number;
      prefillTag?: string;
      note: string;
    }[] = [];
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowStr = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`;

    // ① 跟进计划（nextContactDate 匹配今天/明天）
    activeCustomers.forEach((c) => {
      const nextDate = c.nextContactDate || '';
      const datePart = nextDate.split(' ')[0] || '';
      const timePart = nextDate.split(' ')[1]?.slice(0, 5) || '10:00';
      if (datePart !== todayStr && datePart !== tomorrowStr) return;
      const relatedCase = loanCases.find((lc) => lc.customerId === c.id);
      tasks.push({
        customer: c,
        time: datePart === todayStr ? timePart : `明日 ${timePart}`,
        actionTitle: relatedCase ? '跟进在途进件进度' : '计划回访跟进客户意向',
        badge: datePart === todayStr ? '今日回访' : '明日回访',
        badgeColor: datePart === todayStr ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-sky-50 text-sky-700 border-sky-200',
        productName: relatedCase?.productName || c.matchedProducts?.[0]?.productName || '待匹配产品',
        amountWan: c.requestedAmount || 0,
        note: `预约跟进时间 ${nextDate || '今日'}，客户当前评级 ${c.grade} 级`,
      });
    });

    // ② 在途进件待办节点
    const stageTaskMap: { stage: string; title: string; badge: string; badgeColor: string; prefillTag?: string }[] = [
      { stage: 'docs_collection', title: '催收补充进件资料', badge: '待补件', badgeColor: 'bg-amber-50 text-amber-700 border-amber-200', prefillTag: '补充资料' },
      { stage: 'submission', title: '跟进银行报审进度', badge: '审批中', badgeColor: 'bg-blue-50 text-blue-700 border-blue-200' },
      { stage: 'interview_visit', title: '安排客户下户面签', badge: '待面签', badgeColor: 'bg-purple-50 text-purple-700 border-purple-200', prefillTag: '预约下周' },
      { stage: 'approval', title: '跟进批复与签约提款', badge: '待签约', badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200', prefillTag: '预约下周' },
    ];
    loanCases.forEach((lc) => {
      const taskCfg = stageTaskMap.find((s) => s.stage === lc.stage);
      if (!taskCfg) return;
      const cust = customers.find((c) => c.id === lc.customerId);
      if (!cust || cust.status === 'in_pool' || cust.status === 'closed') return;
      const alreadyPlanned = tasks.some((t) => t.customer.id === cust.id);
      tasks.push({
        customer: cust,
        time: alreadyPlanned ? '随时' : (lc.submittedAt?.split(' ')[1]?.slice(0, 5) || '14:00'),
        actionTitle: taskCfg.title,
        badge: taskCfg.badge,
        badgeColor: taskCfg.badgeColor,
        productName: lc.productName,
        amountWan: lc.appliedAmount || lc.applyAmount || cust.requestedAmount || 0,
        prefillTag: taskCfg.prefillTag,
        note: `工单 ${lc.caseNumber || lc.id}，申报 ¥${lc.appliedAmount || lc.applyAmount || 0} 万`,
      });
    });

    // ③ 贷后回访（放款后 7 天自动触发回访提醒，挖掘转介绍与满意度）
    loanCases.forEach((lc) => {
      if (lc.stage !== 'disbursement' && lc.stage !== 'post_loan') return;
      if (!lc.disbursedAt) return;
      const cust = customers.find((c) => c.id === lc.customerId);
      if (!cust || cust.status === 'in_pool') return;
      const disbursedDate = new Date(lc.disbursedAt.replace(' ', 'T'));
      if (isNaN(disbursedDate.getTime())) return;
      const daysAfter = Math.floor((now.getTime() - disbursedDate.getTime()) / 86400000);
      // 放款后 7~14 天为回访窗口期
      if (daysAfter < 7 || daysAfter > 14) return;
      const alreadyPlanned = tasks.some((t) => t.customer.id === cust.id);
      tasks.push({
        customer: cust,
        time: alreadyPlanned ? '随时' : '10:00',
        actionTitle: `贷后关怀回访 (放款${daysAfter}天) · 挖掘转介绍`,  
        badge: '贷后回访',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        productName: lc.productName,
        amountWan: lc.appliedAmount || lc.applyAmount || cust.requestedAmount || 0,
        note: `工单 ${lc.caseNumber || lc.id} 已于 ${lc.disbursedAt} 放款，建议回访资金使用情况并询问转介绍`,  
      });
    });

    // 去重并按时间排序
    const deduped = Array.from(new Map(tasks.map((t) => [`${t.customer.id}-${t.actionTitle}`, t])).values());
    return deduped.sort((a, b) => a.time.localeCompare(b.time)).slice(0, 8);
  })();

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">今日待办日程与客户回访胶囊</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                今日 {todayTasks.length} 项
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              自动聚合今日提醒、重要回访与补件节点，点击胶囊可直接调出跟进录入或一键外呼
            </p>
          </div>
        </div>

        {/* Scroll Controls */}
        <div className="hidden sm:flex items-center space-x-1.5">
          <button
            type="button"
            onClick={() => handleScroll('left')}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
            title="向左滚动"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleScroll('right')}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
            title="向右滚动"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Scrollable Capsules Carousel */}
      <div 
        ref={scrollRef}
        className="flex items-stretch gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent snap-x"
      >
        {todayTasks.map((task, idx) => {
          const matchingCase = loanCases.find(lc => lc.customerId === task.customer.id);
          return (
            <div
              key={idx}
              className="min-w-[280px] sm:min-w-[310px] max-w-[320px] bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200/90 hover:border-blue-400 hover:shadow-md transition-all p-3.5 flex flex-col justify-between space-y-2.5 snap-start shrink-0 group"
            >
              {/* Top Row: Time & Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <span className="flex items-center text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200/70">
                    <Clock className="w-3 h-3 mr-1 text-blue-500" />
                    {task.time}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${task.badgeColor}`}>
                    {task.badge}
                  </span>
                </div>

                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {task.customer.grade} 级意向
                </span>
              </div>

              {/* Middle Row: Customer info & Action title */}
              <div>
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <span>{task.customer.name}</span>
                    <span className="text-[11px] font-normal text-slate-500 font-mono">
                      (¥{task.amountWan}万)
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 truncate max-w-[100px]">
                    {task.productName}
                  </span>
                </div>

                <div className="text-xs font-medium text-slate-700 mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  <span className="truncate">{task.actionTitle}</span>
                </div>

                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                  {task.note}
                </p>
              </div>

              {/* Action Buttons Row */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                <ClickablePhone
                  phone={task.customer.phone}
                  customerName={task.customer.name}
                  onCall={() => onStartCall(task.customer)}
                  size="sm"
                />

                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => onOpenQuickFollowUp(task.customer, matchingCase, task.prefillTag)}
                    className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition flex items-center space-x-1 border border-blue-200/70 cursor-pointer shadow-2xs"
                    title="点击直接弹出跟进记录编辑窗"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>跟进</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenCustomerDetail(task.customer)}
                    className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition cursor-pointer"
                    title="查看客户完整档案"
                  >
                    档案
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
