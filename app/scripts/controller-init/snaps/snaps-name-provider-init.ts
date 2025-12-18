import { SnapsNameProvider } from '../../lib/SnapsNameProvider';
import { SnapsNameProviderMessenger } from '../messengers/snaps';
import { ControllerInitFunction } from '../types';

/**
 * Initialize the Snaps name provider.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the provider.
 * @returns The initialized provider.
 */
export const SnapsNameProviderInit: ControllerInitFunction<
  SnapsNameProvider,
  SnapsNameProviderMessenger
> = ({ controllerMessenger }) => {
  const controller = new SnapsNameProvider({
    messenger: controllerMessenger,
  });

  return {
    persistedStateKey: null,
    memStateKey: null,
    controller,
  };
};
