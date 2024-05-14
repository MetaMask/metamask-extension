import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';
import { Text } from '../../../../../component-library';
import { renderWithProvider } from '../../../../../../../test/lib/render-helpers';
import { Severity } from '../../../../../../helpers/constants/design-system';
import { AlertRow, AlertRowProps } from './alert-row';

describe('AlertRow', () => {
  const OWNER_ID_MOCK = '123';
  const OWNER_ID_NO_ALERT_MOCK = '000';
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
  const renderAlertRow = (
    props?: Partial<AlertRowProps>,
    state?: Record<string, unknown>,
  ) => {
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
      ...state,
    };

    const mockStore = configureMockStore([])(STATE_MOCK);
    return renderWithProvider(
      <AlertRow
        label={KEY_ALERT_KEY_MOCK}
        children={<Text>value</Text>}
        ownerId={OWNER_ID_NO_ALERT_MOCK}
        alertKey={KEY_ALERT_KEY_MOCK}
        {...props}
      />,
      mockStore,
    );
  };

  it('matches snapshot with no alert', () => {
    const { container } = renderAlertRow();
    expect(container).toMatchSnapshot();
  });

  describe('Alerts', () => {
    it('renders row with alert', () => {
      const { getByTestId } = renderAlertRow({
        alertKey: KEY_ALERT_KEY_MOCK,
        ownerId: OWNER_ID_MOCK,
      });
      expect(getByTestId('inline-alert')).toBeDefined();
    });

    it('does not render when alert properties are not provided', () => {
      const { queryByTestId } = renderAlertRow();
      expect(queryByTestId('inline-alert')).toBeNull();
    });

    describe('Alert modal visibility:', () => {
      it('show when clicked in the inline alert', () => {
        const { getByTestId } = renderAlertRow({
          alertKey: KEY_ALERT_KEY_MOCK,
          ownerId: OWNER_ID_MOCK,
        });
        fireEvent.click(getByTestId('inline-alert'));
        expect(getByTestId('alert-modal-button')).toBeDefined();
      });

      it('hide when clicked in the `Got it` button', () => {
        const { getByTestId, queryByTestId } = renderAlertRow(
          {
            alertKey: KEY_ALERT_KEY_MOCK,
            ownerId: OWNER_ID_MOCK,
          },
          {
            confirmAlerts: {
              alerts: { [OWNER_ID_MOCK]: alertsMock },
              confirmed: {
                [OWNER_ID_MOCK]: { [KEY_ALERT_KEY_MOCK]: true },
              },
            },
          },
        );
        fireEvent.click(getByTestId('inline-alert'));
        fireEvent.click(getByTestId('alert-modal-button'));
        expect(queryByTestId('alert-modal-button')).toBeNull();
      });
    });
  });
});
