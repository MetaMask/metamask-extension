import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { Severity } from '../../../../../helpers/constants/design-system';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import { AlertModal } from './alert-modal';

describe('AlertModal', () => {
  const OWNER_ID_MOCK = '123';
  const FROM_ALERT_KEY_MOCK = 'from';
  const ALERT_MESSAGE_MOCK = 'Alert 1';
  const onAcknowledgeClickMock = jest.fn();
  const onCloseMock = jest.fn();
  const alertsMock = [
    {
      key: FROM_ALERT_KEY_MOCK,
      severity: Severity.Warning,
      message: ALERT_MESSAGE_MOCK,
      reason: 'Reason 1',
      alertDetails: ['Detail 1', 'Detail 2'],
    },
    { key: 'data', severity: Severity.Danger, message: 'Alert 2' },
  ];

  const STATE_MOCK = {
    confirmAlerts: {
      alerts: { [OWNER_ID_MOCK]: alertsMock },
      confirmed: {
        [OWNER_ID_MOCK]: { [FROM_ALERT_KEY_MOCK]: false, data: false },
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

  it('disables button when alert is not acknowledged', () => {
    const { getByTestId } = renderWithProvider(
      <AlertModal
        ownerId={OWNER_ID_MOCK}
        onAcknowledgeClick={onAcknowledgeClickMock}
        onClose={onCloseMock}
        alertKey={'data'}
      />,
      mockStore,
    );

    expect(getByTestId('alert-modal-button')).toBeDisabled();
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
});
