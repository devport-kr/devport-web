import { Link } from 'react-router-dom';
import LegalDocumentContent from '../components/LegalDocumentContent';
import { legalDocuments } from '../content/legalDocuments';

export default function PrivacyPage() {
  const document = legalDocuments.privacy;

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-12">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary mb-8 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
            홈으로
          </Link>
          <h1 className="text-3xl font-semibold text-text-primary mb-3">{document.title}</h1>
          <p className="text-sm text-text-muted">최종 수정일: {document.updatedAt}</p>
        </div>

        <div className="rounded-3xl border border-surface-border bg-surface-card/60 p-6">
          <LegalDocumentContent content={document.content} />
        </div>

        <div className="mt-12 text-center">
          <Link
            to="/terms"
            className="text-sm text-accent hover:text-accent-light transition-colors"
          >
            ← 이용약관 보기
          </Link>
        </div>
      </div>
    </div>
  );
}
