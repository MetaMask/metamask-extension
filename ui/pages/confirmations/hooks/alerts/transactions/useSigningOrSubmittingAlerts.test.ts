import {
  TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import mockState from '../../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../../test/lib/render-helpers';
import { useSigningOrSubmittingAlerts } from './useSigningOrSubmittingAlerts';

const TRANSACTION_META_MOCK: Partial<TransactionMeta> = {
  id: '123-456',
  chainId: '0x5',
};

const CONFIRMATION_MOCK = {
  type: TransactionType.contractInteraction,
};

function buildState({
  currentConfirmation,
  transactions,
}: {
  currentConfirmation?: Partial<TransactionMeta>;
  transactions?: Partial<TransactionMeta>[];
} = {}) {
  return {
    ...mockState,
    confirm: {
      currentConfirmation,
    },
    metamask: {
      ...mockState.metamask,
      transactions,
    },
  };
}

function runHook({
  currentConfirmation,
  transactions,
}: {
  currentConfirmation?: Partial<TransactionMeta>;
  transactions?: Partial<TransactionMeta>[];
} = {}) {
  const state = buildState({ currentConfirmation, transactions });
  const response = renderHookWithProvider(useSigningOrSubmittingAlerts, state);

  return response.result.current;
}

describe('useSigningOrSubmittingAlerts', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns no alerts if no confirmation', () => {
    expect(
      runHook({
        currentConfirmation: undefined,
        transactions: [TRANSACTION_META_MOCK],
      }),
    ).toEqual([]);
  });

  it('returns no alerts if no transactions', () => {
    expect(
      runHook({ currentConfirmation: CONFIRMATION_MOCK, transactions: [] }),
    ).toEqual([]);
  });

  it('doesnt return alerts if transaction on different chain because transaction type is not valid', () => {
    expect(
      runHook({
        currentConfirmation: CONFIRMATION_MOCK,
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
        currentConfirmation: CONFIRMATION_MOCK,
        transactions: [
          { ...TRANSACTION_META_MOCK, status: TransactionStatus.submitted },
        ],
      }),
    ).toEqual([]);
  });

  it('returns no alerts if confirmation has incorrect type', () => {
    expect(
      runHook({
        currentConfirmation: { type: TransactionType.signTypedData },
        transactions: [TRANSACTION_META_MOCK],
      }),
    ).toEqual([]);
  });

  it('doesnt return alert if signed transaction because type is not valid', () => {
    const alerts = runHook({
      currentConfirmation: CONFIRMATION_MOCK,
      transactions: [
        { ...TRANSACTION_META_MOCK, status: TransactionStatus.signed },
      ],
    });

    expect(alerts).toEqual([]);
  });

  it('doesnt return alert if approved transaction because type is not valid', () => {
    const alerts = runHook({
      currentConfirmation: CONFIRMATION_MOCK,
      transactions: [
        { ...TRANSACTION_META_MOCK, status: TransactionStatus.approved },
      ],
    });

    expect(alerts).toEqual([]);
  });
});
