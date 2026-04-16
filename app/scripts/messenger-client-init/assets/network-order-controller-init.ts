import {
  NetworkOrderController,
  NetworkOrderControllerMessenger,
  NetworkOrderControllerState,
} from '../../controllers/network-order';
import { MessengerClientInitFunction } from '../types';

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

export const NetworkOrderControllerInit: MessengerClientInitFunction<
  NetworkOrderController,
  NetworkOrderControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const messengerClient = new NetworkOrderController({
    messenger: controllerMessenger,
    state: {
      ...generateDefaultNetworkOrderControllerState(),
      ...persistedState.NetworkOrderController,
    },
  });

  return {
    messengerClient,
  };
};
