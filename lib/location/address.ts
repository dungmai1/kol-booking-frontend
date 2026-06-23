import provincesData from '@/lib/data/vietnamProvincesWards.json';

type Ward = { ward_code: string; ward_name: string };
type Province = { province_code: string; province_name: string; wards: Ward[] };

const PROVINCES = provincesData as Province[];

export type ParsedVietnamAddress = {
  street: string;
  ward: string;
  province: string;
};

export function composeVietnamAddress(street: string, ward: string, province: string): string {
  return [street.trim(), ward, province].filter(Boolean).join(', ');
}

export function parseVietnamAddress(address: string): ParsedVietnamAddress {
  const parts = address.split(', ');
  let province = '';
  let ward = '';
  let streetParts = [...parts];

  const matchedProvince = PROVINCES.find((p) => p.province_name === parts[parts.length - 1]);
  if (matchedProvince) {
    province = matchedProvince.province_name;
    streetParts = parts.slice(0, -1);

    const matchedWard = matchedProvince.wards.find((w) => w.ward_name === streetParts[streetParts.length - 1]);
    if (matchedWard) {
      ward = matchedWard.ward_name;
      streetParts = streetParts.slice(0, -1);
    }
  }

  return { street: streetParts.join(', '), ward, province };
}

/** Requires tỉnh/thành, phường/xã và số nhà/tên đường. */
export function isCompleteVietnamAddress(address: string): boolean {
  const { street, ward, province } = parseVietnamAddress(address);
  return Boolean(street.trim() && ward && province);
}

export { PROVINCES };
