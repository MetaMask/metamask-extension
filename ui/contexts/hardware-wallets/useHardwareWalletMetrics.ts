import { useCallback, useContext } from 'react';
import { MetaMetricsContext } from '../metametrics';
import { trackHardwareWalletRecoveryConnectCtaClicked } from '../../helpers/utils/track-hardware-wallet-recovery-connect-cta-clicked';
import { useHardwareWalletRecoveryLocation } from '../../hooks/useHardwareWalletRecoveryLocation';
import {
  useHardwareWalletConfig,
  useHardwareWalletState,
} from './HardwareWalletContext';

/**
 * Hardware wallet MetaMetrics helpers for surfaces that integrate with confirmation flows.
 * Keeps Segment payload construction out of generic confirmation UI.
 */
export function useHardwareWalletMetrics() {
  const { trackEvent } = useContext(MetaMetricsContext);
  const location = useHardwareWalletRecoveryLocation();
  const { walletType } = useHardwareWalletConfig();
  const { connectionState } = useHardwareWalletState();

  const trackConnectCtaClicked = useCallback(() => {
    trackHardwareWalletRecoveryConnectCtaClicked(trackEvent, {
      location,
      walletType,
      connectionState,
    });
  }, [connectionState, location, trackEvent, walletType]);

  return { trackConnectCtaClicked };
}
