import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { blogPosts, formatPostDate } from '../content/blogPosts';
import { usePageMeta } from '../lib/seo';

export default function BlogPage() {
  usePageMeta({ title: '블로그', description: 'devport를 만들며 배우고 고민한 것들을 기록합니다.' });
  return (
    <div className="min-h-screen bg-glow">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-16">
        <header className="mb-12">
          <h1 className="text-3xl font-semibold text-text-primary mb-3">블로그</h1>
          <p className="text-text-muted">devport를 만들며 배우고 고민한 것들을 기록합니다.</p>
        </header>

        {blogPosts.length === 0 ? (
          <div className="rounded-2xl border border-surface-border bg-surface-card/60 px-6 py-16 text-center">
            <p className="text-text-secondary">첫 글을 준비하고 있습니다.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {blogPosts.map((post) => (
              <li key={post.slug}>
                <Link
                  to={`/blog/${post.slug}`}
                  className="group block rounded-2xl border border-surface-border bg-surface-card/60 px-6 py-6 transition-colors hover:border-accent/40 hover:bg-surface-card"
                >
                  {post.date && (
                    <time dateTime={post.date} className="text-sm text-text-muted">
                      {formatPostDate(post.date)}
                    </time>
                  )}
                  <h2 className="mt-2 text-xl font-semibold text-text-primary leading-snug break-keep transition-colors group-hover:text-accent">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="mt-3 text-sm leading-6 text-text-secondary break-keep line-clamp-2">{post.excerpt}</p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>

      <Footer />
    </div>
  );
}
