export type FinancialScope = 'PERSONAL' | 'CORPORATE' | 'ALL';
export type MoneyDirection = 'CREDIT' | 'DEBIT';
export type BureauName = 'CIBIL' | 'CRIF' | 'EXPERIAN' | 'EQUIFAX';

export interface AccountContract {
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

export interface CardContract {
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

export interface BureauReportContract {
  id: string;
  bureau: BureauName;
  score: number;
  maxScore: number;
  rating: 'POOR' | 'FAIR' | 'GOOD' | 'VERY_GOOD' | 'EXCELLENT';
  change: number;
  pulledAt: string;
  accountsReported: number;
  enquiries: number;
  factors: Array<{ code: string; label: string; impact: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'; detail: string }>;
}

export interface TransactionContract {
  id: string;
  accountId: string;
  cardId?: string;
  scope: Exclude<FinancialScope, 'ALL'>;
  postedAt: string;
  amountMinor: number;
  direction: MoneyDirection;
  status: 'POSTED' | 'PENDING' | 'REVERSED';
  merchant: string;
  description: string;
  category: string;
  channel: 'UPI' | 'CARD' | 'NEFT' | 'IMPS' | 'NACH' | 'ATM' | 'BANK_TRANSFER';
  recurring: boolean;
  needsReview: boolean;
  classificationConfidence: number;
}

export interface BillContract {
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

export interface RecommendationContract {
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

export interface RiskAssessmentContract {
  id: string;
  assessedAt: string;
  scope: FinancialScope;
  level: 'LOW' | 'MODERATE' | 'HIGH';
  score: number;
  advisoryOnly: true;
  ruleVersion: string;
  confidence: number;
  uncertainty: string;
  signals: Array<{ code: string; severity: 'INFO' | 'WARNING' | 'CRITICAL'; title: string; evidence: string[] }>;
  roleOutputs: Array<{ role: 'CASHFLOW_ANALYST' | 'CREDIT_ANALYST' | 'OBLIGATION_MONITOR' | 'RISK_CHALLENGER' | 'DECISION_MANAGER'; conclusion: string; evidence: string[] }>;
}

export interface DashboardContract {
  generatedAt: string;
  scope: FinancialScope;
  currency: 'INR';
  netWorthMinor: number;
  availableCashMinor: number;
  monthlyIncomeMinor: number;
  monthlySpendMinor: number;
  monthlySavingsMinor: number;
  savingsRate: number;
  creditUtilization: number;
  upcomingDuesMinor: number;
  accounts: AccountContract[];
  cards: CardContract[];
  bureauReports: BureauReportContract[];
  recentTransactions: TransactionContract[];
  bills: BillContract[];
  recommendations: RecommendationContract[];
  riskAssessment: RiskAssessmentContract;
  categoryBreakdown: Array<{ category: string; amountMinor: number; percentage: number }>;
  cashflowSeries: Array<{ period: string; incomeMinor: number; spendMinor: number; netMinor: number }>;
}

export const dashboardQuery = /* GraphQL */ `
  query Dashboard($scope: FinancialScope = ALL) {
    dashboard(scope: $scope) {
      generatedAt scope currency netWorthMinor availableCashMinor monthlyIncomeMinor monthlySpendMinor monthlySavingsMinor
      savingsRate creditUtilization upcomingDuesMinor
      accounts { id bank name accountType maskedNumber scope balanceMinor availableBalanceMinor currency primary updatedAt }
      cards { id issuer name network kind maskedNumber scope creditLimitMinor outstandingMinor availableLimitMinor utilization paymentDueAt paymentDueAmountMinor secured virtual }
      bureauReports { id bureau score maxScore rating change pulledAt accountsReported enquiries factors { code label impact detail } }
      recentTransactions { id accountId cardId scope postedAt amountMinor direction status merchant description category channel recurring needsReview classificationConfidence }
      bills { id name kind scope amountMinor dueAt status autopay sourceId }
      recommendations { id priority category title explanation evidence expectedImpact actionLabel confidence freshnessAt ruleVersion uncertainty }
      riskAssessment { id assessedAt scope level score advisoryOnly ruleVersion confidence uncertainty signals { code severity title evidence } roleOutputs { role conclusion evidence } }
      categoryBreakdown { category amountMinor percentage }
      cashflowSeries { period incomeMinor spendMinor netMinor }
    }
  }
`;
