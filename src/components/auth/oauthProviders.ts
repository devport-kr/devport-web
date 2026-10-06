import type { ComponentType } from 'react';
import GitHubIcon from '../icons/GitHubIcon';
import GoogleIcon from '../icons/GoogleIcon';
import NaverIcon from '../icons/NaverIcon';

export type OAuthProvider = 'github' | 'google' | 'naver';

export interface OAuthProviderMeta {
  id: OAuthProvider;
  label: string;
  Icon: ComponentType<{ className?: string }>;
}

export const OAUTH_PROVIDERS: OAuthProviderMeta[] = [
  { id: 'github', label: 'GitHub', Icon: GitHubIcon },
  { id: 'google', label: 'Google', Icon: GoogleIcon },
  { id: 'naver', label: '네이버', Icon: NaverIcon },
];
