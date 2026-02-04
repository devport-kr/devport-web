import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import OAuth2RedirectPage from './pages/OAuth2RedirectPage'
import TermsPage from './pages/TermsPage'
import PrivacyPage from './pages/PrivacyPage'
import BenchmarksExplanationPage from './pages/BenchmarksExplanationPage'
import ArticleDetailPage from './pages/ArticleDetailPage'
import MyPage from './pages/MyPage'
import AdminPage from './pages/AdminPage'
import SearchResultsPage from './pages/SearchResultsPage'
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
          <Route path="/benchmarks" element={<BenchmarksExplanationPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedAdminRoute>
                <AdminPage />
              </ProtectedAdminRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
