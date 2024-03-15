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
import {
  OffscreenCommunicationTarget,
  TrezorAction,
} from 'shared/constants/offscreen-communication';

declare class Platform {
  openTab: (opts: { url: string }) => void;

  closeCurrentWindow: () => void;
}

declare class MessageSender {
  documentId?: string;

  documentLivecycle?: string;

  frameId?: number;

  id?: string;

  origin?: string;

  url?: string;
}

export type LedgerIframeMissingResponse = {
  success: false;
  payload: {
    error: Error;
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
type sendMessage = {
  (
    extensionId: string,
    message: Record<string, unknown>,
    options?: Record<string, unknown>,
    callback?: (response: Record<string, unknown>) => void,
  ): void;
  (
    message: any,
    options?: Record<string, unknown>,
    callback?: (response: Record<string, unknown>) => void,
  ): void;
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
        error?: Error;
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
        error?: Error;
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
    callback: (response: { success: boolean; error?: Error }) => void,
  ): Promise<boolean>;
  (
    message: {
      target: OffscreenCommunicationTarget.latticeOffscreen;
      params: {
        url: string;
      };
    },
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
  // Verifies that the user has opted into metrics and then updates the sentry
  // instance to track sessions and begins the session.
  startSession: () => void;

  // Verifies that the user has opted out of metrics and then updates the
  // sentry instance to NOT track sessions and ends the current session.
  endSession: () => void;

  // Calls either startSession or endSession based on optin status
  toggleSession: () => void;
};

export declare global {
  var platform: Platform;
  // Sentry is undefined in dev, so use optional chaining
  var sentry: SentryObject | undefined;

  var chrome: Chrome;

  namespace jest {
    // The interface is being used for declaration merging, which is an acceptable exception to this rule.
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    interface Matchers<R> {
      toBeFulfilled(): Promise<R>;
      toNeverResolve(): Promise<R>;
    }
  }
}
