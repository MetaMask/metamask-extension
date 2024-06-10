import { Severity } from '../../../../../helpers/constants/design-system';
import { renderHookWithProvider } from '../../../../../../test/lib/render-helpers';
import mockState from '../../../../../../test/data/mock-state.json';
import {
  TransactionMeta,
  TransactionStatus,
} from '@metamask/transaction-controller';
import { useSigningOrSubmittingAlerts } from './useSigningOrSubmittingAlerts';

const TRANSACTION_META_MOCK: Partial<TransactionMeta> = {
  id: '123-456',
  chainId: '0x5',
};

const EXPECTED_ALERT = {
  isBlocking: true,
  key: 'signingOrSubmitting',
  message: 'A previous transaction is still being signed or submitted',
  reason: 'Submit In Progress',
  severity: Severity.Danger,
};

function buildState({
  transactions,
}: {
  transactions?: Partial<TransactionMeta>[];
} = {}) {
  return {
    ...mockState,
    metamask: {
      ...mockState.metamask,
      transactions,
    },
  };
}

function runHook({
  transactions,
}: {
  transactions?: Partial<TransactionMeta>[];
} = {}) {
  const state = buildState({ transactions });
  const response = renderHookWithProvider(useSigningOrSubmittingAlerts, state);

  return response.result.current;
}

describe('useSigningOrSubmittingAlerts', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns no alerts if no transactions', () => {
    expect(runHook()).toEqual([]);
  });

  it('returns no alerts if transaction on different chain', () => {
    expect(
      runHook({
        transactions: [
          {
            ...TRANSACTION_META_MOCK,
            status: TransactionStatus.approved,
            chainId: '0x6',
          },
        ],
      }),
    ).toEqual([]);
  });

  it('returns no alerts if transaction has alternate status', () => {
    expect(
      runHook({
        transactions: [
          { ...TRANSACTION_META_MOCK, status: TransactionStatus.submitted },
        ],
      }),
    ).toEqual([]);
  });

  it('returns alert if signed transaction', () => {
    const alerts = runHook({
      transactions: [
        { ...TRANSACTION_META_MOCK, status: TransactionStatus.signed },
      ],
    });

    expect(alerts).toEqual([EXPECTED_ALERT]);
  });

  it('returns alert if approved transaction', () => {
    const alerts = runHook({
      transactions: [
        { ...TRANSACTION_META_MOCK, status: TransactionStatus.approved },
      ],
    });

    expect(alerts).toEqual([EXPECTED_ALERT]);
  });
});
