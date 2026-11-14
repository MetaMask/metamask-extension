import React, { useEffect, useState } from 'react';
import classnames from 'clsx';
import {
  AvatarBase,
  AvatarBaseSize,
  AvatarToken,
  AvatarTokenSize,
} from '@metamask/design-system-react';
import type { CaipAssetType, CaipChainId } from '@metamask/utils';
import { parseCaipAssetType } from '@metamask/utils';
import { CHAIN_ID_TOKEN_IMAGE_MAP } from '../../../../shared/constants/network';
import { getCaipAssetImageUrl } from '../../../../shared/lib/asset-utils';
import { convertCaipToHexChainId } from '../../../../shared/lib/network.utils';

export type ActivityListItemAvatarTokens = readonly (string | undefined)[];

const fallbackText = '?';

const zeroAddressPattern = /^0x0+$/iu;

function isNativeAssetId(assetId: string): boolean {
  try {
    const { assetNamespace, assetReference } = parseCaipAssetType(
      assetId as CaipAssetType,
    );
    return (
      assetNamespace === 'slip44' ||
      (assetNamespace === 'erc20' && zeroAddressPattern.test(assetReference))
    );
  } catch {
    return false;
  }
}

function getNativeImageForAssetId(assetId: string): string | undefined {
  try {
    const { chainId } = parseCaipAssetType(assetId as CaipAssetType);
    const hexChainId = convertCaipToHexChainId(chainId as CaipChainId);
    return CHAIN_ID_TOKEN_IMAGE_MAP[
      hexChainId as keyof typeof CHAIN_ID_TOKEN_IMAGE_MAP
    ];
  } catch {
    return undefined;
  }
}

const sanitizeTokens = (tokens: ActivityListItemAvatarTokens): string[] =>
  tokens.filter((token): token is string => Boolean(token));

const ActivityTokenAvatar = ({
  assetId,
  className,
}: Readonly<{ assetId: string; className?: string }>) => {
  const cdnSrc = getCaipAssetImageUrl(assetId as CaipAssetType);
  const [src, setSrc] = useState(cdnSrc);

  useEffect(() => {
    setSrc(cdnSrc);
  }, [cdnSrc]);

  const handleImageError = () => {
    if (!isNativeAssetId(assetId)) {
      return;
    }

    const localNativeImage = getNativeImageForAssetId(assetId);
    if (localNativeImage && localNativeImage !== src) {
      setSrc(localNativeImage);
    }
  };

  return (
    // Remount when src changes so AvatarToken clears its internal error state.
    <AvatarToken
      key={src}
      size={AvatarTokenSize.Md}
      name={fallbackText}
      src={src}
      className={classnames(className)}
      imageProps={{
        className: 'bg-alternative',
        onError: handleImageError,
      }}
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
