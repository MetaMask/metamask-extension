// Many of the state hooks return untyped raw state.

// In order for variables to be considered on the global scope they must be
// declared using var and not const or let, which is why this rule is disabled
/* eslint-disable no-var */

import * as Sentry from '@sentry/browser';
import {
  Success,
  Unsuccessful,
  PROTO,
  EthereumSignedTx,
  Params,
  EthereumSignTransaction,
  EthereumSignTypedHash,
  EthereumSignMessage,
  EthereumSignTypedDataTypes,
} from '@trezor/connect-web';
import type { Provider } from '@metamask/network-controller';
import * as Browser from 'webextension-polyfill';
import {
  OffscreenCommunicationTarget,
  TrezorAction,
} from '../shared/constants/offscreen-communication';
import type { Preferences } from '../app/scripts/controllers/preferences-controller';
import type ExtensionPlatform from '../app/scripts/platforms/extension';

declare class MessageSender {
  documentId?: string;

  documentLivecycle?: string;

  frameId?: number;

  id?: string;

  origin?: string;

  url?: string;
}

type SerializedLedgerError = {
  message: string;
  name?: string;
  stack?: string;
  // from TransportStatusError
  statusCode?: number;
  statusText?: string;
};

export type LedgerIframeMissingResponse = {
  success: false;
  payload: {
    error: SerializedLedgerError;
  };
};

type ResponseType =
  | Unsuccessful
  | Success<{ publicKey: string; chainCode: string }>
  | Success<EthereumSignedTx>
  | Success<PROTO.MessageSignature>
  | Success<PROTO.EthereumTypedDataSignature>
  | Record<string, unknown>
  | LedgerIframeMissingResponse;

/**
 * Defines an overloaded set of function call signatures for the chrome
 * runtime sendMessage function. Each of these are overloaded by specific
 * input values so that the correct type can be inferred in the callback
 * method
 */
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
type sendMessage = {
  (
    extensionId: string,
    message: Record<string, unknown>,
    options?: Record<string, unknown>,
    callback?: (response: Record<string, unknown>) => void,
  ): void;
  (
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    message: any,
    options?: Record<string, unknown>,
    callback?: (response: Record<string, unknown>) => void,
  ): void;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  <T extends EthereumSignTypedDataTypes>(
    message: {
      target: OffscreenCommunicationTarget.trezorOffscreen;
      action: TrezorAction.signTypedData;
      params: Params<EthereumSignTypedHash<T>>;
    },
    callback: (
      response: Unsuccessful | Success<PROTO.EthereumTypedDataSignature>,
    ) => void,
  ): Promise<Unsuccessful | Success<PROTO.EthereumTypedDataSignature>>;
  (
    message: {
      target: OffscreenCommunicationTarget.trezorOffscreen;
      action: TrezorAction.signTransaction;
      params: Params<EthereumSignTransaction>;
    },
    callback: (response: Unsuccessful | Success<EthereumSignedTx>) => void,
  ): Promise<Unsuccessful | Success<EthereumSignedTx>>;
  (
    message: {
      target: OffscreenCommunicationTarget.trezorOffscreen;
      action: TrezorAction.signMessage;
      params: Params<EthereumSignMessage>;
    },
    callback: (
      response: Unsuccessful | Success<PROTO.MessageSignature>,
    ) => void,
  ): Promise<Unsuccessful | Success<PROTO.MessageSignature>>;
  (
    message: {
      target: OffscreenCommunicationTarget.trezorOffscreen;
      action: TrezorAction.getPublicKey;
      params: { path: string; coin: string };
    },
    callback: (
      response:
        | Unsuccessful
        | Success<{ publicKey: string; chainCode: string }>,
    ) => void,
  ): Promise<Unsuccessful | Success<{ publicKey: string; chainCode: string }>>;
  (
    message: {
      target: OffscreenCommunicationTarget.ledgerOffscreen;
      action: LedgerAction.signTransaction;
      params: { hdPath: string; tx: string };
    },
    callback: (response: {
      success: boolean;
      payload: { v: string; s: string; r: string; error?: Error };
    }) => void,
  ): Promise<{
    success: boolean;
    payload?: { v: string; s: string; r: string };
  }>;
  (
    message:
      | {
          target: OffscreenCommunicationTarget.ledgerOffscreen;
          action: LedgerAction.signMessage;
          params: { hdPath: string; message: string };
        }
      | {
          target: OffscreenCommunicationTarget.ledgerOffscreen;
          action: LedgerAction.signTypedData;
          params: {
            hdPath: string;
            domainSeparatorHex: string;
            hashStructMessageHex: string;
          };
        },
    callback: (response: {
      success: boolean;
      payload: {
        v: number;
        s: string;
        r: string;
        error?: SerializedLedgerError;
      };
    }) => void,
  ): Promise<{ v: number; s: string; r: string }>;
  (
    message: {
      target: OffscreenCommunicationTarget.ledgerOffscreen;
      action: LedgerAction.getPublicKey;
      params: { hdPath: string };
    },
    callback: (response: {
      success: boolean;
      payload: {
        publicKey: string;
        address: string;
        chainCode?: string;
        error?: SerializedLedgerError;
      };
    }) => void,
  ): Promise<{ publicKey: string; address: string; chainCode?: string }>;
  (
    message: {
      target: OffscreenCommunicationTarget.ledgerOffscreen;
      action: LedgerAction.updateTransport;
      params: { transportType: string };
    },
    callback: (response: { success: boolean }) => void,
  ): Promise<boolean>;
  (
    message: {
      target: OffscreenCommunicationTarget.ledgerOffscreen;
      action: LedgerAction.makeApp;
    },
    callback: (response: {
      success: boolean;
      error?: SerializedLedgerError;
    }) => void,
  ): Promise<boolean>;
  (
    message: {
      target: OffscreenCommunicationTarget.latticeOffscreen;
      params: {
        url: string;
      };
    },

    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: (response: { result: any; error?: Error }) => void,
  );
  (
    message: Record<string, unknown>,
    callback?: (response: ResponseType) => void,
  ): void;
};

declare class Runtime {
  onMessage: {
    addListener: (
      callback: (
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        message: any,
        sender: MessageSender,
        sendResponse: (response?: ResponseType) => void,
      ) => void,
    ) => void;
  };

  sendMessage: sendMessage;
}

declare class Chrome {
  runtime: Runtime;
}

type SentryObject = Sentry & {
  getMetaMetricsEnabled: () => Promise<boolean>;
};

type StateHooks = {
  getCustomTraces?: () => { [name: string]: number };
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getCleanAppState?: () => Promise<any>;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getLogs?: () => any[];
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getMostRecentPersistedState?: () => any;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getPersistedState: () => Promise<any>;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getSentryAppState?: () => any;
  getSentryState: () => {
    browser: string;
    version: string;
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    state?: any;
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    persistedState?: any;
  };
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metamaskGetState?: () => Promise<any>;
  throwTestBackgroundError?: (msg?: string) => Promise<void>;
  throwTestError?: (msg?: string) => void;
  captureTestError?: (msg?: string) => Promise<void>;
  captureBackgroundError?: (msg?: string) => Promise<void>;
  /**
   * This is set in `app-init.js` to communicate why MetaMask installed or
   * updated. It is handled in `background.js`.
   */
  onInstalledListener?: Promise<{
    reason: chrome.runtime.InstalledDetails;
  }>;
};

export declare global {
  var platform: ExtensionPlatform;
  // Sentry is undefined in dev, so use optional chaining
  var sentry: SentryObject | undefined;

  var chrome: Chrome;

  var ethereumProvider: Provider;

  var stateHooks: StateHooks;

  var browser: Browser;

  var INFURA_PROJECT_ID: string | undefined;

  namespace jest {
    // The interface is being used for declaration merging, which is an acceptable exception to this rule.
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions, @typescript-eslint/naming-convention
    interface Matchers<R> {
      toBeFulfilled(): Promise<R>;
      toNeverResolve(): Promise<R>;
    }
  }

  /**
   * Unions T with U; U's properties will override T's properties
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  type OverridingUnion<T, U> = Omit<T, keyof U> & U;

  function setPreference(key: keyof Preferences, value: boolean);
}

// #region Promise.withResolvers polyfill

// this polyfill can be removed once our TS libs include withResolvers.
// at time of writing we use TypeScript Version 5.4.5, which includes it in
// esnext

export declare global {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  type PromiseWithResolvers<T> = {
    promise: Promise<T>;
    resolve: (value: T | PromiseLike<T>) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reject: (reason?: any) => void;
  };

  // we're extending the PromiseConstructor interface, to we have to use
  // `interface` (`type` won't work)
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface PromiseConstructor {
    /**
     * Creates a new Promise and returns it in an object, along with its resolve and reject functions.
     *
     * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/withResolvers
     *
     * @returns An object with the properties `promise`, `resolve`, and `reject`.
     *
     * ```ts
     * const { promise, resolve, reject } = Promise.withResolvers<T>();
     * ```
     */
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    withResolvers?: <T>() => PromiseWithResolvers<T>;
  }
}
// #endregion

// #region used in jest tests to ignore unhandled rejections
declare global {
  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    interface Process {
      setIgnoreUnhandled: (ignore: boolean) => void;
      resetIgnoreUnhandled: () => void;
    }
  }
}
// #endregion
