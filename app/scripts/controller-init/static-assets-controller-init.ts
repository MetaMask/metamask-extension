import { StaticAssetsController } from '../lib/static-assets-controller/static-assets-controller';
import { ControllerInitFunction } from './types';
import {
  StaticAssetsControllerMessenger,
  StaticAssetsControllerInitMessenger,
} from './messengers';
import { CHAIN_IDS } from '../../../shared/constants/network';

export const StaticAssetsControllerInit: ControllerInitFunction<
  StaticAssetsController,
  StaticAssetsControllerMessenger,
  StaticAssetsControllerInitMessenger
> = ({ controllerMessenger }) => {

  const controller = new StaticAssetsController({
    messenger: controllerMessenger,
    interval:  3 * 60 * 60 * 1000, // 3 hour
    supportedChains: [
      CHAIN_IDS.HYPE, // hyperevm
    ]
  });

  return {
    controller,
  };
};
