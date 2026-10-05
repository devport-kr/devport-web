import { useState } from 'react';
import GitHubIcon from '../../components/icons/GitHubIcon';
import type { GitRepo } from '../../types';
import { ownerAvatar, repoMainImage } from './repoDisplay';

interface RepoThumbnailProps {
  repo: GitRepo;
  className?: string;
}

// 16:9 tile: the repo's main image, or its owner's avatar on a tile when there is
// none (or the image fails to load), or the GitHub mark as a last resort
export default function RepoThumbnail({ repo, className = '' }: RepoThumbnailProps) {
  const main = repoMainImage(repo);
  const [imageFailed, setImageFailed] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const showImage = main.kind === 'image' && !imageFailed;

  return (
    <div
      className={`relative aspect-video overflow-hidden rounded-lg border border-surface-border/60 bg-gradient-to-br from-surface-elevated to-surface-card ${className}`}
    >
      {showImage ? (
        <img
          src={main.src}
          alt=""
          loading="lazy"
          onError={() => setImageFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : !avatarFailed ? (
        <div className="flex h-full w-full items-center justify-center">
          <img
            src={ownerAvatar(repo)}
            alt=""
            loading="lazy"
            onError={() => setAvatarFailed(true)}
            className="h-1/2 aspect-square rounded-xl"
          />
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <GitHubIcon className="h-1/3 w-1/3 text-text-muted" />
        </div>
      )}
    </div>
  );
}
