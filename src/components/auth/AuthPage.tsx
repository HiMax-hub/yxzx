import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Lock, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Briefcase, 
  Users, 
  Coins, 
  Sparkles,
  Zap
} from 'lucide-react';
import { UserAccount, SystemConfig } from '../../types';
import { verifyUserPassword } from '../../utils/accountReset';

interface AuthPageProps {
  users: UserAccount[];
  onLoginSuccess: (user: UserAccount) => void;
  securityPolicy?: SystemConfig['securityPolicy'];
}

export const AuthPage: React.FC<AuthPageProps> = ({
  users,
  onLoginSuccess,
  securityPolicy,
}) => {
  
  // Login fields
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  // 登录失败锁定（安全策略：连续失败 N 次后临时锁定 60 秒）
  const [failCount, setFailCount] = useState(0);
  const [lockUntil, setLockUntil] = useState(0);
  const maxFailures = securityPolicy?.maxLoginFailures ?? 5;
  const isLocked = lockUntil > Date.now();

  // Live real-time clock
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      setCurrentTime(formatted);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    // 临时锁定保护：达到最大失败次数后锁定 60 秒
    if (maxFailures > 0 && isLocked) {
      const remain = Math.ceil((lockUntil - Date.now()) / 1000);
      setLoginError(`连续登录失败次数过多，账号已临时锁定，请 ${remain} 秒后再试`);
      return;
    }

    const target = users.find(
      (u) => u.username.trim().toLowerCase() === loginUsername.trim().toLowerCase()
    );

    if (!target) {
      setFailCount((c) => c + 1);
      setLoginError('账号不存在，请联系系统管理员创建账号');
      return;
    }

    // 密码校验：优先哈希存储，兼容明文遗留（verifyUserPassword 内部处理）
    let passwordOk = false;
    try {
      passwordOk = await verifyUserPassword(target, loginPassword);
    } catch {
      passwordOk = false;
    }
    if (!passwordOk) {
      const next = failCount + 1;
      setFailCount(next);
      if (maxFailures > 0 && next >= maxFailures) {
        setLockUntil(Date.now() + 60 * 1000);
        setLoginError(`密码错误已达 ${maxFailures} 次，账号已临时锁定 60 秒，请稍后再试`);
        return;
      }
      setLoginError(`登录密码错误，请核对后重新输入（还可尝试 ${Math.max(0, maxFailures - next)} 次）`);
      return;
    }

    if (target.status === 'disabled') {
      setLoginError('该账号已被系统管理员停用，请联系主管');
      return;
    }

    setFailCount(0);
    setLockUntil(0);
    onLoginSuccess(target);
  };



  return (
    <div className="min-h-screen min-h-dvh w-screen bg-slate-50 text-slate-800 flex flex-col justify-between font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <header className="px-6 sm:px-8 py-4 flex items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-20 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
            雁
          </div>
          <div>
            <div className="text-base font-bold text-slate-900 tracking-tight flex items-center space-x-2">
              <span>雁讯咨询 · 助贷业务工作台</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-mono font-bold border border-blue-200">
                PRO CRM
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              面向助贷咨询全流程：线索流转 · 资质自动判定 · 进件审批 · 阶梯结算
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs text-slate-500 font-mono">
          <div className="hidden sm:flex items-center space-x-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>实时时间: <strong className="text-slate-800">{currentTime || '--:--:--'}</strong></span>
          </div>
          <div className="flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[11px] font-semibold">权限严格隔离</span>
          </div>
        </div>
      </header>

      {/* Main Login Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 rounded-2xl bg-white shadow-xl border border-slate-200/90 overflow-hidden">
          
          {/* Left Role Highlights Panel (Clean Light Tone) */}
          <div className="md:col-span-5 bg-slate-50 p-6 sm:p-7 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-200">
            <div>
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-blue-100/70 text-blue-800 text-xs font-bold mb-3.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>助贷咨询高效作业</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-snug">
                合规助贷智能协作 <br />精准匹配资方政策
              </h2>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                岗位职责严格隔离，客户敏感数据多维脱敏，支持资质智能自动判定。
              </p>

              {/* Role Matrix Preview */}
              <div className="mt-5 space-y-2.5">
                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs text-xs">
                  <div className="font-bold text-blue-700 flex items-center space-x-1.5">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>业务顾问 (Consultant)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    · 仅查看名下客户线索，防撞单漏单<br />
                    · 资质自动判定、一键进件与提成核算
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs text-xs">
                  <div className="font-bold text-purple-700 flex items-center space-x-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>团队主管 / 风控 (Manager)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    · 部门客户统览、跨顾问批量调单<br />
                    · 征信红线预检、下户审核与审批流裁决
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs text-xs">
                  <div className="font-bold text-emerald-700 flex items-center space-x-1.5">
                    <Coins className="w-3.5 h-3.5" />
                    <span>财务 / 管理员 (Admin)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    · 全司业绩大盘、定金/尾款实收对账<br />
                    · 公海池回收规则与产品库准入配置
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
              <span>首次部署初始账号:</span>
              <span className="font-mono text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                himax · 首次登录后请立即修改密码
              </span>
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between bg-white">
            <div>
              {/* 账号登录（正式版：账号由系统管理员统一创建，不开放自助注册） */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-5">
                <div className="text-sm font-bold text-blue-600 border-b-2 border-blue-600 pb-1.5">
                  账号登录
                </div>
                <span className="text-xs text-slate-400">
                  请使用已授权账号登录工作台
                </span>
              </div>

              {/* LOGIN FORM */}
              <form onSubmit={handleLogin} className="space-y-3.5">
                  {loginError && (
                    <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      登录用户名 / 员工工号:
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        placeholder="请输入用户名 / 员工工号"
                        required
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      登录密码:
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="请输入登录密码"
                        required
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <span>登 录 工 作 台</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  
                </form>

            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>雁讯咨询 · 金融助贷风控与CRM平台</span>
              <span>TLS 1.3 传输加密</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-3 px-6 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
        © 2026 雁讯金融咨询 (Yanxun Capital CRM) · 助贷业务全链路信贷审批与财务清算系统
      </footer>
    </div>
  );
};
