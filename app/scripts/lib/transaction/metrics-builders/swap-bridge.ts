// eslint-disable-next-line import/no-restricted-paths
import { getSwapAndSendMetricsProps } from '../../../../../ui/helpers/utils/metrics';
import type { MetricsProperties, TransactionMetricsBuilder } from './types';

export const getSwapBridgeMetricsProperties: TransactionMetricsBuilder = ({
  transactionMeta,
  context,
}) => {
  const properties: MetricsProperties = {
    ...getSwapAndSendMetricsProps(transactionMeta),
  };

  if (
    context.contractMethodName === 'Approve' ||
    context.transactionTypeForMetrics === 'mm_swap' ||
    context.transactionTypeForMetrics === 'mm_bridge'
  ) {
    properties.simulation_receiving_assets_total_value =
      properties.simulation_receiving_assets_total_value ??
      transactionMeta?.assetsFiatValues?.receiving;
    properties.simulation_sending_assets_total_value =
      properties.simulation_sending_assets_total_value ??
      transactionMeta?.assetsFiatValues?.sending;

    if (context.transactionApprovalAmountType) {
      properties.transaction_approval_amount_type =
        context.transactionApprovalAmountType;
    }
  }

  return {
    properties,
    sensitiveProperties: {},
  };
};
