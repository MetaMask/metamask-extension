import { Provider } from '@metamask/network-controller';
import {
  ActionConstraint,
  ControllerMessenger,
  EventConstraint,
  RestrictedControllerMessenger,
} from '@metamask/base-controller';
import { TransactionMetricsRequest } from '../lib/transaction/metrics';

/** Generic controller messenger using base template types. */
export type BaseControllerMessenger = ControllerMessenger<
  ActionConstraint,
  EventConstraint
>;

/** Generic restricted controller messenger using base template types. */
export type BaseRestrictedControllerMessenger = RestrictedControllerMessenger<
  string,
  ActionConstraint,
  EventConstraint,
  string,
  string
>;

/**
 * Supported controller names.
 * Used to retrieve controllers using the `getController` method from `ControllerInitRequest`.
 */
export enum ControllerName {
  GasFeeController = 'GasFeeController',
  KeyringController = 'KeyringController',
  NetworkController = 'NetworkController',
  OnboardingController = 'OnboardingController',
  PermissionController = 'PermissionController',
  PPOMController = 'PPOMController',
  PreferencesController = 'PreferencesController',
  SmartTransactionsController = 'SmartTransactionsController',
  TransactionController = 'TransactionController',
  TransactionUpdateController = 'TransactionUpdateController',
}

/**
 * Request to initialize and return a controller instance.
 * Includes standard data and methods not coupled to any specific controller.
 */
export type ControllerInitRequest<
  ControllerMessengerType extends void | BaseRestrictedControllerMessenger = void,
  InitMessengerType extends void | BaseRestrictedControllerMessenger = void,
> = {
  /**
   * Required controller messenger instance.
   * Generated using the callback specified in `getControllerMessengerCallback`.
   */
  controllerMessenger: ControllerMessengerType extends BaseRestrictedControllerMessenger
    ? ControllerMessengerType
    : never;

  /**
   * Retrieve a controller instance by name.
   * Throws an error if the controller is not yet initialized.
   *
   * @param name - The name of the controller to retrieve.
   */
  getController<T>(name: ControllerName): T;

  /**
   * Retrieves the full flattened UI state.
   * Includes no controller name properties.
   * For example: `{ transactions: [] }`.
   */
  getFlatState(): unknown;

  /**
   * @deprecated
   * Retrieve the chain ID of the globally selected network.
   * Will be removed in the future pending multi-chain support.
   */
  getGlobalChainId(): string;

  /**
   * Retrieve the permitted accounts for a given origin.
   *
   * @param origin - The origin for which to retrieve permitted accounts.
   * @param options - Additional options for the request.
   * @param options.suppressUnauthorizedError - Whether to not throw if an unauthorized error occurs. Defaults to `true`.
   */
  getPermittedAccounts(
    origin: string,
    options?: { suppressUnauthorizedError?: boolean },
  ): Promise<string[]>;

  /**
   * @deprecated
   * Retrieve the provider instance for the globally selected network.
   * Will be removed in the future pending multi-chain support.
   */
  getProvider: () => Provider;

  /**
   * Retrieve the full UI state.
   * Includes reducer properties.
   * For example: `{ metamask: { transactions: [] } }`.
   */
  getStateUI: () => unknown & { metamask: unknown };

  /**
   * Retrieve a transaction metrics request instance.
   * Includes data and callbacks required to generate metrics.
   */
  getTransactionMetricsRequest(): TransactionMetricsRequest;

  /**
   * Required initialization messenger instance.
   * Generated using the callback specified in `getInitMessengerCallback`
   */
  initMessenger: InitMessengerType extends BaseRestrictedControllerMessenger
    ? InitMessengerType
    : never;

  /**
   * The full persisted state for all controllers.
   * Includes controller name properties.
   * e.g. `{ TransactionController: { transactions: [] } }`.
   */
  persistedState: Record<string, unknown>;
};

/**
 * Request to generate the background API methods available for a controller.
 */
export type ControllerGetApiRequest<ControllerType> = {
  /**
   * The controller instance to generate API methods for.
   */
  controller: ControllerType;

  /**
   * Retrieve the full flattened UI state.
   * Includes no controller name properties.
   * For example: `{ transactions: [] }`.
   */
  getFlatState: () => unknown;
};

/**
 * A single background API method available to the UI.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ControllerApi = (...args: any[]) => unknown;

/**
 * The background API methods available for a controller.
 */
export type ControllerGetApiResponse = Record<string, ControllerApi>;

/**
 * Abstract class to define how to initialize a single controller.
 * `ControllerType` is the type of the controller.
 * `ControllerMessengerType` is the messenger required by the controller itself.
 * `InitMessengerType` is the messenger required by the client to initialize the controller and register related listeners.
 */
export abstract class ControllerInit<
  ControllerType extends { name: string },
  ControllerMessengerType extends void | BaseRestrictedControllerMessenger = void,
  InitMessengerType extends void | BaseRestrictedControllerMessenger = void,
> {
  /**
   * Initialize and return the controller instance.
   *
   * @param request - The request object containing data and methods required to initialize the controller.
   * @returns The initialized controller instance.
   */
  abstract init(
    request: ControllerInitRequest<ControllerMessengerType, InitMessengerType>,
  ): ControllerType;

  /**
   * Specify a function to generate the required controller messenger, given the provided base messenger.
   * If not specified, no controller messenger will be provided in the init request.
   */
  getControllerMessengerCallback(): ControllerMessengerType extends BaseRestrictedControllerMessenger
    ? (controllerMessenger: BaseControllerMessenger) => ControllerMessengerType
    : never {
    return undefined as never;
  }

  /**
   * Specify a function to generate the required init messenger, given the provided base messenger.
   * If not specified, no init messenger will be provided in the init request.
   */
  getInitMessengerCallback(): InitMessengerType extends BaseRestrictedControllerMessenger
    ? (controllerMessenger: BaseControllerMessenger) => InitMessengerType
    : never {
    return undefined as never;
  }

  /**
   * Return the background API methods available for the controller.
   *
   * @param _request - The request object containing the controller instance.
   * @returns The background API methods available for the controller.
   */
  getApi(
    _request: ControllerGetApiRequest<ControllerType>,
  ): ControllerGetApiResponse {
    return {};
  }

  /**
   * Specify the key used to store the controller state in the persisted store.
   * Defaults to the controller `name` property.
   * If `undefined`, the controller state will not be persisted.
   *
   * @param controller - The controller instance.
   * @returns The persisted state key for the controller.
   */
  getPersistedStateKey(controller: ControllerType): string | undefined {
    return controller.name;
  }

  /**
   * Specify the key used to store the controller state in the memory-only store.
   * Defaults to the controller `name` property.
   * If `undefined`, the controller state will not be stored in memory.
   *
   * @param controller - The controller instance.
   * @returns The memory state key for the controller.
   */
  getMemStateKey(controller: ControllerType): string | undefined {
    return controller.name;
  }
}
