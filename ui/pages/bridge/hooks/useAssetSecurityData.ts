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

  const assetSuspiciousFeatures = useMemo(
    () =>
      asset.securityData?.metadata?.features.filter(
        (feature) =>
          feature.type === BridgeAssetSecurityDataType.WARNING ||
          feature.type === BridgeAssetSecurityDataType.SPAM,
      ) ?? [],
    [asset],
  );

  const assetMaliciousFeatures = useMemo(
    () =>
      asset.securityData?.metadata?.features.filter(
        (feature) => feature.type === BridgeAssetSecurityDataType.MALICIOUS,
      ) ?? [],
    [asset],
  );

  const assetSuspiciousLocalizedFeatures = useMemo(
    () =>
      assetSuspiciousFeatures
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
    [assetSuspiciousFeatures, asset, t],
  );

  const assetMaliciousLocalizedFeatures = useMemo(
    () =>
      assetMaliciousFeatures
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
    [assetMaliciousFeatures, asset, t],
  );

  return {
    assetHasSecurityData,
    assetIsVerified,
    assetIsSuspicious,
    assetIsMalicious,
    assetSuspiciousFeatures,
    assetMaliciousFeatures,
    assetSuspiciousLocalizedFeatures,
    assetMaliciousLocalizedFeatures,
  };
};
