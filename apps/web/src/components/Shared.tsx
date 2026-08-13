import { Badge, Button, Card } from '@flowline/design-system';
import { ArrowDownLeft, ArrowUpRight, Building2, Check, ChevronRight, Info, Landmark, RefreshCcw } from 'lucide-react';
import type { Account, Bill, Recommendation, Transaction } from '../types';
import { money, relativeFreshness, shortDate, titleCase } from '../utils';

export function Metric({ label, value, detail, tone }: { label: string; value: string; detail: string; tone?: 'positive' | 'warning' }) {
  return <div className={`metric ${tone ? `metric--${tone}` : ''}`}><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>;
}

export function AccountRow({ account }: { account: Account }) {
  return (
    <div className="account-row">
      <div className={`bank-mark bank-mark--${account.bank.toLowerCase().split(' ')[0]}`} aria-hidden="true"><Landmark size={18} /></div>
      <div className="grow"><strong>{account.bank}</strong><small>{account.name} · {account.maskedNumber}</small></div>
      <div className="align-end"><strong>{money(account.availableBalanceMinor)}</strong><small>{relativeFreshness(account.updatedAt)}</small></div>
    </div>
  );
}

export function TransactionRow({ transaction }: { transaction: Transaction }) {
  return (
    <div className="transaction-row">
      <div className={`txn-mark txn-mark--${transaction.direction.toLowerCase()}`} aria-hidden="true">
        {transaction.direction === 'CREDIT' ? <ArrowDownLeft size={17} /> : <ArrowUpRight size={17} />}
      </div>
      <div className="grow"><strong>{transaction.merchant}</strong><small>{transaction.category} · {transaction.channel} · {shortDate(transaction.postedAt)}</small></div>
      {transaction.needsReview && <Badge tone="warning">Review</Badge>}
      <div className="align-end"><strong className={transaction.direction === 'CREDIT' ? 'positive' : ''}>{transaction.direction === 'CREDIT' ? '+' : '−'}{money(transaction.amountMinor)}</strong><small>{titleCase(transaction.status)}</small></div>
    </div>
  );
}

export function BillRow({ bill, onPaid }: { bill: Bill; onPaid?: (bill: Bill) => void }) {
  const dueAt = new Date(bill.dueAt);
  const day = dueAt.getDate();
  const month = new Intl.DateTimeFormat('en-IN', { month: 'short' }).format(dueAt);
  return (
    <div className="bill-row">
      <div className="date-tile"><strong>{day}</strong><small>{month}</small></div>
      <div className="grow"><strong>{bill.name}</strong><small>{titleCase(bill.kind)} · {bill.autopay ? 'Autopay on' : 'Manual payment'}</small></div>
      <div className="align-end"><strong>{money(bill.amountMinor)}</strong><small>{bill.status === 'PAID' ? 'Paid' : 'Upcoming'}</small></div>
      {onPaid && bill.status !== 'PAID' && <Button size="sm" variant="secondary" onClick={() => onPaid(bill)}>Mark paid</Button>}
    </div>
  );
}

export function RecommendationCard({ recommendation, onOpen }: { recommendation: Recommendation; onOpen: (rec: Recommendation) => void }) {
  const tone = recommendation.priority === 'HIGH' || recommendation.priority === 'CRITICAL' ? 'warning' : recommendation.category === 'SAVINGS' ? 'positive' : 'info';
  return (
    <Card className="recommendation-card" interactive>
      <div className="rec-icon" data-tone={tone}>{recommendation.category === 'BILL' ? <Check size={19} /> : recommendation.category === 'ANOMALY' ? <Info size={19} /> : <ArrowUpRight size={19} />}</div>
      <div className="grow">
        <div className="eyebrow-row"><Badge tone={tone}>{titleCase(recommendation.category)}</Badge><span>{Math.round(recommendation.confidence * 100)}% confidence</span></div>
        <h3>{recommendation.title}</h3>
        <p>{recommendation.explanation}</p>
        <strong className="impact">{recommendation.expectedImpact}</strong>
      </div>
      <Button variant="quiet" size="sm" onClick={() => onOpen(recommendation)}>{recommendation.actionLabel}<ChevronRight size={15} /></Button>
    </Card>
  );
}

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return <div className="empty-state"><RefreshCcw size={23} /><strong>{title}</strong><p>{detail}</p></div>;
}

export function CorporateNotice() {
  return <div className="corporate-notice"><Building2 size={18} /><span><strong>Work money stays separate.</strong> Corporate American Express activity is excluded from personal spending and savings unless you reclassify it.</span></div>;
}
