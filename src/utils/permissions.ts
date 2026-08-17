import { UserRole } from '../types';

// 单一权限判定来源，消除各组件里 isAdmin / isFinance / isRisk 定义漂移

export const isConsultant = (role: UserRole): boolean => role === 'consultant';
export const isRiskManager = (role: UserRole): boolean => role === 'risk_manager';
export const isFinanceAdmin = (role: UserRole): boolean => role === 'finance_admin';
export const isAdmin = (role: UserRole): boolean => role === 'admin';
export const isSuperAdmin = (role: UserRole): boolean => role === 'super_admin';

// 是否具备全司业务数据视角（顾问只能看名下，其余角色可看全局）
export const canViewAllBusiness = (role: UserRole): boolean => role !== 'consultant';

// 系统级管理：用户管理、产品准入配置、离职交接（超管 + 系统管理员）
export const canManageSystem = (role: UserRole): boolean => role === 'super_admin' || role === 'admin';

// 客户删除（超管 + 系统管理员）
export const canDeleteCustomer = (role: UserRole): boolean => role === 'super_admin' || role === 'admin';

// 客户/进件调单分配（超管 + 管理员 + 风控主管）
export const canReassign = (role: UserRole): boolean =>
  role === 'super_admin' || role === 'admin' || role === 'risk_manager';

// 财务结算视角（超管 + 系统管理员 + 财务总监）
export const canViewFinance = (role: UserRole): boolean =>
  role === 'super_admin' || role === 'admin' || role === 'finance_admin';
