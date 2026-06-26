import type { BookingResponse, CreateBookingRequest } from './types';

const createBookingPayloadWithAttachment: CreateBookingRequest = {
  kolProfileId: 1,
  campaignTitle: 'Launch campaign',
  campaignBrief: 'Detailed campaign brief with enough context for the creator.',
  deliverables: '1 TikTok video',
  budget: 5_000_000,
  startDate: '2026-07-01',
  endDate: '2026-07-10',
  attachmentUrl: '/uploads/brief.pdf',
};

const bookingResponseWithAttachment: BookingResponse = {
  id: 1,
  brandProfileId: 1,
  brandCompanyName: 'Brand',
  kolProfileId: 2,
  kolDisplayName: 'KOL',
  campaignTitle: createBookingPayloadWithAttachment.campaignTitle,
  campaignBrief: createBookingPayloadWithAttachment.campaignBrief,
  deliverables: createBookingPayloadWithAttachment.deliverables,
  budget: createBookingPayloadWithAttachment.budget,
  platformFeePercent: 10,
  platformFeeAmount: 500_000,
  kolNetAmount: 4_500_000,
  startDate: createBookingPayloadWithAttachment.startDate,
  endDate: createBookingPayloadWithAttachment.endDate,
  status: 'PENDING',
  rejectReason: null,
  cancelReason: null,
  revisionFeedback: null,
  revisionRequestedAt: null,
  invoiceUrl: null,
  attachmentUrl: createBookingPayloadWithAttachment.attachmentUrl ?? null,
  createdAt: '2026-06-26T00:00:00Z',
  updatedAt: '2026-06-26T00:00:00Z',
  submittedDeliverables: [],
};

void bookingResponseWithAttachment;
