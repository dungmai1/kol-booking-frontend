'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  composeVietnamAddress,
  parseVietnamAddress,
  PROVINCES,
} from '@/lib/location/address';

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

  useEffect(() => {
    const parsed = parseVietnamAddress(value);
    setProvince(parsed.province);
    setWard(parsed.ward);
    setStreet(parsed.street);
  }, [value]);

  const wards = useMemo(() => {
    const found = PROVINCES.find((p) => p.province_name === province);
    return found?.wards ?? [];
  }, [province]);

  function onProvinceChange(newProvince: string) {
    setProvince(newProvince);
    setWard('');
    onChange(composeVietnamAddress(street, '', newProvince));
  }

  function onWardChange(newWard: string) {
    setWard(newWard);
    onChange(composeVietnamAddress(street, newWard, province));
  }

  function onStreetChange(newStreet: string) {
    setStreet(newStreet);
    onChange(composeVietnamAddress(newStreet, ward, province));
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-mute mb-1">Tỉnh / Thành phố</label>
        <select
          value={province}
          onChange={(e) => onProvinceChange(e.target.value)}
          disabled={disabled}
          required={required}
          className="pin-input"
        >
          <option value="">-- Chọn tỉnh / thành phố --</option>
          {PROVINCES.map((p) => (
            <option key={p.province_code} value={p.province_name}>
              {p.province_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-mute mb-1">Phường / Xã</label>
        <select
          value={ward}
          onChange={(e) => onWardChange(e.target.value)}
          disabled={disabled || !province}
          required={required}
          className="pin-input"
        >
          <option value="">{province ? '-- Chọn phường / xã --' : '-- Chọn tỉnh / thành trước --'}</option>
          {wards.map((w) => (
            <option key={w.ward_code} value={w.ward_name}>
              {w.ward_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-mute mb-1">Số nhà, tên đường</label>
        <input
          type="text"
          value={street}
          onChange={(e) => onStreetChange(e.target.value)}
          placeholder="VD: 123 Nguyễn Huệ"
          maxLength={200}
          disabled={disabled}
          required={required}
          className="pin-input"
        />
      </div>
    </div>
  );
}

export { composeVietnamAddress, parseVietnamAddress, isCompleteVietnamAddress } from '@/lib/location/address';
