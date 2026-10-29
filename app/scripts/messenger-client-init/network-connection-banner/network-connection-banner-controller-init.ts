import {
  NetworkConnectionBannerController,
  type NetworkConnectionBannerControllerMessenger,
} from '@metamask/network-connection-banner-controller';

import { MessengerClientInitFunction } from '../types';

/**
 * Initialize the NetworkConnectionBannerController.
 *
 * Encapsulates the show/hide rule and 5s/30s timer state machine for the
 * "Still connecting" / "Unable to connect" banner. Manages its own lifecycle
 * from ClientController and KeyringController events and subscribes to
 * NetworkController, NetworkEnablementController, and ConnectivityController
 * state via the messenger.
 *
 * @param request - The controller init request.
 * @param request.controllerMessenger - The messenger for the controller.
 * @param request.infuraProjectId - The wallet's Infura project id.
 * @returns The controller init result.
 */
export const NetworkConnectionBannerControllerInit: MessengerClientInitFunction<
  NetworkConnectionBannerController,
  NetworkConnectionBannerControllerMessenger
> = (request) => {
  const { controllerMessenger, infuraProjectId } = request;

  const messengerClient = new NetworkConnectionBannerController({
    messenger: controllerMessenger,
    infuraProjectId,
  });

  return {
    messengerClient,
  };
};
