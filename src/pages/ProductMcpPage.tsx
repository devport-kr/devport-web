import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function ProductMcpPage() {
  return (
    <div className="min-h-screen bg-glow">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-24 text-center">
        <p className="text-sm font-medium text-accent mb-4">제품</p>
        <h1 className="text-4xl md:text-5xl font-semibold text-text-primary tracking-tight mb-6">
          DevPort MCP
        </h1>
        <p className="text-text-secondary leading-relaxed mb-10">
          제품 소개 페이지를 준비하고 있습니다. 곧 공개됩니다.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-accent hover:bg-accent-light text-white rounded-lg transition-colors"
        >
          Dev뉴스 보러 가기
        </Link>
      </main>

      <Footer />
    </div>
  );
}
