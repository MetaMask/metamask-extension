import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { isCaipChainId, Hex, CaipChainId } from '@metamask/utils';
import { getAllowedSmartTransactionsChainIds } from '../../../../shared/constants/smartTransactions';
import { getSmartTransactionsPreferenceEnabled } from '../../../../shared/modules/selectors';
import { fetchSmartTransactionsLiveness } from '../../../store/actions';
import { isNonEvmChain } from '../../../ducks/bridge/utils';
import { convertCaipToHexChainId } from '../../../../shared/modules/network.utils';

/**
 * Hook that fetches smart transactions liveness for a given chain.
 * Ensures fresh liveness data is fetched when entering the page
 * and when the chain changes.
 *
 * @param chainId - The chain ID to check for STX support (string or null/undefined).
 */
export function useRefreshSmartTransactionsLiveness(
  chainId: Hex | CaipChainId | null | undefined,
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

    const chainIdHex = isCaipChainId(chainId)
      ? convertCaipToHexChainId(chainId)
      : chainId;

    // TODO: will be replaced with feature flags once we have them.
    const allowedChainId = getAllowedSmartTransactionsChainIds().find(
      (id) => id === chainIdHex,
    );

    if (allowedChainId) {
      fetchSmartTransactionsLiveness({ chainId: allowedChainId })();
    }
  }, [chainId, smartTransactionsOptInStatus]);
}
