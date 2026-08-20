import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  type ChainRankingEntry,
  getChainValueOrder,
} from '../../../../shared/lib/bridge/chain-value-order';
import { getBridgeBalancesByChainId } from '../../../ducks/bridge/asset-selectors';
import {
  type BridgeAppState,
  getChainValueOrderOverride,
} from '../../../ducks/bridge/selectors';
import { getSelectedAccountGroup } from '../../../selectors/multichain-accounts/account-tree';

/**
 * Returns allowed chains ordered by selected-account-group fiat holdings and
 * remote position overrides.
 *
 * This hook must only be mounted for the treatment variant.
 *
 * @param chainRanking - Allowed chains in LaunchDarkly ranking order.
 * @returns Chains ordered for the treatment experience.
 */
export function useChainValueOrder(
  chainRanking: readonly ChainRankingEntry[],
): ChainRankingEntry[] {
  const selectedAccountGroup = useSelector(getSelectedAccountGroup);
  const holdingsByChain = useSelector((state: BridgeAppState) =>
    getBridgeBalancesByChainId(state, selectedAccountGroup),
  );
  const promotedChains = useSelector(getChainValueOrderOverride);

  return useMemo(
    () => getChainValueOrder(chainRanking, holdingsByChain, promotedChains),
    [chainRanking, holdingsByChain, promotedChains],
  );
}
