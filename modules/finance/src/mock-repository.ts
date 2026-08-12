import type { FinanceRepository, FinanceSnapshot } from './domain.ts';

const NOW = '2026-08-12T08:30:00.000Z';

const snapshot: FinanceSnapshot = {
  accounts: [
    { id: 'acc-sbi-salary', bank: 'State Bank of India', name: 'SBI Salary', accountType: 'SALARY', maskedNumber: '•••• 1428', scope: 'PERSONAL', balanceMinor: 186_450_25, availableBalanceMinor: 181_450_25, currency: 'INR', primary: true, updatedAt: NOW },
    { id: 'acc-idfc-savings', bank: 'IDFC FIRST Bank', name: 'IDFC Savings', accountType: 'SAVINGS', maskedNumber: '•••• 3901', scope: 'PERSONAL', balanceMinor: 72_680_10, availableBalanceMinor: 72_680_10, currency: 'INR', primary: false, updatedAt: NOW },
    { id: 'acc-hdfc-savings', bank: 'HDFC Bank', name: 'HDFC Savings', accountType: 'SAVINGS', maskedNumber: '•••• 6620', scope: 'PERSONAL', balanceMinor: 38_225_50, availableBalanceMinor: 38_225_50, currency: 'INR', primary: false, updatedAt: NOW },
    { id: 'acc-slice', bank: 'slice', name: 'slice Account', accountType: 'WALLET', maskedNumber: '•••• 8344', scope: 'PERSONAL', balanceMinor: 9_840_75, availableBalanceMinor: 9_840_75, currency: 'INR', primary: false, updatedAt: NOW },
    { id: 'acc-corp-reimburse', bank: 'Corporate Treasury', name: 'Corporate Reimbursements', accountType: 'WALLET', maskedNumber: 'CORP ••12', scope: 'CORPORATE', balanceMinor: 12_500_00, availableBalanceMinor: 12_500_00, currency: 'INR', primary: false, updatedAt: NOW },
  ],
  cards: [
    { id: 'card-sbi-debit', issuer: 'SBI', name: 'SBI Global Debit', network: 'VISA', kind: 'DEBIT', maskedNumber: '•••• 4118', scope: 'PERSONAL', secured: false, virtual: false },
    { id: 'card-idfc-debit', issuer: 'IDFC FIRST', name: 'IDFC Debit', network: 'VISA', kind: 'DEBIT', maskedNumber: '•••• 8624', scope: 'PERSONAL', secured: false, virtual: false },
    { id: 'card-slice-debit', issuer: 'slice', name: 'slice Virtual', network: 'VISA', kind: 'DEBIT', maskedNumber: '•••• 0953', scope: 'PERSONAL', secured: false, virtual: true },
    { id: 'card-hdfc-debit', issuer: 'HDFC', name: 'HDFC EasyShop', network: 'RUPAY', kind: 'DEBIT', maskedNumber: '•••• 7289', scope: 'PERSONAL', secured: false, virtual: false },
    { id: 'card-idfc-wow', issuer: 'IDFC FIRST', name: 'WOW! Secured', network: 'VISA', kind: 'CREDIT', maskedNumber: '•••• 1172', scope: 'PERSONAL', creditLimitMinor: 50_000_00, outstandingMinor: 8_425_35, availableLimitMinor: 41_574_65, utilization: 16.85, paymentDueAt: '2026-08-19T18:29:59.000Z', paymentDueAmountMinor: 8_425_35, secured: true, virtual: false },
    { id: 'card-slice-credit', issuer: 'slice', name: 'slice Super', network: 'VISA', kind: 'CREDIT', maskedNumber: '•••• 9821', scope: 'PERSONAL', creditLimitMinor: 80_000_00, outstandingMinor: 27_680_45, availableLimitMinor: 52_319_55, utilization: 34.6, paymentDueAt: '2026-08-16T18:29:59.000Z', paymentDueAmountMinor: 27_680_45, secured: false, virtual: true },
    { id: 'card-amex-corp', issuer: 'American Express', name: 'Corporate Green', network: 'AMEX', kind: 'CREDIT', maskedNumber: '•••• 7011', scope: 'CORPORATE', creditLimitMinor: 500_000_00, outstandingMinor: 42_115_00, availableLimitMinor: 457_885_00, utilization: 8.42, paymentDueAt: '2026-08-25T18:29:59.000Z', paymentDueAmountMinor: 42_115_00, secured: false, virtual: false },
  ],
  bureauReports: [
    { id: 'bureau-cibil-20260810', bureau: 'CIBIL', score: 771, maxScore: 900, rating: 'VERY_GOOD', change: 9, pulledAt: '2026-08-10T05:00:00.000Z', accountsReported: 4, enquiries: 1, factors: [
      { code: 'PAYMENT_HISTORY', label: 'Payment history', impact: 'POSITIVE', detail: 'No late payments reported in the synthetic 24-month history.' },
      { code: 'UTILIZATION', label: 'Credit utilization', impact: 'NEUTRAL', detail: 'One revolving account is above the 30% planning threshold.' },
    ] },
    { id: 'bureau-crif-20260809', bureau: 'CRIF', score: 756, maxScore: 900, rating: 'VERY_GOOD', change: 4, pulledAt: '2026-08-09T05:00:00.000Z', accountsReported: 4, enquiries: 2, factors: [
      { code: 'ACCOUNT_AGE', label: 'Credit age', impact: 'NEUTRAL', detail: 'Synthetic average credit age is 28 months.' },
    ] },
    { id: 'bureau-experian-20260808', bureau: 'EXPERIAN', score: 782, maxScore: 900, rating: 'VERY_GOOD', change: 11, pulledAt: '2026-08-08T05:00:00.000Z', accountsReported: 5, enquiries: 1, factors: [
      { code: 'PAYMENT_HISTORY', label: 'Payment history', impact: 'POSITIVE', detail: 'Synthetic repayment history is current.' },
    ] },
    { id: 'bureau-equifax-20260807', bureau: 'EQUIFAX', score: 748, maxScore: 900, rating: 'GOOD', change: -2, pulledAt: '2026-08-07T05:00:00.000Z', accountsReported: 4, enquiries: 2, factors: [
      { code: 'ENQUIRIES', label: 'Recent enquiries', impact: 'NEGATIVE', detail: 'Two synthetic enquiries were observed in the last 90 days.' },
    ] },
  ],
  transactions: [
    { id: 'txn-salary-aug', accountId: 'acc-sbi-salary', scope: 'PERSONAL', postedAt: '2026-08-01T04:30:00.000Z', amountMinor: 242_000_00, direction: 'CREDIT', status: 'POSTED', merchant: 'Acme India Payroll', description: 'August salary', category: 'Income', channel: 'NEFT', recurring: true, needsReview: false, classificationConfidence: 0.99 },
    { id: 'txn-rent-aug', accountId: 'acc-sbi-salary', scope: 'PERSONAL', postedAt: '2026-08-02T08:15:00.000Z', amountMinor: 42_000_00, direction: 'DEBIT', status: 'POSTED', merchant: 'Rent Transfer', description: 'Monthly rent', category: 'Housing', channel: 'UPI', recurring: true, needsReview: false, classificationConfidence: 0.98 },
    { id: 'txn-grocery-1', accountId: 'acc-idfc-savings', cardId: 'card-idfc-debit', scope: 'PERSONAL', postedAt: '2026-08-04T14:22:00.000Z', amountMinor: 4_286_45, direction: 'DEBIT', status: 'POSTED', merchant: 'Nature Basket', description: 'Groceries', category: 'Groceries', channel: 'CARD', recurring: false, needsReview: false, classificationConfidence: 0.94 },
    { id: 'txn-emi-car', accountId: 'acc-sbi-salary', scope: 'PERSONAL', postedAt: '2026-08-05T02:30:00.000Z', amountMinor: 18_450_00, direction: 'DEBIT', status: 'POSTED', merchant: 'Auto Finance NACH', description: 'Vehicle EMI', category: 'EMI', channel: 'NACH', recurring: true, needsReview: false, classificationConfidence: 0.99 },
    { id: 'txn-dining-1', accountId: 'acc-slice', cardId: 'card-slice-credit', scope: 'PERSONAL', postedAt: '2026-08-06T15:55:00.000Z', amountMinor: 2_740_30, direction: 'DEBIT', status: 'POSTED', merchant: 'Bengaluru Social', description: 'Dining', category: 'Dining', channel: 'CARD', recurring: false, needsReview: false, classificationConfidence: 0.92 },
    { id: 'txn-subscriptions', accountId: 'acc-hdfc-savings', cardId: 'card-hdfc-debit', scope: 'PERSONAL', postedAt: '2026-08-07T03:10:00.000Z', amountMinor: 1_947_00, direction: 'DEBIT', status: 'POSTED', merchant: 'Digital subscriptions', description: 'Monthly subscriptions bundle', category: 'Subscriptions', channel: 'CARD', recurring: true, needsReview: true, classificationConfidence: 0.73 },
    { id: 'txn-fuel', accountId: 'acc-sbi-salary', cardId: 'card-sbi-debit', scope: 'PERSONAL', postedAt: '2026-08-08T12:40:00.000Z', amountMinor: 3_820_00, direction: 'DEBIT', status: 'POSTED', merchant: 'IndianOil', description: 'Fuel', category: 'Transport', channel: 'CARD', recurring: false, needsReview: false, classificationConfidence: 0.96 },
    { id: 'txn-utility', accountId: 'acc-idfc-savings', scope: 'PERSONAL', postedAt: '2026-08-09T09:15:00.000Z', amountMinor: 3_196_80, direction: 'DEBIT', status: 'POSTED', merchant: 'BESCOM', description: 'Electricity bill', category: 'Utilities', channel: 'UPI', recurring: true, needsReview: false, classificationConfidence: 0.98 },
    { id: 'txn-shopping', accountId: 'acc-slice', cardId: 'card-slice-credit', scope: 'PERSONAL', postedAt: '2026-08-10T16:30:00.000Z', amountMinor: 12_480_00, direction: 'DEBIT', status: 'POSTED', merchant: 'Online Marketplace', description: 'Electronics purchase', category: 'Shopping', channel: 'CARD', recurring: false, needsReview: false, classificationConfidence: 0.89 },
    { id: 'txn-refund-pending', accountId: 'acc-slice', cardId: 'card-slice-credit', scope: 'PERSONAL', postedAt: '2026-08-11T10:20:00.000Z', amountMinor: 2_199_00, direction: 'CREDIT', status: 'PENDING', merchant: 'Online Marketplace', description: 'Expected refund', category: 'Refund', channel: 'CARD', recurring: false, needsReview: true, classificationConfidence: 0.81 },
    { id: 'txn-corp-flight', accountId: 'acc-corp-reimburse', cardId: 'card-amex-corp', scope: 'CORPORATE', postedAt: '2026-08-03T07:30:00.000Z', amountMinor: 18_640_00, direction: 'DEBIT', status: 'POSTED', merchant: 'IndiGo', description: 'Client travel', category: 'Business travel', channel: 'CARD', recurring: false, needsReview: false, classificationConfidence: 0.99 },
    { id: 'txn-corp-hotel', accountId: 'acc-corp-reimburse', cardId: 'card-amex-corp', scope: 'CORPORATE', postedAt: '2026-08-04T18:30:00.000Z', amountMinor: 23_475_00, direction: 'DEBIT', status: 'POSTED', merchant: 'Business Hotel', description: 'Client travel stay', category: 'Business travel', channel: 'CARD', recurring: false, needsReview: false, classificationConfidence: 0.99 },
  ],
  bills: [
    { id: 'bill-slice-aug', name: 'slice credit card', kind: 'CREDIT_CARD', scope: 'PERSONAL', amountMinor: 27_680_45, dueAt: '2026-08-16T18:29:59.000Z', status: 'DUE', autopay: false, sourceId: 'card-slice-credit' },
    { id: 'bill-idfc-wow-aug', name: 'IDFC WOW! card', kind: 'CREDIT_CARD', scope: 'PERSONAL', amountMinor: 8_425_35, dueAt: '2026-08-19T18:29:59.000Z', status: 'AUTOPAY', autopay: true, sourceId: 'card-idfc-wow' },
    { id: 'bill-car-emi-sep', name: 'Vehicle EMI', kind: 'EMI', scope: 'PERSONAL', amountMinor: 18_450_00, dueAt: '2026-09-05T18:29:59.000Z', status: 'AUTOPAY', autopay: true },
    { id: 'bill-insurance', name: 'Health insurance', kind: 'INSURANCE', scope: 'PERSONAL', amountMinor: 12_200_00, dueAt: '2026-08-28T18:29:59.000Z', status: 'DUE', autopay: false },
    { id: 'bill-amex-corp', name: 'Corporate Amex', kind: 'CREDIT_CARD', scope: 'CORPORATE', amountMinor: 42_115_00, dueAt: '2026-08-25T18:29:59.000Z', status: 'AUTOPAY', autopay: true, sourceId: 'card-amex-corp' },
  ],
};

Object.freeze(snapshot.accounts);
Object.freeze(snapshot.cards);
Object.freeze(snapshot.bureauReports);
Object.freeze(snapshot.transactions);
Object.freeze(snapshot.bills);
Object.freeze(snapshot);

export class DeterministicFinanceRepository implements FinanceRepository {
  snapshot(): FinanceSnapshot {
    return snapshot;
  }
}
