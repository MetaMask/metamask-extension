import { ControllerInitFunction } from '../types';
import {
  BrowserConnectivityController,
  BrowserConnectivityControllerMessenger,
} from '../../controllers/connectivity';

/**
 * Initialize the BrowserConnectivityController.
 *
 * This controller monitors device connectivity using browser APIs
 * (navigator.onLine and online/offline events) and exposes the
 * current connectivity status via its state.
 *
 * @param request - The controller init request.
 * @param request.controllerMessenger - The messenger for the controller.
 * @param request.persistedState - The persisted state.
 * @returns The controller init result.
 */
export const BrowserConnectivityControllerInit: ControllerInitFunction<
  BrowserConnectivityController,
  BrowserConnectivityControllerMessenger
> = (request) => {
  const { controllerMessenger, persistedState } = request;

  const controller = new BrowserConnectivityController({
    messenger: controllerMessenger,
    state: persistedState.BrowserConnectivityController,
  });

  return {
    controller,
  };
};
