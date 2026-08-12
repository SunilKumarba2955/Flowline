export const schema = /* GraphQL */ `
  enum FinancialScope { PERSONAL CORPORATE ALL }
  enum BureauName { CIBIL CRIF EXPERIAN EQUIFAX }
  enum MockFailure { NONE TRANSIENT ALWAYS }

  type Account { id: ID!, bank: String!, name: String!, accountType: String!, maskedNumber: String!, scope: FinancialScope!, balanceMinor: Int!, availableBalanceMinor: Int!, currency: String!, primary: Boolean!, updatedAt: String! }
  type Card { id: ID!, issuer: String!, name: String!, network: String!, kind: String!, maskedNumber: String!, scope: FinancialScope!, creditLimitMinor: Int, outstandingMinor: Int, availableLimitMinor: Int, utilization: Float, paymentDueAt: String, paymentDueAmountMinor: Int, secured: Boolean!, virtual: Boolean! }
  type BureauFactor { code: String!, label: String!, impact: String!, detail: String! }
  type BureauReport { id: ID!, bureau: BureauName!, score: Int!, maxScore: Int!, rating: String!, change: Int!, pulledAt: String!, accountsReported: Int!, enquiries: Int!, factors: [BureauFactor!]! }
  type Transaction { id: ID!, accountId: ID!, cardId: ID, scope: FinancialScope!, postedAt: String!, amountMinor: Int!, direction: String!, status: String!, merchant: String!, description: String!, category: String!, channel: String!, recurring: Boolean!, needsReview: Boolean!, classificationConfidence: Float! }
  type Bill { id: ID!, name: String!, kind: String!, scope: FinancialScope!, amountMinor: Int!, dueAt: String!, status: String!, autopay: Boolean!, sourceId: ID }
  type Recommendation { id: ID!, priority: String!, category: String!, title: String!, explanation: String!, evidence: [String!]!, expectedImpact: String!, actionLabel: String!, confidence: Float!, freshnessAt: String!, ruleVersion: String!, uncertainty: String! }
  type CategoryBreakdown { category: String!, amountMinor: Int!, percentage: Float! }
  type CashflowPoint { period: String!, incomeMinor: Int!, spendMinor: Int!, netMinor: Int! }
  type RiskSignal { code: String!, severity: String!, title: String!, evidence: [String!]! }
  type RiskRoleOutput { role: String!, conclusion: String!, evidence: [String!]! }
  type RiskAssessment { id: ID!, assessedAt: String!, scope: FinancialScope!, level: String!, score: Int!, advisoryOnly: Boolean!, ruleVersion: String!, confidence: Float!, uncertainty: String!, signals: [RiskSignal!]!, roleOutputs: [RiskRoleOutput!]! }
  type Dashboard { generatedAt: String!, scope: FinancialScope!, currency: String!, netWorthMinor: Int!, availableCashMinor: Int!, monthlyIncomeMinor: Int!, monthlySpendMinor: Int!, monthlySavingsMinor: Int!, savingsRate: Float!, creditUtilization: Float!, upcomingDuesMinor: Int!, accounts: [Account!]!, cards: [Card!]!, bureauReports: [BureauReport!]!, recentTransactions: [Transaction!]!, bills: [Bill!]!, recommendations: [Recommendation!]!, riskAssessment: RiskAssessment!, categoryBreakdown: [CategoryBreakdown!]!, cashflowSeries: [CashflowPoint!]! }

  input StartSyncInput { source: String!, scope: FinancialScope!, mockFailure: MockFailure = NONE }
  type SyncJob { id: ID!, idempotencyKey: String!, source: String!, scope: FinancialScope!, status: String!, attempts: Int!, maxAttempts: Int!, errorCode: String, createdAt: String!, updatedAt: String! }

  type Query {
    dashboard(scope: FinancialScope = ALL): Dashboard!
    accounts(scope: FinancialScope = ALL): [Account!]!
    cards(scope: FinancialScope = ALL): [Card!]!
    bureauReports: [BureauReport!]!
    transactions(scope: FinancialScope = ALL, accountId: ID, needsReview: Boolean, limit: Int = 50): [Transaction!]!
    bills(scope: FinancialScope = ALL): [Bill!]!
    recommendations(scope: FinancialScope = ALL): [Recommendation!]!
    riskAssessment(scope: FinancialScope = ALL): RiskAssessment!
    syncJob(id: ID!): SyncJob
  }
  type Mutation {
    startMockSync(idempotencyKey: String!, input: StartSyncInput!): SyncJob!
    retryMockSync(id: ID!): SyncJob
  }
`;
