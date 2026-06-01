import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;}

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-zinc-900 border border-zinc-800 shadow-xl rounded-xl overflow-hidden",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: CardProps) {
  return <div className={cn("px-4 py-3 border-b border-zinc-800 bg-zinc-950/50", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-[10px] uppercase text-zinc-500 font-bold tracking-wider", className)} {...props} />;
}

export function CardContent({ className, ...props }: CardProps) {
  return <div className={cn("p-4", className)} {...props} />;
}
