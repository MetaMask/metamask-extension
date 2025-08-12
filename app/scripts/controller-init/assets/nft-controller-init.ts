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
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_contract_address: address,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_symbol: symbol ?? null,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_id: tokenId,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_standard: standard,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          asset_type: AssetType.NFT,
          source,
        },
      }),
  });

  return {
    controller,
  };
};
