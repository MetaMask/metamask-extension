import {
  NftController,
  NftControllerMessenger,
} from '@metamask/assets-controllers';
import { AssetType } from '@metamask/bridge-controller';
import { MessengerClientInitFunction } from '../types';
import { NftControllerInitMessenger } from '../messengers/assets';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { createEventBuilder, trackEvent } from '../../controllers/analytics';

/**
 * Initialize the NFT controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller.
 */
export const NftControllerInit: MessengerClientInitFunction<
  NftController,
  NftControllerMessenger,
  NftControllerInitMessenger
> = ({ controllerMessenger, persistedState }) => {
  const messengerClient = new NftController({
    state: persistedState.NftController,
    messenger: controllerMessenger,
    onNftAdded: ({ address, symbol, tokenId, standard, source }) =>
      trackEvent(
        createEventBuilder(MetaMetricsEventName.NftAdded)
          .addCategory(MetaMetricsEventCategory.Wallet)
          .addSensitiveProperties({
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
          })
          .build(),
      ),
  });

  return {
    messengerClient,
  };
};
