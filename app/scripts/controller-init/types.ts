import { Provider } from '@metamask/network-controller';
import {
  ActionConstraint,
  ControllerMessenger,
  EventConstraint,
  RestrictedControllerMessenger,
} from '@metamask/base-controller';
import { TransactionMetricsRequest } from '../lib/transaction/metrics';
import { Controller, ControllerFlatState } from './controller-list';

/** The supported controller names. */
export type ControllerName = Controller['name'];

/** All controller types by name. */
export type ControllerByName = {
  [name in ControllerName]: Controller & { name: name };
};

/**
 * Persisted state for all controllers.
 * e.g. `{ TransactionController: { transactions: [] } }`.
 */
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
export type ControllerInitRequest = {
  /**
   * Base controller messenger for the client.
   * Used to generate controller and init messengers for each controller.
   */
  baseControllerMessenger: BaseControllerMessenger;

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
   * Retrieve the flat state for all controllers.
   * For example: `{ transactions: [] }`.
   *
   * @deprecated Subscribe to other controller state via the messenger.
   */
  getFlatState: () => ControllerFlatState;

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
   * Retrieve a transaction metrics request instance.
   * Includes data and callbacks required to generate metrics.
   */
  getTransactionMetricsRequest(): TransactionMetricsRequest;

  /**
   * The full persisted state for all controllers.
   * Includes controller name properties.
   * e.g. `{ TransactionController: { transactions: [] } }`.
   */
  persistedState: ControllerPersistedState;
};

/**
 * A single background API method available to the UI.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ControllerApi = (...args: any[]) => unknown;

/**
 * Result of initializing a controller instance.
 */
export type ControllerInitResult<ControllerType extends Controller> = {
  /**
   * The initialized controller instance.
   */
  controller: ControllerType;

  /**
   * The background API methods available for the controller.
   */
  api?: Record<string, ControllerApi>;

  /**
   * The key used to store the controller state in the persisted store.
   * Defaults to the controller `name` property if `undefined`.
   * If `null`, the controller state will not be persisted.
   */
  persistedStateKey?: string | null;

  /**
   * The key used to store the controller state in the memory-only store.
   * Defaults to the controller `name` property if `undefined`.
   * If `null`, the controller state will not be stored in memory.
   */
  memStateKey?: string | null;
};

/**
 * Function to initialize a controller instance and return associated data.
 */
export type ControllerInitFunction<ControllerType extends Controller> = (
  request: ControllerInitRequest,
) => ControllerInitResult<ControllerType>;
