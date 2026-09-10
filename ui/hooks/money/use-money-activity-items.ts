import { useMemo } from 'react';
import {
  onchainItem,
  type MoneyActivityItem,
} from '../../pages/money/types/money-activity';
import {
  buildMoneyActivityBuckets,
  MoneyActivityFilter,
  type MoneyActivityBuckets,
} from '../../pages/money/utils/money-activity-filters';
import { useMoneyAccountTransactions } from './use-money-account-transactions';

export type UseMoneyActivityItemsResult = {
  items: MoneyActivityItem[];
  buckets: MoneyActivityBuckets;
  moneyAddress: string | undefined;
  mockDataEnabled: boolean;
};

/**
 * Assembles the Money activity list from local on-chain transactions,
 * bucketed by filter tab.
 *
 * @returns Filter buckets plus the Money Account address.
 */
export function useMoneyActivityItems(): UseMoneyActivityItemsResult {
  const { allTransactions, moneyAddress, mockDataEnabled } =
    useMoneyAccountTransactions();

  const items = useMemo(
    () => allTransactions.map(onchainItem),
    [allTransactions],
  );

  const buckets = useMemo(() => buildMoneyActivityBuckets(items), [items]);

  return {
    items: buckets[MoneyActivityFilter.All],
    buckets,
    moneyAddress,
    mockDataEnabled,
  };
}
