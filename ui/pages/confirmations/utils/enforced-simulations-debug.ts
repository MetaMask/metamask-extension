import { QuoteResponse, TxData } from '@metamask/bridge-controller';
import { TransactionMeta } from '@metamask/transaction-controller';

const DEBUG_LOG_PREFIX = '[enforced-simulations-debug]';

type TransactionParams = TransactionMeta['txParams'];

function summarizeData(data: string | undefined) {
  return {
    selector: data?.slice(0, 10),
    length: data?.length,
    byteLength: data ? (data.length - 2) / 2 : undefined,
  };
}

function summarizeTransactionParams(txParams?: TransactionParams) {
  return {
    from: txParams?.from,
    to: txParams?.to,
    value: txParams?.value,
    data: summarizeData(txParams?.data),
    gas: txParams?.gas,
    gasLimit: txParams?.gasLimit,
    gasPrice: txParams?.gasPrice,
    maxFeePerGas: txParams?.maxFeePerGas,
    maxPriorityFeePerGas: txParams?.maxPriorityFeePerGas,
    nonce: txParams?.nonce,
    type: txParams?.type,
    authorizationList: txParams?.authorizationList?.map(
      ({ address, chainId, nonce }) => ({ address, chainId, nonce }),
    ),
  };
}

function summarizeQuoteTransaction(tx?: TxData) {
  return {
    to: tx?.to,
    value: tx?.value,
    data: summarizeData(tx?.data),
    gasLimit: tx?.gasLimit,
    effectiveGas: tx?.effectiveGas,
  };
}

function summarizeSimulationData(transactionMeta: TransactionMeta) {
  const { nativeBalanceChange, tokenBalanceChanges } =
    transactionMeta.simulationData ?? {};

  return {
    nativeBalanceChange: nativeBalanceChange
      ? {
          difference: nativeBalanceChange.difference,
          isDecrease: nativeBalanceChange.isDecrease,
          previousBalance: nativeBalanceChange.previousBalance,
          newBalance: nativeBalanceChange.newBalance,
        }
      : undefined,
    tokenBalanceChanges: tokenBalanceChanges?.map(
      ({
        address,
        difference,
        id,
        isDecrease,
        newBalance,
        previousBalance,
        standard,
      }) => ({
        address,
        difference,
        id,
        isDecrease,
        newBalance,
        previousBalance,
        standard,
      }),
    ),
  };
}

export function getDappSwapQuoteDebugInfo(
  selectedQuote?: QuoteResponse,
): Record<string, unknown> | undefined {
  if (!selectedQuote) {
    return undefined;
  }

  return {
    approval: summarizeQuoteTransaction(selectedQuote.approval as TxData),
    trade: summarizeQuoteTransaction(selectedQuote.trade as TxData),
  };
}

export function getConfirmationTransactionDebugInfo(
  transactionMeta?: TransactionMeta,
) {
  if (!transactionMeta) {
    return undefined;
  }

  return {
    id: transactionMeta.id,
    requestId: transactionMeta.requestId,
    chainId: transactionMeta.chainId,
    networkClientId: transactionMeta.networkClientId,
    origin: transactionMeta.origin,
    status: transactionMeta.status,
    type: transactionMeta.type,
    containerTypes: transactionMeta.containerTypes,
    delegationAddress: transactionMeta.delegationAddress,
    disableGasBuffer: transactionMeta.disableGasBuffer,
    isExternalSign: transactionMeta.isExternalSign,
    isGasFeeIncluded: transactionMeta.isGasFeeIncluded,
    isGasFeeSponsored: transactionMeta.isGasFeeSponsored,
    isStateOnly: transactionMeta.isStateOnly,
    userFeeLevel: transactionMeta.userFeeLevel,
    simulationFails: transactionMeta.simulationFails,
    simulationData: summarizeSimulationData(transactionMeta),
    gasUsed: transactionMeta.gasUsed,
    gasLimitNoBuffer: transactionMeta.gasLimitNoBuffer,
    originalGasEstimate: transactionMeta.originalGasEstimate,
    layer1GasFee: transactionMeta.layer1GasFee,
    txParams: summarizeTransactionParams(transactionMeta.txParams),
    txParamsOriginal: summarizeTransactionParams(
      transactionMeta.txParamsOriginal,
    ),
    batchTransactions: transactionMeta.batchTransactions?.map(
      ({
        data,
        gas,
        maxFeePerGas,
        maxPriorityFeePerGas,
        to,
        type,
        value,
        isAfter,
      }) => ({
        to,
        value,
        data: summarizeData(data),
        gas,
        maxFeePerGas,
        maxPriorityFeePerGas,
        type,
        isAfter,
      }),
    ),
    batchTransactionsOptions: transactionMeta.batchTransactionsOptions,
    nestedTransactions: transactionMeta.nestedTransactions?.map(
      ({ data, gas, to, type, value }) => ({
        to,
        value,
        data: summarizeData(data),
        gas,
        type,
      }),
    ),
  };
}

export function logConfirmationTransactionDebug(
  event: string,
  transactionMeta?: TransactionMeta,
  details?: Record<string, unknown>,
) {
  if (process.env.IN_TEST) {
    return;
  }

  console.warn(
    DEBUG_LOG_PREFIX,
    event,
    JSON.stringify(
      {
        transaction: getConfirmationTransactionDebugInfo(transactionMeta),
        ...details,
      },
      null,
      2,
    ),
  );
}
