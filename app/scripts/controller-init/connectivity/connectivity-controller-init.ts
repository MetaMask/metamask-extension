import { ConnectivityController } from '@metamask/connectivity-controller';
import type { ConnectivityControllerMessenger } from '@metamask/connectivity-controller';

import { ControllerInitFunction } from '../types';
import { ExtensionConnectivityAdapter } from '../../controllers/connectivity';

/**
 * Initialize the ConnectivityController.
 *
 * This controller stores device connectivity status. For the extension,
 * we use a ExtensionConnectivityAdapter since the actual detection happens
 * in a different context where browser events work reliably:
 * - MV3: Offscreen document (app/offscreen/connectivity.ts)
 * - MV2: Background page (app/scripts/background.js)
 *
 * The status is synced to this controller via the setDeviceConnectivityStatus API.
 *
 * @param request - The controller init request.
 * @param request.controllerMessenger - The messenger for the controller.
 * @returns The controller init result.
 */
export const ConnectivityControllerInit: ControllerInitFunction<
  ConnectivityController,
  ConnectivityControllerMessenger
> = (request) => {
  const { controllerMessenger } = request;

  // Use ExtensionConnectivityAdapter for extension since detection happens in:
  // - MV3: Offscreen document (app/offscreen/connectivity.ts)
  // - MV2: Background page directly (app/scripts/background.js)
  const connectivityAdapter = new ExtensionConnectivityAdapter();

  const controller = new ConnectivityController({
    messenger: controllerMessenger,
    connectivityAdapter,
  });

  return {
    controller,
    api: {
      setDeviceConnectivityStatus: (status: 'online' | 'offline') =>
        connectivityAdapter.setStatus(status),
    },
    persistedStateKey: null,
  };
};
