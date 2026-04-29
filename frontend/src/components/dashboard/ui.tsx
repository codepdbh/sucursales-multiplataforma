import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';

import { cn } from '../../lib/cn';

interface PanelProps {
  children: ReactNode;
  className?: string;
}

export function Panel({ children, className }: PanelProps) {
  return <div className={cn('ui-panel', className)}>{children}</div>;
}

interface SectionTitleProps {
  actions?: ReactNode;
  eyebrow?: string;
  title: string;
}

export function SectionTitle({ actions, eyebrow, title }: SectionTitleProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        {eyebrow ? <p className="ui-eyebrow">{eyebrow}</p> : null}
        <h2 className="text-xl font-semibold tracking-normal text-[color:var(--text-strong)]">
          {title}
        </h2>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

export function Button({
  children,
  className,
  icon,
  type = 'button',
  variant = 'secondary',
  ...props
}: ButtonProps) {
  return (
    <button className={cn('ui-button', `ui-button-${variant}`, className)} type={type} {...props}>
      {icon ? <span className="ui-button-icon">{icon}</span> : null}
      <span>{children}</span>
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

export function IconButton({ children, className, label, type = 'button', ...props }: IconButtonProps) {
  return (
    <button
      aria-label={label}
      className={cn('ui-icon-button', className)}
      title={label}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}

interface FieldProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children: ReactNode;
  label: string;
}

export function Field({ children, className, label, ...props }: FieldProps) {
  return (
    <label className={cn('ui-field', className)} {...props}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('ui-input', className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn('ui-input', className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn('ui-input min-h-24 resize-y', className)} {...props} />;
}

interface BadgeProps {
  children: ReactNode;
  tone?: 'blue' | 'green' | 'amber' | 'red' | 'neutral';
}

export function Badge({ children, tone = 'neutral' }: BadgeProps) {
  return <span className={cn('ui-badge', `ui-badge-${tone}`)}>{children}</span>;
}

interface EmptyStateProps {
  children: ReactNode;
}

export function EmptyState({ children }: EmptyStateProps) {
  return <div className="ui-empty">{children}</div>;
}

interface DataTableProps {
  children: ReactNode;
}

export function DataTable({ children }: DataTableProps) {
  return (
    <div className="ui-table-wrap">
      <table className="ui-table">{children}</table>
    </div>
  );
}

interface ProductImageProps {
  alt: string;
  src?: string;
}

export function ProductImage({ alt, src }: ProductImageProps) {
  if (!src) {
    return <div className="ui-product-thumb">Sin foto</div>;
  }

  return <img alt={alt} className="ui-product-thumb object-cover" src={src} />;
}
