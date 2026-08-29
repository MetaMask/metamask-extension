import React from 'react';
import classnames from 'clsx';
import {
  AvatarBase,
  AvatarBaseSize,
  AvatarToken,
  AvatarTokenSize,
} from '@metamask/design-system-react';
import type { CaipAssetType } from '@metamask/utils';
import {
  getCaipAssetImageUrl,
  getChainIdFromAssetId,
  isNativeAssetId,
} from '../../../../shared/lib/asset-utils';
import { convertCaipToHexChainId } from '../../../../shared/lib/network.utils';
import { CHAIN_ID_TOKEN_IMAGE_MAP } from '../../../../shared/constants/network';

/**
 * For a native asset, prefer the icon bundled with the app over a CDN fetch.
 *
 * @param assetId - The CAIP-19 asset id to look up a local icon for.
 */
const getLocalNativeIconSrc = (assetId: CaipAssetType): string | undefined => {
  if (!isNativeAssetId(assetId)) {
    return undefined;
  }
  const chainId = getChainIdFromAssetId(assetId);
  if (!chainId) {
    return undefined;
  }
  try {
    const hexChainId = convertCaipToHexChainId(chainId);
    return CHAIN_ID_TOKEN_IMAGE_MAP[
      hexChainId as keyof typeof CHAIN_ID_TOKEN_IMAGE_MAP
    ];
  } catch {
    // Non-EVM chain id - fall through to the CDN lookup.
    return undefined;
  }
};

export type ActivityListItemAvatarTokens = readonly (string | undefined)[];

const fallbackText = '?';

const sanitizeTokens = (tokens: ActivityListItemAvatarTokens): string[] =>
  tokens.filter((token): token is string => Boolean(token));

const ActivityTokenAvatar = ({
  assetId,
  className,
}: Readonly<{ assetId: string; className?: string }>) => {
  const src =
    getLocalNativeIconSrc(assetId as CaipAssetType) ??
    getCaipAssetImageUrl(assetId as CaipAssetType);

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
