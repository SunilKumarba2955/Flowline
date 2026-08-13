import { describe, expect, it } from 'vitest';
import { filterScope } from './api/dashboard';
import { demoDashboard } from './data/demo';
import { money, shortDate, titleCase } from './utils';

describe('money-safe presentation helpers', () => {
  it('converts integer paise only at the display boundary', () => {
    expect(money(123456)).toContain('1,234.56');
    expect(money(21000000)).toContain('2,10,000');
  });

  it('formats dates and domain labels for people', () => {
    expect(shortDate('2026-08-19')).toBe('19 Aug');
    expect(titleCase('VERY_GOOD')).toBe('Very Good');
  });
});

describe('scope isolation', () => {
  it('keeps corporate instruments and transactions out of personal views', () => {
    const personal = filterScope(demoDashboard, 'PERSONAL');
    expect(personal.cards.every((card) => card.scope === 'PERSONAL')).toBe(true);
    expect(personal.recentTransactions.every((transaction) => transaction.scope === 'PERSONAL')).toBe(true);
    expect(personal.cards.some((card) => card.issuer === 'American Express')).toBe(false);
  });

  it('preserves all sources in the combined view', () => {
    const all = filterScope(demoDashboard, 'ALL');
    expect(all.cards).toHaveLength(7);
    expect(all.bureauReports).toHaveLength(4);
  });
});

