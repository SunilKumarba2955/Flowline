import type {
  DashboardContract,
  FinancialScope,
  RecommendationContract,
  RiskAssessmentContract,
  TransactionContract,
} from '../../../packages/contracts/src/index.ts';
import { includesScope, ratioPercentage, sumMinor, type FinanceRepository } from './domain.ts';

const GENERATED_AT = '2026-08-12T08:30:00.000Z';
const RULE_VERSION = 'finance-rules/1.0.0';

const cashflowSeed = [
  ['2026-03', 226_000_00, 142_500_00],
  ['2026-04', 226_000_00, 151_800_00],
  ['2026-05', 232_000_00, 149_200_00],
  ['2026-06', 232_000_00, 164_900_00],
  ['2026-07', 242_000_00, 157_400_00],
  ['2026-08', 242_000_00, 88_920_55],
] as const;

function byNewest(a: { postedAt: string }, b: { postedAt: string }): number {
  return b.postedAt.localeCompare(a.postedAt);
}

function buildRecommendations(
  scope: FinancialScope,
  monthlyIncomeMinor: number,
  monthlySpendMinor: number,
  transactions: readonly TransactionContract[],
  cards: ReadonlyArray<DashboardContract['cards'][number]>,
  bills: ReadonlyArray<DashboardContract['bills'][number]>,
): RecommendationContract[] {
  const result: RecommendationContract[] = [];
  const base = { freshnessAt: GENERATED_AT, ruleVersion: RULE_VERSION, uncertainty: 'Based on deterministic synthetic data; verify provider records before acting.' };

  const nearDue = bills.find((bill) => bill.status === 'DUE' && !bill.autopay && bill.dueAt < '2026-08-20T00:00:00.000Z');
  if (nearDue) result.push({
    id: `rec-pay-${nearDue.id}`, priority: 'CRITICAL', category: 'BILL', title: `Protect your payment history`,
    explanation: `${nearDue.name} is due soon and autopay is off. Schedule it while keeping a funding buffer.`,
    evidence: [`Due date: ${nearDue.dueAt.slice(0, 10)}`, `Amount: ${nearDue.amountMinor} INR minor units`, 'Autopay: off'],
    expectedImpact: 'Reduces the risk of a late fee or missed-payment report.', actionLabel: 'Schedule payment', confidence: 0.99, ...base,
  });

  const elevatedCard = cards.find((card) => card.kind === 'CREDIT' && (card.utilization ?? 0) > 30);
  if (elevatedCard) result.push({
    id: `rec-util-${elevatedCard.id}`, priority: 'HIGH', category: 'CREDIT', title: 'Lower revolving utilization before statement close',
    explanation: `${elevatedCard.name} is above the 30% planning threshold. This is a planning signal, not a guarantee of score movement.`,
    evidence: [`Current utilization: ${elevatedCard.utilization}%`, `Outstanding: ${elevatedCard.outstandingMinor} INR minor units`],
    expectedImpact: 'May improve reported utilization and frees available credit.', actionLabel: 'Review card payoff', confidence: 0.97, ...base,
  });

  const subscriptions = transactions.filter((transaction) => transaction.category === 'Subscriptions' && transaction.direction === 'DEBIT');
  if (subscriptions.length) result.push({
    id: 'rec-subscriptions', priority: 'MEDIUM', category: 'SAVINGS', title: 'Audit recurring subscriptions',
    explanation: 'A recurring subscription bundle has lower classification confidence and needs confirmation.',
    evidence: subscriptions.map((transaction) => `${transaction.merchant}: ${transaction.amountMinor} INR minor units`),
    expectedImpact: 'Potential recurring monthly saving after cancelling unused services.', actionLabel: 'Review subscriptions', confidence: 0.73, ...base,
  });

  if (monthlyIncomeMinor > 0) {
    const rate = ratioPercentage(monthlyIncomeMinor - monthlySpendMinor, monthlyIncomeMinor);
    result.push({
      id: `rec-savings-${scope.toLowerCase()}`, priority: rate >= 25 ? 'LOW' : 'MEDIUM', category: 'CASH_FLOW', title: 'Route surplus intentionally',
      explanation: `Current synthetic month-to-date savings rate is ${rate}%. Preserve near-term dues, then sweep only the excess.`,
      evidence: [`Income: ${monthlyIncomeMinor} INR minor units`, `Posted spend: ${monthlySpendMinor} INR minor units`],
      expectedImpact: 'Maintains liquidity while making monthly saving repeatable.', actionLabel: 'Set a safe sweep', confidence: 0.96, ...base,
    });
  }

  return result;
}

function buildRiskAssessment(
  scope: FinancialScope,
  savingsRate: number,
  creditUtilization: number,
  upcomingDuesMinor: number,
  recommendations: readonly RecommendationContract[],
): RiskAssessmentContract {
  const critical = recommendations.filter((item) => item.priority === 'CRITICAL').length;
  const score = Math.min(100, critical * 30 + (creditUtilization > 30 ? 20 : 0) + (savingsRate < 20 ? 20 : 0) + (upcomingDuesMinor > 50_000_00 ? 10 : 0));
  const level = score >= 60 ? 'HIGH' : score >= 25 ? 'MODERATE' : 'LOW';
  const signals: RiskAssessmentContract['signals'] = [
    { code: 'LIQUIDITY', severity: savingsRate < 20 ? 'WARNING' : 'INFO', title: 'Monthly liquidity', evidence: [`Savings rate: ${savingsRate}%`, `Upcoming dues: ${upcomingDuesMinor} INR minor units`] },
    { code: 'REVOLVING_CREDIT', severity: creditUtilization > 30 ? 'WARNING' : 'INFO', title: 'Revolving credit exposure', evidence: [`Aggregate utilization: ${creditUtilization}%`] },
  ];
  if (critical) signals.push({ code: 'PAYMENT_DEADLINE', severity: 'CRITICAL', title: 'Unprotected payment deadline', evidence: [`Critical recommendations: ${critical}`] });

  return {
    id: `risk-${scope.toLowerCase()}-20260812`, assessedAt: GENERATED_AT, scope, level, score, advisoryOnly: true,
    ruleVersion: 'risk-orchestrator/1.0.0', confidence: 0.91,
    uncertainty: 'Rule-based assessment over synthetic, point-in-time data. It is not underwriting, financial advice, or a bureau decision.',
    signals,
    roleOutputs: [
      { role: 'CASHFLOW_ANALYST', conclusion: savingsRate >= 25 ? 'Cash flow has a positive buffer.' : 'Cash-flow buffer needs attention.', evidence: [`Savings rate: ${savingsRate}%`] },
      { role: 'CREDIT_ANALYST', conclusion: creditUtilization <= 30 ? 'Aggregate utilization is within the planning threshold.' : 'At least one revolving balance should be reviewed.', evidence: [`Aggregate utilization: ${creditUtilization}%`] },
      { role: 'OBLIGATION_MONITOR', conclusion: critical ? 'A due obligation is not protected by autopay.' : 'No critical unprotected due is present.', evidence: [`Upcoming dues: ${upcomingDuesMinor} INR minor units`] },
      { role: 'RISK_CHALLENGER', conclusion: 'Provider freshness, pending transactions, and disputed classifications may change this result.', evidence: ['Synthetic data mode', 'Pending entries excluded from posted cash flow'] },
      { role: 'DECISION_MANAGER', conclusion: critical ? 'Protect the nearest due before moving surplus.' : 'Preserve dues, then consider the savings action.', evidence: recommendations.slice(0, 2).map((item) => item.id) },
    ],
  };
}

export class DashboardService {
  private readonly repository: FinanceRepository;

  constructor(repository: FinanceRepository) {
    this.repository = repository;
  }

  getDashboard(scope: FinancialScope = 'ALL'): DashboardContract {
    const data = this.repository.snapshot();
    const accounts = data.accounts.filter((item) => includesScope(item.scope, scope));
    const cards = data.cards.filter((item) => includesScope(item.scope, scope));
    const transactions = data.transactions.filter((item) => includesScope(item.scope, scope));
    const bills = data.bills.filter((item) => includesScope(item.scope, scope));
    const posted = transactions.filter((item) => item.status === 'POSTED');
    const monthlyIncomeMinor = sumMinor(posted.filter((item) => item.direction === 'CREDIT').map((item) => item.amountMinor));
    const monthlySpendMinor = sumMinor(posted.filter((item) => item.direction === 'DEBIT').map((item) => item.amountMinor));
    const monthlySavingsMinor = monthlyIncomeMinor - monthlySpendMinor;
    const availableCashMinor = sumMinor(accounts.map((item) => item.availableBalanceMinor));
    const personalCreditCards = cards.filter((card) => card.kind === 'CREDIT');
    const totalLimitMinor = sumMinor(personalCreditCards.map((card) => card.creditLimitMinor ?? 0));
    const outstandingMinor = sumMinor(personalCreditCards.map((card) => card.outstandingMinor ?? 0));
    const creditUtilization = ratioPercentage(outstandingMinor, totalLimitMinor);
    const upcomingDuesMinor = sumMinor(bills.filter((bill) => bill.status === 'DUE' || bill.status === 'AUTOPAY').map((bill) => bill.amountMinor));
    const recommendations = buildRecommendations(scope, monthlyIncomeMinor, monthlySpendMinor, transactions, cards, bills);
    const savingsRate = ratioPercentage(monthlySavingsMinor, monthlyIncomeMinor);

    const categoryTotals = new Map<string, number>();
    for (const transaction of posted) {
      if (transaction.direction === 'DEBIT') categoryTotals.set(transaction.category, (categoryTotals.get(transaction.category) ?? 0) + transaction.amountMinor);
    }
    const categoryBreakdown = [...categoryTotals.entries()]
      .map(([category, amountMinor]) => ({ category, amountMinor, percentage: ratioPercentage(amountMinor, monthlySpendMinor) }))
      .sort((a, b) => b.amountMinor - a.amountMinor);

    const cashflowSeries = scope === 'CORPORATE'
      ? [{ period: '2026-08', incomeMinor: 0, spendMinor: monthlySpendMinor, netMinor: -monthlySpendMinor }]
      : cashflowSeed.map(([period, incomeMinor, spendMinor]) => ({ period, incomeMinor, spendMinor, netMinor: incomeMinor - spendMinor }));

    return {
      generatedAt: GENERATED_AT, scope, currency: 'INR', netWorthMinor: availableCashMinor - outstandingMinor, availableCashMinor,
      monthlyIncomeMinor, monthlySpendMinor, monthlySavingsMinor, savingsRate, creditUtilization, upcomingDuesMinor,
      accounts: [...accounts], cards: [...cards], bureauReports: scope === 'CORPORATE' ? [] : [...data.bureauReports],
      recentTransactions: [...transactions].sort(byNewest).slice(0, 20), bills: [...bills], recommendations,
      riskAssessment: buildRiskAssessment(scope, savingsRate, creditUtilization, upcomingDuesMinor, recommendations),
      categoryBreakdown, cashflowSeries,
    };
  }
}
