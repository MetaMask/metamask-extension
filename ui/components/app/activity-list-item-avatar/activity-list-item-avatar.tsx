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
import { CHAIN_ID_TOKEN_IMAGE_MAP } from '../../../../shared/constants/network';

export type ActivityAvatarToken = {
  assetId?: string;
  isNative?: boolean;
  // Each token carries its own chain: a shared chainId across both legs of
  // a dual avatar is wrong for cross-chain rows (e.g. bridge), where the
  // destination can be on a different chain than the source/activity chain.
  chainId?: string;
};

// Most callers only pass a bare assetId; only the Activity list knows a
// transfer's assetType/chainId and passes the richer object form.
export type ActivityListItemAvatarTokens = readonly (
  | ActivityAvatarToken
  | string
  | undefined
)[];

const fallbackText = '?';

const normalizeToken = (
  token: ActivityAvatarToken | string | undefined,
): ActivityAvatarToken | undefined =>
  typeof token === 'string' ? { assetId: token } : token;

const sanitizeTokens = (
  tokens: ActivityListItemAvatarTokens,
): ActivityAvatarToken[] =>
  tokens
    .map(normalizeToken)
    .filter(
      (token): token is ActivityAvatarToken =>
        Boolean(token?.assetId) || Boolean(token?.isNative),
    );

// Most custom networks' native assets never get a resolvable assetId, so try
// chainId first (like the asset list does); assetId is still a valid fallback.
const getNativeAssetImageSrc = (chainId?: string): string | undefined =>
  chainId
    ? CHAIN_ID_TOKEN_IMAGE_MAP[chainId as keyof typeof CHAIN_ID_TOKEN_IMAGE_MAP]
    : undefined;

const ActivityTokenAvatar = ({
  token,
  className,
}: Readonly<{
  token: ActivityAvatarToken;
  className?: string;
}>) => {
  const { assetId, isNative, chainId } = token;
  const src = isNative
    ? (getNativeAssetImageSrc(chainId) ??
      getCaipAssetImageUrl(assetId as CaipAssetType))
    : getCaipAssetImageUrl(assetId as CaipAssetType);

  return (
    <AvatarToken
      size={AvatarTokenSize.Md}
      name={fallbackText}
      src={src}
      className={classnames(className)}
      imageProps={{ className: 'bg-alternative' }}
      data-testid="activity-list-item-avatar-token"
    />
  );
};

const ActivityDualTokenAvatar = ({
  from,
  to,
}: Readonly<{
  from: ActivityAvatarToken;
  to: ActivityAvatarToken;
}>) => {
  return (
    <div
      className="activity-list-item-avatar-dual"
      data-testid="activity-list-item-avatar-dual"
    >
      <div className="activity-list-item-avatar-dual__half activity-list-item-avatar-dual__half--left">
        <ActivityTokenAvatar
          token={from}
          className="activity-list-item-avatar-dual__token"
        />
      </div>
      <div className="activity-list-item-avatar-dual__half activity-list-item-avatar-dual__half--right">
        <ActivityTokenAvatar
          token={to}
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

  return <ActivityTokenAvatar token={tokens[0]} />;
};
