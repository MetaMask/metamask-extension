import React from 'react';
import { BlockaidResultType } from '../../../../../../shared/constants/security-provider';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import {
  addEthereumChainApproval,
  getMockContractInteractionConfirmState,
  getMockPersonalSignConfirmState,
  getMockPersonalSignConfirmStateForRequest,
  getMockTypedSignConfirmState,
  getMockTypedSignConfirmStateForRequest,
} from '../../../../../../test/data/confirmations/helper';
import {
  signatureRequestSIWE,
  unapprovedPersonalSignMsg,
} from '../../../../../../test/data/confirmations/personal_sign';
import { permitSignatureMsg } from '../../../../../../test/data/confirmations/typed_sign';
import { fireEvent, waitFor } from '../../../../../../test/jest';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import {
  CONFIRM_TRANSACTION_ROUTE,
  DEFAULT_ROUTE,
  SIGNATURE_REQUEST_PATH,
} from '../../../../../helpers/constants/routes';
import {
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../../../../shared/constants/app';
import * as Actions from '../../../../../store/actions';
import configureStore from '../../../../../store/store';
import {
  ConnectionStatus,
  HardwareWalletType,
} from '../../../../../contexts/hardware-wallets';
import * as confirmContext from '../../../context/confirm';
import { SignatureRequestType } from '../../../types/confirm';
import { useOriginThrottling } from '../../../hooks/useOriginThrottling';
import { useIsGaslessSupported } from '../../../hooks/gas/useIsGaslessSupported';
import { useInsufficientBalanceAlerts } from '../../../hooks/alerts/transactions/useInsufficientBalanceAlerts';
import { useIsGaslessLoading } from '../../../hooks/gas/useIsGaslessLoading';
import { useConfirmationNavigation } from '../../../hooks/useConfirmationNavigation';
import { useUserSubscriptions } from '../../../../../hooks/subscription/useSubscription';
import Footer from './footer';

jest.mock('../../../hooks/gas/useIsGaslessLoading');
jest.mock('../../../hooks/alerts/transactions/useInsufficientBalanceAlerts');
jest.mock('../../../hooks/gas/useIsGaslessSupported');

const mockOnTransactionConfirm = jest.fn();
const ensureDeviceReadyMock = jest.fn();
const showHardwareWalletErrorModalMock = jest.fn();
const mockUseHardwareWalletState = jest.fn();
const mockUseHardwareWalletConfig = jest.fn();
const mockUseHardwareWalletActions = jest.fn();
const mockUseHardwareWalletError = jest.fn();
const mockIsHardwareWalletError = jest.fn();
const mockIsUserRejectedHardwareWalletError = jest.fn();
const mockIsRetryableHardwareWalletError = jest.fn();
const mockGetEnvironmentType = jest.fn();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockStore: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDispatch: any = jest.fn((action: unknown) => {
  if (typeof action === 'function') {
    // Thunk actions need both dispatch and getState
    const mockGetState = mockStore ? mockStore.getState : jest.fn(() => ({}));
    return action(mockDispatch, mockGetState);
  }
  return action;
});

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
}));
jest.mock('../../../../../../app/scripts/lib/util', () => ({
  getEnvironmentType: (...args: unknown[]) => mockGetEnvironmentType(...args),
}));
jest.mock('../../../../../store/background-connection', () => ({
  ...jest.requireActual('../../../../../store/background-connection'),
  submitRequestToBackground: jest.fn(() => Promise.resolve()),
}));
jest.mock('../../../hooks/useConfirmationNavigation', () => ({
  useConfirmationNavigation: jest.fn(() => ({
    navigateNext: jest.fn(),
    navigateToId: jest.fn(),
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

jest.mock('../../../../../hooks/subscription/useSubscription');
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
  isRetryableHardwareWalletError: (...args: unknown[]) =>
    mockIsRetryableHardwareWalletError(...args),
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
const mockUseLocation = jest.fn();
jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockUseNavigate,
    useLocation: () => mockUseLocation(),
  };
});

const render = (args?: Record<string, unknown>) => {
  const store = configureStore(args ?? getMockPersonalSignConfirmState());
  mockStore = store;

  return renderWithConfirmContextProvider(<Footer />, store);
};

const ALERT_MOCK = [
  {
    key: 'insufficientNativeToken',
    severity: Severity.Danger,
    message: 'Not enough native token to cover fees',
  },
] as Alert[];

describe('ConfirmFooter', () => {
  const mockUseOriginThrottling = useOriginThrottling as jest.Mock;
  const useIsGaslessSupportedMock = jest.mocked(useIsGaslessSupported);
  const useInsufficientBalanceAlertsMock = jest.mocked(
    useInsufficientBalanceAlerts,
  );
  const useIsGaslessLoadingMock = jest.mocked(useIsGaslessLoading);
  const useConfirmationNavigationMock = jest.mocked(useConfirmationNavigation);
  const useUserSubscriptionsMock = jest.mocked(useUserSubscriptions);
  let closeCurrentNotificationWindowSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDispatch.mockClear();
    mockStore = null;

    mockOnTransactionConfirm.mockReset();
    ensureDeviceReadyMock.mockReset();
    showHardwareWalletErrorModalMock.mockReset();
    mockUseHardwareWalletState.mockReset();
    mockUseHardwareWalletConfig.mockReset();
    mockUseHardwareWalletActions.mockReset();
    mockUseHardwareWalletError.mockReset();
    mockIsHardwareWalletError.mockReset();
    mockIsUserRejectedHardwareWalletError.mockReset();
    mockIsRetryableHardwareWalletError.mockReset();

    mockOnTransactionConfirm.mockResolvedValue(undefined);
    ensureDeviceReadyMock.mockResolvedValue(true);

    mockUseHardwareWalletState.mockReturnValue({
      connectionState: { status: ConnectionStatus.Connected },
    });
    mockUseHardwareWalletConfig.mockReturnValue({
      isHardwareWalletAccount: false,
      deviceId: null,
      walletType: null,
    });
    mockUseHardwareWalletActions.mockReturnValue({
      ensureDeviceReady: ensureDeviceReadyMock,
    });
    mockUseHardwareWalletError.mockReturnValue({
      showErrorModal: showHardwareWalletErrorModalMock,
    });
    mockIsHardwareWalletError.mockReturnValue(false);
    mockIsUserRejectedHardwareWalletError.mockReturnValue(false);
    mockIsRetryableHardwareWalletError.mockReturnValue(false);

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

    mockUseLocation.mockReturnValue({
      pathname: '/confirm-transaction',
      search: '',
      hash: '',
      state: null,
    });
    useUserSubscriptionsMock.mockReturnValue({
      trialedProducts: [],
      loading: false,
      subscriptions: [],
      error: undefined,
    });
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_NOTIFICATION);

    closeCurrentNotificationWindowSpy = jest
      .spyOn(Actions, 'closeCurrentNotificationWindow')
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockImplementation(() => (() => undefined) as any);
  });

  afterEach(() => {
    closeCurrentNotificationWindowSpy.mockRestore();
  });

  it('should match snapshot with signature confirmation', () => {
    const { container } = render(getMockPersonalSignConfirmState());
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with transaction confirmation', () => {
    const { container } = render(getMockContractInteractionConfirmState());
    expect(container).toMatchSnapshot();
  });

  it('renders the "Cancel" and "Confirm" Buttons', () => {
    const { getAllByRole, getByText } = render();
    const buttons = getAllByRole('button');
    expect(buttons).toHaveLength(2);
    expect(getByText('Confirm')).toBeInTheDocument();
    expect(getByText('Cancel')).toBeInTheDocument();
  });

  describe('renders enabled "Confirm" Button', () => {
    it('when isScrollToBottomCompleted is true', () => {
      const mockStateTypedSign = getMockTypedSignConfirmState();
      const { getByText } = render(mockStateTypedSign);

      const confirmButton = getByText('Confirm');
      expect(confirmButton).not.toBeDisabled();
    });

    it('when the confirmation is a Sign-in With Ethereum (SIWE) request', () => {
      jest.spyOn(confirmContext, 'useConfirmContext').mockReturnValue({
        currentConfirmation: signatureRequestSIWE,
        isScrollToBottomCompleted: false,
        setIsScrollToBottomCompleted: () => undefined,
      } as unknown as ReturnType<typeof confirmContext.useConfirmContext>);
      const mockStateSIWE =
        getMockPersonalSignConfirmStateForRequest(signatureRequestSIWE);
      const { getByText } = render(mockStateSIWE);

      const confirmButton = getByText('Confirm');
      expect(confirmButton).not.toBeDisabled();
    });

    it('when the confirmation is a Permit with the transaction simulation setting enabled', () => {
      const mockStatePermit =
        getMockTypedSignConfirmStateForRequest(permitSignatureMsg);
      const { getByText } = render(mockStatePermit);

      const confirmButton = getByText('Confirm');
      expect(confirmButton).not.toBeDisabled();
    });

    it('when simulation is enabled and fetched', () => {
      useIsGaslessSupportedMock.mockReturnValue({
        isSmartTransaction: true,
        isSupported: true,
        pending: false,
      });
      useInsufficientBalanceAlertsMock.mockReturnValue(ALERT_MOCK);
      jest.spyOn(confirmContext, 'useConfirmContext').mockReturnValue({
        currentConfirmation: {
          ...genUnapprovedContractInteractionConfirmation(),
          simulationData: {
            tokenBalanceChanges: [],
          },
        },
        isScrollToBottomCompleted: true,
        setIsScrollToBottomCompleted: () => undefined,
      } as unknown as ReturnType<typeof confirmContext.useConfirmContext>);

      const mockState2 = {
        ...getMockContractInteractionConfirmState(),
        metamask: {
          ...getMockContractInteractionConfirmState().metamask,
          useTransactionSimulations: true,
        },
        appState: {
          ...getMockContractInteractionConfirmState().appState,
          confirmAlerts: {
            alerts: {
              '1': ALERT_MOCK,
            },
            confirmed: {},
          },
        },
      };

      const { getByText } = render(mockState2);
      const confirmButton = getByText('Confirm');
      expect(confirmButton).not.toBeDisabled();
    });
  });

  describe('renders disabled "Confirm" Button', () => {
    it('when isScrollToBottomCompleted is false', () => {
      jest.spyOn(confirmContext, 'useConfirmContext').mockReturnValue({
        currentConfirmation: genUnapprovedContractInteractionConfirmation(),
        isScrollToBottomCompleted: false,
        setIsScrollToBottomCompleted: () => undefined,
      } as unknown as ReturnType<typeof confirmContext.useConfirmContext>);
      const mockStateTypedSign = getMockContractInteractionConfirmState();
      const { getByText } = render(mockStateTypedSign);

      const confirmButton = getByText('Confirm');
      expect(confirmButton).toBeDisabled();
    });

    it('disables confirm button when gas fee tokens are still loading', () => {
      useIsGaslessLoadingMock.mockReturnValue({
        isGaslessLoading: true,
      });

      const mockState2 = {
        ...getMockContractInteractionConfirmState(),
        metamask: {
          ...getMockContractInteractionConfirmState().metamask,
          useTransactionSimulations: true,
        },
        appState: {
          ...getMockContractInteractionConfirmState().appState,
          confirmAlerts: {
            alerts: {
              '1': ALERT_MOCK,
            },
            confirmed: {},
          },
        },
      };

      const { getByText } = render(mockState2);
      const confirmButton = getByText('Confirm');
      expect(confirmButton).toBeDisabled();
    });
  });

  it('invoke required actions when cancel button is clicked', async () => {
    const { getAllByRole } = render();
    const cancelButton = getAllByRole('button')[0];
    const rejectSpy = jest
      .spyOn(Actions, 'rejectPendingApproval')
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockImplementation(() => Promise.resolve() as any);
    const updateCustomNonceSpy = jest
      .spyOn(Actions, 'updateCustomNonce')
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockReturnValue({} as any);
    const setNextNonceSpy = jest
      .spyOn(Actions, 'setNextNonce')
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockReturnValue({} as any);

    fireEvent.click(cancelButton);

    // Wait for async onCancel to complete
    await waitFor(() => {
      expect(rejectSpy).toHaveBeenCalled();
    });

    expect(updateCustomNonceSpy).toHaveBeenCalledWith('');
    expect(setNextNonceSpy).toHaveBeenCalledWith('');
  });

  it('invoke required actions when submit button is clicked', async () => {
    const { getAllByRole } = render();
    const submitButton = getAllByRole('button')[1];
    const resolveSpy = jest
      .spyOn(Actions, 'resolvePendingApproval')
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockImplementation(() => Promise.resolve() as any);
    const updateCustomNonceSpy = jest
      .spyOn(Actions, 'updateCustomNonce')
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockReturnValue({} as any);
    const setNextNonceSpy = jest
      .spyOn(Actions, 'setNextNonce')
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockReturnValue({} as any);

    fireEvent.click(submitButton);

    // Wait for async onSubmit to complete
    await waitFor(() => {
      expect(resolveSpy).toHaveBeenCalled();
    });

    expect(updateCustomNonceSpy).toHaveBeenCalledWith('');
    expect(setNextNonceSpy).toHaveBeenCalledWith('');
    expect(closeCurrentNotificationWindowSpy).toHaveBeenCalled();
  });

  it('redirects to activity after signature success in sidepanel', async () => {
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_SIDEPANEL);

    const { getAllByRole } = render();
    const submitButton = getAllByRole('button')[1];
    const resolveSpy = jest
      .spyOn(Actions, 'resolvePendingApproval')
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockImplementation(() => Promise.resolve() as any);

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(resolveSpy).toHaveBeenCalled();
    });

    expect(mockUseNavigate).toHaveBeenCalledWith(
      `${DEFAULT_ROUTE}?tab=activity`,
      { replace: true },
    );
    expect(closeCurrentNotificationWindowSpy).not.toHaveBeenCalled();
  });

  it('displays the "Confirm" button when there are danger alerts', async () => {
    const mockSecurityAlertId = '8';
    const { getAllByRole } = await render(
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
          metamask: {
            signatureSecurityAlertResponses: {
              [mockSecurityAlertId]: {
                // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                // eslint-disable-next-line @typescript-eslint/naming-convention
                result_type: BlockaidResultType.Malicious,
              },
            },
          },
        },
      ),
    );
    const submitButton = getAllByRole('button')[1];
    expect(submitButton).toHaveTextContent('Confirm');
  });

  it('no action is taken when the origin is on threshold and cancel button is clicked', () => {
    mockUseOriginThrottling.mockReturnValue({
      shouldThrottleOrigin: true,
    });
    const rejectSpy = jest.spyOn(Actions, 'rejectPendingApproval');

    const { getAllByRole } = render(getMockPersonalSignConfirmState());

    const cancelButton = getAllByRole('button')[0];
    fireEvent.click(cancelButton);

    expect(rejectSpy).not.toHaveBeenCalled();
  });

  describe('hardware wallet handling', () => {
    it('renders reconnect button when hardware wallet is not ready', () => {
      mockUseHardwareWalletConfig.mockReturnValue({
        isHardwareWalletAccount: true,
        deviceId: 'device-id',
        walletType: HardwareWalletType.Ledger,
      });
      mockUseHardwareWalletState.mockReturnValue({
        connectionState: { status: ConnectionStatus.Disconnected },
      });

      const { getByTestId, queryByTestId } = render();
      expect(
        getByTestId('reconnect-hardware-wallet-button'),
      ).toBeInTheDocument();
      expect(queryByTestId('confirm-footer-button')).not.toBeInTheDocument();
    });

    it('does not confirm when hardware wallet preflight fails', async () => {
      ensureDeviceReadyMock.mockResolvedValue(false);
      mockUseHardwareWalletConfig.mockReturnValue({
        isHardwareWalletAccount: true,
        deviceId: 'device-id',
        walletType: HardwareWalletType.Ledger,
      });
      mockUseHardwareWalletState.mockReturnValue({
        connectionState: { status: ConnectionStatus.Connected },
      });

      const preflightState = getMockContractInteractionConfirmState();
      const preflightConfirmation = preflightState.metamask.transactions[0];
      jest.spyOn(confirmContext, 'useConfirmContext').mockReturnValue({
        currentConfirmation: preflightConfirmation,
        isScrollToBottomCompleted: true,
        setIsScrollToBottomCompleted: () => undefined,
      } as unknown as ReturnType<typeof confirmContext.useConfirmContext>);

      const { getByTestId } = render(preflightState);
      fireEvent.click(getByTestId('confirm-footer-button'));

      await waitFor(() => {
        expect(ensureDeviceReadyMock).toHaveBeenCalledWith('device-id');
      });
      expect(mockOnTransactionConfirm).not.toHaveBeenCalled();
    });

    it('disables confirm button when hardware signing is pending', () => {
      const pendingState = getMockContractInteractionConfirmState();
      const pendingConfirmation = pendingState.metamask.transactions[0];
      jest.spyOn(confirmContext, 'useConfirmContext').mockReturnValue({
        currentConfirmation: pendingConfirmation,
        isScrollToBottomCompleted: true,
        setIsScrollToBottomCompleted: () => undefined,
      } as unknown as ReturnType<typeof confirmContext.useConfirmContext>);

      const { getByTestId } = render({
        ...pendingState,
        appState: {
          ...pendingState.appState,
          pendingHardwareSigning: true,
        },
      });

      expect(getByTestId('confirm-footer-button')).toBeDisabled();
    });

    it('clears pending signing and closes popup on hardware wallet rejection', async () => {
      const hardwareError = new Error('User rejected');
      mockUseHardwareWalletConfig.mockReturnValue({
        isHardwareWalletAccount: true,
        deviceId: 'device-id',
        walletType: HardwareWalletType.Ledger,
      });
      mockUseHardwareWalletState.mockReturnValue({
        connectionState: { status: ConnectionStatus.Connected },
      });
      mockIsHardwareWalletError.mockReturnValue(true);
      mockIsUserRejectedHardwareWalletError.mockReturnValue(true);

      const resolveSpy = jest
        .spyOn(Actions, 'resolvePendingApproval')
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockImplementation(() => () => Promise.reject(hardwareError) as any);
      const setPendingHardwareSigningSpy = jest
        .spyOn(Actions, 'setPendingHardwareSigning')
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockReturnValue({} as any);
      const closeWindowSpy = jest
        .spyOn(Actions, 'closeCurrentNotificationWindow')
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockReturnValue((() => undefined) as any);

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
        expect(resolveSpy).toHaveBeenCalled();
      });

      expect(setPendingHardwareSigningSpy).toHaveBeenCalledWith(false);
      expect(closeWindowSpy).toHaveBeenCalled();
      expect(showHardwareWalletErrorModalMock).not.toHaveBeenCalled();
    });

    it('redirects to activity on hardware wallet rejection in sidepanel', async () => {
      const hardwareError = new Error('User rejected');
      mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_SIDEPANEL);
      mockUseHardwareWalletConfig.mockReturnValue({
        isHardwareWalletAccount: true,
        deviceId: 'device-id',
        walletType: HardwareWalletType.Ledger,
      });
      mockUseHardwareWalletState.mockReturnValue({
        connectionState: { status: ConnectionStatus.Connected },
      });
      mockIsHardwareWalletError.mockReturnValue(true);
      mockIsUserRejectedHardwareWalletError.mockReturnValue(true);

      const resolveSpy = jest
        .spyOn(Actions, 'resolvePendingApproval')
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockImplementation(() => () => Promise.reject(hardwareError) as any);
      const setPendingHardwareSigningSpy = jest
        .spyOn(Actions, 'setPendingHardwareSigning')
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockReturnValue({} as any);
      const closeWindowSpy = jest
        .spyOn(Actions, 'closeCurrentNotificationWindow')
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockReturnValue((() => undefined) as any);

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
        expect(resolveSpy).toHaveBeenCalled();
      });

      expect(setPendingHardwareSigningSpy).toHaveBeenCalledWith(false);
      expect(closeWindowSpy).not.toHaveBeenCalled();
      expect(mockUseNavigate).toHaveBeenCalledWith(
        `${DEFAULT_ROUTE}?tab=activity`,
        { replace: true },
      );
      expect(showHardwareWalletErrorModalMock).not.toHaveBeenCalled();
    });

    it('shows error modal and navigates to recreated signature on retryable error', async () => {
      const hardwareError = {
        data: {
          metadata: {
            recreatedSignatureId: 'recreated-signature-id',
          },
        },
      };
      mockUseHardwareWalletConfig.mockReturnValue({
        isHardwareWalletAccount: true,
        deviceId: 'device-id',
        walletType: HardwareWalletType.Ledger,
      });
      mockUseHardwareWalletState.mockReturnValue({
        connectionState: { status: ConnectionStatus.Connected },
      });
      mockIsHardwareWalletError.mockReturnValue(true);
      mockIsRetryableHardwareWalletError.mockReturnValue(true);

      const resolveSpy = jest
        .spyOn(Actions, 'resolvePendingApproval')
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockImplementation(() => () => Promise.reject(hardwareError) as any);
      const setPendingHardwareSigningSpy = jest
        .spyOn(Actions, 'setPendingHardwareSigning')
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockReturnValue({} as any);

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
        expect(resolveSpy).toHaveBeenCalled();
      });

      expect(setPendingHardwareSigningSpy).toHaveBeenCalledWith(false);
      expect(showHardwareWalletErrorModalMock).toHaveBeenCalledWith(
        hardwareError,
      );
      expect(mockUseNavigate).toHaveBeenCalledWith(
        `${CONFIRM_TRANSACTION_ROUTE}/recreated-signature-id${SIGNATURE_REQUEST_PATH}`,
        {
          replace: true,
        },
      );
    });
  });

  describe('ConfirmButton', () => {
    const OWNER_ID_MOCK = '123';
    const KEY_ALERT_KEY_MOCK = 'Key';
    const ALERT_MESSAGE_MOCK = 'Alert 1';

    const alertsMock: Alert[] = [
      {
        key: KEY_ALERT_KEY_MOCK,
        field: KEY_ALERT_KEY_MOCK,
        severity: Severity.Danger,
        message: ALERT_MESSAGE_MOCK,
        reason: 'Reason 1',
        alertDetails: ['Detail 1', 'Detail 2'],
      },
    ];

    const createStateWithAlerts = (
      alerts: Alert[],
      confirmed: Record<string, boolean>,
    ) => {
      return getMockPersonalSignConfirmStateForRequest(
        {
          ...unapprovedPersonalSignMsg,
          id: OWNER_ID_MOCK,
          msgParams: {
            from: '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
          },
        } as SignatureRequestType,
        {
          confirmAlerts: {
            alerts: { [OWNER_ID_MOCK]: alerts },
            confirmed: { [OWNER_ID_MOCK]: confirmed },
          },
          metamask: {},
        },
      );
    };

    const stateWithAlertsMock = createStateWithAlerts(alertsMock, {
      [KEY_ALERT_KEY_MOCK]: false,
    });

    it('renders the "confirm" button when there are unconfirmed alerts', () => {
      const stateWithMultipleDangerAlerts = createStateWithAlerts(
        [
          alertsMock[0],
          {
            ...alertsMock[0],
            key: 'From',
          },
        ],
        { [KEY_ALERT_KEY_MOCK]: false },
      );
      const { getByText } = render(stateWithMultipleDangerAlerts);
      expect(getByText('Confirm')).toBeInTheDocument();
    });

    it('renders the "confirm" button when there are blocking alerts', () => {
      const stateWithMultipleDangerAlerts = createStateWithAlerts(
        [
          alertsMock[0],
          {
            ...alertsMock[0],
            key: 'From',
            isBlocking: true,
          },
        ],
        { [KEY_ALERT_KEY_MOCK]: false },
      );
      const { getByText } = render(stateWithMultipleDangerAlerts);
      expect(getByText('Confirm')).toBeInTheDocument();
    });

    it('renders the "confirm" button when there are unconfirmed alerts', () => {
      const { getByText } = render(stateWithAlertsMock);
      expect(getByText('Confirm')).toBeInTheDocument();
    });

    it('renders the "confirm" button when there are confirmed danger alerts', () => {
      const stateWithConfirmedDangerAlertMock = createStateWithAlerts(
        alertsMock,
        {
          [KEY_ALERT_KEY_MOCK]: true,
        },
      );
      const { getByText } = render(stateWithConfirmedDangerAlertMock);
      expect(getByText('Confirm')).toBeInTheDocument();
    });

    it('renders the "confirm" button when there are blocking dangerous banner alerts', () => {
      const stateWithBannerDangerAlertMock = createStateWithAlerts(
        [
          {
            ...alertsMock[0],
            isBlocking: true,
            field: undefined,
          },
        ],
        {
          [KEY_ALERT_KEY_MOCK]: false,
        },
      );
      const { getByText } = render(stateWithBannerDangerAlertMock);
      expect(getByText('Confirm')).toBeInTheDocument();
      expect(getByText('Confirm')).not.toBeDisabled();
    });

    it('renders the "confirm" button when there are no alerts', () => {
      const { getByText } = render();
      expect(getByText('Confirm')).toBeInTheDocument();
    });

    it('does not show the alert modal when confirm is clicked', () => {
      const { getByTestId, queryByTestId } = render(stateWithAlertsMock);
      fireEvent.click(getByTestId('confirm-footer-button'));
      expect(queryByTestId('alert-modal-button')).toBeNull();
    });

    describe('navigates to the next confirmation', () => {
      it('on Cancel button click', async () => {
        const navigateNextMock = jest.fn();
        useConfirmationNavigationMock.mockReturnValue({
          navigateNext: navigateNextMock,
          navigateToId: jest.fn(),
          count: 2,
        } as unknown as ReturnType<typeof useConfirmationNavigation>);

        const mockStateWithContractInteractionConfirmation =
          getMockContractInteractionConfirmState();

        const contractInteractionConfirmation =
          mockStateWithContractInteractionConfirmation.metamask.transactions[0];

        mockStateWithContractInteractionConfirmation.metamask.pendingApprovals =
          {
            ...mockStateWithContractInteractionConfirmation.metamask
              .pendingApprovals,
            [addEthereumChainApproval.id]: addEthereumChainApproval,
          };
        mockStateWithContractInteractionConfirmation.metamask.pendingApprovalCount = 2;

        jest.spyOn(confirmContext, 'useConfirmContext').mockReturnValue({
          currentConfirmation: contractInteractionConfirmation,
          isScrollToBottomCompleted: true,
          setIsScrollToBottomCompleted: () => undefined,
        } as unknown as ReturnType<typeof confirmContext.useConfirmContext>);
        const { getByText } = render(
          mockStateWithContractInteractionConfirmation,
        );

        fireEvent.click(getByText('Cancel'));

        await waitFor(() => {
          expect(navigateNextMock).toHaveBeenCalledTimes(1);
        });

        expect(navigateNextMock).toHaveBeenCalledWith(
          contractInteractionConfirmation.id,
        );
      });

      it('on Confirm button click uses transaction confirm', async () => {
        const mockStateWithContractInteractionConfirmation =
          getMockContractInteractionConfirmState();

        const contractInteractionConfirmation =
          mockStateWithContractInteractionConfirmation.metamask.transactions[0];

        mockStateWithContractInteractionConfirmation.metamask.pendingApprovals =
          {
            ...mockStateWithContractInteractionConfirmation.metamask
              .pendingApprovals,
            [addEthereumChainApproval.id]: addEthereumChainApproval,
          };
        mockStateWithContractInteractionConfirmation.metamask.pendingApprovalCount = 2;

        jest.spyOn(confirmContext, 'useConfirmContext').mockReturnValue({
          currentConfirmation: contractInteractionConfirmation,
          isScrollToBottomCompleted: true,
          setIsScrollToBottomCompleted: () => undefined,
        } as unknown as ReturnType<typeof confirmContext.useConfirmContext>);
        const { getByText } = render(
          mockStateWithContractInteractionConfirmation,
        );

        fireEvent.click(getByText('Confirm'));

        await waitFor(() => {
          expect(mockOnTransactionConfirm).toHaveBeenCalledTimes(1);
        });
      });
    });
  });
});
