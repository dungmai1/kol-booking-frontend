/** Minimum age (years) required for KOL date of birth on a commercial booking platform. */
export const MIN_KOL_AGE_YEARS = 18;

/** Latest allowed date of birth — user must be at least MIN_KOL_AGE_YEARS old. */
export function maxAllowedDateOfBirth(now = new Date()): Date {
  return new Date(now.getFullYear() - MIN_KOL_AGE_YEARS, now.getMonth(), now.getDate());
}

export function validateDateOfBirth(dob: Date | undefined, now = new Date()): string | null {
  if (!dob) return null;
  const max = maxAllowedDateOfBirth(now);
  if (dob > max) {
    return `Bạn phải từ ${MIN_KOL_AGE_YEARS} tuổi trở lên để đăng ký KOL trên nền tảng.`;
  }
  const min = new Date(now.getFullYear() - 100, now.getMonth(), now.getDate());
  if (dob < min) {
    return 'Ngày sinh không hợp lệ.';
  }
  return null;
}
