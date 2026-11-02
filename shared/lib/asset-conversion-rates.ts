import { CaipAssetType, parseCaipAssetType } from '@metamask/utils';
import { MultichainAssetsRatesControllerState } from '@metamask/assets-controllers';
import { AssetConversion, FungibleAssetMarketData } from '@metamask/snaps-sdk';

import { isNativeCaipAssetId } from './asset-utils';

type AssetsRatesState = {
  metamask: Pick<MultichainAssetsRatesControllerState, 'conversionRates'>;
};

export function getConversionRatesForNativeAsset({
  conversionRates,
  chainId,
}: {
  conversionRates: AssetsRatesState['metamask']['conversionRates'];
  chainId: string;
}): (AssetConversion & { marketData?: FungibleAssetMarketData }) | null {
  // Return early if conversionRates is falsy
  if (!conversionRates) {
    return null;
  }

  let conversionRateResult = null;

  Object.entries(conversionRates).forEach(
    ([caip19Identifier, conversionRate]) => {
      const { chainId: caipChainId } = parseCaipAssetType(
        caip19Identifier as CaipAssetType,
      );
      if (
        isNativeCaipAssetId(caip19Identifier as CaipAssetType) &&
        caipChainId === chainId
      ) {
        conversionRateResult = conversionRate;
      }
    },
  );

  return conversionRateResult;
}
