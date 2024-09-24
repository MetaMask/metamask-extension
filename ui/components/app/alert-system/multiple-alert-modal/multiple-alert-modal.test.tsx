import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';
import { Severity } from '../../../../helpers/constants/design-system';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import mockState from '../../../../../test/data/mock-state.json';
import * as useAlertsModule from '../../../../hooks/useAlerts';
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

  it('defaults to the first alert if the selected alert is not found', async () => {
    const setAlertConfirmedMock = jest.fn();
    const useAlertsSpy = jest.spyOn(useAlertsModule, 'default');
    const dangerAlertMock = alertsMock.find(
      (alert) => alert.key === DATA_ALERT_KEY_MOCK,
    );
    (useAlertsSpy as jest.Mock).mockReturnValue({
      setAlertConfirmed: setAlertConfirmedMock,
      alerts: alertsMock,
      generalAlerts: [],
      fieldAlerts: alertsMock,
      getFieldAlerts: () => alertsMock,
      isAlertConfirmed: () => false,
    });

    const { getByText, queryByText, rerender } = renderWithProvider(
      <MultipleAlertModal
        {...defaultProps}
        alertKey={CONTRACT_ALERT_KEY_MOCK}
      />,
      mockStore,
    );

    // shows the contract alert
    expect(getByText(alertsMock[2].message)).toBeInTheDocument();

    // Update the mock to return only the data alert
    (useAlertsSpy as jest.Mock).mockReturnValue({
      setAlertConfirmed: setAlertConfirmedMock,
      alerts: [dangerAlertMock],
      generalAlerts: [],
      fieldAlerts: [dangerAlertMock],
      getFieldAlerts: () => [dangerAlertMock],
      isAlertConfirmed: () => false,
    });

    // Rerender the component to apply the updated mock
    rerender(
      <MultipleAlertModal
        {...defaultProps}
        alertKey={CONTRACT_ALERT_KEY_MOCK}
      />,
    );

    // verifies the data alert is shown
    expect(queryByText(alertsMock[0].message)).not.toBeInTheDocument();
    expect(getByText(alertsMock[1].message)).toBeInTheDocument();
    useAlertsSpy.mockRestore();
  });

  it('renders the multiple alert modal', () => {
    const { getByTestId } = renderWithProvider(
      <MultipleAlertModal {...defaultProps} />,
      mockStore,
    );

    expect(getByTestId('alert-modal-next-button')).toBeDefined();
  });

  it('invokes the onFinalAcknowledgeClick when the button is clicked', () => {
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

  it('renders the next alert when the "Got it" button is clicked', () => {
    const { getByTestId, getByText } = renderWithProvider(
      <MultipleAlertModal {...defaultProps} alertKey={DATA_ALERT_KEY_MOCK} />,
      mockStoreAcknowledgeAlerts,
    );

    fireEvent.click(getByTestId('alert-modal-button'));

    expect(getByText(alertsMock[1].message)).toBeInTheDocument();
  });

  it('closes modal when the "Got it" button is clicked', () => {
    onAcknowledgeClickMock.mockReset();
    const { getByTestId } = renderWithProvider(
      <MultipleAlertModal
        {...defaultProps}
        alertKey={DATA_ALERT_KEY_MOCK}
        skipAlertNavigation={true}
      />,
      mockStoreAcknowledgeAlerts,
    );

    fireEvent.click(getByTestId('alert-modal-button'));

    expect(onAcknowledgeClickMock).toHaveBeenCalledTimes(1);
  });

  it('resets to the first alert if there are unconfirmed alerts and the final alert is acknowledged', () => {
    const { getByTestId, getByText } = renderWithProvider(
      <MultipleAlertModal
        {...defaultProps}
        alertKey={CONTRACT_ALERT_KEY_MOCK}
      />,
      mockStore,
    );

    fireEvent.click(getByTestId('alert-modal-button'));

    expect(getByText(alertsMock[0].message)).toBeInTheDocument();
  });

  describe('Navigation', () => {
    it('calls next alert when the next button is clicked', () => {
      const { getByTestId, getByText } = renderWithProvider(
        <MultipleAlertModal {...defaultProps} />,
        mockStore,
      );

      fireEvent.click(getByTestId('alert-modal-next-button'));

      expect(getByText(alertsMock[2].message)).toBeInTheDocument();
    });

    it('calls previous alert when the previous button is clicked', () => {
      const selectSecondAlertMock = {
        ...defaultProps,
        alertKey: CONTRACT_ALERT_KEY_MOCK,
      };
      const { getByTestId, getByText } = renderWithProvider(
        <MultipleAlertModal {...selectSecondAlertMock} />,
        mockStore,
      );

      fireEvent.click(getByTestId('alert-modal-back-button'));

      expect(getByText(alertsMock[1].message)).toBeInTheDocument();
    });
  });
});
