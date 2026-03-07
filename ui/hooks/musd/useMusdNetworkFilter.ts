/**
 * useMusdNetworkFilter Hook
 *
 * Detects network filter state for mUSD CTA visibility.
 * Mirrors mobile's logic from useMusdConversionFlowData.
 */

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { Hex } from '@metamask/utils';
import { KnownCaipNamespace } from '@metamask/utils';
import { getEnabledNetworks } from '../../../shared/modules/selectors/multichain';

export type MusdNetworkFilterResult = {
  /** True if multiple networks are selected (popular networks view) */
  isPopularNetworksFilterActive: boolean;
  /** The selected chain ID (null if multiple networks selected) */
  selectedChainId: Hex | null;
  /** All enabled chain IDs */
  enabledChainIds: Hex[];
};

export function useMusdNetworkFilter(): MusdNetworkFilterResult {
  // Get enabled networks from state - this is keyed by namespace with chainId -> boolean
  const enabledNetworkMap = useSelector(getEnabledNetworks);

  // Get enabled chain IDs for EVM namespace
  const enabledChainIds = useMemo(() => {
    const evmNetworks = enabledNetworkMap?.[KnownCaipNamespace.Eip155] ?? {};
    return Object.entries(evmNetworks)
      .filter(([_, enabled]) => enabled)
      .map(([chainId]) => chainId as Hex);
  }, [enabledNetworkMap]);

  // isPopularNetworksFilterActive when more than 1 chain is enabled
  const isPopularNetworksFilterActive = useMemo(
    () => enabledChainIds.length > 1,
    [enabledChainIds.length],
  );

  // selectedChainId is only set when exactly 1 chain is selected
  const selectedChainId = useMemo(
    () =>
      !isPopularNetworksFilterActive && enabledChainIds.length === 1
        ? enabledChainIds[0]
        : null,
    [isPopularNetworksFilterActive, enabledChainIds],
  );

  return {
    isPopularNetworksFilterActive,
    selectedChainId,
    enabledChainIds,
  };
}

export default useMusdNetworkFilter;
