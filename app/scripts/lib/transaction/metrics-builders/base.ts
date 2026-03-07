/* eslint-disable @typescript-eslint/naming-convention */
import { ORIGIN_METAMASK } from '../../../../../shared/constants/app';
import { isEIP1559Transaction } from '../../../../../shared/modules/transaction.utils';
import type { TransactionMetricsBuilder } from './types';

export const getBaseMetricsProperties: TransactionMetricsBuilder = async ({
  transactionMeta,
  context,
}) => {
  const source = transactionMeta.origin === ORIGIN_METAMASK ? 'user' : 'dapp';

  return {
    properties: {
      chain_id: transactionMeta.chainId,
      referrer: transactionMeta.origin,
      source,
      status: transactionMeta.status,
      network: `${parseInt(transactionMeta.chainId, 16)}`,
      eip_1559_version: isEIP1559Transaction(transactionMeta) ? '2' : '0',
      asset_type: context.assetType,
      token_standard: context.tokenStandard,
      transaction_type: context.transactionTypeForMetrics,
      transaction_speed_up: transactionMeta.type === 'retry',
      transaction_internal_id: transactionMeta.id,
      transaction_contract_method:
        context.isContractInteraction && context.contractMethodName
          ? [context.contractMethodName]
          : [],
    },
    sensitiveProperties: {},
  };
};
