import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { LegalDocumentKey } from '../content/legalDocuments';
import { legalDocuments } from '../content/legalDocuments';
import LegalDocumentContent from './LegalDocumentContent';

interface LegalDocumentModalProps {
  documentKey: LegalDocumentKey | null;
  onClose: () => void;
}

export default function LegalDocumentModal({
  documentKey,
  onClose,
}: LegalDocumentModalProps) {
  useEffect(() => {
    if (!documentKey) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [documentKey, onClose]);

  if (!documentKey) {
    return null;
  }

  const document = legalDocuments[documentKey];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-surface-border bg-[#0f1419] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-surface-border px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">
              {document.title}
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              최종 개정일: {document.updatedAt}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-surface-border p-2 text-text-muted transition-colors hover:text-text-primary"
            aria-label="약관 닫기"
          >
            <X size={18} />
          </button>
        </div>

        <div className="scrollbar-minimal overflow-y-auto px-6 py-5">
          <LegalDocumentContent content={document.content} />
        </div>
      </div>
    </div>
  );
}
