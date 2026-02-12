import { MiddlewareContext } from '@metamask/json-rpc-engine/v2';
import { EthAccountType } from '@metamask/keyring-api';
import { InternalAccount } from '@metamask/keyring-internal-api';
import {
  TransactionController,
  TransactionMeta,
  TransactionParams,
  TransactionType,
} from '@metamask/transaction-controller';
import {
  AddUserOperationOptions,
  UserOperationController,
} from '@metamask/user-operation-controller';
import type { Hex, JsonRpcRequest } from '@metamask/utils';
import { addHexPrefix } from 'ethereumjs-util';
import { PPOMController } from '@metamask/ppom-validator';

import {
  generateSecurityAlertId,
  handlePPOMError,
  validateRequestWithPPOM,
} from '../ppom/ppom-util';
import {
  SecurityAlertResponse,
  UpdateSecurityAlertResponse,
  GetSecurityAlertsConfig,
} from '../ppom/types';
import {
  LOADING_SECURITY_ALERT_RESPONSE,
  SECURITY_PROVIDER_EXCLUDED_TRANSACTION_TYPES,
} from '../../../../shared/constants/security-provider';
import { endTrace, TraceName } from '../../../../shared/lib/trace';
import { ORIGIN_METAMASK } from '../../../../shared/constants/app';
import { scanAddressAndAddToCache } from '../trust-signals/security-alerts-api';
import {
  mapChainIdToSupportedEVMChain,
  AddAddressSecurityAlertResponse,
  GetAddressSecurityAlertResponse,
  ScanAddressResponse,
} from '../../../../shared/lib/trust-signals';
import { getTransactionDataRecipient } from '../../../../shared/modules/transaction.utils';

export type AddTransactionOptions = NonNullable<
  Parameters<TransactionController['addTransaction']>[1]
>;

type BaseAddTransactionRequest = {
  chainId: Hex;
  networkClientId: string;
  ppomController: PPOMController;
  securityAlertsEnabled: boolean;
  selectedAccount: InternalAccount;
  transactionParams: TransactionParams;
  transactionController: TransactionController;
  updateSecurityAlertResponse: UpdateSecurityAlertResponse;
  userOperationController: UserOperationController;
  internalAccounts: InternalAccount[];
  getSecurityAlertResponse: GetAddressSecurityAlertResponse;
  addSecurityAlertResponse: AddAddressSecurityAlertResponse;
};

type FinalAddTransactionRequest = BaseAddTransactionRequest & {
  transactionOptions: Partial<AddTransactionOptions>;
};

export type AddTransactionRequest = FinalAddTransactionRequest & {
  waitForSubmit: boolean;
  getSecurityAlertsConfig?: GetSecurityAlertsConfig;
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

  const { waitForHash } = await addTransactionOrUserOperation({
    ...request,
    transactionOptions: {
      ...transactionOptions,
      traceContext,
    },
  });

  const hash = (await waitForHash()) as string;

  endTrace({ name: TraceName.Transaction, id: actionId });

  return hash;
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
    request.transactionController,
  );

  return finalTransactionMeta as TransactionMeta;
}

async function addTransactionOrUserOperation(
  request: FinalAddTransactionRequest,
) {
  const { selectedAccount } = request;

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
  const {
    transactionController,
    transactionOptions,
    transactionParams,
    networkClientId,
  } = request;

  const { result, transactionMeta } =
    await transactionController.addTransaction(transactionParams, {
      ...transactionOptions,
      networkClientId,
    });

  return {
    transactionMeta,
    waitForHash: () => result,
  };
}

async function addUserOperationWithController(
  request: FinalAddTransactionRequest,
) {
  const {
    networkClientId,
    transactionController,
    transactionOptions,
    transactionParams,
    userOperationController,
  } = request;

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

  const result = await userOperationController.addUserOperationFromTransaction(
    normalisedTransaction,
    options,
  );

  userOperationController.startPollingByNetworkClientId(networkClientId);

  const transactionMeta = getTransactionById(result.id, transactionController);

  return {
    transactionMeta,
    waitForHash: result.transactionHash,
  };
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
  transactionController: TransactionController,
) {
  return transactionController.state.transactions.find(
    (tx) => tx.hash === transactionHash,
  );
}

function scanAddressForTrustSignals(request: AddTransactionRequest) {
  const {
    getSecurityAlertResponse,
    addSecurityAlertResponse,
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
    return getSecurityAlertResponse(cacheKey);
  };

  const addAddressSecurityAlertResponseWithChain = (
    cacheKey: string,
    response: ScanAddressResponse,
  ) => {
    return addSecurityAlertResponse(cacheKey, response);
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
    ppomController,
    securityAlertsEnabled,
    transactionOptions,
    transactionParams,
    updateSecurityAlertResponse,
    internalAccounts,
    getSecurityAlertsConfig,
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
      ppomController,
      request: ppomRequest,
      securityAlertId,
      chainId,
      updateSecurityAlertResponse,
      getSecurityAlertsConfig,
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

export function stripSingleLeadingZero(hex: string): string {
  if (!hex.startsWith('0x0') || hex.length <= 3) {
    return hex;
  }
  return `0x${hex.slice(3)}`;
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
