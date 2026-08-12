export function money(minor: number, compact = false) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: compact ? 1 : minor % 100 === 0 ? 0 : 2,
    notation: compact ? 'compact' : 'standard',
  }).format(minor / 100);
}

export function shortDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(new Date(value));
}

export function relativeFreshness(value: string) {
  const hours = Math.max(0, Math.round((Date.parse('2026-08-12T09:00:00+05:30') - Date.parse(value)) / 3_600_000));
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function titleCase(value: string) {
  return value.toLowerCase().replace(/(^|_|\s)\w/g, (part) => part.replace('_', ' ').toUpperCase());
}

