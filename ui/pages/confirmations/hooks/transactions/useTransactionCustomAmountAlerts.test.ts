import { getMockConfirmState } from '../../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
import useAlerts from '../../../../hooks/useAlerts';
import { Severity } from '../../../../helpers/constants/design-system';
import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { usePendingAmountAlerts } from '../alerts/usePendingAmountAlerts';
import { AlertsName } from '../alerts/constants';
import { useTransactionCustomAmountAlerts } from './useTransactionCustomAmountAlerts';

jest.mock('../../../../hooks/useAlerts');
jest.mock('../alerts/usePendingAmountAlerts');

const createMockAlert = (overrides: Partial<Alert> = {}): Alert =>
  ({
    key: 'test-alert',
    severity: Severity.Danger,
    isBlocking: false,
    ...overrides,
  }) as Alert;

const createMockUseAlertsReturnValue = (
  overrides: Partial<ReturnType<typeof useAlerts>> = {},
) =>
  ({
    alerts: [],
    fieldAlerts: [],
    generalAlerts: [],
    getFieldAlerts: jest.fn().mockReturnValue([]),
    getNavigableFieldAlerts: jest.fn().mockReturnValue([]),
    dangerAlerts: [],
    navigableAlerts: [],
    navigableGeneralAlerts: [],
    navigableFieldAlerts: [],
    unconfirmedDangerAlerts: [],
    hasDangerAlerts: false,
    hasAlerts: false,
    hasUnconfirmedDangerAlerts: false,
    hasUnconfirmedFieldDangerAlerts: false,
    setAlertConfirmed: jest.fn(),
    isAlertConfirmed: jest.fn().mockReturnValue(false),
    ...overrides,
  }) as unknown as ReturnType<typeof useAlerts>;

function runHook(pendingFiatAmount?: string) {
  const state = getMockConfirmState();

  return renderHookWithConfirmContextProvider(
    () => useTransactionCustomAmountAlerts({ pendingFiatAmount }),
    state,
  );
}

describe('useTransactionCustomAmountAlerts', () => {
  const useAlertsMock = jest.mocked(useAlerts);
  const usePendingAmountAlertsMock = jest.mocked(usePendingAmountAlerts);

  beforeEach(() => {
    jest.resetAllMocks();
    useAlertsMock.mockReturnValue(createMockUseAlertsReturnValue());
    usePendingAmountAlertsMock.mockReturnValue([]);
  });

  it('returns base state when no alerts', () => {
    const { result } = runHook();

    expect(result.current).toStrictEqual({
      disableUpdate: false,
      hasAlert: false,
      hideResults: false,
    });
  });

  it('ignores non-blocking alerts', () => {
    useAlertsMock.mockReturnValue(
      createMockUseAlertsReturnValue({
        alerts: [
          createMockAlert({
            key: 'test-alert',
            message: 'Non-blocking alert',
            isBlocking: false,
            severity: Severity.Warning,
          }),
        ],
        hasAlerts: true,
      }),
    );

    const { result } = runHook();

    expect(result.current).toStrictEqual({
      disableUpdate: false,
      hasAlert: false,
      hideResults: false,
    });
  });

  it('sets hideResults to true when DepositLimit alert exists', () => {
    useAlertsMock.mockReturnValue(
      createMockUseAlertsReturnValue({
        alerts: [
          createMockAlert({
            key: AlertsName.DepositLimit,
            reason: 'Max deposit: $100,000',
            message: 'Max deposit: $100,000',
            isBlocking: true,
            severity: Severity.Danger,
          }),
        ],
        hasDangerAlerts: true,
        hasAlerts: true,
        hasUnconfirmedDangerAlerts: true,
      }),
    );

    const { result } = runHook();

    expect(result.current.hideResults).toBe(true);
    expect(result.current.hasAlert).toBe(true);
    expect(result.current.alertMessage).toBe('Max deposit: $100,000');
  });

  it('sets hideResults to true when InsufficientPayTokenBalance alert exists', () => {
    useAlertsMock.mockReturnValue(
      createMockUseAlertsReturnValue({
        alerts: [
          createMockAlert({
            key: AlertsName.InsufficientPayTokenBalance,
            reason: 'Insufficient funds',
            message: 'Insufficient funds',
            isBlocking: true,
            severity: Severity.Danger,
          }),
        ],
        hasDangerAlerts: true,
        hasAlerts: true,
        hasUnconfirmedDangerAlerts: true,
      }),
    );

    const { result } = runHook();

    expect(result.current).toStrictEqual({
      alertMessage: 'Insufficient funds',
      disableUpdate: false,
      hasAlert: true,
      hideResults: true,
    });
  });

  it('prefers pending amount insufficient-funds alerts while typing', () => {
    usePendingAmountAlertsMock.mockReturnValue([
      createMockAlert({
        key: AlertsName.InsufficientPayTokenBalance,
        reason: 'Insufficient funds',
        message: 'Insufficient funds',
        isBlocking: true,
        severity: Severity.Danger,
      }),
    ]);

    const { result } = runHook('25.00');

    expect(usePendingAmountAlertsMock).toHaveBeenCalledWith({
      pendingFiatAmount: '25.00',
    });
    expect(result.current).toStrictEqual({
      alertMessage: 'Insufficient funds',
      disableUpdate: false,
      hasAlert: true,
      hideResults: true,
    });
  });

  it('sets hideResults to true when AccountNoFunds alert exists', () => {
    useAlertsMock.mockReturnValue(
      createMockUseAlertsReturnValue({
        alerts: [
          createMockAlert({
            key: AlertsName.AccountNoFunds,
            reason: 'No funds available',
            message: 'No funds available. Use a different account.',
            isBlocking: true,
            severity: Severity.Danger,
          }),
        ],
        hasDangerAlerts: true,
        hasAlerts: true,
        hasUnconfirmedDangerAlerts: true,
      }),
    );

    const { result } = runHook();

    expect(result.current).toStrictEqual({
      alertMessage: 'No funds available. Use a different account.',
      disableUpdate: true,
      hasAlert: true,
      hideResults: true,
    });
  });

  it('sets hideResults to true when PerpsWithdrawBalanceUnavailable alert exists', () => {
    useAlertsMock.mockReturnValue(
      createMockUseAlertsReturnValue({
        alerts: [
          createMockAlert({
            key: AlertsName.PerpsWithdrawBalanceUnavailable,
            reason: "Couldn't check your Perps balance",
            message: "Couldn't check your Perps balance. Try again.",
            isBlocking: true,
            severity: Severity.Danger,
          }),
        ],
        hasDangerAlerts: true,
        hasAlerts: true,
        hasUnconfirmedDangerAlerts: true,
      }),
    );

    const { result } = runHook();

    expect(result.current).toStrictEqual({
      alertMessage: "Couldn't check your Perps balance. Try again.",
      disableUpdate: false,
      hasAlert: true,
      hideResults: true,
    });
  });

  it('sets hideResults to true when SigningOrSubmitting alert exists', () => {
    useAlertsMock.mockReturnValue(
      createMockUseAlertsReturnValue({
        alerts: [
          createMockAlert({
            key: AlertsName.SigningOrSubmitting,
            message: 'Transaction in progress',
            isBlocking: true,
            severity: Severity.Danger,
          }),
        ],
        hasDangerAlerts: true,
        hasAlerts: true,
        hasUnconfirmedDangerAlerts: true,
      }),
    );

    const { result } = runHook();

    expect(result.current.hideResults).toBe(true);
    expect(result.current.disableUpdate).toBe(true);
    expect(result.current.hasAlert).toBe(true);
  });

  it('returns alertMessage when alert has both reason and different message', () => {
    useAlertsMock.mockReturnValue(
      createMockUseAlertsReturnValue({
        alerts: [
          createMockAlert({
            key: 'no-quotes',
            reason: 'No quotes',
            message: 'This payment route is not available right now.',
            isBlocking: true,
            severity: Severity.Danger,
          }),
        ],
        hasDangerAlerts: true,
        hasAlerts: true,
        hasUnconfirmedDangerAlerts: true,
      }),
    );

    const { result } = runHook();

    expect(result.current).toStrictEqual({
      alertMessage: 'This payment route is not available right now.',
      disableUpdate: false,
      hasAlert: true,
      hideResults: false,
    });
  });

  it('does not return alertMessage when reason and message are the same for other alerts', () => {
    useAlertsMock.mockReturnValue(
      createMockUseAlertsReturnValue({
        alerts: [
          createMockAlert({
            key: 'test-alert',
            reason: 'Something went wrong',
            message: 'Something went wrong',
            isBlocking: true,
            severity: Severity.Danger,
          }),
        ],
        hasDangerAlerts: true,
        hasAlerts: true,
        hasUnconfirmedDangerAlerts: true,
      }),
    );

    const { result } = runHook();

    expect(result.current).toStrictEqual({
      disableUpdate: false,
      hasAlert: true,
      hideResults: false,
    });
  });

  it('sets disableUpdate to true when PayHardwareAccount alert exists', () => {
    useAlertsMock.mockReturnValue(
      createMockUseAlertsReturnValue({
        alerts: [
          createMockAlert({
            key: AlertsName.PayHardwareAccount,
            message: 'Hardware wallet not supported',
            isBlocking: true,
            severity: Severity.Danger,
          }),
        ],
        hasDangerAlerts: true,
        hasAlerts: true,
        hasUnconfirmedDangerAlerts: true,
      }),
    );

    const { result } = runHook();

    expect(result.current.disableUpdate).toBe(true);
    expect(result.current.hasAlert).toBe(true);
    expect(result.current.hideResults).toBe(true);
  });
});
