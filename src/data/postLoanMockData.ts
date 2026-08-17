import { PostLoanAccount, RepaymentScheduleItem, PostLoanRiskAlert, InspectionRecord, RefinanceOpportunity } from '../types';

/**
 * 贷后在贷账户初始数据（正式版）
 * 说明：正式版不预置任何虚构在贷账户，全部由「进件管理 → 放款落地」环节由系统自动建档，
 * 或由管理员在贷后管理页手动录入。此文件保留类型导出以兼容后续增量迁移。
 */
export const INITIAL_POST_LOAN_ACCOUNTS: PostLoanAccount[] = [];
