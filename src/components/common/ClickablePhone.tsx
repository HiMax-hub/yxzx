import React, { useState } from 'react';
import { Phone, PhoneCall, Copy, Check, Sparkles } from 'lucide-react';
import { CopyButton } from './CopyButton';

interface ClickablePhoneProps {
  phone: string;
  displayPhone?: string;
  customerName?: string;
  onCall?: () => void;
  showCopy?: boolean;
  isMasked?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ClickablePhone: React.FC<ClickablePhoneProps> = ({
  phone,
  displayPhone,
  customerName,
  onCall,
  showCopy = true,
  isMasked = false,
  className = '',
  size = 'md',
}) => {
  const [isDialing, setIsDialing] = useState(false);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  const handlePhoneClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    
    // Create ripple effect
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rippleId = Date.now();
    
    setRipples((prev) => [...prev, { id: rippleId, x, y }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== rippleId));
    }, 600);

    // Haptic visual vibration feedback
    setIsDialing(true);
    setTimeout(() => {
      setIsDialing(false);
    }, 500);

    if (onCall) {
      onCall();
    }
  };

  const maskPhoneNum = (p: string) => {
    if (!isMasked || !p) return p;
    return p.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  };

  const displayText = displayPhone || maskPhoneNum(phone);

  const sizeClasses = {
    sm: 'text-[11px] py-0.5 px-1.5 gap-1',
    md: 'text-xs py-1 px-2 gap-1.5',
    lg: 'text-sm py-1.5 px-3 gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <div className={`inline-flex items-center gap-1 font-mono ${className}`}>
      <button
        type="button"
        onClick={handlePhoneClick}
        title={onCall ? `点击一键安全拨号 ${customerName ? `给 ${customerName}` : ''}` : '客户联系电话'}
        className={`group relative overflow-hidden inline-flex items-center rounded-lg font-semibold transition-all duration-200 cursor-pointer select-none border ${
          isDialing
            ? 'bg-emerald-500 text-white border-emerald-600 scale-95 shadow-inner ring-2 ring-emerald-300'
            : 'bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border-slate-200 hover:border-emerald-300 hover:shadow-xs active:scale-95'
        } ${sizeClasses[size]}`}
      >
        {/* Ripple rings */}
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="absolute rounded-full bg-emerald-400/40 pointer-events-none animate-ping"
            style={{
              left: ripple.x - 12,
              top: ripple.y - 12,
              width: 24,
              height: 24,
            }}
          />
        ))}

        {/* Dialing icon animation */}
        <span
          className={`flex items-center justify-center transition-transform duration-300 ${
            isDialing
              ? 'animate-bounce text-white'
              : 'text-slate-400 group-hover:text-emerald-600 group-hover:rotate-12 group-hover:scale-110'
          }`}
        >
          {isDialing ? (
            <PhoneCall className={`${iconSizes[size]} text-white`} />
          ) : (
            <Phone className={iconSizes[size]} />
          )}
        </span>

        {/* Phone number text */}
        <span className="tracking-tight">{displayText}</span>

        {/* Dial Hint Tag on hover */}
        {onCall && (
          <span className="hidden sm:inline-block text-[10px] text-emerald-600 font-normal opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pl-0.5">
            拨号
          </span>
        )}
      </button>

      {/* Copy button */}
      {showCopy && (
        <CopyButton
          text={phone}
          title={`复制电话号码 (${phone})`}
          className="shrink-0"
        />
      )}
    </div>
  );
};
