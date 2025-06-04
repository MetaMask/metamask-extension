import { NftController } from '@metamask/assets-controllers';
import { AssetType } from '@metamask/bridge-controller';
import { ControllerInitFunction } from '../types';
import { NftControllerMessenger } from '../messengers/assets/nft-controller-messenger';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';

/**
 * Initialize the NFT controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @param request.trackEvent - The function to track events.
 * @returns The initialized controller.
 */
export const NftControllerInit: ControllerInitFunction<
  NftController,
  NftControllerMessenger
> = ({ controllerMessenger, persistedState, trackEvent }) => {
  const controller = new NftController({
    state: persistedState.NftController,
    messenger: controllerMessenger,
    onNftAdded: ({ address, symbol, tokenId, standard, source }) =>
      trackEvent({
        event: MetaMetricsEventName.NftAdded,
        category: MetaMetricsEventCategory.Wallet,
        sensitiveProperties: {
          token_contract_address: address,
          token_symbol: symbol ?? null,
          token_id: tokenId,
          token_standard: standard,
          asset_type: AssetType.NFT,
          source,
        },
      }),
  });

  return {
    controller,
  };
};
