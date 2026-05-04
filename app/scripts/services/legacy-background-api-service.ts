import { Messenger } from '@metamask/messenger';

const serviceName = 'LegacyBackgroundApiService';

/**
 * The methods that the {@link LegacyBackgroundApiService} exposes to the messenger.
 * This is currently empty, but it can be extended in the future to replace `MetaMaskController.getApi()`.
 */
const MESSENGER_EXPOSED_METHODS = [] as const;

/**
 * The actions that the {@link LegacyBackgroundApiService} can handle.
 * This type is currently empty, but it can be extended in the future to replace `MetaMaskController.getApi()`.
 */
export type LegacyBackgroundApiServiceActions = never;

/**
 * The {@link LegacyBackgroundApiService} messenger.
 */
export type LegacyBackgroundApiServiceMessenger = Messenger<
  typeof serviceName,
  LegacyBackgroundApiServiceActions,
  never
>;

/**
 * The options required to initialize the {@link LegacyBackgroundApiService}.
 */
type LegacyBackgroundApiServiceOptions = {
  messenger: LegacyBackgroundApiServiceMessenger;
};

/**
 * The `LegacyBackgroundApiService` provides an interface for the background API that is compatible with the existing MetaMaskController.getApi() method.
 * It is intended to be a temporary solution until all of the functionality of the background API can be migrated to the new modular architecture.
 * This service should not contain any new functionality, but should instead delegate to other services or controllers as needed.
 * Once the migration is complete, this service can be removed.
 *
 * @deprecated This service is a temporary solution and should not be used for new functionality.
 * It will be removed once the migration to the new modular architecture is complete.
 */
export class LegacyBackgroundApiService {
  name: typeof serviceName = serviceName;

  readonly #messenger: LegacyBackgroundApiServiceMessenger;

  /**
   * Creates a new instance of the LegacyBackgroundApiService.
   * @param options - The options required to initialize the LegacyBackgroundApiService.
   * @param options.messenger - The messenger instance used for communication.
   */
  constructor({ messenger }: LegacyBackgroundApiServiceOptions) {
    this.#messenger = messenger;

    this.#messenger.registerMethodActionHandlers(
      this,
      MESSENGER_EXPOSED_METHODS,
    );
  }
}
