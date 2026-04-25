import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import { MetaMetricsHardwareWalletRecoveryLocation } from '../../../../../../shared/constants/metametrics';
import { trackHardwareWalletRecoveryConnectCtaClicked } from '../../../../../helpers/utils/track-hardware-wallet-recovery-connect-cta-clicked';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import {
  addEthereumChainApproval,
  getMockContractInteractionConfirmState,
  getMockPersonalSignConfirmState,
  getMockPersonalSignConfirmStateForRequest,
} from '../../../../../../test/data/confirmations/helper';
import { unapprovedPersonalSignMsg } from '../../../../../../test/data/confirmations/personal_sign';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { Severity } from '../../../../../helpers/constants/design-system';
import { DEFAULT_ROUTE } from '../../../../../helpers/constants/routes';
import {
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../../../../shared/constants/app';
import configureStore from '../../../../../store/store';
import {
  ConnectionStatus,
  HardwareWalletType,
} from '../../../../../contexts/hardware-wallets';
import * as confirmContext from '../../../context/confirm';
import { SignatureRequestType } from '../../../types/confirm';
import { useIsGaslessSupported } from '../../../hooks/gas/useIsGaslessSupported';
import { useInsufficientBalanceAlerts } from '../../../hooks/alerts/transactions/useInsufficientBalanceAlerts';
import { useIsGaslessLoading } from '../../../hooks/gas/useIsGaslessLoading';
import { useConfirmationNavigation } from '../../../hooks/useConfirmationNavigation';
import { useAddEthereumChain } from '../../../hooks/useAddEthereumChain';
import { useUserSubscriptions } from '../../../../../hooks/subscription/useSubscription';
import { useOriginThrottling } from '../../../hooks/useOriginThrottling';
import Footer from './footer';

jest.mock('../../../hooks/gas/useIsGaslessLoading');
jest.mock('../../../hooks/alerts/transactions/useInsufficientBalanceAlerts');
jest.mock('../../../hooks/gas/useIsGaslessSupported');
jest.mock('../../../hooks/pay/useTransactionPayData', () => ({
  useIsTransactionPayLoading: jest.fn(() => false),
  useTransactionPayRequiredTokens: jest.fn(() => []),
}));

const mockOnTransactionConfirm = jest.fn();
const ensureDeviceReadyMock = jest.fn();
const showHardwareWalletErrorModalMock = jest.fn();
const dismissHardwareWalletErrorModalMock = jest.fn();
const setErrorModalSuppressedMock = jest.fn();
const mockUseHardwareWalletState = jest.fn();
const mockUseHardwareWalletConfig = jest.fn();
const mockUseHardwareWalletActions = jest.fn();
const mockUseHardwareWalletError = jest.fn();
const mockIsHardwareWalletError = jest.fn();
const mockIsUserRejectedHardwareWalletError = jest.fn();
const mockGetEnvironmentType = jest.fn();
const mockNavigateNext = jest.fn();
const mockNavigateToId = jest.fn();
const mockRejectPendingApproval = jest.fn();
const mockResolvePendingApproval = jest.fn();
const mockUseConfirmContext = jest.fn();

const mockTrackHardwareWalletRecoveryConnectCtaClicked = jest.mocked(
  trackHardwareWalletRecoveryConnectCtaClicked,
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockStore: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDispatch: any = jest.fn((action: unknown) => {
  if (typeof action === 'function') {
    const mockGetState = mockStore ? mockStore.getState : jest.fn(() => ({}));
    return action(mockDispatch, mockGetState);
  }
  return action;
});

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
}));
jest.mock('../../../../../store/actions', () => ({
  ...jest.requireActual('../../../../../store/actions'),
  rejectPendingApproval: (...args: unknown[]) =>
    mockRejectPendingApproval(...args),
  resolvePendingApproval: (...args: unknown[]) =>
    mockResolvePendingApproval(...args),
}));
jest.mock('../../../context/confirm', () => ({
  ...jest.requireActual('../../../context/confirm'),
  useConfirmContext: (...args: unknown[]) => mockUseConfirmContext(...args),
}));
jest.mock('../../../../../../app/scripts/lib/util', () => ({
  getEnvironmentType: (...args: unknown[]) => mockGetEnvironmentType(...args),
}));
jest.mock('../../../../../store/background-connection', () => ({
  ...jest.requireActual('../../../../../store/background-connection'),
  submitRequestToBackground: jest.fn(() => Promise.resolve()),
}));
jest.mock('../../../hooks/useConfirmationNavigation', () => ({
  ...jest.requireActual('../../../hooks/useConfirmationNavigation'),
  useConfirmationNavigation: jest.fn(() => ({
    navigateNext: mockNavigateNext,
    navigateToId: mockNavigateToId,
  })),
}));
jest.mock(
  '../../../../../components/app/alert-system/contexts/alertMetricsContext',
  () => ({
    useAlertMetrics: jest.fn(() => ({
      trackInlineAlertClicked: jest.fn(),
      trackAlertRender: jest.fn(),
      trackAlertActionClicked: jest.fn(),
    })),
  }),
);

jest.mock('../../../hooks/useOriginThrottling');
jest.mock(
  '../../../../../helpers/utils/track-hardware-wallet-recovery-connect-cta-clicked',
);
jest.mock('../../../../../hooks/subscription/useSubscription');
jest.mock(
  '../../../../../contexts/hardware-wallets/HardwareWalletContext',
  () => ({
    ...jest.requireActual(
      '../../../../../contexts/hardware-wallets/HardwareWalletContext',
    ),
    useHardwareWalletState: () => mockUseHardwareWalletState(),
    useHardwareWalletConfig: () => mockUseHardwareWalletConfig(),
    useHardwareWalletActions: () => mockUseHardwareWalletActions(),
  }),
);
jest.mock(
  '../../../../../contexts/hardware-wallets/HardwareWalletErrorProvider',
  () => ({
    ...jest.requireActual(
      '../../../../../contexts/hardware-wallets/HardwareWalletErrorProvider',
    ),
    useHardwareWalletError: () => mockUseHardwareWalletError(),
  }),
);
jest.mock('../../../../../contexts/hardware-wallets/rpcErrorUtils', () => ({
  ...jest.requireActual(
    '../../../../../contexts/hardware-wallets/rpcErrorUtils',
  ),
  isHardwareWalletError: (...args: unknown[]) =>
    mockIsHardwareWalletError(...args),
  isUserRejectedHardwareWalletError: (...args: unknown[]) =>
    mockIsUserRejectedHardwareWalletError(...args),
}));
jest.mock('../../../../../contexts/hardware-wallets', () => ({
  ...jest.requireActual('../../../../../contexts/hardware-wallets'),
  useHardwareWalletState: () => mockUseHardwareWalletState(),
  useHardwareWalletConfig: () => mockUseHardwareWalletConfig(),
  useHardwareWalletActions: () => mockUseHardwareWalletActions(),
  useHardwareWalletError: () => mockUseHardwareWalletError(),
  isHardwareWalletError: (...args: unknown[]) =>
    mockIsHardwareWalletError(...args),
  isUserRejectedHardwareWalletError: (...args: unknown[]) =>
    mockIsUserRejectedHardwareWalletError(...args),
}));
jest.mock('../../../hooks/useAddEthereumChain', () => ({
  useAddEthereumChain: jest.fn(() => ({
    onSubmit: jest.fn().mockResolvedValue(undefined),
  })),
  isAddEthereumChainType: jest.fn(
    (confirmation) => confirmation?.type === 'wallet_addEthereumChain',
  ),
}));
jest.mock('../../../hooks/transactions/useTransactionConfirm', () => ({
  useTransactionConfirm: jest.fn(() => ({
    onTransactionConfirm: mockOnTransactionConfirm,
  })),
}));
jest.mock('../../../hooks/useConfirmSendNavigation', () => ({
  useConfirmSendNavigation: jest.fn(() => ({
    navigateBackIfSend: jest.fn(),
  })),
}));

const mockUseNavigate = jest.fn();

const mockUseOriginThrottling = useOriginThrottling as jest.Mock;
const useIsGaslessSupportedMock = jest.mocked(useIsGaslessSupported);
const useIsGaslessLoadingMock = jest.mocked(useIsGaslessLoading);
const useAddEthereumChainMock = jest.mocked(useAddEthereumChain);
const useConfirmationNavigationMock = jest.mocked(useConfirmationNavigation);
const useUserSubscriptionsMock = jest.mocked(useUserSubscriptions);

function getDefaultFooterTestLocation() {
  return {
    pathname: '/confirm-transaction',
    search: '',
    hash: '',
    state: null,
  };
}

const mockUseLocation = jest.fn(getDefaultFooterTestLocation);
jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockUseNavigate,
    useLocation: () => mockUseLocation(),
  };
});

const render = (
  args?: Record<string, unknown>,
  options?: {
    pathname?: string;
    confirmationId?: string;
    getMockTrackEvent?: () => jest.Mock;
  },
) => {
  const store = configureStore(args ?? getMockPersonalSignConfirmState());
  mockStore = store;

  return renderWithConfirmContextProvider(
    <Footer />,
    store,
    options?.pathname ?? DEFAULT_ROUTE,
    options?.confirmationId,
    options?.getMockTrackEvent,
  );
};

describe('HardwareWalletFooter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch.mockClear();
    mockStore = null;

    mockOnTransactionConfirm.mockReset();
    ensureDeviceReadyMock.mockReset();
    showHardwareWalletErrorModalMock.mockReset();
    dismissHardwareWalletErrorModalMock.mockReset();
    setErrorModalSuppressedMock.mockReset();
    mockNavigateNext.mockReset();
    mockNavigateToId.mockReset();
    mockUseHardwareWalletState.mockReset();
    mockUseHardwareWalletConfig.mockReset();
    mockUseHardwareWalletActions.mockReset();
    mockUseHardwareWalletError.mockReset();
    mockIsHardwareWalletError.mockReset();
    mockIsUserRejectedHardwareWalletError.mockReset();
    mockTrackHardwareWalletRecoveryConnectCtaClicked.mockReset();
    mockRejectPendingApproval.mockReset();
    mockResolvePendingApproval.mockReset();
    mockUseConfirmContext.mockReset();

    mockOnTransactionConfirm.mockResolvedValue(undefined);
    ensureDeviceReadyMock.mockResolvedValue(true);

    mockUseHardwareWalletState.mockReturnValue({
      connectionState: { status: ConnectionStatus.Connected },
    });
    // Default to hardware wallet account for this test suite
    mockUseHardwareWalletConfig.mockReturnValue({
      isHardwareWalletAccount: true,
      walletType: HardwareWalletType.Ledger,
    });
    mockUseHardwareWalletActions.mockReturnValue({
      ensureDeviceReady: ensureDeviceReadyMock,
    });
    mockUseHardwareWalletError.mockReturnValue({
      showErrorModal: showHardwareWalletErrorModalMock,
      dismissErrorModal: dismissHardwareWalletErrorModalMock,
      setErrorModalSuppressed: setErrorModalSuppressedMock,
    });
    mockIsHardwareWalletError.mockReturnValue(false);
    mockIsUserRejectedHardwareWalletError.mockReturnValue(false);

    mockUseOriginThrottling.mockReturnValue({
      shouldThrottleOrigin: false,
    });

    useIsGaslessSupportedMock.mockReturnValue({
      isSmartTransaction: false,
      isSupported: false,
      pending: false,
    });

    useIsGaslessLoadingMock.mockReturnValue({
      isGaslessLoading: false,
    });

    mockUseLocation.mockImplementation(getDefaultFooterTestLocation);
    useUserSubscriptionsMock.mockReturnValue({
      trialedProducts: [],
      loading: false,
      subscriptions: [],
      error: undefined,
    });
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_NOTIFICATION);

    mockRejectPendingApproval.mockReturnValue(Promise.resolve());
    mockResolvePendingApproval.mockReturnValue(() => Promise.resolve());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUseConfirmContext.mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (jest.requireActual('../../../context/confirm') as any).useConfirmContext,
    );

    useConfirmationNavigationMock.mockReturnValue({
      navigateNext: mockNavigateNext,
      navigateToId: mockNavigateToId,
    } as unknown as ReturnType<typeof useConfirmationNavigation>);
  });

  it('suppresses hardware wallet error modal while danger alerts are unconfirmed and hardware wallet is ready', async () => {
    mockUseHardwareWalletState.mockReturnValue({
      connectionState: { status: ConnectionStatus.Ready },
    });

    await render(
      getMockPersonalSignConfirmStateForRequest(
        { ...unapprovedPersonalSignMsg, id: '123' },
        {
          confirmAlerts: {
            alerts: {
              '123': [
                {
                  key: 'Contract',
                  severity: Severity.Danger,
                  message: 'Alert Info',
                },
              ],
            },
            confirmed: { '123': { Contract: false } },
          },
          metamask: {},
        },
      ),
    );

    expect(setErrorModalSuppressedMock).toHaveBeenCalledWith(true);
  });

  it('suppresses hardware wallet error modal while danger alerts are unconfirmed and hardware wallet is not ready', async () => {
    mockUseHardwareWalletState.mockReturnValue({
      connectionState: { status: ConnectionStatus.Disconnected },
    });

    await render(
      getMockPersonalSignConfirmStateForRequest(
        { ...unapprovedPersonalSignMsg, id: '123' },
        {
          confirmAlerts: {
            alerts: {
              '123': [
                {
                  key: 'Contract',
                  severity: Severity.Danger,
                  message: 'Alert Info',
                },
              ],
            },
            confirmed: { '123': { Contract: false } },
          },
          metamask: {},
        },
      ),
    );

    expect(setErrorModalSuppressedMock).toHaveBeenCalledWith(true);
  });

  it('does not suppress hardware wallet error modal when there are no unconfirmed danger alerts', () => {
    mockUseHardwareWalletState.mockReturnValue({
      connectionState: { status: ConnectionStatus.Ready },
    });

    render(getMockPersonalSignConfirmState());

    expect(setErrorModalSuppressedMock).toHaveBeenCalledWith(false);
  });

  it('resets hardware wallet error modal suppression on unmount', () => {
    mockUseHardwareWalletState.mockReturnValue({
      connectionState: { status: ConnectionStatus.Ready },
    });

    const { unmount } = render(
      getMockPersonalSignConfirmStateForRequest(
        { ...unapprovedPersonalSignMsg, id: '123' },
        {
          confirmAlerts: {
            alerts: {
              '123': [
                {
                  key: 'Contract',
                  severity: Severity.Danger,
                  message: 'Alert Info',
                },
              ],
            },
            confirmed: { '123': { Contract: false } },
          },
          metamask: {},
        },
      ),
    );

    expect(setErrorModalSuppressedMock).toHaveBeenCalledWith(true);
    unmount();
    expect(setErrorModalSuppressedMock).toHaveBeenLastCalledWith(false);
  });

  it('dismisses hardware wallet error modal when cancel button is clicked', async () => {
    mockUseHardwareWalletState.mockReturnValue({
      connectionState: { status: ConnectionStatus.Ready },
    });

    const { getAllByRole } = render();
    const cancelButton = getAllByRole('button')[0];

    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(dismissHardwareWalletErrorModalMock).toHaveBeenCalled();
    });
  });

  describe('hardware wallet handling', () => {
    it('renders confirm button when hardware wallet is ready', () => {
      mockUseHardwareWalletState.mockReturnValue({
        connectionState: { status: ConnectionStatus.Ready },
      });
      mockUseHardwareWalletError.mockReturnValue({
        showErrorModal: showHardwareWalletErrorModalMock,
        dismissErrorModal: dismissHardwareWalletErrorModalMock,
        setErrorModalSuppressed: setErrorModalSuppressedMock,
        isDeviceConnected: true,
      });

      const { getByTestId, queryByTestId } = render();
      expect(getByTestId('confirm-footer-button')).toBeInTheDocument();
      expect(queryByTestId('reconnect-hardware-wallet-button')).toBeNull();
    });

    it('renders reconnect button when hardware wallet is not ready', () => {
      mockUseHardwareWalletState.mockReturnValue({
        connectionState: { status: ConnectionStatus.Disconnected },
      });
      mockUseHardwareWalletError.mockReturnValue({
        showErrorModal: showHardwareWalletErrorModalMock,
        dismissErrorModal: dismissHardwareWalletErrorModalMock,
        setErrorModalSuppressed: setErrorModalSuppressedMock,
        isDeviceConnected: false,
      });

      const { getByTestId, queryByTestId, getByText } = render();
      expect(getByText('Connect Ledger')).toBeInTheDocument();
      expect(
        getByTestId('reconnect-hardware-wallet-button'),
      ).toBeInTheDocument();
      expect(queryByTestId('confirm-footer-button')).not.toBeInTheDocument();
    });

    it('tracks hardware wallet recovery CTA when reconnect is clicked', async () => {
      const mockTrackEvent = jest.fn().mockResolvedValue(undefined);
      const connectionState = {
        status: ConnectionStatus.Disconnected as const,
      };
      mockUseHardwareWalletState.mockReturnValue({
        connectionState,
      });
      mockUseHardwareWalletError.mockReturnValue({
        showErrorModal: showHardwareWalletErrorModalMock,
        dismissErrorModal: dismissHardwareWalletErrorModalMock,
        setErrorModalSuppressed: setErrorModalSuppressedMock,
        isDeviceConnected: false,
      });

      const { getByTestId } = render(undefined, {
        getMockTrackEvent: () => mockTrackEvent,
      });

      fireEvent.click(getByTestId('reconnect-hardware-wallet-button'));

      await waitFor(() => {
        expect(
          mockTrackHardwareWalletRecoveryConnectCtaClicked,
        ).toHaveBeenCalledWith(mockTrackEvent, {
          location: MetaMetricsHardwareWalletRecoveryLocation.Send,
          walletType: HardwareWalletType.Ledger,
          connectionState,
        });
      });
      expect(ensureDeviceReadyMock).toHaveBeenCalled();
    });

    it('does not confirm when hardware wallet preflight fails', async () => {
      ensureDeviceReadyMock.mockResolvedValue(false);
      mockUseHardwareWalletState.mockReturnValue({
        connectionState: { status: ConnectionStatus.Ready },
      });

      const preflightState = getMockContractInteractionConfirmState();
      const preflightConfirmation = preflightState.metamask.transactions[0];
      mockUseConfirmContext.mockReturnValue({
        currentConfirmation: preflightConfirmation,
        isScrollToBottomCompleted: true,
        setIsScrollToBottomCompleted: () => undefined,
      } as unknown as ReturnType<typeof confirmContext.useConfirmContext>);

      const { getByTestId } = render(preflightState);
      fireEvent.click(getByTestId('confirm-footer-button'));

      await waitFor(() => {
        expect(ensureDeviceReadyMock).toHaveBeenCalledWith({
          requireBlindSigning: true,
        });
      });
      expect(mockOnTransactionConfirm).not.toHaveBeenCalled();
    });

    it('shows confirm review-alert button when hardware wallet is not ready and danger alerts are unconfirmed', () => {
      mockUseHardwareWalletState.mockReturnValue({
        connectionState: { status: ConnectionStatus.Disconnected },
      });
      mockUseHardwareWalletError.mockReturnValue({
        showErrorModal: showHardwareWalletErrorModalMock,
        dismissErrorModal: dismissHardwareWalletErrorModalMock,
        setErrorModalSuppressed: setErrorModalSuppressedMock,
        isDeviceConnected: false,
      });

      const stateWithDangerAlert = getMockPersonalSignConfirmStateForRequest(
        { ...unapprovedPersonalSignMsg, id: '123' } as SignatureRequestType,
        {
          confirmAlerts: {
            alerts: {
              '123': [
                {
                  key: 'Contract',
                  severity: Severity.Danger,
                  message: 'Alert Info',
                },
              ],
            },
            confirmed: { '123': { Contract: false } },
          },
          metamask: {},
        },
      );

      const { getByTestId, queryByTestId } = render(stateWithDangerAlert);

      expect(queryByTestId('reconnect-hardware-wallet-button')).toBeNull();
      expect(getByTestId('confirm-footer-button')).toBeInTheDocument();
    });

    it('bypasses hardware wallet preflight for add chain confirmations', async () => {
      const addEthereumChainSubmitMock = jest.fn().mockResolvedValue(undefined);
      useAddEthereumChainMock.mockReturnValue({
        onSubmit: addEthereumChainSubmitMock,
      });
      mockUseConfirmContext.mockReturnValue({
        currentConfirmation: addEthereumChainApproval,
        isScrollToBottomCompleted: true,
        setIsScrollToBottomCompleted: () => undefined,
      } as unknown as ReturnType<typeof confirmContext.useConfirmContext>);
      mockUseHardwareWalletState.mockReturnValue({
        connectionState: { status: ConnectionStatus.Disconnected },
      });

      const { getByTestId, queryByTestId } = render();

      expect(queryByTestId('reconnect-hardware-wallet-button')).toBeNull();
      fireEvent.click(getByTestId('confirm-footer-button'));

      await waitFor(() => {
        expect(addEthereumChainSubmitMock).toHaveBeenCalledTimes(1);
      });
      expect(ensureDeviceReadyMock).not.toHaveBeenCalled();
      expect(mockUseNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE);
    });

    it('navigates to next confirmation on hardware wallet rejection', async () => {
      const hardwareError = new Error('User rejected');
      mockUseHardwareWalletState.mockReturnValue({
        connectionState: { status: ConnectionStatus.Ready },
      });
      mockIsHardwareWalletError.mockReturnValue(true);
      mockIsUserRejectedHardwareWalletError.mockReturnValue(true);
      mockResolvePendingApproval.mockReturnValue(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        () => Promise.reject(hardwareError) as any,
      );

      const { getByTestId } = render(
        getMockPersonalSignConfirmStateForRequest({
          ...unapprovedPersonalSignMsg,
          msgParams: {
            from: '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
          },
        } as SignatureRequestType),
      );

      fireEvent.click(getByTestId('confirm-footer-button'));

      await waitFor(() => {
        expect(mockResolvePendingApproval).toHaveBeenCalled();
      });

      expect(mockResolvePendingApproval).toHaveBeenCalledWith(
        expect.any(String),
        undefined,
        {
          fromAddress: '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
          waitForResult: true,
          walletType: HardwareWalletType.Ledger,
        },
      );
      expect(mockNavigateNext).toHaveBeenCalledWith(expect.any(String));
      expect(showHardwareWalletErrorModalMock).not.toHaveBeenCalled();
      expect(dismissHardwareWalletErrorModalMock).toHaveBeenCalledTimes(1);
    });

    it('navigates to next confirmation on hardware wallet rejection in sidepanel', async () => {
      const hardwareError = new Error('User rejected');
      mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_SIDEPANEL);
      mockUseHardwareWalletState.mockReturnValue({
        connectionState: { status: ConnectionStatus.Ready },
      });
      mockIsHardwareWalletError.mockReturnValue(true);
      mockIsUserRejectedHardwareWalletError.mockReturnValue(true);
      mockResolvePendingApproval.mockReturnValue(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        () => Promise.reject(hardwareError) as any,
      );

      const { getByTestId } = render(
        getMockPersonalSignConfirmStateForRequest({
          ...unapprovedPersonalSignMsg,
          msgParams: {
            from: '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
          },
        } as SignatureRequestType),
      );

      fireEvent.click(getByTestId('confirm-footer-button'));

      await waitFor(() => {
        expect(mockResolvePendingApproval).toHaveBeenCalled();
      });

      expect(mockNavigateNext).toHaveBeenCalledWith(expect.any(String));
      expect(mockUseNavigate).not.toHaveBeenCalledWith(
        `${DEFAULT_ROUTE}?tab=activity`,
        { replace: true },
      );
      expect(showHardwareWalletErrorModalMock).not.toHaveBeenCalled();
      expect(dismissHardwareWalletErrorModalMock).toHaveBeenCalledTimes(1);
    });

    it('shows error modal on retryable error', async () => {
      const hardwareError = new Error('Hardware wallet error');
      mockUseHardwareWalletState.mockReturnValue({
        connectionState: { status: ConnectionStatus.Ready },
      });
      mockIsHardwareWalletError.mockReturnValue(true);
      mockResolvePendingApproval.mockReturnValue(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        () => Promise.reject(hardwareError) as any,
      );

      const { getByTestId } = render(
        getMockPersonalSignConfirmStateForRequest({
          ...unapprovedPersonalSignMsg,
          msgParams: {
            from: '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
          },
        } as SignatureRequestType),
      );

      fireEvent.click(getByTestId('confirm-footer-button'));

      await waitFor(() => {
        expect(mockResolvePendingApproval).toHaveBeenCalled();
      });

      expect(showHardwareWalletErrorModalMock).toHaveBeenCalledWith(
        hardwareError,
      );
      expect(mockNavigateNext).not.toHaveBeenCalled();
    });
  });
});
