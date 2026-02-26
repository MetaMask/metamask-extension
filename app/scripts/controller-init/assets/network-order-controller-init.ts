import {
  NetworkOrderController,
  NetworkOrderControllerState,
} from '../../controllers/network-order';
import { NetworkOrderControllerMessenger } from '../messengers/assets';
import { ControllerInitFunction } from '../types';

const generateDefaultNetworkOrderControllerState =
  (): NetworkOrderControllerState => {
    if (
      process.env.METAMASK_DEBUG &&
      process.env.METAMASK_ENVIRONMENT === 'development' &&
      !process.env.IN_TEST
    ) {
      return {
        orderedNetworkList: [],
      };
    }

    return {
      orderedNetworkList: [],
    };
  };

export const NetworkOrderControllerInit: ControllerInitFunction<
  NetworkOrderController,
  NetworkOrderControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const controller = new NetworkOrderController({
    messenger: controllerMessenger,
    state: {
      ...generateDefaultNetworkOrderControllerState(),
      ...persistedState.NetworkOrderController,
    },
  });

  return {
    controller,
  };
};
