import React from 'react';
import configureMockStore from 'redux-mock-store';
import { Text } from '../../../../component-library';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import { Severity } from '../../../../../helpers/constants/design-system';
import { ConfirmInfoRow } from './row';

describe('ConfirmInfoRow', () => {
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

  const STATE_MOCK = {
    confirmAlerts: {
      alerts: { [OWNER_ID_MOCK]: alertsMock },
      confirmed: {
        [OWNER_ID_MOCK]: { [KEY_ALERT_KEY_MOCK]: false },
      },
    },
    confirm: {
      currentConfirmation: {
        id: OWNER_ID_MOCK,
        status: 'unapproved',
        time: new Date().getTime(),
        type: 'json_request',
      },
    },
  };
  const mockStore = configureMockStore([])(STATE_MOCK);

  it('should match snapshot', () => {
    const { container } = renderWithProvider(
      <ConfirmInfoRow
        label={KEY_ALERT_KEY_MOCK}
        children={<Text>value</Text>}
      />,
      mockStore,
    );
    expect(container).toMatchSnapshot();
  });

  it('renders row with alert', () => {
    const { getAllByTestId } = renderWithProvider(
      <ConfirmInfoRow
        label={KEY_ALERT_KEY_MOCK}
        children={<Text>value</Text>}
        alertKey={KEY_ALERT_KEY_MOCK}
      />,
      mockStore,
    );
    expect(getAllByTestId('inline-alert')).toBeDefined();
  });
});
