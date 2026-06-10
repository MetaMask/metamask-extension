import React, { useMemo } from 'react';
import { V1TransactionByHashResponse } from '@metamask/core-backend';
import { useSelector } from 'react-redux';
import { mapApiEvmTransactions } from '../../../shared/lib/activity/adapters/api-evm-transactions';
import { selectEvmAddress } from '../../selectors/accounts';
import {
  selectLocalActivityItemsByIdentifier,
  selectNonEvmActivityItemsById,
} from '../../selectors/activity';
import { Header } from './components/header';
import { TemplateLoader } from './templates/template-loader';
import { useCachedEvmTransaction } from './useCachedEvmTransaction';
import { useTransactionQuery } from './useTransactionQuery';

type Props = {
  chainId: string | undefined;
  txIdentifier: string | undefined;
  onBack: () => void;
};

export function TransactionDetails({ chainId, txIdentifier, onBack }: Props) {
  const selectedAddress = useSelector(selectEvmAddress);
  const isEvm = chainId?.startsWith('eip155:');

  const localActivityItemsByIdentifier = useSelector(
    selectLocalActivityItemsByIdentifier,
  );
  const localActivityItem = txIdentifier
    ? localActivityItemsByIdentifier.get(txIdentifier.toLowerCase())
    : undefined;

  const nonEvmActivityItems = useSelector(selectNonEvmActivityItemsById);
  const nonEvmActivityItem =
    !isEvm && txIdentifier
      ? nonEvmActivityItems.get(txIdentifier.toLowerCase())
      : undefined;

  const cachedApiTransaction = useCachedEvmTransaction({
    chainId,
    txHash: txIdentifier,
  });

  const { data: apiTransaction } = useTransactionQuery({
    chainId,
    txHash: txIdentifier,
    enabled: Boolean(
      isEvm && !localActivityItem && !cachedApiTransaction && selectedAddress,
    ),
  });

  const transaction = useMemo(() => {
    if (localActivityItem) {
      return localActivityItem;
    }

    if (nonEvmActivityItem) {
      return nonEvmActivityItem;
    }

    const evmTransaction = (cachedApiTransaction ??
      apiTransaction) as V1TransactionByHashResponse;

    if (evmTransaction && selectedAddress) {
      return mapApiEvmTransactions({
        subjectAddress: selectedAddress,
        transaction: evmTransaction,
      });
    }

    return undefined;
  }, [
    apiTransaction,
    cachedApiTransaction,
    localActivityItem,
    nonEvmActivityItem,
    selectedAddress,
  ]);

  return (
    <div className="flex h-full flex-col bg-background-default [container-name:list-item] [container-type:inline-size]">
      <div className="shrink-0 px-4 py-4">
        <Header item={transaction} onBack={onBack} />
      </div>

      <div className="flex flex-col flex-1 overflow-y-auto px-4 pb-4">
        <TemplateLoader item={transaction} />
      </div>
    </div>
  );
}
