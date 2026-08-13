import type {
  AccountContract,
  BillContract,
  BureauReportContract,
  CardContract,
  FinancialScope,
  TransactionContract,
} from '../../../packages/contracts/src/index.ts';

export type Account = Readonly<AccountContract>;
export type Card = Readonly<CardContract>;
export type BureauReport = Readonly<BureauReportContract>;
export type Transaction = Readonly<TransactionContract>;
export type Bill = Readonly<BillContract>;

export interface FinanceSnapshot {
  readonly accounts: readonly Account[];
  readonly cards: readonly Card[];
  readonly bureauReports: readonly BureauReport[];
  readonly transactions: readonly Transaction[];
  readonly bills: readonly Bill[];
}

export interface FinanceRepository {
  snapshot(): FinanceSnapshot;
}

export function includesScope(itemScope: Exclude<FinancialScope, 'ALL'>, requested: FinancialScope): boolean {
  return requested === 'ALL' || itemScope === requested;
}

export function assertMinorUnits(value: number, field: string): void {
  if (!Number.isSafeInteger(value)) throw new TypeError(`${field} must be a safe integer in minor units`);
}

export function sumMinor(values: readonly number[]): number {
  const total = values.reduce((sum, value) => {
    assertMinorUnits(value, 'money');
    return sum + value;
  }, 0);
  assertMinorUnits(total, 'money total');
  return total;
}

export function ratioPercentage(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 10_000) / 100;
}
