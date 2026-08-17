import { useEffect, useState } from 'react';

// 统一持久化前缀 + 版本号：数据结构变更时 bump 版本，避免读到旧结构脏数据
// 前缀由构建环境变量注入（见 .env.production / .env.development），默认 v5 正式版基线。
// v5（正式版）：正式发布基线，不加载 v4 及更早版本遗留的测试数据（本地测试账号/演示数据）。
const STORAGE_PREFIX: string = (import.meta.env.VITE_STORAGE_PREFIX as string) || 'yanxun_crm_v5_';

/** 导出当前持久化前缀（供账号凭据重置等工具按相同 key 读写 localStorage） */
export function getStoragePrefix(): string {
  return STORAGE_PREFIX;
}

/**
 * 带 localStorage 持久化的 useState。
 * 读取时惰性反序列化；写入时在 state 变化后同步。
 * 相比直接用 useState，业务数据（客户/进件/用户/配置）刷新后不再丢失。
 */
export function usePersistentState<T>(key: string, initialValue: T) {
  const storageKey = STORAGE_PREFIX + key;

  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw !== null) {
        return JSON.parse(raw) as T;
      }
    } catch {
      // 数据损坏或不可用时回退到初始值
    }
    return initialValue;
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // 存储满或被禁用时静默降级（仅本次会话内存态）
    }
  }, [storageKey, state]);

  return [state, setState] as const;
}
