import * as React from 'react';
import { cn } from './cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

/** Campo de formulário do design system Cereja. */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-ink">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            'h-11 rounded-md border border-nude bg-offwhite px-3 text-ink',
            'placeholder:text-ink/40',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cereja',
            error && 'border-cereja focus-visible:ring-cereja',
            className,
          )}
          aria-invalid={Boolean(error)}
          {...props}
        />
        {error && <span className="text-xs text-cereja">{error}</span>}
      </div>
    );
  },
);
Input.displayName = 'Input';
