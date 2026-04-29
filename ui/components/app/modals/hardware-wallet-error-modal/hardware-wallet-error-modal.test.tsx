import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import {
  MemoryRouter,
  type MemoryRouterProps,
  Route,
  Routes,
} from 'react-router-dom';
import {
  Category,
  ErrorCode,
  HardwareWalletError,
  Severity,
  type HardwareWalletError as HardwareWalletErrorType,
} from '@metamask/hw-wallet-sdk';
import { getMockContractInteractionConfirmState } from '../../../../../test/data/confirmations/helper';
import { MetaMetricsEventName } from '../../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { createHardwareWalletError } from '../../../../contexts/hardware-wallets/errors';
import { HardwareWalletType } from '../../../../contexts/hardware-wallets/types';
import configureStore from '../../../../store/store';
import {
  getChromiumExtensionCameraSiteSettingsUrl,
  isFirefoxBrowser,
} from '../../../../../shared/lib/browser-runtime.utils';
import { HardwareWalletErrorModal } from './hardware-wallet-error-modal';

const mockTrackEvent = jest.fn();

jest.mock('../../../../../shared/lib/browser-runtime.utils', () => {
  const actual = jest.requireActual<
    typeof import('../../../../../shared/lib/browser-runtime.utils')
  >('../../../../../shared/lib/browser-runtime.utils');
  return {
    ...actual,
    isFirefoxBrowser: jest.fn(() => false),
    getChromiumExtensionCameraSiteSettingsUrl: jest.fn(
      () =>
        'chrome://settings/content/siteDetails?site=chrome-extension%3A%2F%2Fmock%2F',
    ),
    getMozExtensionOriginForDisplay: jest.fn(
      () => 'moz-extension://mock-display',
    ),
  };
});

const mockIsFirefoxBrowser = jest.mocked(isFirefoxBrowser);
const mockGetChromiumExtensionCameraSiteSettingsUrl = jest.mocked(
  getChromiumExtensionCameraSiteSettingsUrl,
);

const mockHideModal = jest.fn();
jest.mock('../../../../hooks/useModalProps', () => ({
  useModalProps: () => ({
    hideModal: mockHideModal,
    props: {},
  }),
}));

const mockEnsureDeviceReady = jest.fn();
const mockClearError = jest.fn();
const mockSetConnectionReady = jest.fn();
const mockUseHardwareWalletConfig = jest.fn();
jest.mock('../../../../contexts/hardware-wallets', () => {
  const actual = jest.requireActual('../../../../contexts/hardware-wallets');

  return {
    ...actual,
    useHardwareWalletConfig: () => mockUseHardwareWalletConfig(),
    useHardwareWalletActions: () => ({
      ensureDeviceReady: mockEnsureDeviceReady,
      clearError: mockClearError,
      setConnectionReady: mockSetConnectionReady,
    }),
  };
});

// Helper function to create test errors
const createTestError = (
  code: ErrorCode,
  message: string,
  userMessage?: string,
): HardwareWalletErrorType => {
  return createHardwareWalletError(
    code,
    'ledger' as HardwareWalletType,
    userMessage || message,
  );
};

const metricsProviderValue = {
  trackEvent: mockTrackEvent,
  bufferedTrace: jest.fn(),
  bufferedEndTrace: jest.fn(),
  onboardingParentContext: { current: null },
};

const memoryRouterFuture = {
  ['v7_startTransition' as keyof NonNullable<MemoryRouterProps['future']>]:
    true,
  ['v7_relativeSplatPath' as keyof NonNullable<MemoryRouterProps['future']>]:
    true,
} as NonNullable<MemoryRouterProps['future']>;

/**
 * `HardwareWalletErrorModal` uses {@link useHardwareWalletRecoveryLocation}, which needs
 * React Router and Redux. Default route `/` yields `Send`, matching prior mock behavior.
 * @param store
 * @param ui
 */
function wrapHardwareWalletModalTree(
  store: ReturnType<typeof configureStore>,
  ui: React.ReactElement,
) {
  return (
    <Provider store={store}>
      <MemoryRouter initialEntries={['/']} future={memoryRouterFuture}>
        <Routes>
          <Route
            path="*"
            element={
              <MetaMetricsContext.Provider value={metricsProviderValue}>
                {ui}
              </MetaMetricsContext.Provider>
            }
          />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

function renderWithMetrics(ui: React.ReactElement) {
  const store = configureStore(getMockContractInteractionConfirmState());
  return {
    store,
    ...render(wrapHardwareWalletModalTree(store, ui)),
  };
}

describe('HardwareWalletErrorModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEnsureDeviceReady.mockResolvedValue(true);
    mockUseHardwareWalletConfig.mockReturnValue({
      walletType: HardwareWalletType.Ledger,
    });
    mockIsFirefoxBrowser.mockReturnValue(false);
    mockGetChromiumExtensionCameraSiteSettingsUrl.mockReturnValue(
      'chrome://settings/content/siteDetails?site=chrome-extension%3A%2F%2Fmock%2F',
    );
  });

  describe('Error Display', () => {
    it('renders device locked title and recovery instructions', () => {
      const error = createTestError(
        ErrorCode.AuthenticationDeviceLocked,
        'Device is locked',
        'Your Ledger device is locked. Please unlock it to continue.',
      );

      const { getByText } = renderWithMetrics(
        <HardwareWalletErrorModal error={error} />,
      );

      expect(
        getByText('[hardwareWalletErrorTitleDeviceLocked]'),
      ).toBeInTheDocument();
      expect(
        getByText('[hardwareWalletErrorRecoveryUnlock1]'),
      ).toBeInTheDocument();
      expect(
        getByText('[hardwareWalletErrorRecoveryUnlock2]'),
      ).toBeInTheDocument();
    });

    it('renders nothing when error is not provided', () => {
      const onClose = jest.fn();
      const { container } = renderWithMetrics(
        <HardwareWalletErrorModal onClose={onClose} />,
      );

      expect(container.firstChild).toBeNull();
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('renders with fallback wallet type when not available', () => {
      const error = createTestError(
        ErrorCode.AuthenticationDeviceLocked,
        'Device is locked',
        'Your device is locked.',
      );

      mockUseHardwareWalletConfig.mockReturnValue({
        walletType: null,
      });

      const { getByText } = renderWithMetrics(
        <HardwareWalletErrorModal error={error} />,
      );

      expect(
        getByText('[hardwareWalletErrorTitleDeviceLocked]'),
      ).toBeInTheDocument();
    });

    it('renders modal but skips tracking when wallet type is unknown', async () => {
      const error = new HardwareWalletError('Device is locked', {
        code: ErrorCode.AuthenticationDeviceLocked,
        severity: Severity.Info,
        category: Category.Unknown,
        userMessage: 'Your device is locked.',
      });
      mockUseHardwareWalletConfig.mockReturnValue({
        walletType: HardwareWalletType.Unknown,
      });

      const { getByText } = renderWithMetrics(
        <HardwareWalletErrorModal error={error} />,
      );

      expect(
        getByText('[hardwareWalletErrorTitleDeviceLocked]'),
      ).toBeInTheDocument();

      await waitFor(() => {
        expect(mockTrackEvent).not.toHaveBeenCalled();
      });
    });

    it('tracks modal viewed if wallet type becomes known after initial unknown render', async () => {
      const error = new HardwareWalletError('Device is locked', {
        code: ErrorCode.AuthenticationDeviceLocked,
        severity: Severity.Info,
        category: Category.Unknown,
        userMessage: 'Your device is locked.',
      });
      mockUseHardwareWalletConfig.mockReturnValue({
        walletType: HardwareWalletType.Unknown,
      });

      const { rerender, store } = renderWithMetrics(
        <HardwareWalletErrorModal error={error} />,
      );

      await waitFor(() => {
        expect(mockTrackEvent).not.toHaveBeenCalled();
      });

      mockUseHardwareWalletConfig.mockReturnValue({
        walletType: HardwareWalletType.Ledger,
      });

      rerender(
        wrapHardwareWalletModalTree(
          store,
          <HardwareWalletErrorModal error={error} />,
        ),
      );

      await waitFor(() => {
        const modalViewed = mockTrackEvent.mock.calls.filter(
          (call) =>
            call[0].event ===
            MetaMetricsEventName.HardwareWalletRecoveryModalViewed,
        );
        expect(modalViewed).toHaveLength(1);
        expect(modalViewed[0][0].properties.error_type_view_count).toBe(1);
      });
    });

    it('renders nothing for user-rejected errors', () => {
      const error = createTestError(
        ErrorCode.UserCancelled,
        'User cancelled',
        'You cancelled the operation.',
      );
      const onCancel = jest.fn();
      const { container } = renderWithMetrics(
        <HardwareWalletErrorModal error={error} onCancel={onCancel} />,
      );

      expect(container.firstChild).toBeNull();
      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(mockHideModal).toHaveBeenCalledTimes(1);
      expect(mockClearError).toHaveBeenCalledTimes(1);
    });
  });

  describe('Recovery Instructions', () => {
    it('displays unlock instructions for AuthenticationDeviceLocked', () => {
      const error = createTestError(
        ErrorCode.AuthenticationDeviceLocked,
        'Device is locked',
        'Your device is locked.',
      );

      const { getByText } = renderWithMetrics(
        <HardwareWalletErrorModal error={error} />,
      );

      expect(
        getByText('[hardwareWalletErrorTitleDeviceLocked]'),
      ).toBeInTheDocument();
      expect(
        getByText('[hardwareWalletErrorRecoveryUnlock1]'),
      ).toBeInTheDocument();
      expect(
        getByText('[hardwareWalletErrorRecoveryUnlock2]'),
      ).toBeInTheDocument();
    });

    it('displays blind signing instructions for DeviceStateBlindSignNotSupported', () => {
      const error = createTestError(
        ErrorCode.DeviceStateBlindSignNotSupported,
        'Blind sign not supported',
        'Blind sign not supported.',
      );

      const { getByText } = renderWithMetrics(
        <HardwareWalletErrorModal error={error} />,
      );

      expect(
        getByText('[hardwareWalletErrorTitleBlindSignNotSupported]'),
      ).toBeInTheDocument();
      expect(
        getByText(
          '[hardwareWalletErrorTitleBlindSignNotSupportedInstruction1]',
        ),
      ).toBeInTheDocument();
      expect(
        getByText(
          '[hardwareWalletErrorTitleBlindSignNotSupportedInstruction2]',
        ),
      ).toBeInTheDocument();
    });

    it('displays app instructions for DeviceStateEthAppClosed', () => {
      const error = createTestError(
        ErrorCode.DeviceStateEthAppClosed,
        'Wrong app open',
        'Please open the Ethereum app.',
      );

      const { getByText } = renderWithMetrics(
        <HardwareWalletErrorModal error={error} />,
      );

      expect(
        getByText('[hardwareWalletTitleEthAppNotOpen]'),
      ).toBeInTheDocument();
      expect(
        getByText('[hardwareWalletEthAppNotOpenDescription]'),
      ).toBeInTheDocument();
    });

    it('displays connection instructions for DeviceDisconnected', () => {
      const error = createTestError(
        ErrorCode.DeviceDisconnected,
        'Device disconnected',
        'Device not found.',
      );

      const { getByText } = renderWithMetrics(
        <HardwareWalletErrorModal error={error} />,
      );

      expect(
        getByText('[hardwareWalletErrorTitleConnectYourDevice]'),
      ).toBeInTheDocument();
      expect(
        getByText('[hardwareWalletErrorRecoveryConnection1]'),
      ).toBeInTheDocument();
      expect(
        getByText('[hardwareWalletErrorRecoveryConnection2]'),
      ).toBeInTheDocument();
      expect(
        getByText('[hardwareWalletErrorRecoveryConnection3]'),
      ).toBeInTheDocument();
    });

    it('displays unlock instructions for ConnectionClosed', () => {
      const error = createTestError(
        ErrorCode.ConnectionClosed,
        'Connection lost',
        'Connection lost.',
      );

      const { getByText } = renderWithMetrics(
        <HardwareWalletErrorModal error={error} />,
      );

      expect(
        getByText('[hardwareWalletErrorTitleConnectYourDevice]'),
      ).toBeInTheDocument();
      expect(
        getByText('[hardwareWalletErrorRecoveryUnlock1]'),
      ).toBeInTheDocument();
      expect(
        getByText('[hardwareWalletErrorRecoveryUnlock2]'),
      ).toBeInTheDocument();
    });

    it('displays description for unknown errors', () => {
      const error = createTestError(
        ErrorCode.Unknown,
        'Unknown error',
        'Unknown error.',
      );

      const { getByText } = renderWithMetrics(
        <HardwareWalletErrorModal error={error} />,
      );

      expect(
        getByText('[hardwareWalletErrorUnknownErrorDescription]'),
      ).toBeInTheDocument();
    });
  });

  describe('QR camera permission errors', () => {
    it('renders blocked camera content when permission is denied', () => {
      const error = createTestError(
        ErrorCode.PermissionCameraDenied,
        'Camera denied',
        'Camera access denied.',
      );

      const { getByTestId, queryByText } = renderWithMetrics(
        <HardwareWalletErrorModal error={error} />,
      );

      expect(getByTestId('qr-camera-access-blocked')).toBeInTheDocument();
      expect(
        queryByText('[hardwareWalletErrorReconnectButton]'),
      ).not.toBeInTheDocument();
    });

    it('opens Chromium camera settings when Open settings is clicked', async () => {
      const openTabSpy = jest
        .spyOn(global.platform, 'openTab')
        .mockResolvedValue({ id: 1 } as Awaited<
          ReturnType<typeof global.platform.openTab>
        >);
      const error = createTestError(
        ErrorCode.PermissionCameraDenied,
        'Camera denied',
        'Camera access denied.',
      );

      const { getByTestId } = renderWithMetrics(
        <HardwareWalletErrorModal error={error} />,
      );

      await act(async () => {
        fireEvent.click(getByTestId('qr-camera-open-settings'));
      });

      expect(mockGetChromiumExtensionCameraSiteSettingsUrl).toHaveBeenCalled();
      expect(openTabSpy).toHaveBeenCalledWith({
        url: 'chrome://settings/content/siteDetails?site=chrome-extension%3A%2F%2Fmock%2F',
      });

      openTabSpy.mockRestore();
    });

    it('renders needed camera content when the permission prompt was dismissed (Chromium)', () => {
      mockIsFirefoxBrowser.mockReturnValue(false);
      const error = createTestError(
        ErrorCode.PermissionCameraPromptDismissed,
        'Prompt dismissed',
        'Prompt dismissed.',
      );

      const { getByTestId } = renderWithMetrics(
        <HardwareWalletErrorModal error={error} />,
      );

      expect(getByTestId('qr-camera-access-needed')).toBeInTheDocument();
    });

    it('renders blocked Firefox instructions when prompt was dismissed in Firefox', () => {
      mockIsFirefoxBrowser.mockReturnValue(true);
      const error = createTestError(
        ErrorCode.PermissionCameraPromptDismissed,
        'Prompt dismissed',
        'Prompt dismissed.',
      );

      const { getByTestId, queryByTestId } = renderWithMetrics(
        <HardwareWalletErrorModal error={error} />,
      );

      expect(getByTestId('qr-camera-access-blocked')).toBeInTheDocument();
      expect(getByTestId('qr-camera-firefox-instructions')).toBeInTheDocument();
      expect(queryByTestId('qr-camera-access-needed')).not.toBeInTheDocument();
    });

    it('renders Firefox instructions when blocked and browser is Firefox', () => {
      mockIsFirefoxBrowser.mockReturnValue(true);
      const error = createTestError(
        ErrorCode.PermissionCameraDenied,
        'Camera denied',
        'Camera access denied.',
      );

      const { getByTestId } = renderWithMetrics(
        <HardwareWalletErrorModal error={error} />,
      );

      expect(getByTestId('qr-camera-firefox-instructions')).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('displays Reconnect button for retryable errors', () => {
      const error = createTestError(
        ErrorCode.AuthenticationDeviceLocked,
        'Device is locked',
        'Your device is locked.',
      );
      const onRetry = jest.fn();
      const onCancel = jest.fn();

      const { getByText, queryByText } = renderWithMetrics(
        <HardwareWalletErrorModal
          error={error}
          onRetry={onRetry}
          onCancel={onCancel}
        />,
      );

      expect(
        getByText('[hardwareWalletErrorReconnectButton]'),
      ).toBeInTheDocument();
      expect(queryByText('[confirm]')).not.toBeInTheDocument();
    });

    it('displays Continue button for device disconnected', () => {
      const error = createTestError(
        ErrorCode.DeviceDisconnected,
        'Device disconnected',
        'Device not found.',
      );
      const onCancel = jest.fn();

      const { getByText, queryByText } = renderWithMetrics(
        <HardwareWalletErrorModal error={error} onCancel={onCancel} />,
      );

      expect(
        getByText('[hardwareWalletErrorContinueButton]'),
      ).toBeInTheDocument();
      expect(queryByText('[confirm]')).not.toBeInTheDocument();
    });

    it('displays only Confirm button for non-retryable non-rejection errors', () => {
      const error = createTestError(
        ErrorCode.Unknown,
        'Unknown error',
        'Unknown error.',
      );
      const onCancel = jest.fn();

      const { getByText, queryByText } = renderWithMetrics(
        <HardwareWalletErrorModal error={error} onCancel={onCancel} />,
      );

      expect(getByText('[confirm]')).toBeInTheDocument();
      expect(
        queryByText('[hardwareWalletErrorReconnectButton]'),
      ).not.toBeInTheDocument();
    });

    it('handles Continue button click for retryable errors', async () => {
      const error = createTestError(
        ErrorCode.AuthenticationDeviceLocked,
        'Device is locked',
        'Your device is locked.',
      );
      const onRetry = jest.fn();
      const onCancel = jest.fn();

      const { getByText } = renderWithMetrics(
        <HardwareWalletErrorModal
          error={error}
          onRetry={onRetry}
          onCancel={onCancel}
        />,
      );

      await act(async () => {
        fireEvent.click(getByText('[hardwareWalletErrorReconnectButton]'));
      });

      await waitFor(() => {
        expect(mockEnsureDeviceReady).toHaveBeenCalled();
      });
      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(mockSetConnectionReady).toHaveBeenCalledTimes(1);
    });

    it('tracks incremented modal view count when reconnect fails', async () => {
      mockEnsureDeviceReady.mockResolvedValue(false);
      const error = createTestError(
        ErrorCode.DeviceDisconnected,
        'Device disconnected',
        'Device not found.',
      );

      const { getByText } = renderWithMetrics(
        <HardwareWalletErrorModal error={error} />,
      );

      await waitFor(() => {
        const modalViewed = mockTrackEvent.mock.calls.filter(
          (call) =>
            call[0].event ===
            MetaMetricsEventName.HardwareWalletRecoveryModalViewed,
        );
        expect(modalViewed).toHaveLength(1);
        expect(modalViewed[0][0].properties.error_type_view_count).toBe(1);
      });

      await act(async () => {
        fireEvent.click(getByText('[hardwareWalletErrorContinueButton]'));
      });

      await waitFor(() => {
        const modalViewed = mockTrackEvent.mock.calls.filter(
          (call) =>
            call[0].event ===
            MetaMetricsEventName.HardwareWalletRecoveryModalViewed,
        );
        expect(modalViewed.length).toBeGreaterThanOrEqual(2);
        expect(
          modalViewed[modalViewed.length - 1][0].properties
            .error_type_view_count,
        ).toBe(2);
      });
    });

    it('tracks modal viewed again after error clears and is shown again', async () => {
      const error = createTestError(
        ErrorCode.DeviceDisconnected,
        'Device disconnected',
        'Device not found.',
      );

      const { rerender, store } = renderWithMetrics(
        <HardwareWalletErrorModal error={error} />,
      );

      await waitFor(() => {
        expect(
          mockTrackEvent.mock.calls.some(
            (call) =>
              call[0].event ===
              MetaMetricsEventName.HardwareWalletRecoveryModalViewed,
          ),
        ).toBe(true);
      });

      rerender(
        wrapHardwareWalletModalTree(store, <HardwareWalletErrorModal />),
      );

      rerender(
        wrapHardwareWalletModalTree(
          store,
          <HardwareWalletErrorModal error={error} />,
        ),
      );

      await waitFor(() => {
        const modalViewed = mockTrackEvent.mock.calls.filter(
          (call) =>
            call[0].event ===
            MetaMetricsEventName.HardwareWalletRecoveryModalViewed,
        );
        expect(modalViewed.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('handles Confirm button click for non-retryable errors', async () => {
      const error = createTestError(
        ErrorCode.Unknown,
        'Unknown error',
        'Unknown error.',
      );
      const onCancel = jest.fn();

      const { getByText } = renderWithMetrics(
        <HardwareWalletErrorModal error={error} onCancel={onCancel} />,
      );

      await act(async () => {
        fireEvent.click(getByText('[confirm]'));
      });

      expect(mockHideModal).toHaveBeenCalledTimes(1);
      expect(mockClearError).toHaveBeenCalledTimes(1);
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('Recovery Success State', () => {
    it('displays success modal when device recovery succeeds', async () => {
      const error = createTestError(
        ErrorCode.AuthenticationDeviceLocked,
        'Device is locked',
        'Your device is locked.',
      );

      mockEnsureDeviceReady.mockResolvedValueOnce(true);

      const { getByText, rerender, store } = renderWithMetrics(
        <HardwareWalletErrorModal error={error} />,
      );

      await act(async () => {
        fireEvent.click(getByText('[hardwareWalletErrorReconnectButton]'));
      });

      rerender(
        wrapHardwareWalletModalTree(
          store,
          <HardwareWalletErrorModal error={error} />,
        ),
      );

      expect(getByText('[hardwareWalletTypeConnected]')).toBeInTheDocument();
      expect(mockSetConnectionReady).toHaveBeenCalledTimes(1);
    });

    it('clears error when success modal is closed', async () => {
      const error = createTestError(
        ErrorCode.AuthenticationDeviceLocked,
        'Device is locked',
        'Your device is locked.',
      );

      mockEnsureDeviceReady.mockResolvedValueOnce(true);

      const { getByText, getByLabelText } = renderWithMetrics(
        <HardwareWalletErrorModal error={error} />,
      );

      await act(async () => {
        fireEvent.click(getByText('[hardwareWalletErrorReconnectButton]'));
      });

      const closeButton = getByLabelText('[close]');
      await act(async () => {
        fireEvent.click(closeButton);
      });

      expect(mockHideModal).toHaveBeenCalledTimes(1);
      expect(mockClearError).toHaveBeenCalledTimes(1);
      expect(mockSetConnectionReady).toHaveBeenCalledTimes(2);
    });

    it('auto dismisses the success state after 3 seconds', async () => {
      jest.useFakeTimers();
      const error = createTestError(
        ErrorCode.AuthenticationDeviceLocked,
        'Device is locked',
        'Your device is locked.',
      );

      mockEnsureDeviceReady.mockResolvedValueOnce(true);

      const { getByText } = renderWithMetrics(
        <HardwareWalletErrorModal error={error} />,
      );

      await act(async () => {
        fireEvent.click(getByText('[hardwareWalletErrorReconnectButton]'));
      });

      expect(getByText('[hardwareWalletTypeConnected]')).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(mockHideModal).toHaveBeenCalledTimes(1);
      expect(mockClearError).toHaveBeenCalledTimes(1);
      expect(mockSetConnectionReady).toHaveBeenCalledTimes(2);
      jest.useRealTimers();
    });
  });

  describe('Props Merging', () => {
    it('merges props from direct props and modal state', () => {
      const error = createTestError(
        ErrorCode.AuthenticationDeviceLocked,
        'Device is locked',
        'Your device is locked.',
      );

      const { getByText } = renderWithMetrics(
        <HardwareWalletErrorModal error={error} />,
      );

      expect(
        getByText('[hardwareWalletErrorTitleDeviceLocked]'),
      ).toBeInTheDocument();
    });
  });
});
