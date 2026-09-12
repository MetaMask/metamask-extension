import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  trace,
  endTrace,
  TraceName,
  TraceOperation,
  getPerformanceTimestamp,
} from '../../../shared/lib/trace';
import {
  getSelectedEvmInternalAccount,
  selectEvmAddress,
  getUseExternalServices,
} from '../../selectors';
import {
  getIsPerpsExperienceAvailable,
  getIsPerpsTerminalBackendEnabled,
} from '../../selectors/perps/feature-flags';
import { getPerpsStreamManager } from '../../providers/perps/PerpsStreamManager';
import { submitRequestToBackground } from '../../store/background-connection';
import {
  getPerpsLifecycleContext,
  observePerpsLifecycle,
  PERPS_LIFECYCLE_TAG,
} from '../../helpers/perps/entry-trace';

const START_BOUNDARY_TAG = 'start_boundary';
const COMPLETION_BOUNDARY_TAG = 'completion_boundary';
const CONNECTION_TIMEOUT_MS = 30_000;
type PreloadState = {
  metamask: { activeProvider?: string; isTestnet?: boolean };
};

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
  const provider = useSelector(
    (state: PreloadState) => state.metamask.activeProvider,
  );
  const isTestnet = useSelector(
    (state: PreloadState) => state.metamask.isTestnet,
  );
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
    const name = accountChanged
      ? TraceName.PerpsAccountSwitchReconnection
      : TraceName.PerpsConnectionEstablishment;
    manager.setUseTerminalApi(useTerminalApi);
    const id = crypto.randomUUID();
    let cancelled = false;
    let ended = false;
    const release = () => {
      submitRequestToBackground('perpsStopPreload', [id]).catch(
        (error: unknown) => {
          console.debug('[usePerpsPreload] Release failed', error);
        },
      );
    };
    const startTime = getPerformanceTimestamp();
    const traceReady = getPerpsLifecycleContext()
      .then((context) =>
        trace({
          startTime,
          name,
          id,
          op: TraceOperation.PerpsOperation,
          tags: {
            feature: 'perps',
            [PERPS_LIFECYCLE_TAG]: context,
            source: 'wallet_root',
            [START_BOUNDARY_TAG]: 'wallet_root_effect',
            [COMPLETION_BOUNDARY_TAG]: 'preload_ready',
            ...(accountChanged ? { trigger: 'requested_account_change' } : {}),
          },
        }),
      )
      .catch((error: unknown) => {
        console.debug('[usePerpsPreload] Trace start failed', error);
      });
    const finish = (success: boolean, reason: string) => {
      if (ended) {
        return;
      }
      ended = true;
      const timestamp = getPerformanceTimestamp();
      traceReady
        .then(() =>
          endTrace({
            timestamp,
            name,
            id,
            data: { success, reason },
          }),
        )
        .catch((error: unknown) => {
          console.debug('[usePerpsPreload] Trace end failed', error);
        });
    };
    const timeout = setTimeout(() => {
      cancelled = true;
      finish(false, 'timeout');
      release();
      manager.cleanupPrewarm();
    }, CONNECTION_TIMEOUT_MS);
    submitRequestToBackground('perpsRegisterPreload', [id])
      .then(async () => {
        if (!cancelled) {
          await manager.initForAddress(address);
        }
      })
      .then(async () => {
        if (cancelled) {
          return;
        }
        manager.prewarm();
        await submitRequestToBackground('perpsStartPreload', [id]);
        if (!cancelled) {
          finish(true, 'subscriptions_ready');
        }
      })
      .catch((error: unknown) => {
        finish(false, 'connection_failed');
        if (!cancelled) {
          release();
          manager.cleanupPrewarm();
          console.debug('[usePerpsPreload] Preload failed', error);
        }
      })
      .finally(() => clearTimeout(timeout));

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      finish(false, 'released');
      // Release this UI's owner, never globally disconnect another open surface.
      release();
      manager.cleanupPrewarm();
    };
  }, [enabled, address, provider, isTestnet, useTerminalApi]);
}
