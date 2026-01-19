import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getAllowedSmartTransactionsChainIds } from '../../../../shared/constants/smartTransactions';
import { getSmartTransactionsPreferenceEnabled } from '../../../../shared/modules/selectors';
import { fetchSmartTransactionsLiveness } from '../../../store/actions';
import { isNonEvmChain } from '../../../ducks/bridge/utils';

/**
 * Hook that fetches smart transactions liveness for a given chain.
 * Ensures fresh liveness data is fetched when entering the page
 * and when the chain changes.
 *
 * @param chainId - The chain ID to check for STX support (string or null/undefined).
 */
export function useRefreshSmartTransactionsLiveness(
  chainId: string | null | undefined,
): void {
  const smartTransactionsOptInStatus = useSelector(
    getSmartTransactionsPreferenceEnabled,
  );

  useEffect(() => {
    if (!chainId || !smartTransactionsOptInStatus) {
      return;
    }

    if (isNonEvmChain(chainId)) {
      return;
    }

    // TODO: will be replaced with feature flags once we have them.
    const allowedChainId = getAllowedSmartTransactionsChainIds().find(
      (id) => id === chainId,
    );

    if (allowedChainId) {
      fetchSmartTransactionsLiveness({ chainId: allowedChainId })();
    }
  }, [chainId, smartTransactionsOptInStatus]);
}
