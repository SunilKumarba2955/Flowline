import { demoDashboard } from '../data/demo';
import type { Dashboard, DataMode, FinancialScope } from '../types';

const DASHBOARD_QUERY = `
  query Dashboard($scope: FinancialScope = ALL) {
    dashboard(scope: $scope) {
      generatedAt scope netWorthMinor availableCashMinor monthlyIncomeMinor monthlySpendMinor monthlySavingsMinor
      savingsRate creditUtilization upcomingDuesMinor
      accounts { id bank name accountType maskedNumber scope balanceMinor availableBalanceMinor currency primary updatedAt }
      cards { id issuer name network kind maskedNumber scope creditLimitMinor outstandingMinor availableLimitMinor utilization paymentDueAt paymentDueAmountMinor secured virtual }
      bureauReports { id bureau score maxScore rating change pulledAt accountsReported enquiries factors { code label impact detail } }
      recentTransactions { id accountId cardId scope postedAt amountMinor direction status merchant description category channel recurring needsReview classificationConfidence }
      bills { id name kind scope amountMinor dueAt status autopay sourceId }
      recommendations { id priority category title explanation evidence expectedImpact actionLabel confidence freshnessAt ruleVersion uncertainty }
      categoryBreakdown { category amountMinor percentage }
      cashflowSeries { period incomeMinor spendMinor netMinor }
    }
  }
`;

export async function loadDashboard(scope: FinancialScope, signal?: AbortSignal): Promise<{ dashboard: Dashboard; mode: DataMode }> {
  if (import.meta.env.VITE_FORCE_DEMO === 'true') return { dashboard: filterScope(demoDashboard, scope), mode: 'demo' };

  try {
    const response = await fetch(import.meta.env.VITE_GRAPHQL_URL || '/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: DASHBOARD_QUERY, variables: { scope } }),
      signal,
    });
    if (!response.ok) throw new Error(`GraphQL responded ${response.status}`);
    const payload = (await response.json()) as { data?: { dashboard?: Dashboard }; errors?: unknown[] };
    if (!payload.data?.dashboard || payload.errors?.length) throw new Error('Dashboard result was incomplete');
    return { dashboard: payload.data.dashboard, mode: 'live' };
  } catch (error) {
    if (signal?.aborted) throw error;
    return { dashboard: filterScope(demoDashboard, scope), mode: 'demo' };
  }
}

export function filterScope(data: Dashboard, scope: FinancialScope): Dashboard {
  if (scope === 'ALL') return { ...data, scope };
  return {
    ...data,
    scope,
    accounts: data.accounts.filter((item) => item.scope === scope),
    cards: data.cards.filter((item) => item.scope === scope),
    recentTransactions: data.recentTransactions.filter((item) => item.scope === scope),
    bills: data.bills.filter((item) => item.scope === scope),
  };
}

