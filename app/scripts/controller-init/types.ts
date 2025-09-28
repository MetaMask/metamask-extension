import {
  ActionConstraint,
  Messenger,
  EventConstraint,
  RestrictedMessenger,
} from '@metamask/base-controller';
import { Duplex } from 'readable-stream';
import { SubjectType } from '@metamask/permission-controller';
import { PreinstalledSnap } from '@metamask/snaps-controllers';
import { TransactionMeta } from '@metamask/transaction-controller';
import { Browser } from 'webextension-polyfill';
import { ExportableKeyEncryptor } from '@metamask/keyring-controller';
import { KeyringClass } from '@metamask/keyring-utils';
import { QrKeyringScannerBridge } from '@metamask/eth-qr-keyring';
import type { TransactionMetricsRequest } from '../../../shared/types';
import { MessageSender } from '../../../types/global';
import type { CronjobControllerStorageManager } from '../lib/CronjobControllerStorageManager';
import { HardwareTransportBridgeClass } from '../lib/hardware-keyring-builder-factory';
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
export type ControllerPersistedState = Partial<{
  [name in ControllerName]: Partial<
    ControllerByName[name] extends { state: unknown }
      ? ControllerByName[name]['state']
      : never
  >;
}>;

/** Generic controller messenger using base template types. */
export type BaseControllerMessenger = Messenger<
  ActionConstraint,
  EventConstraint
>;

/** Generic restricted controller messenger using base template types. */
export type BaseRestrictedControllerMessenger = RestrictedMessenger<
  string,
  ActionConstraint,
  EventConstraint,
  string,
  string
>;

type SnapSender = {
  snapId: string;
};

type Sender = MessageSender | SnapSender;

/**
 * Request to initialize and return a controller instance.
 * Includes standard data and methods not coupled to any specific controller.
 */
export type ControllerInitRequest<
  ControllerMessengerType extends BaseRestrictedControllerMessenger,
  InitMessengerType extends void | BaseRestrictedControllerMessenger = void,
> = {
  /**
   * Required controller messenger instance.
   * Generated using the callback specified in `getControllerMessengerCallback`.
   */
  controllerMessenger: ControllerMessengerType;

  /**
   * An instance of an encryptor to use for encrypting and decrypting
   * sensitive data.
   */
  encryptor?: ExportableKeyEncryptor;

  /**
   * The extension browser API.
   */
  extension: Browser;

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
   * Retrieve a transaction metrics request instance.
   * Includes data and callbacks required to generate metrics.
   */
  getTransactionMetricsRequest(): TransactionMetricsRequest;

  /**
   * Overrides for the keyrings.
   */
  keyringOverrides?: {
    qr?: KeyringClass;
    qrBridge?: typeof QrKeyringScannerBridge;
    lattice?: KeyringClass;
    trezorBridge?: HardwareTransportBridgeClass;
    oneKey?: HardwareTransportBridgeClass;
    ledgerBridge?: HardwareTransportBridgeClass;
  };

  /**
   * The Infura project ID to use for the network controller.
   */
  infuraProjectId: string;

  /**
   * Function to update account balance for network of the transaction
   */
  updateAccountBalanceForTransactionNetwork(
    transactionMeta: TransactionMeta,
  ): void;

  /**
   * A promise that resolves when the offscreen document is ready.
   */
  offscreenPromise: Promise<void>;

  /**
   * The full persisted state for all controllers.
   * Includes controller name properties.
   * e.g. `{ TransactionController: { transactions: [] } }`.
   */
  persistedState: ControllerPersistedState;

  /**
   * Remove an account from keyring state.
   */
  removeAccount(address: string): Promise<string>;

  /**
   * Close all connections for the given origin, and removes the references
   * to them. Ignores unknown origins.
   *
   * @param origin - The origin for which to remove all connections.
   */
  removeAllConnections(origin: string): void;

  /**
   * Create a multiplexed stream for connecting to an untrusted context like a
   * like a website, Snap, or other extension.
   *
   * @param options - The options for creating the stream.
   * @param options.connectionStream - The stream to connect to the untrusted
   * context.
   * @param options.sender - The sender of the stream.
   * @param options.subjectType - The type of the subject of the stream.
   */
  setupUntrustedCommunicationEip1193(options: {
    connectionStream: Duplex;
    sender: Sender;
    subjectType: SubjectType;
  }): void;

  /**
   * Lock the extension.
   */
  setLocked(): void;

  /**
   * Show a native notification.
   *
   * @param title - The title of the notification.
   * @param message - The message of the notification.
   * @param url - The URL to open when the notification is clicked.
   */
  showNotification: (
    title: string,
    message: string,
    url?: string,
  ) => Promise<void>;

  /**
   * A list of preinstalled Snaps loaded from disk during boot.
   */
  preinstalledSnaps: PreinstalledSnap[];

  /**
   * Required initialization messenger instance.
   * Generated using the callback specified in `getInitMessengerCallback`.
   */
  initMessenger: InitMessengerType;

  getCronjobControllerStorageManager: () => CronjobControllerStorageManager;

  /**
   * The user's preferred language code, if any.
   */
  initLangCode: string | null;
};

/**
 * A single background API method available to the UI.
 */

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
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
   * If `null`, the controller state will not be synchronized with the UI state.
   */
  memStateKey?: string | null;
};

/**
 * Function to initialize a controller instance and return associated data.
 */
export type ControllerInitFunction<
  ControllerType extends Controller,
  ControllerMessengerType extends BaseRestrictedControllerMessenger,
  InitMessengerType extends void | BaseRestrictedControllerMessenger = void,
> = (
  request: ControllerInitRequest<ControllerMessengerType, InitMessengerType>,
) => ControllerInitResult<ControllerType>;
