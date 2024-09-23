import {
  TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import mockState from '../../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../../test/lib/render-helpers';
import { usePendingTransactionAlerts } from './usePendingTransactionAlerts';

const ACCOUNT_ADDRESS = '0x123';
const TRANSACTION_ID_MOCK = '123-456';

const TRANSACTION_META_MOCK: Partial<TransactionMeta> = {
  id: TRANSACTION_ID_MOCK,
  chainId: '0x5',
  status: TransactionStatus.submitted,
  txParams: {
    from: ACCOUNT_ADDRESS,
  },
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
      internalAccounts: {
        selectedAccount: '123',
        accounts: {
          '123': {
            address: ACCOUNT_ADDRESS,
          },
        },
      },
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
  const response = renderHookWithProvider(usePendingTransactionAlerts, state);

  return response.result.current;
}

describe('usePendingTransactionAlerts', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns no alerts if no confirmation', () => {
    expect(runHook({ transactions: [TRANSACTION_META_MOCK] })).toEqual([]);
  });

  it('returns no alerts if no transactions', () => {
    expect(
      runHook({ currentConfirmation: CONFIRMATION_MOCK, transactions: [] }),
    ).toEqual([]);
  });

  it('returns no alerts if transaction on different chain', () => {
    expect(
      runHook({
        currentConfirmation: CONFIRMATION_MOCK,
        transactions: [{ ...TRANSACTION_META_MOCK, chainId: '0x6' }],
      }),
    ).toEqual([]);
  });

  it('returns no alerts if transaction from different account', () => {
    expect(
      runHook({
        currentConfirmation: CONFIRMATION_MOCK,
        transactions: [
          { ...TRANSACTION_META_MOCK, txParams: { from: '0x456' } },
        ],
      }),
    ).toEqual([]);
  });

  it('returns no alerts if transaction has alternate status', () => {
    expect(
      runHook({
        currentConfirmation: CONFIRMATION_MOCK,
        transactions: [
          { ...TRANSACTION_META_MOCK, status: TransactionStatus.confirmed },
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

  it('returns no alert if submitted transaction because transaction type is not valid', () => {
    const alerts = runHook({
      currentConfirmation: CONFIRMATION_MOCK,
      transactions: [TRANSACTION_META_MOCK],
    });

    expect(alerts).toEqual([]);
  });
});
