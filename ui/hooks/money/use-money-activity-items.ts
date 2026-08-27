import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectMoneyActivityMockDataEnabled } from '../../selectors/money/money-account-feature-flags';
import MOCK_MONEY_TRANSACTIONS from '../../pages/money/constants/mock-activity-data';
import {
  onchainItem,
  type MoneyActivityItem,
} from '../../pages/money/types/money-activity';
import {
  buildMoneyActivityBuckets,
  EMPTY_MONEY_ACTIVITY_BUCKETS,
  MoneyActivityFilter,
  type MoneyActivityBuckets,
} from '../../pages/money/utils/money-activity-filters';

export type UseMoneyActivityItemsResult = {
  /** All-bucket items, newest-first. Used by the Money Home preview. */
  items: MoneyActivityItem[];
  buckets: MoneyActivityBuckets;
};

/**
 * Money activity items. Mock fixtures when
 * `moneyActivityMockDataEnabled` / `MM_MONEY_ACTIVITY_MOCK_DATA_ENABLED` is
 * on; otherwise empty until live TransactionController filtering lands.
 *
 * @returns All items plus All / Deposits / Sends filter buckets.
 */
export function useMoneyActivityItems(): UseMoneyActivityItemsResult {
  const mockDataEnabled = useSelector(selectMoneyActivityMockDataEnabled);

  return useMemo(() => {
    if (!mockDataEnabled) {
      return {
        items: [],
        buckets: EMPTY_MONEY_ACTIVITY_BUCKETS,
      };
    }

    const sourceItems = [...MOCK_MONEY_TRANSACTIONS]
      .map(onchainItem)
      .sort((left, right) => right.time - left.time);
    const buckets = buildMoneyActivityBuckets(sourceItems);

    return {
      items: buckets[MoneyActivityFilter.All],
      buckets,
    };
  }, [mockDataEnabled]);
}
