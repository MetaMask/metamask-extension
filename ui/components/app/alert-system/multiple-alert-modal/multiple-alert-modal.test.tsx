import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';
import { Severity } from '../../../../helpers/constants/design-system';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import mockState from '../../../../../test/data/mock-state.json';
import {
  MultipleAlertModal,
  MultipleAlertModalProps,
} from './multiple-alert-modal';

jest.mock('../contexts/alertMetricsContext', () => ({
  useAlertMetrics: jest.fn(() => ({
    trackInlineAlertClicked: jest.fn(),
    trackAlertRender: jest.fn(),
    trackAlertActionClicked: jest.fn(),
  })),
}));

describe('MultipleAlertModal', () => {
  const OWNER_ID_MOCK = '123';
  const FROM_ALERT_KEY_MOCK = 'from';
  const CONTRACT_ALERT_KEY_MOCK = 'contract';
  const DATA_ALERT_KEY_MOCK = 'data';
  const onAcknowledgeClickMock = jest.fn();
  const onCloseMock = jest.fn();

  const alertsMock = [
    {
      key: FROM_ALERT_KEY_MOCK,
      field: FROM_ALERT_KEY_MOCK,
      severity: Severity.Warning,
      message: 'Alert 1',
      reason: 'Reason 1',
      alertDetails: ['Detail 1', 'Detail 2'],
    },
    {
      key: DATA_ALERT_KEY_MOCK,
      field: DATA_ALERT_KEY_MOCK,
      severity: Severity.Danger,
      message: 'Alert 2',
    },
    {
      key: CONTRACT_ALERT_KEY_MOCK,
      field: CONTRACT_ALERT_KEY_MOCK,
      severity: Severity.Info,
      message: 'Alert 3',
    },
  ];

  const STATE_MOCK = {
    ...mockState,
    confirmAlerts: {
      alerts: { [OWNER_ID_MOCK]: alertsMock },
      confirmed: {
        [OWNER_ID_MOCK]: {
          [FROM_ALERT_KEY_MOCK]: false,
          [DATA_ALERT_KEY_MOCK]: false,
          [CONTRACT_ALERT_KEY_MOCK]: false,
        },
      },
    },
  };
  const mockStore = configureMockStore([])(STATE_MOCK);

  const defaultProps: MultipleAlertModalProps = {
    ownerId: OWNER_ID_MOCK,
    onFinalAcknowledgeClick: onAcknowledgeClickMock,
    alertKey: FROM_ALERT_KEY_MOCK,
    onClose: onCloseMock,
  };

  it('renders the multiple alert modal', () => {
    const { getByTestId } = renderWithProvider(
      <MultipleAlertModal {...defaultProps} />,
      mockStore,
    );

    expect(getByTestId('alert-modal-next-button')).toBeDefined();
  });

  it('invokes the onFinalAcknowledgeClick when the button is clicked', () => {
    const mockStoreAcknowledgeAlerts = configureMockStore([])({
      ...STATE_MOCK,
      confirmAlerts: {
        alerts: { [OWNER_ID_MOCK]: alertsMock },
        confirmed: {
          [OWNER_ID_MOCK]: {
            [FROM_ALERT_KEY_MOCK]: true,
            [DATA_ALERT_KEY_MOCK]: true,
            [CONTRACT_ALERT_KEY_MOCK]: true,
          },
        },
      },
    });
    const { getByTestId } = renderWithProvider(
      <MultipleAlertModal
        {...defaultProps}
        alertKey={CONTRACT_ALERT_KEY_MOCK}
      />,
      mockStoreAcknowledgeAlerts,
    );

    fireEvent.click(getByTestId('alert-modal-button'));

    expect(onAcknowledgeClickMock).toHaveBeenCalledTimes(1);
  });

  it('render the next alert when the "Got it" button is clicked', () => {
    const mockStoreAcknowledgeAlerts = configureMockStore([])({
      ...STATE_MOCK,
      confirmAlerts: {
        alerts: { [OWNER_ID_MOCK]: alertsMock },
        confirmed: {
          [OWNER_ID_MOCK]: {
            [FROM_ALERT_KEY_MOCK]: true,
            [DATA_ALERT_KEY_MOCK]: true,
            [CONTRACT_ALERT_KEY_MOCK]: false,
          },
        },
      },
    });
    const { getByTestId, getByText } = renderWithProvider(
      <MultipleAlertModal {...defaultProps} alertKey={DATA_ALERT_KEY_MOCK} />,
      mockStoreAcknowledgeAlerts,
    );

    fireEvent.click(getByTestId('alert-modal-button'));

    expect(getByText(alertsMock[2].message)).toBeInTheDocument();
  });

  describe('Navigation', () => {
    it('calls next alert when the next button is clicked', () => {
      const { getByTestId, getByText } = renderWithProvider(
        <MultipleAlertModal {...defaultProps} />,
        mockStore,
      );

      fireEvent.click(getByTestId('alert-modal-next-button'));

      expect(getByText(alertsMock[1].message)).toBeInTheDocument();
    });

    it('calls previous alert when the previous button is clicked', () => {
      const selectSecondAlertMock = { ...defaultProps, alertKey: 'data' };
      const { getByTestId, getByText } = renderWithProvider(
        <MultipleAlertModal {...selectSecondAlertMock} />,
        mockStore,
      );

      fireEvent.click(getByTestId('alert-modal-back-button'));

      expect(getByText(alertsMock[0].message)).toBeInTheDocument();
    });
  });
});
