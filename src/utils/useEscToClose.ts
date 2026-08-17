import { useEffect } from 'react';

/**
 * 二级弹窗统一 ESC 关闭快捷键
 * 在任意弹窗/抽屉组件顶层调用：useEscToClose(isOpen, onClose)
 */
export function useEscToClose(isOpen: boolean, onClose: () => void): void {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);
}
