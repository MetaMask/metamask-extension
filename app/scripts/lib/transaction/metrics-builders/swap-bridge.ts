import {
  TokenStandard,
  TransactionApprovalAmountType,
} from '../../../../../shared/constants/transaction';
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
    context.isApproveMethod ||
    context.transactionTypeForMetrics === 'mm_swap' ||
    context.transactionTypeForMetrics === 'mm_bridge'
  ) {
    properties.simulation_receiving_assets_total_value =
      properties.simulation_receiving_assets_total_value ??
      transactionMeta?.assetsFiatValues?.receiving;
    properties.simulation_sending_assets_total_value =
      properties.simulation_sending_assets_total_value ??
      transactionMeta?.assetsFiatValues?.sending;

    if (
      context.isApproveMethod &&
      context.tokenStandard === TokenStandard.ERC20
    ) {
      if (
        transactionMeta.dappProposedTokenAmount === '0' ||
        transactionMeta.customTokenAmount === '0'
      ) {
        properties.transaction_approval_amount_type =
          TransactionApprovalAmountType.revoke;
      } else if (
        transactionMeta.customTokenAmount &&
        transactionMeta.customTokenAmount !==
          transactionMeta.dappProposedTokenAmount
      ) {
        properties.transaction_approval_amount_type =
          TransactionApprovalAmountType.custom;
      } else if (transactionMeta.dappProposedTokenAmount) {
        properties.transaction_approval_amount_type =
          TransactionApprovalAmountType.dappProposed;
      }
    }
  }

  return {
    properties,
    sensitiveProperties: {},
  };
};
