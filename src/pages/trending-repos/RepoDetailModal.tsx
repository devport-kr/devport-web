import { useEffect, useRef, useState } from 'react';
import WikiMarkdownRenderer from '../../components/wiki/WikiMarkdownRenderer';
import GitHubIcon from '../../components/icons/GitHubIcon';
import StarIcon from '../../components/icons/StarIcon';
import ForkIcon from '../../components/icons/ForkIcon';
import { categoryConfig } from '../../types';
import type { GitRepo } from '../../types';
import { displayTitle, formatCount, languageColors, ownerAvatar, repoMainImage, withoutImage } from './repoDisplay';

interface RepoDetailModalProps {
  repo: GitRepo;
  rank: number;
  onClose: () => void;
}

export default function RepoDetailModal({ repo, rank, onClose }: RepoDetailModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const main = repoMainImage(repo);
  const [heroFailed, setHeroFailed] = useState(false);
  const showHero = main.kind === 'image' && !heroFailed;
  const body = repo.summaryKoBody
    ? (showHero ? withoutImage(repo.summaryKoBody, main.src) : repo.summaryKoBody)
    : repo.description ?? '';
  const titleId = `repo-${repo.id}-title`;

  // Escape closes; the page behind doesn't scroll while the dialog is open
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm sm:px-4 sm:py-10 animate-menu-in"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-3xl min-h-full sm:min-h-0 overflow-hidden bg-surface sm:rounded-2xl sm:border sm:border-surface-border/60 shadow-menu"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-surface/80 text-text-secondary backdrop-blur hover:text-text-primary hover:bg-surface-elevated transition-colors"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {showHero && (
          <div className="border-b border-surface-border/60 bg-surface-elevated">
            <img
              src={main.src}
              alt=""
              onError={() => setHeroFailed(true)}
              className="mx-auto max-h-80 w-full object-contain"
            />
          </div>
        )}

        <div className="px-5 sm:px-8 pt-7 pb-8">
          <header className="mb-6">
            <div className="flex items-center gap-2 mb-3 text-xs">
              <span className="font-mono text-accent">#{String(rank).padStart(2, '0')}</span>
              {categoryConfig[repo.category] && (
                <>
                  <span className="text-text-muted">·</span>
                  <span className="font-medium text-accent">{categoryConfig[repo.category].label}</span>
                </>
              )}
            </div>
            <div className="flex items-start gap-3">
              {!showHero && (
                <img src={ownerAvatar(repo)} alt="" className="mt-1 h-10 w-10 shrink-0 rounded-xl border border-surface-border/60" />
              )}
              <div className="min-w-0">
                <h2 id={titleId} className="text-2xl font-semibold leading-snug text-text-primary">
                  {displayTitle(repo)}
                </h2>
                <p className="mt-1 font-mono text-sm text-text-muted truncate">{repo.fullName}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-text-muted">
              {repo.language && (
                <span className="flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: languageColors[repo.language] || languageColors.default }}
                  />
                  {repo.language}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <StarIcon className="h-4 w-4" />
                {formatCount(repo.stars)}
              </span>
              <span className="flex items-center gap-1.5">
                <ForkIcon className="h-4 w-4" />
                {formatCount(repo.forks)}
              </span>
              {repo.starsThisWeek > 0 && (
                <span className="text-accent">이번 주 +{formatCount(repo.starsThisWeek)}</span>
              )}
            </div>
          </header>

          <div className="border-t border-surface-border/60 pt-6">
            {body ? (
              <WikiMarkdownRenderer content={body} headingIdPrefix={`repo-${repo.id}`} />
            ) : (
              <p className="text-text-secondary">소개글이 아직 없습니다.</p>
            )}
          </div>

          <div className="mt-8 flex justify-end">
            <a
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-light transition-colors"
            >
              <GitHubIcon className="h-4 w-4" />
              GitHub에서 보기
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
