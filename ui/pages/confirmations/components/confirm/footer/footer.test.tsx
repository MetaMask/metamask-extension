import React from 'react';
import {
  LedgerTransportTypes,
  WebHIDConnectedStatuses,
} from '../../../../../../shared/constants/hardware-wallets';
import { BlockaidResultType } from '../../../../../../shared/constants/security-provider';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import {
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
import mockState from '../../../../../../test/data/mock-state.json';
import { fireEvent } from '../../../../../../test/jest';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import * as Actions from '../../../../../store/actions';
import configureStore from '../../../../../store/store';
import * as confirmContext from '../../../context/confirm';
import { SignatureRequestType } from '../../../types/confirm';
import { useOriginThrottling } from '../../../hooks/useOriginThrottling';
import { useIsGaslessSupported } from '../../../hooks/gas/useIsGaslessSupported';
import { useInsufficientBalanceAlerts } from '../../../hooks/alerts/transactions/useInsufficientBalanceAlerts';
import { useIsGaslessLoading } from '../../../hooks/gas/useIsGaslessLoading';
import Footer from './footer';

jest.mock('../../../hooks/gas/useIsGaslessLoading');
jest.mock('../../../hooks/alerts/transactions/useInsufficientBalanceAlerts');
jest.mock('../../../hooks/gas/useIsGaslessSupported');
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => jest.fn(),
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

const render = (args?: Record<string, unknown>) => {
  const store = configureStore(args ?? getMockPersonalSignConfirmState());

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

  beforeEach(() => {
    mockUseOriginThrottling.mockReturnValue({
      shouldThrottleOrigin: false,
    });

    useIsGaslessLoadingMock.mockReturnValue({
      isGaslessLoading: false,
    });
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
      });
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
      expect(confirmButton).not.toBeDisabled();
    });
  });

  describe('renders disabled "Confirm" Button', () => {
    it('when isScrollToBottomCompleted is false', () => {
      jest.spyOn(confirmContext, 'useConfirmContext').mockReturnValue({
        currentConfirmation: genUnapprovedContractInteractionConfirmation(),
        isScrollToBottomCompleted: false,
        setIsScrollToBottomCompleted: () => undefined,
      });
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

  it('invoke required actions when cancel button is clicked', () => {
    const { getAllByRole } = render();
    const cancelButton = getAllByRole('button')[0];
    const rejectSpy = jest
      .spyOn(Actions, 'rejectPendingApproval')
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockImplementation(() => ({}) as any);
    const updateCustomNonceSpy = jest
      .spyOn(Actions, 'updateCustomNonce')
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockImplementation(() => ({}) as any);
    const setNextNonceSpy = jest
      .spyOn(Actions, 'setNextNonce')
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockImplementation(() => ({}) as any);
    fireEvent.click(cancelButton);
    expect(rejectSpy).toHaveBeenCalled();
    expect(updateCustomNonceSpy).toHaveBeenCalledWith('');
    expect(setNextNonceSpy).toHaveBeenCalledWith('');
  });

  it('invoke required actions when submit button is clicked', () => {
    const { getAllByRole } = render();
    const submitButton = getAllByRole('button')[1];
    const resolveSpy = jest
      .spyOn(Actions, 'resolvePendingApproval')
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockImplementation(() => ({}) as any);
    const updateCustomNonceSpy = jest
      .spyOn(Actions, 'updateCustomNonce')
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockImplementation(() => ({}) as any);
    const setNextNonceSpy = jest
      .spyOn(Actions, 'setNextNonce')
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockImplementation(() => ({}) as any);
    fireEvent.click(submitButton);
    expect(resolveSpy).toHaveBeenCalled();
    expect(updateCustomNonceSpy).toHaveBeenCalledWith('');
    expect(setNextNonceSpy).toHaveBeenCalledWith('');
  });

  it('displays a danger "Confirm" button there are danger alerts', async () => {
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
    expect(submitButton).toHaveClass('mm-button-primary--type-danger');
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

  it('disables submit button if required LedgerHidConnection is not yet established', () => {
    const { getAllByRole } = render(
      getMockPersonalSignConfirmStateForRequest(
        {
          ...unapprovedPersonalSignMsg,
          msgParams: {
            from: '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
          },
        } as SignatureRequestType,
        {
          metamask: {
            ...mockState.metamask,
            ledgerTransportType: LedgerTransportTypes.webhid,
          },
          appState: {
            ...mockState.appState,
            ledgerWebHidConnectedStatus: WebHIDConnectedStatuses.notConnected,
          },
        },
      ),
    );
    const submitButton = getAllByRole('button')[1];
    expect(submitButton).toBeDisabled();
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

    it('renders the "review alerts" button when there are unconfirmed alerts', () => {
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
      expect(getByText('Review alerts')).toBeInTheDocument();
    });

    it('renders the "review alerts" button disabled when there are blocking alerts', () => {
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
      expect(getByText('Review alerts')).toBeInTheDocument();
      expect(getByText('Review alerts')).toBeDisabled();
    });

    it('renders the "review alert" button when there are unconfirmed alerts', () => {
      const { getByText } = render(stateWithAlertsMock);
      expect(getByText('Review alert')).toBeInTheDocument();
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

    it('renders the "confirm" button disabled when there are blocking dangerous banner alerts', () => {
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
      expect(getByText('Confirm')).toBeDisabled();
    });

    it('renders the "confirm" button when there are no alerts', () => {
      const { getByText } = render();
      expect(getByText('Confirm')).toBeInTheDocument();
    });

    it('sets the alert modal visible when the review alerts button is clicked', () => {
      const { getByTestId } = render(stateWithAlertsMock);
      fireEvent.click(getByTestId('confirm-footer-button'));
      expect(getByTestId('alert-modal-button')).toBeDefined();
    });
  });
});
