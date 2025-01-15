import { Provider } from '@metamask/network-controller';
import {
  ActionConstraint,
  ControllerMessenger,
  EventConstraint,
  RestrictedControllerMessenger,
} from '@metamask/base-controller';
import { TransactionMetricsRequest } from '../lib/transaction/metrics';
import { Controller, ControllerFlatState } from './controller-list';

export type ControllerName = Controller['name'];

export type ControllerByName = {
  [name in ControllerName]: Controller & { name: name };
};

export type ControllerPersistedState = {
  [name in ControllerName]: ControllerByName[name]['state'];
};

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
  getController<Name extends ControllerName>(
    name: Name,
  ): ControllerByName[Name];

  /**
   * Retrieve the chain ID of the globally selected network.
   *
   * @deprecated Will be removed in the future pending multi-chain support.
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
   * Retrieve the provider instance for the globally selected network.
   *
   * @deprecated Will be removed in the future pending multi-chain support.
   */
  getProvider: () => Provider;

  /**
   * Retrieve the flat state for all controllers.
   * For example: `{ transactions: [] }`.
   *
   * @deprecated Subscribe to other controller state via the messenger.
   */
  getFlatState: () => ControllerFlatState;

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
  persistedState: ControllerPersistedState;
};

/**
 * Request to generate the background API methods available for a controller.
 */
export type ControllerGetApiRequest<ControllerType> = {
  /**
   * The controller instance to generate API methods for.
   */
  controller: ControllerType;
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
  ControllerType extends Controller,
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
