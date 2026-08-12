import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('Flowline app shell', () => {
  afterEach(() => cleanup());
  beforeEach(() => {
    window.history.replaceState(null, '', '#today');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline demo')));
  });

  it('opens with an accessible daily briefing and stable primary navigation', async () => {
    render(<App />);
    expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
    expect(screen.getByRole('heading', { level: 1, name: 'Good morning, Arun.' })).toBeInTheDocument();
    expect(await screen.findByText('Demo workspace')).toBeInTheDocument();
    expect(screen.getByText(/synthetic data only/i)).toBeInTheDocument();
  });

  it('navigates to four independent bureau reports without averaging them', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(within(screen.getByRole('navigation', { name: 'Primary navigation' })).getByRole('button', { name: 'Credit' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Credit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /CIBIL 782/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /CRIF High Mark 776/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Experian 794/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Equifax 768/i }));
    expect(screen.getByText('Refresh suggested')).toBeInTheDocument();
    expect(screen.getByText(/Scores are never averaged/i)).toBeInTheDocument();
  });

  it('exposes recommendation evidence, confidence and uncertainty', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getAllByRole('button', { name: /Set money aside/i })[0]!);
    const dialog = screen.getByRole('dialog', { name: 'Fund your EMI today' });
    expect(within(dialog).getByText('96%')).toBeInTheDocument();
    expect(within(dialog).getByText('cash-buffer-v3.2')).toBeInTheDocument();
    expect(within(dialog).getByText('What this cannot know')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Set money aside' }));
    expect(screen.getByRole('status')).toHaveTextContent('No real money moved');
  });

  it('separates work cards when the financial scope changes', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Work' }));
    await user.click(within(screen.getByRole('navigation', { name: 'Primary navigation' })).getByRole('button', { name: 'Accounts' }));
    expect(screen.getByText('Corporate card')).toBeInTheDocument();
    expect(screen.getByText(/American Express · AMEX/)).toBeInTheDocument();
    expect(screen.queryByText('SBI')).not.toBeInTheDocument();
  });
});
