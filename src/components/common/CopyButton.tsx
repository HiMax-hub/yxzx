import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  text: string;
  title?: string;
  className?: string;
  iconOnly?: boolean;
  label?: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  title = '点击复制',
  className = '',
  iconOnly = true,
  label,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!text) return;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers or insecure contexts
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }

      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? '已成功复制到剪贴板' : title}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-medium transition cursor-pointer select-none ${
        copied
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 scale-105'
          : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200'
      } ${className}`}
    >
      {copied ? (
        <>
          <Check className="w-3 h-3 text-emerald-600 shrink-0 animate-in zoom-in-50" />
          <span className="text-[10px] text-emerald-700 font-bold whitespace-nowrap">已复制</span>
        </>
      ) : (
        <>
          <Copy className="w-3 h-3 shrink-0" />
          {label && <span className="text-[11px] whitespace-nowrap">{label}</span>}
        </>
      )}
    </button>
  );
};
