import { describe, expect, it } from 'vitest';
import { validatePassword, validateUsername } from '../signupValidation';

// The rules the backend enforces (devport-api PR #24).
const SERVER_USERNAME = /^[a-zA-Z0-9_-]{3,20}$/;
const SERVER_PASSWORD = /^(?=.*[!@#$%^&*(),.?":{}|<>])[\x20-\x7E]{8,64}$/;

describe('validateUsername', () => {
  const cases = ['', 'ab', 'abc', 'user_name-01', 'a'.repeat(20), 'a'.repeat(21), 'has space', '한글아이디', 'dot.name', 'USER'];

  it.each(cases)('agrees with the server rule for %j', (username) => {
    expect(validateUsername(username) === null).toBe(SERVER_USERNAME.test(username));
  });

  it('explains which rule failed', () => {
    expect(validateUsername('')).toBe('아이디를 입력해주세요.');
    expect(validateUsername('ab')).toBe('아이디는 3~20자로 입력해주세요.');
    expect(validateUsername('dot.name')).toBe('아이디는 영문, 숫자, _, - 만 사용할 수 있습니다.');
  });
});

describe('validatePassword', () => {
  const cases = [
    '',
    'short!1',
    'longenough',
    'longenough!',
    'with space !',
    `${'a'.repeat(63)}!`,
    `${'a'.repeat(64)}!`,
    '비밀번호입니다!!!',
    'tab\tinside!!',
    'quote"mark1',
    'under_score1',
  ];

  it.each(cases)('agrees with the server rule for %j', (password) => {
    expect(validatePassword(password) === null).toBe(SERVER_PASSWORD.test(password));
  });

  it('explains which rule failed', () => {
    expect(validatePassword('short!1')).toBe('비밀번호는 8~64자로 입력해주세요.');
    expect(validatePassword('longenough')).toBe('특수문자(!@#$%^&* 등)를 1개 이상 포함해주세요.');
    expect(validatePassword('비밀번호입니다!!!')).toBe('비밀번호는 영문, 숫자, 특수문자, 공백만 사용할 수 있습니다.');
  });
});
