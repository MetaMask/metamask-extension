import { BridgeToken } from '../../../ducks/bridge/types';
import { BridgeAssetSecurityDataType } from '../utils/tokens';

export const useAssetSecurityData = (asset: BridgeToken) => {
  const assetIsVerified =
    asset.securityData?.type === BridgeAssetSecurityDataType.VERIFIED ||
    asset.isVerified;
  const assetIsSuspicious =
    asset.securityData?.type === BridgeAssetSecurityDataType.WARNING ||
    asset.securityData?.type === BridgeAssetSecurityDataType.SPAM;
  const assetIsMalicious =
    asset.securityData?.type === BridgeAssetSecurityDataType.MALICIOUS;
  const assetHasSecurityData = Boolean(asset.securityData);

  return {
    assetHasSecurityData,
    assetIsVerified,
    assetIsSuspicious,
    assetIsMalicious,
  };
};
