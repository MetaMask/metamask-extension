import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { mapApiTransaction } from '@metamask/client-utils';
import { mergeActivityItemSponsoredFees } from '../../../shared/lib/activity/fees';
import {
  selectEvmAddress,
  selectLocalActivityItemsByIdentifier,
  selectNonEvmActivityItemsById,
} from '../../selectors/activity';
import ErrorBoundary from '../../components/app/error-boundary/error-boundary';
import { useApiTransaction } from '../../hooks/activity/useApiTransaction';
import { useRampsOrders } from '../../hooks/ramps/useRampsOrders';
import { mapRampsOrderSafely } from '../../hooks/ramps/utils/mapRampsOrderSafely';
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

  const { orders: rampsOrders, getOrderById } = useRampsOrders();
  // A ramps order id (e.g. "c-28ac6e...") isn't a transaction hash — only
  // treat txIdentifier as one when it isn't itself a known order code, or the
  // generic activity API gets queried with an order code instead of a hash.
  const rampsOrderById = txIdentifier ? getOrderById(txIdentifier) : undefined;
  const rampsOrder =
    rampsOrderById ??
    (txIdentifier
      ? rampsOrders.find(
          (order) => order.txHash?.toLowerCase() === txIdentifier.toLowerCase(),
        )
      : undefined);

  const apiTransaction = useApiTransaction({
    chainId,
    txHash:
      isEvm && selectedAddress && !rampsOrderById ? txIdentifier : undefined,
  });

  const transaction = useMemo(() => {
    // The ramps order is the authoritative source for its own activity —
    // takes precedence even if its settlement hash also resolves generically
    // below (mirrors the dedupe precedence in the activity list). Pass the URL
    // chainId as a fallback: a just-resolved redirect order may not have its
    // `network.chainId` populated yet, which would otherwise map to undefined
    // and render a blank page. Still falls through to the generic sources if
    // the order can't be mapped at all.
    const mappedRampsOrder = rampsOrder
      ? mapRampsOrderSafely(rampsOrder, chainId)
      : undefined;
    if (mappedRampsOrder) {
      return mappedRampsOrder;
    }

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
        return mergeActivityItemSponsoredFees(
          localActivityItem,
          apiActivityItem,
        );
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
    chainId,
    localActivityItem,
    nonEvmActivityItem,
    rampsOrder,
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
