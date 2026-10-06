// Client-side copies of the server's signup rules, so users see Korean errors before submitting.

const USERNAME_CHARS = /^[a-zA-Z0-9_-]+$/;
const PRINTABLE_ASCII = /^[\x20-\x7E]*$/;
const PASSWORD_SPECIAL_CHAR = /[!@#$%^&*(),.?":{}|<>]/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX_LENGTH = 100;

export const validateUsername = (username: string): string | null => {
  if (!username) return '아이디를 입력해주세요.';
  if (!USERNAME_CHARS.test(username)) return '아이디는 영문, 숫자, _, - 만 사용할 수 있습니다.';
  if (username.length < 3 || username.length > 20) return '아이디는 3~20자로 입력해주세요.';
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) return '비밀번호를 입력해주세요.';
  if (!PRINTABLE_ASCII.test(password)) return '비밀번호는 영문, 숫자, 특수문자, 공백만 사용할 수 있습니다.';
  if (password.length < 8 || password.length > 64) return '비밀번호는 8~64자로 입력해주세요.';
  if (!PASSWORD_SPECIAL_CHAR.test(password)) return '특수문자(!@#$%^&* 등)를 1개 이상 포함해주세요.';
  return null;
};

export const validateEmail = (email: string): string | null => {
  if (!email) return '이메일을 입력해주세요.';
  if (!EMAIL_PATTERN.test(email) || email.length > EMAIL_MAX_LENGTH) return '올바른 이메일 주소를 입력해주세요.';
  return null;
};
