import { fireEvent } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import {
  BlockaidReason,
  SecurityProvider,
} from '../../../../../shared/constants/security-provider';
import mockState from '../../../../../test/data/mock-state.json';
import { tEn } from '../../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../helpers/constants/design-system';
import * as useAlertsModule from '../../../../hooks/useAlerts';
import { useConfirmContext } from '../../../../pages/confirmations/context/confirm';
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

jest.mock('../../../../pages/confirmations/context/confirm', () => ({
  useConfirmContext: jest.fn(() => ({
    currentConfirmation: {
      securityAlertResponse: {
        reason: '',
      },
    },
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
    const dangerAlertMock = alertsMock.find(
      (alert) => alert.key === DATA_ALERT_KEY_MOCK,
    );
    const useAlertsSpy = jest.spyOn(useAlertsModule, 'default');
    const newMockStore = configureMockStore([])({
      ...STATE_MOCK,
      confirmAlerts: {
        alerts: { [OWNER_ID_MOCK]: [dangerAlertMock] },
        confirmed: {
          [OWNER_ID_MOCK]: {
            [DATA_ALERT_KEY_MOCK]: false,
          },
        },
      },
    });

    (useAlertsSpy as jest.Mock).mockReturnValue({
      setAlertConfirmed: setAlertConfirmedMock,
      alerts: [dangerAlertMock],
      generalAlerts: [],
      fieldAlerts: [dangerAlertMock],
      getFieldAlerts: () => [dangerAlertMock],
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

  it('allows bypassing acknowledgement for danger alerts when acknowledgeBypass is true', () => {
    const dangerAlert = alertsMock.find(
      (alert) => alert.key === DATA_ALERT_KEY_MOCK,
    ) as Alert;

    const dangerAlertWithBypass = {
      ...dangerAlert,
      acknowledgeBypass: true,
    };

    const bypassStore = configureMockStore([])({
      ...STATE_MOCK,
      confirmAlerts: {
        alerts: { [OWNER_ID_MOCK]: [dangerAlertWithBypass] },
        confirmed: {
          [OWNER_ID_MOCK]: {
            [DATA_ALERT_KEY_MOCK]: false,
          },
        },
      },
    });

    const { queryByTestId, getByTestId } = renderWithProvider(
      <AlertModal
        ownerId={OWNER_ID_MOCK}
        onAcknowledgeClick={onAcknowledgeClickMock}
        onClose={onCloseMock}
        alertKey={DATA_ALERT_KEY_MOCK}
      />,
      bypassStore,
    );

    expect(queryByTestId('alert-modal-acknowledge-checkbox')).toBeNull();
    expect(getByTestId('alert-modal-button')).toBeEnabled();
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
      expect(queryByTestId('alert-modal-button')).toBeInTheDocument();
      expect(getByText(ACTION_LABEL_MOCK)).toBeInTheDocument();
    });

    it('renders checkbox for non-blocking alerts', () => {
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

  describe('BlockaidAlertDetails', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    const blockaidAlertMock: Alert = {
      key: FROM_ALERT_KEY_MOCK,
      field: FROM_ALERT_KEY_MOCK,
      severity: Severity.Warning,
      message: ALERT_MESSAGE_MOCK,
      provider: SecurityProvider.Blockaid,
      reason: 'Reason 1',
    };

    const blockaidStateMock = {
      ...STATE_MOCK,
      confirmAlerts: {
        alerts: { [OWNER_ID_MOCK]: [blockaidAlertMock] },
        confirmed: {
          [OWNER_ID_MOCK]: {
            [FROM_ALERT_KEY_MOCK]: false,
          },
        },
      },
    };
    const blockaidMockStore = configureMockStore([])(blockaidStateMock);

    const testCases = [
      {
        reason: BlockaidReason.rawSignatureFarming,
        expectedKey: 'blockaidAlertDescriptionOthers',
      },
      {
        reason: BlockaidReason.approvalFarming,
        expectedKey: 'blockaidAlertDescriptionWithdraw',
      },
      {
        reason: BlockaidReason.setApprovalForAll,
        expectedKey: 'blockaidAlertDescriptionWithdraw',
      },
      {
        reason: BlockaidReason.permitFarming,
        expectedKey: 'blockaidAlertDescriptionWithdraw',
      },
      {
        reason: BlockaidReason.transferFarming,
        expectedKey: 'blockaidAlertDescriptionTokenTransfer',
      },
      {
        reason: BlockaidReason.transferFromFarming,
        expectedKey: 'blockaidAlertDescriptionTokenTransfer',
      },
      {
        reason: BlockaidReason.rawNativeTokenTransfer,
        expectedKey: 'blockaidAlertDescriptionTokenTransfer',
      },
      {
        reason: BlockaidReason.seaportFarming,
        expectedKey: 'blockaidAlertDescriptionOpenSea',
      },
      {
        reason: BlockaidReason.blurFarming,
        expectedKey: 'blockaidAlertDescriptionBlur',
      },
      {
        reason: BlockaidReason.maliciousDomain,
        expectedKey: 'blockaidAlertDescriptionMalicious',
      },
      {
        reason: BlockaidReason.tradeOrderFarming,
        expectedKey: 'blockaidAlertDescriptionOthers',
      },
      {
        reason: BlockaidReason.other,
        expectedKey: 'blockaidAlertDescriptionOthers',
      },
      {
        reason: 'unknown reason',
        expectedKey: 'blockaidAlertDescriptionOthers',
      },
    ];

    testCases.forEach(({ reason, expectedKey }) => {
      it(`displays correct message for ${reason}`, () => {
        (useConfirmContext as jest.Mock).mockImplementation(() => ({
          currentConfirmation: {
            securityAlertResponse: {
              reason,
            },
          },
        }));

        const { getByText } = renderWithProvider(
          <AlertModal
            ownerId={OWNER_ID_MOCK}
            onAcknowledgeClick={onAcknowledgeClickMock}
            onClose={onCloseMock}
            alertKey={FROM_ALERT_KEY_MOCK}
          />,
          blockaidMockStore,
        );

        expect(getByText(tEn(expectedKey) as string)).toBeInTheDocument();
      });
    });

    it('handles undefined securityAlertResponse', () => {
      (useConfirmContext as jest.Mock).mockImplementation(() => ({
        currentConfirmation: {},
      }));

      const { getByText } = renderWithProvider(
        <AlertModal
          ownerId={OWNER_ID_MOCK}
          onAcknowledgeClick={onAcknowledgeClickMock}
          onClose={onCloseMock}
          alertKey={FROM_ALERT_KEY_MOCK}
        />,
        blockaidMockStore,
      );

      expect(
        getByText(tEn('blockaidAlertDescriptionOthers') as string),
      ).toBeInTheDocument();
    });
  });
});
