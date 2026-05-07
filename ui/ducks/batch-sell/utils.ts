import { formatAddressToAssetId } from '@metamask/bridge-controller';
import { CaipAssetType, parseCaipAssetType } from '@metamask/utils';

export function getChecksummedEvmAssetId(
  assetId: CaipAssetType,
): CaipAssetType {
  try {
    const { assetNamespace, assetReference, chainId } =
      parseCaipAssetType(assetId);

    if (assetNamespace !== 'erc20' || !chainId.startsWith('eip155:')) {
      return assetId;
    }

    return formatAddressToAssetId(assetReference, chainId) ?? assetId;
  } catch {
    return assetId;
  }
}
