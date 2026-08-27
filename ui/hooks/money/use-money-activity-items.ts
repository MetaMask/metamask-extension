import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectMoneyActivityMockDataEnabled } from '../../selectors/money/money-account-feature-flags';
import MOCK_MONEY_TRANSACTIONS from '../../pages/money/constants/mock-activity-data';
import {
  onchainItem,
  type MoneyActivityItem,
} from '../../pages/money/types/money-activity';

/**
 * Money Home activity items. Mock fixtures when
 * `moneyActivityMockDataEnabled` / `MM_MONEY_ACTIVITY_MOCK_DATA_ENABLED` is
 * on; otherwise empty until live TransactionController filtering lands.
 *
 * @returns Activity items newest-first.
 */
export function useMoneyActivityItems(): MoneyActivityItem[] {
  const mockDataEnabled = useSelector(selectMoneyActivityMockDataEnabled);

  return useMemo(() => {
    if (!mockDataEnabled) {
      return [];
    }

    return [...MOCK_MONEY_TRANSACTIONS]
      .map(onchainItem)
      .sort((left, right) => right.time - left.time);
  }, [mockDataEnabled]);
}
