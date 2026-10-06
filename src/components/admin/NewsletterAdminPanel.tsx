import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  adminGetNewsletterIssues,
  adminGetNewsletterStats,
  adminSendNewsletter,
  adminSendNewsletterTest,
  type NewsletterIssue,
  type NewsletterIssueStatus,
  type NewsletterStats,
  type SpringPage,
} from '../../services/admin/adminService';
import { parseApiError } from '../../lib/http/apiError';

const SUBJECT_MAX_LENGTH = 200;
const CONTENT_MAX_LENGTH = 50000;
const ISSUES_PAGE_SIZE = 20;
// The backend sends 50 mails per batch with ~1s between batches.
const SENDING_POLL_INTERVAL_MS = 3000;

const statusStyles: Record<NewsletterIssueStatus, { label: string; className: string }> = {
  SENDING: { label: '발송 중', className: 'bg-accent/10 text-accent' },
  SENT: { label: '발송 완료', className: 'bg-green-500/10 text-green-400' },
  PARTIALLY_FAILED: { label: '일부 실패', className: 'bg-amber-500/10 text-amber-400' },
  FAILED: { label: '실패', className: 'bg-red-500/10 text-red-400' },
};

const formatDateTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' }) : '-';

const errorText = (error: unknown) => {
  const { message } = parseApiError(error);
  return message || (error instanceof Error ? error.message : 'unknown error');
};

interface NewsletterAdminPanelProps {
  inputClass: string;
  labelClass: string;
  btnPrimary: string;
  btnSecondary: string;
  showMessage: (type: 'success' | 'error', text: string) => void;
}

export default function NewsletterAdminPanel({
  inputClass,
  labelClass,
  btnPrimary,
  btnSecondary,
  showMessage,
}: NewsletterAdminPanelProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<NewsletterStats | null>(null);
  const [issues, setIssues] = useState<SpringPage<NewsletterIssue> | null>(null);
  const [issuePage, setIssuePage] = useState(0);
  const [issuesLoading, setIssuesLoading] = useState(true);
  const [form, setForm] = useState({ subject: '', content: '' });
  const [testEmail, setTestEmail] = useState(user?.email ?? '');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const data = await adminGetNewsletterStats();
      setStats(data);
      return data;
    } catch (error) {
      showMessage('error', `Failed to load newsletter stats: ${errorText(error)}`);
      return null;
    }
  }, [showMessage]);

  const loadIssues = useCallback(async (page: number) => {
    try {
      setIssues(await adminGetNewsletterIssues(page, ISSUES_PAGE_SIZE));
    } catch (error) {
      showMessage('error', `Failed to load newsletter issues: ${errorText(error)}`);
    } finally {
      setIssuesLoading(false);
    }
  }, [showMessage]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadIssues(issuePage);
  }, [issuePage, loadIssues]);

  // While any issue is still sending, keep refreshing the history to show progress.
  const hasSendingIssue = issues?.content.some((issue) => issue.status === 'SENDING') ?? false;
  useEffect(() => {
    if (!hasSendingIssue) return;
    const timer = setTimeout(() => loadIssues(issuePage), SENDING_POLL_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [hasSendingIssue, issues, issuePage, loadIssues]);

  const hasContent = form.subject.trim() !== '' && form.content.trim() !== '';

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasContent || !testEmail.trim()) return;

    setIsSendingTest(true);
    try {
      await adminSendNewsletterTest({ ...form, email: testEmail.trim() });
      showMessage('success', `테스트 메일을 ${testEmail.trim()}(으)로 보냈습니다.`);
    } catch (error) {
      showMessage('error', `테스트 발송 실패: ${errorText(error)}`);
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleSendAll = async () => {
    if (!hasContent) return;

    // Re-read the count so the confirm dialog shows the real number of recipients.
    const latestStats = await loadStats();
    if (!latestStats) return;
    if (latestStats.activeCount === 0) {
      showMessage('error', '활성 구독자가 없습니다.');
      return;
    }
    if (!window.confirm(`활성 구독자 ${latestStats.activeCount}명에게 발송합니다. 되돌릴 수 없습니다.`)) {
      return;
    }

    setIsSending(true);
    try {
      await adminSendNewsletter(form);
      showMessage('success', '발송을 시작했습니다. 진행 상황은 발송 이력에서 확인하세요.');
      setForm({ subject: '', content: '' });
      if (issuePage === 0) {
        await loadIssues(0);
      } else {
        setIssuePage(0);
      }
    } catch (error) {
      if (parseApiError(error).status === 429) {
        showMessage('error', '이미 발송 중인 뉴스레터가 있습니다. 완료된 뒤 다시 시도하세요.');
      } else {
        showMessage('error', `발송 실패: ${errorText(error)}`);
      }
    } finally {
      setIsSending(false);
    }
  };

  const totalPages = issues?.totalPages ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-text-primary">Newsletter</h2>
          <p className="text-xs text-text-muted mt-0.5">구독자에게 뉴스레터를 작성하고 발송합니다.</p>
        </div>
        <div className="flex gap-2">
          <div className="px-3 py-2 rounded-lg border border-surface-border bg-surface-elevated/40">
            <div className={labelClass}>활성 구독자</div>
            <div className="text-sm font-semibold text-text-primary">{stats ? `${stats.activeCount.toLocaleString()}명` : '-'}</div>
          </div>
          <div className="px-3 py-2 rounded-lg border border-surface-border bg-surface-elevated/40">
            <div className={labelClass}>인증 대기</div>
            <div className="text-sm font-semibold text-text-primary">{stats ? `${stats.pendingCount.toLocaleString()}명` : '-'}</div>
          </div>
        </div>
      </div>

      {/* ── Compose ── */}
      <div className="max-w-3xl space-y-4">
        <div>
          <label className={labelClass}>제목</label>
          <input
            type="text"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            maxLength={SUBJECT_MAX_LENGTH}
            className={inputClass}
            placeholder="뉴스레터 제목"
          />
          <p className="mt-1 text-[11px] text-text-muted">
            광고성 내용이 들어가면 제목을 <span className="font-mono">(광고)</span>로 시작해야 합니다 (정보통신망법).
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className={labelClass}>본문</label>
            <span className="text-[10px] text-text-muted font-mono">
              {form.content.length.toLocaleString()} / {CONTENT_MAX_LENGTH.toLocaleString()}
            </span>
          </div>
          <textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            maxLength={CONTENT_MAX_LENGTH}
            rows={16}
            className={`${inputClass} leading-relaxed`}
            placeholder="본문 (일반 텍스트)"
          />
          <p className="mt-1 text-[11px] text-text-muted">
            URL은 자동으로 링크가 되고 줄바꿈은 유지됩니다. 수신거부 안내는 자동으로 붙습니다.
          </p>
        </div>

        <form onSubmit={handleSendTest} className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[14rem]">
            <label className={labelClass}>테스트 수신 이메일</label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className={inputClass}
              placeholder="you@example.com"
            />
          </div>
          <button
            type="submit"
            disabled={!hasContent || !testEmail.trim() || isSendingTest}
            className={`${btnSecondary} disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            {isSendingTest ? '발송 중...' : '테스트 발송'}
          </button>
        </form>
        <p className="text-[11px] text-text-muted">
          테스트 메일은 제목 앞에 [테스트]가 붙고, 메일 안의 수신거부 링크는 동작하지 않습니다.
        </p>

        <button
          type="button"
          onClick={handleSendAll}
          disabled={!hasContent || isSending || hasSendingIssue}
          className={`w-full ${btnPrimary} disabled:opacity-30 disabled:cursor-not-allowed`}
        >
          {isSending ? '발송 요청 중...' : hasSendingIssue ? '이전 뉴스레터 발송 중...' : '전체 발송'}
        </button>
      </div>

      {/* ── History ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-text-primary">발송 이력</h3>
          {issues && <span className="text-[10px] text-text-muted font-mono">{issues.totalElements} total</span>}
        </div>

        {issuesLoading ? (
          <div className="flex items-center justify-center py-16 text-text-muted text-sm">
            <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin mr-2" />
            Loading...
          </div>
        ) : !issues || issues.content.length === 0 ? (
          <div className="text-center py-16 text-text-muted text-sm">발송 이력이 없습니다</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border text-text-muted text-[10px] uppercase tracking-widest">
                  <th className="text-left py-2 pr-3 font-semibold">제목</th>
                  <th className="text-left py-2 px-2 w-20 font-semibold">상태</th>
                  <th className="text-right py-2 px-2 w-24 font-semibold">발송</th>
                  <th className="text-right py-2 px-2 w-14 font-semibold">실패</th>
                  <th className="text-right py-2 px-2 w-32 font-semibold">생성</th>
                  <th className="text-right py-2 pl-2 w-32 font-semibold">완료</th>
                </tr>
              </thead>
              <tbody>
                {issues.content.map((issue) => {
                  const status = statusStyles[issue.status];
                  return (
                    <tr key={issue.id} className="border-b border-surface-border/40">
                      <td className="py-2.5 pr-3 text-text-primary leading-snug">{issue.subject}</td>
                      <td className="py-2.5 px-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium whitespace-nowrap ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-right text-text-secondary font-mono text-xs whitespace-nowrap">
                        {issue.sentCount.toLocaleString()} / {issue.recipientCount.toLocaleString()}
                      </td>
                      <td className={`py-2.5 px-2 text-right font-mono text-xs ${issue.failedCount > 0 ? 'text-red-400' : 'text-text-muted'}`}>
                        {issue.failedCount.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-2 text-right text-text-muted text-xs whitespace-nowrap">{formatDateTime(issue.createdAt)}</td>
                      <td className="py-2.5 pl-2 text-right text-text-muted text-xs whitespace-nowrap">{formatDateTime(issue.completedAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-surface-border/40">
            <button
              onClick={() => setIssuePage((p) => Math.max(0, p - 1))}
              disabled={issuePage === 0}
              className={`${btnSecondary} text-xs ${issuePage === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              Prev
            </button>
            <span className="text-[10px] text-text-muted font-mono">
              {issuePage + 1} / {totalPages}
            </span>
            <button
              onClick={() => setIssuePage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={issuePage >= totalPages - 1}
              className={`${btnSecondary} text-xs ${issuePage >= totalPages - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
