import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-glow">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-16">
        <header className="mb-12">
          <h1 className="text-3xl font-semibold text-text-primary mb-3">블로그</h1>
          <p className="text-text-muted">devport를 만들며 배우고 고민한 것들을 기록합니다.</p>
        </header>

        {/* Empty state until posts are wired up */}
        <div className="rounded-2xl border border-surface-border bg-surface-card/60 px-6 py-16 text-center">
          <p className="text-text-secondary">첫 글을 준비하고 있습니다.</p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
