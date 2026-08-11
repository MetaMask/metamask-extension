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
};

// Most callers only have a bare assetId (no native/non-native distinction);
// only the Activity list itself knows a transfer's assetType and passes the
// richer object form to unlock the native-icon lookup below.
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

// Native assets aren't guaranteed a resolvable assetId (some chains' native
// currencies, e.g. Chiliz/Stable, aren't in the upstream SLIP44-by-symbol
// table used to build one), so this can't key off the assetId at all. It
// uses the transfer's own chainId instead, matching the same locally
// bundled icon the asset list uses for natives.
const getNativeAssetImageSrc = (chainId?: string): string | undefined =>
  chainId
    ? CHAIN_ID_TOKEN_IMAGE_MAP[chainId as keyof typeof CHAIN_ID_TOKEN_IMAGE_MAP]
    : undefined;

const ActivityTokenAvatar = ({
  token,
  chainId,
  className,
}: Readonly<{
  token: ActivityAvatarToken;
  chainId?: string;
  className?: string;
}>) => {
  const { assetId, isNative } = token;
  const src = isNative
    ? getNativeAssetImageSrc(chainId)
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
  chainId,
}: Readonly<{
  from: ActivityAvatarToken;
  to: ActivityAvatarToken;
  chainId?: string;
}>) => {
  return (
    <div
      className="activity-list-item-avatar-dual"
      data-testid="activity-list-item-avatar-dual"
    >
      <div className="activity-list-item-avatar-dual__half activity-list-item-avatar-dual__half--left">
        <ActivityTokenAvatar
          token={from}
          chainId={chainId}
          className="activity-list-item-avatar-dual__token"
        />
      </div>
      <div className="activity-list-item-avatar-dual__half activity-list-item-avatar-dual__half--right">
        <ActivityTokenAvatar
          token={to}
          chainId={chainId}
          className="activity-list-item-avatar-dual__token"
        />
      </div>
    </div>
  );
};

export const ActivityListItemAvatar = (
  props: Readonly<{ tokens: ActivityListItemAvatarTokens; chainId?: string }>,
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
    return (
      <ActivityDualTokenAvatar from={from} to={to} chainId={props.chainId} />
    );
  }

  return <ActivityTokenAvatar token={tokens[0]} chainId={props.chainId} />;
};
