import type { ReactNode } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedAdminRouteProps {
  children: ReactNode;
}

const ProtectedAdminRoute = ({ children }: ProtectedAdminRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-surface-border border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-medium text-red-400 mb-2">접근 권한 없음</h1>
          <p className="text-text-muted mb-6">관리자 권한이 필요합니다.</p>
          <Link to="/" className="text-sm text-accent hover:text-accent-light transition-colors">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedAdminRoute;
