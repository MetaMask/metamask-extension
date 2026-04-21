import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { getSelectedInternalAccount } from '../../selectors/accounts';
import {
  selectPerpsActiveProvider,
  selectPerpsIsTestnet,
} from '../../selectors/perps-controller';
import { buildPerpsCacheKey } from '../../providers/perps/perps-cache';

/**
 * Derives the Perps cache key from Redux state.
 *
 * Both the MarketInfo and OrderFills hooks need an identical scope key
 * (provider + network + address).  This hook centralises that derivation
 * so the key format is defined in exactly one place.
 */
export function usePerpsCacheKey(): string {
  const activeProvider = useSelector(selectPerpsActiveProvider);
  const isTestnet = useSelector(selectPerpsIsTestnet);
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const selectedAddress = selectedAccount?.address;

  return useMemo(
    () => buildPerpsCacheKey(activeProvider, isTestnet, selectedAddress),
    [activeProvider, isTestnet, selectedAddress],
  );
}
