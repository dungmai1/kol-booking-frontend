import type { BookingResponse } from '@/lib/api/types';

/** Label for the brand party on a booking (uses denormalized name when API provides it). */
export function bookingBrandLabel(booking: Pick<BookingResponse, 'brandProfileId' | 'brandCompanyName'>): string {
  const name = booking.brandCompanyName?.trim();
  return name || `Brand #${booking.brandProfileId}`;
}

/** Label for the KOL party on a booking (uses denormalized name when API provides it). */
export function bookingKolLabel(booking: Pick<BookingResponse, 'kolProfileId' | 'kolDisplayName'>): string {
  const name = booking.kolDisplayName?.trim();
  return name || `KOL #${booking.kolProfileId}`;
}
