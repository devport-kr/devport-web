import type { RefObject } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bookmark, BookmarkX, ExternalLink, History, LoaderCircle } from 'lucide-react';
import { categoryConfig, type Category, type ReadHistory, type SavedArticle } from '../../types';
import { buttonClass } from '../form/formStyles';
import { getSourceLabel } from './accountMeta';
import SourceMark from './SourceMark';

export type ActivityItem = SavedArticle | ReadHistory;

const DAY_MS = 24 * 60 * 60 * 1000;

const getTimestamp = (item: ActivityItem) => ('savedAt' in item ? item.savedAt : item.readAt);

const formatTimeAgo = (dateString: string) => {
  const hours = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60));

  if (hours < 1) return '방금 전';
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}주 전`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}개월 전`;
  return `${Math.floor(days / 365)}년 전`;
};

// Read history is grouped by how many calendar days ago it was read
const getDayGroup = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const days = Math.round(
    (new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() -
      new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()) /
      DAY_MS
  );

  if (days <= 0) return '오늘';
  if (days === 1) return '어제';
  if (days < 7) return '최근 7일';
  if (days < 30) return '최근 30일';
  return '이전';
};

const groupByDay = (items: ActivityItem[]) =>
  items.reduce<{ label: string; items: ActivityItem[] }[]>((groups, item) => {
    const label = getDayGroup(getTimestamp(item));
    const last = groups[groups.length - 1];
    if (last?.label === label) {
      last.items.push(item);
    } else {
      groups.push({ label, items: [item] });
    }
    return groups;
  }, []);

const listCardClass = 'overflow-hidden rounded-xl border border-surface-border bg-surface-card/60';

const iconButtonClass =
  'relative z-10 flex h-8 w-8 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-white/[0.06] hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50';

const emptyStates = {
  saved: {
    Icon: Bookmark,
    title: '저장한 아티클이 없어요',
    description: '관심 있는 아티클에서 북마크 버튼을 누르면 이곳에 모아둘 수 있어요.',
  },
  history: {
    Icon: History,
    title: '아직 읽은 아티클이 없어요',
    description: '아티클 상세 페이지를 열면 읽은 기록이 자동으로 남아요.',
  },
};

interface ActivityListProps {
  variant: 'saved' | 'history';
  items: ActivityItem[];
  isLoading: boolean;
  isLoadingMore: boolean;
  /** Shown once more than one page has been loaded and nothing is left */
  showEndMessage: boolean;
  sentinelRef: RefObject<HTMLDivElement | null>;
  onUnsave?: (articleId: string) => void;
}

/** Saved articles or read history as one list card, with skeleton and empty states. */
export default function ActivityList({
  variant,
  items,
  isLoading,
  isLoadingMore,
  showEndMessage,
  sentinelRef,
  onUnsave,
}: ActivityListProps) {
  if (isLoading) {
    return (
      <ul aria-busy className={`${listCardClass} divide-y divide-surface-border/70`}>
        {Array.from({ length: 4 }, (_, index) => (
          <li key={index} className="flex items-start gap-4 px-4 py-4 sm:px-5">
            <span className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-surface-hover" />
            <div className="flex-1 space-y-2.5 pt-1">
              <div className="h-3.5 w-4/5 animate-pulse rounded bg-surface-hover" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-surface-hover/60" />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (items.length === 0) {
    const { Icon, title, description } = emptyStates[variant];
    return (
      <div className="flex flex-col items-center rounded-xl border border-dashed border-surface-border px-6 py-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-surface-border bg-surface-elevated text-text-muted">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <h3 className="mt-4 text-[15px] font-semibold text-text-primary">{title}</h3>
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-text-muted break-keep">{description}</p>
        <Link to="/" className={`${buttonClass('secondary', 'sm')} mt-6`}>
          아티클 둘러보기
          <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
        </Link>
      </div>
    );
  }

  const groups = variant === 'history' ? groupByDay(items) : [{ label: null, items }];

  return (
    <div>
      <div className={listCardClass}>
        {groups.map((group) => (
          <div key={group.label ?? 'all'} className="border-t border-surface-border/70 first:border-t-0">
            {group.label && (
              <p className="border-b border-surface-border/70 bg-white/[0.015] px-4 py-2 text-xs font-medium text-text-muted sm:px-5">
                {group.label}
              </p>
            )}
            <ul className="divide-y divide-surface-border/70">
              {group.items.map((item) => (
                <ActivityRow key={item.articleId} item={item} variant={variant} onUnsave={onUnsave} />
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Infinite Scroll Trigger */}
      <div ref={sentinelRef} className="h-10" />

      {isLoadingMore && (
        <div className="flex justify-center pb-6">
          <LoaderCircle className="h-5 w-5 animate-spin text-text-muted" />
        </div>
      )}

      {showEndMessage && <p className="pb-6 text-center text-xs text-text-muted">모든 항목을 확인했습니다</p>}
    </div>
  );
}

function ActivityRow({
  item,
  variant,
  onUnsave,
}: {
  item: ActivityItem;
  variant: ActivityListProps['variant'];
  onUnsave?: (articleId: string) => void;
}) {
  const category = categoryConfig[item.category as Category]?.label ?? item.category;
  const timeAgo = formatTimeAgo(getTimestamp(item));

  return (
    <li className="group relative flex items-start gap-4 px-4 py-4 transition-colors hover:bg-white/[0.025] sm:px-5">
      <SourceMark source={item.source} />

      <div className="min-w-0 flex-1">
        {/* The link's ::after covers the row so the whole row opens the article */}
        <Link
          to={`/article/${item.articleId}`}
          className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:rounded-lg focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-accent/50"
        >
          <h3 className="line-clamp-2 text-[15px] font-medium leading-snug text-text-primary transition-colors group-hover:text-accent-light break-keep">
            {item.summaryKoTitle}
          </h3>
        </Link>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-text-muted">
          <span className="font-medium text-text-secondary">{getSourceLabel(item.source)}</span>
          <span aria-hidden>·</span>
          <span>{category}</span>
          <span aria-hidden>·</span>
          <span>{variant === 'saved' ? `${timeAgo} 저장` : timeAgo}</span>
        </p>
      </div>

      <div className="-mr-1.5 flex shrink-0 items-center gap-0.5">
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          aria-label="원문 보기"
          title="원문 보기"
          className={iconButtonClass}
        >
          <ExternalLink className="h-4 w-4" strokeWidth={1.75} />
        </a>
        {onUnsave && (
          <button
            type="button"
            onClick={() => onUnsave(item.articleId)}
            aria-label="저장 취소"
            title="저장 취소"
            className={`${iconButtonClass} hover:!text-red-400`}
          >
            <BookmarkX className="h-4 w-4" strokeWidth={1.75} />
          </button>
        )}
      </div>
    </li>
  );
}
