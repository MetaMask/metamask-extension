import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { selectNonReplacedTransactions } from '../../selectors/transactionController';
import { selectMoneyActivityMockDataEnabled } from '../../selectors/money/money-account-feature-flags';
import MOCK_MONEY_TRANSACTIONS from '../../pages/money/constants/mock-activity-data';
import {
  filterMoneyAccountTransactions,
  splitMoneyAccountTransactions,
} from '../../pages/money/utils/money-account-transactions';
import { useMoneyAccountInfo } from './useMoneyAccountInfo';

export type UseMoneyAccountTransactionsResult = {
  allTransactions: TransactionMeta[];
  deposits: TransactionMeta[];
  transfers: TransactionMeta[];
  moneyAddress: string | undefined;
  mockDataEnabled: boolean;
};

/**
 * Money account activity from TransactionController. When mock data is on,
 * returns static fixtures. Otherwise filters non-replaced transactions to
 * those involving the Money Account.
 *
 * @returns Filtered transactions, bucket splits, and the Money Account address.
 */
export function useMoneyAccountTransactions(): UseMoneyAccountTransactionsResult {
  const { primaryMoneyAccount } = useMoneyAccountInfo();
  const mockDataEnabled = useSelector(selectMoneyActivityMockDataEnabled);
  const nonReplacedTransactions = useSelector(selectNonReplacedTransactions);

  const moneyAddress = useMemo(() => {
    const raw = primaryMoneyAccount?.address;
    return raw ? toChecksumHexAddress(raw) : undefined;
  }, [primaryMoneyAccount]);

  return useMemo(() => {
    if (mockDataEnabled) {
      const allTransactions = [...MOCK_MONEY_TRANSACTIONS];
      return {
        allTransactions,
        ...splitMoneyAccountTransactions(allTransactions),
        moneyAddress,
        mockDataEnabled: true,
      };
    }

    const allTransactions = filterMoneyAccountTransactions(
      nonReplacedTransactions,
      moneyAddress,
    );

    return {
      allTransactions,
      ...splitMoneyAccountTransactions(allTransactions),
      moneyAddress,
      mockDataEnabled: false,
    };
  }, [mockDataEnabled, moneyAddress, nonReplacedTransactions]);
}
