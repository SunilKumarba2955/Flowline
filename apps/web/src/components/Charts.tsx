import type { Dashboard } from '../types';
import { money } from '../utils';

export function CashFlowChart({ series, extraSavingsMinor = 0 }: { series: Dashboard['cashflowSeries']; extraSavingsMinor?: number }) {
  const width = 680;
  const height = 230;
  const pad = 26;
  const values = series.map((item, index) => item.netMinor + (index === series.length - 1 ? extraSavingsMinor : 0));
  const max = Math.max(...values) * 1.22;
  const points = values.map((value, index) => {
    const x = pad + index * ((width - pad * 2) / Math.max(1, values.length - 1));
    const y = height - pad - (value / max) * (height - pad * 2);
    return { x, y, value, label: series[index].period };
  });
  const line = points.map((point) => `${point.x},${point.y}`).join(' ');
  const area = `${pad},${height - pad} ${line} ${width - pad},${height - pad}`;

  return (
    <figure className="cash-chart" aria-label={`Six month net cash flow; latest ${money(values.at(-1) ?? 0)}`}>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-hidden="true">
        <defs>
          <linearGradient id="cash-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--flow)" stopOpacity=".26" />
            <stop offset="1" stopColor="var(--flow)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((y) => <line key={y} x1={pad} x2={width - pad} y1={height * y} y2={height * y} className="chart-grid" />)}
        <polygon points={area} fill="url(#cash-area)" />
        <polyline points={line} className="chart-line" />
        {points.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} r="5" className="chart-dot" />
            <text x={point.x} y={height - 5} textAnchor="middle">{point.label}</text>
          </g>
        ))}
      </svg>
    </figure>
  );
}

export function DonutChart({ items }: { items: Dashboard['categoryBreakdown'] }) {
  const colours = ['var(--flow)', 'var(--blue)', 'var(--amber)', 'var(--violet)', '#ee7a62', '#b8c8c1'];
  let cursor = 0;
  const stops = items.map((item, index) => {
    const start = cursor;
    cursor += item.percentage;
    return `${colours[index]} ${start}% ${cursor}%`;
  }).join(',');
  return (
    <div className="donut" style={{ background: `conic-gradient(${stops})` }} role="img" aria-label={items.map((item) => `${item.category} ${item.percentage}%`).join(', ')}>
      <span><strong>{money(items.reduce((sum, item) => sum + item.amountMinor, 0), true)}</strong><small>this month</small></span>
    </div>
  );
}

export function ScoreRing({ score, max }: { score: number; max: number }) {
  const percent = Math.min(100, Math.max(0, (score - 300) / (max - 300) * 100));
  return (
    <div className="score-ring" style={{ '--score': `${percent * 3.6}deg` } as React.CSSProperties} aria-label={`Score ${score} out of ${max}`}>
      <span><strong>{score}</strong><small>of {max}</small></span>
    </div>
  );
}

