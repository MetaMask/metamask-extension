import { useMemo } from 'react';
import { BridgeToken } from '../../../ducks/bridge/types';
import { mapAssetSecurityDataFeatureToLocalizedFormat } from '../utils/asset-features';
import { BridgeAssetSecurityDataType } from '../utils/tokens';
import { useI18nContext } from '../../../hooks/useI18nContext';

export const useAssetSecurityData = (asset: BridgeToken) => {
  const t = useI18nContext();
  const assetIsVerified =
    asset.securityData?.type === BridgeAssetSecurityDataType.VERIFIED ||
    asset.isVerified;
  const assetIsSuspicious =
    asset.securityData?.type === BridgeAssetSecurityDataType.WARNING ||
    asset.securityData?.type === BridgeAssetSecurityDataType.SPAM;
  const assetIsMalicious =
    asset.securityData?.type === BridgeAssetSecurityDataType.MALICIOUS;
  const assetHasSecurityData = Boolean(asset.securityData);

  const assetSuspiciousLocalizedFeatures = useMemo(
    () =>
      asset.securityData?.metadata?.features
        .filter(
          (feature) =>
            feature.type === BridgeAssetSecurityDataType.WARNING ||
            feature.type === BridgeAssetSecurityDataType.SPAM,
        )
        .map(mapAssetSecurityDataFeatureToLocalizedFormat(asset.symbol, t))
        .filter(
          (
            value,
          ): value is NonNullable<
            ReturnType<
              ReturnType<typeof mapAssetSecurityDataFeatureToLocalizedFormat>
            >
          > => Boolean(value),
        ) ?? [],
    [asset, t],
  );

  const assetMaliciousLocalizedFeatures = useMemo(
    () =>
      asset.securityData?.metadata?.features
        .filter(
          (feature) => feature.type === BridgeAssetSecurityDataType.MALICIOUS,
        )
        .map(mapAssetSecurityDataFeatureToLocalizedFormat(asset.symbol, t))
        .filter(
          (
            value,
          ): value is NonNullable<
            ReturnType<
              ReturnType<typeof mapAssetSecurityDataFeatureToLocalizedFormat>
            >
          > => Boolean(value),
        ) ?? [],
    [asset, t],
  );

  return {
    assetHasSecurityData,
    assetIsVerified,
    assetIsSuspicious,
    assetIsMalicious,
    assetSuspiciousLocalizedFeatures,
    assetMaliciousLocalizedFeatures,
  };
};
