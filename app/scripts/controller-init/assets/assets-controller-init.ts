import {
  AssetsController,
  type AssetsControllerMessenger,
} from '@metamask/assets-controller';
import { ControllerInitFunction } from '../types';

/**
 * Initialize the AssetsController.
 *
 * The AssetsController manages asset data (balances, metadata, prices) across
 * multiple chains using a flexible data source architecture.
 */
export const AssetsControllerInit: ControllerInitFunction<
  AssetsController,
  AssetsControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const controller = new AssetsController({
    messenger: controllerMessenger,
    state: persistedState.AssetsController,
  });

  return {
    controller,
  };
};




