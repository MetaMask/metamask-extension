import {
  ENSNameProvider,
  EtherscanNameProvider,
  LensNameProvider,
  NameController,
  TokenNameProvider,
} from '@metamask/name-controller';
import {
  NameControllerInitMessenger,
  NameControllerMessenger,
} from '../messengers';
import { MessengerClientInitFunction } from '../types';

/**
 * Initialize the name controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @param request.initMessenger
 * @param request.getMessengerClient
 * @returns The initialized controller.
 */
export const NameControllerInit: MessengerClientInitFunction<
  NameController,
  NameControllerMessenger,
  NameControllerInitMessenger
> = ({
  controllerMessenger,
  initMessenger,
  persistedState,
  getMessengerClient,
}) => {
  const ensController = getMessengerClient('EnsController');
  const snapsNameProvider = getMessengerClient('SnapsNameProvider');

  const isExternalNameSourcesEnabled = () =>
    initMessenger.call('PreferencesController:getState').useExternalNameSources;

  const messengerClient = new NameController({
    messenger: controllerMessenger,
    state: persistedState.NameController,
    providers: [
      new ENSNameProvider({
        // This uses a direct reference because `ENSController` doesn't expose
        // any actions through the messenger to do this.
        // @ts-expect-error: `ENSController` returns
        // `Promise<string | undefined>`, but `ENSNameProvider` requires
        // `Promise<string>`.
        reverseLookup: ensController.reverseResolveAddress.bind(ensController),
      }),
      new EtherscanNameProvider({ isEnabled: isExternalNameSourcesEnabled }),
      new TokenNameProvider({ isEnabled: isExternalNameSourcesEnabled }),
      new LensNameProvider({ isEnabled: isExternalNameSourcesEnabled }),
      snapsNameProvider,
    ],
  });

  return {
    messengerClient,
  };
};
