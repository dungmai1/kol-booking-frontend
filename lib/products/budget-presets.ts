/** Preset budget options for product / campaign forms. `value` is digit-only string. */
export const BUDGET_PRESETS = [
  { value: '', label: 'Thỏa thuận', hint: 'Không hiển thị mức cố định' },
  { value: '500000', label: '500 nghìn', amount: 500_000 },
  { value: '1000000', label: '1 triệu', amount: 1_000_000 },
  { value: '2000000', label: '2 triệu', amount: 2_000_000 },
  { value: '3000000', label: '3 triệu', amount: 3_000_000 },
  { value: '4000000', label: '4 triệu', amount: 4_000_000 },
  { value: '5000000', label: '5 triệu', amount: 5_000_000 },
  { value: '10000000', label: '10 triệu', amount: 10_000_000 },
] as const;

export type BudgetPreset = (typeof BUDGET_PRESETS)[number];
