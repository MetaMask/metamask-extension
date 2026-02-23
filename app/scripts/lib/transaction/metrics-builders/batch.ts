/* eslint-disable @typescript-eslint/naming-convention */
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import {
  MESSAGE_TYPE,
  ORIGIN_METAMASK,
} from '../../../../../shared/constants/app';
import { EIP5792ErrorCode } from '../../../../../shared/constants/transaction';
import { CONTRACT_INTERACTION_TYPES } from '../metrics-context';
import type { MetricsProperties, TransactionMetricsBuilder } from './types';

export const getBatchMetricsProperties: TransactionMetricsBuilder = async ({
  transactionMeta,
  transactionMetricsRequest,
}) => {
  const properties: MetricsProperties = {};
  const sensitiveProperties: MetricsProperties = {};

  const isExternal =
    transactionMeta.origin && transactionMeta.origin !== ORIGIN_METAMASK;
  const { delegationAddress, nestedTransactions, txParams } = transactionMeta;
  const { authorizationList } = txParams;
  const isBatch = Boolean(nestedTransactions?.length);
  const isUpgrade = Boolean(authorizationList?.length);

  if (isExternal) {
    properties.api_method = isBatch
      ? MESSAGE_TYPE.WALLET_SEND_CALLS
      : MESSAGE_TYPE.ETH_SEND_TRANSACTION;
  }

  if (isBatch) {
    properties.batch_transaction_count = nestedTransactions?.length;
    properties.batch_transaction_method = 'eip7702';

    const allData = (nestedTransactions ?? [])
      .filter(
        (tx) =>
          CONTRACT_INTERACTION_TYPES.includes(tx.type as TransactionType) &&
          tx.data,
      )
      .map((tx) => tx.data as string);

    const results = await Promise.all(
      allData.map((data) => transactionMetricsRequest.getMethodData(data)),
    );

    properties.transaction_contract_method = results
      .map((result) => result?.name)
      .filter((name) => name?.length);

    sensitiveProperties.transaction_contract_address = nestedTransactions
      ?.filter(
        (tx) =>
          CONTRACT_INTERACTION_TYPES.includes(tx.type as TransactionType) &&
          tx.to?.length,
      )
      .map((tx) => tx.to as string);
  }

  if (transactionMeta.status === TransactionStatus.rejected) {
    const { error } = transactionMeta;

    properties.eip7702_upgrade_rejection =
      // @ts-expect-error controller type mismatch
      isUpgrade && error.code === EIP5792ErrorCode.RejectedUpgrade;
  }

  properties.eip7702_upgrade_transaction = isUpgrade;
  sensitiveProperties.account_eip7702_upgraded = delegationAddress;

  return {
    properties,
    sensitiveProperties,
  };
};
