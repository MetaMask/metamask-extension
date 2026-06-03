import { getMockConfirmState } from '../../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
import useAlerts from '../../../../hooks/useAlerts';
import { Severity } from '../../../../helpers/constants/design-system';
import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { AlertsName } from '../alerts/constants';
import { useTransactionCustomAmountAlerts } from './useTransactionCustomAmountAlerts';

jest.mock('../../../../hooks/useAlerts');

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

function runHook() {
  const state = getMockConfirmState();

  return renderHookWithConfirmContextProvider(
    () => useTransactionCustomAmountAlerts(),
    state,
  );
}

describe('useTransactionCustomAmountAlerts', () => {
  const useAlertsMock = jest.mocked(useAlerts);

  beforeEach(() => {
    jest.resetAllMocks();
    useAlertsMock.mockReturnValue(createMockUseAlertsReturnValue());
  });

  it('returns base state when no alerts', () => {
    const { result } = runHook();

    expect(result.current).toStrictEqual({
      disableUpdate: false,
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
      hideResults: false,
    });
  });

  it('sets hideResults to true when InsufficientPayTokenBalance alert exists', () => {
    useAlertsMock.mockReturnValue(
      createMockUseAlertsReturnValue({
        alerts: [
          createMockAlert({
            key: AlertsName.InsufficientPayTokenBalance,
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
      disableUpdate: false,
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

    expect(result.current).toStrictEqual({
      disableUpdate: true,
      hideResults: true,
    });
  });

  it('returns alertMessage when alert has both reason and different message', () => {
    useAlertsMock.mockReturnValue(
      createMockUseAlertsReturnValue({
        alerts: [
          createMockAlert({
            key: 'test-alert',
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
      hideResults: false,
    });
  });

  it('does not return alertMessage when reason and message are the same', () => {
    useAlertsMock.mockReturnValue(
      createMockUseAlertsReturnValue({
        alerts: [
          createMockAlert({
            key: 'test-alert',
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
      disableUpdate: false,
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

    expect(result.current).toStrictEqual({
      disableUpdate: true,
      hideResults: true,
    });
  });
});
