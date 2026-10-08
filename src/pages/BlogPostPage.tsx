import { Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { formatPostDate, getBlogPost } from '../content/blogPosts';
import { remarkPlugins } from '../lib/markdown';
import { SITE_URL, usePageMeta } from '../lib/seo';

function BackToBlog() {
  return (
    <Link
      to="/blog"
      className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors mb-10"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      블로그
    </Link>
  );
}

export default function BlogPostPage() {
  const { slug = '' } = useParams();
  const post = getBlogPost(slug);
  usePageMeta({
    title: post?.title ?? '블로그',
    description: post?.excerpt,
    type: post ? 'article' : 'website',
    noindex: !post,
    jsonLd: post
      ? {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.excerpt,
          inLanguage: 'ko-KR',
          datePublished: post.date || undefined,
          mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
          author: { '@type': 'Organization', name: 'devport', url: SITE_URL },
          publisher: { '@id': `${SITE_URL}/#organization` },
        }
      : undefined,
  });

  return (
    <div className="min-h-screen bg-glow">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-16">
        <BackToBlog />

        {post ? (
          <article>
            <header className="mb-10 pb-8 border-b border-surface-border/70">
              {post.date && (
                <time dateTime={post.date} className="text-sm text-text-muted">
                  {formatPostDate(post.date)}
                </time>
              )}
              <h1 className="mt-3 text-3xl md:text-4xl font-semibold text-text-primary leading-tight break-keep">
                {post.title}
              </h1>
            </header>

            <div className="wiki-markdown blog-markdown">
              <ReactMarkdown
                remarkPlugins={remarkPlugins}
                components={{
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noreferrer" className="wiki-markdown-link">
                      {children}
                    </a>
                  ),
                }}
              >
                {post.content}
              </ReactMarkdown>
            </div>
          </article>
        ) : (
          <div className="rounded-2xl border border-surface-border bg-surface-card/60 px-6 py-16 text-center">
            <p className="text-text-secondary">글을 찾을 수 없습니다.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
