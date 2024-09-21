import React from 'react';

import {
  LedgerTransportTypes,
  WebHIDConnectedStatuses,
} from '../../../../../../shared/constants/hardware-wallets';
import { BlockaidResultType } from '../../../../../../shared/constants/security-provider';
import {
  signatureRequestSIWE,
  unapprovedPersonalSignMsg,
} from '../../../../../../test/data/confirmations/personal_sign';
import { permitSignatureMsg } from '../../../../../../test/data/confirmations/typed_sign';
import {
  getMockContractInteractionConfirmState,
  getMockPersonalSignConfirmState,
  getMockPersonalSignConfirmStateForRequest,
  getMockTypedSignConfirmState,
  getMockTypedSignConfirmStateForRequest,
} from '../../../../../../test/data/confirmations/helper';
import mockState from '../../../../../../test/data/mock-state.json';
import { fireEvent } from '../../../../../../test/jest';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import * as MMIConfirmations from '../../../../../hooks/useMMIConfirmations';
import * as Actions from '../../../../../store/actions';
import configureStore from '../../../../../store/store';
import { Severity } from '../../../../../helpers/constants/design-system';
import { SignatureRequestType } from '../../../types/confirm';
import * as confirmContext from '../../../context/confirm';

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
        currentConfirmation: unapprovedPersonalSignMsg,
        isScrollToBottomCompleted: false,
        setIsScrollToBottomCompleted: () => undefined,
      });
      const mockStateTypedSign = getMockPersonalSignConfirmStateForRequest(
        unapprovedPersonalSignMsg,
      );
      const { getByText } = render(mockStateTypedSign);

      const confirmButton = getByText('Confirm');
      expect(confirmButton).toBeDisabled();
    });

    it('when the confirmation is a Permit with the transaction simulation setting disabled', () => {
      jest.spyOn(confirmContext, 'useConfirmContext').mockReturnValue({
        currentConfirmation: permitSignatureMsg,
        isScrollToBottomCompleted: false,
        setIsScrollToBottomCompleted: () => undefined,
      });
      const mockStatePermit =
        getMockTypedSignConfirmStateForRequest(permitSignatureMsg);
      const { getByText } = render(mockStatePermit);

      const confirmButton = getByText('Confirm');
      expect(confirmButton).toBeDisabled();
    });
  });

  it('invoke action rejectPendingApproval when cancel button is clicked', () => {
    const { getAllByRole } = render();
    const cancelButton = getAllByRole('button')[0];
    const rejectSpy = jest
      .spyOn(Actions, 'rejectPendingApproval')
      // TODO: Replace `any` with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockImplementation(() => ({} as any));
    fireEvent.click(cancelButton);
    expect(rejectSpy).toHaveBeenCalled();
  });

  it('invoke action resolvePendingApproval when submit button is clicked', () => {
    const { getAllByRole } = render();
    const submitButton = getAllByRole('button')[1];
    const resolveSpy = jest
      .spyOn(Actions, 'resolvePendingApproval')
      // TODO: Replace `any` with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockImplementation(() => ({} as any));
    fireEvent.click(submitButton);
    expect(resolveSpy).toHaveBeenCalled();
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
    const alertsMock = [
      {
        key: KEY_ALERT_KEY_MOCK,
        field: KEY_ALERT_KEY_MOCK,
        severity: Severity.Danger,
        message: ALERT_MESSAGE_MOCK,
        reason: 'Reason 1',
        alertDetails: ['Detail 1', 'Detail 2'],
      },
    ];
    const stateWithAlertsMock = getMockPersonalSignConfirmStateForRequest(
      {
        ...unapprovedPersonalSignMsg,
        id: OWNER_ID_MOCK,
        msgParams: {
          from: '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
        },
      } as SignatureRequestType,
      {
        confirmAlerts: {
          alerts: { [OWNER_ID_MOCK]: alertsMock },
          confirmed: {
            [OWNER_ID_MOCK]: { [KEY_ALERT_KEY_MOCK]: false },
          },
        },
        metamask: {},
      },
    );
    it('renders the review alerts button when there are unconfirmed alerts', () => {
      const { getByText } = render(stateWithAlertsMock);
      expect(getByText('Confirm')).toBeInTheDocument();
    });

    it('renders the confirm button when there are no unconfirmed alerts', () => {
      const { getByText } = render();
      expect(getByText('Confirm')).toBeInTheDocument();
    });

    it('sets the alert modal visible when the review alerts button is clicked', () => {
      const { getByTestId } = render(stateWithAlertsMock);
      fireEvent.click(getByTestId('confirm-footer-button'));
      expect(getByTestId('confirm-alert-modal-submit-button')).toBeDefined();
    });
  });
});
