import { TransactionType } from '@metamask/transaction-controller';
import mockState from '../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers';
import { Severity } from '../../../helpers/constants/design-system';
import { AlertsName } from './alerts/constants';
import { useConfirmationAlertMetrics } from './useConfirmationAlertMetrics';
import * as transactionEventFragmentHook from './useTransactionEventFragment';

jest.mock('./useTransactionEventFragment');

const mockUpdateTransactionEventFragment = jest.fn();

const OWNER_ID_MOCK = '123';
const KEY_ALERT_KEY_MOCK = 'Key';
const ALERT_MESSAGE_MOCK = 'Alert 1';
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

    expect(result.current.trackAlertRender).toBeInstanceOf(Function);
    expect(result.current.trackInlineAlertClicked).toBeInstanceOf(Function);
    expect(result.current.trackAlertActionClicked).toBeInstanceOf(Function);
  });
});
