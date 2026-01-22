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
      hideResults: false,
    });
  });

  it('returns alertMessage from first blocking alert message', () => {
    useAlertsMock.mockReturnValue(
      createMockUseAlertsReturnValue({
        alerts: [
          createMockAlert({
            key: 'test-alert',
            message: 'Test alert message',
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
      alertMessage: 'Test alert message',
      hideResults: false,
    });
  });

  it('returns alertMessage from first blocking alert reason when message is undefined', () => {
    useAlertsMock.mockReturnValue(
      createMockUseAlertsReturnValue({
        alerts: [
          createMockAlert({
            key: 'test-alert',
            reason: 'Test alert reason',
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
      alertMessage: 'Test alert reason',
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
      hideResults: false,
    });
  });

  it('returns first blocking alert when multiple alerts exist', () => {
    useAlertsMock.mockReturnValue(
      createMockUseAlertsReturnValue({
        alerts: [
          createMockAlert({
            key: 'non-blocking',
            message: 'Non-blocking alert',
            isBlocking: false,
            severity: Severity.Warning,
          }),
          createMockAlert({
            key: 'blocking-1',
            message: 'First blocking alert',
            isBlocking: true,
            severity: Severity.Danger,
          }),
          createMockAlert({
            key: 'blocking-2',
            message: 'Second blocking alert',
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
      alertMessage: 'First blocking alert',
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
      alertMessage: 'Insufficient funds',
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
      alertMessage: 'Transaction in progress',
      hideResults: true,
    });
  });
});
