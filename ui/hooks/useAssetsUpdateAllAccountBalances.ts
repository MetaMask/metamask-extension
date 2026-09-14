import { useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { formatChainIdToCaip } from '@metamask/bridge-controller';
import { getEnabledChainIds } from '../selectors';
import { getInternalAccounts } from '../selectors/accounts';
import { getIsAssetsUnifyStateEnabled } from '../selectors/assets-unify-state';
import { refreshAssetsForSelectedAccount } from '../store/actions';
import { useDispatch } from '../store/hooks';

/**
 * Assets hook to refresh balance state for the selected account when account
 * lists are displayed.
 *
 * When assets-unify is enabled, this triggers AssetsController via
 * `refreshAssetsForSelectedAccount`. TokenBalancesController (and its
 * `updateBalances` API) has been removed.
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
  const internalAccounts = useSelector(getInternalAccounts);
  const isAssetsUnifyStateEnabled = useSelector(getIsAssetsUnifyStateEnabled);
  const dispatch = useDispatch();

  const updateBalances = useCallback(async () => {
    try {
      if (!isAssetsUnifyStateEnabled || internalAccounts.length === 0) {
        return;
      }

      if (enabledChainIds.length === 0) {
        return;
      }

      await dispatch(
        refreshAssetsForSelectedAccount(internalAccounts, {
          chainIds: enabledChainIds.map(formatChainIdToCaip),
          assetTypes: ['token', 'price', 'metadata'],
        }),
      );
    } catch (error) {
      console.warn('Error updating balances state for all accounts', error);
    }
  }, [dispatch, enabledChainIds, internalAccounts, isAssetsUnifyStateEnabled]);

  useEffect(() => {
    if (!isAssetsUnifyStateEnabled) {
      return;
    }
    if (enabledChainIds.length === 0) {
      return;
    }

    updateBalances();
  }, [enabledChainIds, isAssetsUnifyStateEnabled, updateBalances]);

  return { updateBalances };
};

export default useAssetsUpdateAllAccountBalances;
