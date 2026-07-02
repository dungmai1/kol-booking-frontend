import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildApplicationMessage,
  canSubmitApplication,
  shouldShowApplicantDocumentUpload,
} from './application-documents.ts';

test('hides applicant document upload for campaigns without brand attachment', () => {
  assert.equal(shouldShowApplicantDocumentUpload(null), false);
  assert.equal(shouldShowApplicantDocumentUpload(''), false);
  assert.equal(shouldShowApplicantDocumentUpload('   '), false);
});

test('shows applicant document upload only when brand attached campaign documents', () => {
  assert.equal(shouldShowApplicantDocumentUpload('/uploads/brief.pdf'), true);
});

test('keeps applicant documents optional even when the upload is shown', () => {
  assert.equal(
    canSubmitApplication({
      uploadingApplicantDocument: false,
      applicantDocumentUrl: '',
    }),
    true,
  );
});

test('blocks submission while applicant document upload is still in progress', () => {
  assert.equal(
    canSubmitApplication({
      uploadingApplicantDocument: true,
      applicantDocumentUrl: '',
    }),
    false,
  );
});

test('adds the applicant document line only when a document was uploaded', () => {
  assert.equal(buildApplicationMessage({ applicantDocumentUrl: '', note: 'Xin chao brand' }), 'Xin chao brand');
  assert.equal(
    buildApplicationMessage({ applicantDocumentUrl: '/uploads/a.pdf', note: 'Xin chao brand' }),
    'Tài liệu đính kèm: /uploads/a.pdf\n\nLời nhắn: Xin chao brand',
  );
});
