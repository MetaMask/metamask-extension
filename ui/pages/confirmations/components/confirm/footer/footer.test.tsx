import React from 'react';
import mockState from '../../../../../../test/data/mock-state.json';
import { fireEvent, renderWithProvider } from '../../../../../../test/jest';
import * as Actions from '../../../../../store/actions';
import configureStore from '../../../../../store/store';
import {
  LedgerTransportTypes,
  WebHIDConnectedStatuses,
} from '../../../../../../shared/constants/hardware-wallets';
import * as MMIConfirmations from '../../../../../hooks/useMMIConfirmations';

import { Severity } from '../../../../../helpers/constants/design-system';
import Footer from './footer';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => jest.fn(),
}));

const render = (args = {}) => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
    },
    confirm: {
      currentConfirmation: {
        msgParams: {
          from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        },
      },
      isScrollToBottomNeeded: false,
    },
    ...args,
  });

  return renderWithProvider(<Footer />, store);
};

describe('ConfirmFooter', () => {
  it('should match snapshot', () => {
    const { container } = render();
    expect(container).toMatchSnapshot();
  });

  it('renders the "Cancel" and "Confirm" Buttons', () => {
    const { getAllByRole, getByText } = render();
    const buttons = getAllByRole('button');
    expect(buttons).toHaveLength(2);
    expect(getByText('Confirm')).toBeInTheDocument();
    expect(getByText('Cancel')).toBeInTheDocument();
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

  it('disables submit button if required LedgerHidConnection is not yet established', () => {
    const { getAllByRole } = render({
      metamask: {
        ...mockState.metamask,
        ledgerTransportType: LedgerTransportTypes.webhid,
      },
      confirm: {
        currentConfirmation: {
          msgParams: {
            from: '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
          },
        },
      },
      appState: {
        ...mockState.appState,
        ledgerWebHidConnectedStatus: WebHIDConnectedStatuses.notConnected,
      },
    });
    const submitButton = getAllByRole('button')[1];
    expect(submitButton).toBeDisabled();
  });

  it('submit button should be disabled if useMMIConfirmations returns true for mmiSubmitDisabled', () => {
    jest
      .spyOn(MMIConfirmations, 'useMMIConfirmations')
      .mockImplementation(() => ({
        mmiOnSignCallback: () => Promise.resolve(),
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
        mmiSubmitDisabled: false,
      }));
    const { getAllByRole } = render();
    const submitButton = getAllByRole('button')[1];
    fireEvent.click(submitButton);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  describe('AlertReviewButton', () => {
    const OWNER_ID_MOCK = '123';
    const KEY_ALERT_KEY_MOCK = 'Key';
    const ALERT_MESSAGE_MOCK = 'Alert 1';
    const alertsMock = [
      {
        key: KEY_ALERT_KEY_MOCK,
        field: KEY_ALERT_KEY_MOCK,
        severity: Severity.Warning,
        message: ALERT_MESSAGE_MOCK,
        reason: 'Reason 1',
        alertDetails: ['Detail 1', 'Detail 2'],
      },
    ];
    const stateWithAlertsMock = {
      ...mockState,
      confirmAlerts: {
        alerts: { [OWNER_ID_MOCK]: alertsMock },
        confirmed: {
          [OWNER_ID_MOCK]: { [KEY_ALERT_KEY_MOCK]: false },
        },
      },
      confirm: {
        currentConfirmation: {
          id: OWNER_ID_MOCK,
          msgParams: {
            from: '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
          },
        },
      },
    };
    it('renders the ReviewAlertButton when there are unconfirmed alerts', () => {
      const { getByTestId } = render(stateWithAlertsMock);
      expect(getByTestId('review-alert-button')).toBeDefined();
    });

    it('does not render the ReviewAlertButton when there are no unconfirmed alerts', () => {
      const { queryByTestId } = render();
      expect(queryByTestId('review-alert-button')).toBeNull();
    });

    it('sets the alert modal visible when the ReviewAlertButton is clicked', () => {
      const { getByTestId } = render(stateWithAlertsMock);
      fireEvent.click(getByTestId('review-alert-button'));
      expect(getByTestId('alert-modal-button')).toBeDefined();
    });
  });
});
