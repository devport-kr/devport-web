import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { usePageMeta } from '../lib/seo';

export default function NotFoundPage() {
  // S3 answers every path with 200, so noindex is what keeps these out of search
  usePageMeta({ title: '페이지를 찾을 수 없습니다', noindex: true });

  return (
    <div className="min-h-screen bg-glow">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-24 text-center">
        <h1 className="text-4xl font-semibold text-text-primary tracking-tight mb-4">404</h1>
        <p className="text-text-secondary leading-relaxed mb-10">요청한 페이지를 찾을 수 없습니다.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-accent hover:bg-accent-light text-white rounded-lg transition-colors"
        >
          홈으로 돌아가기
        </Link>
      </main>

      <Footer />
    </div>
  );
}
