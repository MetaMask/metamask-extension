import { useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { formatChainIdToCaip } from '@metamask/bridge-controller';
import { getSelectedInternalAccount } from '../../shared/lib/selectors/accounts';
import { getEnabledChainIds } from '../selectors';
import { refreshAssetsForSelectedAccount } from '../store/actions';
import { useDispatch } from '../store/hooks';

/**
 * Refreshes AssetsController balances for the selected account when account
 * lists are displayed.
 *
 * Only the selected account is refreshed. Refreshing every account writes
 * balances for groups that have not been opened yet, and the account list
 * then renders those as if they were loaded.
 *
 * @returns Object containing updateBalances function for manual triggering if needed
 * @example
 * ```tsx
 * const AccountListComponent = () => {
 *
 *   useAssetsUpdateAllAccountBalances();
 *
 *   return <AccountList />;
 * };
 * ```
 */
export const useAssetsUpdateAllAccountBalances = (): {
  updateBalances: () => Promise<void>;
} => {
  const enabledChainIds = useSelector(getEnabledChainIds);
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const dispatch = useDispatch();

  const updateBalances = useCallback(async () => {
    try {
      if (!selectedAccount || enabledChainIds.length === 0) {
        return;
      }

      await dispatch(
        refreshAssetsForSelectedAccount([selectedAccount], {
          chainIds: enabledChainIds.map(formatChainIdToCaip),
          assetTypes: ['token', 'price', 'metadata'],
        }),
      );
    } catch (error) {
      console.warn('Error updating balances state for all accounts', error);
    }
  }, [dispatch, enabledChainIds, selectedAccount]);

  useEffect(() => {
    updateBalances();
  }, [updateBalances]);

  return { updateBalances };
};

export default useAssetsUpdateAllAccountBalances;
