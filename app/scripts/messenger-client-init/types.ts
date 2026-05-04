import type {
  Messenger,
  ActionConstraint,
  EventConstraint,
} from '@metamask/messenger';
import { Duplex } from 'readable-stream';
import { SubjectType } from '@metamask/permission-controller';
import { PreinstalledSnap } from '@metamask/snaps-controllers';
import { Browser } from 'webextension-polyfill';
import { Encryptor } from '@metamask/keyring-controller';
import { KeyringClass } from '@metamask/keyring-utils';
import { QrKeyringScannerBridge } from '@metamask/eth-qr-keyring';
import type { TransactionMetricsRequest } from '../../../shared/types';
import { MessageSender } from '../../../types/global';
import type { CronjobControllerStorageManager } from '../lib/CronjobControllerStorageManager';
import { HardwareTransportBridgeClass } from '../lib/hardware-keyring-builder-factory';
import ExtensionPlatform from '../platforms/extension';
// This import is only used for the type.
// eslint-disable-next-line import-x/no-restricted-paths
import type { MetaMaskReduxState } from '../../../ui/store/store';
import { MessengerClient, MessengerClientFlatState } from './controller-list';

/** The supported messenger client names. */
export type MessengerClientName = MessengerClient['name'];

/** All messenger client types by name. */
export type MessengerClientByName = {
  [name in MessengerClientName]: MessengerClient & { name: name };
};

/**
 * Persisted state for all messenger clients.
 * e.g. `{ TransactionController: { transactions: [] } }`.
 */
export type MessengerClientPersistedState = Partial<{
  [name in MessengerClientName]: Partial<
    MessengerClientByName[name] extends { state: unknown }
      ? MessengerClientByName[name]['state']
      : never
  >;
}>;

/** Generic controller messenger using base template types. */
export type BaseControllerMessenger = Messenger<
  string,
  ActionConstraint,
  EventConstraint
>;

/** Generic restricted controller messenger using base template types. */
export type BaseRestrictedControllerMessenger = Messenger<
  string,
  ActionConstraint,
  EventConstraint
>;

type SnapSender = {
  snapId: string;
};

type Sender = MessageSender | SnapSender;

/**
 * Request to initialize and return a messenger client instance.
 * Includes standard data and methods not coupled to any specific messenger client.
 */
export type MessengerClientInitRequest<
  ControllerMessengerType extends BaseRestrictedControllerMessenger,
  InitMessengerType extends void | BaseRestrictedControllerMessenger = void,
> = {
  /**
   * Required controller messenger instance.
   * Generated using the callback specified in `getControllerMessengerCallback`.
   */
  controllerMessenger: ControllerMessengerType;

  /**
   * The current version of the extension, used for migrations.
   */
  currentMigrationVersion: number;

  /**
   * An instance of an encryptor to use for encrypting and decrypting
   * sensitive data.
   */
  encryptor: Encryptor;

  /**
   * Returns a promise that resolves when onboarding has been completed.
   */
  ensureOnboardingComplete: () => Promise<void>;

  /**
   * The extension browser API.
   */
  extension: Browser;

  /**
   * Extension platform handler
   */
  platform: ExtensionPlatform;

  /**
   * Retrieve a messenger client instance by name.
   * Throws an error if the messenger client is not yet initialized.
   *
   * @param name - The name of the messenger client to retrieve.
   */
  getMessengerClient<Name extends MessengerClientName>(
    name: Name,
  ): MessengerClientByName[Name];

  /**
   * Retrieve the flat state for all messenger clients.
   * For example: `{ transactions: [] }`.
   *
   * @deprecated Subscribe to other controller state via the messenger.
   */
  getFlatState: () => MessengerClientFlatState;

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
   * Get the MetaMask state of the client available to the UI.
   */
  getUIState(): MetaMaskReduxState['metamask'];

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
   * A promise that resolves when the offscreen document is ready.
   */
  offscreenPromise: Promise<void>;

  /**
   * The full persisted state for all messenger clients.
   * Includes messenger client name properties.
   * e.g. `{ TransactionController: { transactions: [] } }`.
   */
  persistedState: MessengerClientPersistedState;

  /**
   * Remove an account from keyring state.
   */
  removeAccount(address: string): Promise<string>;

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
   * Create a multiplexed CAIP-25 stream for connecting to an untrusted context like a
   * like a website, Snap, or other extension.
   *
   * @param options - The options for creating the stream.
   * @param options.connectionStream - The stream to connect to the untrusted
   * context.
   * @param options.sender - The sender of the stream.
   * @param options.subjectType - The type of the subject of the stream.
   */
  setupUntrustedCommunicationCaip(options: {
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
   * Show the confirmation UI to the user.
   */
  showUserConfirmation: () => void | Promise<void>;

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
export type MessengerClientApi = (...args: any[]) => unknown;

/**
 * Result of initializing a messenger client instance.
 */
export type MessengerClientInitResult<
  MessengerClientType extends MessengerClient,
> = {
  /**
   * The initialized messenger client instance.
   */
  messengerClient: MessengerClientType;

  /**
   * The background API methods available for the messenger client.
   */
  api?: Record<string, MessengerClientApi>;

  /**
   * The key used to store the messenger client state in the persisted store.
   * Defaults to the messenger client `name` property if `undefined`.
   * If `null`, the messenger client state will not be persisted.
   */
  persistedStateKey?: string | null;

  /**
   * The key used to store the messenger client state in the memory-only store.
   * Defaults to the messenger client `name` property if `undefined`.
   * If `null`, the messenger client state will not be synchronized with the UI state.
   */
  memStateKey?: string | null;
};

/**
 * Function to initialize a messenger client instance and return associated data.
 */
export type MessengerClientInitFunction<
  MessengerClientType extends MessengerClient,
  ControllerMessengerType extends BaseRestrictedControllerMessenger,
  InitMessengerType extends void | BaseRestrictedControllerMessenger = void,
> = (
  request: MessengerClientInitRequest<
    ControllerMessengerType,
    InitMessengerType
  >,
) => MessengerClientInitResult<MessengerClientType>;
