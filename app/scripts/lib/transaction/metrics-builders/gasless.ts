/* eslint-disable @typescript-eslint/naming-convention */
import { NATIVE_TOKEN_ADDRESS } from '../../../../../shared/constants/transaction';
import { getMaximumGasTotalInHexWei } from '../../../../../shared/lib/gas.utils';
import { Numeric } from '../../../../../shared/lib/Numeric';
import { sumHexes } from '../../../../../shared/lib/conversion.utils';
import type { MetricsProperties, TransactionMetricsBuilder } from './types';

const ZERO_HEX = '0x0';

export const getGaslessMetricsProperties: TransactionMetricsBuilder = ({
  transactionMeta,
  transactionMetricsRequest,
}) => {
  const properties: MetricsProperties = {};
  const { gasFeeTokens, selectedGasFeeToken } = transactionMeta;

  properties.gas_payment_tokens_available = gasFeeTokens?.map(
    (token) => token.symbol,
  );

  properties.gas_paid_with = gasFeeTokens?.find(
    (token) =>
      token.tokenAddress.toLowerCase() === selectedGasFeeToken?.toLowerCase(),
  )?.symbol;

  if (selectedGasFeeToken?.toLowerCase() === NATIVE_TOKEN_ADDRESS) {
    properties.gas_paid_with = 'pre-funded_ETH';
  }

  const nativeBalance = transactionMetricsRequest.getAccountBalance(
    transactionMeta.txParams.from as `0x${string}`,
    transactionMeta.chainId,
  );

  const gasCost = getMaximumGasTotalInHexWei({
    gasLimit: transactionMeta.txParams.gas,
    gasPrice: transactionMeta.txParams.gasPrice,
    maxFeePerGas: transactionMeta.txParams.maxFeePerGas,
  });

  const nestedTransactionValues =
    transactionMeta.nestedTransactions?.map(
      ({ value }) => (value as string | undefined) ?? ZERO_HEX,
    ) ?? [];

  const totalTransactionValue = sumHexes(
    transactionMeta.txParams.value ?? ZERO_HEX,
    ...nestedTransactionValues,
  );

  const totalGasCost = sumHexes(
    gasCost,
    transactionMeta.layer1GasFee ?? ZERO_HEX,
  );

  const totalCost = sumHexes(totalGasCost, totalTransactionValue);
  properties.gas_insufficient_native_asset = new Numeric(
    totalCost,
    16,
  ).greaterThan(new Numeric(nativeBalance, 16));

  return {
    properties,
    sensitiveProperties: {},
  };
};
