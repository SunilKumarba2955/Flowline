import React, { type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react';

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger';
  size?: 'sm' | 'md';
}) {
  return <button className={`fl-button fl-button--${variant} fl-button--${size} ${className}`} {...props} />;
}

export function IconButton({ label, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return <button aria-label={label} title={label} className={`fl-icon-button ${className}`} {...props} />;
}

export function Card({
  children,
  className = '',
  interactive = false,
  ...props
}: HTMLAttributes<HTMLElement> & { children: ReactNode; interactive?: boolean }) {
  return (
    <section className={`fl-card ${interactive ? 'fl-card--interactive' : ''} ${className}`} {...props}>
      {children}
    </section>
  );
}

export function Badge({
  children,
  tone = 'neutral',
  className = '',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'positive' | 'info' | 'warning' | 'critical';
  className?: string;
}) {
  return <span className={`fl-badge fl-badge--${tone} ${className}`}>{children}</span>;
}

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="fl-segmented" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          type="button"
          key={option.value}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function Skeleton({ width = '100%' }: { width?: string }) {
  return <span className="fl-skeleton" style={{ width }} aria-hidden="true" />;
}
