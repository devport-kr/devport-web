import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import { registerAuthInterceptors } from './lib/http/authRefresh'

// Register auth interceptors (token attach + refresh/retry) on the shared HTTP client.
// Must be called before any API requests are made.
registerAuthInterceptors();
import { AuthProvider } from './contexts/AuthContext'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'
import ProtectedAdminRoute from './components/ProtectedAdminRoute'
import PageFallback from './components/PageFallback'

// Pages load on demand so the home page does not download every route up front
const LoginPage = lazy(() => import('./pages/LoginPage'))
const SignupPage = lazy(() => import('./pages/SignupPage'))
const OAuth2RedirectPage = lazy(() => import('./pages/OAuth2RedirectPage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const LLMRankingsPage = lazy(() => import('./pages/LLMRankingsPage'))
const TrendingReposPage = lazy(() => import('./pages/TrendingReposPage'))
const ArticleDetailPage = lazy(() => import('./pages/ArticleDetailPage'))
const MyPage = lazy(() => import('./pages/MyPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const SearchResultsPage = lazy(() => import('./pages/SearchResultsPage'))
const PortsDirectoryPage = lazy(() => import('./pages/PortsDirectoryPage'))
const PortsProjectPage = lazy(() => import('./pages/PortsProjectPage'))
const PortsChatPage = lazy(() => import('./pages/PortsChatPage'))
const ProductMcpPage = lazy(() => import('./pages/ProductMcpPage'))
const BlogPage = lazy(() => import('./pages/BlogPage'))
const BlogPostPage = lazy(() => import('./pages/BlogPostPage'))
const NewsletterConfirmPage = lazy(() => import('./pages/NewsletterConfirmPage'))
const NewsletterUnsubscribePage = lazy(() => import('./pages/NewsletterUnsubscribePage'))
const WikiDraftsPage = lazy(() => import('./pages/wiki-admin/WikiDraftsPage'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/oauth2/redirect" element={<OAuth2RedirectPage />} />
            <Route path="/search" element={<SearchResultsPage />} />
            <Route path="/articles/:externalId" element={<ArticleDetailPage />} />
            <Route path="/article/:externalId" element={<ArticleDetailPage />} />
            <Route path="/mypage" element={<MyPage />} />
            <Route path="/llm-rankings" element={<LLMRankingsPage />} />
            <Route path="/trending-repos" element={<TrendingReposPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/ports" element={<PortsDirectoryPage />} />
            <Route path="/ports/chat" element={<PortsChatPage />} />
            <Route path="/ports/chat/*" element={<PortsChatPage />} />
            <Route path="/ports/*" element={<PortsProjectPage />} />
            <Route path="/products/mcp" element={<ProductMcpPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogPostPage />} />
            <Route path="/newsletter/confirm" element={<NewsletterConfirmPage />} />
            <Route path="/newsletter/unsubscribe" element={<NewsletterUnsubscribePage />} />
            <Route
              path="/admin"
              element={
                <ProtectedAdminRoute>
                  <AdminPage />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/wiki/projects/:projectId/drafts"
              element={
                <ProtectedAdminRoute>
                  <WikiDraftsPage />
                </ProtectedAdminRoute>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
