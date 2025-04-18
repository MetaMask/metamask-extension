import { NftDetectionController } from '@metamask/assets-controllers';
import { ControllerInitFunction } from '../types';
import { NftDetectionControllerMessenger } from '../messengers/assets';

/**
 * Initialize the NFT detection controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.getController - The function to get the controller.
 * @returns The initialized controller.
 */
export const NftDetectionControllerInit: ControllerInitFunction<
  NftDetectionController,
  NftDetectionControllerMessenger
> = (request) => {
  const { controllerMessenger, getController } = request;

  const preferencesController = () => getController('PreferencesController');
  const nftController = () => getController('NftController');

  const controller = new NftDetectionController({
    messenger: controllerMessenger,
    addNft: (...args) => nftController().addNft(...args),
    getNftState: () => nftController().state,
    // added this to track previous value of useNftDetection, should be true on very first initializing of controller[]
    disabled: !preferencesController().state.useNftDetection,
  });

  return {
    controller,
  };
};
