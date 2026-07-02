import type { TypedTransaction } from '@ethereumjs/tx';
import type {
  AccountsController,
  AccountsControllerGetSelectedAccountAction,
  AccountsControllerGetStateAction,
  AccountsControllerSelectedAccountChangeEvent,
} from '@metamask/accounts-controller';
import type {
  AcceptResultCallbacks,
  ApprovalControllerAddRequestAction,
  AddResult,
} from '@metamask/approval-controller';
import type {
  ControllerGetStateAction,
  ControllerStateChangeEvent,
  StateMetadata,
} from '@metamask/base-controller';
import { BaseController } from '@metamask/base-controller';
import {
  ApprovalType,
  ORIGIN_METAMASK,
  convertHexToDecimal,
} from '@metamask/controller-utils';
import type { TraceCallback, TraceContext } from '@metamask/controller-utils';
import type {
  AccountActivityServiceStatusChangedEvent,
  AccountActivityServiceTransactionUpdatedEvent,
  BackendWebSocketServiceConnectionStateChangedEvent,
} from '@metamask/core-backend';
import type {
  FetchGasFeeEstimateOptions,
  GasFeeState,
} from '@metamask/gas-fee-controller';
import type { KeyringControllerSignEip7702AuthorizationAction } from '@metamask/keyring-controller';
import type { Messenger } from '@metamask/messenger';
import type {
  BlockTracker,
  NetworkClientId,
  NetworkController,
  NetworkControllerStateChangeEvent,
  NetworkState,
  Provider,
  NetworkControllerFindNetworkClientIdByChainIdAction,
  NetworkControllerGetNetworkClientByIdAction,
} from '@metamask/network-controller';
import { NetworkClientType } from '@metamask/network-controller';
import type {
  NonceLock,
  Transaction as NonceTrackerTransaction,
} from '@metamask/nonce-tracker';
import { NonceTracker } from '@metamask/nonce-tracker';
import type { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import {
  errorCodes,
  rpcErrors,
  providerErrors,
  JsonRpcError,
} from '@metamask/rpc-errors';
import type { Hex, Json } from '@metamask/utils';
import { add0x } from '@metamask/utils';
// This package purposefully relies on Node's EventEmitter module.
// eslint-disable-next-line import-x/no-nodejs-modules
import { EventEmitter } from 'events';
import { cloneDeep, mapValues, merge, noop, pickBy, sortBy } from 'lodash';
import { v1 as random } from 'uuid';

import { DefaultGasFeeFlow } from './gas-flows/DefaultGasFeeFlow';
import { LineaGasFeeFlow } from './gas-flows/LineaGasFeeFlow';
import { OptimismLayer1GasFeeFlow } from './gas-flows/OptimismLayer1GasFeeFlow';
import { RandomisedEstimationsGasFeeFlow } from './gas-flows/RandomisedEstimationsGasFeeFlow';
import { ScrollLayer1GasFeeFlow } from './gas-flows/ScrollLayer1GasFeeFlow';
import { TestGasFeeFlow } from './gas-flows/TestGasFeeFlow';
import { AccountsApiRemoteTransactionSource } from './helpers/AccountsApiRemoteTransactionSource';
import {
  GasFeePoller,
  updateTransactionGasProperties,
  updateTransactionGasEstimates,
} from './helpers/GasFeePoller';
import type { IncomingTransactionOptions } from './helpers/IncomingTransactionHelper';
import { IncomingTransactionHelper } from './helpers/IncomingTransactionHelper';
import { MethodDataHelper } from './helpers/MethodDataHelper';
import { MultichainTrackingHelper } from './helpers/MultichainTrackingHelper';
import { PendingTransactionTracker } from './helpers/PendingTransactionTracker';
import type { ResimulateResponse } from './helpers/ResimulateHelper';
import {
  ResimulateHelper,
  hasSimulationDataChanged,
  shouldResimulate,
} from './helpers/ResimulateHelper';
import { ExtraTransactionsPublishHook } from './hooks/ExtraTransactionsPublishHook';
import { projectLogger as log } from './logger';
import type { TransactionControllerMethodActions } from './TransactionController-method-action-types';
import type {
  DappSuggestedGasFees,
  Layer1GasFeeFlow,
  SavedGasFees,
  SecurityProviderRequest,
  SendFlowHistoryEntry,
  TransactionParams,
  TransactionMeta,
  TransactionReceipt,
  SecurityAlertResponse,
  GasFeeFlow,
  SimulationData,
  GasFeeEstimates,
  GasFeeFlowResponse,
  GasPriceValue,
  FeeMarketEIP1559Values,
  SubmitHistoryEntry,
  TransactionBatchRequest,
  TransactionBatchResult,
  BatchTransactionParams,
  UpdateCustodialTransactionRequest,
  PublishHook,
  PublishBatchHook,
  GasFeeToken,
  IsAtomicBatchSupportedResult,
  IsAtomicBatchSupportedRequest,
  AfterAddHook,
  GasFeeEstimateLevel as GasFeeEstimateLevelType,
  TransactionBatchMeta,
  AfterSimulateHook,
  BeforeSignHook,
  TransactionContainerType,
  GetSimulationConfig,
  AddTransactionOptions,
  PublishHookResult,
  GetGasFeeTokensRequest,
  InternalAccount,
} from './types';
import {
  GasFeeEstimateLevel,
  TransactionEnvelopeType,
  TransactionType,
  TransactionStatus,
  SimulationErrorCode,
} from './types';
import { getBalanceChanges } from './utils/balance-changes';
import { addTransactionBatch, isAtomicBatchSupported } from './utils/batch';
import {
  generateEIP7702BatchTransaction,
  getDelegationAddress,
  signAuthorizationList,
} from './utils/eip7702';
import { validateConfirmedExternalTransaction } from './utils/external-transactions';
import {
  getSubmitHistoryLimit,
  getTransactionHistoryLimit,
} from './utils/feature-flags';
import { updateFirstTimeInteraction } from './utils/first-time-interaction';
import {
  addGasBuffer,
  estimateGas,
  estimateGasBatch,
  updateGas,
} from './utils/gas';
import {
  checkGasFeeTokenBeforePublish,
  getGasFeeTokens,
} from './utils/gas-fee-tokens';
import { updateGasFees } from './utils/gas-fees';
import { getGasFeeFlow } from './utils/gas-flow';
import {
  getTransactionLayer1GasFee,
  updateTransactionLayer1GasFee,
} from './utils/layer1-gas-fee-flow';
import {
  getAndFormatTransactionsForNonceTracker,
  getNextNonce,
} from './utils/nonce';
import { prepareTransaction, serializeTransaction } from './utils/prepare';
import { getChainId, getNetworkClientId, rpcRequest } from './utils/provider';
import { getTransactionParamsWithIncreasedGasFee } from './utils/retry';
import {
  updatePostTransactionBalance,
  updateSwapsTransaction,
} from './utils/swaps';
import { determineTransactionType } from './utils/transaction-type';
import {
  normalizeTransactionParams,
  isEIP1559Transaction,
  validateGasValues,
  validateIfTransactionUnapproved,
  validateIfTransactionUnapprovedOrSubmitted,
  normalizeTxError,
  normalizeGasFeeValues,
  setEnvelopeType,
} from './utils/utils';
import {
  ErrorCode,
  validateTransactionOrigin,
  validateTxParams,
} from './utils/validation';

/**
 * Metadata for the TransactionController state, describing how to "anonymize"
 * the state and which parts should be persisted.
 */
const metadata: StateMetadata<TransactionControllerState> = {
  transactions: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: false,
    usedInUi: true,
  },
  transactionBatches: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: false,
    usedInUi: true,
  },
  methodData: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: false,
    usedInUi: true,
  },
  lastFetchedBlockNumbers: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: false,
    usedInUi: false,
  },
  submitHistory: {
    includeInStateLogs: true,
    persist: true,
    includeInDebugSnapshot: false,
    usedInUi: false,
  },
};

/**
 * Object with new transaction's meta and a promise resolving to the
 * transaction hash if successful.
 */
// This interface was created before this ESLint rule was added.
// Convert to a `type` in a future major version.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface Result {
  /** Promise resolving to a new transaction hash. */
  result: Promise<string>;

  /** Meta information about this new transaction. */
  transactionMeta: TransactionMeta;
}

/**
 * Method data registry object
 */
export type MethodData = {
  /** Registry method raw string. */
  registryMethod: string;

  /** Registry method object, containing name and method arguments. */
  parsedRegistryMethod:
    | {
        name: string;
        args: { type: string }[];
      }
    | {
        // We're using `any` instead of `undefined` for compatibility with `Json`
        // TODO: Correct this type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        name?: any;
        // We're using `any` instead of `undefined` for compatibility with `Json`
        // TODO: Correct this type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        args?: any;
      };
};

/**
 * Transaction controller state
 */
export type TransactionControllerState = {
  /** A list of TransactionMeta objects. */
  transactions: TransactionMeta[];

  /** A list of TransactionBatchMeta objects. */
  transactionBatches: TransactionBatchMeta[];

  /** Object containing all known method data information. */
  methodData: Record<string, MethodData>;

  /** Cache to optimise incoming transaction queries. */
  lastFetchedBlockNumbers: { [key: string]: number | string };

  /** History of all transactions submitted from the wallet. */
  submitHistory: SubmitHistoryEntry[];
};

/**
 * Multiplier used to determine a transaction's increased gas fee during cancellation
 */
export const CANCEL_RATE = 1.1;

/**
 * Multiplier used to determine a transaction's increased gas fee during speed up
 */
export const SPEED_UP_RATE = 1.1;

/**
 * Represents the `TransactionController:getState` action.
 */
export type TransactionControllerGetStateAction = ControllerGetStateAction<
  typeof controllerName,
  TransactionControllerState
>;

/**
 * The internal actions available to the TransactionController.
 */
export type TransactionControllerActions =
  | TransactionControllerGetStateAction
  | TransactionControllerMethodActions;

/**
 * Configuration options for the PendingTransactionTracker
 */
export type PendingTransactionOptions = {
  /** Whether transaction publishing is automatically retried. */
  isResubmitEnabled?: () => boolean;
};

/** TransactionController constructor options. */
export type TransactionControllerOptions = {
  /** @deprecated No longer used — kept only for backward compatibility. */
  disableHistory: boolean;

  /** @deprecated No longer used — kept only for backward compatibility. */
  disableSendFlowHistory: boolean;

  /** Whether to disable additional processing on swaps transactions. */
  disableSwaps: boolean;

  /** Whether or not the account supports EIP-1559. */
  getCurrentAccountEIP1559Compatibility?: () => Promise<boolean>;

  /** Whether or not the network supports EIP-1559. */
  getCurrentNetworkEIP1559Compatibility: () => Promise<boolean>;

  /** Callback to retrieve pending transactions from external sources. */
  getExternalPendingTransactions?: (
    address: string,
    chainId?: string,
  ) => NonceTrackerTransaction[];

  /** Callback to retrieve gas fee estimates. */
  getGasFeeEstimates?: (
    options: FetchGasFeeEstimateOptions,
  ) => Promise<GasFeeState>;

  /** Gets the network client registry. */
  getNetworkClientRegistry: NetworkController['getNetworkClientRegistry'];

  /** Gets the state of the network controller. */
  getNetworkState: () => NetworkState;

  /** Get accounts that a given origin has permissions for. */
  getPermittedAccounts?: (origin?: string) => Promise<string[]>;

  /** Gets the saved gas fee config. */
  getSavedGasFees?: (chainId: Hex) => SavedGasFees | undefined;

  /**
   * Gets the transaction simulation configuration.
   */
  getSimulationConfig?: GetSimulationConfig;

  /** Configuration options for incoming transaction support. */
  incomingTransactions?: IncomingTransactionOptions & {
    /** @deprecated Ignored as Etherscan no longer used. */
    etherscanApiKeysByChainId?: Record<Hex, string>;
  };

  /**
   * Callback to determine whether gas fee updates should be enabled for a given transaction.
   * Returns true to enable updates, false to disable them.
   */
  isAutomaticGasFeeUpdateEnabled?: (
    transactionMeta: TransactionMeta,
  ) => boolean;

  /** Whether simulation should return EIP-7702 gas fee tokens. */
  isEIP7702GasFeeTokensEnabled?: (
    transactionMeta: TransactionMeta,
  ) => Promise<boolean>;

  /** Whether the first time interaction check is enabled. */
  isFirstTimeInteractionEnabled?: () => boolean;

  /** Whether new transactions will be automatically simulated. */
  isSimulationEnabled?: () => boolean;

  /** The controller messenger. */
  messenger: TransactionControllerMessenger;

  /** Configuration options for pending transaction support. */
  pendingTransactions?: PendingTransactionOptions;

  /** Public key used to validate EIP-7702 contract signatures in feature flags. */
  publicKeyEIP7702?: Hex;

  /** A function for verifying a transaction, whether it is malicious or not. */
  securityProviderRequest?: SecurityProviderRequest;

  /** Function used to sign transactions. */
  sign?: (
    transaction: TypedTransaction,
    from: string,
    transactionMeta?: TransactionMeta,
  ) => Promise<TypedTransaction>;

  /** Initial state to set on this controller. */
  state?: Partial<TransactionControllerState>;

  testGasFeeFlows?: boolean;
  trace?: TraceCallback;

  /**
   * Transaction history limit.
   *
   * @deprecated Use the `transactionHistoryLimit` feature flag in
   * `RemoteFeatureFlagController` instead. This option will be removed
   * in a future version.
   */
  transactionHistoryLimit?: number;

  /** The controller hooks. */
  hooks: {
    /** Additional logic to execute after adding a transaction. */
    afterAdd?: AfterAddHook;

    /** Additional logic to execute after signing a transaction. Return false to not change the status to signed. */
    afterSign?: (
      transactionMeta: TransactionMeta,
      signedTx: TypedTransaction,
    ) => boolean;

    /** Additional logic to execute after simulating a transaction. */
    afterSimulate?: AfterSimulateHook;

    /**
     * Additional logic to execute before checking pending transactions.
     * Return false to prevent the broadcast of the transaction.
     */
    beforeCheckPendingTransaction?: (
      transactionMeta: TransactionMeta,
    ) => Promise<boolean>;

    /**
     * Additional logic to execute before publishing a transaction.
     * Return false to prevent the broadcast of the transaction.
     */
    beforePublish?: (transactionMeta: TransactionMeta) => Promise<boolean>;

    /**
     * Additional logic to execute before signing a transaction.
     */
    beforeSign?: BeforeSignHook;

    /** Returns additional arguments required to sign a transaction. */
    getAdditionalSignArguments?: (
      transactionMeta: TransactionMeta,
    ) => (TransactionMeta | undefined)[];

    /**
     * Callback to determine whether timeout checking should be enabled for a transaction.
     * Return false to disable timeout for the transaction.
     */
    isTimeoutEnabled?: (transactionMeta: TransactionMeta) => boolean;

    /** Alternate logic to publish a transaction. */
    publish?: (
      transactionMeta: TransactionMeta,
    ) => Promise<{ transactionHash: string }>;
    publishBatch?: PublishBatchHook;
  };
};

/**
 * The name of the {@link TransactionController}.
 */
const controllerName = 'TransactionController';

/**
 * The external actions available to the {@link TransactionController}.
 */
export type AllowedActions =
  | AccountsControllerGetSelectedAccountAction
  | AccountsControllerGetStateAction
  | ApprovalControllerAddRequestAction
  | KeyringControllerSignEip7702AuthorizationAction
  | NetworkControllerFindNetworkClientIdByChainIdAction
  | NetworkControllerGetNetworkClientByIdAction
  | RemoteFeatureFlagControllerGetStateAction;

/**
 * The external events available to the {@link TransactionController}.
 */
export type AllowedEvents =
  | AccountActivityServiceStatusChangedEvent
  | AccountActivityServiceTransactionUpdatedEvent
  | AccountsControllerSelectedAccountChangeEvent
  | BackendWebSocketServiceConnectionStateChangedEvent
  | NetworkControllerStateChangeEvent;

/**
 * Represents the `TransactionController:stateChange` event.
 */
export type TransactionControllerStateChangeEvent = ControllerStateChangeEvent<
  typeof controllerName,
  TransactionControllerState
>;

/**
 * Represents the `TransactionController:incomingTransactionsReceived` event.
 */
export type TransactionControllerIncomingTransactionsReceivedEvent = {
  type: `${typeof controllerName}:incomingTransactionsReceived`;
  payload: [incomingTransactions: TransactionMeta[]];
};

/**
 * Represents the `TransactionController:postTransactionBalanceUpdated` event.
 */
export type TransactionControllerPostTransactionBalanceUpdatedEvent = {
  type: `${typeof controllerName}:postTransactionBalanceUpdated`;
  payload: [
    {
      transactionMeta: TransactionMeta;
      approvalTransactionMeta?: TransactionMeta;
    },
  ];
};

/**
 * Represents the `TransactionController:speedUpTransactionAdded` event.
 */
export type TransactionControllerSpeedupTransactionAddedEvent = {
  type: `${typeof controllerName}:speedupTransactionAdded`;
  payload: [transactionMeta: TransactionMeta];
};

/**
 * Represents the `TransactionController:transactionApproved` event.
 */
export type TransactionControllerTransactionApprovedEvent = {
  type: `${typeof controllerName}:transactionApproved`;
  payload: [
    {
      transactionMeta: TransactionMeta;
      actionId?: string;
    },
  ];
};

/**
 * Represents the `TransactionController:transactionConfirmed` event.
 */
export type TransactionControllerTransactionConfirmedEvent = {
  type: `${typeof controllerName}:transactionConfirmed`;
  payload: [transactionMeta: TransactionMeta];
};

/**
 * Represents the `TransactionController:transactionDropped` event.
 */
export type TransactionControllerTransactionDroppedEvent = {
  type: `${typeof controllerName}:transactionDropped`;
  payload: [{ transactionMeta: TransactionMeta }];
};

/**
 * Represents the `TransactionController:transactionFailed` event.
 */
export type TransactionControllerTransactionFailedEvent = {
  type: `${typeof controllerName}:transactionFailed`;
  payload: [
    {
      actionId?: string;
      error: string;
      transactionMeta: TransactionMeta;
    },
  ];
};

/**
 * Represents the `TransactionController:transactionFinished` event.
 */
export type TransactionControllerTransactionFinishedEvent = {
  type: `${typeof controllerName}:transactionFinished`;
  payload: [transactionMeta: TransactionMeta];
};

/**
 * Represents the `TransactionController:transactionNewSwapApproval` event.
 */
export type TransactionControllerTransactionNewSwapApprovalEvent = {
  type: `${typeof controllerName}:transactionNewSwapApproval`;
  payload: [{ transactionMeta: TransactionMeta }];
};

/**
 * Represents the `TransactionController:transactionNewSwap` event.
 */
export type TransactionControllerTransactionNewSwapEvent = {
  type: `${typeof controllerName}:transactionNewSwap`;
  payload: [{ transactionMeta: TransactionMeta }];
};

/**
 * Represents the `TransactionController:transactionNewSwapApproval` event.
 */
export type TransactionControllerTransactionNewSwapAndSendEvent = {
  type: `${typeof controllerName}:transactionNewSwapAndSend`;
  payload: [{ transactionMeta: TransactionMeta }];
};

/**
 * Represents the `TransactionController:transactionPublishingSkipped` event.
 */
export type TransactionControllerTransactionPublishingSkipped = {
  type: `${typeof controllerName}:transactionPublishingSkipped`;
  payload: [transactionMeta: TransactionMeta];
};

/**
 * Represents the `TransactionController:transactionRejected` event.
 */
export type TransactionControllerTransactionRejectedEvent = {
  type: `${typeof controllerName}:transactionRejected`;
  payload: [
    {
      transactionMeta: TransactionMeta;
      actionId?: string;
    },
  ];
};

/**
 * Represents the `TransactionController:transactionStatusUpdated` event.
 */
export type TransactionControllerTransactionStatusUpdatedEvent = {
  type: `${typeof controllerName}:transactionStatusUpdated`;
  payload: [
    {
      transactionMeta: TransactionMeta;
    },
  ];
};

/**
 * Represents the `TransactionController:transactionSubmitted` event.
 */
export type TransactionControllerTransactionSubmittedEvent = {
  type: `${typeof controllerName}:transactionSubmitted`;
  payload: [
    {
      transactionMeta: TransactionMeta;
      actionId?: string;
    },
  ];
};

/**
 * Represents the `TransactionController:unapprovedTransactionAdded` event.
 */
export type TransactionControllerUnapprovedTransactionAddedEvent = {
  type: `${typeof controllerName}:unapprovedTransactionAdded`;
  payload: [transactionMeta: TransactionMeta];
};

/**
 * The internal events available to the {@link TransactionController}.
 */
export type TransactionControllerEvents =
  | TransactionControllerIncomingTransactionsReceivedEvent
  | TransactionControllerPostTransactionBalanceUpdatedEvent
  | TransactionControllerSpeedupTransactionAddedEvent
  | TransactionControllerStateChangeEvent
  | TransactionControllerTransactionApprovedEvent
  | TransactionControllerTransactionConfirmedEvent
  | TransactionControllerTransactionDroppedEvent
  | TransactionControllerTransactionFailedEvent
  | TransactionControllerTransactionFinishedEvent
  | TransactionControllerTransactionNewSwapApprovalEvent
  | TransactionControllerTransactionNewSwapEvent
  | TransactionControllerTransactionNewSwapAndSendEvent
  | TransactionControllerTransactionPublishingSkipped
  | TransactionControllerTransactionRejectedEvent
  | TransactionControllerTransactionStatusUpdatedEvent
  | TransactionControllerTransactionSubmittedEvent
  | TransactionControllerUnapprovedTransactionAddedEvent;

/**
 * The messenger of the {@link TransactionController}.
 */
export type TransactionControllerMessenger = Messenger<
  typeof controllerName,
  TransactionControllerActions | AllowedActions,
  TransactionControllerEvents | AllowedEvents
>;

/**
 * Possible states of the approve transaction step.
 */
export enum ApprovalState {
  Approved = 'approved',
  NotApproved = 'not-approved',
  SkippedViaBeforePublishHook = 'skipped-via-before-publish-hook',
}

/**
 * Get the default TransactionsController state.
 *
 * @returns The default TransactionsController state.
 */
function getDefaultTransactionControllerState(): TransactionControllerState {
  return {
    methodData: {},
    transactions: [],
    transactionBatches: [],
    lastFetchedBlockNumbers: {},
    submitHistory: [],
  };
}

// === MESSENGER ===

const MESSENGER_EXPOSED_METHODS = [
  'abortTransactionSigning',
  'addTransaction',
  'addTransactionBatch',
  'approveTransactionsWithSameNonce',
  'clearUnapprovedTransactions',
  'confirmExternalTransaction',
  'emulateNewTransaction',
  'emulateTransactionUpdate',
  'estimateGas',
  'estimateGasBatch',
  'estimateGasBuffered',
  'estimateGasFee',
  'getGasFeeTokens',
  'getLayer1GasFee',
  'getNonceLock',
  'getTransactions',
  'handleMethodData',
  'isAtomicBatchSupported',
  'setTransactionActive',
  'speedUpTransaction',
  'startIncomingTransactionPolling',
  'stopIncomingTransactionPolling',
  'stopTransaction',
  'updateAtomicBatchData',
  'updateCustodialTransaction',
  'updateEditableParams',
  'updateIncomingTransactions',
  'updateTransaction',
] as const;

/**
 * Controller responsible for submitting and managing transactions.
 */
export class TransactionController extends BaseController<
  typeof controllerName,
  TransactionControllerState,
  TransactionControllerMessenger
> {
  readonly #afterAdd: AfterAddHook;

  readonly #afterSign: (
    transactionMeta: TransactionMeta,
    signedTx: TypedTransaction,
  ) => boolean;

  readonly #afterSimulate: AfterSimulateHook;

  readonly #approvingTransactionIds: Set<string> = new Set();

  readonly #beforeCheckPendingTransaction: (
    transactionMeta: TransactionMeta,
  ) => Promise<boolean>;

  readonly #beforePublish: (
    transactionMeta: TransactionMeta,
  ) => Promise<boolean>;

  readonly #beforeSign: BeforeSignHook;

  readonly #gasFeeFlows: GasFeeFlow[];

  readonly #getAdditionalSignArguments: (
    transactionMeta: TransactionMeta,
  ) => (TransactionMeta | undefined)[];

  readonly #getCurrentAccountEIP1559Compatibility: () => Promise<boolean>;

  readonly #getCurrentNetworkEIP1559Compatibility: (
    networkClientId?: NetworkClientId,
  ) => Promise<boolean>;

  readonly #getExternalPendingTransactions: (
    address: string,
    chainId?: string,
  ) => NonceTrackerTransaction[];

  readonly #getGasFeeEstimates: (
    options: FetchGasFeeEstimateOptions,
  ) => Promise<GasFeeState>;

  readonly #getNetworkState: () => NetworkState;

  readonly #getPermittedAccounts?: (origin?: string) => Promise<string[]>;

  readonly #getSavedGasFees: (chainId: Hex) => SavedGasFees | undefined;

  readonly #getSimulationConfig: GetSimulationConfig;

  readonly #incomingTransactionHelper: IncomingTransactionHelper;

  readonly #incomingTransactionOptions: IncomingTransactionOptions & {
    etherscanApiKeysByChainId?: Record<Hex, string>;
  };

  readonly #internalEvents = new EventEmitter();

  readonly #isAutomaticGasFeeUpdateEnabled: (
    transactionMeta: TransactionMeta,
  ) => boolean;

  readonly #isEIP7702GasFeeTokensEnabled: (
    transactionMeta: TransactionMeta,
  ) => Promise<boolean>;

  readonly #isFirstTimeInteractionEnabled: () => boolean;

  readonly #isSimulationEnabled: () => boolean;

  readonly #isSwapsDisabled: boolean;

  readonly #isTimeoutEnabled: (transactionMeta: TransactionMeta) => boolean;

  readonly #layer1GasFeeFlows: Layer1GasFeeFlow[];

  readonly #methodDataHelper: MethodDataHelper;

  readonly #multichainTrackingHelper: MultichainTrackingHelper;

  readonly #pendingTransactionOptions: PendingTransactionOptions;

  readonly #publicKeyEIP7702?: Hex;

  readonly #publish: (
    transactionMeta: TransactionMeta,
    rawTx: string,
  ) => Promise<{ transactionHash?: string }>;

  readonly #publishBatchHook?: PublishBatchHook;

  readonly #securityProviderRequest?: SecurityProviderRequest;

  readonly #sign?: (
    transaction: TypedTransaction,
    from: string,
    transactionMeta?: TransactionMeta,
  ) => Promise<TypedTransaction>;

  readonly #signAbortCallbacks: Map<string, () => void> = new Map();

  readonly #skipSimulationTransactionIds: Set<string> = new Set();

  readonly #testGasFeeFlows: boolean;

  readonly #trace: TraceCallback;

  /**
   * Constructs a TransactionController.
   *
   * @param options - The controller options.
   */
  constructor(options: TransactionControllerOptions) {
    const {
      disableSwaps,
      getCurrentAccountEIP1559Compatibility,
      getCurrentNetworkEIP1559Compatibility,
      getExternalPendingTransactions,
      getGasFeeEstimates,
      getNetworkClientRegistry,
      getNetworkState,
      getPermittedAccounts,
      getSavedGasFees,
      getSimulationConfig,
      hooks,
      incomingTransactions = {},
      isAutomaticGasFeeUpdateEnabled,
      isEIP7702GasFeeTokensEnabled,
      isFirstTimeInteractionEnabled,
      isSimulationEnabled,
      messenger,
      pendingTransactions = {},
      publicKeyEIP7702,
      securityProviderRequest,
      sign,
      state,
      testGasFeeFlows,
      trace,
    } = options;

    super({
      name: controllerName,
      metadata,
      messenger,
      state: {
        ...getDefaultTransactionControllerState(),
        ...state,
      },
    });

    this.messenger = messenger;

    this.#afterAdd =
      hooks?.afterAdd ?? ((): ReturnType<AfterAddHook> => Promise.resolve({}));
    this.#afterSign = hooks?.afterSign ?? ((): boolean => true);
    this.#afterSimulate =
      hooks?.afterSimulate ??
      ((): ReturnType<AfterSimulateHook> => Promise.resolve({}));
    this.#beforeCheckPendingTransaction =
      /* istanbul ignore next */
      hooks?.beforeCheckPendingTransaction ??
      ((): Promise<boolean> => Promise.resolve(true));
    this.#beforePublish =
      hooks?.beforePublish ?? ((): Promise<boolean> => Promise.resolve(true));
    this.#beforeSign =
      hooks?.beforeSign ??
      ((): ReturnType<BeforeSignHook> => Promise.resolve({}));
    this.#getAdditionalSignArguments =
      hooks?.getAdditionalSignArguments ??
      ((): (TransactionMeta | undefined)[] => []);
    this.#getCurrentAccountEIP1559Compatibility =
      getCurrentAccountEIP1559Compatibility ??
      ((): Promise<boolean> => Promise.resolve(true));
    this.#getCurrentNetworkEIP1559Compatibility =
      getCurrentNetworkEIP1559Compatibility;
    this.#getExternalPendingTransactions =
      getExternalPendingTransactions ?? ((): NonceTrackerTransaction[] => []);
    this.#getGasFeeEstimates =
      getGasFeeEstimates ??
      ((): Promise<GasFeeState> => Promise.resolve({} as GasFeeState));
    this.#getNetworkState = getNetworkState;
    this.#getPermittedAccounts = getPermittedAccounts;
    this.#getSavedGasFees =
      getSavedGasFees ?? ((_chainId): SavedGasFees | undefined => undefined);
    this.#getSimulationConfig =
      getSimulationConfig ??
      ((): ReturnType<GetSimulationConfig> => Promise.resolve({}));
    this.#incomingTransactionOptions = incomingTransactions;
    this.#isAutomaticGasFeeUpdateEnabled =
      isAutomaticGasFeeUpdateEnabled ??
      ((_txMeta: TransactionMeta): boolean => false);
    this.#isEIP7702GasFeeTokensEnabled =
      isEIP7702GasFeeTokensEnabled ??
      ((): Promise<boolean> => Promise.resolve(false));
    this.#isFirstTimeInteractionEnabled =
      isFirstTimeInteractionEnabled ?? ((): boolean => true);
    this.#isSimulationEnabled = isSimulationEnabled ?? ((): boolean => true);
    this.#isSwapsDisabled = disableSwaps ?? false;
    this.#isTimeoutEnabled = hooks?.isTimeoutEnabled ?? ((): boolean => true);
    this.#pendingTransactionOptions = pendingTransactions;
    this.#publicKeyEIP7702 = publicKeyEIP7702;
    this.#publish =
      hooks?.publish ??
      ((): Promise<{ transactionHash?: string }> =>
        Promise.resolve({ transactionHash: undefined }));
    this.#publishBatchHook = hooks?.publishBatch;
    this.#securityProviderRequest = securityProviderRequest;
    this.#sign = sign;
    this.#testGasFeeFlows = testGasFeeFlows === true;
    this.#trace = trace ?? (((_request, fn) => fn?.()) as TraceCallback);

    const findNetworkClientIdByChainId = (chainId: Hex): string => {
      return this.messenger.call(
        `NetworkController:findNetworkClientIdByChainId`,
        chainId,
      );
    };

    this.#multichainTrackingHelper = new MultichainTrackingHelper({
      findNetworkClientIdByChainId,
      getNetworkClientById: ((networkClientId: NetworkClientId) => {
        return this.messenger.call(
          `NetworkController:getNetworkClientById`,
          networkClientId,
        );
      }) as NetworkController['getNetworkClientById'],
      getNetworkClientRegistry,
      removePendingTransactionTrackerListeners:
        this.#removePendingTransactionTrackerListeners.bind(this),
      createNonceTracker: this.#createNonceTracker.bind(this),
      createPendingTransactionTracker:
        this.#createPendingTransactionTracker.bind(this),
      onNetworkStateChange: (listener): void => {
        this.messenger.subscribe('NetworkController:stateChange', listener);
      },
    });

    this.#multichainTrackingHelper.initialize();
    this.#gasFeeFlows = this.#getGasFeeFlows();
    this.#layer1GasFeeFlows = this.#getLayer1GasFeeFlows();

    const gasFeePoller = new GasFeePoller({
      gasFeeFlows: this.#gasFeeFlows,
      getGasFeeControllerEstimates: this.#getGasFeeEstimates,
      getTransactions: (): TransactionMeta[] => this.state.transactions,
      getTransactionBatches: (): TransactionBatchMeta[] =>
        this.state.transactionBatches,
      layer1GasFeeFlows: this.#layer1GasFeeFlows,
      messenger: this.messenger,
      onStateChange: (listener): void => {
        this.messenger.subscribe('TransactionController:stateChange', listener);
      },
    });

    gasFeePoller.hub.on(
      'transaction-updated',
      this.#onGasFeePollerTransactionUpdate.bind(this),
    );

    gasFeePoller.hub.on(
      'transaction-batch-updated',
      this.#onGasFeePollerTransactionBatchUpdate.bind(this),
    );

    this.#methodDataHelper = new MethodDataHelper({
      messenger: this.messenger,
      getState: (): Record<string, MethodData> => this.state.methodData,
    });

    this.#methodDataHelper.hub.on(
      'update',
      ({ fourBytePrefix, methodData }) => {
        this.update((_state) => {
          _state.methodData[fourBytePrefix] = methodData;
        });
      },
    );

    this.#incomingTransactionHelper = new IncomingTransactionHelper({
      client: this.#incomingTransactionOptions.client,
      getCurrentAccount: (): ReturnType<
        AccountsController['getSelectedAccount']
      > => this.#getSelectedAccount(),
      getLocalTransactions: (): TransactionMeta[] => this.state.transactions,
      includeTokenTransfers:
        this.#incomingTransactionOptions.includeTokenTransfers,
      isEnabled: this.#incomingTransactionOptions.isEnabled,
      messenger: this.messenger,
      remoteTransactionSource: new AccountsApiRemoteTransactionSource(),
      trimTransactions: this.#trimTransactionsForState.bind(this),
      updateTransactions: this.#incomingTransactionOptions.updateTransactions,
    });

    this.#addIncomingTransactionHelperListeners(
      this.#incomingTransactionHelper,
    );

    // when transactionsController state changes
    // check for pending transactions and start polling if there are any
    this.messenger.subscribe(
      'TransactionController:stateChange',
      this.#checkForPendingTransactionAndStartPolling,
    );

    // eslint-disable-next-line no-new
    new ResimulateHelper({
      simulateTransaction: this.#updateSimulationData.bind(this),
      onTransactionsUpdate: (listener): void => {
        this.messenger.subscribe(
          'TransactionController:stateChange',
          listener,
          (controllerState) => controllerState.transactions,
        );
      },
      getTransactions: (): TransactionMeta[] => this.state.transactions,
    });

    this.#onBootCleanup();
    this.#checkForPendingTransactionAndStartPolling();
    this.#registerActionHandlers();
  }

  /**
   * Stops polling and removes listeners to prepare the controller for garbage collection.
   */
  destroy(): void {
    this.#stopAllTracking();
  }

  /**
   * Handle new method data request.
   *
   * @param fourBytePrefix - The method prefix.
   * @param networkClientId - The ID of the network client used to fetch the method data.
   * @returns The method data object corresponding to the given signature prefix.
   */
  async handleMethodData(
    fourBytePrefix: string,
    networkClientId: NetworkClientId,
  ): Promise<MethodData> {
    return this.#methodDataHelper.lookup(fourBytePrefix, networkClientId);
  }

  /**
   * Add a batch of transactions to be submitted after approval.
   *
   * @param request - Request object containing the transactions to add.
   * @returns Result object containing the generated batch ID.
   */
  async addTransactionBatch(
    request: TransactionBatchRequest,
  ): Promise<TransactionBatchResult> {
    const { blockTracker } = this.messenger.call(
      `NetworkController:getNetworkClientById`,
      request.networkClientId,
    );

    return await addTransactionBatch({
      addTransaction: this.addTransaction.bind(this),
      estimateGas: this.estimateGas.bind(this),
      getGasFeeEstimates: this.#getGasFeeEstimates,
      getInternalAccounts: this.#getInternalAccounts.bind(this),
      getSimulationConfig: this.#getSimulationConfig.bind(this),
      getPendingTransactionTracker: (networkClientId: NetworkClientId) =>
        this.#createPendingTransactionTracker({
          blockTracker,
          networkClientId,
        }),
      getTransaction: (transactionId) =>
        this.#getTransactionOrThrow(transactionId),
      isSimulationEnabled: this.#isSimulationEnabled,
      messenger: this.messenger,
      publishBatchHook: this.#publishBatchHook,
      publicKeyEIP7702: this.#publicKeyEIP7702,
      publishTransaction: (transactionMeta: TransactionMeta) =>
        this.#publishTransaction(transactionMeta) as Promise<Hex>,
      request,
      signTransaction: this.#signTransaction.bind(this),
      update: this.update.bind(this),
      updateTransaction: this.#updateTransactionInternal.bind(this),
    });
  }

  /**
   * Determine which chains support atomic batch transactions with the given account address.
   *
   * @param request - Request object containing the account address and other parameters.
   * @returns  Result object containing the supported chains and related information.
   */
  async isAtomicBatchSupported(
    request: IsAtomicBatchSupportedRequest,
  ): Promise<IsAtomicBatchSupportedResult> {
    return isAtomicBatchSupported({
      ...request,
      messenger: this.messenger,
      publicKeyEIP7702: this.#publicKeyEIP7702,
    });
  }

  /**
   * Add a new unapproved transaction to state. Parameters will be validated, a
   * unique transaction ID will be generated, and `gas` and `gasPrice` will be calculated
   * if not provided. A `<tx.id>:unapproved` hub event will be emitted once added.
   *
   * @param txParams - Standard parameters for an Ethereum transaction.
   * @param options - Additional options to control how the transaction is added.
   * @returns Object containing a promise resolving to the transaction hash if approved.
   */
  async addTransaction(
    txParams: TransactionParams,
    options: AddTransactionOptions,
  ): Promise<Result> {
    log('Adding transaction', txParams, options);

    const {
      actionId,
      assetsFiatValues,
      batchId,
      deviceConfirmedOn,
      disableGasBuffer,
      gasFeeToken,
      isGasFeeIncluded,
      isGasFeeSponsored,
      isStateOnly,
      method,
      nestedTransactions,
      networkClientId,
      origin,
      publishHook,
      requestId,
      requiredAssets,
      requireApproval,
      securityAlertResponse,
      skipInitialGasEstimate,
      swaps = {},
      traceContext,
      type,
    } = options;

    // eslint-disable-next-line no-param-reassign
    txParams = normalizeTransactionParams(txParams);

    if (!this.#multichainTrackingHelper.has(networkClientId)) {
      throw new Error(`Network client not found - ${networkClientId}`);
    }

    const chainId = getChainId({ messenger: this.messenger, networkClientId });

    const permittedAddresses =
      origin === undefined
        ? undefined
        : await this.#getPermittedAccounts?.(origin);

    const internalAccounts = this.#getInternalAccounts();

    await validateTransactionOrigin({
      data: txParams.data,
      from: txParams.from,
      internalAccounts,
      origin,
      permittedAddresses,
      txParams,
      type,
    });

    const delegationAddressPromise = getDelegationAddress(
      txParams.from as Hex,
      this.messenger,
      networkClientId,
    ).catch(() => undefined);

    const isEIP1559Compatible =
      await this.#getEIP1559Compatibility(networkClientId);

    validateTxParams(txParams, isEIP1559Compatible, chainId);

    if (!txParams.type) {
      // Determine transaction type based on transaction parameters and network compatibility
      setEnvelopeType(txParams, isEIP1559Compatible);
    }

    const isDuplicateBatchId =
      batchId?.length &&
      this.state.transactions.some(
        (tx) => tx.batchId?.toLowerCase() === batchId?.toLowerCase(),
      );

    if (isDuplicateBatchId && origin && origin !== ORIGIN_METAMASK) {
      throw new JsonRpcError(
        ErrorCode.DuplicateBundleId,
        'Batch ID already exists',
      );
    }

    const dappSuggestedGasFees = this.#generateDappSuggestedGasFees(
      txParams,
      origin,
    );

    const transactionType =
      type ??
      (
        await determineTransactionType(txParams, {
          messenger: this.messenger,
          networkClientId,
        })
      ).type;

    let addedTransactionMeta: TransactionMeta = {
      actionId,
      assetsFiatValues,
      batchId,
      chainId,
      dappSuggestedGasFees,
      deviceConfirmedOn,
      disableGasBuffer,
      id: random(),
      isGasFeeTokenIgnoredIfBalance: Boolean(gasFeeToken),
      isGasFeeIncluded,
      isGasFeeSponsored,
      isFirstTimeInteraction: undefined,
      isStateOnly,
      nestedTransactions,
      networkClientId,
      origin,
      requestId,
      requiredAssets,
      securityAlertResponse,
      selectedGasFeeToken: gasFeeToken,
      status: TransactionStatus.unapproved as const,
      time: Date.now(),
      txParams,
      type: transactionType,
      userEditedGasLimit: false,
      verifiedOnBlockchain: false,
    };

    const { updateTransaction } = await this.#afterAdd({
      transactionMeta: addedTransactionMeta,
    });

    if (updateTransaction) {
      log('Updating transaction using afterAdd hook');

      addedTransactionMeta.txParamsOriginal = cloneDeep(
        addedTransactionMeta.txParams,
      );

      updateTransaction(addedTransactionMeta);
    }

    // eslint-disable-next-line no-negated-condition
    if (!skipInitialGasEstimate) {
      await this.#trace(
        { name: 'Estimate Gas Properties', parentContext: traceContext },
        (context) =>
          this.#updateGasProperties(addedTransactionMeta, {
            traceContext: context,
          }),
      );
    } else {
      const newTransactionMeta = cloneDeep(addedTransactionMeta);

      this.#updateGasProperties(newTransactionMeta)
        .then(() => {
          this.#updateTransactionInternal(
            {
              transactionId: newTransactionMeta.id,
              skipResimulateCheck: true,
              skipValidation: true,
            },
            (tx) => {
              tx.txParams.gas = newTransactionMeta.txParams.gas;
              tx.txParams.gasPrice = newTransactionMeta.txParams.gasPrice;
              tx.txParams.maxFeePerGas =
                newTransactionMeta.txParams.maxFeePerGas;
              tx.txParams.maxPriorityFeePerGas =
                newTransactionMeta.txParams.maxPriorityFeePerGas;
            },
          );

          return undefined;
        })
        .catch(noop);
    }

    // Set security provider response
    if (method && this.#securityProviderRequest) {
      const securityProviderResponse = await this.#securityProviderRequest(
        addedTransactionMeta,
        method,
      );
      // eslint-disable-next-line require-atomic-updates
      addedTransactionMeta.securityProviderResponse = securityProviderResponse;
    }

    addedTransactionMeta = updateSwapsTransaction(
      addedTransactionMeta,
      transactionType,
      swaps,
      {
        isSwapsDisabled: this.#isSwapsDisabled,
        cancelTransaction: this.#rejectTransaction.bind(this),
        messenger: this.messenger,
      },
    );

    this.#addMetadata(addedTransactionMeta);

    delegationAddressPromise
      .then((delegationAddress) => {
        this.#updateTransactionInternal(
          {
            transactionId: addedTransactionMeta.id,
            skipResimulateCheck: true,
            skipValidation: true,
          },
          (tx) => {
            tx.delegationAddress = delegationAddress;
          },
        );

        return undefined;
      })
      .catch(noop);

    if (requireApproval !== false && !isStateOnly) {
      this.#updateSimulationData(addedTransactionMeta, {
        traceContext,
      }).catch((error) => {
        log('Error while updating simulation data', error);
        throw error;
      });

      updateFirstTimeInteraction({
        existingTransactions: this.state.transactions,
        getTransaction: (transactionId: string) =>
          this.#getTransaction(transactionId),
        isFirstTimeInteractionEnabled: this.#isFirstTimeInteractionEnabled,
        trace: this.#trace,
        traceContext,
        transactionMeta: addedTransactionMeta,
        updateTransaction: this.#updateTransactionInternal.bind(this),
      }).catch((error) => {
        log('Error while updating first interaction properties', error);
      });
    } else {
      log(
        'Skipping simulation & first interaction update as approval not required',
      );
    }

    this.messenger.publish(
      `${controllerName}:unapprovedTransactionAdded`,
      addedTransactionMeta,
    );

    return {
      result: this.#processApproval(addedTransactionMeta, {
        actionId,
        publishHook,
        requireApproval,
        traceContext,
      }),
      transactionMeta: addedTransactionMeta,
    };
  }

  /**
   * Starts polling for incoming transactions from the remote transaction source.
   */
  startIncomingTransactionPolling(): void {
    this.#incomingTransactionHelper.start();
  }

  /**
   * Stops polling for incoming transactions from the remote transaction source.
   */
  stopIncomingTransactionPolling(): void {
    this.#incomingTransactionHelper.stop();
  }

  /**
   * Update the incoming transactions by polling the remote transaction source.
   *
   * @param request - Request object.
   * @param request.tags - Additional tags to identify the source of the request.
   */
  async updateIncomingTransactions({
    tags,
  }: { tags?: string[] } = {}): Promise<void> {
    await this.#incomingTransactionHelper.update({ tags });
  }

  /**
   * Attempts to cancel a transaction based on its ID by setting its status to "rejected"
   * and emitting a `<tx.id>:finished` hub event.
   *
   * @param transactionId - The ID of the transaction to cancel.
   * @param gasValues - The gas values to use for the cancellation transaction.
   * @param options - The options for the cancellation transaction.
   * @param options.actionId - Unique ID persisted on transaction metadata.
   * @param options.estimatedBaseFee - The estimated base fee of the transaction.
   */
  async stopTransaction(
    transactionId: string,
    gasValues?: GasPriceValue | FeeMarketEIP1559Values,
    {
      estimatedBaseFee,
      actionId,
    }: { estimatedBaseFee?: string; actionId?: string } = {},
  ): Promise<void> {
    await this.#retryTransaction({
      actionId,
      estimatedBaseFee,
      gasValues,
      label: 'cancel',
      rate: CANCEL_RATE,
      transactionId,
      transactionType: TransactionType.cancel,
      prepareTransactionParams: (txParams) => {
        delete txParams.data;
        txParams.to = txParams.from;
        txParams.value = '0x0';
      },
      afterSubmit: (newTransactionMeta) => {
        this.messenger.publish(
          `${controllerName}:transactionFinished`,
          newTransactionMeta,
        );

        this.#internalEvents.emit(
          `${newTransactionMeta.id}:finished`,
          newTransactionMeta,
        );
      },
    });
  }

  /**
   * Attempts to speed up a transaction increasing transaction gasPrice by ten percent.
   *
   * @param transactionId - The ID of the transaction to speed up.
   * @param gasValues - The gas values to use for the speed up transaction.
   * @param options - The options for the speed up transaction.
   * @param options.actionId - Unique ID persisted on transaction metadata.
   * @param options.estimatedBaseFee - The estimated base fee of the transaction.
   */
  async speedUpTransaction(
    transactionId: string,
    gasValues?: GasPriceValue | FeeMarketEIP1559Values,
    {
      actionId,
      estimatedBaseFee,
    }: { actionId?: string; estimatedBaseFee?: string } = {},
  ): Promise<void> {
    await this.#retryTransaction({
      actionId,
      estimatedBaseFee,
      gasValues,
      label: 'speed up',
      rate: SPEED_UP_RATE,
      transactionId,
      transactionType: TransactionType.retry,
      afterSubmit: (newTransactionMeta) => {
        this.messenger.publish(
          `${controllerName}:speedupTransactionAdded`,
          newTransactionMeta,
        );
      },
    });
  }

  async #retryTransaction({
    actionId,
    afterSubmit,
    estimatedBaseFee,
    gasValues,
    label,
    prepareTransactionParams,
    rate,
    transactionId,
    transactionType,
  }: {
    actionId?: string;
    afterSubmit?: (transactionMeta: TransactionMeta) => void;
    estimatedBaseFee?: string;
    gasValues?: GasPriceValue | FeeMarketEIP1559Values;
    label: string;
    prepareTransactionParams?: (txParams: TransactionParams) => void;
    rate: number;
    transactionId: string;
    transactionType: TransactionType;
  }): Promise<void> {
    if (gasValues) {
      // Not good practice to reassign a parameter but temporarily avoiding a larger refactor.
      // eslint-disable-next-line no-param-reassign
      gasValues = normalizeGasFeeValues(gasValues);
      validateGasValues(gasValues);
    }

    log(`Creating ${label} transaction`, transactionId, gasValues);

    const transactionMeta = this.#getTransaction(transactionId);
    /* istanbul ignore next */
    if (!transactionMeta) {
      return;
    }

    /* istanbul ignore next */
    if (!this.#sign) {
      throw new Error('No sign method defined.');
    }

    const newTxParams: TransactionParams =
      getTransactionParamsWithIncreasedGasFee(
        transactionMeta.txParams,
        rate,
        gasValues,
      );

    prepareTransactionParams?.(newTxParams);

    const unsignedEthTx = prepareTransaction(
      transactionMeta.chainId,
      newTxParams,
    );

    const signedTx = await this.#sign(
      unsignedEthTx,
      transactionMeta.txParams.from,
    );

    const transactionMetaWithRsv = this.#updateTransactionMetaRSV(
      transactionMeta,
      signedTx,
    );

    const rawTx = serializeTransaction(signedTx);
    const newFee = newTxParams.maxFeePerGas ?? newTxParams.gasPrice;

    const oldFee = newTxParams.maxFeePerGas
      ? transactionMetaWithRsv.txParams.maxFeePerGas
      : transactionMetaWithRsv.txParams.gasPrice;

    log(`Submitting ${label} transaction`, {
      oldFee,
      newFee,
      txParams: newTxParams,
    });

    const newTransactionMeta = {
      ...transactionMetaWithRsv,
      actionId,
      estimatedBaseFee,
      id: random(),
      originalGasEstimate: transactionMeta.txParams.gas,
      originalType: transactionMeta.type,
      rawTx,
      time: Date.now(),
      txParams: newTxParams,
      type: transactionType,
    };

    const hash = await this.#publishTransactionForRetry({
      ...newTransactionMeta,
      origin: label,
    });

    newTransactionMeta.hash = hash;

    this.#addMetadata(newTransactionMeta);

    // speedUpTransaction has no approval request, so we assume the user has already approved the transaction
    this.messenger.publish(`${controllerName}:transactionApproved`, {
      transactionMeta: newTransactionMeta,
      actionId,
    });

    this.messenger.publish(`${controllerName}:transactionSubmitted`, {
      transactionMeta: newTransactionMeta,
      actionId,
    });

    afterSubmit?.(newTransactionMeta);
  }

  /**
   * Estimates required gas for a given transaction.
   *
   * @param transaction - The transaction to estimate gas for.
   * @param networkClientId - The network client id to use for the estimate.
   * @param options - Additional options for the estimate.
   * @param options.ignoreDelegationSignatures - Ignore signature errors if submitting delegations to the DelegationManager.
   * @returns The gas and gas price.
   */
  async estimateGas(
    transaction: TransactionParams,
    networkClientId: NetworkClientId,
    {
      ignoreDelegationSignatures,
    }: {
      ignoreDelegationSignatures?: boolean;
    } = {},
  ): Promise<{
    gas: string;
    simulationFails: TransactionMeta['simulationFails'];
  }> {
    const { estimatedGas, simulationFails } = await estimateGas({
      ignoreDelegationSignatures,
      isSimulationEnabled: this.#isSimulationEnabled(),
      getSimulationConfig: this.#getSimulationConfig,
      messenger: this.messenger,
      networkClientId,
      txParams: transaction,
    });

    return { gas: estimatedGas, simulationFails };
  }

  /**
   * Estimates required gas for a batch of transactions.
   *
   * @param request - Request object.
   * @param request.chainId - Chain ID of the transactions.
   * @param request.from - Address of the sender.
   * @param request.transactions - Array of transactions within a batch request.
   * @returns Object containing the gas limit.
   */
  async estimateGasBatch({
    chainId,
    from,
    transactions,
  }: {
    chainId: Hex;
    from: Hex;
    transactions: BatchTransactionParams[];
  }): Promise<{ totalGasLimit: number; gasLimits: number[] }> {
    return estimateGasBatch({
      from,
      getSimulationConfig: this.#getSimulationConfig,
      isAtomicBatchSupported: this.isAtomicBatchSupported.bind(this),
      messenger: this.messenger,
      networkClientId: getNetworkClientId({
        messenger: this.messenger,
        chainId,
      }),
      transactions,
    });
  }

  /**
   * Estimates required gas for a given transaction and add additional gas buffer with the given multiplier.
   *
   * @param transaction - The transaction params to estimate gas for.
   * @param multiplier - The multiplier to use for the gas buffer.
   * @param networkClientId - The network client id to use for the estimate.
   * @returns The buffered estimated gas and whether the estimation failed.
   */
  async estimateGasBuffered(
    transaction: TransactionParams,
    multiplier: number,
    networkClientId: NetworkClientId,
  ): Promise<{
    gas: string;
    simulationFails: TransactionMeta['simulationFails'];
  }> {
    const { blockGasLimit, estimatedGas, simulationFails } = await estimateGas({
      isSimulationEnabled: this.#isSimulationEnabled(),
      getSimulationConfig: this.#getSimulationConfig,
      messenger: this.messenger,
      networkClientId,
      txParams: transaction,
    });

    const gas = addGasBuffer(estimatedGas, blockGasLimit, multiplier);

    return {
      gas,
      simulationFails,
    };
  }

  /**
   * Updates an existing transaction in state.
   *
   * @param transactionMeta - The new transaction to store in state.
   * @param note - A note or update reason to be logged.
   */
  updateTransaction(transactionMeta: TransactionMeta, note: string): void {
    const { id: transactionId } = transactionMeta;

    this.#updateTransactionInternal({ transactionId }, () => ({
      ...transactionMeta,
    }));

    log('Transaction updated', { transactionId, note });
  }

  /**
   * Update the security alert response for a transaction.
   *
   * @param transactionId - ID of the transaction.
   * @param securityAlertResponse - The new security alert response for the transaction.
   */
  updateSecurityAlertResponse(
    transactionId: string,
    securityAlertResponse: SecurityAlertResponse,
  ): void {
    if (!securityAlertResponse) {
      throw new Error(
        'updateSecurityAlertResponse: securityAlertResponse should not be null',
      );
    }
    const transactionMeta = this.#getTransaction(transactionId);
    if (!transactionMeta) {
      throw new Error(
        `Cannot update security alert response as no transaction metadata found`,
      );
    }
    const updatedTransactionMeta = {
      ...transactionMeta,
      securityAlertResponse,
    };
    this.updateTransaction(
      updatedTransactionMeta,
      `${controllerName}:updatesecurityAlertResponse - securityAlertResponse updated`,
    );
  }

  /**
   * Remove transactions from state.
   *
   * @param options - The options bag.
   * @param options.address - Remove transactions from this account only. Defaults to all accounts.
   * @param options.chainId - Remove transactions for the specified chain only. Defaults to all chains.
   */
  wipeTransactions({
    address,
    chainId,
  }: {
    address?: string;
    chainId?: string;
  } = {}): void {
    if (!chainId && !address) {
      this.update((state) => {
        state.transactions = [];
      });

      return;
    }

    const newTransactions = this.state.transactions.filter(
      ({ chainId: txChainId, txParams, type }) => {
        const isMatchingNetwork = !chainId || chainId === txChainId;

        if (!isMatchingNetwork) {
          return true;
        }

        const isMatchingAddress =
          !address ||
          txParams.from?.toLowerCase() === address.toLowerCase() ||
          (type === TransactionType.incoming &&
            txParams.to?.toLowerCase() === address.toLowerCase());

        return !isMatchingAddress;
      },
    );

    this.update((state) => {
      state.transactions = this.#trimTransactionsForState(newTransactions);
    });
  }

  /**
   * @deprecated No longer used. Kept only to avoid breaking changes. It now performs no operations.
   * @param transactionID - The ID of the transaction to update.
   * @param _currentSendFlowHistoryLength - The length of the current sendFlowHistory array.
   * @param _sendFlowHistoryToAdd - The sendFlowHistory entries to add.
   * @returns The transactionMeta.
   */
  updateTransactionSendFlowHistory(
    transactionID: string,
    _currentSendFlowHistoryLength: number,
    _sendFlowHistoryToAdd: SendFlowHistoryEntry[],
  ): TransactionMeta {
    // Return the transaction unchanged
    return this.#getTransactionOrThrow(transactionID);
  }

  /**
   * Adds external provided transaction to state as confirmed transaction.
   *
   * @param transactionMeta - TransactionMeta to add transactions.
   * @param transactionReceipt - TransactionReceipt of the external transaction.
   * @param baseFeePerGas - Base fee per gas of the external transaction.
   */
  async confirmExternalTransaction(
    transactionMeta: TransactionMeta,
    transactionReceipt: TransactionReceipt,
    baseFeePerGas: Hex,
  ): Promise<void> {
    // Run validation and add external transaction to state.
    const newTransactionMeta = this.#addExternalTransaction(transactionMeta);

    try {
      const transactionId = newTransactionMeta.id;

      // Make sure status is confirmed and define gasUsed as in receipt.
      const updatedTransactionMeta = {
        ...newTransactionMeta,
        status: TransactionStatus.confirmed as const,
        txReceipt: transactionReceipt,
      };
      if (baseFeePerGas) {
        updatedTransactionMeta.baseFeePerGas = baseFeePerGas;
      }

      // Update same nonce local transactions as dropped and define replacedBy properties.
      this.#markNonceDuplicatesDropped(transactionId);

      // Update external provided transaction with updated gas values and confirmed status.
      this.updateTransaction(
        updatedTransactionMeta,
        `${controllerName}:confirmExternalTransaction - Add external transaction`,
      );
      this.#onTransactionStatusChange(updatedTransactionMeta);

      // Intentional given potential duration of process.
      this.#updatePostBalance(updatedTransactionMeta).catch((error) => {
        /* istanbul ignore next */
        log('Error while updating post balance', error);
        throw error;
      });

      this.messenger.publish(
        `${controllerName}:transactionConfirmed`,
        updatedTransactionMeta,
      );
    } catch (error) {
      console.error('Failed to confirm external transaction', error);
    }
  }

  /**
   * Update the gas values of a transaction.
   *
   * @param transactionId - The ID of the transaction to update.
   * @param gasValues - Gas values to update.
   * @param gasValues.gas - Same as transaction.gasLimit.
   * @param gasValues.gasLimit - Maxmimum number of units of gas to use for this transaction.
   * @param gasValues.gasPrice - Price per gas for legacy transactions.
   * @param gasValues.maxPriorityFeePerGas - Maximum amount per gas to give to validator as incentive.
   * @param gasValues.maxFeePerGas - Maximum amount per gas to pay for the transaction, including the priority fee.
   * @param gasValues.estimateUsed - Which estimate level was used.
   * @param gasValues.estimateSuggested - Which estimate level that the API suggested.
   * @param gasValues.defaultGasEstimates - The default estimate for gas.
   * @param gasValues.originalGasEstimate - Original estimate for gas.
   * @param gasValues.userEditedGasLimit - The gas limit supplied by user.
   * @param gasValues.userFeeLevel - Estimate level user selected.
   * @returns The updated transactionMeta.
   */
  updateTransactionGasFees(
    transactionId: string,
    {
      defaultGasEstimates,
      estimateUsed,
      estimateSuggested,
      gas,
      gasLimit,
      gasPrice,
      maxPriorityFeePerGas,
      maxFeePerGas,
      originalGasEstimate,
      userEditedGasLimit,
      userFeeLevel: userFeeLevelParam,
    }: {
      defaultGasEstimates?: string;
      estimateUsed?: string;
      estimateSuggested?: string;
      gas?: string;
      gasLimit?: string;
      gasPrice?: string;
      maxPriorityFeePerGas?: string;
      maxFeePerGas?: string;
      originalGasEstimate?: string;
      userEditedGasLimit?: boolean;
      userFeeLevel?: string;
    },
  ): TransactionMeta {
    const transactionMeta = this.#getTransaction(transactionId);

    if (!transactionMeta) {
      throw new Error(
        `Cannot update transaction as no transaction metadata found`,
      );
    }

    validateIfTransactionUnapprovedOrSubmitted(
      transactionMeta,
      'updateTransactionGasFees',
    );

    const clonedTransactionMeta = cloneDeep(transactionMeta);
    const isTransactionGasFeeEstimatesExists = transactionMeta.gasFeeEstimates;
    const isAutomaticGasFeeUpdateEnabled =
      this.#isAutomaticGasFeeUpdateEnabled(transactionMeta);
    const userFeeLevel = userFeeLevelParam as GasFeeEstimateLevelType;
    const isOneOfFeeLevelSelected =
      Object.values(GasFeeEstimateLevel).includes(userFeeLevel);
    const shouldUpdateTxParamsGasFees =
      isTransactionGasFeeEstimatesExists &&
      isAutomaticGasFeeUpdateEnabled &&
      isOneOfFeeLevelSelected;

    if (shouldUpdateTxParamsGasFees) {
      updateTransactionGasEstimates({
        txMeta: clonedTransactionMeta,
        userFeeLevel,
      });
    }

    const txParamsUpdate = {
      gas,
      gasLimit,
    };

    if (shouldUpdateTxParamsGasFees) {
      // Get updated values from clonedTransactionMeta if we're using automated fee updates
      Object.assign(txParamsUpdate, {
        gasPrice: clonedTransactionMeta.txParams.gasPrice,
        maxPriorityFeePerGas:
          clonedTransactionMeta.txParams.maxPriorityFeePerGas,
        maxFeePerGas: clonedTransactionMeta.txParams.maxFeePerGas,
      });
    } else {
      Object.assign(txParamsUpdate, {
        gasPrice,
        maxPriorityFeePerGas,
        maxFeePerGas,
      });
    }

    const transactionGasFees = {
      txParams: pickBy(txParamsUpdate),
      defaultGasEstimates,
      estimateUsed,
      estimateSuggested,
      originalGasEstimate,
      userEditedGasLimit,
      userFeeLevel,
    };

    const filteredTransactionGasFees = pickBy(transactionGasFees);

    this.#updateTransactionInternal(
      {
        transactionId,
        skipResimulateCheck: true,
      },
      (draftTxMeta) => {
        const { txParams, ...otherProps } = filteredTransactionGasFees;
        Object.assign(draftTxMeta, otherProps);
        if (txParams) {
          Object.assign(draftTxMeta.txParams, txParams);
        }
      },
    );

    return this.#getTransaction(transactionId) as TransactionMeta;
  }

  /**
   * Update the previous gas values of a transaction.
   *
   * @param transactionId - The ID of the transaction to update.
   * @param previousGas - Previous gas values to update.
   * @param previousGas.gasLimit - Maximum number of units of gas to use for this transaction.
   * @param previousGas.maxFeePerGas - Maximum amount per gas to pay for the transaction, including the priority fee.
   * @param previousGas.maxPriorityFeePerGas - Maximum amount per gas to give to validator as incentive.
   * @returns The updated transactionMeta.
   */
  updatePreviousGasParams(
    transactionId: string,
    {
      gasLimit,
      maxFeePerGas,
      maxPriorityFeePerGas,
    }: {
      gasLimit?: string;
      maxFeePerGas?: string;
      maxPriorityFeePerGas?: string;
    },
  ): TransactionMeta {
    const transactionMeta = this.#getTransaction(transactionId);

    if (!transactionMeta) {
      throw new Error(
        `Cannot update transaction as no transaction metadata found`,
      );
    }

    validateIfTransactionUnapprovedOrSubmitted(
      transactionMeta,
      'updatePreviousGasParams',
    );

    const transactionPreviousGas = {
      previousGas: {
        gasLimit,
        maxFeePerGas,
        maxPriorityFeePerGas,
      },
      // TODO: Replace `any` with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    // only update what is defined
    transactionPreviousGas.previousGas = pickBy(
      transactionPreviousGas.previousGas,
    );

    // merge updated previous gas values with existing transaction meta
    const updatedMeta = merge({}, transactionMeta, transactionPreviousGas);

    this.updateTransaction(
      updatedMeta,
      `${controllerName}:updatePreviousGasParams - Previous gas values updated`,
    );

    return this.#getTransaction(transactionId) as TransactionMeta;
  }

  /**
   * Acquires a nonce lock for the given address on the specified network,
   * ensuring that nonces are assigned sequentially without conflicts.
   *
   * @param address - The account address for which to acquire the nonce lock.
   * @param networkClientId - The ID of the network client to use.
   * @returns A promise that resolves to a nonce lock containing the next nonce and a release function.
   */
  async getNonceLock(
    address: string,
    networkClientId: NetworkClientId,
  ): Promise<NonceLock> {
    return this.#multichainTrackingHelper.getNonceLock(
      address,
      networkClientId,
    );
  }

  /**
   * Updates the editable parameters of a transaction.
   *
   * @param txId - The ID of the transaction to update.
   * @param params - The editable parameters to update.
   * @param params.containerTypes - Container types applied to the parameters.
   * @param params.data - Data to pass with the transaction.
   * @param params.from - Address to send the transaction from.
   * @param params.gas - Maximum number of units of gas to use for the transaction.
   * @param params.gasPrice - Price per gas for legacy transactions.
   * @param params.maxFeePerGas - Maximum amount per gas to pay for the transaction, including the priority fee.
   * @param params.maxPriorityFeePerGas - Maximum amount per gas to give to validator as incentive.
   * @param params.updateType - Whether to update the transaction type. Defaults to `true`.
   * @param params.to - Address to send the transaction to.
   * @param params.value - Value associated with the transaction.
   * @returns The updated transaction metadata.
   */
  async updateEditableParams(
    txId: string,
    {
      containerTypes,
      data,
      from,
      gas,
      gasPrice,
      maxFeePerGas,
      maxPriorityFeePerGas,
      to,
      updateType,
      value,
    }: {
      containerTypes?: TransactionContainerType[];
      data?: string;
      from?: string;
      gas?: string;
      gasPrice?: string;
      maxFeePerGas?: string;
      maxPriorityFeePerGas?: string;
      to?: string;
      updateType?: boolean;
      value?: string;
    },
  ): Promise<Readonly<TransactionMeta> | undefined> {
    const transactionMeta = this.#getTransaction(txId);

    if (!transactionMeta) {
      throw new Error(
        `Cannot update editable params as no transaction metadata found`,
      );
    }

    validateIfTransactionUnapproved(transactionMeta, 'updateEditableParams');

    const editableParams = {
      txParams: {
        data,
        from,
        to,
        value,
        gas,
        gasPrice,
        maxFeePerGas,
        maxPriorityFeePerGas,
      },
    } as Partial<TransactionMeta>;

    editableParams.txParams = pickBy(
      editableParams.txParams,
    ) as TransactionParams;

    const updatedTransaction = merge({}, transactionMeta, editableParams);

    const { networkClientId } = transactionMeta;

    if (updateType !== false) {
      const { type } = await determineTransactionType(
        updatedTransaction.txParams,
        {
          messenger: this.messenger,
          networkClientId,
        },
      );

      updatedTransaction.type = type;
    }

    if (containerTypes) {
      updatedTransaction.containerTypes = containerTypes;
    }

    await updateTransactionLayer1GasFee({
      layer1GasFeeFlows: this.#layer1GasFeeFlows,
      messenger: this.messenger,
      transactionMeta: updatedTransaction,
    });

    this.updateTransaction(
      updatedTransaction,
      `Update Editable Params for ${txId}`,
    );

    return this.#getTransaction(txId);
  }

  /**
   * Update the isActive state of a transaction.
   *
   * @param transactionId - The ID of the transaction to update.
   * @param isActive - The active state.
   */
  setTransactionActive(transactionId: string, isActive: boolean): void {
    const transactionMeta = this.#getTransaction(transactionId);

    if (!transactionMeta) {
      throw new Error(`Transaction with id ${transactionId} not found`);
    }

    this.#updateTransactionInternal(
      {
        transactionId,
        skipValidation: true,
        skipResimulateCheck: true,
      },
      (updatedTransactionMeta) => {
        updatedTransactionMeta.isActive = isActive;
      },
    );
  }

  /**
   * Signs and returns the raw transaction data for provided transaction params list.
   *
   * @param listOfTxParams - The list of transaction params to approve.
   * @param opts - Options bag.
   * @param opts.hasNonce - Whether the transactions already have a nonce.
   * @returns The raw transactions.
   */
  async approveTransactionsWithSameNonce(
    listOfTxParams: (TransactionParams & { chainId: Hex })[] = [],
    { hasNonce }: { hasNonce?: boolean } = {},
  ): Promise<string | string[]> {
    log('Approving transactions with same nonce', {
      transactions: listOfTxParams,
    });

    if (listOfTxParams.length === 0) {
      return '';
    }

    const initialTx = listOfTxParams[0];
    const { chainId } = initialTx;
    const networkClientId = getNetworkClientId({
      messenger: this.messenger,
      chainId,
    });
    const initialTxAsEthTx = prepareTransaction(chainId, initialTx);
    const initialTxAsSerializedHex = serializeTransaction(initialTxAsEthTx);

    if (this.#approvingTransactionIds.has(initialTxAsSerializedHex)) {
      return '';
    }

    this.#approvingTransactionIds.add(initialTxAsSerializedHex);

    let rawTransactions, nonceLock;
    try {
      // TODO: we should add a check to verify that all transactions have the same from address
      const fromAddress = initialTx.from;
      const requiresNonce = hasNonce !== true;

      nonceLock = requiresNonce
        ? await this.getNonceLock(fromAddress, networkClientId)
        : undefined;

      const nonce = nonceLock
        ? add0x(nonceLock.nextNonce.toString(16))
        : initialTx.nonce;

      if (nonceLock) {
        log('Using nonce from nonce tracker', nonce, nonceLock.nonceDetails);
      }

      rawTransactions = await Promise.all(
        listOfTxParams.map((txParams) => {
          txParams.nonce = nonce;
          return this.#signExternalTransaction(txParams.chainId, txParams);
        }),
      );
    } catch (error) {
      log('Error while signing transactions with same nonce', error);
      // Must set transaction to submitted/failed before releasing lock
      // continue with error chain
      throw error;
    } finally {
      nonceLock?.releaseLock();
      this.#approvingTransactionIds.delete(initialTxAsSerializedHex);
    }
    return rawTransactions;
  }

  /**
   * Update a custodial transaction.
   *
   * @param request - The custodial transaction update request.
   *
   * @returns The updated transaction metadata.
   */
  updateCustodialTransaction(
    request: UpdateCustodialTransactionRequest,
  ): TransactionMeta {
    const {
      transactionId,
      errorMessage,
      hash,
      status,
      gasLimit,
      gasPrice,
      maxFeePerGas,
      maxPriorityFeePerGas,
      nonce,
      type,
    } = request;

    const transactionMeta = this.#getTransaction(transactionId);

    if (!transactionMeta) {
      throw new Error(
        `Cannot update custodial transaction as no transaction metadata found`,
      );
    }

    if (
      status &&
      ![
        TransactionStatus.submitted,
        TransactionStatus.signed,
        TransactionStatus.failed,
      ].includes(status)
    ) {
      throw new Error(
        `Cannot update custodial transaction with status: ${status}`,
      );
    }
    const updatedTransactionMeta = merge(
      {},
      transactionMeta,
      pickBy({ hash, status }),
    ) as TransactionMeta;

    if (updatedTransactionMeta.status === TransactionStatus.submitted) {
      updatedTransactionMeta.submittedTime = new Date().getTime();
    }

    if (updatedTransactionMeta.status === TransactionStatus.failed) {
      updatedTransactionMeta.error = normalizeTxError(new Error(errorMessage));
    }

    // Update txParams properties with a single pickBy operation
    updatedTransactionMeta.txParams = merge(
      {},
      updatedTransactionMeta.txParams,
      pickBy({
        gasLimit,
        gasPrice,
        maxFeePerGas,
        maxPriorityFeePerGas,
        nonce,
        type,
      }),
    );

    // Special case for type change to legacy
    if (type === TransactionEnvelopeType.legacy) {
      delete updatedTransactionMeta.txParams.maxFeePerGas;
      delete updatedTransactionMeta.txParams.maxPriorityFeePerGas;
    }

    this.updateTransaction(
      updatedTransactionMeta,
      `${controllerName}:updateCustodialTransaction - Custodial transaction updated`,
    );

    if (
      status &&
      [TransactionStatus.submitted, TransactionStatus.failed].includes(status)
    ) {
      this.messenger.publish(
        `${controllerName}:transactionFinished`,
        updatedTransactionMeta,
      );
      this.#internalEvents.emit(
        `${updatedTransactionMeta.id}:finished`,
        updatedTransactionMeta,
      );
    }

    return updatedTransactionMeta;
  }

  /**
   * Search transaction metadata for matching entries.
   *
   * @param opts - Options bag.
   * @param opts.initialList - The transactions to search. Defaults to the current state.
   * @param opts.limit - The maximum number of transactions to return. No limit by default.
   * @param opts.searchCriteria - An object containing values or functions for transaction properties to filter transactions with.
   * @returns An array of transactions matching the provided options.
   */
  getTransactions({
    initialList,
    limit,
    searchCriteria = {},
  }: {
    initialList?: TransactionMeta[];
    limit?: number;
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    searchCriteria?: any;
  } = {}): TransactionMeta[] {
    // searchCriteria is an object that might have values that aren't predicate
    // methods. When providing any other value type (string, number, etc), we
    // consider this shorthand for "check the value at key for strict equality
    // with the provided value". To conform this object to be only methods, we
    // mapValues (lodash) such that every value on the object is a method that
    // returns a boolean.
    const predicateMethods = mapValues(searchCriteria, (predicate) => {
      return typeof predicate === 'function'
        ? predicate
        : // TODO: Replace `any` with type
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (value: any): boolean => value === predicate;
    });

    const transactionsToFilter = initialList ?? this.state.transactions;

    // Combine sortBy and pickBy to transform our state object into an array of
    // matching transactions that are sorted by time.
    const filteredTransactions = sortBy(
      pickBy(transactionsToFilter, (transaction) => {
        // iterate over the predicateMethods keys to check if the transaction
        // matches the searchCriteria
        for (const [key, predicate] of Object.entries(predicateMethods)) {
          // We return false early as soon as we know that one of the specified
          // search criteria do not match the transaction. This prevents
          // needlessly checking all criteria when we already know the criteria
          // are not fully satisfied. We check both txParams and the base
          // object as predicate keys can be either.
          if (key in transaction.txParams) {
            // TODO: Replace `any` with type
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (predicate((transaction.txParams as any)[key]) === false) {
              return false;
            }
            // TODO: Replace `any` with type
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } else if (predicate((transaction as any)[key]) === false) {
            return false;
          }
        }

        return true;
      }),
      'time',
    );
    if (limit !== undefined) {
      // We need to have all transactions of a given nonce in order to display
      // necessary details in the UI. We use the size of this set to determine
      // whether we have reached the limit provided, thus ensuring that all
      // transactions of nonces we include will be sent to the UI.
      const nonces = new Set();
      const txs = [];
      // By default, the transaction list we filter from is sorted by time ASC.
      // To ensure that filtered results prefers the newest transactions we
      // iterate from right to left, inserting transactions into front of a new
      // array. The original order is preserved, but we ensure that newest txs
      // are preferred.
      for (let i = filteredTransactions.length - 1; i > -1; i--) {
        const txMeta = filteredTransactions[i];
        const { nonce } = txMeta.txParams;
        if (!nonces.has(nonce)) {
          if (nonces.size < limit) {
            nonces.add(nonce);
          } else {
            continue;
          }
        }
        // Push transaction into the beginning of our array to ensure the
        // original order is preserved.
        txs.unshift(txMeta);
      }
      return txs;
    }
    return filteredTransactions;
  }

  /**
   * Estimates the gas fees for a transaction.
   *
   * @param args - The arguments for estimating gas fees.
   * @param args.transactionParams - The transaction parameters to estimate fees for.
   * @param args.chainId - The chain ID to use. If not provided, the network client ID is used to determine the chain.
   * @param args.networkClientId - The network client ID to use for the estimation.
   * @returns A promise that resolves to the estimated gas fee response.
   */
  async estimateGasFee({
    transactionParams,
    chainId,
    networkClientId: requestNetworkClientId,
  }: {
    transactionParams: TransactionParams;
    chainId?: Hex;
    networkClientId?: NetworkClientId;
  }): Promise<GasFeeFlowResponse> {
    const { id: networkClientId } =
      this.#multichainTrackingHelper.getNetworkClient({
        chainId,
        networkClientId: requestNetworkClientId,
      });

    const transactionMeta = {
      txParams: transactionParams,
      chainId,
      networkClientId,
    } as TransactionMeta;

    // Guaranteed as the default gas fee flow matches all transactions.
    const gasFeeFlow = getGasFeeFlow(
      transactionMeta,
      this.#gasFeeFlows,
      this.messenger,
    ) as GasFeeFlow;

    const gasFeeControllerData = await this.#getGasFeeEstimates({
      networkClientId,
    });

    return gasFeeFlow.getGasFees({
      gasFeeControllerData,
      messenger: this.messenger,
      transactionMeta,
    });
  }

  /**
   * Determine the layer 1 gas fee for the given transaction parameters.
   *
   * @param request - The request object.
   * @param request.transactionParams - The transaction parameters to estimate the layer 1 gas fee for.
   * @param request.chainId - The ID of the chain where the transaction will be executed.
   * @param request.networkClientId - The ID of a specific network client to process the transaction.
   * @returns The layer 1 gas fee.
   */
  async getLayer1GasFee({
    transactionParams,
    chainId,
    networkClientId,
  }: {
    transactionParams: TransactionParams;
    chainId?: Hex;
    networkClientId?: NetworkClientId;
  }): Promise<Hex | undefined> {
    const resolvedNetworkClientId = getNetworkClientId({
      messenger: this.messenger,
      chainId,
      networkClientId,
    });

    return await getTransactionLayer1GasFee({
      layer1GasFeeFlows: this.#layer1GasFeeFlows,
      messenger: this.messenger,
      transactionMeta: {
        txParams: transactionParams,
        chainId,
        networkClientId: resolvedNetworkClientId,
      } as TransactionMeta,
    });
  }

  async #signExternalTransaction(
    chainId: Hex,
    transactionParams: TransactionParams,
  ): Promise<string> {
    if (!this.#sign) {
      throw new Error('No sign method defined.');
    }

    const normalizedTransactionParams =
      normalizeTransactionParams(transactionParams);
    const type = isEIP1559Transaction(normalizedTransactionParams)
      ? TransactionEnvelopeType.feeMarket
      : TransactionEnvelopeType.legacy;
    const updatedTransactionParams = {
      ...normalizedTransactionParams,
      type,
      gasLimit: normalizedTransactionParams.gas,
      chainId,
    };

    const { from } = updatedTransactionParams;

    const unsignedTransaction = prepareTransaction(
      chainId,
      updatedTransactionParams,
    );

    const signedTransaction = await this.#sign(unsignedTransaction, from);
    const rawTransaction = serializeTransaction(signedTransaction);

    return rawTransaction;
  }

  /**
   * Removes unapproved transactions from state.
   */
  clearUnapprovedTransactions(): void {
    const transactions = this.state.transactions.filter(
      ({ status }) => status !== TransactionStatus.unapproved,
    );
    this.update((state) => {
      state.transactions = this.#trimTransactionsForState(transactions);
    });
  }

  /**
   * Stop the signing process for a specific transaction.
   * Throws an error causing the transaction status to be set to failed.
   *
   * @param transactionId - The ID of the transaction to stop signing.
   */
  abortTransactionSigning(transactionId: string): void {
    const transactionMeta = this.#getTransaction(transactionId);

    if (!transactionMeta) {
      throw new Error(`Cannot abort signing as no transaction metadata found`);
    }

    const abortCallback = this.#signAbortCallbacks.get(transactionId);

    if (!abortCallback) {
      throw new Error(
        `Cannot abort signing as transaction is not waiting for signing`,
      );
    }

    abortCallback();

    this.#signAbortCallbacks.delete(transactionId);
  }

  /**
   * Update the transaction data of a single nested transaction within an atomic batch transaction.
   *
   * @param options - The options bag.
   * @param options.transactionId - ID of the atomic batch transaction.
   * @param options.transactionIndex - Index of the nested transaction within the atomic batch transaction.
   * @param options.transactionData - New data to set for the nested transaction.
   * @returns The updated data for the atomic batch transaction.
   */
  async updateAtomicBatchData({
    transactionId,
    transactionIndex,
    transactionData,
  }: {
    transactionId: string;
    transactionIndex: number;
    transactionData: Hex;
  }): Promise<Hex> {
    log('Updating atomic batch data', {
      transactionId,
      transactionIndex,
      transactionData,
    });

    const updatedTransactionMeta = this.#updateTransactionInternal(
      {
        transactionId,
      },
      (transactionMeta) => {
        const { nestedTransactions, txParams } = transactionMeta;
        const from = txParams.from as Hex;
        const nestedTransaction = nestedTransactions?.[transactionIndex];

        if (!nestedTransaction) {
          throw new Error(
            `Nested transaction not found with index - ${transactionIndex}`,
          );
        }

        nestedTransaction.data = transactionData;

        const batchTransaction = generateEIP7702BatchTransaction(
          from,
          nestedTransactions,
        );

        transactionMeta.txParams.data = batchTransaction.data;
      },
    );

    const draftTransaction = cloneDeep({
      ...updatedTransactionMeta,
      txParams: {
        ...updatedTransactionMeta.txParams,
        // Clear existing gas to force estimation
        gas: undefined,
      },
    });

    await this.#updateGasEstimate(draftTransaction);

    this.#updateTransactionInternal(
      {
        transactionId,
      },
      (transactionMeta) => {
        transactionMeta.txParams.gas = draftTransaction.txParams.gas;
        transactionMeta.simulationFails = draftTransaction.simulationFails;
        transactionMeta.gasLimitNoBuffer = draftTransaction.gasLimitNoBuffer;
      },
    );

    return updatedTransactionMeta.txParams.data as Hex;
  }

  /**
   * Update the batch transactions associated with a transaction.
   * These transactions will be submitted with the main transaction as a batch.
   *
   * @param request - The request object.
   * @param request.transactionId - The ID of the transaction to update.
   * @param request.batchTransactions - The new batch transactions.
   */
  updateBatchTransactions({
    transactionId,
    batchTransactions,
  }: {
    transactionId: string;
    batchTransactions: BatchTransactionParams[];
  }): void {
    log('Updating batch transactions', { transactionId, batchTransactions });

    this.#updateTransactionInternal(
      {
        transactionId,
      },
      (transactionMeta) => {
        transactionMeta.batchTransactions = batchTransactions;
      },
    );
  }

  /**
   * Update the selected gas fee token for a transaction.
   *
   * @param transactionId - The ID of the transaction to update.
   * @param contractAddress - The contract address of the selected gas fee token.
   */
  updateSelectedGasFeeToken(
    transactionId: string,
    contractAddress: Hex | undefined,
  ): void {
    this.#updateTransactionInternal({ transactionId }, (transactionMeta) => {
      const hasMatchingGasFeeToken = transactionMeta.gasFeeTokens?.some(
        (token) =>
          token.tokenAddress.toLowerCase() === contractAddress?.toLowerCase(),
      );

      if (contractAddress && !hasMatchingGasFeeToken) {
        throw new Error(
          `No matching gas fee token found with address - ${contractAddress}`,
        );
      }

      transactionMeta.selectedGasFeeToken = contractAddress;
    });
  }

  /**
   * Update the required transaction IDs for a transaction.
   *
   * @param request - The request object.
   * @param request.transactionId - The ID of the transaction to update.
   * @param request.requiredTransactionIds - The additional required transaction IDs.
   * @param request.append - Whether to append the IDs to any existing values. Defaults to true.
   */
  updateRequiredTransactionIds({
    transactionId,
    requiredTransactionIds,
    append,
  }: {
    transactionId: string;
    requiredTransactionIds: string[];
    append?: boolean;
  }): void {
    this.#updateTransactionInternal({ transactionId }, (transactionMeta) => {
      const { requiredTransactionIds: existing } = transactionMeta;

      transactionMeta.requiredTransactionIds = [
        ...(existing && append !== false ? existing : []),
        ...requiredTransactionIds,
      ];
    });
  }

  /**
   * Emulate a new transaction.
   *
   * @param transactionId - The transaction ID.
   */
  emulateNewTransaction(transactionId: string): void {
    const transactionMeta = this.state.transactions.find(
      (tx) => tx.id === transactionId,
    );

    if (!transactionMeta) {
      return;
    }

    if (transactionMeta.type === TransactionType.swap) {
      this.messenger.publish('TransactionController:transactionNewSwap', {
        transactionMeta,
      });
    } else if (transactionMeta.type === TransactionType.swapApproval) {
      this.messenger.publish(
        'TransactionController:transactionNewSwapApproval',
        { transactionMeta },
      );
    }
  }

  /**
   * Emulate a transaction update.
   *
   * @param transactionMeta - Transaction metadata.
   */
  emulateTransactionUpdate(transactionMeta: TransactionMeta): void {
    const updatedTransactionMeta = {
      ...transactionMeta,
      txParams: {
        ...transactionMeta.txParams,
        from: this.messenger.call('AccountsController:getSelectedAccount')
          .address,
      },
    };

    const transactionExists = this.state.transactions.some(
      (tx) => tx.id === updatedTransactionMeta.id,
    );

    if (!transactionExists) {
      this.update((state) => {
        state.transactions.push(updatedTransactionMeta);
      });
    }

    this.updateTransaction(
      updatedTransactionMeta,
      'Generated from user operation',
    );

    this.messenger.publish('TransactionController:transactionStatusUpdated', {
      transactionMeta: updatedTransactionMeta,
    });
  }

  #addMetadata(transactionMeta: TransactionMeta): void {
    validateTxParams(transactionMeta.txParams);
    this.update((state) => {
      state.transactions = this.#trimTransactionsForState([
        ...state.transactions,
        transactionMeta,
      ]);
    });
  }

  async #updateGasProperties(
    transactionMeta: TransactionMeta,
    { traceContext }: { traceContext?: TraceContext } = {},
  ): Promise<void> {
    const isEIP1559Compatible =
      transactionMeta.txParams.type !== TransactionEnvelopeType.legacy &&
      (await this.#getEIP1559Compatibility(transactionMeta.networkClientId));

    await this.#trace(
      { name: 'Update Gas', parentContext: traceContext },
      async () => {
        await this.#updateGasEstimate(transactionMeta);
      },
    );

    await this.#trace(
      { name: 'Update Gas Fees', parentContext: traceContext },
      async () =>
        await updateGasFees({
          eip1559: isEIP1559Compatible,
          gasFeeFlows: this.#gasFeeFlows,
          getGasFeeEstimates: this.#getGasFeeEstimates,
          getSavedGasFees: this.#getSavedGasFees.bind(this),
          messenger: this.messenger,
          txMeta: transactionMeta,
        }),
    );

    await this.#trace(
      { name: 'Update Layer 1 Gas Fees', parentContext: traceContext },
      async () =>
        await updateTransactionLayer1GasFee({
          layer1GasFeeFlows: this.#layer1GasFeeFlows,
          messenger: this.messenger,
          transactionMeta,
        }),
    );
  }

  #onBootCleanup(): void {
    this.clearUnapprovedTransactions();
    this.#failIncompleteTransactions();
  }

  #failIncompleteTransactions(): void {
    const incompleteTransactions = this.state.transactions.filter(
      (transaction) =>
        [TransactionStatus.approved, TransactionStatus.signed].includes(
          transaction.status,
        ),
    );

    for (const transactionMeta of incompleteTransactions) {
      const requiredTransactionIds =
        transactionMeta.requiredTransactionIds ?? [];

      const allRequiredConfirmed =
        requiredTransactionIds.length > 0 &&
        requiredTransactionIds.every((id) => {
          const tx = this.#getTransaction(id);
          return tx?.status === TransactionStatus.confirmed;
        });

      const message = allRequiredConfirmed
        ? 'Transaction incomplete at startup with all required transactions confirmed'
        : 'Transaction incomplete at startup';

      this.#failTransaction(transactionMeta, new Error(message));

      for (const requiredTransactionId of requiredTransactionIds) {
        const requiredTransactionMeta = this.#getTransaction(
          requiredTransactionId,
        );

        if (
          !requiredTransactionMeta ||
          this.#isFinalState(requiredTransactionMeta.status)
        ) {
          continue;
        }

        this.#failTransaction(
          requiredTransactionMeta,
          new Error('Parent transaction incomplete at startup'),
        );
      }
    }
  }

  async #processApproval(
    transactionMeta: TransactionMeta,
    {
      actionId,
      publishHook,
      requireApproval,
      shouldShowRequest = true,
      traceContext,
    }: {
      actionId?: string;
      publishHook?: PublishHook;
      requireApproval?: boolean | undefined;
      shouldShowRequest?: boolean;
      traceContext?: TraceContext;
    },
  ): Promise<string> {
    const { id: transactionId, isStateOnly } = transactionMeta;

    if (isStateOnly) {
      this.#updateTransactionInternal(
        { transactionId, skipValidation: true },
        (tx) => {
          tx.status = TransactionStatus.submitted;
          tx.submittedTime = new Date().getTime();
        },
      );

      return '';
    }

    let resultCallbacks: AcceptResultCallbacks | undefined;
    const { meta, isCompleted } = this.#isTransactionCompleted(transactionId);

    const finishedPromise = isCompleted
      ? Promise.resolve(meta)
      : this.#waitForTransactionFinished(transactionId);

    if (meta && !isCompleted) {
      try {
        if (requireApproval !== false) {
          const acceptResult = await this.#trace(
            { name: 'Await Approval', parentContext: traceContext },
            (context) =>
              this.#requestApproval(transactionMeta, {
                shouldShowRequest,
                traceContext: context,
              }),
          );

          resultCallbacks = acceptResult.resultCallbacks;

          const approvalValue = acceptResult.value as
            | {
                txMeta?: TransactionMeta;
              }
            | undefined;

          const updatedTransaction = approvalValue?.txMeta;

          if (updatedTransaction) {
            log('Updating transaction with approval data', {
              customNonce: updatedTransaction.customNonceValue,
              params: updatedTransaction.txParams,
            });

            this.updateTransaction(
              updatedTransaction,
              'TransactionController#processApproval - Updated with approval data',
            );
          }
        }

        const { isCompleted: isTxCompleted } =
          this.#isTransactionCompleted(transactionId);

        if (!isTxCompleted) {
          const approvalResult = await this.#approveTransaction(
            transactionId,
            traceContext,
            publishHook,
          );
          if (
            approvalResult === ApprovalState.SkippedViaBeforePublishHook &&
            resultCallbacks
          ) {
            resultCallbacks.success();
          }
          const updatedTransactionMeta = this.#getTransaction(
            transactionId,
          ) as TransactionMeta;
          if (approvalResult === ApprovalState.Approved) {
            this.messenger.publish(`${controllerName}:transactionApproved`, {
              transactionMeta: updatedTransactionMeta,
              actionId,
            });
          }
        }
      } catch (rawError: unknown) {
        const error = rawError as Error & { code?: number; data?: Json };

        const { isCompleted: isTxCompleted } =
          this.#isTransactionCompleted(transactionId);

        if (!isTxCompleted) {
          if (this.#isRejectError(error)) {
            this.#rejectTransactionAndThrow(transactionId, actionId, error);
          } else {
            this.#failTransaction(meta, error, actionId);
          }
        }
      } finally {
        this.#skipSimulationTransactionIds.delete(transactionId);
      }
    }

    const finalMeta = await finishedPromise;

    switch (finalMeta?.status) {
      case TransactionStatus.failed: {
        const error = finalMeta.error as Error;
        resultCallbacks?.error(error);
        throw rpcErrors.internal(error.message);
      }

      case TransactionStatus.submitted:
        resultCallbacks?.success();
        return finalMeta.hash as string;

      default: {
        const internalError = rpcErrors.internal(
          `MetaMask Tx Signature: Unknown problem: ${JSON.stringify(
            finalMeta ?? transactionId,
          )}`,
        );

        resultCallbacks?.error(internalError);
        throw internalError;
      }
    }
  }

  /**
   * Approves a transaction and updates it's status in state. If this is not a
   * retry transaction, a nonce will be generated. The transaction is signed
   * using the sign configuration property, then published to the blockchain.
   * A `<tx.id>:finished` hub event is fired after success or failure.
   *
   * @param transactionId - The ID of the transaction to approve.
   * @param traceContext - The parent context for any new traces.
   * @param publishHookOverride - Custom logic to publish the transaction.
   * @returns The state of the approval.
   */
  async #approveTransaction(
    transactionId: string,
    traceContext?: unknown,
    publishHookOverride?: PublishHook,
  ): Promise<ApprovalState> {
    let clearApprovingTransactionId: (() => void) | undefined;
    let clearNonceLock: (() => void) | undefined;

    let transactionMeta = this.#getTransactionOrThrow(transactionId);

    log('Approving transaction', transactionMeta);

    try {
      if (!this.#sign) {
        this.#failTransaction(
          transactionMeta,
          new Error('No sign method defined.'),
        );
        return ApprovalState.NotApproved;
      } else if (!transactionMeta.chainId) {
        this.#failTransaction(
          transactionMeta,
          new Error('No chainId defined.'),
        );
        return ApprovalState.NotApproved;
      }

      if (this.#approvingTransactionIds.has(transactionId)) {
        log('Skipping approval as signing in progress', transactionId);
        return ApprovalState.NotApproved;
      }

      this.#approvingTransactionIds.add(transactionId);

      clearApprovingTransactionId = (): boolean =>
        this.#approvingTransactionIds.delete(transactionId);

      const { networkClientId } = transactionMeta;

      const [nonce, releaseNonce] = await getNextNonce(
        transactionMeta,
        (address: string) =>
          this.#multichainTrackingHelper.getNonceLock(
            address,
            transactionMeta.networkClientId,
          ),
      );

      clearNonceLock = releaseNonce;

      // eslint-disable-next-line require-atomic-updates
      transactionMeta = this.#updateTransactionInternal(
        {
          transactionId,
        },
        (draftTxMeta) => {
          const { chainId, txParams } = draftTxMeta;
          const { gas, type } = txParams;

          draftTxMeta.status = TransactionStatus.approved;
          draftTxMeta.txParams.chainId = chainId;
          draftTxMeta.txParams.gasLimit = gas;
          draftTxMeta.txParams.nonce = nonce;

          if (!type && isEIP1559Transaction(txParams)) {
            draftTxMeta.txParams.type = TransactionEnvelopeType.feeMarket;
          }
        },
      );

      this.#onTransactionStatusChange(transactionMeta);

      const rawTx = await this.#trace(
        { name: 'Sign', parentContext: traceContext },
        () => this.#signTransaction(transactionMeta),
      );

      // eslint-disable-next-line require-atomic-updates
      transactionMeta = this.#getTransactionOrThrow(transactionId);

      if (!(await this.#beforePublish(transactionMeta))) {
        log('Skipping publishing transaction based on hook');
        this.messenger.publish(
          `${controllerName}:transactionPublishingSkipped`,
          transactionMeta,
        );
        return ApprovalState.SkippedViaBeforePublishHook;
      }

      if (!rawTx && !transactionMeta.isExternalSign) {
        return ApprovalState.NotApproved;
      }

      let preTxBalance: string | undefined;
      const shouldUpdatePreTxBalance =
        transactionMeta.type === TransactionType.swap;

      if (shouldUpdatePreTxBalance) {
        log('Determining pre-transaction balance');

        preTxBalance = (await rpcRequest({
          messenger: this.messenger,
          networkClientId,
          method: 'eth_getBalance',
          params: [transactionMeta.txParams.from, 'latest'],
        })) as string;
      }

      log('Publishing transaction', transactionMeta.txParams);

      clearNonceLock?.();
      clearNonceLock = undefined;

      let publishHook = this.#defaultPublishHook.bind(this, {
        networkClientId,
        publishHookOverride,
        traceContext,
      });

      if (transactionMeta.batchTransactions?.length) {
        log('Found batch transactions', transactionMeta.batchTransactions);

        const extraTransactionsPublishHook = new ExtraTransactionsPublishHook({
          addTransactionBatch: this.addTransactionBatch.bind(this),
          getTransaction: this.#getTransactionOrThrow.bind(this),
          originalPublishHook: publishHook,
        });

        publishHook = extraTransactionsPublishHook.getHook();
      }

      const { transactionHash: hash } = await publishHook(
        transactionMeta,
        rawTx ?? '0x',
      );

      // eslint-disable-next-line require-atomic-updates
      transactionMeta = this.#updateTransactionInternal(
        {
          transactionId,
        },
        (draftTxMeta) => {
          draftTxMeta.hash = hash;
          draftTxMeta.status = TransactionStatus.submitted;
          draftTxMeta.submittedTime = new Date().getTime();
          if (shouldUpdatePreTxBalance) {
            draftTxMeta.preTxBalance = preTxBalance;
            log('Updated pre-transaction balance', preTxBalance);
          }
        },
      );

      this.messenger.publish(`${controllerName}:transactionSubmitted`, {
        transactionMeta,
      });

      this.messenger.publish(
        `${controllerName}:transactionFinished`,
        transactionMeta,
      );
      this.#internalEvents.emit(`${transactionId}:finished`, transactionMeta);

      this.#onTransactionStatusChange(transactionMeta);
      return ApprovalState.Approved;
      // TODO: Replace `any` with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (this.#isRejectError(error)) {
        // If user rejected signing on the hardware wallet, preserve rejection semantics.
        // `#processApproval` is responsible for turning this into a `rejected` tx and
        // throwing the normalized `userRejectedRequest` (4001) error.
        throw providerErrors.userRejectedRequest({
          message: 'MetaMask Tx Signature: User denied transaction signature.',
          data: error?.data,
        });
      }

      this.#failTransaction(transactionMeta, error);
      return ApprovalState.NotApproved;
    } finally {
      clearApprovingTransactionId?.();
      clearNonceLock?.();
    }
  }

  async #publishTransaction(
    transactionMeta: TransactionMeta,
    { skipSubmitHistory }: { skipSubmitHistory?: boolean } = {},
  ): Promise<string> {
    try {
      const { networkClientId, rawTx } = transactionMeta;

      if (!rawTx) {
        throw new Error('Missing raw transaction');
      }

      const transactionHash = (await rpcRequest({
        messenger: this.messenger,
        networkClientId,
        method: 'eth_sendRawTransaction',
        params: [rawTx],
      })) as string;

      if (skipSubmitHistory !== true) {
        this.#updateSubmitHistory(transactionMeta, transactionHash);
      }

      return transactionHash;
    } catch (error: unknown) {
      const errorObject = error as
        | {
            data?: { message?: string };
            message?: string;
          }
        | undefined;

      const errorMessage =
        errorObject?.data?.message ?? errorObject?.message ?? String(error);

      throw new Error(errorMessage);
    }
  }

  /**
   * Rejects a transaction based on its ID by setting its status to "rejected"
   * and emitting a `<tx.id>:finished` hub event.
   *
   * @param transactionId - The ID of the transaction to cancel.
   * @param actionId - Unique ID persisted on transaction metadata.
   * @param error - The error that caused the rejection.
   */
  #rejectTransaction(
    transactionId: string,
    actionId?: string,
    error?: Error,
  ): void {
    const transactionMeta = this.#getTransaction(transactionId);

    if (!transactionMeta) {
      return;
    }

    this.#deleteTransaction(transactionId);

    const updatedTransactionMeta: TransactionMeta = {
      ...transactionMeta,
      status: TransactionStatus.rejected as const,
      error: normalizeTxError(error ?? providerErrors.userRejectedRequest()),
    };

    this.messenger.publish(
      `${controllerName}:transactionFinished`,
      updatedTransactionMeta,
    );

    this.#internalEvents.emit(
      `${transactionMeta.id}:finished`,
      updatedTransactionMeta,
    );

    this.messenger.publish(`${controllerName}:transactionRejected`, {
      transactionMeta: updatedTransactionMeta,
      actionId,
    });

    this.#onTransactionStatusChange(updatedTransactionMeta);
  }

  /**
   * Trim the amount of transactions that are set on the state. Checks
   * if the length of the tx history is longer then desired persistence
   * limit and then if it is removes the oldest confirmed or rejected tx.
   * Pending or unapproved transactions will not be removed by this
   * operation. For safety of presenting a fully functional transaction UI
   * representation, this function will not break apart transactions with the
   * same nonce, created on the same day, per network. Not accounting for
   * transactions of the same nonce, same day and network combo can result in
   * confusing or broken experiences in the UI.
   *
   * @param transactions - The transactions to be applied to the state.
   * @returns The trimmed list of transactions.
   */
  #trimTransactionsForState(
    transactions: TransactionMeta[],
  ): TransactionMeta[] {
    const nonceNetworkSet = new Set();
    const transactionHistoryLimit = getTransactionHistoryLimit(this.messenger);

    const txsToKeep = [...transactions]
      .sort((a, b) => (a.time > b.time ? -1 : 1)) // Descending time order
      .filter((tx) => {
        const { chainId, status, txParams, time } = tx;

        if (txParams) {
          const key = `${String(txParams.nonce)}-${convertHexToDecimal(
            chainId,
          )}-${new Date(time).toDateString()}`;

          if (nonceNetworkSet.has(key)) {
            return true;
          } else if (
            nonceNetworkSet.size < transactionHistoryLimit ||
            !this.#isFinalState(status)
          ) {
            nonceNetworkSet.add(key);
            return true;
          }
        }

        return false;
      });

    txsToKeep.reverse(); // Ascending time order
    return txsToKeep;
  }

  /**
   * Determines if the transaction is in a final state.
   *
   * @param status - The transaction status.
   * @returns Whether the transaction is in a final state.
   */
  #isFinalState(status: TransactionStatus): boolean {
    return (
      status === TransactionStatus.rejected ||
      status === TransactionStatus.confirmed ||
      status === TransactionStatus.failed ||
      status === TransactionStatus.dropped
    );
  }

  /**
   * Whether the transaction has at least completed all local processing.
   *
   * @param status - The transaction status.
   * @returns Whether the transaction is in a final state.
   */
  #isLocalFinalState(status: TransactionStatus): boolean {
    return [
      TransactionStatus.confirmed,
      TransactionStatus.failed,
      TransactionStatus.rejected,
      TransactionStatus.submitted,
    ].includes(status);
  }

  async #requestApproval(
    txMeta: TransactionMeta,
    {
      shouldShowRequest,
      traceContext,
    }: { shouldShowRequest: boolean; traceContext?: TraceContext },
  ): Promise<AddResult> {
    const id = this.#getApprovalId(txMeta);
    const { origin } = txMeta;
    const type = ApprovalType.Transaction;
    const requestData = { txId: txMeta.id };

    await this.#trace({
      name: 'Notification Display',
      id,
      parentContext: traceContext,
    });

    return (await this.messenger.call(
      'ApprovalController:addRequest',
      {
        id,
        origin: origin ?? ORIGIN_METAMASK,
        type,
        requestData,
        expectsResult: true,
      },
      shouldShowRequest,
    )) as Promise<AddResult>;
  }

  #getTransaction(
    transactionId: string,
  ): Readonly<TransactionMeta> | undefined {
    const { transactions } = this.state;
    return transactions.find(({ id }) => id === transactionId);
  }

  #getTransactionOrThrow(
    transactionId: string,
    errorMessagePrefix = 'TransactionController',
  ): Readonly<TransactionMeta> {
    const txMeta = this.#getTransaction(transactionId);
    if (!txMeta) {
      throw new Error(
        `${errorMessagePrefix}: No transaction found with id ${transactionId}`,
      );
    }
    return txMeta;
  }

  #getApprovalId(txMeta: TransactionMeta): string {
    return String(txMeta.id);
  }

  #isTransactionCompleted(transactionId: string): {
    meta?: TransactionMeta;
    isCompleted: boolean;
  } {
    const transaction = this.#getTransaction(transactionId);

    if (!transaction) {
      return { meta: undefined, isCompleted: false };
    }

    const isCompleted = this.#isLocalFinalState(transaction.status);

    return { meta: transaction, isCompleted };
  }

  #onIncomingTransactions(transactions: TransactionMeta[]): void {
    if (!transactions.length) {
      return;
    }

    const finalTransactions: TransactionMeta[] = [];

    for (const tx of transactions) {
      const { chainId } = tx;

      try {
        const networkClientId = getNetworkClientId({
          messenger: this.messenger,
          chainId,
        });

        finalTransactions.push({
          ...tx,
          networkClientId,
        });
      } catch (error) {
        log('Failed to get network client ID for incoming transaction', {
          chainId,
          error,
        });
      }
    }

    this.update((state) => {
      const { transactions: currentTransactions } = state;

      state.transactions = this.#trimTransactionsForState([
        ...finalTransactions,
        ...currentTransactions,
      ]);

      log(
        'Added incoming transactions to state',
        finalTransactions.length,
        finalTransactions,
      );
    });

    this.messenger.publish(
      `${controllerName}:incomingTransactionsReceived`,
      finalTransactions,
    );
  }

  #generateDappSuggestedGasFees(
    txParams: TransactionParams,
    origin?: string,
  ): DappSuggestedGasFees | undefined {
    if (!origin || origin === ORIGIN_METAMASK) {
      return undefined;
    }

    const { gasPrice, maxFeePerGas, maxPriorityFeePerGas, gas } = txParams;

    if (
      gasPrice === undefined &&
      maxFeePerGas === undefined &&
      maxPriorityFeePerGas === undefined &&
      gas === undefined
    ) {
      return undefined;
    }

    const dappSuggestedGasFees: DappSuggestedGasFees = {};

    if (gasPrice !== undefined) {
      dappSuggestedGasFees.gasPrice = gasPrice;
    } else if (
      maxFeePerGas !== undefined ||
      maxPriorityFeePerGas !== undefined
    ) {
      dappSuggestedGasFees.maxFeePerGas = maxFeePerGas;
      dappSuggestedGasFees.maxPriorityFeePerGas = maxPriorityFeePerGas;
    }

    if (gas !== undefined) {
      dappSuggestedGasFees.gas = gas;
    }

    return dappSuggestedGasFees;
  }

  /**
   * Validates and adds external provided transaction to state.
   *
   * @param transactionMeta - Nominated external transaction to be added to state.
   * @returns The new transaction.
   */
  #addExternalTransaction(transactionMeta: TransactionMeta): TransactionMeta {
    const { chainId } = transactionMeta;
    const { transactions } = this.state;
    const fromAddress = transactionMeta?.txParams?.from;
    const sameFromAndNetworkTransactions = transactions.filter(
      (transaction) =>
        transaction.txParams.from === fromAddress &&
        transaction.chainId === chainId,
    );
    const confirmedTxs = sameFromAndNetworkTransactions.filter(
      (transaction) => transaction.status === TransactionStatus.confirmed,
    );
    const pendingTxs = sameFromAndNetworkTransactions.filter(
      (transaction) => transaction.status === TransactionStatus.submitted,
    );

    validateConfirmedExternalTransaction(
      transactionMeta,
      confirmedTxs,
      pendingTxs,
    );

    this.update((state) => {
      state.transactions = this.#trimTransactionsForState([
        ...state.transactions,
        transactionMeta,
      ]);
    });

    return transactionMeta;
  }

  /**
   * Sets other txMeta statuses to dropped if the txMeta that has been confirmed has other transactions
   * in the transactions have the same nonce.
   *
   * @param transactionId - Used to identify original transaction.
   */
  #markNonceDuplicatesDropped(transactionId: string): void {
    const transactionMeta = this.#getTransaction(transactionId);
    if (!transactionMeta) {
      return;
    }
    const nonce = transactionMeta.txParams?.nonce;
    const from = transactionMeta.txParams?.from;
    const { chainId } = transactionMeta;

    const sameNonceTransactions = this.state.transactions.filter(
      (transaction) =>
        transaction.id !== transactionId &&
        transaction.txParams.from === from &&
        nonce &&
        transaction.txParams.nonce === nonce &&
        transaction.chainId === chainId &&
        transaction.type !== TransactionType.incoming &&
        transaction.isTransfer === undefined,
    );
    const sameNonceTransactionIds = sameNonceTransactions.map(
      (transaction) => transaction.id,
    );

    if (sameNonceTransactions.length === 0) {
      return;
    }

    this.update((state) => {
      for (const transaction of state.transactions) {
        if (sameNonceTransactionIds.includes(transaction.id)) {
          transaction.replacedBy = transactionMeta?.hash;
          transaction.replacedById = transactionMeta?.id;
        }
      }
    });

    for (const transaction of this.state.transactions) {
      if (
        sameNonceTransactionIds.includes(transaction.id) &&
        transaction.status !== TransactionStatus.failed
      ) {
        this.#setTransactionStatusDropped(transaction);
      }
    }
  }

  /**
   * Method to set transaction status to dropped.
   *
   * @param transactionMeta - TransactionMeta of transaction to be marked as dropped.
   */
  #setTransactionStatusDropped(transactionMeta: TransactionMeta): void {
    const updatedTransactionMeta = {
      ...transactionMeta,
      status: TransactionStatus.dropped as const,
    };
    this.messenger.publish(`${controllerName}:transactionDropped`, {
      transactionMeta: updatedTransactionMeta,
    });
    this.updateTransaction(
      updatedTransactionMeta,
      'TransactionController#setTransactionStatusDropped - Transaction dropped',
    );
    this.#onTransactionStatusChange(updatedTransactionMeta);
  }

  async #waitForTransactionFinished(
    transactionId: string,
  ): Promise<TransactionMeta> {
    return new Promise((resolve) => {
      this.#internalEvents.once(`${transactionId}:finished`, (txMeta) => {
        resolve(txMeta);
      });
    });
  }

  /**
   * Updates the r, s, and v properties of a TransactionMeta object
   * with values from a signed transaction.
   *
   * @param transactionMeta - The TransactionMeta object to update.
   * @param signedTx - The encompassing type for all transaction types containing r, s, and v values.
   * @returns The updated TransactionMeta object.
   */
  #updateTransactionMetaRSV(
    transactionMeta: TransactionMeta,
    signedTx: TypedTransaction,
  ): TransactionMeta {
    const transactionMetaWithRsv = cloneDeep(transactionMeta);

    for (const key of ['r', 's', 'v'] as const) {
      const value = signedTx[key];

      if (value === undefined || value === null) {
        continue;
      }

      transactionMetaWithRsv[key] = add0x(value.toString(16));
    }

    return transactionMetaWithRsv;
  }

  async #getEIP1559Compatibility(
    networkClientId?: NetworkClientId,
  ): Promise<boolean> {
    const currentNetworkIsEIP1559Compatible =
      await this.#getCurrentNetworkEIP1559Compatibility(networkClientId);

    const currentAccountIsEIP1559Compatible =
      await this.#getCurrentAccountEIP1559Compatibility();

    return (
      currentNetworkIsEIP1559Compatible && currentAccountIsEIP1559Compatible
    );
  }

  async #signTransaction(
    originalTransactionMeta: TransactionMeta,
  ): Promise<string | undefined> {
    let transactionMeta = originalTransactionMeta;
    const { id: transactionId } = transactionMeta;

    log('Calling before sign hook', transactionMeta);

    const { updateTransaction } =
      (await this.#beforeSign({ transactionMeta })) ?? {};

    if (updateTransaction) {
      this.#updateTransactionInternal(
        { transactionId, skipResimulateCheck: true },
        updateTransaction,
      );

      log('Updated transaction after before sign hook');
    }

    transactionMeta = this.#getTransactionOrThrow(transactionId);

    const { networkClientId } = transactionMeta;

    await checkGasFeeTokenBeforePublish({
      messenger: this.messenger,
      networkClientId,
      fetchGasFeeTokens: async (tx) =>
        (await this.#getGasFeeTokens(tx)).gasFeeTokens,
      transaction: transactionMeta,
      updateTransaction: (txId, fn) =>
        this.#updateTransactionInternal({ transactionId: txId }, fn),
    });

    transactionMeta = this.#getTransactionOrThrow(transactionId);
    const { chainId, isExternalSign, txParams } = transactionMeta;

    if (isExternalSign) {
      log('Skipping sign as signed externally');
      return undefined;
    }

    const { authorizationList, from } = txParams;

    const signedAuthorizationList = await signAuthorizationList({
      authorizationList,
      messenger: this.messenger,
      transactionMeta,
    });

    if (signedAuthorizationList) {
      this.#updateTransactionInternal({ transactionId }, (txMeta) => {
        txMeta.txParams.authorizationList = signedAuthorizationList;
      });
    }

    transactionMeta = this.#getTransactionOrThrow(transactionId);

    const finalTransactionMeta = this.#getTransactionOrThrow(transactionId);
    const { txParams: finalTxParams } = finalTransactionMeta;
    const unsignedEthTx = prepareTransaction(chainId, finalTxParams);

    this.#approvingTransactionIds.add(transactionId);

    log('Signing transaction', finalTxParams);

    const signedTx = await new Promise<TypedTransaction>((resolve, reject) => {
      this.#sign?.(
        unsignedEthTx,
        from,
        ...this.#getAdditionalSignArguments(finalTransactionMeta),
      ).then(resolve, reject);

      this.#signAbortCallbacks.set(transactionId, () =>
        reject(new Error('Signing aborted by user')),
      );
    });

    this.#signAbortCallbacks.delete(transactionId);

    if (!signedTx) {
      log('Skipping signed status as no signed transaction');
      return undefined;
    }

    const transactionMetaFromHook = cloneDeep(finalTransactionMeta);

    if (!this.#afterSign(transactionMetaFromHook, signedTx)) {
      this.updateTransaction(
        transactionMetaFromHook,
        'TransactionController#signTransaction - Update after sign',
      );

      log('Skipping signed status based on hook');

      return undefined;
    }

    const transactionMetaWithRsv = {
      ...this.#updateTransactionMetaRSV(transactionMetaFromHook, signedTx),
      status: TransactionStatus.signed as const,
      txParams: finalTxParams,
    };

    this.updateTransaction(
      transactionMetaWithRsv,
      'TransactionController#approveTransaction - Transaction signed',
    );

    this.#onTransactionStatusChange(transactionMetaWithRsv);

    const rawTx = serializeTransaction(signedTx);

    const transactionMetaWithRawTx = merge({}, transactionMetaWithRsv, {
      rawTx,
    });

    this.updateTransaction(
      transactionMetaWithRawTx,
      'TransactionController#approveTransaction - RawTransaction added',
    );

    return rawTx;
  }

  #onTransactionStatusChange(transactionMeta: TransactionMeta): void {
    this.messenger.publish(`${controllerName}:transactionStatusUpdated`, {
      transactionMeta,
    });
  }

  #getNonceTrackerTransactions(
    statuses: TransactionStatus[],
    address: string,
    chainId: string,
  ): NonceTrackerTransaction[] {
    return getAndFormatTransactionsForNonceTracker(
      chainId,
      address,
      statuses,
      this.state.transactions,
    );
  }

  #onConfirmedTransaction(transactionMeta: TransactionMeta): void {
    log('Processing confirmed transaction', transactionMeta.id);

    this.#markNonceDuplicatesDropped(transactionMeta.id);

    this.messenger.publish(
      `${controllerName}:transactionConfirmed`,
      transactionMeta,
    );

    this.#onTransactionStatusChange(transactionMeta);

    // Intentional given potential duration of process.
    this.#updatePostBalance(transactionMeta).catch((error) => {
      log('Error while updating post balance', error);
      throw error;
    });
  }

  async #updatePostBalance(transactionMeta: TransactionMeta): Promise<void> {
    try {
      const { networkClientId, type } = transactionMeta;

      if (type !== TransactionType.swap) {
        return;
      }

      const { updatedTransactionMeta, approvalTransactionMeta } =
        await updatePostTransactionBalance(transactionMeta, {
          messenger: this.messenger,
          networkClientId,
          getTransaction: this.#getTransaction.bind(this),
          updateTransaction: this.updateTransaction.bind(this),
        });

      this.messenger.publish(
        `${controllerName}:postTransactionBalanceUpdated`,
        {
          transactionMeta: updatedTransactionMeta,
          approvalTransactionMeta,
        },
      );
    } catch (error) {
      /* istanbul ignore next */
      log('Error while updating post transaction balance', error);
    }
  }

  #createNonceTracker({
    provider,
    blockTracker,
    chainId,
  }: {
    provider: Provider;
    blockTracker: BlockTracker;
    chainId: Hex;
  }): NonceTracker {
    return new NonceTracker({
      // TODO: Fix types
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      provider: provider as any,
      // TODO: Fix types
      blockTracker,
      getPendingTransactions: this.#getNonceTrackerPendingTransactions.bind(
        this,
        chainId,
      ),
      getConfirmedTransactions: this.#getNonceTrackerTransactions.bind(
        this,
        [TransactionStatus.confirmed],
        chainId,
      ),
    });
  }

  #createPendingTransactionTracker({
    blockTracker,
    networkClientId,
  }: {
    blockTracker: BlockTracker;
    networkClientId: NetworkClientId;
  }): PendingTransactionTracker {
    const chainId = getChainId({ messenger: this.messenger, networkClientId });

    const pendingTransactionTracker = new PendingTransactionTracker({
      blockTracker,
      getGlobalLock: (): Promise<() => void> =>
        this.#multichainTrackingHelper.acquireNonceLockForChainIdKey({
          chainId,
        }),
      getTransactions: (): TransactionMeta[] => this.state.transactions,
      hooks: {
        beforeCheckPendingTransaction:
          this.#beforeCheckPendingTransaction.bind(this),
      },
      isResubmitEnabled: this.#pendingTransactionOptions.isResubmitEnabled,
      isTimeoutEnabled: this.#isTimeoutEnabled,
      messenger: this.messenger,
      networkClientId,
      publishTransaction: (transactionMeta): Promise<string> =>
        this.#publishTransaction(transactionMeta, {
          skipSubmitHistory: true,
        }),
    });

    this.#addPendingTransactionTrackerListeners(pendingTransactionTracker);

    return pendingTransactionTracker;
  }

  readonly #checkForPendingTransactionAndStartPolling = (): void => {
    this.#multichainTrackingHelper.checkForPendingTransactionAndStartPolling();
  };

  #stopAllTracking(): void {
    this.#multichainTrackingHelper.stopAllTracking();
  }

  #addIncomingTransactionHelperListeners(
    incomingTransactionHelper: IncomingTransactionHelper,
  ): void {
    incomingTransactionHelper.hub.on(
      'transactions',
      this.#onIncomingTransactions.bind(this),
    );
  }

  #removePendingTransactionTrackerListeners(
    pendingTransactionTracker: PendingTransactionTracker,
  ): void {
    pendingTransactionTracker.hub.removeAllListeners('transaction-confirmed');
    pendingTransactionTracker.hub.removeAllListeners('transaction-dropped');
    pendingTransactionTracker.hub.removeAllListeners('transaction-failed');
    pendingTransactionTracker.hub.removeAllListeners('transaction-updated');
  }

  #addPendingTransactionTrackerListeners(
    pendingTransactionTracker: PendingTransactionTracker,
  ): void {
    pendingTransactionTracker.hub.on(
      'transaction-confirmed',
      this.#onConfirmedTransaction.bind(this),
    );

    pendingTransactionTracker.hub.on(
      'transaction-dropped',
      this.#setTransactionStatusDropped.bind(this),
    );

    pendingTransactionTracker.hub.on(
      'transaction-failed',
      this.#failTransaction.bind(this),
    );

    pendingTransactionTracker.hub.on(
      'transaction-updated',
      this.updateTransaction.bind(this),
    );
  }

  #getNonceTrackerPendingTransactions(
    chainId: string,
    address: string,
  ): NonceTrackerTransaction[] {
    const standardPendingTransactions = this.#getNonceTrackerTransactions(
      [
        TransactionStatus.approved,
        TransactionStatus.signed,
        TransactionStatus.submitted,
      ],
      address,
      chainId,
    );

    const externalPendingTransactions = this.#getExternalPendingTransactions(
      address,
      chainId,
    );
    return [...standardPendingTransactions, ...externalPendingTransactions];
  }

  async #publishTransactionForRetry(
    transactionMeta: TransactionMeta,
  ): Promise<string> {
    try {
      return await this.#publishTransaction(transactionMeta);
    } catch (error: unknown) {
      if (this.#isTransactionAlreadyConfirmedError(error as Error)) {
        throw new Error('Previous transaction is already confirmed');
      }
      throw error;
    }
  }

  /**
   * Ensures that error is a nonce issue
   *
   * @param error - The error to check
   * @returns Whether or not the error is a nonce issue
   */
  // TODO: Replace `any` with type
  // Some networks are returning original error in the data field
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  #isTransactionAlreadyConfirmedError(error: any): boolean {
    return (
      Boolean(error?.message?.includes('nonce too low')) ||
      Boolean(error?.data?.message?.includes('nonce too low'))
    );
  }

  #getGasFeeFlows(): GasFeeFlow[] {
    if (this.#testGasFeeFlows) {
      return [new TestGasFeeFlow()];
    }

    return [
      new RandomisedEstimationsGasFeeFlow(),
      new LineaGasFeeFlow(),
      new DefaultGasFeeFlow(),
    ];
  }

  #getLayer1GasFeeFlows(): Layer1GasFeeFlow[] {
    return [new OptimismLayer1GasFeeFlow(), new ScrollLayer1GasFeeFlow()];
  }

  #updateTransactionInternal(
    {
      transactionId,
      skipValidation,
      skipResimulateCheck,
    }: {
      transactionId: string;
      skipValidation?: boolean;
      skipResimulateCheck?: boolean;
    },
    callback: (transactionMeta: TransactionMeta) => TransactionMeta | void,
  ): Readonly<TransactionMeta> {
    let resimulateResponse: ResimulateResponse | undefined;

    this.update((state) => {
      const index = state.transactions.findIndex(
        ({ id }) => id === transactionId,
      );

      if (index === -1) {
        throw new Error(
          `Cannot update transaction as ID not found - ${transactionId}`,
        );
      }

      let transactionMeta = state.transactions[index];

      const originalTransactionMeta = cloneDeep(transactionMeta);

      transactionMeta = callback(transactionMeta) ?? transactionMeta;

      if (skipValidation !== true) {
        transactionMeta.txParams = normalizeTransactionParams(
          transactionMeta.txParams,
        );

        validateTxParams(transactionMeta.txParams);
      }

      if (!skipResimulateCheck && this.#isSimulationEnabled()) {
        resimulateResponse = shouldResimulate(
          originalTransactionMeta,
          transactionMeta,
        );
      }

      state.transactions[index] = transactionMeta;
    });

    const transactionMeta = this.#getTransaction(
      transactionId,
    ) as TransactionMeta;

    if (resimulateResponse?.resimulate) {
      this.#updateSimulationData(transactionMeta, {
        blockTime: resimulateResponse.blockTime,
      }).catch((error) => {
        log('Error during re-simulation', error);
        throw error;
      });
    }

    return transactionMeta;
  }

  async #updateSimulationData(
    transactionMeta: TransactionMeta,
    {
      blockTime,
      traceContext,
    }: {
      blockTime?: number;
      traceContext?: TraceContext;
    } = {},
  ): Promise<void> {
    const {
      chainId,
      id: transactionId,
      nestedTransactions,
      networkClientId,
      simulationData: prevSimulationData,
      txParams,
    } = transactionMeta;

    let simulationData: SimulationData = {
      error: {
        code: SimulationErrorCode.Disabled,
        message: 'Simulation disabled',
      },
      tokenBalanceChanges: [],
    };
    let gasUsed: Hex | undefined;
    let gasFeeTokens: GasFeeToken[] = [];
    let isGasFeeSponsored = false;

    const isBalanceChangesSkipped =
      this.#skipSimulationTransactionIds.has(transactionId);

    if (this.#isSimulationEnabled() && !isBalanceChangesSkipped) {
      const balanceChangesResult = await this.#trace(
        { name: 'Simulate', parentContext: traceContext },
        () =>
          getBalanceChanges({
            blockTime,
            chainId,
            messenger: this.messenger,
            networkClientId,
            getSimulationConfig: (url, opts) => {
              return this.#getSimulationConfig(url, {
                txMeta: transactionMeta,
                ...opts,
              });
            },
            nestedTransactions,
            txParams,
          }),
      );
      simulationData = balanceChangesResult.simulationData;
      gasUsed = balanceChangesResult.gasUsed;

      if (
        blockTime &&
        prevSimulationData &&
        hasSimulationDataChanged(prevSimulationData, simulationData)
      ) {
        simulationData = {
          ...simulationData,
          isUpdatedAfterSecurityCheck: true,
        };
      }

      const gasFeeTokensResponse = await this.#getGasFeeTokens(transactionMeta);

      gasFeeTokens = gasFeeTokensResponse?.gasFeeTokens ?? [];
      isGasFeeSponsored = gasFeeTokensResponse?.isGasFeeSponsored ?? false;
    }

    const latestTransactionMeta = this.#getTransaction(transactionId);

    /* istanbul ignore if */
    if (!latestTransactionMeta) {
      log(
        'Cannot update simulation data as transaction not found',
        transactionId,
        simulationData,
      );

      return;
    }

    const updatedTransactionMeta = this.#updateTransactionInternal(
      {
        transactionId,
        skipResimulateCheck: Boolean(blockTime),
      },
      (txMeta) => {
        txMeta.gasFeeTokens = gasFeeTokens;
        txMeta.isGasFeeSponsored = isGasFeeSponsored;
        txMeta.gasUsed = gasUsed;

        if (!isBalanceChangesSkipped) {
          txMeta.simulationData = simulationData;
        }
      },
    );

    log('Updated simulation data', transactionId, updatedTransactionMeta);

    await this.#runAfterSimulateHook(updatedTransactionMeta);
  }

  #onGasFeePollerTransactionUpdate({
    transactionId,
    gasFeeEstimates,
    gasFeeEstimatesLoaded,
    layer1GasFee,
  }: {
    transactionId: string;
    gasFeeEstimates?: GasFeeEstimates;
    gasFeeEstimatesLoaded?: boolean;
    layer1GasFee?: Hex;
  }): void {
    this.#updateTransactionInternal({ transactionId }, (txMeta) => {
      updateTransactionGasProperties({
        txMeta,
        gasFeeEstimates,
        gasFeeEstimatesLoaded,
        isTxParamsGasFeeUpdatesEnabled: this.#isAutomaticGasFeeUpdateEnabled,
        layer1GasFee,
      });
    });
  }

  #onGasFeePollerTransactionBatchUpdate({
    transactionBatchId,
    gasFeeEstimates,
  }: {
    transactionBatchId: Hex;
    gasFeeEstimates?: GasFeeEstimates;
  }): void {
    this.#updateTransactionBatch(transactionBatchId, (batch) => {
      return { ...batch, gasFeeEstimates };
    });
  }

  #updateTransactionBatch(
    batchId: string,
    callback: (batch: TransactionBatchMeta) => TransactionBatchMeta | void,
  ): void {
    this.update((state) => {
      const index = state.transactionBatches.findIndex((b) => b.id === batchId);

      if (index === -1) {
        throw new Error(`Cannot update batch, ID not found - ${batchId}`);
      }

      const batch = state.transactionBatches[index];
      const updated = callback(batch);

      state.transactionBatches[index] = updated ?? batch;
    });
  }

  #getSelectedAccount(): InternalAccount {
    return this.messenger.call('AccountsController:getSelectedAccount');
  }

  #getInternalAccounts(): Hex[] {
    const state = this.messenger.call('AccountsController:getState');

    return Object.values(state.internalAccounts?.accounts ?? {})
      .filter((account) => account.type === 'eip155:eoa')
      .map((account) => account.address as Hex);
  }

  #updateSubmitHistory(transactionMeta: TransactionMeta, hash: string): void {
    const { chainId, networkClientId, origin, rawTx, txParams } =
      transactionMeta;

    const { networkConfigurationsByChainId } = this.#getNetworkState();
    const networkConfiguration = networkConfigurationsByChainId[chainId];

    const endpoint = networkConfiguration?.rpcEndpoints.find(
      (currentEndpoint) => currentEndpoint.networkClientId === networkClientId,
    );

    const networkUrl = endpoint?.url;
    const networkType = endpoint?.name ?? networkClientId;

    const submitHistoryEntry: SubmitHistoryEntry = {
      chainId,
      hash,
      networkType,
      networkUrl,
      origin,
      rawTransaction: rawTx as string,
      time: Date.now(),
      transaction: txParams,
    };

    log('Updating submit history', submitHistoryEntry);

    const submitHistoryLimit = getSubmitHistoryLimit(this.messenger);

    this.update((state) => {
      const { submitHistory } = state;

      if (submitHistory.length >= submitHistoryLimit) {
        submitHistory.pop();
      }

      submitHistory.unshift(submitHistoryEntry);
    });
  }

  async #updateGasEstimate(transactionMeta: TransactionMeta): Promise<void> {
    const { networkClientId } = transactionMeta;

    const isCustomNetwork =
      this.#multichainTrackingHelper.getNetworkClient({ networkClientId })
        .configuration.type === NetworkClientType.Custom;

    await updateGas({
      isCustomNetwork,
      isSimulationEnabled: this.#isSimulationEnabled(),
      getSimulationConfig: this.#getSimulationConfig,
      messenger: this.messenger,
      txMeta: transactionMeta,
    });
  }

  #registerActionHandlers(): void {
    this.messenger.registerMethodActionHandlers(
      this,
      MESSENGER_EXPOSED_METHODS,
    );
  }

  #deleteTransaction(transactionId: string): void {
    this.update((state) => {
      const transactions = state.transactions.filter(
        ({ id }) => id !== transactionId,
      );

      state.transactions = this.#trimTransactionsForState(transactions);
    });
  }

  #isRejectError(
    error: Error & {
      code?: number | string;
      cause?: { code?: number | string };
      originalError?: { code?: number | string };
      message?: string;
    },
  ): boolean {
    const rejectionCode =
      error.code ?? error.cause?.code ?? error.originalError?.code ?? undefined;

    return (
      rejectionCode === errorCodes.provider.userRejectedRequest ||
      rejectionCode === ErrorCode.RejectedUpgrade ||
      rejectionCode === 'USER_REJECTED' ||
      rejectionCode === 'USER_CANCELLED' ||
      this.#hasUserRejectedMessage(error)
    );
  }

  #rejectTransactionAndThrow(
    transactionId: string,
    actionId: string | undefined,
    error: Error & {
      code?: number | string;
      cause?: { code?: number | string };
      originalError?: { code?: number | string };
      message?: string;
      data?: Json;
    },
  ): void {
    const rejectionCode =
      error.code ?? error.cause?.code ?? error.originalError?.code ?? undefined;

    const isUserRejection =
      rejectionCode === errorCodes.provider.userRejectedRequest ||
      rejectionCode === 'USER_REJECTED' ||
      rejectionCode === 'USER_CANCELLED' ||
      this.#hasUserRejectedMessage(error);

    if (isUserRejection) {
      // Normalize hardware-wallet user rejection semantics to EIP-1193 `userRejectedRequest` (4001).
      const userRejectedError = providerErrors.userRejectedRequest({
        message: 'MetaMask Tx Signature: User denied transaction signature.',
        data: error?.data,
      });

      this.#rejectTransaction(transactionId, actionId, userRejectedError);
      throw userRejectedError;
    }

    this.#rejectTransaction(transactionId, actionId, error);

    throw error;
  }

  #hasUserRejectedMessage(error: {
    message?: string;
    stack?: string;
    cause?: unknown;
    originalError?: unknown;
  }): boolean {
    const userRejectedRegex =
      /user denied|user rejected|rejected by user|rejected by the user|user canceled|user cancelled|action canceled|action cancelled|denied transaction signature|failure_actioncancelled|actioncancelled|\bcancelled\b|\bcanceled\b/i;
    const queue: unknown[] = [error];
    const visited = new Set<unknown>();

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current || visited.has(current)) {
        continue;
      }

      visited.add(current);

      if (typeof current === 'string') {
        if (userRejectedRegex.test(current)) {
          return true;
        }
        continue;
      }

      if (typeof current === 'object') {
        const maybeError = current as {
          message?: unknown;
          stack?: unknown;
          cause?: unknown;
          originalError?: unknown;
        };

        if (typeof maybeError.message === 'string' && userRejectedRegex.test(maybeError.message)) {
          return true;
        }

        if (typeof maybeError.stack === 'string' && userRejectedRegex.test(maybeError.stack)) {
          return true;
        }

        if (maybeError.cause) {
          queue.push(maybeError.cause);
        }

        if (maybeError.originalError) {
          queue.push(maybeError.originalError);
        }
      }
    }

    return false;
  }

  #failTransaction(
    transactionMeta: TransactionMeta,
    error: Error,
    actionId?: string,
  ): void {
    let newTransactionMeta: TransactionMeta;

    // Keep status `failed` (not `rejected`) so `_onFinishedTransaction` still emits
    // browser notifications, but persist EIP-1193 `userRejectedRequest` (4001) when
    // the failure is a user cancellation on a hardware wallet or similar.
    const errorToPersist = this.#hasUserRejectedMessage(error)
      ? providerErrors.userRejectedRequest({
          message:
            'MetaMask Tx Signature: User denied transaction signature.',
          data: (error as { data?: unknown }).data,
        })
      : error;

    try {
      newTransactionMeta = this.#updateTransactionInternal(
        {
          transactionId: transactionMeta.id,
          skipValidation: true,
        },
        (draftTransactionMeta) => {
          draftTransactionMeta.status = TransactionStatus.failed;

          (
            draftTransactionMeta as TransactionMeta & {
              status: TransactionStatus.failed;
            }
          ).error = normalizeTxError(errorToPersist);
        },
      );
    } catch (caughtError: unknown) {
      log('Failed to mark transaction as failed', caughtError);

      newTransactionMeta = {
        ...transactionMeta,
        status: TransactionStatus.failed,
        error: normalizeTxError(errorToPersist),
      };
    }

    this.messenger.publish(`${controllerName}:transactionFailed`, {
      actionId,
      error: errorToPersist.message,
      transactionMeta: newTransactionMeta,
    });

    this.#onTransactionStatusChange(newTransactionMeta);

    this.messenger.publish(
      `${controllerName}:transactionFinished`,
      newTransactionMeta,
    );

    this.#internalEvents.emit(
      `${transactionMeta.id}:finished`,
      newTransactionMeta,
    );
  }

  async #runAfterSimulateHook(transactionMeta: TransactionMeta): Promise<void> {
    log('Calling afterSimulate hook', transactionMeta);

    const { id: transactionId } = transactionMeta;

    const result = await this.#afterSimulate({
      transactionMeta,
    });

    const { skipSimulation, updateTransaction } = result ?? {};

    if (skipSimulation) {
      this.#skipSimulationTransactionIds.add(transactionId);
    } else if (skipSimulation === false) {
      this.#skipSimulationTransactionIds.delete(transactionId);
    }

    if (!updateTransaction) {
      return;
    }

    const updatedTransactionMeta = this.#updateTransactionInternal(
      {
        transactionId,
        skipResimulateCheck: true,
      },
      (txMeta) => {
        txMeta.txParamsOriginal = cloneDeep(txMeta.txParams);
        updateTransaction(txMeta);
      },
    );

    log('Updated transaction with afterSimulate data', updatedTransactionMeta);
  }

  async #defaultPublishHook(
    {
      networkClientId,
      publishHookOverride,
      traceContext,
    }: {
      networkClientId: NetworkClientId;
      publishHookOverride?: PublishHook;
      traceContext?: TraceContext;
    },
    transactionMeta: TransactionMeta,
    signedTx: string,
  ): Promise<PublishHookResult> {
    let transactionHash: string | undefined;

    await this.#trace(
      { name: 'Publish', parentContext: traceContext },
      async () => {
        const publishHook = publishHookOverride ?? this.#publish;

        ({ transactionHash } = await publishHook(transactionMeta, signedTx));

        // eslint-disable-next-line require-atomic-updates
        transactionHash ??= await this.#publishTransaction({
          ...transactionMeta,
          networkClientId,
          rawTx: signedTx,
        });
      },
    );

    log('Publish successful', transactionHash);

    return { transactionHash };
  }

  async #getGasFeeTokens(transaction: TransactionMeta): Promise<{
    gasFeeTokens: GasFeeToken[];
    isGasFeeSponsored: boolean;
  }> {
    const { chainId } = transaction;

    return await getGasFeeTokens({
      chainId,
      getSimulationConfig: this.#getSimulationConfig,
      isEIP7702GasFeeTokensEnabled: this.#isEIP7702GasFeeTokensEnabled,
      messenger: this.messenger,
      publicKeyEIP7702: this.#publicKeyEIP7702,
      transactionMeta: transaction,
    });
  }

  /**
   * Retrieve available gas fee tokens for a transaction.
   *
   * @param request - The request object containing transaction details.
   * @returns The list of available gas fee tokens.
   */
  async getGasFeeTokens(
    request: GetGasFeeTokensRequest,
  ): Promise<GasFeeToken[]> {
    const { chainId, data, from, to, value } = request;
    const networkClientId = getNetworkClientId({
      messenger: this.messenger,
      chainId,
    });
    const delegationAddress = await getDelegationAddress(
      from,
      this.messenger,
      networkClientId,
    );

    const transaction = {
      chainId,
      delegationAddress,
      isExternalSign: true,
      txParams: {
        data,
        from,
        to,
        value,
      },
    } as TransactionMeta;

    const result = await this.#getGasFeeTokens(transaction);

    return result.gasFeeTokens;
  }
}
