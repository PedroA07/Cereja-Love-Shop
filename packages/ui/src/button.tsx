import * as React from 'react';
import { cn } from './cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary: 'bg-cereja text-offwhite hover:bg-vinho focus-visible:ring-cereja',
  secondary: 'bg-creme text-ink hover:bg-creme-200 focus-visible:ring-nude',
  outline: 'border border-nude text-ink hover:bg-creme-200 focus-visible:ring-cereja',
  ghost: 'text-ink hover:bg-creme-200 focus-visible:ring-nude',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-7 text-base',
};

/** Botão base do design system Cereja. */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
