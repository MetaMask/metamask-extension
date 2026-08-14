import { MiddlewareContext } from '@metamask/json-rpc-engine/v2';
import { EthAccountType } from '@metamask/keyring-api';
import { InternalAccount } from '@metamask/keyring-internal-api';
import {
  TransactionController,
  TransactionControllerAddTransactionAction,
  TransactionControllerAddTransactionBatchAction,
  TransactionMeta,
  TransactionParams,
  TransactionType,
} from '@metamask/transaction-controller';
import {
  AddUserOperationOptions,
  UserOperationControllerAddUserOperationFromTransactionAction,
  UserOperationControllerStartPollingByNetworkClientIdAction,
} from '@metamask/user-operation-controller';
import { KeyringControllerGetKeyringForAccountAction } from '@metamask/keyring-controller';
import { MessengerActions, MessengerEvents } from '@metamask/messenger';
import {
  PRODUCT_TYPES,
  SubscriptionControllerGetSubscriptionByProductAction,
} from '@metamask/subscription-controller';
import { AuthenticationControllerGetBearerTokenAction } from '@metamask/profile-sync-controller/auth';
import type { Hex, JsonRpcRequest } from '@metamask/utils';
import { addHexPrefix } from 'ethereumjs-util';
import log from 'loglevel';
import {
  generateSecurityAlertId,
  handlePPOMError,
  updateSecurityAlertResponse,
  validateRequestWithPPOM,
  type PPOMMessenger,
} from '../ppom/ppom-util';
import { SecurityAlertResponse } from '../ppom/types';
import {
  LOADING_SECURITY_ALERT_RESPONSE,
  SECURITY_PROVIDER_EXCLUDED_TRANSACTION_TYPES,
} from '../../../../shared/constants/security-provider';
import { endTrace, TraceName } from '../../../../shared/lib/trace';
import { ORIGIN_METAMASK } from '../../../../shared/constants/app';
import { getShieldGatewayConfig } from '../../../../shared/lib/shield/shield';
import { scanAddressAndAddToCache } from '../trust-signals/security-alerts-api';
import {
  mapChainIdToSupportedEVMChain,
  ScanAddressResponse,
} from '../../../../shared/lib/trust-signals';
import { getTransactionDataRecipient } from '../../../../shared/lib/transaction.utils';
import {
  AppStateControllerAddAddressSecurityAlertResponseAction,
  AppStateControllerGetAddressSecurityAlertResponseAction,
} from '../../controllers/app-state-controller-method-action-types';
import { RootMessenger } from '../messenger';
import { accountSupports7702 } from '../account-supports-7702';
import {
  getTempoEvmTransactionArgs,
  getTempoTransactionBatchArgs,
  isTempoChain,
  isTempoTransactionType,
} from './tempo-tx-utils';

export type AddTransactionOptions = NonNullable<
  Parameters<TransactionController['addTransaction']>[1]
>;

/**
 * The messenger used by the shared transaction-add pipeline. It extends the
 * {@link PPOMMessenger} (security validation) with the actions needed to add a
 * transaction or user operation, resolve an account's keyring, and read the
 * security-alerts gateway configuration.
 */
export type AddTransactionMessenger = RootMessenger<
  | MessengerActions<PPOMMessenger>
  | TransactionControllerAddTransactionAction
  | TransactionControllerAddTransactionBatchAction
  | UserOperationControllerAddUserOperationFromTransactionAction
  | UserOperationControllerStartPollingByNetworkClientIdAction
  | KeyringControllerGetKeyringForAccountAction
  | AppStateControllerGetAddressSecurityAlertResponseAction
  | AppStateControllerAddAddressSecurityAlertResponseAction
  | SubscriptionControllerGetSubscriptionByProductAction
  | AuthenticationControllerGetBearerTokenAction,
  MessengerEvents<PPOMMessenger>
>;

type BaseAddTransactionRequest = {
  chainId: Hex;
  networkClientId: string;
  messenger: AddTransactionMessenger;
  securityAlertsEnabled: boolean;
  selectedAccount: InternalAccount;
  transactionParams: TransactionParams;
  internalAccounts: InternalAccount[];
};

export type FinalAddTransactionRequest = BaseAddTransactionRequest & {
  transactionOptions: Partial<AddTransactionOptions>;
};

export type AddTransactionRequest = FinalAddTransactionRequest & {
  waitForSubmit: boolean;
};

export type AddDappTransactionRequest = BaseAddTransactionRequest & {
  dappRequest: JsonRpcRequest;
  requestContext: MiddlewareContext;
};

const TRANSFER_TYPES = [
  TransactionType.tokenMethodTransfer,
  TransactionType.tokenMethodTransferFrom,
  TransactionType.tokenMethodSafeTransferFrom,
];

type AddTransactionResult = Promise<{
  transactionMeta: TransactionMeta | undefined;
  waitForHash: () => Promise<string | undefined>;
}>;

export async function addDappTransaction(
  request: AddDappTransactionRequest,
): Promise<string> {
  const { dappRequest, requestContext } = request;
  const { id, method } = dappRequest;
  const actionId = String(id);

  // TODO: Find a home for and define the appropriate MiddlewareContext type
  const origin = requestContext.assertGet('origin') as string;
  const securityAlertResponse = requestContext.get('securityAlertResponse') as
    | SecurityAlertResponse
    | undefined;
  const traceContext = requestContext.get('traceContext');

  const transactionOptions: Partial<AddTransactionOptions> = {
    actionId,
    requestId: String(id),
    method,
    origin,
    // This is the default behaviour but specified here for clarity
    requireApproval: true,
    securityAlertResponse,
  };

  endTrace({ name: TraceName.Middleware, id: actionId });

  const addTransactionRequest: FinalAddTransactionRequest = {
    ...request,
    transactionOptions: {
      ...transactionOptions,
      traceContext,
    },
  };

  const { waitForHash } = await addTransactionOrUserOperation(
    addTransactionRequest,
  );

  const hash = (await waitForHash()) as string;

  endTrace({ name: TraceName.Transaction, id: actionId });

  return hash;
}

async function addTransactionOnTempo(
  request: FinalAddTransactionRequest,
): AddTransactionResult {
  const { chainId, messenger } = request;
  const isEip7702SupportedByAccount = await accountSupports7702(
    request.transactionParams.from,
    messenger,
  );

  // Non-Tempo transaction (not type 0x76)
  if (!isTempoTransactionType(request.transactionParams)) {
    if (!request.transactionParams.to) {
      log.debug(
        'addTransactionOnTempo: Smart-Contract deployment tx detected. Fallback to classic tx.',
      );
      // Classic transaction
      return addTransactionWithController(request);
    }
    if (!isEip7702SupportedByAccount) {
      log.debug(
        'addTransactionOnTempo: Tempo chain but wallet does not support 7702. Falling back to legacy transactions',
      );
      // Classic transaction
      return addTransactionWithController(request);
    }

    // We make it a EIP-7702 tx, seting pathUSD as default gasToken
    // and add excludeNativeTokenForFee to signal to ignore native.
    return addTransactionWithController(
      getTempoEvmTransactionArgs({ request, chainId }),
    );
    // Tempo transaction 0x76 + hardware wallet wont work for now.
  } else if (!isEip7702SupportedByAccount) {
    throw new Error('Wallet not supported for Tempo Transactions.');
  }
  // Checks and infer Tempo Transaction format for supported fields.
  const result = await messenger.call(
    'TransactionController:addTransactionBatch',
    getTempoTransactionBatchArgs({ request, chainId }),
  );
  const { batchId } = result;
  // We've got a batchId but we want to return a tx hash to the dApp
  const transactionMeta = getTransactionByBatchId(batchId, messenger);

  if (!transactionMeta) {
    log.debug(`Batch ${batchId}: No matching transaction found.`);
    throw new Error(
      `Tempo Transaction: Unable to determine if transaction was successful.`,
    );
  } else if (!transactionMeta.hash) {
    log.debug(`Batch ${batchId}: Hash missing from transaction object.`);
    throw new Error(
      `Tempo Transaction: Unable to determine if transaction was successful.`,
    );
  }

  return {
    transactionMeta,
    waitForHash: async () => transactionMeta.hash,
  };
}

export async function addTransaction(
  request: AddTransactionRequest,
): Promise<TransactionMeta> {
  await validateSecurity(request);

  const { transactionMeta, waitForHash } =
    await addTransactionOrUserOperation(request);

  if (!request.waitForSubmit) {
    waitForHash().catch(() => {
      // Not concerned with result.
    });

    return transactionMeta as TransactionMeta;
  }

  const transactionHash = await waitForHash();

  const finalTransactionMeta = getTransactionByHash(
    transactionHash as string,
    request.messenger,
  );

  return finalTransactionMeta as TransactionMeta;
}

async function addTransactionOrUserOperation(
  request: FinalAddTransactionRequest,
) {
  const { selectedAccount } = request;
  const isTempoChainId = isTempoChain(request.chainId);
  if (isTempoChainId) {
    return addTransactionOnTempo(request);
  }

  const isSmartContractAccount =
    selectedAccount.type === EthAccountType.Erc4337;

  if (isSmartContractAccount) {
    return addUserOperationWithController(request);
  }

  return addTransactionWithController(request);
}

async function addTransactionWithController(
  request: FinalAddTransactionRequest,
) {
  const { messenger, transactionOptions, transactionParams, networkClientId } =
    request;

  const { result, transactionMeta } = await messenger.call(
    'TransactionController:addTransaction',
    transactionParams,
    {
      ...transactionOptions,
      networkClientId,
    },
  );

  return {
    transactionMeta,
    waitForHash: () => result,
  };
}

async function addUserOperationWithController(
  request: FinalAddTransactionRequest,
) {
  const { messenger, networkClientId, transactionOptions, transactionParams } =
    request;

  const { maxFeePerGas, maxPriorityFeePerGas } = transactionParams;

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { origin, requireApproval, type } = transactionOptions as any;

  const normalisedTransaction: TransactionParams = {
    ...transactionParams,
    maxFeePerGas: addHexPrefix(maxFeePerGas as string),
    maxPriorityFeePerGas: addHexPrefix(maxPriorityFeePerGas as string),
  };

  const swaps = transactionOptions?.swaps?.meta;

  if (swaps?.type) {
    delete swaps.type;
  }

  const options: AddUserOperationOptions = {
    networkClientId,
    origin,
    requireApproval,
    swaps,
    type,
  };

  const result = await messenger.call(
    'UserOperationController:addUserOperationFromTransaction',
    normalisedTransaction,
    options,
  );

  messenger.call(
    'UserOperationController:startPollingByNetworkClientId',
    networkClientId,
  );

  const transactionMeta = findTransaction(
    messenger,
    (tx) => tx.id === result.id,
  );

  return {
    transactionMeta,
    waitForHash: result.transactionHash,
  };
}

/**
 * Finds a transaction in the TransactionController state that matches the given
 * predicate, reading state via the messenger.
 *
 * @param messenger - The messenger used to read the TransactionController state.
 * @param predicate - The predicate used to find the transaction.
 * @returns The matching transaction, or `undefined` if none is found.
 */
function findTransaction(
  messenger: AddTransactionMessenger,
  predicate: (tx: TransactionMeta) => boolean,
): TransactionMeta | undefined {
  return messenger
    .call('TransactionController:getState')
    .transactions.find(predicate);
}

export function getTransactionById(
  transactionId: string,
  transactionController: TransactionController,
) {
  return transactionController.state.transactions.find(
    (tx) => tx.id === transactionId,
  );
}

function getTransactionByHash(
  transactionHash: string,
  messenger: AddTransactionMessenger,
) {
  return findTransaction(messenger, (tx) => tx.hash === transactionHash);
}

function getTransactionByBatchId(
  batchId: string,
  messenger: AddTransactionMessenger,
) {
  return findTransaction(messenger, (tx) => tx.batchId === batchId);
}

/**
 * Builds the security-alerts API configuration (gateway URL and authorization
 * header) from the messenger, reading the shield subscription and bearer token.
 *
 * @param messenger - The messenger used to read the subscription and token.
 * @param url - The URL of the Security Alerts API.
 * @returns The security-alerts gateway configuration.
 */
async function getSecurityAlertsConfig(
  messenger: AddTransactionMessenger,
  url: string,
): Promise<{ newUrl?: string; authorization?: string }> {
  const getShieldSubscription = () =>
    messenger.call(
      'SubscriptionController:getSubscriptionByProduct',
      PRODUCT_TYPES.SHIELD,
    );
  const getToken = () =>
    messenger.call('AuthenticationController:getBearerToken');
  return getShieldGatewayConfig(getToken, getShieldSubscription, url);
}

function scanAddressForTrustSignals(request: AddTransactionRequest) {
  const {
    messenger,
    securityAlertsEnabled,
    transactionOptions,
    transactionParams,
    chainId,
  } = request;
  const { origin } = transactionOptions;
  if (origin !== ORIGIN_METAMASK || !securityAlertsEnabled) {
    return;
  }
  const { to } = transactionParams;
  if (typeof to !== 'string') {
    return;
  }

  const supportedEVMChain = mapChainIdToSupportedEVMChain(chainId);
  if (!supportedEVMChain) {
    return;
  }

  const getAddressSecurityAlertResponseWithChain = (cacheKey: string) => {
    return messenger.call(
      'AppStateController:getAddressSecurityAlertResponse',
      cacheKey,
    );
  };

  const addAddressSecurityAlertResponseWithChain = (
    cacheKey: string,
    response: ScanAddressResponse,
  ) => {
    return messenger.call(
      'AppStateController:addAddressSecurityAlertResponse',
      cacheKey,
      response,
    );
  };

  scanAddressAndAddToCache(
    to,
    getAddressSecurityAlertResponseWithChain,
    addAddressSecurityAlertResponseWithChain,
    supportedEVMChain,
  ).catch((error) => {
    console.error(
      '[scanAddressForTrustSignals] error scanning address for trust signals:',
      error,
    );
  });
}

async function validateSecurity(request: AddTransactionRequest) {
  const {
    chainId,
    messenger,
    securityAlertsEnabled,
    transactionOptions,
    transactionParams,
    internalAccounts,
  } = request;

  scanAddressForTrustSignals(request);
  const { type } = transactionOptions;
  const { data, value, to } = transactionParams;

  const typeIsExcludedFromPPOM =
    SECURITY_PROVIDER_EXCLUDED_TRANSACTION_TYPES.includes(
      type as TransactionType,
    );

  if (!securityAlertsEnabled || typeIsExcludedFromPPOM) {
    return;
  }

  const isTransfer =
    value === '0x0' && TRANSFER_TYPES.includes(type as TransactionType);

  const recipient =
    isTransfer && data ? getTransactionDataRecipient(data) : undefined;

  if (
    isInternalAccount(internalAccounts, to) ||
    isInternalAccount(internalAccounts, recipient)
  ) {
    return;
  }

  try {
    const { from } = transactionParams;
    const { actionId, origin } = transactionOptions;

    const ppomRequest = {
      method: 'eth_sendTransaction',
      id: actionId ?? '',
      origin: origin ?? '',
      params: [
        {
          from,
          to: to ?? '',
          value: value ?? '',
          data: data ?? '',
        },
      ],
      jsonrpc: '2.0' as const,
    };

    const securityAlertId = generateSecurityAlertId();

    // Intentionally not awaited to avoid blocking the confirmation process while the validation occurs.
    validateRequestWithPPOM({
      messenger,
      request: ppomRequest,
      securityAlertId,
      chainId,
      updateSecurityAlertResponse: (method, id, securityAlertResponse) =>
        updateSecurityAlertResponse({
          messenger,
          method,
          securityAlertId: id,
          securityAlertResponse,
        }),
      getSecurityAlertsConfig: (url) => getSecurityAlertsConfig(messenger, url),
    });

    const securityAlertResponseLoading: SecurityAlertResponse = {
      ...LOADING_SECURITY_ALERT_RESPONSE,
      securityAlertId,
    };

    request.transactionOptions.securityAlertResponse =
      securityAlertResponseLoading;
  } catch (error) {
    handlePPOMError(error, 'Error validating JSON RPC using PPOM: ');
  }
}

function normalizeAddress(address?: string): string | undefined {
  return address?.toLowerCase();
}

function isInternalAccount(
  internalAccounts: { address: string }[],
  address?: string,
): boolean {
  const normalized = normalizeAddress(address);
  if (!normalized) {
    return false;
  }

  const internalSet = new Set(
    internalAccounts.map((acc) => normalizeAddress(acc.address)),
  );

  return internalSet.has(normalized);
}
