import { Link, useLocation } from 'react-router-dom';

interface CheckEmailLocationState {
  email?: string;
}

export default function CheckEmailPage() {
  const location = useLocation();
  const state = location.state as CheckEmailLocationState | null;
  const email = state?.email;

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="max-w-md w-full">
        <div className="bg-surface-card rounded-2xl p-8 border border-surface-border">
          <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto mb-5">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <h1 className="text-xl font-semibold text-text-primary text-center mb-3">
            이메일을 확인해 주세요
          </h1>

          <p className="text-sm text-text-muted text-center leading-relaxed">
            계정이 생성되었습니다. 이메일 인증을 완료해야 로그인할 수 있습니다.
          </p>

          {email && (
            <p className="mt-3 text-sm text-text-secondary text-center">
              인증 메일 발송 주소: <span className="text-text-primary font-medium">{email}</span>
            </p>
          )}

          <div className="mt-8 space-y-3">
            <Link
              to="/login"
              className="block w-full px-5 py-3 bg-accent hover:bg-accent/90 text-white text-sm font-medium rounded-xl transition-colors text-center"
            >
              로그인으로 돌아가기
            </Link>

            <p className="text-xs text-text-muted text-center leading-relaxed">
              인증 메일이 보이지 않으면 스팸함을 확인한 뒤 로그인 화면에서 인증 메일을 다시 요청할 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

