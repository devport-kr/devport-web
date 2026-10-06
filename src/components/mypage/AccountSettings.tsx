import { useEffect, useState, type ReactNode } from 'react';
import type { AxiosError } from 'axios';
import { CircleCheck, LoaderCircle } from 'lucide-react';
import { changePassword, updateProfile, type UserResponse } from '../../services/auth/authService';
import { validatePassword } from '../../lib/signupValidation';
import Avatar from '../Avatar';
import FormAlert from '../form/FormAlert';
import PasswordInput from '../form/PasswordInput';
import PasswordRequirements from '../form/PasswordRequirements';
import {
  buttonClass,
  errorTextClass,
  helperTextClass,
  inputClass,
  labelClass,
  successTextClass,
} from '../form/formStyles';
import SettingsCard from './SettingsCard';
import { getAuthProviderMeta } from './accountMeta';

type Feedback = { tone: 'success' | 'error'; text: string } | null;

const EMPTY_PASSWORDS = { currentPassword: '', newPassword: '', confirmPassword: '' };

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) : '-';

const formatDateTime = (value?: string) =>
  value ? new Date(value).toLocaleString('ko-KR', { dateStyle: 'long', timeStyle: 'short' }) : '-';

// Success messages fade out on their own; errors stay until the next attempt
const useFeedback = () => {
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => {
    if (feedback?.tone !== 'success') return;
    const timer = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(timer);
  }, [feedback]);

  return [feedback, setFeedback] as const;
};

function FooterMessage({ feedback }: { feedback: Feedback }) {
  if (!feedback) return null;
  return (
    <p
      role={feedback.tone === 'error' ? 'alert' : 'status'}
      className={`mr-auto inline-flex items-center gap-1.5 text-[13px] ${
        feedback.tone === 'success' ? 'text-emerald-400' : 'text-red-400'
      }`}
    >
      {feedback.tone === 'success' && <CircleCheck className="h-4 w-4" strokeWidth={2} />}
      {feedback.text}
    </p>
  );
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-4 py-3 first:pt-0 last:pb-0 sm:grid-cols-[9rem_minmax(0,1fr)]">
      <dt className="text-[13px] text-text-muted">{label}</dt>
      <dd className="min-w-0 text-sm text-text-primary">{children}</dd>
    </div>
  );
}

interface AccountSettingsProps {
  user: UserResponse;
  onProfileUpdated: () => Promise<void>;
}

/** Profile, sign-in details and (for ID accounts) password change on the my page. */
export default function AccountSettings({ user, onProfileUpdated }: AccountSettingsProps) {
  const [profileData, setProfileData] = useState({
    name: user.name || '',
    profileImageUrl: user.profileImageUrl || '',
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useFeedback();

  const [passwordData, setPasswordData] = useState(EMPTY_PASSWORDS);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useFeedback();

  useEffect(() => {
    setProfileData({ name: user.name || '', profileImageUrl: user.profileImageUrl || '' });
  }, [user]);

  const provider = getAuthProviderMeta(user.authProvider);
  const isProfileDirty =
    profileData.name !== (user.name || '') || profileData.profileImageUrl !== (user.profileImageUrl || '');
  const canSaveProfile = isProfileDirty && profileData.name.trim().length > 0 && !isSavingProfile;
  const isPasswordConfirmed =
    Boolean(passwordData.confirmPassword) && passwordData.newPassword === passwordData.confirmPassword;

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
    setProfileFeedback(null);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSaveProfile) return;

    setIsSavingProfile(true);
    setProfileFeedback(null);

    try {
      await updateProfile({
        name: profileData.name.trim(),
        profileImageUrl: profileData.profileImageUrl || undefined,
      });
      await onProfileUpdated();
      setProfileFeedback({ tone: 'success', text: '프로필을 저장했습니다.' });
    } catch (error) {
      console.error('Profile update error:', error);
      setProfileFeedback({ tone: 'error', text: '프로필 업데이트에 실패했습니다.' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    setPasswordFeedback(null);
    if (passwordErrors[name]) {
      setPasswordErrors((prev) => {
        const nextErrors = { ...prev };
        delete nextErrors[name];
        return nextErrors;
      });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    const errors: Record<string, string> = {};
    if (!passwordData.currentPassword) {
      errors.currentPassword = '현재 비밀번호를 입력해주세요.';
    }
    const newPasswordError = validatePassword(passwordData.newPassword);
    if (newPasswordError) {
      errors.newPassword = newPasswordError;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }
    setPasswordErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSavingPassword(true);

    try {
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordData(EMPTY_PASSWORDS);
      setPasswordFeedback({ tone: 'success', text: '비밀번호를 변경했습니다.' });
    } catch (error) {
      console.error('Password change error:', error);
      const status = (error as AxiosError).response?.status;
      if (status === 401) {
        setPasswordErrors({ currentPassword: '현재 비밀번호가 올바르지 않습니다.' });
      } else if (status === 400) {
        setPasswordFeedback({ tone: 'error', text: 'OAuth 계정은 비밀번호를 변경할 수 없습니다.' });
      } else {
        setPasswordFeedback({ tone: 'error', text: '비밀번호 변경에 실패했습니다.' });
      }
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSaveProfile} noValidate>
        <SettingsCard
          title="프로필"
          description="devport에서 댓글 등에 표시되는 이름과 프로필 사진이에요."
          footer={
            <>
              <FooterMessage feedback={profileFeedback} />
              {isProfileDirty && (
                <button
                  type="button"
                  onClick={() => setProfileData({ name: user.name || '', profileImageUrl: user.profileImageUrl || '' })}
                  disabled={isSavingProfile}
                  className={buttonClass('secondary', 'sm')}
                >
                  되돌리기
                </button>
              )}
              <button type="submit" disabled={!canSaveProfile} className={buttonClass('primary', 'sm')}>
                {isSavingProfile && <LoaderCircle className="h-4 w-4 animate-spin" />}
                {isSavingProfile ? '저장 중...' : '저장'}
              </button>
            </>
          }
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <Avatar
              src={profileData.profileImageUrl || null}
              name={profileData.name || user.name}
              className="h-20 w-20 text-3xl ring-1 ring-surface-border"
            />
            <div className="flex-1 space-y-4">
              <div>
                <label htmlFor="profile-name" className={labelClass}>
                  이름
                </label>
                <input
                  type="text"
                  id="profile-name"
                  name="name"
                  value={profileData.name}
                  onChange={handleProfileChange}
                  autoComplete="nickname"
                  className={inputClass(!profileData.name.trim())}
                  placeholder="이름을 입력하세요"
                />
                {!profileData.name.trim() && <p className={errorTextClass}>이름을 입력해주세요.</p>}
              </div>
              <div>
                <label htmlFor="profile-image" className={labelClass}>
                  프로필 이미지 URL
                </label>
                <input
                  type="url"
                  id="profile-image"
                  name="profileImageUrl"
                  value={profileData.profileImageUrl}
                  onChange={handleProfileChange}
                  className={inputClass()}
                  placeholder="https://example.com/avatar.jpg"
                />
                <p className={helperTextClass}>이미지 주소를 입력하면 프로필 사진 미리보기에 바로 반영됩니다.</p>
              </div>
            </div>
          </div>
        </SettingsCard>
      </form>

      <SettingsCard title="로그인 정보" description="계정에 연결된 로그인 수단과 이메일이에요. 이메일은 변경할 수 없습니다.">
        <dl className="divide-y divide-surface-border/70">
          <InfoRow label="로그인 방식">
            <span className="inline-flex items-center gap-2">
              <provider.Icon className="h-4 w-4 text-text-secondary" />
              {provider.label}
            </span>
          </InfoRow>
          {user.username && <InfoRow label="아이디">{user.username}</InfoRow>}
          <InfoRow label="이메일">
            {user.email ? (
              <span className="inline-flex flex-wrap items-center gap-2">
                <span className="break-all">{user.email}</span>
                {user.emailVerified && (
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                    인증됨
                  </span>
                )}
              </span>
            ) : (
              <span className="text-text-muted">미등록</span>
            )}
          </InfoRow>
          <InfoRow label="가입일">{formatDate(user.createdAt)}</InfoRow>
          <InfoRow label="최근 로그인">{formatDateTime(user.lastLoginAt)}</InfoRow>
        </dl>
      </SettingsCard>

      {/* Password Change (Only for LOCAL users) */}
      {user.authProvider === 'local' && (
        <form onSubmit={handleChangePassword} noValidate>
          <SettingsCard
            title="비밀번호 변경"
            description="주기적으로 비밀번호를 바꾸면 계정을 더 안전하게 지킬 수 있어요."
            footer={
              <>
                <FooterMessage feedback={passwordFeedback} />
                <button type="submit" disabled={isSavingPassword} className={buttonClass('primary', 'sm')}>
                  {isSavingPassword && <LoaderCircle className="h-4 w-4 animate-spin" />}
                  {isSavingPassword ? '변경 중...' : '비밀번호 변경'}
                </button>
              </>
            }
          >
            <div className="max-w-md space-y-4">
              <div>
                <label htmlFor="current-password" className={labelClass}>
                  현재 비밀번호
                </label>
                <PasswordInput
                  id="current-password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  autoComplete="current-password"
                  hasError={Boolean(passwordErrors.currentPassword)}
                  placeholder="현재 비밀번호를 입력하세요"
                />
                {passwordErrors.currentPassword && <p className={errorTextClass}>{passwordErrors.currentPassword}</p>}
              </div>

              <div>
                <label htmlFor="new-password" className={labelClass}>
                  새 비밀번호
                </label>
                <PasswordInput
                  id="new-password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  autoComplete="new-password"
                  maxLength={64}
                  hasError={Boolean(passwordErrors.newPassword)}
                  placeholder="새 비밀번호를 입력하세요"
                />
                {passwordErrors.newPassword ? (
                  <p className={errorTextClass}>{passwordErrors.newPassword}</p>
                ) : (
                  <PasswordRequirements password={passwordData.newPassword} />
                )}
              </div>

              <div>
                <label htmlFor="confirm-password" className={labelClass}>
                  새 비밀번호 확인
                </label>
                <PasswordInput
                  id="confirm-password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  autoComplete="new-password"
                  maxLength={64}
                  hasError={Boolean(passwordErrors.confirmPassword)}
                  placeholder="새 비밀번호를 한 번 더 입력하세요"
                />
                {passwordErrors.confirmPassword ? (
                  <p className={errorTextClass}>{passwordErrors.confirmPassword}</p>
                ) : (
                  passwordData.confirmPassword &&
                  (isPasswordConfirmed ? (
                    <p className={successTextClass}>비밀번호가 일치합니다</p>
                  ) : (
                    <p className={errorTextClass}>비밀번호가 일치하지 않습니다.</p>
                  ))
                )}
              </div>
            </div>
          </SettingsCard>
        </form>
      )}

      {user.authProvider !== 'local' && (
        <FormAlert tone="info">
          {provider.label} 계정으로 로그인하고 있어 비밀번호는 {provider.label}에서 관리됩니다.
        </FormAlert>
      )}
    </div>
  );
}
