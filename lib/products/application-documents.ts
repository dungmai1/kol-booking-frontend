export function shouldShowApplicantDocumentUpload(campaignAttachmentUrl: string | null | undefined): boolean {
  return Boolean(campaignAttachmentUrl?.trim());
}

export interface ApplicationDocumentSubmissionState {
  uploadingApplicantDocument: boolean;
  applicantDocumentUrl: string;
}

export function canSubmitApplication({ uploadingApplicantDocument }: ApplicationDocumentSubmissionState): boolean {
  return !uploadingApplicantDocument;
}

export function buildApplicationMessage({
  applicantDocumentUrl,
  note,
}: {
  applicantDocumentUrl: string | null | undefined;
  note: string;
}): string {
  const cleanDocumentUrl = applicantDocumentUrl?.trim() ?? '';
  const cleanNote = note.trim();

  if (!cleanDocumentUrl) return cleanNote;

  return [
    `Tài liệu đính kèm: ${cleanDocumentUrl}`,
    ...(cleanNote ? ['', `Lời nhắn: ${cleanNote}`] : []),
  ].join('\n');
}
