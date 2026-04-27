import { NftDetectionController } from '@metamask/assets-controllers';
import { MessengerClientInitFunction } from '../types';
import { NftDetectionControllerMessenger } from '../messengers/assets';

/**
 * Initialize the NFT detection controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.getMessengerClient - The function to get the controller.
 * @returns The initialized controller.
 */
export const NftDetectionControllerInit: MessengerClientInitFunction<
  NftDetectionController,
  NftDetectionControllerMessenger
> = (request) => {
  const { controllerMessenger, getMessengerClient } = request;

  const preferencesController = () =>
    getMessengerClient('PreferencesController');
  const nftController = () => getMessengerClient('NftController');

  const messengerClient = new NftDetectionController({
    messenger: controllerMessenger,
    addNfts: (...args) => nftController().addNfts(...args),
    getNftState: () => nftController().state,
    // added this to track previous value of useNftDetection, should be true on very first initializing of controller[]
    disabled: !preferencesController().state.useNftDetection,
  });

  return {
    messengerClient,
    persistedStateKey: null,
  };
};
