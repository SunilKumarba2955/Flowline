import { useMemo, useState } from 'react';
import { Badge, Button, Card, SegmentedControl } from '@flowline/design-system';
import {
  AlertCircle, ArrowRight, Banknote, BellRing, BriefcaseBusiness, CalendarDays, Check, ChevronRight,
  CircleDollarSign, Clock3, CreditCard, Download, ExternalLink, Eye, FileCheck2, Filter, Fingerprint,
  Goal, GraduationCap, Info, Landmark, Lightbulb, LockKeyhole, PiggyBank, Plus, ReceiptText, Search,
  ShieldCheck, SlidersHorizontal, Sparkles, TrendingDown, TrendingUp, Upload, WalletCards,
} from 'lucide-react';
import type { Bill, BureauName, Dashboard, FinancialScope, Recommendation, Transaction } from '../types';
import { money, relativeFreshness, shortDate, titleCase } from '../utils';
import { CashFlowChart, DonutChart, ScoreRing } from '../components/Charts';
import { AccountRow, BillRow, CorporateNotice, EmptyState, Metric, RecommendationCard, TransactionRow } from '../components/Shared';

export type PageProps = {
  data: Dashboard;
  scope: FinancialScope;
  navigate: (page: string) => void;
  onRecommendation: (rec: Recommendation) => void;
  notify: (message: string) => void;
};

export function TodayPage({ data, navigate, onRecommendation }: PageProps) {
  const due = data.bills.filter((bill) => bill.scope === 'PERSONAL' && bill.status !== 'PAID').slice(0, 3);
  const personalAccounts = data.accounts.filter((account) => account.scope === 'PERSONAL');
  return (
    <div className="page page--today">
      <header className="page-header page-header--hero">
        <div><span className="eyebrow">Wednesday · 12 August</span><h1>Good morning, Arun.</h1><p>Here’s how your money is moving today.</p></div>
        <Badge tone="positive"><span className="pulse-dot" /> All sources synced</Badge>
      </header>

      <div className="today-grid">
        <Card className="story-card">
          <div className="card-heading"><div><span className="eyebrow">Your breathing room</span><h2>{money(data.availableCashMinor)}</h2><p>available across personal accounts</p></div><div className="story-orbit" aria-hidden="true"><span /><span /><span /></div></div>
          <div className="money-path" aria-label="Salary arrived, bills reserved, savings remain">
            <div><span className="path-icon path-icon--income"><Banknote size={18} /></span><strong>{money(data.monthlyIncomeMinor)}</strong><small>salary arrived</small></div>
            <i aria-hidden="true"><span /></i>
            <div><span className="path-icon path-icon--bills"><ReceiptText size={18} /></span><strong>{money(data.monthlySpendMinor)}</strong><small>spent + reserved</small></div>
            <i aria-hidden="true"><span /></i>
            <div><span className="path-icon path-icon--save"><PiggyBank size={18} /></span><strong>{money(data.monthlySavingsMinor)}</strong><small>still yours</small></div>
          </div>
          <div className="story-summary"><Sparkles size={17} /><span>You’re keeping <strong>{data.savingsRate}%</strong> of this month’s income — 6.4 points above your recent average.</span><Button size="sm" variant="quiet" onClick={() => navigate('flow')}>See the flow <ArrowRight size={14} /></Button></div>
        </Card>

        <Card className="dues-card">
          <div className="section-heading"><div><span className="eyebrow">Next 14 days</span><h2>Coming up</h2></div><span className="amount-caption">{money(data.upcomingDuesMinor)}</span></div>
          <div className="list">{due.map((bill) => <BillRow key={bill.id} bill={bill} />)}</div>
          <Button variant="secondary" onClick={() => navigate('bills')}>Open bill calendar <CalendarDays size={15} /></Button>
        </Card>
      </div>

      <section className="section-block">
        <div className="section-heading"><div><span className="eyebrow">Worth your attention</span><h2>Three useful moves</h2></div><span className="quiet-label">Ordered by time sensitivity</span></div>
        <div className="recommendations">{data.recommendations.map((rec) => <RecommendationCard key={rec.id} recommendation={rec} onOpen={onRecommendation} />)}</div>
      </section>

      <div className="lower-grid">
        <Card className="panel-pad">
          <div className="section-heading"><div><span className="eyebrow">Your accounts</span><h2>Money at a glance</h2></div><Button size="sm" variant="quiet" onClick={() => navigate('accounts')}>View all <ChevronRight size={14} /></Button></div>
          <div className="list">{personalAccounts.map((account) => <AccountRow key={account.id} account={account} />)}</div>
        </Card>
        <Card className="panel-pad">
          <div className="section-heading"><div><span className="eyebrow">This month</span><h2>Where it went</h2></div></div>
          <div className="spend-glance"><DonutChart items={data.categoryBreakdown} /><div className="mini-legend">{data.categoryBreakdown.slice(0, 4).map((item, index) => <span key={item.category} style={{ '--legend': ['var(--flow)', 'var(--blue)', 'var(--amber)', 'var(--violet)'][index] } as React.CSSProperties}><i />{item.category}<strong>{item.percentage}%</strong></span>)}</div></div>
        </Card>
      </div>
    </div>
  );
}

export function FlowPage({ data, notify }: PageProps) {
  const [extraSavings, setExtraSavings] = useState(500000);
  const [scenario, setScenario] = useState<'base' | 'trip' | 'invest'>('base');
  const scenarioDelta = scenario === 'trip' ? -2400000 : scenario === 'invest' ? -extraSavings : 0;
  const endCash = 14980000 + scenarioDelta;
  return (
    <div className="page">
      <header className="page-header"><div><span className="eyebrow">Forecast and scenarios</span><h1>Flow</h1><p>See where your money is headed before you make a move.</p></div><Button variant="secondary" onClick={() => notify('Your scenario has been saved locally.')}>Save scenario</Button></header>
      <div className="metric-grid">
        <Metric label="Income this month" value={money(data.monthlyIncomeMinor)} detail="Salary received 11 Aug" tone="positive" />
        <Metric label="Spent + scheduled" value={money(data.monthlySpendMinor)} detail="₹48,762 still upcoming" />
        <Metric label="Expected month-end" value={money(endCash)} detail={scenario === 'base' ? 'Above your ₹75,000 floor' : 'After this scenario'} tone={endCash < 7500000 ? 'warning' : 'positive'} />
        <Metric label="Savings rate" value={`${Math.max(0, data.savingsRate + scenarioDelta / data.monthlyIncomeMinor * 100).toFixed(1)}%`} detail="Recent average 33.4%" />
      </div>
      <div className="flow-grid">
        <Card className="panel-pad flow-chart-card">
          <div className="section-heading"><div><span className="eyebrow">Six month movement</span><h2>Your surplus is getting steadier</h2></div><Badge tone="positive"><TrendingUp size={13} /> +₹20.8K vs Mar</Badge></div>
          <CashFlowChart series={data.cashflowSeries} extraSavingsMinor={scenarioDelta} />
          <div className="chart-foot"><span><i className="dot dot--income" /> Income</span><span><i className="dot dot--spend" /> Available after spending</span><span className="grow" /><small>Includes known bills and EMIs. Estimates can change.</small></div>
        </Card>
        <Card className="panel-pad scenario-card">
          <span className="eyebrow">Try a decision</span><h2>What if…</h2><p>Nothing here moves real money. Change a plan and see its effect.</p>
          <SegmentedControl label="Choose scenario" value={scenario} onChange={setScenario} options={[{ value: 'base', label: 'As planned' }, { value: 'trip', label: 'Book trip' }, { value: 'invest', label: 'Invest' }]} />
          {scenario === 'invest' && <label className="range-field"><span><strong>Extra investment</strong><output>{money(extraSavings)}</output></span><input aria-label="Extra investment amount" type="range" min="100000" max="2500000" step="100000" value={extraSavings} onChange={(event) => setExtraSavings(Number(event.target.value))} /></label>}
          {scenario === 'trip' && <div className="scenario-input"><BriefcaseBusiness size={18} /><span><strong>Bengaluru → Goa</strong><small>Estimated total · 4 days</small></span><strong>{money(2400000)}</strong></div>}
          <div className="scenario-result"><span>Expected month-end</span><strong>{money(endCash)}</strong><small>{endCash >= 7500000 ? <><Check size={14} /> Comfort floor stays protected</> : <><AlertCircle size={14} /> Below your comfort floor</>}</small></div>
          <div className="explain-line"><Info size={15} /> Based on current balances, repeating income, known bills and your ₹75,000 cash floor.</div>
        </Card>
      </div>
      <Card className="panel-pad timeline-card"><div className="section-heading"><div><span className="eyebrow">Rest of August</span><h2>The month ahead</h2></div></div><div className="timeline">{[
        ['16 Aug', 'Laptop EMI', -685000, 'scheduled'], ['19 Aug', 'IDFC card bill', -1248000, 'manual'], ['23 Aug', 'Slice card bill', -1704000, 'autopay'], ['26 Aug', 'Term insurance', -895000, 'manual'], ['31 Aug', 'Projected close', endCash, 'balance'],
      ].map(([date, label, amount, status]) => <div key={String(label)} className={status === 'balance' ? 'timeline-item timeline-item--end' : 'timeline-item'}><span>{date}</span><i /><div><strong>{label}</strong><small>{titleCase(String(status))}</small></div><strong className={Number(amount) > 0 ? 'positive' : ''}>{Number(amount) > 0 ? '' : '−'}{money(Math.abs(Number(amount)))}</strong></div>)}</div></Card>
    </div>
  );
}

export function AccountsPage({ data, scope, notify }: PageProps) {
  const accounts = data.accounts;
  const cards = data.cards;
  const personalCards = cards.filter((card) => card.scope === 'PERSONAL');
  const corporateCards = cards.filter((card) => card.scope === 'CORPORATE');
  return (
    <div className="page">
      <header className="page-header"><div><span className="eyebrow">Banks and instruments</span><h1>Accounts</h1><p>Every balance and card, with ownership and freshness made clear.</p></div><Button onClick={() => notify('Demo connection started. No credentials are collected.')}><Plus size={16} /> Connect source</Button></header>
      {scope !== 'CORPORATE' && <div className="metric-grid metric-grid--3"><Metric label="Available cash" value={money(data.availableCashMinor)} detail={`${accounts.filter((item) => item.scope === 'PERSONAL').length} personal accounts`} /><Metric label="Card outstanding" value={money(personalCards.reduce((sum, card) => sum + (card.outstandingMinor ?? 0), 0))} detail="Across 2 personal credit cards" /><Metric label="Total utilization" value={`${data.creditUtilization}%`} detail="Healthy range · under 30%" tone="positive" /></div>}
      <section className="section-block"><div className="section-heading"><div><span className="eyebrow">Deposits and wallet</span><h2>Bank accounts</h2></div><Badge tone="positive"><span className="pulse-dot" /> Synced</Badge></div><div className="account-card-grid">{accounts.map((account) => <Card key={account.id} className="account-tile" interactive><div className="account-tile-top"><div className="bank-mark"><Landmark size={18} /></div><div className="grow"><strong>{account.bank}</strong><small>{account.name}</small></div>{account.primary && <Badge tone="info">Primary</Badge>}</div><strong className="account-balance">{money(account.availableBalanceMinor)}</strong><div className="account-tile-foot"><span>{account.maskedNumber}</span><span>{relativeFreshness(account.updatedAt)}</span></div></Card>)}</div></section>
      {personalCards.length > 0 && <section className="section-block"><div className="section-heading"><div><span className="eyebrow">Personal</span><h2>Cards</h2></div><span className="quiet-label">Only the last four digits are stored here</span></div><div className="card-grid">{personalCards.map((card) => <InstrumentCard key={card.id} card={card} />)}</div></section>}
      {corporateCards.length > 0 && <section className="section-block"><CorporateNotice /><div className="card-grid card-grid--corp">{corporateCards.map((card) => <InstrumentCard key={card.id} card={card} />)}</div></section>}
    </div>
  );
}

function InstrumentCard({ card }: { card: Dashboard['cards'][number] }) {
  const utilization = card.utilization ?? 0;
  return <Card className={`instrument-card instrument-card--${card.scope.toLowerCase()}`} interactive><div className="instrument-top"><div><Badge tone={card.scope === 'CORPORATE' ? 'info' : 'neutral'}>{card.scope === 'CORPORATE' ? 'Work' : card.kind}</Badge>{card.virtual && <Badge tone="positive">Virtual</Badge>}{card.secured && <Badge tone="warning">Secured</Badge>}</div><CreditCard size={23} /></div><h3>{card.name}</h3><p>{card.issuer} · {card.network} · {card.maskedNumber}</p>{card.kind === 'CREDIT' ? <><div className="instrument-numbers"><span><small>Outstanding</small><strong>{money(card.outstandingMinor ?? 0)}</strong></span><span><small>Available</small><strong>{money(card.availableLimitMinor ?? 0)}</strong></span></div><div className="progress"><span style={{ width: `${utilization}%` }} /></div><small>{utilization.toFixed(1)}% of {money(card.creditLimitMinor ?? 0)} used</small></> : <div className="debit-note"><ShieldCheck size={17} /> Linked to your {card.issuer} account</div>}</Card>;
}

export function ActivityPage({ data, notify }: PageProps) {
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<'all' | 'money-in' | 'money-out' | 'review'>('all');
  const filtered = useMemo(() => data.recentTransactions.filter((item) => {
    const matchesQuery = `${item.merchant} ${item.description} ${item.category}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (kind === 'all' || kind === 'money-in' && item.direction === 'CREDIT' || kind === 'money-out' && item.direction === 'DEBIT' || kind === 'review' && item.needsReview);
  }), [data.recentTransactions, query, kind]);
  return <div className="page"><header className="page-header"><div><span className="eyebrow">Canonical transaction history</span><h1>Activity</h1><p>Search what happened, inspect the evidence, and correct what we misunderstood.</p></div><Button variant="secondary" onClick={() => notify('CSV export prepared with synthetic demo transactions.')}><Download size={16} /> Export</Button></header>
    <div className="activity-toolbar"><label className="search-field"><Search size={17} /><input aria-label="Search activity" placeholder="Search merchant, category or amount" value={query} onChange={(event) => setQuery(event.target.value)} /></label><SegmentedControl label="Filter transactions" value={kind} onChange={setKind} options={[{ value: 'all', label: 'All' }, { value: 'money-in', label: 'Money in' }, { value: 'money-out', label: 'Money out' }, { value: 'review', label: 'Needs review' }]} /><Button variant="secondary"><Filter size={15} /> More filters</Button></div>
    <div className="metric-grid metric-grid--3"><Metric label="Spent this month" value={money(data.monthlySpendMinor)} detail="Excludes own transfers" /><Metric label="Repeating commitments" value={money(data.bills.filter((bill) => bill.autopay).reduce((sum, bill) => sum + bill.amountMinor, 0))} detail="3 known repeating items" /><Metric label="Needs your review" value={`${data.recentTransactions.filter((item) => item.needsReview).length}`} detail="One uncertain category" tone="warning" /></div>
    <Card className="activity-list"><div className="activity-list-head"><span>{filtered.length} transactions</span><span>Amount</span></div>{filtered.length ? filtered.map((transaction) => <button className="transaction-button" key={transaction.id} onClick={() => notify(`${transaction.merchant}: ${Math.round(transaction.classificationConfidence * 100)}% category confidence. Evidence view opened.`)}><TransactionRow transaction={transaction} /><ChevronRight size={15} /></button>) : <EmptyState title="No matching activity" detail="Try a broader search or clear a filter." />}</Card>
    <div className="transfer-explainer"><ArrowRight size={18} /><span><strong>Transfers count once.</strong> The ₹12,000 SBI → HDFC movement is linked as one own-account transfer, so it is not treated as income or spending.</span></div>
  </div>;
}

export function BillsPage({ data, notify }: PageProps) {
  const [bills, setBills] = useState(data.bills);
  const [view, setView] = useState<'personal' | 'work'>('personal');
  const shown = bills.filter((bill) => bill.scope === (view === 'personal' ? 'PERSONAL' : 'CORPORATE'));
  const unpaid = shown.filter((bill) => bill.status !== 'PAID');
  const markPaid = (target: Bill) => { setBills((items) => items.map((item) => item.id === target.id ? { ...item, status: 'PAID' } : item)); notify(`${target.name} marked paid in this demo.`); };
  return <div className="page"><header className="page-header"><div><span className="eyebrow">Commitments and reminders</span><h1>Bills</h1><p>Know what is due, where it will be funded, and what needs a manual step.</p></div><Button onClick={() => notify('Add-bill flow opened in demo mode.')}><Plus size={16} /> Add bill</Button></header>
    <div className="page-controls"><SegmentedControl label="Bill ownership" value={view} onChange={setView} options={[{ value: 'personal', label: 'Personal' }, { value: 'work', label: 'Work' }]} />{view === 'work' && <Badge tone="info"><BriefcaseBusiness size={13} /> Kept separate</Badge>}</div>
    {view === 'personal' ? <div className="metric-grid metric-grid--3"><Metric label="Due this month" value={money(unpaid.reduce((sum, bill) => sum + bill.amountMinor, 0))} detail={`${unpaid.length} commitments remaining`} /><Metric label="Covered by autopay" value={money(unpaid.filter((bill) => bill.autopay).reduce((sum, bill) => sum + bill.amountMinor, 0))} detail="Funding checked this morning" tone="positive" /><Metric label="Needs a manual step" value={`${unpaid.filter((bill) => !bill.autopay).length}`} detail="IDFC card and insurance" tone="warning" /></div> : <CorporateNotice />}
    <div className="bills-layout"><Card className="panel-pad"><div className="section-heading"><div><span className="eyebrow">August 2026</span><h2>Payment timeline</h2></div><Badge tone={unpaid.some((bill) => bill.status === 'OVERDUE') ? 'critical' : 'positive'}>{unpaid.some((bill) => bill.status === 'OVERDUE') ? 'Action needed' : 'On track'}</Badge></div><div className="calendar-strip" aria-label="August bill calendar">{Array.from({ length: 16 }, (_, i) => i + 15).map((day) => { const count = shown.filter((bill) => new Date(bill.dueAt).getDate() === day).length; return <div key={day} className={count ? 'calendar-day calendar-day--due' : 'calendar-day'}><small>{new Date(`2026-08-${day}`).toLocaleDateString('en-IN', { weekday: 'narrow' })}</small><strong>{day}</strong>{count > 0 && <i><span className="sr-only">{count} bill due</span></i>}</div>; })}</div><div className="list bills-list">{shown.length ? shown.map((bill) => <BillRow key={bill.id} bill={bill} onPaid={markPaid} />) : <EmptyState title="Nothing due here" detail="Work expenses appear once the corporate card statement arrives." />}</div></Card>
      <Card className="panel-pad funding-card"><span className="eyebrow">Funding check</span><h2>{view === 'personal' ? 'Every autopay is covered' : 'Reimbursement watch'}</h2><div className="funding-visual"><span className="funding-bank"><Landmark size={20} /><small>{view === 'personal' ? 'SBI salary' : 'Corporate Amex'}</small><strong>{view === 'personal' ? money(18348200) : money(4685000)}</strong></span><i><ArrowRight size={20} /></i><span className="funding-bills"><ReceiptText size={20} /><small>{view === 'personal' ? 'Known dues' : 'Statement'}</small><strong>{money(unpaid.reduce((sum, bill) => sum + bill.amountMinor, 0))}</strong></span></div><div className="buffer-callout"><ShieldCheck size={17} /><span><strong>{view === 'personal' ? money(13472000) : 'Separate from personal cash'}</strong><small>{view === 'personal' ? 'remains after known August dues' : 'Reconcile after reimbursement'}</small></span></div><Button variant="secondary" onClick={() => notify('Reminder preferences opened.')}>Manage reminders <BellRing size={15} /></Button></Card>
    </div>
  </div>;
}

export function CreditPage({ data, notify }: PageProps) {
  const [active, setActive] = useState<BureauName>('CIBIL');
  const report = data.bureauReports.find((item) => item.bureau === active) ?? data.bureauReports[0];
  const isStale = active === 'EQUIFAX';
  return <div className="page"><header className="page-header"><div><span className="eyebrow">Four independent reports</span><h1>Credit</h1><p>Understand what each bureau sees. Scores are never averaged into a made-up number.</p></div><Button variant="secondary" onClick={() => notify('Refresh request started in demo mode.')}><Upload size={16} /> Refresh reports</Button></header>
    <div className="bureau-grid">{data.bureauReports.map((item) => <button key={item.bureau} className={item.bureau === active ? 'bureau-summary bureau-summary--active' : 'bureau-summary'} onClick={() => setActive(item.bureau)} aria-pressed={item.bureau === active}><span>{item.bureau === 'CRIF' ? 'CRIF High Mark' : titleCase(item.bureau)}</span><strong>{item.score}</strong><small className={item.change >= 0 ? 'positive' : 'negative'}>{item.change >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />} {item.change >= 0 ? '+' : ''}{item.change} since prior</small><i>{relativeFreshness(item.pulledAt)}</i></button>)}</div>
    <div className="credit-layout"><Card className="panel-pad credit-detail"><div className="section-heading"><div><span className="eyebrow">{active === 'CRIF' ? 'CRIF High Mark' : titleCase(active)} report</span><h2>{titleCase(report.rating)}</h2></div>{isStale ? <Badge tone="warning"><Clock3 size={13} /> Refresh suggested</Badge> : <Badge tone="positive"><FileCheck2 size={13} /> Current snapshot</Badge>}</div><div className="score-overview"><ScoreRing score={report.score} max={report.maxScore} /><div className="score-context"><p>This score is shown using {active}'s own model and snapshot date.</p><div><span><strong>{report.accountsReported}</strong><small>accounts reported</small></span><span><strong>{report.enquiries}</strong><small>recent enquiries</small></span><span><strong>{shortDate(report.pulledAt)}</strong><small>report date</small></span></div></div></div><div className="factor-list"><h3>What is shaping this report</h3>{report.factors.map((factor) => <div key={factor.code} className="factor-row"><span className={`factor-icon factor-icon--${factor.impact.toLowerCase()}`}>{factor.impact === 'POSITIVE' ? <Check size={16} /> : <Info size={16} />}</span><div><strong>{factor.label}</strong><p>{factor.detail}</p></div><Badge tone={factor.impact === 'POSITIVE' ? 'positive' : 'neutral'}>{titleCase(factor.impact)}</Badge></div>)}</div></Card>
      <div className="credit-side"><Card className="panel-pad"><span className="eyebrow">Across reports</span><h2>One item to verify</h2><div className="discrepancy"><AlertCircle size={20} /><div><strong>Experian shows one extra account</strong><p>Five accounts appear on Experian; the other three show four. This can be a timing difference, not necessarily an error.</p></div></div><Button variant="secondary" onClick={() => notify('Verification checklist opened.')}>Open verification steps <ChevronRight size={15} /></Button></Card><Card className="panel-pad explain-card"><Lightbulb size={22} /><h2>Why scores differ</h2><p>Each bureau can have different lender updates, refresh dates and scoring models. Compare the underlying accounts and dates—not just the score.</p><button onClick={() => notify('Credit score guide opened.')}>Read the 3-minute guide <ExternalLink size={14} /></button></Card></div>
    </div>
  </div>;
}

export function ExplorePage({ data, notify }: PageProps) {
  const options = [
    { icon: PiggyBank, title: 'Emergency fund', label: 'You can build this steadily', detail: 'At your current pace, a 6-month buffer is about 11 months away.', action: 'Build a plan', tone: 'positive' },
    { icon: Goal, title: 'Increase monthly investing', label: 'Likely affordable', detail: 'An extra ₹5,000 keeps your projected cash above its comfort floor.', action: 'Try the scenario', tone: 'info' },
    { icon: CreditCard, title: 'New unsecured card', label: 'Wait and review first', detail: 'No need to add capacity today. Resolve the cross-bureau mismatch before applying.', action: 'See why', tone: 'warning' },
  ];
  return <div className="page"><header className="page-header"><div><span className="eyebrow">Possibilities, with context</span><h1>Explore</h1><p>Understand what may fit your money now. Estimates are guidance, never partner approval.</p></div></header>
    <Card className="explore-hero"><div><Badge tone="positive"><Sparkles size={13} /> Based on your current picture</Badge><h2>You have room to plan, not pressure to spend.</h2><p>Your bills are covered, utilization is modest, and cash flow is positive. The useful next step is strengthening flexibility.</p><div className="explore-stats"><span><strong>{data.savingsRate}%</strong><small>savings rate</small></span><span><strong>{data.creditUtilization}%</strong><small>credit utilization</small></span><span><strong>{money(14980000)}</strong><small>projected month-end</small></span></div></div><div className="explore-illustration" aria-hidden="true"><span className="hill hill--1"/><span className="hill hill--2"/><span className="sun"><Sparkles /></span><i className="path-dash"/></div></Card>
    <section className="section-block"><div className="section-heading"><div><span className="eyebrow">Next possibilities</span><h2>What your current picture supports</h2></div></div><div className="explore-grid">{options.map((option) => <Card key={option.title} className="opportunity" interactive><span className={`opp-icon opp-icon--${option.tone}`}><option.icon size={21} /></span><Badge tone={option.tone as 'positive' | 'info' | 'warning'}>{option.label}</Badge><h3>{option.title}</h3><p>{option.detail}</p><Button variant="quiet" onClick={() => notify(`${option.title} opened as a no-impact demo scenario.`)}>{option.action}<ChevronRight size={14}/></Button></Card>)}</div></section>
    <div className="partner-note"><Info size={17}/><span><strong>No guaranteed eligibility.</strong> Product fits shown here are estimates from your demo data. A regulated lender or partner makes every real approval decision after consent.</span></div>
    <Card className="learning-strip"><GraduationCap size={23}/><div className="grow"><span className="eyebrow">Learn as you go</span><h2>Three money concepts worth 10 minutes</h2><p>Credit utilization · Statement date vs due date · How account aggregation consent works</p></div><Button variant="secondary" onClick={() => notify('Learning collection opened.')}>Browse guides</Button></Card>
  </div>;
}

export function PrivacyPage({ notify }: PageProps) {
  const [analytics, setAnalytics] = useState(false);
  const [locked, setLocked] = useState(true);
  const sources = [
    ['Synthetic bank connections', 'SBI, IDFC FIRST, HDFC and Slice', 'Demo only', Landmark],
    ['Synthetic bureau reports', 'CIBIL, CRIF, Experian and Equifax', 'Demo only', FileCheck2],
    ['Local preferences', 'Cash floor, categories and reminder choices', 'On this device', SlidersHorizontal],
  ] as const;
  return <div className="page"><header className="page-header"><div><span className="eyebrow">Control and transparency</span><h1>Data & privacy</h1><p>See what Flowline holds, why it is used, and remove it when you choose.</p></div><Badge tone="positive"><LockKeyhole size={13}/> Demo data only</Badge></header>
    <div className="privacy-hero"><div className="privacy-lock"><ShieldCheck size={28}/></div><div className="grow"><h2>This workspace contains no real financial data.</h2><p>All names, balances, transactions and reports in this build are deterministic synthetic examples. No bank password, OTP, PIN, CVV or full card number is collected.</p></div><Badge tone="positive">Protected by design</Badge></div>
    <div className="privacy-grid"><Card className="panel-pad"><div className="section-heading"><div><span className="eyebrow">Source inventory</span><h2>Data in this workspace</h2></div></div><div className="source-list">{sources.map(([title, detail, status, Icon]) => <div key={title}><span className="source-icon"><Icon size={18}/></span><div className="grow"><strong>{title}</strong><small>{detail}</small></div><Badge>{status}</Badge></div>)}</div><Button variant="secondary" onClick={() => notify('Data map opened with source → use → retention links.')}><Eye size={15}/> View data map</Button></Card>
      <Card className="panel-pad"><span className="eyebrow">Your choices</span><h2>Privacy preferences</h2><label className="toggle-row"><span><strong>App lock</strong><small>Require device authentication when available</small></span><input type="checkbox" checked={locked} onChange={(event) => setLocked(event.target.checked)}/><i aria-hidden="true"/></label><label className="toggle-row"><span><strong>Optional product analytics</strong><small>Share anonymous interactions to improve the demo</small></span><input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)}/><i aria-hidden="true"/></label><div className="consent-note"><Fingerprint size={17}/><span><strong>Consent is specific and revocable.</strong><small>Future bank or bureau links will show purpose, data range, duration and withdrawal controls before access.</small></span></div></Card>
    </div>
    <section className="section-block"><div className="section-heading"><div><span className="eyebrow">Portability and removal</span><h2>Your workspace, your call</h2></div></div><div className="data-actions"><Card className="data-action"><Download size={21}/><div className="grow"><h3>Export demo data</h3><p>Download a readable copy of the synthetic workspace and decision evidence.</p></div><Button variant="secondary" onClick={() => notify('Encrypted demo export prepared.')}>Export</Button></Card><Card className="data-action"><Upload size={21}/><div className="grow"><h3>Backup and restore</h3><p>Create a versioned encrypted backup or inspect the latest recovery point.</p></div><Button variant="secondary" onClick={() => notify('Latest demo backup: 12 Aug 2026, verified.')}>Manage</Button></Card><Card className="data-action data-action--danger"><LockKeyhole size={21}/><div className="grow"><h3>Erase this workspace</h3><p>Remove local demo data and reset Flowline to its welcome state.</p></div><Button variant="danger" onClick={() => notify('Erase requires a deliberate confirmation; no data was removed.')}>Erase</Button></Card></div></section>
  </div>;
}
