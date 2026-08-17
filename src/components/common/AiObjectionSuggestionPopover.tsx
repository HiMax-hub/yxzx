import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Lightbulb, 
  CheckCircle2, 
  Copy, 
  Send, 
  X, 
  ChevronRight, 
  ShieldAlert,
  ArrowRight,
  Flame
} from 'lucide-react';
import { 
  POPULAR_OBJECTION_SUGGESTIONS, 
  MatchedObjectionSuggestion, 
  matchObjectionFromText 
} from '../../utils/aiObjectionMatcher';

interface AiObjectionSuggestionPopoverProps {
  currentText: string;
  onApplyScript: (scriptText: string, summaryText?: string) => void;
  className?: string;
  hideChips?: boolean;
}

export const AiObjectionSuggestionPopover: React.FC<AiObjectionSuggestionPopoverProps> = ({
  currentText,
  onApplyScript,
  className = '',
  hideChips = false,
}) => {
  const [activeSuggestion, setActiveSuggestion] = useState<MatchedObjectionSuggestion | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // 当外部文本变化时，实时智能匹配异议
  useEffect(() => {
    const matched = matchObjectionFromText(currentText);
    if (matched) {
      setActiveSuggestion(matched);
      setIsDismissed(false);
    }
  }, [currentText]);

  const handleSelectChip = (item: MatchedObjectionSuggestion) => {
    setActiveSuggestion(item);
    setIsDismissed(false);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`space-y-2 text-xs ${className}`}>
      
      {/* Quick Objection Trigger Chips (点击即推荐安抚话术) */}
      {!hideChips && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>AI 异议化解与攻心话术速查:</span>
            </span>
            <span className="text-[10px] text-slate-400">点击客户拒绝原因即刻智能推荐</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {POPULAR_OBJECTION_SUGGESTIONS.map((item) => {
              const isSelected = activeSuggestion?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectChip(item)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center space-x-1 ${
                    isSelected
                      ? 'bg-amber-500 text-white shadow-2xs'
                      : 'bg-white hover:bg-amber-50 text-slate-600 hover:text-amber-800 border border-slate-200/90 hover:border-amber-300'
                  }`}
                >
                  <span>{item.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating / Popover Smart Script Recommendation Box */}
      {activeSuggestion && !isDismissed && (
        <div className="p-3.5 bg-gradient-to-br from-amber-50/80 via-white to-orange-50/50 rounded-xl border border-amber-200/90 shadow-xs space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
          
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="p-1 rounded-lg bg-amber-100 text-amber-700">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
              <div>
                <div className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                  <span>AI 智能识别异议：</span>
                  <span className="text-amber-800 font-extrabold">{activeSuggestion.title}</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                  心理洞察: {activeSuggestion.psychologicalInsight}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              title="收起建议"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Script Content */}
          <div className="p-2.5 bg-white rounded-lg border border-amber-100 text-[11px] leading-relaxed text-slate-800 font-medium whitespace-pre-line shadow-2xs">
            {activeSuggestion.soothingScript}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-1 border-t border-amber-100 text-[11px]">
            <span className="text-[10px] text-slate-400">已匹配最佳金牌化解模板</span>
            
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => handleCopy(activeSuggestion.soothingScript)}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold transition flex items-center space-x-1 cursor-pointer"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700">已复制</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-slate-400" />
                    <span>复制话术</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => onApplyScript(activeSuggestion.soothingScript, activeSuggestion.summaryText)}
                className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold transition flex items-center space-x-1 cursor-pointer shadow-2xs"
                title="一键填入至当前跟进纪要输入框"
              >
                <Send className="w-3 h-3" />
                <span>一键填入跟进</span>
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
