import { SelectedNetworkController } from '@metamask/selected-network-controller';
import { WeakRefObjectMap } from '../lib/WeakRefObjectMap';
import { SelectedNetworkControllerMessenger } from './messengers';
import { ControllerInitFunction } from './types';

/**
 * Initialize the selected network controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller.
 */
export const SelectedNetworkControllerInit: ControllerInitFunction<
  SelectedNetworkController,
  SelectedNetworkControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const controller = new SelectedNetworkController({
    // @ts-expect-error: `SelectedNetworkController` expects the full state, but
    // the persisted state may be partial.
    state: persistedState.SelectedNetworkController,
    messenger: controllerMessenger,
    domainProxyMap: new WeakRefObjectMap(),
  });

  return {
    controller,
  };
};
