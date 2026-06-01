import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode;
  className?: string;
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'purple';
}

export function Badge({ className, variant = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-1 rounded text-[10px] font-mono leading-none tracking-wider uppercase font-bold",
        {
          'text-emerald-500 bg-emerald-500/10': variant === 'success',
          'text-rose-500 bg-rose-500/10': variant === 'danger',
          'text-amber-500 bg-amber-500/10': variant === 'warning',
          'text-blue-400 bg-blue-400/10': variant === 'info' || variant === 'purple',
          'text-zinc-500 bg-zinc-800': variant === 'neutral',
        },
        className
      )}
      {...props}
    />
  );
}
