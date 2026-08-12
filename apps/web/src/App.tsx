import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, IconButton, SegmentedControl } from '@flowline/design-system';
import {
  Activity, Bell, CalendarClock, Check, ChevronLeft, CircleHelp, Compass, CreditCard, Database,
  GitBranch, Home, Landmark, Menu, RefreshCw, ShieldCheck, Sparkles, X,
} from 'lucide-react';
import { loadDashboard } from './api/dashboard';
import { demoDashboard } from './data/demo';
import type { Dashboard, DataMode, FinancialScope, Recommendation } from './types';
import { AccountsPage, ActivityPage, BillsPage, CreditPage, ExplorePage, FlowPage, PrivacyPage, TodayPage } from './pages/Pages';
import { relativeFreshness } from './utils';

const navItems = [
  { id: 'today', label: 'Today', icon: Home },
  { id: 'flow', label: 'Flow', icon: GitBranch },
  { id: 'accounts', label: 'Accounts', icon: Landmark },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'bills', label: 'Bills', icon: CalendarClock },
  { id: 'credit', label: 'Credit', icon: CreditCard },
  { id: 'explore', label: 'Explore', icon: Compass },
  { id: 'privacy', label: 'Data & privacy', icon: Database },
] as const;

type PageId = typeof navItems[number]['id'];

function routeFromHash(): PageId {
  const route = window.location.hash.replace('#', '') as PageId;
  return navItems.some((item) => item.id === route) ? route : 'today';
}

export default function App() {
  const [page, setPage] = useState<PageId>(routeFromHash);
  const [scope, setScope] = useState<FinancialScope>('ALL');
  const [data, setData] = useState<Dashboard>(demoDashboard);
  const [mode, setMode] = useState<DataMode>('demo');
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [drawer, setDrawer] = useState<Recommendation | null>(null);
  const [toast, setToast] = useState('');

  const navigate = (target: string) => {
    const next = target as PageId;
    setPage(next);
    window.history.replaceState(null, '', `#${next}`);
    setMobileOpen(false);
    document.getElementById('main-content')?.focus();
  };

  const refresh = () => {
    setLoading(true);
    const controller = new AbortController();
    loadDashboard(scope, controller.signal)
      .then((result) => { setData(result.dashboard); setMode(result.mode); })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) throw error;
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  };

  useEffect(refresh, [scope]);
  useEffect(() => { const onHash = () => setPage(routeFromHash()); window.addEventListener('hashchange', onHash); return () => window.removeEventListener('hashchange', onHash); }, []);
  useEffect(() => { if (!toast) return; const timeout = window.setTimeout(() => setToast(''), 3200); return () => window.clearTimeout(timeout); }, [toast]);
  useEffect(() => { document.body.style.overflow = drawer || mobileOpen ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [drawer, mobileOpen]);

  const visibleData = useMemo(() => {
    if (scope === 'ALL') return data;
    return { ...data, scope, accounts: data.accounts.filter((item) => item.scope === scope), cards: data.cards.filter((item) => item.scope === scope), recentTransactions: data.recentTransactions.filter((item) => item.scope === scope), bills: data.bills.filter((item) => item.scope === scope) };
  }, [data, scope]);
  const props = { data: visibleData, scope, navigate, onRecommendation: setDrawer, notify: setToast };
  const pages: Record<PageId, React.ReactNode> = {
    today: <TodayPage {...props} />,
    flow: <FlowPage {...props} />,
    accounts: <AccountsPage {...props} />,
    activity: <ActivityPage {...props} />,
    bills: <BillsPage {...props} />,
    credit: <CreditPage {...props} />,
    explore: <ExplorePage {...props} />,
    privacy: <PrivacyPage {...props} />,
  };

  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <aside className={mobileOpen ? 'sidebar sidebar--open' : 'sidebar'}>
      <div className="brand"><span className="brand-mark"><span /><span /><span /></span><div><strong>flowline</strong><small>your money, in motion</small></div><IconButton className="mobile-close" label="Close navigation" onClick={() => setMobileOpen(false)}><X size={18}/></IconButton></div>
      <nav aria-label="Primary navigation">{navItems.map((item) => <button key={item.id} onClick={() => navigate(item.id)} aria-current={page === item.id ? 'page' : undefined}><item.icon size={18}/><span>{item.label}</span>{item.id === 'bills' && <Badge tone="warning">3</Badge>}</button>)}</nav>
      <div className="sidebar-foot"><button className="help-link"><CircleHelp size={17}/><span>Help & guides</span></button><div className="sync-card"><div><span className={loading ? 'sync-symbol sync-symbol--loading' : 'sync-symbol'}><RefreshCw size={14}/></span><div><strong>{loading ? 'Syncing…' : mode === 'live' ? 'Connected' : 'Demo workspace'}</strong><small>{mode === 'live' ? `Updated ${relativeFreshness(data.generatedAt)}` : 'Synthetic data · deterministic'}</small></div></div><button onClick={refresh} aria-label="Refresh data"><RefreshCw size={14}/></button></div><div className="profile"><span>AK</span><div><strong>Arun Kumar</strong><small>Bengaluru, India</small></div><button aria-label="Open profile menu">•••</button></div></div>
    </aside>
    {mobileOpen && <button className="scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
    <div className="content-shell">
      <header className="topbar"><IconButton className="mobile-menu" label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={19}/></IconButton><div className="topbar-scope"><span>Viewing</span><SegmentedControl label="Financial scope" value={scope} onChange={setScope} options={[{ value: 'ALL', label: 'Everything' }, { value: 'PERSONAL', label: 'Personal' }, { value: 'CORPORATE', label: 'Work' }]} /></div><div className="topbar-actions"><span className="secure-label"><ShieldCheck size={15}/> Protected demo</span><IconButton label="Notifications"><Bell size={18}/><i className="notification-dot"/></IconButton></div></header>
      <main id="main-content" tabIndex={-1}>{pages[page]}</main>
      <footer className="app-footer"><span>Flowline demo · synthetic data only</span><span>Guidance, not financial advice or lender approval</span></footer>
    </div>
    {drawer && <div className="drawer-layer" role="presentation"><button className="drawer-scrim" aria-label="Close details" onClick={() => setDrawer(null)}/><aside className="detail-drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title"><div className="drawer-head"><Button variant="quiet" size="sm" onClick={() => setDrawer(null)}><ChevronLeft size={15}/> Back</Button><IconButton label="Close details" onClick={() => setDrawer(null)}><X size={18}/></IconButton></div><Badge tone={drawer.priority === 'HIGH' ? 'warning' : drawer.category === 'SAVINGS' ? 'positive' : 'info'}>{drawer.category}</Badge><h2 id="drawer-title">{drawer.title}</h2><p className="drawer-lead">{drawer.explanation}</p><div className="evidence-box"><span className="eyebrow">Why Flowline suggested this</span>{drawer.evidence.map((item) => <div key={item}><ShieldCheck size={15}/><span>{item}</span></div>)}</div><div className="decision-meta"><div><span>Confidence</span><strong>{Math.round(drawer.confidence * 100)}%</strong></div><div><span>Rule</span><strong>{drawer.ruleVersion}</strong></div><div><span>Freshness</span><strong>{relativeFreshness(drawer.freshnessAt)}</strong></div></div><div className="uncertainty"><CircleHelp size={17}/><span><strong>What this cannot know</strong>{drawer.uncertainty}</span></div><div className="drawer-impact"><Sparkles size={18}/><span><small>Expected impact</small><strong>{drawer.expectedImpact}</strong></span></div><Button onClick={() => { setToast(`${drawer.actionLabel} completed in demo mode. No real money moved.`); setDrawer(null); }}>{drawer.actionLabel}</Button><Button variant="secondary" onClick={() => setDrawer(null)}>Not now</Button></aside></div>}
    {toast && <div className="toast" role="status"><Check size={17}/><span>{toast}</span><button aria-label="Dismiss message" onClick={() => setToast('')}><X size={14}/></button></div>}
  </div>;
}
