'use client';

import { useEffect, useMemo, useState } from 'react';
import provincesData from '@/lib/data/vietnamProvincesWards.json';

type Ward = { ward_code: string; ward_name: string };
type Province = { province_code: string; province_name: string; wards: Ward[] };

const PROVINCES = provincesData as Province[];

function compose(street: string, ward: string, province: string): string {
  return [street.trim(), ward, province].filter(Boolean).join(', ');
}

function parse(address: string): { street: string; ward: string; province: string } {
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

interface LocationSelectProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
}

export function LocationSelect({ value, onChange, required = false, disabled = false }: LocationSelectProps) {
  const [province, setProvince] = useState('');
  const [ward, setWard] = useState('');
  const [street, setStreet] = useState('');
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized) return;
    const parsed = parse(value);
    setProvince(parsed.province);
    setWard(parsed.ward);
    setStreet(parsed.street);
    setInitialized(true);
  }, [value, initialized]);

  const wards = useMemo(() => {
    const found = PROVINCES.find((p) => p.province_name === province);
    return found?.wards ?? [];
  }, [province]);

  function onProvinceChange(newProvince: string) {
    setProvince(newProvince);
    setWard('');
    onChange(compose(street, '', newProvince));
  }

  function onWardChange(newWard: string) {
    setWard(newWard);
    onChange(compose(street, newWard, province));
  }

  function onStreetChange(newStreet: string) {
    setStreet(newStreet);
    onChange(compose(newStreet, ward, province));
  }

  return (
    <div className="space-y-3">
      <select
        value={province}
        onChange={(e) => onProvinceChange(e.target.value)}
        disabled={disabled}
        required={required}
        className="pin-input"
        aria-label="Tỉnh / Thành phố"
      >
        <option value="">-- Chọn tỉnh / thành phố --</option>
        {PROVINCES.map((p) => (
          <option key={p.province_code} value={p.province_name}>
            {p.province_name}
          </option>
        ))}
      </select>

      <select
        value={ward}
        onChange={(e) => onWardChange(e.target.value)}
        disabled={disabled || !province}
        className="pin-input"
        aria-label="Phường / Xã"
      >
        <option value="">{province ? '-- Chọn phường / xã --' : '-- Chọn tỉnh trước --'}</option>
        {wards.map((w) => (
          <option key={w.ward_code} value={w.ward_name}>
            {w.ward_name}
          </option>
        ))}
      </select>

      <input
        type="text"
        value={street}
        onChange={(e) => onStreetChange(e.target.value)}
        placeholder="Số nhà, tên đường..."
        maxLength={200}
        disabled={disabled}
        className="pin-input"
        aria-label="Số nhà, tên đường"
      />
    </div>
  );
}
