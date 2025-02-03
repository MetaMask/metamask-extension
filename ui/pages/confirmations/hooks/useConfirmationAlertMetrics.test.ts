import { TransactionMeta } from '@metamask/transaction-controller';
import { act } from '@testing-library/react-hooks';

import { getMockConfirmStateForTransaction } from '../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../test/data/confirmations/contract-interaction';
import { renderHookWithConfirmContextProvider } from '../../../../test/lib/confirmations/render-helpers';
import { Severity } from '../../../helpers/constants/design-system';
import {
  useConfirmationAlertMetrics,
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

const contractInteraction = genUnapprovedContractInteractionConfirmation({
  chainId: '0x5',
});

const STATE_MOCK = getMockConfirmStateForTransaction(
  { ...contractInteraction, id: OWNER_ID_MOCK } as TransactionMeta,
  {
    metamask: {},
    confirmAlerts: {
      alerts: { [OWNER_ID_MOCK]: alertsMock },
      confirmed: {
        [OWNER_ID_MOCK]: {
          [KEY_ALERT_KEY_MOCK]: false,
          [UUID_ALERT_KEY_MOCK]: false,
        },
      },
    },
  },
);

const EXPECTED_PROPERTIES_BASE = {
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
    const { result } = renderHookWithConfirmContextProvider(
      () => useConfirmationAlertMetrics(),
      STATE_MOCK,
    );

    expect(result.current.trackAlertRender).toBeInstanceOf(Function);
    expect(result.current.trackInlineAlertClicked).toBeInstanceOf(Function);
    expect(result.current.trackAlertActionClicked).toBeInstanceOf(Function);
  });

  it('calls updateTransactionEventFragment with correct properties on initialization', () => {
    renderHookWithConfirmContextProvider(
      () => useConfirmationAlertMetrics(),
      STATE_MOCK,
    );

    expect(mockUpdateTransactionEventFragment).toHaveBeenCalledWith(
      { properties: EXPECTED_PROPERTIES_BASE },
      OWNER_ID_MOCK,
    );
  });

  const testCases = [
    {
      description: 'updates metrics properties when trackAlertRender is called',
      alertKey: AlertsName.GasFeeLow,
      action: 'trackAlertRender',
      expectedProperties: {
        alert_visualized: [ALERT_NAME_METRICS_MOCK],
        alert_visualized_count: 1,
      },
    },
    {
      description:
        'updates metrics properties when trackInlineAlertClicked is called',
      alertKey: AlertsName.GasFeeLow,
      action: 'trackInlineAlertClicked',
      expectedProperties: {
        alert_key_clicked: [ALERT_NAME_METRICS_MOCK],
      },
    },
    {
      description:
        'updates metrics properties when trackAlertActionClicked is called',
      alertKey: AlertsName.GasFeeLow,
      action: 'trackAlertActionClicked',
      expectedProperties: {
        alert_action_clicked: [ALERT_NAME_METRICS_MOCK],
      },
    },
    {
      description:
        'updates metrics properties when receives alertKey as a valid UUID',
      alertKey: UUID_ALERT_KEY_MOCK,
      action: 'trackAlertRender',
      expectedProperties: {
        alert_visualized: [ALERTS_NAME_METRICS[AlertsName.Blockaid]],
        alert_visualized_count: 1,
      },
    },
  ];

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each(testCases)(
    '$description',
    ({
      alertKey,
      action,
      expectedProperties,
    }: {
      description: string;
      alertKey: string;
      action:
        | 'trackAlertRender'
        | 'trackInlineAlertClicked'
        | 'trackAlertActionClicked';
      expectedProperties: Record<string, unknown>;
    }) => {
      const finalExpectedProperties = {
        ...EXPECTED_PROPERTIES_BASE,
        ...expectedProperties,
      };

      const { result } = renderHookWithConfirmContextProvider(
        () => useConfirmationAlertMetrics(),
        STATE_MOCK,
      );

      act(() => {
        result.current[action](alertKey);
      });

      expect(mockUpdateTransactionEventFragment).toHaveBeenCalledWith(
        { properties: finalExpectedProperties },
        OWNER_ID_MOCK,
      );
    },
  );
});
