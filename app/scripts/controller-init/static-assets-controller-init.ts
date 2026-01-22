import { StaticAssetsController } from '../lib/static-assets-controller/static-assets-controller';
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
    interval: 10000, // 10 seconds
    supportedChains: [
      '0x3e7', // hyperevm
    ],
  });

  return {
    controller,
  };
};
