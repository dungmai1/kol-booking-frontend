'use client';

import {
  formatPriceDigits,
  handlePriceInputChange,
  PRICE_INPUT_PLACEHOLDER,
  validatePriceDigits,
  type ValidatePriceOptions,
} from '@/lib/currency-input';
import { cn } from '@/lib/utils';

type CurrencyInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type' | 'inputMode'
> & {
  /** Digit-only value, e.g. "1000000". */
  value: string;
  onValueChange: (digits: string) => void;
  onValidate?: (error: string) => void;
  validateOptions?: ValidatePriceOptions;
};

export function CurrencyInput({
  value,
  onValueChange,
  onValidate,
  validateOptions,
  onBlur,
  className,
  placeholder = PRICE_INPUT_PLACEHOLDER,
  ...props
}: CurrencyInputProps) {
  return (
    <input
      type="text"
      inputMode="numeric"
      value={formatPriceDigits(value)}
      onChange={(e) => onValueChange(handlePriceInputChange(e.target.value))}
      onBlur={(e) => {
        onValidate?.(validatePriceDigits(value, validateOptions));
        onBlur?.(e);
      }}
      placeholder={placeholder}
      className={cn(className)}
      {...props}
    />
  );
}
