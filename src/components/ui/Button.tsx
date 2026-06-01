import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ 
  className, 
  variant = 'primary', 
  size = 'md', 
  ...props 
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded font-bold transition-colors focus-visible:outline-none focus:ring-1 focus:ring-zinc-700 disabled:pointer-events-none disabled:opacity-50",
        {
          'bg-blue-700 hover:bg-blue-600 text-white': variant === 'primary',
          'bg-zinc-100 hover:bg-white text-zinc-950': variant === 'secondary',
          'bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300': variant === 'outline',
          'hover:bg-zinc-800 hover:text-white text-zinc-400': variant === 'ghost',
          'bg-rose-500 hover:bg-rose-600 text-white': variant === 'danger',
          'h-8 px-3 text-[10px] uppercase tracking-wider': size === 'sm',
          'h-10 px-6 text-xs': size === 'md',
          'h-12 px-8 text-sm': size === 'lg',
        },
        className
      )}
      {...props}
    />
  );
}
