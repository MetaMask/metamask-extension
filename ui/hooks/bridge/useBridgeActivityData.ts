import { useMemo } from 'react';
import type { TransactionViewModel } from '../../../shared/lib/multichain/types';
import { useBridgeTokenDisplayData } from '../../pages/bridge/hooks/useBridgeTokenDisplayData';
import { resolveTransactionType } from '../../components/multichain/activity-v2/helpers';
import useBridgeChainInfo from './useBridgeChainInfo';
import { useBridgeTxHistoryData } from './useBridgeTxHistoryData';

/**
 * Hook to get the activity data required to display a unified swap/bridge transaction
 *
 * @param params
 * @param params.transaction - The transaction to get the activity data for
 * @returns The chains, tokens, and navigation logic for a unified swap/bridge transaction
 */
export const useBridgeActivityData = ({
  transaction,
}: {
  transaction?: TransactionViewModel;
}) => {
  // Add the resolved transaction type
  const transactionWithType = useMemo(() => {
    return transaction
      ? { ...transaction, type: resolveTransactionType(transaction) }
      : undefined;
  }, [transaction]);

  const tokenDisplayData = useBridgeTokenDisplayData({
    transaction: transactionWithType,
  });
  const chainInfo = useBridgeChainInfo({
    transaction: transactionWithType,
  });
  const bridgeHistoryData = useBridgeTxHistoryData({
    transaction: transactionWithType,
  });

  const data = useMemo(
    () => ({
      ...tokenDisplayData,
      ...chainInfo,
      ...bridgeHistoryData,
    }),
    [tokenDisplayData, chainInfo, bridgeHistoryData],
  );
  return data;
};
