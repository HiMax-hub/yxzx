import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  Copy, 
  Check, 
  Plus, 
  ArrowRight, 
  Tag, 
  Sparkles, 
  X, 
  ChevronRight,
  MessageSquare,
  Building,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { LoanScriptItem, getAllLoanScripts, saveCustomLoanScript } from '../../utils/loanScripts';
import { useEscToClose } from '../../utils/useEscToClose';

interface ScriptLibraryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyScript: (scriptText: string, summaryTemplate: string) => void;
  title?: string;
}

export const ScriptLibraryDrawer: React.FC<ScriptLibraryDrawerProps> = ({
  isOpen,
  onClose,
  onApplyScript,
  title = '助贷实战话术与解答库',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedScene, setSelectedScene] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);

  // Custom script form state
  const [customTitle, setCustomTitle] = useState('');
  const [customCategory, setCustomCategory] = useState<LoanScriptItem['category']>('mortgage');
  const [customTags, setCustomTags] = useState('');
  const [customScriptText, setCustomScriptText] = useState('');
  const [customSummaryTemplate, setCustomSummaryTemplate] = useState('');
  const [refreshSeed, setRefreshSeed] = useState(0);

  const allScripts = useMemo(() => {
    return getAllLoanScripts();
  }, [refreshSeed]);

  const categories = [
    { id: 'all', name: '全部话术' },
    { id: 'mortgage', name: '房产抵押贷' },
    { id: 'tax_invoice', name: '企业税票贷' },
    { id: 'credit', name: '个人信用贷' },
    { id: 'objection', name: '异议化解' },
    { id: 'invitation', name: '邀约与催件' },
    { id: 'archive', name: '归档与培育' },
  ];

  // 二级场景标签：帮助业务员按“异议处理 / 邀约面谈 / 产品介绍”等场景快速定位话术
  const sceneTags = [
    { id: 'all', name: '全部场景', categories: [] as string[] },
    { id: 'objection', name: '异议处理', categories: ['objection'] },
    { id: 'invitation', name: '邀约面谈', categories: ['invitation'] },
    { id: 'product_intro', name: '产品介绍', categories: ['mortgage', 'tax_invoice', 'credit'] },
    { id: 'archive', name: '培育善后', categories: ['archive'] },
  ];

  const filteredScripts = useMemo(() => {
    const activeScene = sceneTags.find((s) => s.id === selectedScene);
    return allScripts.filter((item) => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchScene =
        selectedScene === 'all' ||
        (activeScene && activeScene.categories.includes(item.category));
      const matchSearch =
        !searchKeyword.trim() ||
        item.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        item.scriptText.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        item.tags.some((t) => t.toLowerCase().includes(searchKeyword.toLowerCase())) ||
        item.categoryName.toLowerCase().includes(searchKeyword.toLowerCase());
      return matchCat && matchScene && matchSearch;
    });
  }, [allScripts, selectedCategory, selectedScene, searchKeyword]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 1800);
  };

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() || !customScriptText.trim()) return;

    const catObj = categories.find((c) => c.id === customCategory);
    saveCustomLoanScript({
      category: customCategory,
      categoryName: catObj?.name || '个人常用',
      title: customTitle.trim(),
      tags: customTags
        .split(/[,，\s]+/)
        .filter(Boolean)
        .slice(0, 4),
      scriptText: customScriptText.trim(),
      summaryTemplate: customSummaryTemplate.trim() || `【${customTitle.trim()}】${customScriptText.trim()}`,
    });

    setShowAddCustomModal(false);
    setCustomTitle('');
    setCustomTags('');
    setCustomScriptText('');
    setCustomSummaryTemplate('');
    setRefreshSeed((prev) => prev + 1);
  };

  // ESC 关闭
  useEscToClose(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div className="absolute inset-y-0 right-0 w-full sm:w-[26rem] bg-white border-l border-slate-200/90 shadow-2xl flex flex-col z-30 animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded-lg bg-blue-100 text-blue-700">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900">{title}</h3>
            <p className="text-[10px] text-slate-500">点击一键填入跟进记录或复制</p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={() => setShowAddCustomModal(true)}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-bold transition flex items-center space-x-0.5 cursor-pointer"
            title="添加常用个性化话术"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="text-[11px]">自定义</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-2.5 border-b border-slate-100 bg-white">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="搜索话术标题、房抵、税票、异议..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto pt-2 pb-0.5 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Scene Tags (二级场景筛选) */}
        <div className="flex items-center space-x-1 overflow-x-auto pt-1.5 pb-0.5 scrollbar-none border-t border-slate-100 mt-1.5">
          <span className="text-[9px] font-semibold text-slate-400 mr-1 whitespace-nowrap flex items-center space-x-0.5">
            <Tag className="w-3 h-3" />
            <span>场景</span>
          </span>
          {sceneTags.map((scene) => (
            <button
              key={scene.id}
              type="button"
              onClick={() => setSelectedScene(scene.id)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap transition cursor-pointer ${
                selectedScene === scene.id
                  ? 'bg-amber-500 text-white font-bold'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              {scene.name}
            </button>
          ))}
        </div>
      </div>

      {/* Scripts List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredScripts.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            未找到相关话术，可尝试搜索其他关键词
          </div>
        ) : (
          filteredScripts.map((script) => (
            <div
              key={script.id}
              className="p-3 bg-slate-50/70 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 transition space-y-2 group"
            >
              <div className="flex items-start justify-between gap-1.5">
                <div>
                  <div className="flex items-center space-x-1.5 flex-wrap">
                    <span className="font-bold text-xs text-slate-800">{script.title}</span>
                    {script.isCustom && (
                      <span className="px-1 py-0.2 rounded text-[9px] bg-purple-100 text-purple-700 font-medium">
                        自定义
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 mt-1 flex-wrap gap-y-1">
                    {script.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.2 rounded text-[9px] bg-white border border-slate-200 text-slate-500 font-mono"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <span className="text-[10px] text-blue-600 font-semibold px-1.5 py-0.5 bg-blue-50 rounded shrink-0">
                  {script.categoryName}
                </span>
              </div>

              {/* Script Text */}
              <p className="text-[11px] text-slate-600 leading-relaxed bg-white/90 p-2 rounded-lg border border-slate-100">
                {script.scriptText}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-1.5 pt-1 border-t border-slate-200/50">
                <button
                  type="button"
                  onClick={() => handleCopy(script.id, script.scriptText)}
                  className="px-2 py-1 bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-md text-[10px] font-medium transition flex items-center space-x-1 cursor-pointer"
                >
                  {copiedId === script.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-600 font-bold">已复制</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-400" />
                      <span>复制</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onApplyScript(script.scriptText, script.summaryTemplate)}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-md text-[10px] font-bold shadow-2xs transition flex items-center space-x-1 cursor-pointer"
                >
                  <span>一键填入纪要</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Custom Script Modal */}
      {showAddCustomModal && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 z-40">
          <div className="bg-white rounded-2xl p-4 w-full shadow-2xl border border-slate-200 space-y-3 animate-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-bold text-slate-900">新建常用个性化话术</h4>
              <button
                type="button"
                onClick={() => setShowAddCustomModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustom} className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">话术标题</label>
                <input
                  type="text"
                  required
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="例如：优质科技小微企业加分项"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">所属分类</label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="mortgage">房产抵押贷</option>
                    <option value="tax_invoice">企业税票贷</option>
                    <option value="credit">个人信用贷</option>
                    <option value="objection">异议化解</option>
                    <option value="invitation">邀约与催件</option>
                    <option value="archive">归档与培育</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">标签 (逗号分隔)</label>
                  <input
                    type="text"
                    value={customTags}
                    onChange={(e) => setCustomTags(e.target.value)}
                    placeholder="专精特新, 贴息政策"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">通话/沟通应答话术</label>
                <textarea
                  required
                  rows={3}
                  value={customScriptText}
                  onChange={(e) => setCustomScriptText(e.target.value)}
                  placeholder="输入您在电话或微信沟通中的标准应答口径..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">自动填入跟进纪要模板 (选填)</label>
                <textarea
                  rows={2}
                  value={customSummaryTemplate}
                  onChange={(e) => setCustomSummaryTemplate(e.target.value)}
                  placeholder="保存到CRM跟进记录中的摘要格式..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCustomModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  保存话术
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
