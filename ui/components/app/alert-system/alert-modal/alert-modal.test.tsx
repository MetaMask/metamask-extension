import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { Severity } from '../../../../helpers/constants/design-system';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import * as useAlertsModule from '../../../../hooks/useAlerts';
import mockState from '../../../../../test/data/mock-state.json';
import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { AlertModal } from './alert-modal';

const onProcessActionMock = jest.fn();

const mockAlertActionHandlerProviderValue = {
  processAction: onProcessActionMock,
};

jest.mock('../contexts/alertActionHandler', () => ({
  useAlertActionHandler: jest.fn(() => mockAlertActionHandlerProviderValue),
}));

const mockTrackAlertActionClicked = jest.fn();
const mockTrackAlertRender = jest.fn();
jest.mock('../contexts/alertMetricsContext', () => ({
  useAlertMetrics: jest.fn(() => ({
    trackAlertActionClicked: mockTrackAlertActionClicked,
    trackInlineAlertClicked: jest.fn(),
    trackAlertRender: mockTrackAlertRender,
  })),
}));

describe('AlertModal', () => {
  const OWNER_ID_MOCK = '123';
  const FROM_ALERT_KEY_MOCK = 'from';
  const CONTRACT_ALERT_KEY_MOCK = 'contract';
  const DATA_ALERT_KEY_MOCK = 'data';
  const ALERT_MESSAGE_MOCK = 'Alert 1';
  const ACTION_KEY_MOCK = 'key-mock';
  const ACTION_LABEL_MOCK = 'Label Mock';
  const onAcknowledgeClickMock = jest.fn();
  const onCloseMock = jest.fn();

  const alertsMock: Alert[] = [
    {
      key: FROM_ALERT_KEY_MOCK,
      field: FROM_ALERT_KEY_MOCK,
      severity: Severity.Warning,
      message: ALERT_MESSAGE_MOCK,
      reason: 'Reason 1',
      alertDetails: ['Detail 1', 'Detail 2'],
    },
    {
      key: DATA_ALERT_KEY_MOCK,
      field: DATA_ALERT_KEY_MOCK,
      severity: Severity.Danger,
      message: 'Alert 2',
      isBlocking: false,
    },
    {
      key: CONTRACT_ALERT_KEY_MOCK,
      field: CONTRACT_ALERT_KEY_MOCK,
      severity: Severity.Info,
      message: 'Alert 3',
      actions: [{ key: ACTION_KEY_MOCK, label: ACTION_LABEL_MOCK }],
      isBlocking: true,
    },
  ];

  const STATE_MOCK = {
    ...mockState,
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

  it('disables button when alert is not acknowledged', () => {
    const { getByTestId } = renderWithProvider(
      <AlertModal
        ownerId={OWNER_ID_MOCK}
        onAcknowledgeClick={onAcknowledgeClickMock}
        onClose={onCloseMock}
        alertKey={DATA_ALERT_KEY_MOCK}
      />,
      mockStore,
    );

    expect(getByTestId('alert-modal-button')).toBeDisabled();
  });

  it('omits the acknowledgment section for non-danger alerts', () => {
    const { queryByTestId } = renderWithProvider(
      <AlertModal
        ownerId={OWNER_ID_MOCK}
        onAcknowledgeClick={onAcknowledgeClickMock}
        onClose={onCloseMock}
        alertKey={FROM_ALERT_KEY_MOCK}
      />,
      mockStore,
    );

    expect(queryByTestId('alert-modal-acknowledge-checkbox')).toBeNull();
    expect(queryByTestId('alert-modal-button')).toBeEnabled();
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
        alerts: { [OWNER_ID_MOCK]: [alertsMock[1]] },
        confirmed: {
          [OWNER_ID_MOCK]: {
            [DATA_ALERT_KEY_MOCK]: false,
          },
        },
      },
    });

    (useAlertsSpy as jest.Mock).mockReturnValue({
      setAlertConfirmed: setAlertConfirmedMock,
      alerts: [alertsMock[1]],
      generalAlerts: [],
      fieldAlerts: [alertsMock[1]],
      getFieldAlerts: () => [],
      isAlertConfirmed: () => false,
    });
    const { getByTestId } = renderWithProvider(
      <AlertModal
        ownerId={OWNER_ID_MOCK}
        onAcknowledgeClick={onAcknowledgeClickMock}
        onClose={onCloseMock}
        alertKey={DATA_ALERT_KEY_MOCK}
      />,
      newMockStore,
    );

    fireEvent.click(getByTestId('alert-modal-acknowledge-checkbox'));
    expect(setAlertConfirmedMock).toHaveBeenCalled();
    expect(setAlertConfirmedMock).toHaveBeenCalledWith(
      DATA_ALERT_KEY_MOCK,
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

  it('calls process action when action button is clicked', () => {
    const { getByText } = renderWithProvider(
      <AlertModal
        ownerId={OWNER_ID_MOCK}
        onAcknowledgeClick={onAcknowledgeClickMock}
        onClose={onCloseMock}
        alertKey={CONTRACT_ALERT_KEY_MOCK}
      />,
      mockStore,
    );

    expect(getByText(ACTION_LABEL_MOCK)).toBeInTheDocument();

    fireEvent.click(getByText(ACTION_LABEL_MOCK));

    expect(onProcessActionMock).toHaveBeenCalledTimes(1);
  });

  describe('Blocking alerts', () => {
    it('renders blocking alert', () => {
      const { getByText, queryByTestId } = renderWithProvider(
        <AlertModal
          ownerId={OWNER_ID_MOCK}
          onAcknowledgeClick={onAcknowledgeClickMock}
          onClose={onCloseMock}
          alertKey={CONTRACT_ALERT_KEY_MOCK}
        />,
        mockStore,
      );

      expect(queryByTestId('alert-modal-acknowledge-checkbox')).toBeNull();
      expect(queryByTestId('alert-modal-button')).toBeNull();
      expect(getByText(ACTION_LABEL_MOCK)).toBeInTheDocument();
    });

    it('renders acknowledge button and checkbox for non-blocking alerts', () => {
      const { getByTestId } = renderWithProvider(
        <AlertModal
          ownerId={OWNER_ID_MOCK}
          onAcknowledgeClick={onAcknowledgeClickMock}
          onClose={onCloseMock}
          alertKey={DATA_ALERT_KEY_MOCK}
        />,
        mockStore,
      );

      expect(getByTestId('alert-modal-acknowledge-checkbox')).toBeDefined();
      expect(getByTestId('alert-modal-button')).toBeDefined();
    });
  });

  describe('Track alert metrics', () => {
    it('calls mockTrackAlertRender when alert modal is opened', () => {
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
      expect(mockTrackAlertRender).toHaveBeenCalledWith(FROM_ALERT_KEY_MOCK);
    });

    it('calls trackAlertActionClicked when action button is clicked', () => {
      const { getByText } = renderWithProvider(
        <AlertModal
          ownerId={OWNER_ID_MOCK}
          onAcknowledgeClick={onAcknowledgeClickMock}
          onClose={onCloseMock}
          alertKey={CONTRACT_ALERT_KEY_MOCK}
        />,
        mockStore,
      );

      expect(getByText(ACTION_LABEL_MOCK)).toBeInTheDocument();

      fireEvent.click(getByText(ACTION_LABEL_MOCK));

      expect(mockTrackAlertActionClicked).toHaveBeenCalledWith(
        CONTRACT_ALERT_KEY_MOCK,
      );
    });
  });
});
