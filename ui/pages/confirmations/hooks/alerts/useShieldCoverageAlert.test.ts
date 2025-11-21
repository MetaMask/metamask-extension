import { TransactionType } from '@metamask/transaction-controller';
import { renderHookWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
import {
  getMockApproveConfirmState,
  getMockTypedSignConfirmStateForRequest,
} from '../../../../../test/data/confirmations/helper';
import { tEn } from '../../../../../test/lib/i18n-helpers';
import { RowAlertKey } from '../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../helpers/constants/design-system';
import { useTransactionEventFragment } from '../useTransactionEventFragment';
import { useSignatureEventFragment } from '../useSignatureEventFragment';
import { useShieldCoverageAlert } from './useShieldCoverageAlert';

jest.mock('../transactions/useEnableShieldCoverageChecks', () => ({
  useEnableShieldCoverageChecks: jest.fn(() => ({
    isEnabled: true,
    isPaused: false,
  })),
}));

const mockUseNavigate = jest.fn();
jest.mock('react-router-dom-v5-compat', () => {
  return {
    ...jest.requireActual('react-router-dom-v5-compat'),
    useNavigate: () => mockUseNavigate,
  };
});

const updateTransactionEventFragmentMock = jest.fn();
const updateSignatureEventFragmentMock = jest.fn();

jest.mock('../useTransactionEventFragment');

jest.mock('../useSignatureEventFragment');

const { useEnableShieldCoverageChecks } = jest.requireMock(
  '../transactions/useEnableShieldCoverageChecks',
) as { useEnableShieldCoverageChecks: jest.Mock };

describe('useShieldCoverageAlert', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useEnableShieldCoverageChecks.mockReturnValue({
      isEnabled: true,
      isPaused: false,
    });

    (useTransactionEventFragment as jest.Mock).mockReturnValue({
      updateTransactionEventFragment: updateTransactionEventFragmentMock,
    });

    (useSignatureEventFragment as jest.Mock).mockReturnValue({
      updateSignatureEventFragment: updateSignatureEventFragmentMock,
    });
  });

  const getStateWithCoverage = (
    status?: string,
    reasonCode = 'E104',
    isTransaction: boolean = true,
    latency: number | string = 'N/A',
  ): Record<string, unknown> => {
    const mockId = '123';
    const baseState = isTransaction
      ? getMockApproveConfirmState()
      : getMockTypedSignConfirmStateForRequest({
          id: mockId,
          type: TransactionType.signTypedData,
          msgParams: {
            from: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
            data: '0x5369676e20696e746f20e280ae204556494c',
            origin: 'https://metamask.github.io',
            siwe: { isSIWEMessage: false, parsedMessage: null },
          },
        });
    const { metamask } = baseState as unknown as {
      metamask: { transactions: { id: number }[] };
    };

    const txId = isTransaction ? metamask.transactions[0].id : mockId;

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
                metrics: {
                  latency,
                },
              },
            ],
          },
        },
      },
    } as Record<string, unknown>;
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

  it('updates transaction event fragment with covered status', () => {
    const state = getStateWithCoverage('covered', 'E104', true, 150);
    renderHookWithConfirmContextProvider(() => useShieldCoverageAlert(), state);
    expect(updateTransactionEventFragmentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          shield_result: 'covered',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          shield_reason: 'shieldCoverageAlertCovered',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          shield_result_response_latency_ms: 150,
        },
      }),
      expect.anything(),
    );
  });

  it('updates transaction event fragment with not_covered_malicious status', () => {
    const state = getStateWithCoverage('malicious', 'E102');
    renderHookWithConfirmContextProvider(() => useShieldCoverageAlert(), state);
    expect(updateTransactionEventFragmentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          shield_result: 'not_covered_malicious',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          shield_reason: 'shieldCoverageAlertMessagePotentialRisks',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          shield_result_response_latency_ms: 'N/A',
        },
      }),
      expect.anything(),
    );
  });

  it('updates transaction event fragment with not_covered status', () => {
    const state = getStateWithCoverage('unknown', 'E102');
    renderHookWithConfirmContextProvider(() => useShieldCoverageAlert(), state);
    expect(updateTransactionEventFragmentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          shield_result: 'not_covered',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          shield_reason: 'shieldCoverageAlertMessagePotentialRisks',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          shield_result_response_latency_ms: 'N/A',
        },
      }),
      expect.anything(),
    );
  });

  it('updates transaction event fragment with loading/not_shown status', () => {
    const state = getStateWithCoverage(undefined, 'E102');
    renderHookWithConfirmContextProvider(() => useShieldCoverageAlert(), state);
    expect(updateTransactionEventFragmentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          shield_result: 'loading',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          shield_reason: 'shieldCoverageAlertMessagePotentialRisks',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          shield_result_response_latency_ms: 'N/A',
        },
      }),
      expect.anything(),
    );
  });

  it('updates signature event fragment with correct metrics', () => {
    const state = getStateWithCoverage('covered', 'E104', false, 200);
    renderHookWithConfirmContextProvider(() => useShieldCoverageAlert(), state);

    expect(updateSignatureEventFragmentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          shield_result: 'covered',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          shield_reason: 'shieldCoverageAlertCovered',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          shield_result_response_latency_ms: 200,
        },
      }),
    );
  });
});
