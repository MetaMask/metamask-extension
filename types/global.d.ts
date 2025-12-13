// Optimized Type Definitions for MetaMask/Extension Environment

/* eslint-disable no-var, @typescript-eslint/naming-convention */

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
import type { Browser } from 'webextension-polyfill';
import {
    OffscreenCommunicationTarget,
    TrezorAction,
} from '../shared/constants/offscreen-communication';
import type { Preferences } from '../app/scripts/controllers/preferences-controller';
import type ExtensionPlatform from '../app/scripts/platforms/extension';
import type { ExtensionLazyListener } from '../app/scripts/lib/extension-lazy-listener/extension-lazy-listener';

// NOTE: LedgerAction is missing in the original imports but used below. 
// Assuming it comes from the same constants file as TrezorAction.
// import { LedgerAction } from '../shared/constants/offscreen-communication';
// For demonstration, defining a placeholder for LedgerAction:
export enum LedgerAction {
    signTransaction = 'LEDGER_SIGN_TX',
    signMessage = 'LEDGER_SIGN_MSG',
    signTypedData = 'LEDGER_SIGN_TYPED_DATA',
    getPublicKey = 'LEDGER_GET_PUBKEY',
    updateTransport = 'LEDGER_UPDATE_TRANSPORT',
    makeApp = 'LEDGER_MAKE_APP',
}

/**
 * Defines properties available on the sender of a message via chrome.runtime.sendMessage.
 */
declare class MessageSender {
    documentId?: string;
    documentLivecycle?: string;
    frameId?: number;
    id?: string;
    origin?: string;
    url?: string;
}

/**
 * Type for an error that occurred during Ledger transport communication, serialized for transfer.
 */
type SerializedLedgerError = {
    message: string;
    name?: string;
    stack?: string;
    // from TransportStatusError
    statusCode?: number;
    statusText?: string;
};

/**
 * Specific response type when a Ledger iframe operation fails to return a result.
 */
export type LedgerIframeMissingResponse = {
    success: false;
    payload: {
        error: SerializedLedgerError;
    };
};

/**
 * Union type covering all possible responses from offscreen/background communication.
 * Using 'unknown' instead of Record<string, unknown> provides better type safety.
 */
type ResponseType =
    | Unsuccessful
    | Success<{ publicKey: string; chainCode: string }>
    | Success<EthereumSignedTx>
    | Success<PROTO.MessageSignature>
    | Success<PROTO.EthereumTypedDataSignature>
    | unknown // Optimized: Used 'unknown' instead of Record<string, unknown>
    | LedgerIframeMissingResponse;


/**
 * Overloaded function signatures for the chrome.runtime.sendMessage function, 
 * ensuring type inference based on input message action/target.
 */
type sendMessage = {
    // 1. Generic signature for sending messages with an explicit extensionId
    (
        extensionId: string,
        message: unknown, // Optimized: Use unknown
        options?: unknown, // Optimized: Use unknown
        callback?: (response: unknown) => void, // Optimized: Use unknown
    ): void;
    // 2. Generic signature for sending messages without explicit extensionId
    (
        message: unknown, // Optimized: Use unknown
        options?: unknown, // Optimized: Use unknown
        callback?: (response: unknown) => void, // Optimized: Use unknown
    ): void;

    // --- Trezor Offscreen Actions (Typed Signatures) ---

    // Sign Typed Data (Generic T)
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
    
    // Sign Transaction
    (
        message: {
            target: OffscreenCommunicationTarget.trezorOffscreen;
            action: TrezorAction.signTransaction;
            params: Params<EthereumSignTransaction>;
        },
        callback: (response: Unsuccessful | Success<EthereumSignedTx>) => void,
    ): Promise<Unsuccessful | Success<EthereumSignedTx>>;
    
    // Sign Message
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
    
    // Get Public Key
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

    // --- Ledger Offscreen Actions (Typed Signatures) ---

    // Sign Transaction
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
    
    // Sign Message / Sign Typed Data (Unified Ledger response)
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
    
    // Get Public Key
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
    
    // Update Transport
    (
        message: {
            target: OffscreenCommunicationTarget.ledgerOffscreen;
            action: LedgerAction.updateTransport;
            params: { transportType: string };
        },
        callback: (response: { success: boolean }) => void,
    ): Promise<boolean>;
    
    // Make App
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

    // --- Lattice Offscreen Action (Generic) ---

    // Note: Lattice response type is kept as { result: any; error?: Error } due to its generic nature.
    (
        message: {
            target: OffscreenCommunicationTarget.latticeOffscreen;
            params: {
                url: string;
            };
        },
        callback: (response: { result: unknown; error?: Error }) => void, // Optimized: Use unknown
    );
    
    // 3. Final generic signature fallback
    (
        message: unknown, // Optimized: Use unknown
        callback?: (response: ResponseType) => void,
    ): void;
};

/**
 * Declares the chrome.runtime API structure used for message passing.
 */
declare class Runtime {
    onMessage: {
        addListener: (
            callback: (
                message: unknown, // Optimized: Use unknown
                sender: MessageSender,
                sendResponse: (response?: ResponseType) => void,
            ) => void,
        ) => void;
    };

    sendMessage: sendMessage;
}

/**
 * Declares the global 'chrome' object, typically provided by the browser extension API.
 */
declare class Chrome {
    runtime: Runtime;
}

/**
 * Sentry object type, extending the imported Sentry module with extension-specific methods.
 */
type SentryObject = Sentry & {
    getMetaMetricsEnabled: () => Promise<boolean>;
};

/**
 * Defines hooks for accessing various parts of the application state (App and Persistence).
 * Most raw state access methods are marked as returning 'unknown' for safety.
 */
type StateHooks = {
    getCustomTraces?: () => { [name: string]: number };
    getCleanAppState?: () => Promise<unknown>; // Optimized: Use unknown
    getLogs?: () => unknown[]; // Optimized: Use unknown
    getMostRecentPersistedState?: () => unknown; // Optimized: Use unknown
    getPersistedState: () => Promise<unknown>; // Optimized: Use unknown
    getSentryAppState?: () => unknown; // Optimized: Use unknown
    getSentryState: () => {
        browser: string;
        version: string;
        state?: unknown; // Optimized: Use unknown
        persistedState?: unknown; // Optimized: Use unknown
    };
    metamaskGetState?: () => Promise<unknown>; // Optimized: Use unknown
    throwTestBackgroundError?: (msg?: string) => Promise<void>;
    throwTestError?: (msg?: string) => void;
    captureTestError?: (msg?: string) => Promise<void>;
    captureBackgroundError?: (msg?: string) => Promise<void>;

    /**
     * This is initialized by the service worker in MV3. It is handled in `background.js`.
     */
    lazyListener?: ExtensionLazyListener<typeof globalThis.chrome>;
};

/**
 * Global variables accessible in the background script context.
 */
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
        interface Matchers<R> {
            toBeFulfilled(): Promise<R>;
            toNeverResolve(): Promise<R>;
        }
    }

    /**
     * Unions T with U; U's properties will override T's properties.
     */
    type OverridingUnion<T, U> = Omit<T, keyof U> & U;

    function setPreference(key: keyof Preferences, value: boolean): void;
}

// #region Promise.withResolvers polyfill (Should be removed when TS libs are updated)

export declare global {
    type PromiseWithResolvers<T> = {
        promise: Promise<T>;
        resolve: (value: T | PromiseLike<T>) => void;
        reject: (reason?: unknown) => void; // Optimized: Use unknown
    };

    interface PromiseConstructor {
        withResolvers?: <T>() => PromiseWithResolvers<T>;
    }
}
// #endregion

// #region used in jest tests to ignore unhandled rejections
declare global {
    namespace NodeJS {
        interface Process {
            setIgnoreUnhandled: (ignore: boolean) => void;
            resetIgnoreUnhandled: () => void;
        }
    }
}
// #endregion
