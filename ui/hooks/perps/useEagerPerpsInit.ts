import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getIsUnlocked } from '../../ducks/metamask/metamask';
import { getIsPerpsExperienceAvailable } from '../../selectors/perps/feature-flags';
import { getSelectedInternalAccount } from '../../selectors/accounts';
import { getPerpsStreamManager } from '../../providers/perps/PerpsStreamManager';

/**
 * Eagerly initialize the background PerpsController at app boot so that
 * perps RPC methods work immediately, matching mobile's startup behavior.
 * Without this, perpsInit is only called lazily when the user navigates
 * to the perps tab, causing CLIENT_NOT_INITIALIZED errors for any earlier call.
 *
 * Uses initForAddress (not raw perpsInit) so the stream manager tracks the
 * active address and properly disconnects/reconnects on account switch.
 */
export function useEagerPerpsInit(): void {
  const isUnlocked = useSelector(getIsUnlocked);
  const isPerpsAvailable = useSelector(getIsPerpsExperienceAvailable);
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const selectedAddress = selectedAccount?.address ?? null;

  useEffect(() => {
    if (isUnlocked && isPerpsAvailable && selectedAddress) {
      getPerpsStreamManager()
        .initForAddress(selectedAddress)
        .catch(() => {
          // Initialization failure is non-fatal — the lazy init path
          // and fetchWithRecovery will retry when the user reaches perps.
        });
    }
  }, [isUnlocked, isPerpsAvailable, selectedAddress]);
}
