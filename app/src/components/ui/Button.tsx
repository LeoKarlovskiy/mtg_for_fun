import type { ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'life'

type ButtonProps = {
  variant?: ButtonVariant
  onClick?: () => void
  disabled?: boolean
  children: ReactNode
  type?: 'button' | 'submit' | 'reset'
  className?: string
}

export function Button({ variant = 'primary', onClick, disabled, children, type = 'button', className = '' }: ButtonProps) {
  const base = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-bright transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'

  const variants: Record<ButtonVariant, string> = {
    primary: [
      'font-serif font-semibold text-sm tracking-widest uppercase text-bg-base',
      'bg-gradient-to-br from-gold-bright via-gold-muted to-gold-bright',
      'border border-gold-bright px-8 py-3 rounded-sm',
      'shadow-[0_0_12px_rgba(212,160,23,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]',
      'hover:shadow-[0_0_20px_rgba(212,160,23,0.65)] hover:-translate-y-px',
      'active:translate-y-0 active:shadow-[0_0_8px_rgba(212,160,23,0.4)]',
    ].join(' '),

    secondary: [
      'font-serif font-normal text-sm tracking-widest uppercase text-gold-bright',
      'bg-transparent border border-gold-muted px-8 py-3 rounded-sm',
      'hover:border-gold-bright hover:text-parchment',
    ].join(' '),

    life: [
      'w-10 h-10 font-serif text-xl text-[var(--color-text-secondary)]',
      'bg-transparent border border-[var(--color-border-subtle)] rounded-sm',
      'hover:text-gold-bright hover:border-gold-muted hover:shadow-[0_0_8px_rgba(212,160,23,0.3)]',
      'active:text-red-flare active:border-red-ember',
    ].join(' '),
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}
