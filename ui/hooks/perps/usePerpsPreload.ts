import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  getSelectedEvmInternalAccount,
  selectEvmAddress,
  getUseExternalServices,
} from '../../selectors';
import {
  getIsPerpsExperienceAvailable,
  getIsPerpsTerminalBackendEnabled,
} from '../../selectors/perps/feature-flags';
import {
  selectPerpsActiveProvider,
  selectPerpsIsTestnet,
} from '../../selectors/perps-controller';
import { getPerpsStreamManager } from '../../providers/perps/PerpsStreamManager';
import { observePerpsLifecycle } from '../../helpers/perps/entry-trace';

/**
 * Warm data when the unlocked wallet root is eligible, matching Mobile's
 * always-on provider. Background owns the shared connection's disconnect grace.
 *
 * @param walletReady - Wallet is unlocked and onboarding is complete.
 */
export function usePerpsPreload(walletReady: boolean): void {
  const available = useSelector(getIsPerpsExperienceAvailable);
  const useExternalServices = useSelector(getUseExternalServices);
  const selectedEvmAddress = useSelector(selectEvmAddress);
  const lastEvmAccount = useSelector(getSelectedEvmInternalAccount);
  const address = selectedEvmAddress ?? lastEvmAccount?.address;
  const provider = useSelector(selectPerpsActiveProvider);
  const isTestnet = useSelector(selectPerpsIsTestnet);
  const useTerminalApi = useSelector(getIsPerpsTerminalBackendEnabled);
  const enabled = walletReady && available && useExternalServices;
  const previousRequestedAddress = useRef<string>();

  useEffect(observePerpsLifecycle, []);

  // A market backend flag change must preserve mounted detail subscriptions.
  // Account/provider/network changes and root unmount still clear every cache.
  useEffect(
    () => () => getPerpsStreamManager().clearAllCaches(),
    [enabled, address, provider, isTestnet],
  );

  useEffect(() => {
    const manager = getPerpsStreamManager();
    if (!enabled || !address) {
      previousRequestedAddress.current = undefined;
      manager.reset();
      return undefined;
    }
    // Measure this UI's requested account transition through preload readiness.
    // The background queue may share the actual reconnect with another UI.
    const accountChanged = Boolean(
      previousRequestedAddress.current &&
      previousRequestedAddress.current !== address.toLowerCase(),
    );
    previousRequestedAddress.current = address.toLowerCase();
    const session = manager.startPreload({
      address,
      useTerminalApi,
      accountChanged,
    });
    return () => session.stop();
  }, [
    enabled,
    address,
    // Provider or network changes release the old preload and register a new one.
    provider,
    isTestnet,
    useTerminalApi,
  ]);
}
