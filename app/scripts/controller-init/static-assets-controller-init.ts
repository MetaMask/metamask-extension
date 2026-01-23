import { StaticAssetsController } from '../controllers/static-assets-controller';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { ControllerInitFunction } from './types';
import {
  StaticAssetsControllerMessenger,
  StaticAssetsControllerInitMessenger,
} from './messengers';

export const StaticAssetsControllerInit: ControllerInitFunction<
  StaticAssetsController,
  StaticAssetsControllerMessenger,
  StaticAssetsControllerInitMessenger
> = ({ controllerMessenger }) => {
  const controller = new StaticAssetsController({
    messenger: controllerMessenger,
    interval: 3 * 60 * 60 * 1000, // 3 hour
    supportedChains: [
      CHAIN_IDS.HYPE, // hyperevm
    ],
  });

  return {
    controller,
  };
};
