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
import * as MMIConfirmations from '../../../../../hooks/useMMIConfirmations';
import * as Actions from '../../../../../store/actions';
import configureStore from '../../../../../store/store';
import * as confirmContext from '../../../context/confirm';
import { SignatureRequestType } from '../../../types/confirm';
import Footer from './footer';

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

const render = (args?: Record<string, unknown>) => {
  const store = configureStore(args ?? getMockPersonalSignConfirmState());

  return renderWithConfirmContextProvider(<Footer />, store);
};

describe('ConfirmFooter', () => {
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
  });

  it('invoke required actions when cancel button is clicked', () => {
    const { getAllByRole } = render();
    const cancelButton = getAllByRole('button')[0];
    const rejectSpy = jest
      .spyOn(Actions, 'rejectPendingApproval')
      // TODO: Replace `any` with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockImplementation(() => ({} as any));
    const updateCustomNonceSpy = jest
      .spyOn(Actions, 'updateCustomNonce')
      // TODO: Replace `any` with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockImplementation(() => ({} as any));
    const setNextNonceSpy = jest
      .spyOn(Actions, 'setNextNonce')
      // TODO: Replace `any` with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockImplementation(() => ({} as any));
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
      // TODO: Replace `any` with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockImplementation(() => ({} as any));
    const updateCustomNonceSpy = jest
      .spyOn(Actions, 'updateCustomNonce')
      // TODO: Replace `any` with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockImplementation(() => ({} as any));
    const setNextNonceSpy = jest
      .spyOn(Actions, 'setNextNonce')
      // TODO: Replace `any` with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockImplementation(() => ({} as any));
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

  it('submit button should be disabled if useMMIConfirmations returns true for mmiSubmitDisabled', () => {
    jest
      .spyOn(MMIConfirmations, 'useMMIConfirmations')
      .mockImplementation(() => ({
        mmiOnSignCallback: () => Promise.resolve(),
        mmiOnTransactionCallback: () => Promise.resolve(),
        mmiSubmitDisabled: true,
      }));
    const { getAllByRole } = render();
    const submitButton = getAllByRole('button')[1];
    expect(submitButton).toBeDisabled();
  });

  it('invoke mmiOnSignCallback returned from hook useMMIConfirmations when submit button is clicked', () => {
    const mockFn = jest.fn();
    jest
      .spyOn(MMIConfirmations, 'useMMIConfirmations')
      .mockImplementation(() => ({
        mmiOnSignCallback: mockFn,
        mmiOnTransactionCallback: mockFn,
        mmiSubmitDisabled: false,
      }));
    const { getAllByRole } = render();
    const submitButton = getAllByRole('button')[1];
    fireEvent.click(submitButton);
    expect(mockFn).toHaveBeenCalledTimes(1);
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
