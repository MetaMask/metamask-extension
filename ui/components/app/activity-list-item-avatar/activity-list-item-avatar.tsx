import React from 'react';
import classnames from 'clsx';
import {
  AvatarBase,
  AvatarBaseSize,
  AvatarToken,
  AvatarTokenSize,
} from '@metamask/design-system-react';
import type { CaipAssetType } from '@metamask/utils';
import { getCaipAssetImageUrl } from '../../../../shared/lib/asset-utils';

export type ActivityListItemAvatarTokens = readonly (string | undefined)[];

const fallbackText = '?';

const sanitizeTokens = (tokens: ActivityListItemAvatarTokens): string[] =>
  tokens.filter((token): token is string => Boolean(token));

const ActivityTokenAvatar = ({
  assetId,
  className,
}: Readonly<{ assetId: string; className?: string }>) => {
  return (
    <AvatarToken
      size={AvatarTokenSize.Md}
      name={fallbackText}
      src={getCaipAssetImageUrl(assetId as CaipAssetType)}
      className={classnames(className)}
      imageProps={{ className: 'bg-alternative' }}
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
          className="activity-list-item-avatar-dual__token"
        />
      </div>
      <div className="activity-list-item-avatar-dual__half activity-list-item-avatar-dual__half--right">
        <ActivityTokenAvatar
          assetId={to}
          className="activity-list-item-avatar-dual__token"
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
        fallbackText={fallbackText}
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
