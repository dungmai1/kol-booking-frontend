export const PRICE_INPUT_PLACEHOLDER = 'VD: 1,000,000';

/** Keep digits only — canonical storage for price fields. */
export function sanitizePriceDigits(raw: string): string {
  return raw.replace(/\D/g, '');
}

/** Format a digit string with comma thousands separators. */
export function formatPriceDigits(digits: string): string {
  if (!digits) return '';
  const normalized = digits.replace(/^0+(?=\d)/, '');
  return normalized.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function parsePriceDigits(digits: string): number | null {
  if (!digits) return null;
  const n = Number(digits);
  return Number.isFinite(n) ? n : null;
}

export function isValidPriceFormat(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  return /^(\d{1,3}(,\d{3})+|\d+)$/.test(trimmed);
}

export interface ValidatePriceOptions {
  required?: boolean;
  min?: number;
  max?: number;
  allowZero?: boolean;
  fieldLabel?: string;
}

export function validatePriceDigits(
  digits: string,
  options: ValidatePriceOptions = {},
): string {
  const {
    required = false,
    min,
    max,
    allowZero = false,
    fieldLabel = 'Giá',
  } = options;

  if (!digits) {
    return required ? `Vui lòng nhập ${fieldLabel.toLowerCase()}.` : '';
  }

  const formatted = formatPriceDigits(digits);
  if (!isValidPriceFormat(formatted)) {
    return `Định dạng không hợp lệ. Ví dụ: 100,000 hoặc 1,000,000.`;
  }

  const n = parsePriceDigits(digits);
  if (n === null) {
    return `${fieldLabel} không phải là số hợp lệ.`;
  }

  if (!allowZero && n <= 0) {
    return `${fieldLabel} phải lớn hơn 0.`;
  }

  if (allowZero && n < 0) {
    return `${fieldLabel} không được âm.`;
  }

  if (min !== undefined && n < min) {
    return `${fieldLabel} phải ≥ ${formatPriceDigits(String(min))}.`;
  }

  if (max !== undefined && n > max) {
    return `${fieldLabel} không được vượt quá ${formatPriceDigits(String(max))}.`;
  }

  return '';
}

export function priceToDigits(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value <= 0) return '';
  return String(Math.round(value));
}

export function handlePriceInputChange(raw: string): string {
  return sanitizePriceDigits(raw);
}
