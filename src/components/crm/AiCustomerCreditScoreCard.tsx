import React, { useState } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle2, 
  Activity, 
  ChevronDown, 
  ChevronUp, 
  Zap, 
  HelpCircle,
  Award,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Customer } from '../../types';
import { calculateCustomerAiScore, CustomerAiScoreResult } from '../../utils/aiCreditScorer';

interface AiCustomerCreditScoreCardProps {
  customer: Customer;
  variant?: 'full' | 'compact' | 'mini';
  className?: string;
  onOpenDetails?: () => void;
}

export const AiCustomerCreditScoreCard: React.FC<AiCustomerCreditScoreCardProps> = ({
  customer,
  variant = 'full',
  className = '',
  onOpenDetails,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const scoreResult: CustomerAiScoreResult = calculateCustomerAiScore(customer);
  const { overallScore, scoreTier, tierLabel, conversionProbability, riskLevel, breakdown, diagnosisHighlights, riskAlerts, recommendedAction, badgeColor } = scoreResult;

  // Mini variant (for list cards or dense badges)
  if (variant === 'mini') {
    return (
      <div 
        className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-lg border text-[10px] font-bold ${badgeColor.bg} ${badgeColor.text} ${badgeColor.border} ${className}`}
        title={`AI 信用综合评分: ${overallScore}分 (${scoreTier}级) | 成单率: ${conversionProbability}%`}
      >
        <Sparkles className="w-3 h-3 shrink-0" />
        <span>AI评分 <strong className="font-mono">{overallScore}</strong> ({scoreTier})</span>
      </div>
    );
  }

  // Compact variant (for table row / sidebar summary)
  if (variant === 'compact') {
    return (
      <div className={`p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-2 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <span className="p-1 rounded-md bg-blue-50 text-blue-600 border border-blue-200/60">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center space-x-1">
                <span>AI 信用评分</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-black ${badgeColor.bg} ${badgeColor.text} border ${badgeColor.border}`}>
                  {scoreTier}级
                </span>
              </div>
              <p className="text-[10px] text-slate-400">{tierLabel}</p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm font-black font-mono text-slate-900">{overallScore} <span className="text-[10px] text-slate-400 font-normal">/ 100</span></div>
            <div className="text-[10px] text-emerald-700 font-semibold">转化率 {conversionProbability}%</div>
          </div>
        </div>

        {/* 5 Dimensions Mini Bars */}
        <div className="space-y-1 pt-1 border-t border-slate-100 text-[10px]">
          <div className="flex items-center justify-between text-slate-500">
            <span>资产质量</span>
            <span className="font-mono font-medium text-slate-700">{breakdown.assetQuality}分</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${breakdown.assetQuality}%` }} />
          </div>

          <div className="flex items-center justify-between text-slate-500 pt-0.5">
            <span>征信健康</span>
            <span className="font-mono font-medium text-slate-700">{breakdown.creditHealth}分</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${breakdown.creditHealth >= 70 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${breakdown.creditHealth}%` }} />
          </div>
        </div>
      </div>
    );
  }

  // Full Rich Variant (for Customer Detail Modal and Workspace Lead Profile)
  return (
    <div className={`p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4 ${className}`}>
      
      {/* Top Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-slate-900">AI 信用与成单转化综合评分</h3>
              <span className={`px-2 py-0.5 rounded-lg text-xs font-black border ${badgeColor.bg} ${badgeColor.text} ${badgeColor.border}`}>
                {scoreTier} 级 · {tierLabel}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              基于人行征信、名下资产空间、跟进轨迹与意向标签多维算法动态实时运算
            </p>
          </div>
        </div>

        {/* Big Score Radial Badge */}
        <div className="flex items-center space-x-3 self-end sm:self-auto shrink-0">
          <div className="text-right">
            <div className="text-[10px] text-slate-400">综合成单概率</div>
            <div className="text-xs font-bold text-emerald-700 flex items-center justify-end space-x-0.5">
              <TrendingUp className="w-3 h-3 text-emerald-600" />
              <span>{conversionProbability}%</span>
            </div>
          </div>

          <div className={`px-3 py-1.5 rounded-xl border ${badgeColor.bg} ${badgeColor.border} text-center`}>
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">AI 评定分</div>
            <div className="text-xl font-black font-mono text-slate-900 leading-tight">
              {overallScore}
            </div>
          </div>
        </div>
      </div>

      {/* 5 Dimensional Breakdown Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        
        {/* 1. Asset Quality */}
        <div className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-100 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-600 font-medium">资产质量</span>
            <span className="font-mono font-bold text-slate-900">{breakdown.assetQuality}</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-blue-600 h-full rounded-full transition-all duration-500" 
              style={{ width: `${breakdown.assetQuality}%` }} 
            />
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            {customer.property?.hasProperty ? '含房产抵押空间' : customer.business?.hasEnterprise ? '含企业纳税流水' : '基础工资社保'}
          </div>
        </div>

        {/* 2. Credit Health */}
        <div className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-100 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-600 font-medium">征信健康</span>
            <span className="font-mono font-bold text-slate-900">{breakdown.creditHealth}</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${breakdown.creditHealth >= 75 ? 'bg-emerald-500' : breakdown.creditHealth >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} 
              style={{ width: `${breakdown.creditHealth}%` }} 
            />
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            {customer.creditSummary?.hasCurrentOverdue ? '存在当前逾期' : `近2月查${customer.creditSummary?.queryCount2Month || 0}次`}
          </div>
        </div>

        {/* 3. Intent Urgency */}
        <div className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-100 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-600 font-medium">意向紧迫度</span>
            <span className="font-mono font-bold text-slate-900">{breakdown.intentUrgency}</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
              style={{ width: `${breakdown.intentUrgency}%` }} 
            />
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            {customer.urgency || '正常沟通周期'}
          </div>
        </div>

        {/* 4. Follow-up Engagement */}
        <div className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-100 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-600 font-medium">跟进活跃度</span>
            <span className="font-mono font-bold text-slate-900">{breakdown.followUpEngagement}</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-purple-600 h-full rounded-full transition-all duration-500" 
              style={{ width: `${breakdown.followUpEngagement}%` }} 
            />
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            {customer.followUps?.length || 0} 条跟进记录
          </div>
        </div>

        {/* 5. Risk Resistance */}
        <div className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-100 space-y-1.5 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-600 font-medium">综合抗风险</span>
            <span className="font-mono font-bold text-slate-900">{breakdown.riskResistance}</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-teal-600 h-full rounded-full transition-all duration-500" 
              style={{ width: `${breakdown.riskResistance}%` }} 
            />
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            {riskLevel}
          </div>
        </div>

      </div>

      {/* AI Strategy & Action Recommendation Banner */}
      <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200/80 flex items-start space-x-2.5 text-xs">
        <Zap className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5 flex-1">
          <div className="font-bold text-blue-900 flex items-center justify-between">
            <span>AI 战术攻坚与产品主推建议</span>
            <span className="text-[10px] text-blue-700 font-normal">基于{customer.name}专属画像</span>
          </div>
          <p className="text-slate-700 leading-relaxed">{recommendedAction}</p>
        </div>
      </div>

      {/* Accordion Toggle for Detailed Diagnosis & Risk Checks */}
      <div>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between pt-1 text-xs text-slate-500 hover:text-slate-900 transition font-medium cursor-pointer"
        >
          <span className="flex items-center space-x-1.5">
            <Activity className="w-3.5 h-3.5 text-slate-400" />
            <span>查看详细诊断亮点 ({diagnosisHighlights.length}) 与风险提示 ({riskAlerts.length})</span>
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {isExpanded && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 mt-2 border-t border-slate-100 animate-in fade-in duration-200">
            
            {/* Highlights */}
            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/70 space-y-2">
              <div className="font-bold text-xs text-emerald-900 flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>资质优势与放款亮点</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-slate-700">
                {diagnosisHighlights.map((hl, idx) => (
                  <li key={idx} className="flex items-start space-x-1.5">
                    <span className="text-emerald-500 font-bold shrink-0">✓</span>
                    <span className="leading-snug">{hl}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Risk Warnings & Remediation */}
            <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/70 space-y-2">
              <div className="font-bold text-xs text-amber-900 flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>风控预警与补件优化举措</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-slate-700">
                {riskAlerts.map((ra, idx) => (
                  <li key={idx} className="flex items-start space-x-1.5">
                    <span className="text-amber-500 font-bold shrink-0">!</span>
                    <span className="leading-snug">{ra}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        )}
      </div>

    </div>
  );
};
