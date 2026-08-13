import { describe, expect, it } from 'vitest';
import { DashboardService } from '../../../modules/finance/src/dashboard-service.ts';
import { DeterministicFinanceRepository } from '../../../modules/finance/src/mock-repository.ts';

const service = new DashboardService(new DeterministicFinanceRepository());

describe('DashboardService', () => {
  it('keeps personal and corporate cash flow isolated', () => {
    const personal = service.getDashboard('PERSONAL');
    const corporate = service.getDashboard('CORPORATE');

    expect(personal.accounts.every((account) => account.scope === 'PERSONAL')).toBe(true);
    expect(personal.recentTransactions.some((transaction) => transaction.scope === 'CORPORATE')).toBe(false);
    expect(corporate.recentTransactions.every((transaction) => transaction.scope === 'CORPORATE')).toBe(true);
    expect(corporate.bureauReports).toEqual([]);
    expect(personal.monthlySpendMinor).not.toBe(corporate.monthlySpendMinor);
  });

  it('uses safe integer minor units for every authoritative amount', () => {
    const dashboard = service.getDashboard('ALL');
    const amounts = [
      dashboard.netWorthMinor, dashboard.availableCashMinor, dashboard.monthlyIncomeMinor,
      dashboard.monthlySpendMinor, dashboard.monthlySavingsMinor, dashboard.upcomingDuesMinor,
      ...dashboard.accounts.flatMap((account) => [account.balanceMinor, account.availableBalanceMinor]),
      ...dashboard.cards.flatMap((card) => [card.creditLimitMinor ?? 0, card.outstandingMinor ?? 0, card.availableLimitMinor ?? 0, card.paymentDueAmountMinor ?? 0]),
      ...dashboard.recentTransactions.map((transaction) => transaction.amountMinor),
      ...dashboard.bills.map((bill) => bill.amountMinor),
    ];

    expect(amounts.every(Number.isSafeInteger)).toBe(true);
  });

  it('preserves independent bureau snapshots and explanation metadata', () => {
    const dashboard = service.getDashboard('PERSONAL');
    expect(dashboard.bureauReports.map((report) => report.bureau)).toEqual(['CIBIL', 'CRIF', 'EXPERIAN', 'EQUIFAX']);
    expect(new Set(dashboard.bureauReports.map((report) => report.score)).size).toBe(4);
    expect(dashboard.recommendations.every((item) => item.evidence.length > 0 && item.ruleVersion && item.freshnessAt && item.uncertainty)).toBe(true);
    expect(dashboard.riskAssessment.advisoryOnly).toBe(true);
    expect(dashboard.riskAssessment.roleOutputs).toHaveLength(5);
  });

  it('does not count pending credits as posted income', () => {
    const personal = service.getDashboard('PERSONAL');
    expect(personal.monthlyIncomeMinor).toBe(242_000_00);
  });
});
