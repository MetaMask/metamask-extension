import { EthAccountType } from '@metamask/keyring-api';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { PPOMController } from '@metamask/ppom-validator';
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
import type { Hex } from '@metamask/utils';
import { addHexPrefix } from 'ethereumjs-util';

import BigNumber from 'bignumber.js';
import {
  SECURITY_ALERT_RESPONSE_CHECKING_CHAIN,
  SECURITY_PROVIDER_EXCLUDED_TRANSACTION_TYPES,
} from '../../../../shared/constants/security-provider';
import { endTrace, TraceName } from '../../../../shared/lib/trace';
import { calcTokenAmount } from '../../../../shared/lib/transactions-controller-utils';
import { parseStandardTokenTransactionData } from '../../../../shared/modules/transaction.utils';
import {
  generateSecurityAlertId,
  handlePPOMError,
  validateRequestWithPPOM,
} from '../ppom/ppom-util';
import {
  SecurityAlertResponse,
  UpdateSecurityAlertResponse,
} from '../ppom/types';
import { TransactionMetricsRequest } from './metrics';
import { fetchTokenExchangeRates } from '../../../../ui/helpers/utils/util';
import { hexToDecimal } from '../../../../shared/modules/conversion.utils';
import { TEST_CHAINS } from '../../../../shared/constants/network';

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
};

type FinalAddTransactionRequest = BaseAddTransactionRequest & {
  transactionOptions: Partial<AddTransactionOptions>;
};

export type AddTransactionRequest = FinalAddTransactionRequest & {
  waitForSubmit: boolean;
};

export type AddDappTransactionRequest = BaseAddTransactionRequest & {
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dappRequest: Record<string, any>;
};

export async function addDappTransaction(
  request: AddDappTransactionRequest,
): Promise<string> {
  const { dappRequest } = request;
  const { id: actionId, method, origin } = dappRequest;
  const { securityAlertResponse, traceContext } = dappRequest;

  const transactionOptions: Partial<AddTransactionOptions> = {
    actionId,
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

  const { transactionMeta, waitForHash } = await addTransactionOrUserOperation(
    request,
  );

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
  // TODO: Replace `any` with type
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

function getTransactionById(
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

async function validateSecurity(request: AddTransactionRequest) {
  const {
    chainId,
    ppomController,
    securityAlertsEnabled,
    transactionOptions,
    transactionParams,
    updateSecurityAlertResponse,
    internalAccounts,
  } = request;

  const { type } = transactionOptions;

  const typeIsExcludedFromPPOM =
    SECURITY_PROVIDER_EXCLUDED_TRANSACTION_TYPES.includes(
      type as TransactionType,
    );

  if (!securityAlertsEnabled || typeIsExcludedFromPPOM) {
    return;
  }

  if (
    internalAccounts.some(
      ({ address }) =>
        address.toLowerCase() === transactionParams.to?.toLowerCase(),
    )
  ) {
    return;
  }

  try {
    const { from, to, value, data } = transactionParams;
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
    });

    const securityAlertResponseCheckingChain: SecurityAlertResponse = {
      ...SECURITY_ALERT_RESPONSE_CHECKING_CHAIN,
      securityAlertId,
    };

    request.transactionOptions.securityAlertResponse =
      securityAlertResponseCheckingChain;
  } catch (error) {
    handlePPOMError(error, 'Error validating JSON RPC using PPOM: ');
  }
}

/**
 * Gets the value of a transaction in USD, calculated for simple native asset or
 * ERC20 token transfer transactions. If the value cannot be ascertained, we
 * return -1, so that the PMs can filter them out on Segment.
 *
 * @param transactionMeta - The transaction meta object
 * @param transactionMetricsRequest - The transaction metrics request object
 * @returns The value of the transaction in USD
 */
export async function getTransactionValue(
  transactionMeta: TransactionMeta,
  transactionMetricsRequest: TransactionMetricsRequest,
): Promise<number> {
  const DECIMAL_PLACES = 2;
  const TX_VALUE_UNAVAILABLE = -1;

  type TestnetChainId = (typeof TEST_CHAINS)[number];
  const isTestnet = TEST_CHAINS.includes(
    transactionMeta.chainId as TestnetChainId,
  );
  if (isTestnet) {
    return TX_VALUE_UNAVAILABLE;
  }

  const userOptedOutOfPriceFetching =
    transactionMetricsRequest.useCurrencyRateCheck() === false;
  if (userOptedOutOfPriceFetching) {
    return TX_VALUE_UNAVAILABLE;
  }

  if (transactionMeta.type === TransactionType.simpleSend) {
    const nativeAssetExchangeRate =
      transactionMetricsRequest.getConversionRate();
    if (!nativeAssetExchangeRate || nativeAssetExchangeRate === '0') {
      return TX_VALUE_UNAVAILABLE;
    }

    const transactionValue =
      Number(hexToDecimal(transactionMeta.txParams.value ?? '0x0')) *
      Number(nativeAssetExchangeRate);

    return roundToXDecimalPlaces(transactionValue, DECIMAL_PLACES);
  } else if (transactionMeta.type === TransactionType.tokenMethodTransfer) {
    const details = await transactionMetricsRequest.getTokenStandardAndDetails(
      transactionMeta.txParams.to,
    );
    const tokenDecimals = details?.decimals;
    if (!tokenDecimals) {
      return TX_VALUE_UNAVAILABLE;
    }

    const parsedTransactionData =
      transactionMeta.txParams.data &&
      parseStandardTokenTransactionData(transactionMeta.txParams.data);
    const tokenValue =
      parsedTransactionData &&
      (parsedTransactionData?.args?._value as BigNumber | undefined);
    if (!tokenValue) {
      return TX_VALUE_UNAVAILABLE;
    }

    const nativeCurrency = transactionMetricsRequest.getNativeCurrency();

    if (!transactionMeta.txParams.to) {
      return TX_VALUE_UNAVAILABLE;
    }

    const tokenExchangeRates = await fetchTokenExchangeRates(
      nativeCurrency,
      [transactionMeta.txParams.to],
      transactionMeta.chainId,
    );
    if (!tokenExchangeRates) {
      return TX_VALUE_UNAVAILABLE;
    }

    const tokenExchangeRate = tokenExchangeRates[transactionMeta.txParams.to];
    if (!tokenExchangeRate) {
      return TX_VALUE_UNAVAILABLE;
    }

    const transactionValue =
      Number(calcTokenAmount(tokenValue, Number(tokenDecimals)).toFixed()) *
      Number(tokenExchangeRate);

    return roundToXDecimalPlaces(transactionValue, DECIMAL_PLACES);
  }

  // It's not a native asset nor ERC20 token transfer, so we don't know the
  // value
  return TX_VALUE_UNAVAILABLE;
}

function roundToXDecimalPlaces(number: number, decimalPlaces: number) {
  return Math.round(number * 10 ** decimalPlaces) / 10 ** decimalPlaces;
}
