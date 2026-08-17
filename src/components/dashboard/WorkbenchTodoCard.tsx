import React, { useState } from 'react';
import { 
  CheckSquare, 
  Square, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Tag, 
  Sparkles,
  ListTodo,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserAccount } from '../../types';
import { usePersistentState } from '../../utils/usePersistentState';
import { useToast } from '../../context/ToastContext';

export interface TodoItem {
  id: string;
  text: string;
  tag: string;
  completed: boolean;
  createdAt: string;
  dueTime?: string;
  priority?: 'normal' | 'high' | 'urgent';
}

interface WorkbenchTodoCardProps {
  currentUser: UserAccount;
}

// 正式版：不预置任何虚构待办，由顾问自行录入当日工作计划（首次进入显示空态引导）
const DEFAULT_TODOS: TodoItem[] = [];

const PRESET_TAGS = ['客户跟进', '进件报审', '银行面签', '下户实勘', '尾款催收', '紧急督办'];

export const WorkbenchTodoCard: React.FC<WorkbenchTodoCardProps> = ({ currentUser }) => {
  const storageKey = `workbench_todos_${currentUser.id || 'default'}`;
  const [todos, setTodos] = usePersistentState<TodoItem[]>(storageKey, DEFAULT_TODOS);
  const [inputText, setInputText] = useState('');
  const [selectedTag, setSelectedTag] = useState('客户跟进');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const { toast } = useToast();

  const completedCount = todos.filter((t) => t.completed).length;
  const totalCount = todos.length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleAddTodo = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const newTodo: TodoItem = {
      id: `todo-${Date.now()}`,
      text: inputText.trim(),
      tag: selectedTag,
      completed: false,
      createdAt: timeStr,
      priority: selectedTag === '紧急督办' ? 'urgent' : 'normal',
    };

    setTodos([newTodo, ...todos]);
    toast.success(`已添加待办: 「${inputText.trim().slice(0, 16)}${inputText.trim().length > 16 ? '...' : ''}」`, '待办日程已同步更新');
    setInputText('');
  };

  const handleToggle = (id: string) => {
    const target = todos.find((t) => t.id === id);
    const willBeCompleted = target ? !target.completed : false;

    setTodos(
      todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );

    if (target) {
      if (willBeCompleted) {
        toast.success(`已完成待办事项 🎉`, target.text.slice(0, 20));
      } else {
        toast.info(`已重新恢复为待办`, target.text.slice(0, 20));
      }
    }
  };

  const handleDelete = (id: string) => {
    const target = todos.find((t) => t.id === id);
    setTodos(todos.filter((t) => t.id !== id));
    if (target) {
      toast.info('待办已移除', target.text.slice(0, 20));
    }
  };

  const handleClearCompleted = () => {
    const count = completedCount;
    setTodos(todos.filter((t) => !t.completed));
    toast.info(`已清空 ${count} 项已完成待办`);
  };

  const filteredTodos = todos.filter((t) => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 transition">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/80 shrink-0">
            <ListTodo className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                今日工作待办 (Daily To-Do)
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                {completedCount}/{totalCount} 项已完成
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              记录今日待沟通客户、进件补件、下户面签或催办事项，勾选即时同步
            </p>
          </div>
        </div>

        {/* Progress & Filters */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="hidden md:flex items-center space-x-1.5 mr-2">
            <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="text-[11px] font-bold text-slate-500 font-mono">{percent}%</span>
          </div>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs border border-slate-200">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                filter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              全部 ({totalCount})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                filter === 'pending' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              待办 ({totalCount - completedCount})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                filter === 'completed' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              已完成 ({completedCount})
            </button>
          </div>

          {completedCount > 0 && (
            <button
              onClick={handleClearCompleted}
              className="text-[11px] text-slate-400 hover:text-rose-600 px-2 py-1 transition cursor-pointer"
              title="清理已完成的待办事项"
            >
              清空已完成
            </button>
          )}
        </div>
      </div>

      {/* Quick Input Bar */}
      <form onSubmit={handleAddTodo} className="mt-3.5 space-y-2.5">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="输入今日待处理工作（如：下午2点陪同李总招商银行面签、催收周报流水...）"
              className="w-full pl-3.5 pr-20 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono hidden sm:inline">
              Enter 快速添加
            </span>
          </div>

          <button
            type="submit"
            disabled={!inputText.trim()}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1 transition shrink-0 cursor-pointer ${
              inputText.trim()
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>添加待办</span>
          </button>
        </div>

        {/* Quick Tag Selector */}
        <div className="flex items-center flex-wrap gap-1.5 pt-0.5">
          <span className="text-[11px] text-slate-400 flex items-center space-x-1 mr-1">
            <Tag className="w-3 h-3" />
            <span>类别预设:</span>
          </span>
          {PRESET_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(tag)}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                selectedTag === tag
                  ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </form>

      {/* Todo List with smooth motion transitions */}
      <div className="mt-3.5 space-y-1.5 max-h-64 overflow-y-auto pr-0.5">
        <AnimatePresence initial={false}>
          {filteredTodos.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-6 text-center text-slate-400 text-xs bg-slate-50/50 rounded-xl border border-dashed border-slate-200"
            >
              {filter === 'completed'
                ? '今日暂无已完成的待办事项'
                : filter === 'pending'
                ? '太棒了！今日待办已全部处理完毕 🎉'
                : '暂无待办事项，可在上方输入框添加今日工作计划'}
            </motion.div>
          ) : (
            filteredTodos.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92, height: 0, marginBottom: 0, padding: 0 }}
                transition={{ duration: 0.2 }}
                className={`group flex items-center justify-between p-2.5 rounded-xl border transition ${
                  item.completed
                    ? 'bg-slate-50/60 border-slate-200/60 text-slate-400'
                    : 'bg-white hover:bg-slate-50/80 border-slate-200 text-slate-800 shadow-2xs'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => handleToggle(item.id)}
                    className={`shrink-0 transition cursor-pointer ${
                      item.completed ? 'text-emerald-600' : 'text-slate-400 hover:text-blue-600'
                    }`}
                    title={item.completed ? '标记为未完成' : '勾选完成'}
                  >
                    {item.completed ? (
                      <CheckSquare className="w-4 h-4 fill-emerald-50 text-emerald-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>

                  <span
                    className={`text-xs truncate ${
                      item.completed ? 'line-through text-slate-400' : 'font-medium text-slate-800'
                    }`}
                  >
                    {item.text}
                  </span>

                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold shrink-0 ${
                      item.tag === '紧急督办'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : item.tag === '进件报审'
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        : item.tag === '银行面签'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {item.tag}
                  </span>

                  {item.createdAt && (
                    <span className="text-[10px] text-slate-400 font-mono hidden sm:inline shrink-0">
                      {item.createdAt}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-1 pl-2 opacity-80 group-hover:opacity-100 transition shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="p-1 rounded-md text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    title="删除该条待办"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
