/* eslint-disable @typescript-eslint/naming-convention */
import type { TransactionMetricsBuilder } from './types';

export const getGasMetricsProperties: TransactionMetricsBuilder = ({
  transactionMeta,
}) => {
  const gasFeeSelected = normalizeGasFeeLevel(transactionMeta.userFeeLevel);
  const gasFeePresented = normalizeGasFeeLevel(
    transactionMeta.defaultGasEstimates?.estimateType,
  );

  return {
    properties: {
      gas_fee_presented: gasFeePresented,
      gas_fee_selected: gasFeeSelected,
    },
    sensitiveProperties: {},
  };
};

function normalizeGasFeeLevel(userFeeLevel: string | undefined) {
  return userFeeLevel === 'dappSuggested' ? 'dapp_proposed' : userFeeLevel;
}
