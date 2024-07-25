import { act } from '@testing-library/react-hooks';
import { TransactionType } from '@metamask/transaction-controller';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import { Severity } from '../../../helpers/constants/design-system';
import {
  useConfirmationAlertMetrics,
  AlertsActionMetrics,
  ALERTS_NAME_METRICS,
} from './useConfirmationAlertMetrics';
import * as transactionEventFragmentHook from './useTransactionEventFragment';
import { AlertsName } from './alerts/constants';

jest.mock('./useTransactionEventFragment');

const mockUpdateTransactionEventFragment = jest.fn();

const OWNER_ID_MOCK = '123';
const KEY_ALERT_KEY_MOCK = 'Key';
const ALERT_MESSAGE_MOCK = 'Alert 1';
const ALERT_NAME_METRICS_MOCK = ALERTS_NAME_METRICS[AlertsName.GasFeeLow];
const UUID_ALERT_KEY_MOCK = '550e8400-e29b-41d4-a716-446655440000';
const alertsMock = [
  {
    key: AlertsName.GasFeeLow,
    field: KEY_ALERT_KEY_MOCK,
    severity: Severity.Warning,
    message: ALERT_MESSAGE_MOCK,
    reason: 'Reason 1',
    alertDetails: ['Detail 1', 'Detail 2'],
  },
  {
    key: UUID_ALERT_KEY_MOCK,
    field: 'UUIDField',
    severity: Severity.Warning,
    message: 'UUID Alert',
    reason: 'Reason 2',
    alertDetails: ['Detail A', 'Detail B'],
  },
];
const STATE_MOCK = {
  ...mockState,
  confirmAlerts: {
    alerts: { [OWNER_ID_MOCK]: alertsMock },
    confirmed: {
      [OWNER_ID_MOCK]: {
        [KEY_ALERT_KEY_MOCK]: false,
        [UUID_ALERT_KEY_MOCK]: false,
      },
    },
  },
  confirm: {
    currentConfirmation: {
      id: OWNER_ID_MOCK,
      status: 'unapproved',
      time: new Date().getTime(),
      type: TransactionType.contractInteraction,
    },
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  (
    transactionEventFragmentHook.useTransactionEventFragment as jest.Mock
  ).mockReturnValue({
    updateTransactionEventFragment: mockUpdateTransactionEventFragment,
  });
});

describe('useConfirmationAlertMetrics', () => {
  it('initializes metrics properties correctly', () => {
    const { result } = renderHookWithProvider(
      () => useConfirmationAlertMetrics(),
      STATE_MOCK,
    );

    expect(result.current.trackAlertMetrics).toBeInstanceOf(Function);
  });

  it('calls updateTransactionEventFragment with correct properties on initialization', () => {
    renderHookWithProvider(() => useConfirmationAlertMetrics(), STATE_MOCK);

    expect(mockUpdateTransactionEventFragment).toHaveBeenCalledWith(
      {
        properties: {
          alert_action_clicked: [],
          alert_key_clicked: [],
          alert_resolved: [],
          alert_resolved_count: 0,
          alert_triggered: [
            ALERT_NAME_METRICS_MOCK,
            ALERTS_NAME_METRICS[AlertsName.Blockaid],
          ],
          alert_triggered_count: 2,
          alert_visualized: [],
          alert_visualized_count: 0,
        },
      },
      OWNER_ID_MOCK,
    );
  });

  const testCases = [
    {
      description: 'updates metrics properties when AlertVisualized is called',
      alertKey: AlertsName.GasFeeLow,
      action: AlertsActionMetrics.AlertVisualized,
      expectedProperties: {
        alert_action_clicked: [],
        alert_key_clicked: [],
        alert_resolved: [],
        alert_resolved_count: 0,
        alert_triggered: [
          ALERT_NAME_METRICS_MOCK,
          ALERTS_NAME_METRICS[AlertsName.Blockaid],
        ],
        alert_triggered_count: 2,
        alert_visualized: [ALERT_NAME_METRICS_MOCK],
        alert_visualized_count: 1,
      },
    },
    {
      description:
        'updates metrics properties when InlineAlertClicked is called',
      alertKey: AlertsName.GasFeeLow,
      action: AlertsActionMetrics.InlineAlertClicked,
      expectedProperties: {
        alert_action_clicked: [],
        alert_key_clicked: [ALERT_NAME_METRICS_MOCK],
        alert_resolved: [],
        alert_resolved_count: 0,
        alert_triggered: [
          ALERT_NAME_METRICS_MOCK,
          ALERTS_NAME_METRICS[AlertsName.Blockaid],
        ],
        alert_triggered_count: 2,
        alert_visualized: [],
        alert_visualized_count: 0,
      },
    },
    {
      description:
        'updates metrics properties when AlertActionClicked is called',
      alertKey: AlertsName.GasFeeLow,
      action: AlertsActionMetrics.AlertActionClicked,
      expectedProperties: {
        alert_action_clicked: [ALERT_NAME_METRICS_MOCK],
        alert_key_clicked: [],
        alert_resolved: [],
        alert_resolved_count: 0,
        alert_triggered: [
          ALERT_NAME_METRICS_MOCK,
          ALERTS_NAME_METRICS[AlertsName.Blockaid],
        ],
        alert_triggered_count: 2,
        alert_visualized: [],
        alert_visualized_count: 0,
      },
    },
  ];

  it.each(testCases)(
    '$description',
    ({
      alertKey,
      action,
      expectedProperties,
    }: {
      description: string;
      alertKey: string;
      action: AlertsActionMetrics;
      expectedProperties: Record<string, unknown>;
    }) => {
      const { result } = renderHookWithProvider(
        () => useConfirmationAlertMetrics(),
        STATE_MOCK,
      );

      act(() => {
        result.current.trackAlertMetrics({
          alertKey,
          action,
        });
      });

      expect(mockUpdateTransactionEventFragment).toHaveBeenCalledWith(
        { properties: expectedProperties },
        OWNER_ID_MOCK,
      );
    },
  );
});
