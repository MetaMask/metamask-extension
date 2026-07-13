import React, { useMemo } from 'react';
import { V1TransactionByHashResponse } from '@metamask/core-backend';
import { useSelector } from 'react-redux';
import { mapApiTransaction } from '@metamask/client-utils';
import {
  selectEvmAddress,
  selectLocalActivityItemsByIdentifier,
  selectNonEvmActivityItemsById,
} from '../../selectors/activity';
import ErrorBoundary from '../../components/app/error-boundary/error-boundary';
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
      isEvm && selectedAddress && txIdentifier && !cachedApiTransaction,
    ),
  });

  const transaction = useMemo(() => {
    const evmTransaction = (cachedApiTransaction ??
      apiTransaction) as V1TransactionByHashResponse;

    const apiActivityItem =
      evmTransaction && selectedAddress
        ? mapApiTransaction({
            subjectAddress: selectedAddress,
            transaction: evmTransaction,
          })
        : undefined;

    if (localActivityItem) {
      // More categorized items take precedence, unless it's a generic interaction
      const hasMatchingActivityType =
        apiActivityItem?.type === localActivityItem.type;
      const isLocalUncategorized =
        localActivityItem.type === 'contractInteraction';

      if (
        apiActivityItem &&
        (hasMatchingActivityType || isLocalUncategorized)
      ) {
        return apiActivityItem;
      }

      return localActivityItem;
    }

    if (nonEvmActivityItem) {
      return nonEvmActivityItem;
    }

    if (apiActivityItem) {
      return apiActivityItem;
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
        <ErrorBoundary>
          <TemplateLoader item={transaction} />
        </ErrorBoundary>
      </div>
    </div>
  );
}
