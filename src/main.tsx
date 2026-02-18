import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import { registerAuthInterceptors } from './lib/http/authRefresh'

// Register auth interceptors (token attach + refresh/retry) on the shared HTTP client.
// Must be called before any API requests are made.
registerAuthInterceptors();
import { AuthProvider } from './contexts/AuthContext'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import OAuth2RedirectPage from './pages/OAuth2RedirectPage'
import TermsPage from './pages/TermsPage'
import PrivacyPage from './pages/PrivacyPage'
import LLMRankingsPage from './pages/LLMRankingsPage'
import ArticleDetailPage from './pages/ArticleDetailPage'
import MyPage from './pages/MyPage'
import AdminPage from './pages/AdminPage'
import SearchResultsPage from './pages/SearchResultsPage'
import PortsPage from './pages/PortsPage'
import WikiPage from './pages/WikiPage'
import WikiDraftsPage from './pages/wiki-admin/WikiDraftsPage'
import ProtectedAdminRoute from './components/ProtectedAdminRoute'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
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
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/ports" element={<PortsPage />} />
          <Route path="/ports/:portNumber" element={<PortsPage />} />
          <Route path="/ports/:portNumber/:projectExternalId" element={<PortsPage />} />
          <Route path="/wiki" element={<WikiPage />} />
          <Route path="/wiki/:domain" element={<WikiPage />} />
          <Route path="/wiki/:domain/:projectExternalId" element={<WikiPage />} />
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
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
