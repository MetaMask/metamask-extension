import { renderHookWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
import { getMockApproveConfirmState } from '../../../../../test/data/confirmations/helper';
import { tEn } from '../../../../../test/lib/i18n-helpers';
import { RowAlertKey } from '../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../helpers/constants/design-system';
import { useShieldCoverageAlert } from './useShieldCoverageAlert';

jest.mock('../transactions/useEnableShieldCoverageChecks', () => ({
  useEnableShieldCoverageChecks: jest.fn(() => ({
    isEnabled: true,
    isPaused: false,
  })),
}));

jest.mock('react-router-dom-v5-compat', () => ({
  useNavigate: jest.fn(() => jest.fn()),
}));

describe('useShieldCoverageAlert', () => {
  const { useEnableShieldCoverageChecks } = jest.requireMock(
    '../transactions/useEnableShieldCoverageChecks',
  ) as { useEnableShieldCoverageChecks: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    useEnableShieldCoverageChecks.mockReturnValue({
      isEnabled: true,
      isPaused: false,
    });
  });

  const getStateWithCoverage = (
    status: string,
    reasonCode = 'E104',
  ): Record<string, unknown> => {
    const baseState = getMockApproveConfirmState();
    const { metamask } = baseState as unknown as {
      metamask: { transactions: { id: number }[] };
    };
    const txId = metamask.transactions[0].id;
    return {
      ...baseState,
      metamask: {
        ...metamask,
        coverageResults: {
          [txId]: {
            results: [
              {
                status,
                reasonCode,
              },
            ],
          },
        },
      },
    } as unknown as Record<string, unknown>;
  };

  it('returns empty array when shield coverage checks are disabled', () => {
    useEnableShieldCoverageChecks.mockReturnValue({
      isEnabled: false,
      isPaused: false,
    });

    const baseState = getMockApproveConfirmState();
    const { metamask } = baseState as unknown as {
      metamask: { transactions: { id: number }[] };
    };
    const txId = metamask.transactions[0].id;
    const state = {
      ...baseState,
      metamask: {
        ...metamask,
        coverageResults: {
          [txId]: { results: [] },
        },
      },
    } as unknown as Record<string, unknown>;

    const { result } = renderHookWithConfirmContextProvider(
      () => useShieldCoverageAlert(),
      state,
    );

    expect(result.current).toEqual([]);
  });

  it('returns success alert when status is covered', () => {
    const state = getStateWithCoverage('covered', 'E104');

    const { result } = renderHookWithConfirmContextProvider(
      () => useShieldCoverageAlert(),
      state,
    );

    expect(result.current).toHaveLength(1);
    const alert = result.current[0];
    expect(alert.key).toBe('shieldCoverageAlert');
    expect(alert.field).toBe(RowAlertKey.ShieldFooterCoverageIndicator);
    expect(alert.severity).toBe(Severity.Success);
    expect(alert.inlineAlertText).toBe(tEn('shieldCovered'));
    expect(alert.isOpenModalOnClick).toBe(true);
    expect(alert.showArrow).toBe(false);
    expect(alert.reason).toBe(tEn('shieldCoverageAlertMessageTitleCovered'));
    expect(alert.content).toBeTruthy();
  });

  it('returns info alert when status is not covered', () => {
    const state = getStateWithCoverage('not_covered', 'E102');

    const { result } = renderHookWithConfirmContextProvider(
      () => useShieldCoverageAlert(),
      state,
    );

    expect(result.current).toHaveLength(1);
    const alert = result.current[0];
    expect(alert.severity).toBe(Severity.Disabled);
    expect(alert.inlineAlertText).toBe(tEn('shieldNotCovered'));
    expect(alert.isOpenModalOnClick).toBe(true);
  });
});
