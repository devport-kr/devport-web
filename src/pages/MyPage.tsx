import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Bookmark, CalendarDays, History, Mail, UserRound, type LucideIcon } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Avatar from '../components/Avatar';
import NewsletterPanel from '../components/newsletter/NewsletterPanel';
import ActivityList, { type ActivityItem } from '../components/mypage/ActivityList';
import AccountSettings from '../components/mypage/AccountSettings';
import { getAuthProviderMeta } from '../components/mypage/accountMeta';
import { menuItemClasses } from '../components/navMenuStyles';
import { getSavedArticles, getReadHistory, unsaveArticle } from '../services/me/meService';
import { useAuth } from '../contexts/AuthContext';

type TabType = 'saved' | 'history' | 'profile' | 'newsletter';

const PAGE_SIZE = 20;

const TABS: { id: TabType; label: string; description: string; Icon: LucideIcon }[] = [
  { id: 'saved', label: '저장한 아티클', description: '북마크한 아티클을 한곳에서 모아보세요.', Icon: Bookmark },
  { id: 'history', label: '읽은 기록', description: '최근에 읽은 아티클을 날짜별로 확인할 수 있어요.', Icon: History },
  { id: 'profile', label: '계정 설정', description: '프로필과 로그인 정보, 비밀번호를 관리합니다.', Icon: UserRound },
  { id: 'newsletter', label: '뉴스레터', description: '개발 트렌드와 devport 소식을 이메일로 받아보세요.', Icon: Mail },
];

const parseTab = (value: string | null): TabType =>
  TABS.some(({ id }) => id === value) ? (value as TabType) : 'saved';

const fetchPage = (tab: TabType, page: number) =>
  tab === 'saved' ? getSavedArticles(page, PAGE_SIZE) : getReadHistory(page, PAGE_SIZE);

export default function MyPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: isAuthLoading, refreshUser } = useAuth();
  // The tab lives in the URL so links like /mypage?tab=newsletter open it directly.
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = parseTab(searchParams.get('tab'));
  const setActiveTab = (tab: TabType) => {
    setSearchParams(tab === 'saved' ? {} : { tab }, { replace: true });
  };
  const isListTab = activeTab === 'saved' || activeTab === 'history';

  const [items, setItems] = useState<ActivityItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!isListTab) {
      setIsInitialLoading(false);
      return;
    }

    // Ignore a response that lands after the user already switched tabs
    let cancelled = false;
    setIsInitialLoading(true);
    setCurrentPage(0);
    setItems([]);
    setHasMore(true);

    fetchPage(activeTab, 0)
      .then((data) => {
        if (cancelled) return;
        setItems(data.content);
        setTotalCount(data.totalElements);
        setHasMore(data.hasMore);
      })
      .catch((error) => console.error('Failed to load data:', error))
      .finally(() => {
        if (!cancelled) setIsInitialLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, isListTab]);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore || !isListTab) return;

    setIsLoading(true);
    try {
      const nextPage = currentPage + 1;
      const data = await fetchPage(activeTab, nextPage);
      setItems((prev) => [...prev, ...data.content]);
      setHasMore(data.hasMore);
      setCurrentPage(nextPage);
    } catch (error) {
      console.error('Failed to load more:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, currentPage, activeTab, isListTab]);

  useEffect(() => {
    if (isInitialLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoading, loadMore, isInitialLoading]);

  const handleUnsave = async (articleId: string) => {
    try {
      await unsaveArticle(articleId);
      setItems((prev) => prev.filter((article) => article.articleId !== articleId));
      setTotalCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to unsave article:', error);
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  const tab = TABS.find(({ id }) => id === activeTab)!;
  const provider = getAuthProviderMeta(user.authProvider);
  const joinedAt = new Date(user.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });

  return (
    <div className="min-h-screen bg-glow">
      <Navbar />

      <main className="mx-auto max-w-5xl px-6 pb-8 pt-10">
        {/* Profile header */}
        <section className="flex items-center gap-4 border-b border-surface-border/70 pb-8 sm:gap-5">
          <Avatar
            src={user.profileImageUrl}
            name={user.name}
            className="h-14 w-14 text-xl ring-4 ring-white/[0.04] sm:h-16 sm:w-16 sm:text-2xl"
          />
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight text-text-primary sm:text-2xl">{user.name}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-text-muted">
              {user.username && <span>@{user.username}</span>}
              <span className="inline-flex items-center gap-1.5">
                <provider.Icon className="h-3.5 w-3.5" />
                {provider.label} 계정
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.75} />
                {joinedAt} 가입
              </span>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:gap-10">
          {/* Section nav: a scrollable row on small screens, a sticky sidebar on large ones */}
          <nav aria-label="마이페이지 메뉴" className="-mx-6 overflow-x-auto px-6 scrollbar-hide lg:mx-0 lg:overflow-visible lg:px-0">
            <ul className="flex gap-1 lg:sticky lg:top-24 lg:flex-col">
              {TABS.map(({ id, label, Icon }) => {
                const isActive = id === activeTab;
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => setActiveTab(id)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`${menuItemClasses(isActive)} w-full gap-2.5 whitespace-nowrap px-3 py-2 ${isActive ? 'font-medium' : ''}`}
                    >
                      <Icon
                        className={`h-4 w-4 ${isActive ? 'text-accent-light' : 'text-text-muted'}`}
                        strokeWidth={1.75}
                      />
                      {label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <section className="min-w-0">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-text-primary">{tab.label}</h2>
                <p className="mt-1 text-sm text-text-muted break-keep">{tab.description}</p>
              </div>
              {isListTab && !isInitialLoading && totalCount > 0 && (
                <span className="shrink-0 rounded-full border border-surface-border bg-surface-elevated px-2.5 py-0.5 text-xs tabular-nums text-text-secondary">
                  {totalCount.toLocaleString()}개
                </span>
              )}
            </div>

            {activeTab === 'newsletter' ? (
              <NewsletterPanel />
            ) : activeTab === 'profile' ? (
              <AccountSettings user={user} onProfileUpdated={refreshUser} />
            ) : (
              <ActivityList
                variant={activeTab}
                items={items}
                isLoading={isInitialLoading}
                isLoadingMore={isLoading}
                showEndMessage={!hasMore && items.length > PAGE_SIZE}
                sentinelRef={observerTarget}
                onUnsave={activeTab === 'saved' ? handleUnsave : undefined}
              />
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
