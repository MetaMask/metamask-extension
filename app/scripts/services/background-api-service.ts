import { Messenger } from '@metamask/messenger';

const serviceName = 'BackgroundApiService';

/**
 * The methods that the {@link BackgroundApiService} exposes to the messenger.
 * This is currently empty, but it can be extended in the future to replace `MetaMaskController.getApi()`.
 */
const MESSENGER_EXPOSED_METHODS = [] as const;

/**
 * The actions that the {@link BackgroundApiService} can handle.
 * This type is currently empty, but it can be extended in the future to replace `MetaMaskController.getApi()`.
 */
export type BackgroundApiServiceActions = never;

/**
 * The {@link BackgroundApiService} messenger.
 */
export type BackgroundApiServiceMessenger = Messenger<
  typeof serviceName,
  BackgroundApiServiceActions,
  never
>;

/**
 * The options required to initialize the {@link BackgroundApiService}.
 */
type BackgroundApiServiceOptions = {
  messenger: BackgroundApiServiceMessenger;
};

/**
 * The background API service is responsible for handling messages sent to the background context that are not specific to any controller.
 * It can be used for tasks such as managing global state, handling events that are not tied to a specific controller, or providing
 * utility functions that can be accessed from any context.
 */
export class BackgroundApiService {
  name: typeof serviceName = serviceName;

  readonly #messenger: BackgroundApiServiceMessenger;
  /**
   * Creates a new instance of the BackgroundApiService.
   * @param options - The options required to initialize the BackgroundApiService.
   * @param options.messenger - The messenger instance used for communication.
   */
  constructor({ messenger }: BackgroundApiServiceOptions) {
    this.#messenger = messenger;

    this.#messenger.registerMethodActionHandlers(
      this,
      MESSENGER_EXPOSED_METHODS,
    );
  }
}
