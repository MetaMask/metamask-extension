import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getEnabledChainIds } from '../selectors';
import { updateBalancesFoAccounts } from '../store/actions';

/**
 * Assets hook to update balance state for ALL accounts when account lists are displayed.
 *
 * This hook ensures the Redux state contains current balance information for every account
 * across all enabled EVM networks, including both native currencies and tokens. This is
 * essential for account list components where users expect to see up-to-date balances
 * for all accounts without requiring manual interaction.
 *
 * The hook triggers TokenBalancesController.updateBalances() which is configured
 * with queryMultipleAccounts to update state for all accounts, not just the selected one.
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
  const dispatch = useDispatch();

  const updateBalances = useCallback(async () => {
    try {
      if (enabledChainIds.length > 0) {
        // Update balance state for ALL accounts across all enabled EVM chains
        // TokenBalancesController is configured with queryMultipleAccounts: true
        // so this will update balances for all accounts, not just the selected one
        await dispatch(updateBalancesFoAccounts(enabledChainIds, true));
      }
    } catch (error) {
      console.warn('Error updating balances state for all accounts', error);
    }
  }, [enabledChainIds, dispatch]);

  useEffect(() => {
    if (enabledChainIds.length === 0) {
      return;
    } // wait until we have chain IDs

    updateBalances();
  }, [enabledChainIds, updateBalances]);

  return { updateBalances };
};

export default useAssetsUpdateAllAccountBalances;
