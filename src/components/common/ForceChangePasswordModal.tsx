import React, { useState } from 'react';
import { X, Lock, ShieldCheck, AlertTriangle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { UserAccount, SystemConfig } from '../../types';

interface ForceChangePasswordModalProps {
  user: UserAccount;
  onClose: () => void;
  onUpdatePassword: (userId: string, newPassword: string) => void;
  systemConfig?: SystemConfig;
  /** 异步校验当前密码（兼容哈希存储与明文遗留） */
  verifyCurrentPassword?: (password: string) => Promise<boolean>;
}

import { useEscToClose } from '../../utils/useEscToClose';

export const ForceChangePasswordModal: React.FC<ForceChangePasswordModalProps> = ({
  user,
  onClose,
  onUpdatePassword,
  systemConfig,
  verifyCurrentPassword,
}) => {
  // 安全策略：从系统配置读取密码规则（超级管理员在「参数与策略总控」维护），缺省 8 位 + 字母数字
  const sec = systemConfig?.securityPolicy || { minPasswordLength: 8, requireComplexity: true, maxLoginFailures: 5, sessionTimeoutMinutes: 120 };
  const minLen = sec.minPasswordLength || 8;
  const needComplexity = sec.requireComplexity !== false;
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  // ESC 关闭（弹窗由父组件按 user 存在与否渲染）
  useEscToClose(!!user, onClose);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const strength = (() => {
    if (newPwd.length < 8) return { label: '过短', cls: 'bg-slate-100 text-slate-500', w: '0%' };
    let score = 0;
    if (/[a-zA-Z]/.test(newPwd)) score++;
    if (/\d/.test(newPwd)) score++;
    if (/[^a-zA-Z0-9]/.test(newPwd)) score++;
    if (newPwd.length >= 12) score++;
    if (score <= 1) return { label: '弱', cls: 'bg-rose-100 text-rose-600', w: '33%' };
    if (score <= 2) return { label: '中', cls: 'bg-amber-100 text-amber-600', w: '66%' };
    return { label: '强', cls: 'bg-emerald-100 text-emerald-600', w: '100%' };
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 当前密码校验（兼容哈希存储；无校验函数时回退明文比较）
    let currentOk = true;
    if (verifyCurrentPassword) {
      try {
        currentOk = await verifyCurrentPassword(currentPwd);
      } catch {
        currentOk = false;
      }
    } else if (user.password) {
      currentOk = currentPwd === user.password;
    }
    if (!currentOk) {
      setError('当前密码输入不正确，请核对后重试');
      return;
    }
    if (newPwd.length < minLen) {
      setError(`新密码长度至少 ${minLen} 位`);
      return;
    }
    if (needComplexity && (!/[a-zA-Z]/.test(newPwd) || !/\d/.test(newPwd))) {
      setError('新密码必须同时包含字母和数字');
      return;
    }
    if (newPwd !== confirmPwd) {
      setError('两次输入的新密码不一致');
      return;
    }
    if (newPwd === currentPwd) {
      setError('新密码不能与当前密码相同');
      return;
    }

    onUpdatePassword(user.id, newPwd);
    setSuccess(true);
    setTimeout(() => onClose(), 1200);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 bg-blue-50 border-b border-blue-200/80 text-slate-900 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white shadow-xs flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900">安全策略：首次登录必须修改默认密码</div>
              <div className="text-[11px] text-blue-700 mt-0.5">当前账号: {user.username}（{user.roleTitle}）</div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {success ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>密码修改成功，正在进入工作台...</span>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">当前登录密码</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={currentPwd}
                    onChange={(e) => setCurrentPwd(e.target.value)}
                    placeholder="请输入当前使用的密码"
                    required
                    className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">设置新密码</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    placeholder="至少 8 位，须含字母与数字"
                    required
                    className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* 强度指示 */}
                <div className="mt-1.5 flex items-center space-x-2">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${strength.cls.includes('rose') ? 'bg-rose-400' : strength.cls.includes('amber') ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: strength.w }} />
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${strength.cls}`}>{strength.label}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">确认新密码</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    placeholder="再次输入新密码"
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-1 text-[11px] text-slate-400 leading-relaxed">
                💡 为保障业务数据安全，首次登录或使用管理员分配的初始密码登录时，系统强制要求修改密码后才能继续使用工作台。
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold rounded-lg shadow-sm transition cursor-pointer"
              >
                确认修改密码并进入工作台
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
