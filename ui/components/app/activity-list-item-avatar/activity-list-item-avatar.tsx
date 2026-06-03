import React from 'react';
import classnames from 'clsx';
import {
  AvatarBase,
  AvatarBaseSize,
  AvatarToken,
  AvatarTokenSize,
} from '@metamask/design-system-react';
import { getAssetImageUrl } from '../../../../shared/lib/asset-utils';

export type ActivityListItemAvatarTokens = readonly (string | undefined)[];

const sanitizeTokens = (tokens: ActivityListItemAvatarTokens): string[] =>
  tokens.filter((token): token is string => Boolean(token));

const getTokenAvatarData = (assetId: string) => {
  try {
    const [chainId, assetTypeWithReference] = assetId.split('/');
    const [, assetReference] = (assetTypeWithReference ?? '').split(':');

    if (!chainId) {
      throw new Error('Invalid asset id');
    }

    const displayName = assetReference || 'Token';

    return {
      name: displayName,
      src: getAssetImageUrl(
        assetId as `${string}:${string}/${string}:${string}`,
        chainId as `${string}:${string}`,
      ),
    };
  } catch {
    return {
      name: 'Token',
      src: undefined,
    };
  }
};

const ActivityTokenAvatar = ({
  assetId,
  className,
}: Readonly<{ assetId: string; className?: string }>) => {
  const { name, src } = getTokenAvatarData(assetId);

  return (
    <AvatarToken
      size={AvatarTokenSize.Md}
      name={name}
      src={src}
      className={classnames(className)}
      data-testid="activity-list-item-avatar-token"
    />
  );
};

const ActivityDualTokenAvatar = ({
  from,
  to,
}: Readonly<{ from: string; to: string }>) => {
  return (
    <div
      className="activity-list-item-avatar-dual"
      data-testid="activity-list-item-avatar-dual"
    >
      <div className="activity-list-item-avatar-dual__half activity-list-item-avatar-dual__half--left">
        <ActivityTokenAvatar
          assetId={from}
          className="activity-list-item-avatar-dual__token bg-transparent"
        />
      </div>
      <div className="activity-list-item-avatar-dual__half activity-list-item-avatar-dual__half--right">
        <ActivityTokenAvatar
          assetId={to}
          className="activity-list-item-avatar-dual__token bg-transparent"
        />
      </div>
    </div>
  );
};

export const ActivityListItemAvatar = (
  props: Readonly<{ tokens: ActivityListItemAvatarTokens }>,
) => {
  const tokens = sanitizeTokens(props.tokens);

  if (tokens.length === 0) {
    return (
      <AvatarBase
        size={AvatarBaseSize.Md}
        fallbackText="?"
        data-testid="activity-list-item-avatar-fallback"
      />
    );
  }

  if (tokens.length > 1) {
    const [from, to] = tokens;
    return <ActivityDualTokenAvatar from={from} to={to} />;
  }

  return <ActivityTokenAvatar assetId={tokens[0]} />;
};
