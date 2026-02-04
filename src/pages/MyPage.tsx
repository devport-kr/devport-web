import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { getSavedArticles, getReadHistory, unsaveArticle, updateProfile, changePassword } from '../services/api';
import type { SavedArticle, ReadHistory } from '../types';
import { useAuth } from '../contexts/AuthContext';

type TabType = 'saved' | 'history' | 'profile';

export default function MyPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('saved');
  const [savedArticles, setSavedArticles] = useState<SavedArticle[]>([]);
  const [readHistory, setReadHistory] = useState<ReadHistory[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    profileImageUrl: user?.profileImageUrl || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasSpecialChar: false,
    passwordsMatch: false,
  });
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        profileImageUrl: user.profileImageUrl || '',
      });
    }
  }, [user]);

  useEffect(() => {
    loadInitialData();
  }, [activeTab]);

  const loadInitialData = async () => {
    setIsInitialLoading(true);
    setCurrentPage(0);
    setSavedArticles([]);
    setReadHistory([]);
    setHasMore(true);

    try {
      if (activeTab === 'saved') {
        const data = await getSavedArticles(0, 20);
        setSavedArticles(data.content);
        setHasMore(data.hasMore);
      } else {
        const data = await getReadHistory(0, 20);
        setReadHistory(data.content);
        setHasMore(data.hasMore);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsInitialLoading(false);
    }
  };

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const nextPage = currentPage + 1;
      if (activeTab === 'saved') {
        const data = await getSavedArticles(nextPage, 20);
        setSavedArticles((prev) => [...prev, ...data.content]);
        setHasMore(data.hasMore);
      } else {
        const data = await getReadHistory(nextPage, 20);
        setReadHistory((prev) => [...prev, ...data.content]);
        setHasMore(data.hasMore);
      }
      setCurrentPage(nextPage);
    } catch (error) {
      console.error('Failed to load more:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, currentPage, activeTab]);

  useEffect(() => {
    if (isInitialLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoading, loadMore, isInitialLoading]);

  const handleUnsave = async (articleId: string) => {
    try {
      await unsaveArticle(articleId);
      setSavedArticles((prev) => prev.filter((article) => article.articleId !== articleId));
    } catch (error) {
      console.error('Failed to unsave article:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const hours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (hours < 1) return '방금 전';
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}일 전`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}주 전`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}개월 전`;
    const years = Math.floor(days / 365);
    return `${years}년 전`;
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
    if (profileErrors[name]) {
      setProfileErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    if (profileErrors[name]) {
      setProfileErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Real-time password validation
    if (name === 'newPassword') {
      setPasswordValidation((prev) => ({
        ...prev,
        minLength: value.length >= 8,
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(value),
        passwordsMatch: value === passwordData.confirmPassword && value.length > 0,
      }));
    }

    // Real-time confirm password validation
    if (name === 'confirmPassword') {
      setPasswordValidation((prev) => ({
        ...prev,
        passwordsMatch: value === passwordData.newPassword && value.length > 0,
      }));
    }
  };

  const handleSaveProfile = async () => {
    setProfileErrors({});
    setProfileSuccess(null);
    setIsSavingProfile(true);

    try {
      const updatedUser = await updateProfile({
        name: profileData.name,
        profileImageUrl: profileData.profileImageUrl || undefined,
      });

      setProfileSuccess('프로필이 성공적으로 업데이트되었습니다.');
      setIsEditingProfile(false);

      // Update local user data
      if (user) {
        Object.assign(user, updatedUser);
      }

      // Clear success message after 3 seconds
      setTimeout(() => setProfileSuccess(null), 3000);
    } catch (error: any) {
      console.error('Profile update error:', error);
      setProfileErrors({ general: '프로필 업데이트에 실패했습니다.' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErrors({});
    setProfileSuccess(null);

    // Validation
    const errors: Record<string, string> = {};
    if (!passwordData.currentPassword) {
      errors.currentPassword = '현재 비밀번호를 입력해주세요.';
    }
    if (!passwordData.newPassword) {
      errors.newPassword = '새 비밀번호를 입력해주세요.';
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = '비밀번호는 최소 8자 이상이어야 합니다.';
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword)) {
      errors.newPassword = '비밀번호는 최소 1개의 특수문자를 포함해야 합니다.';
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }

    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      return;
    }

    setIsSavingProfile(true);

    try {
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setProfileSuccess('비밀번호가 성공적으로 변경되었습니다.');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setPasswordValidation({
        minLength: false,
        hasSpecialChar: false,
        passwordsMatch: false,
      });

      // Clear success message after 3 seconds
      setTimeout(() => setProfileSuccess(null), 3000);
    } catch (error: any) {
      console.error('Password change error:', error);
      if (error.response?.status === 401) {
        setProfileErrors({ currentPassword: '현재 비밀번호가 올바르지 않습니다.' });
      } else if (error.response?.status === 400) {
        setProfileErrors({ general: 'OAuth 계정은 비밀번호를 변경할 수 없습니다.' });
      } else {
        setProfileErrors({ general: '비밀번호 변경에 실패했습니다.' });
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  const currentData = activeTab === 'saved' ? savedArticles : readHistory;
  const emptyMessage = activeTab === 'saved'
    ? '저장한 아티클이 없습니다.'
    : '읽은 아티클이 없습니다.';

  return (
    <div className="min-h-screen bg-glow">
      <Navbar />

      <div className="min-h-[calc(100vh-4rem)]">
        {/* Left Sidebar - Fixed */}
        <div className="fixed left-0 top-16 w-52 h-[calc(100vh-4rem)] z-40 hidden lg:block">
          <Sidebar />
        </div>

        {/* Main Content */}
        <main className="lg:ml-52 pt-8 pb-8 px-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-text-primary mb-2">마이페이지</h1>
              <p className="text-text-muted">
                {user?.name}님의 저장한 아티클과 읽은 기록을 확인하세요
              </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-8 border-b border-surface-border">
              <button
                onClick={() => setActiveTab('saved')}
                className={`px-6 py-3 font-medium transition-colors relative ${
                  activeTab === 'saved'
                    ? 'text-accent'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                저장한 아티클
                {activeTab === 'saved' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-3 font-medium transition-colors relative ${
                  activeTab === 'history'
                    ? 'text-accent'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                읽은 기록
                {activeTab === 'history' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-3 font-medium transition-colors relative ${
                  activeTab === 'profile'
                    ? 'text-accent'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                프로필 관리
                {activeTab === 'profile' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
                )}
              </button>
            </div>

            {/* Content */}
            {activeTab === 'profile' ? (
              <div className="space-y-6">
                {/* Success Message */}
                {profileSuccess && (
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <p className="text-sm text-green-400">{profileSuccess}</p>
                  </div>
                )}

                {/* Error Message */}
                {profileErrors.general && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-sm text-red-400">{profileErrors.general}</p>
                  </div>
                )}

                {/* Profile Information */}
                <div className="bg-surface-card border border-surface-border rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-text-primary">계정 정보</h3>
                    {!isEditingProfile && (
                      <button
                        onClick={() => setIsEditingProfile(true)}
                        className="px-4 py-2 bg-accent hover:bg-accent/90 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        수정
                      </button>
                    )}
                  </div>

                  <div className="space-y-6">
                    {/* Profile Image Preview */}
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        {profileData.profileImageUrl || user?.profileImageUrl ? (
                          <img
                            src={profileData.profileImageUrl || user?.profileImageUrl}
                            alt="Profile"
                            className="w-24 h-24 rounded-full object-cover border-2 border-surface-border"
                            onError={(e) => {
                              // Fallback to default avatar if image fails to load
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%236366f1"%3E%3Cpath d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/%3E%3C/svg%3E';
                            }}
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-accent/10 border-2 border-surface-border flex items-center justify-center">
                            <svg className="w-12 h-12 text-accent" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                            </svg>
                          </div>
                        )}
                        {isEditingProfile && (
                          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-accent rounded-full flex items-center justify-center border-2 border-surface-card">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-text-primary mb-1">{user?.name || '사용자'}</p>
                        <p className="text-xs text-text-muted">{user?.email || '이메일 미등록'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 mt-6">
                    {/* Username (readonly) */}
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        아이디
                      </label>
                      <input
                        type="text"
                        value={user?.username || '소셜 로그인'}
                        disabled
                        className="w-full px-4 py-2.5 bg-surface-elevated border border-surface-border rounded-xl text-text-muted cursor-not-allowed"
                      />
                    </div>

                    {/* Auth Provider (readonly) */}
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        로그인 방식
                      </label>
                      <input
                        type="text"
                        value={
                          user?.authProvider === 'local'
                            ? '이메일'
                            : user?.authProvider === 'github'
                            ? 'GitHub'
                            : user?.authProvider === 'google'
                            ? 'Google'
                            : 'Naver'
                        }
                        disabled
                        className="w-full px-4 py-2.5 bg-surface-elevated border border-surface-border rounded-xl text-text-muted cursor-not-allowed"
                      />
                    </div>

                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        이름
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={profileData.name}
                        onChange={handleProfileChange}
                        disabled={!isEditingProfile}
                        className={`w-full px-4 py-2.5 ${
                          isEditingProfile ? 'bg-surface-elevated' : 'bg-surface-elevated/50'
                        } border border-surface-border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors ${
                          !isEditingProfile && 'cursor-not-allowed'
                        }`}
                        placeholder="이름을 입력하세요"
                      />
                    </div>

                    {/* Email (Read-only) */}
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        이메일
                      </label>
                      <input
                        type="email"
                        value={user?.email || '미등록'}
                        disabled
                        className="w-full px-4 py-2.5 bg-surface-elevated/50 border border-surface-border rounded-xl text-text-muted cursor-not-allowed"
                      />
                      <p className="mt-1.5 text-xs text-text-muted">이메일은 변경할 수 없습니다.</p>
                    </div>

                    {/* Profile Image URL (only show when editing) */}
                    {isEditingProfile && (
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                          프로필 이미지 URL
                        </label>
                        <input
                          type="url"
                          name="profileImageUrl"
                          value={profileData.profileImageUrl}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-2.5 bg-surface-elevated border border-surface-border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
                          placeholder="https://example.com/avatar.jpg"
                        />
                        <p className="mt-1.5 text-xs text-text-muted">
                          이미지 URL을 입력하면 프로필 사진이 변경됩니다
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {isEditingProfile && (
                      <div className="flex gap-3 pt-4">
                        <button
                          onClick={handleSaveProfile}
                          disabled={isSavingProfile}
                          className="flex-1 px-5 py-2.5 bg-accent hover:bg-accent/90 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSavingProfile ? '저장 중...' : '저장'}
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingProfile(false);
                            setProfileData({
                              name: user?.name || '',
                              profileImageUrl: user?.profileImageUrl || '',
                            });
                            setProfileErrors({});
                          }}
                          disabled={isSavingProfile}
                          className="px-5 py-2.5 bg-surface-elevated hover:bg-surface-elevated/80 text-text-secondary text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          취소
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Password Change (Only for LOCAL users) */}
                {user?.authProvider === 'local' && (
                  <div className="bg-surface-card border border-surface-border rounded-xl p-6">
                    <h3 className="text-lg font-medium text-text-primary mb-6">비밀번호 변경</h3>

                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                          현재 비밀번호
                        </label>
                        <input
                          type="password"
                          name="currentPassword"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                          className={`w-full px-4 py-2.5 bg-surface-elevated border ${
                            profileErrors.currentPassword ? 'border-red-500' : 'border-surface-border'
                          } rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors`}
                          placeholder="현재 비밀번호를 입력하세요"
                        />
                        {profileErrors.currentPassword && (
                          <p className="mt-1.5 text-sm text-red-400">{profileErrors.currentPassword}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                          새 비밀번호
                        </label>
                        <input
                          type="password"
                          name="newPassword"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          className={`w-full px-4 py-2.5 bg-surface-elevated border ${
                            profileErrors.newPassword
                              ? 'border-red-500'
                              : passwordData.newPassword && passwordValidation.minLength && passwordValidation.hasSpecialChar
                              ? 'border-green-500'
                              : 'border-surface-border'
                          } rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors`}
                          placeholder="최소 8자, 특수문자 1개 이상"
                        />
                        {profileErrors.newPassword && (
                          <p className="mt-1.5 text-sm text-red-400">{profileErrors.newPassword}</p>
                        )}
                        {/* Password Requirements */}
                        {passwordData.newPassword && !profileErrors.newPassword && (
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center gap-2 text-xs">
                              {passwordValidation.minLength ? (
                                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              )}
                              <span className={passwordValidation.minLength ? 'text-green-400' : 'text-text-muted'}>
                                최소 8자 이상
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              {passwordValidation.hasSpecialChar ? (
                                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              )}
                              <span className={passwordValidation.hasSpecialChar ? 'text-green-400' : 'text-text-muted'}>
                                특수문자 1개 이상 (!@#$%^&* 등)
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                          새 비밀번호 확인
                        </label>
                        <div className="relative">
                          <input
                            type="password"
                            name="confirmPassword"
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordChange}
                            className={`w-full px-4 py-2.5 pr-12 bg-surface-elevated border ${
                              profileErrors.confirmPassword
                                ? 'border-red-500'
                                : passwordValidation.passwordsMatch && passwordData.confirmPassword
                                ? 'border-green-500'
                                : 'border-surface-border'
                            } rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors`}
                            placeholder="새 비밀번호를 다시 입력하세요"
                          />
                          {/* Password Match Icon */}
                          {passwordData.confirmPassword && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                              {passwordValidation.passwordsMatch ? (
                                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              )}
                            </div>
                          )}
                        </div>
                        {profileErrors.confirmPassword && (
                          <p className="mt-1.5 text-sm text-red-400">{profileErrors.confirmPassword}</p>
                        )}
                        {!profileErrors.confirmPassword && passwordData.confirmPassword && passwordValidation.passwordsMatch && (
                          <p className="mt-1.5 text-sm text-green-400">비밀번호가 일치합니다.</p>
                        )}
                        {!profileErrors.confirmPassword && passwordData.confirmPassword && !passwordValidation.passwordsMatch && (
                          <p className="mt-1.5 text-sm text-red-400">비밀번호가 일치하지 않습니다.</p>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={isSavingProfile}
                        className="w-full px-5 py-2.5 bg-accent hover:bg-accent/90 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                      >
                        {isSavingProfile ? '변경 중...' : '비밀번호 변경'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ) : isInitialLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="w-8 h-8 border-2 border-surface-border border-t-accent rounded-full animate-spin" />
              </div>
            ) : currentData.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 rounded-full bg-surface-elevated flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {activeTab === 'saved' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    )}
                  </svg>
                </div>
                <p className="text-text-muted">{emptyMessage}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentData.map((item) => (
                  <div
                    key={item.articleId}
                    className="bg-surface-card border border-surface-border rounded-xl p-6 hover:border-accent/30 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Source badge */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs font-medium text-accent capitalize">
                            {item.source}
                          </span>
                          <span className="text-text-muted">·</span>
                          <span className="text-xs text-text-muted">
                            {formatTimeAgo('savedAt' in item ? item.savedAt : item.readAt)}
                          </span>
                        </div>

                        {/* Title */}
                        <a
                          href={`/article/${item.articleId}`}
                          className="block mb-2"
                          onClick={(e) => {
                            e.preventDefault();
                            navigate(`/article/${item.articleId}`);
                          }}
                        >
                          <h3 className="text-lg font-medium text-text-primary group-hover:text-accent transition-colors line-clamp-2">
                            {item.summaryKoTitle}
                          </h3>
                        </a>
                      </div>

                      {/* Actions */}
                      {activeTab === 'saved' && (
                        <button
                          onClick={() => handleUnsave(item.articleId)}
                          className="flex-shrink-0 p-2 text-text-muted hover:text-red-500 transition-colors"
                          title="저장 취소"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Infinite Scroll Trigger */}
                <div ref={observerTarget} className="h-10" />

                {/* Loading Indicator */}
                {isLoading && (
                  <div className="flex justify-center items-center py-8">
                    <div className="w-6 h-6 border-2 border-surface-border border-t-accent rounded-full animate-spin" />
                  </div>
                )}

                {/* End Message */}
                {!hasMore && currentData.length > 0 && (
                  <div className="text-center py-8">
                    <p className="text-sm text-text-muted">모든 항목을 확인했습니다</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
