import {
  NetworkConnectionBannerController,
  type NetworkConnectionBannerControllerMessenger,
} from '@metamask/network-connection-banner-controller';

import { MessengerClientInitFunction } from '../types';

/**
 * Initialize the NetworkConnectionBannerController.
 *
 * Encapsulates the show/hide rule and 5s/30s timer state machine for the
 * "Still connecting" / "Unable to connect" banner. Subscribes to
 * NetworkController, NetworkEnablementController, and ConnectivityController
 * state via the messenger.
 *
 * @param request - The controller init request.
 * @param request.controllerMessenger - The messenger for the controller.
 * @returns The controller init result.
 */
export const NetworkConnectionBannerControllerInit: MessengerClientInitFunction<
  NetworkConnectionBannerController,
  NetworkConnectionBannerControllerMessenger
> = (request) => {
  const { controllerMessenger } = request;

  const messengerClient = new NetworkConnectionBannerController({
    messenger: controllerMessenger,
  });

  return {
    messengerClient,
    persistedStateKey: null,
  };
};
