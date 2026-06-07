import React from 'react';
import classnames from 'clsx';
import {
  AvatarBase,
  AvatarToken,
  AvatarTokenSize,
} from '@metamask/design-system-react';
import { getAssetImageUrl } from '../../../../shared/lib/asset-utils';

export type ActivityListItemAvatarTokens = readonly (string | undefined)[];

const fallbackText = '?';
const avatarSizeByTokenSize = {
  [AvatarTokenSize.Xs]: 16,
  [AvatarTokenSize.Sm]: 24,
  [AvatarTokenSize.Md]: 32,
  [AvatarTokenSize.Lg]: 40,
  [AvatarTokenSize.Xl]: 48,
};

const sanitizeTokens = (tokens: ActivityListItemAvatarTokens): string[] =>
  tokens.filter((token): token is string => Boolean(token));

const getTokenAvatarData = (assetId: string) => {
  try {
    const [chainId] = assetId.split('/');

    if (!chainId) {
      throw new Error('Invalid asset id');
    }

    return {
      name: fallbackText,
      src: getAssetImageUrl(
        assetId as `${string}:${string}/${string}:${string}`,
        chainId as `${string}:${string}`,
      ),
    };
  } catch {
    return {
      name: fallbackText,
      src: undefined,
    };
  }
};

const ActivityTokenAvatar = ({
  assetId,
  className,
  size = AvatarTokenSize.Md,
}: Readonly<{ assetId: string; className?: string; size?: AvatarTokenSize }>) => {
  const { name, src } = getTokenAvatarData(assetId);

  return (
    <AvatarToken
      size={size}
      name={name}
      src={src}
      className={classnames(className)}
      imageProps={{ className: 'bg-alternative' }}
      data-testid="activity-list-item-avatar-token"
    />
  );
};

const ActivityDualTokenAvatar = ({
  from,
  size = AvatarTokenSize.Md,
  to,
}: Readonly<{ from: string; size?: AvatarTokenSize; to: string }>) => {
  const avatarSize = avatarSizeByTokenSize[size];

  return (
    <div
      className="activity-list-item-avatar-dual"
      style={{ width: avatarSize, height: avatarSize }}
      data-testid="activity-list-item-avatar-dual"
    >
      <div className="activity-list-item-avatar-dual__half activity-list-item-avatar-dual__half--left">
        <ActivityTokenAvatar
          assetId={from}
          className="activity-list-item-avatar-dual__token"
          size={size}
        />
      </div>
      <div className="activity-list-item-avatar-dual__half activity-list-item-avatar-dual__half--right">
        <ActivityTokenAvatar
          assetId={to}
          className="activity-list-item-avatar-dual__token"
          size={size}
        />
      </div>
    </div>
  );
};

export const ActivityListItemAvatar = (
  props: Readonly<{
    tokens: ActivityListItemAvatarTokens;
    size?: AvatarTokenSize;
  }>,
) => {
  const tokens = sanitizeTokens(props.tokens);
  const size = props.size ?? AvatarTokenSize.Md;

  if (tokens.length === 0) {
    return (
      <AvatarBase
        size={size}
        fallbackText={fallbackText}
        data-testid="activity-list-item-avatar-fallback"
      />
    );
  }

  if (tokens.length > 1) {
    const [from, to] = tokens;
    return <ActivityDualTokenAvatar from={from} size={size} to={to} />;
  }

  return <ActivityTokenAvatar assetId={tokens[0]} size={size} />;
};
