import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { Severity } from '../../../../../helpers/constants/design-system';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import * as useAlertsModule from '../../../../../hooks/useAlerts';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { AlertModal } from './alert-modal';

describe('AlertModal', () => {
  const OWNER_ID_MOCK = '123';
  const FROM_ALERT_KEY_MOCK = 'from';
  const CONTRACT_ALERT_KEY_MOCK = 'contract';
  const ALERT_MESSAGE_MOCK = 'Alert 1';
  const ACTION_KEY_MOCK = 'key-mock';
  const ACTION_LABEL_MOCK = 'Label Mock';
  const onAcknowledgeClickMock = jest.fn();
  const onActionClick = jest.fn();
  const onCloseMock = jest.fn();

  const alertsMock: Alert[] = [
    {
      key: FROM_ALERT_KEY_MOCK,
      severity: Severity.Warning,
      message: ALERT_MESSAGE_MOCK,
      reason: 'Reason 1',
      alertDetails: ['Detail 1', 'Detail 2'],
    },
    { key: 'data', severity: Severity.Danger, message: 'Alert 2' },
    {
      key: CONTRACT_ALERT_KEY_MOCK,
      severity: Severity.Info,
      message: 'Alert 3',
      actions: [{ key: ACTION_KEY_MOCK, label: ACTION_LABEL_MOCK }],
    },
  ];

  const STATE_MOCK = {
    confirmAlerts: {
      alerts: { [OWNER_ID_MOCK]: alertsMock },
      confirmed: {
        [OWNER_ID_MOCK]: {
          [FROM_ALERT_KEY_MOCK]: false,
          data: false,
          [CONTRACT_ALERT_KEY_MOCK]: false,
        },
      },
    },
  };
  const mockStore = configureMockStore([])(STATE_MOCK);

  it('renders the alert modal', () => {
    const { getByText } = renderWithProvider(
      <AlertModal
        ownerId={OWNER_ID_MOCK}
        onAcknowledgeClick={onAcknowledgeClickMock}
        onClose={onCloseMock}
        alertKey={FROM_ALERT_KEY_MOCK}
      />,
      mockStore,
    );

    expect(getByText(ALERT_MESSAGE_MOCK)).toBeInTheDocument();
  });

  it('calls onAcknowledgeClick when the button is clicked', () => {
    const mockStoreAcknowledgeAlerts = configureMockStore([])({
      ...STATE_MOCK,
      confirmAlerts: {
        alerts: { [OWNER_ID_MOCK]: alertsMock },
        confirmed: { [OWNER_ID_MOCK]: { from: true, data: true } },
      },
    });
    const { getByTestId } = renderWithProvider(
      <AlertModal
        ownerId={OWNER_ID_MOCK}
        onAcknowledgeClick={onAcknowledgeClickMock}
        onClose={onCloseMock}
        alertKey={FROM_ALERT_KEY_MOCK}
      />,
      mockStoreAcknowledgeAlerts,
    );

    fireEvent.click(getByTestId('alert-modal-button'));
    expect(onAcknowledgeClickMock).toHaveBeenCalledTimes(1);
  });

  it('sets the alert as confirmed when checkbox is called', () => {
    const setAlertConfirmedMock = jest.fn();
    const useAlertsSpy = jest.spyOn(useAlertsModule, 'default');
    const newMockStore = configureMockStore([])({
      ...STATE_MOCK,
      confirmAlerts: {
        alerts: { [OWNER_ID_MOCK]: [alertsMock[0]] },
        confirmed: {
          [OWNER_ID_MOCK]: {
            [FROM_ALERT_KEY_MOCK]: false,
          },
        },
      },
    });

    useAlertsSpy.mockReturnValue({
      setAlertConfirmed: setAlertConfirmedMock,
      alerts: [alertsMock[0]],
      generalAlerts: [],
      getFieldAlerts: () => [],
      isAlertConfirmed: () => false,
    });
    const { getByTestId } = renderWithProvider(
      <AlertModal
        ownerId={OWNER_ID_MOCK}
        onAcknowledgeClick={onAcknowledgeClickMock}
        onClose={onCloseMock}
        alertKey={FROM_ALERT_KEY_MOCK}
      />,
      newMockStore,
    );

    fireEvent.click(getByTestId('alert-modal-acknowledge-checkbox'));
    expect(setAlertConfirmedMock).toHaveBeenCalled();
    expect(setAlertConfirmedMock).toHaveBeenCalledWith(
      FROM_ALERT_KEY_MOCK,
      true,
    );
    useAlertsSpy.mockRestore();
  });

  it('calls onClose when the button is clicked', () => {
    const { getByLabelText } = renderWithProvider(
      <AlertModal
        ownerId={OWNER_ID_MOCK}
        onAcknowledgeClick={onAcknowledgeClickMock}
        onClose={onCloseMock}
        alertKey={FROM_ALERT_KEY_MOCK}
      />,
      mockStore,
    );

    fireEvent.click(getByLabelText('Close'));
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('calls action when the button is clicked', () => {
    const { getByText } = renderWithProvider(
      <AlertModal
        ownerId={OWNER_ID_MOCK}
        onAcknowledgeClick={onAcknowledgeClickMock}
        onActionClick={onActionClick}
        onClose={onCloseMock}
        alertKey={CONTRACT_ALERT_KEY_MOCK}
      />,
      mockStore,
    );

    fireEvent.click(getByText(ACTION_LABEL_MOCK));
    expect(onActionClick).toHaveBeenCalledTimes(1);
  });
});
