import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { mapApiTransaction } from '@metamask/client-utils';
import {
  selectEvmAddress,
  selectLocalActivityItemsByIdentifier,
  selectNonEvmActivityItemsById,
} from '../../selectors/activity';
import ErrorBoundary from '../../components/app/error-boundary/error-boundary';
import { useApiTransaction } from '../../hooks/activity/useApiTransaction';
import { Header } from './components/header';
import { TemplateLoader } from './templates/template-loader';

type Props = {
  chainId: string | undefined;
  txIdentifier: string | undefined;
  onBack: () => void;
};

export function TransactionDetails({ chainId, txIdentifier, onBack }: Props) {
  const selectedAddress = useSelector(selectEvmAddress);
  const isEvm = chainId?.startsWith('eip155:');

  const localActivityItems = useSelector(selectLocalActivityItemsByIdentifier);
  const localActivityItem = txIdentifier
    ? localActivityItems.get(txIdentifier.toLowerCase())
    : undefined;

  const nonEvmActivityItems = useSelector(selectNonEvmActivityItemsById);
  const nonEvmActivityItem =
    !isEvm && txIdentifier
      ? nonEvmActivityItems.get(txIdentifier.toLowerCase())
      : undefined;

  const apiTransaction = useApiTransaction({
    chainId,
    txHash: isEvm && selectedAddress ? txIdentifier : undefined,
  });

  const transaction = useMemo(() => {
    const apiActivityItem =
      apiTransaction && selectedAddress
        ? mapApiTransaction({
            subjectAddress: selectedAddress,
            transaction: apiTransaction,
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
  }, [apiTransaction, localActivityItem, nonEvmActivityItem, selectedAddress]);

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
