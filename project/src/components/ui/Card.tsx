import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  padded?: boolean;
}

export function Card({
  children,
  hover = false,
  padded = true,
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={`bg-white rounded-2xl border border-neutral-200/80 shadow-sm ${hover ? 'transition-all duration-300 hover:shadow-lg hover:shadow-neutral-900/5 hover:border-primary-200' : ''} ${padded ? 'p-6' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
