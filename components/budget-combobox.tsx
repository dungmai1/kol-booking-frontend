'use client';

import { useMemo, useRef, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  formatPriceDigits,
  handlePriceInputChange,
  PRICE_INPUT_PLACEHOLDER,
  validatePriceDigits,
  type ValidatePriceOptions,
} from '@/lib/currency-input';
import { BUDGET_PRESETS } from '@/lib/products/budget-presets';
import { vnd } from '@/lib/products/meta';
import { cn } from '@/lib/utils';

type BudgetComboboxProps = {
  /** Digit-only value, e.g. "5000000". Empty = thỏa thuận. */
  value: string;
  onValueChange: (digits: string) => void;
  onValidate?: (error: string) => void;
  validateOptions?: ValidatePriceOptions;
  className?: string;
  hasError?: boolean;
};

export function BudgetCombobox({
  value,
  onValueChange,
  onValidate,
  validateOptions,
  className,
  hasError,
}: BudgetComboboxProps) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredPresets = useMemo(() => {
    if (!value) return BUDGET_PRESETS;
    const q = value.toLowerCase();
    return BUDGET_PRESETS.filter(
      (p) =>
        !p.value ||
        p.value.includes(q) ||
        p.label.toLowerCase().includes(q) ||
        (p.amount != null && String(p.amount).includes(q)),
    );
  }, [value]);

  const isCustomValue =
    value !== '' && !BUDGET_PRESETS.some((p) => p.value === value);

  function selectValue(digits: string) {
    onValueChange(digits);
    onValidate?.(validatePriceDigits(digits, validateOptions));
    setOpen(false);
    inputRef.current?.focus();
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
            aria-controls="budget-combobox-list"
            value={formatPriceDigits(value)}
            onChange={(e) => onValueChange(handlePriceInputChange(e.target.value))}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              onValidate?.(validatePriceDigits(value, validateOptions));
            }}
            placeholder={PRICE_INPUT_PLACEHOLDER}
            className={cn('pr-10', className, hasError && 'border-red-500')}
          />
          <button
            type="button"
            tabIndex={-1}
            aria-label="Mở danh sách gợi ý ngân sách"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setOpen((prev) => !prev);
              inputRef.current?.focus();
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-mute hover:text-ink transition-colors"
          >
            <ChevronsUpDown className="w-4 h-4" />
          </button>
        </div>
      </PopoverAnchor>

      <PopoverContent
        id="budget-combobox-list"
        align="start"
        sideOffset={4}
        className="w-[var(--radix-popover-anchor-width)] p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          if (inputRef.current?.contains(e.target as Node)) {
            e.preventDefault();
          }
        }}
      >
        <Command shouldFilter={false}>
          <CommandList>
            <CommandEmpty>Không có gợi ý — tiếp tục nhập số tùy ý.</CommandEmpty>
            <CommandGroup heading="Gợi ý mức ngân sách">
              {filteredPresets.map((preset) => (
                <CommandItem
                  key={preset.value || 'negotiable'}
                  value={preset.value || 'negotiable'}
                  onMouseDown={(e) => e.preventDefault()}
                  onSelect={() => selectValue(preset.value)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4 shrink-0',
                      value === preset.value ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <span className="font-medium">{preset.label}</span>
                  {'amount' in preset && preset.amount != null ? (
                    <span className="ml-auto text-xs text-mute">{vnd.format(preset.amount)}</span>
                  ) : (
                    <span className="ml-auto text-xs text-mute">{preset.hint}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            {isCustomValue && (
              <CommandGroup heading="Giá trị đang nhập">
                <CommandItem
                  value={value}
                  onMouseDown={(e) => e.preventDefault()}
                  onSelect={() => setOpen(false)}
                >
                  <Check className="mr-2 h-4 w-4 opacity-100 shrink-0" />
                  <span>Dùng {formatPriceDigits(value)}</span>
                  <span className="ml-auto text-xs text-mute">{vnd.format(Number(value))}</span>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
