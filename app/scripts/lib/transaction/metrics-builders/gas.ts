/* eslint-disable @typescript-eslint/naming-convention */
import type { TransactionMetricsBuilder } from './types';

export const getGasMetricsProperties: TransactionMetricsBuilder = ({
  transactionMeta,
}) => {
  const gasFeeSelected =
    transactionMeta.userFeeLevel === 'dappSuggested'
      ? 'dapp_proposed'
      : transactionMeta.userFeeLevel;

  return {
    properties: {
      gas_fee_selected: gasFeeSelected,
    },
    sensitiveProperties: {},
  };
};
