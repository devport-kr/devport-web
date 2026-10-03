import { Link, useLocation } from 'react-router-dom';
import { Mail } from 'lucide-react';
import AuthLayout from '../components/auth/AuthLayout';

interface CheckEmailLocationState {
  email?: string;
}

export default function CheckEmailPage() {
  const location = useLocation();
  const state = location.state as CheckEmailLocationState | null;
  const email = state?.email;

  return (
    <AuthLayout
      kicker="Verify email"
      title="이메일을 확인해 주세요"
      subtitle="계정이 생성되었습니다. 이메일 인증을 완료해야 로그인할 수 있습니다."
    >
      <div className="panel p-5">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 shrink-0 rounded bg-accent/10 text-accent flex items-center justify-center">
            <Mail className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="label-mono">인증 메일 발송 주소</p>
            <p className="mt-0.5 text-sm font-medium text-text-primary truncate">
              {email ?? '가입한 이메일 주소'}
            </p>
          </div>
        </div>
      </div>

      <Link to="/login" className="btn btn-primary btn-lg w-full mt-5">
        로그인으로 돌아가기
      </Link>

      <p className="mt-4 text-xs text-text-muted leading-relaxed">
        인증 메일이 보이지 않으면 스팸함을 확인한 뒤 로그인 화면에서 인증 메일을 다시 요청할 수 있습니다.
      </p>
    </AuthLayout>
  );
}
