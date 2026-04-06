import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { MetaMetricsHardwareWalletRecoveryLocation } from '../../../shared/constants/metametrics';
import { trackHardwareWalletRecoveryConnectCtaClicked } from '../../helpers/utils/track-hardware-wallet-recovery-connect-cta-clicked';
import { useHardwareWalletRecoveryLocation } from '../../hooks/useHardwareWalletRecoveryLocation';
import { MetaMetricsContext } from '../metametrics';
import {
  useHardwareWalletConfig,
  useHardwareWalletState,
} from './HardwareWalletContext';
import { ConnectionStatus, HardwareWalletType } from './types';
import { useHardwareWalletMetrics } from './useHardwareWalletMetrics';

jest.mock(
  '../../helpers/utils/track-hardware-wallet-recovery-connect-cta-clicked',
);
jest.mock('../../hooks/useHardwareWalletRecoveryLocation');
jest.mock('./HardwareWalletContext', () => ({
  useHardwareWalletConfig: jest.fn(),
  useHardwareWalletState: jest.fn(),
}));

const mockTrackHardwareWalletRecoveryConnectCtaClicked = jest.mocked(
  trackHardwareWalletRecoveryConnectCtaClicked,
);

describe('useHardwareWalletMetrics', () => {
  const mockTrackEvent = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useHardwareWalletRecoveryLocation as jest.Mock).mockReturnValue(
      MetaMetricsHardwareWalletRecoveryLocation.Send,
    );
    (useHardwareWalletConfig as jest.Mock).mockReturnValue({
      walletType: HardwareWalletType.Ledger,
    });
    (useHardwareWalletState as jest.Mock).mockReturnValue({
      connectionState: { status: ConnectionStatus.Disconnected },
    });
  });

  it('returns a callback that forwards to trackHardwareWalletRecoveryConnectCtaClicked', () => {
    const { result } = renderHook(() => useHardwareWalletMetrics(), {
      wrapper: ({ children }) => (
        <MetaMetricsContext.Provider
          value={{
            trackEvent: mockTrackEvent,
            bufferedTrace: jest.fn(),
            bufferedEndTrace: jest.fn(),
            onboardingParentContext: { current: null },
          }}
        >
          {children}
        </MetaMetricsContext.Provider>
      ),
    });

    result.current.trackConnectCtaClicked();

    expect(
      mockTrackHardwareWalletRecoveryConnectCtaClicked,
    ).toHaveBeenCalledWith(mockTrackEvent, {
      location: MetaMetricsHardwareWalletRecoveryLocation.Send,
      walletType: HardwareWalletType.Ledger,
      connectionState: { status: ConnectionStatus.Disconnected },
    });
  });
});
