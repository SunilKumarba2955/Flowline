export type FinancialScope = 'PERSONAL' | 'CORPORATE' | 'ALL';
export type BureauName = 'CIBIL' | 'CRIF' | 'EXPERIAN' | 'EQUIFAX';

export interface Account {
  id: string;
  bank: string;
  name: string;
  accountType: 'SALARY' | 'SAVINGS' | 'WALLET';
  maskedNumber: string;
  scope: Exclude<FinancialScope, 'ALL'>;
  balanceMinor: number;
  availableBalanceMinor: number;
  currency: 'INR';
  primary: boolean;
  updatedAt: string;
}

export interface Card {
  id: string;
  issuer: string;
  name: string;
  network: 'VISA' | 'MASTERCARD' | 'RUPAY' | 'AMEX';
  kind: 'DEBIT' | 'CREDIT';
  maskedNumber: string;
  scope: Exclude<FinancialScope, 'ALL'>;
  creditLimitMinor?: number;
  outstandingMinor?: number;
  availableLimitMinor?: number;
  utilization?: number;
  paymentDueAt?: string;
  paymentDueAmountMinor?: number;
  secured: boolean;
  virtual: boolean;
}

export interface BureauReport {
  id: string;
  bureau: BureauName;
  score: number;
  maxScore: number;
  rating: 'POOR' | 'FAIR' | 'GOOD' | 'VERY_GOOD' | 'EXCELLENT';
  change: number;
  pulledAt: string;
  factors: Array<{ code: string; label: string; impact: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'; detail: string }>;
  accountsReported: number;
  enquiries: number;
}

export interface Transaction {
  id: string;
  accountId: string;
  cardId?: string;
  scope: Exclude<FinancialScope, 'ALL'>;
  postedAt: string;
  amountMinor: number;
  direction: 'CREDIT' | 'DEBIT';
  status: 'POSTED' | 'PENDING' | 'REVERSED';
  merchant: string;
  description: string;
  category: string;
  channel: 'UPI' | 'CARD' | 'NEFT' | 'IMPS' | 'NACH' | 'ATM' | 'BANK_TRANSFER';
  recurring: boolean;
  needsReview: boolean;
  classificationConfidence: number;
}

export interface Bill {
  id: string;
  name: string;
  kind: 'CREDIT_CARD' | 'EMI' | 'UTILITY' | 'SUBSCRIPTION' | 'INSURANCE';
  scope: Exclude<FinancialScope, 'ALL'>;
  amountMinor: number;
  dueAt: string;
  status: 'DUE' | 'PAID' | 'OVERDUE' | 'AUTOPAY';
  autopay: boolean;
  sourceId?: string;
}

export interface Recommendation {
  id: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'CASH_FLOW' | 'CREDIT' | 'BILL' | 'SAVINGS' | 'ANOMALY';
  title: string;
  explanation: string;
  evidence: string[];
  expectedImpact: string;
  actionLabel: string;
  confidence: number;
  freshnessAt: string;
  ruleVersion: string;
  uncertainty: string;
}

export interface Dashboard {
  generatedAt: string;
  scope: FinancialScope;
  netWorthMinor: number;
  availableCashMinor: number;
  monthlyIncomeMinor: number;
  monthlySpendMinor: number;
  monthlySavingsMinor: number;
  savingsRate: number;
  creditUtilization: number;
  upcomingDuesMinor: number;
  accounts: Account[];
  cards: Card[];
  bureauReports: BureauReport[];
  recentTransactions: Transaction[];
  bills: Bill[];
  recommendations: Recommendation[];
  categoryBreakdown: Array<{ category: string; amountMinor: number; percentage: number }>;
  cashflowSeries: Array<{ period: string; incomeMinor: number; spendMinor: number; netMinor: number }>;
}

export type DataMode = 'live' | 'demo';

