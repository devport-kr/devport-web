import privacyPolicyMarkdown from '../../legal/privacy-policy-261006.md?raw';
import termsOfServiceMarkdown from '../../legal/terms-of-service-260324.md?raw';

export const CURRENT_TERMS_VERSION = '2026-10-06';

export const legalDocuments = {
  terms: {
    title: '이용약관',
    updatedAt: '2026년 3월 24일',
    content: termsOfServiceMarkdown,
  },
  privacy: {
    title: '개인정보 처리방침',
    updatedAt: '2026년 10월 6일',
    content: privacyPolicyMarkdown,
  },
} as const;

export type LegalDocumentKey = keyof typeof legalDocuments;
