import type { ComponentType } from 'react';
import { KeyRound } from 'lucide-react';
import { OAUTH_PROVIDERS } from '../auth/oauthProviders';
import GitHubIcon from '../icons/GitHubIcon';
import type { UserResponse } from '../../services/auth/authService';

const LOCAL_PROVIDER = { id: 'local', label: '아이디', Icon: KeyRound };

/** Label and logo for the way the user signs in. */
export const getAuthProviderMeta = (provider: UserResponse['authProvider']) =>
  OAUTH_PROVIDERS.find(({ id }) => id === provider) ?? LOCAL_PROVIDER;

export interface SourceMeta {
  label: string;
  /** Tinted tile colors */
  tile: string;
  /** Logo component, or a short text mark */
  mark: ComponentType<{ className?: string }> | string;
  markClass?: string;
}

export const SOURCE_META: Record<string, SourceMeta> = {
  github: { label: 'GitHub', tile: 'bg-white/[0.08] text-white', mark: GitHubIcon },
  hackernews: { label: 'Hacker News', tile: 'bg-[#ff6600]/15 text-[#ff8a3d]', mark: 'Y' },
  reddit: { label: 'Reddit', tile: 'bg-[#ff4500]/15 text-[#ff7043]', mark: 'r/' },
  medium: { label: 'Medium', tile: 'bg-white/[0.08] text-white', mark: 'M' },
  devto: { label: 'DEV', tile: 'bg-white/[0.08] text-white', mark: 'DEV', markClass: 'text-[9px] tracking-tight' },
  hashnode: { label: 'Hashnode', tile: 'bg-[#2962ff]/20 text-[#7aa2ff]', mark: 'H' },
};

export const getSourceLabel = (source: string) => SOURCE_META[source]?.label ?? source;
