import { useGasEstimateFailedAlerts } from './useGasEstimateFailedAlerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { renderHookWithProvider } from '../../../../../../test/lib/render-helpers';
import mockState from '../../../../../../test/data/mock-state.json';
import {
  TransactionMeta,
  TransactionStatus,
} from '@metamask/transaction-controller';
import { usePaymasterAlerts } from './usePaymasterAlerts';
import {
  UserOperation,
  UserOperationMetadata,
} from '@metamask/user-operation-controller';
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

function buildState({
  transactions,
}: {
  transactions?: Partial<TransactionMeta>[];
} = {}) {
  return {
    ...mockState,
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
  transactions,
}: {
  transactions?: Partial<TransactionMeta>[];
} = {}) {
  const state = buildState({ transactions });
  const response = renderHookWithProvider(usePendingTransactionAlerts, state);

  return response.result.current;
}

describe('usePendingTransactionAlerts', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns no alerts if no transactions', () => {
    expect(runHook()).toEqual([]);
  });

  it('returns no alerts if transaction on different chain', () => {
    expect(
      runHook({
        transactions: [{ ...TRANSACTION_META_MOCK, chainId: '0x6' }],
      }),
    ).toEqual([]);
  });

  it('returns no alerts if transaction from different account', () => {
    expect(
      runHook({
        transactions: [
          { ...TRANSACTION_META_MOCK, txParams: { from: '0x456' } },
        ],
      }),
    ).toEqual([]);
  });

  it('returns no alerts if transaction has alternate status', () => {
    expect(
      runHook({
        transactions: [
          { ...TRANSACTION_META_MOCK, status: TransactionStatus.confirmed },
        ],
      }),
    ).toEqual([]);
  });

  it('returns alert if single submitted transaction', () => {
    const alerts = runHook({
      transactions: [TRANSACTION_META_MOCK],
    });

    expect(alerts).toEqual([
      {
        key: 'pendingTransactions',
        message:
          'You have (1) pending transaction. This transaction will not process until that one is complete.',
        reason: 'Pending Transactions',
        severity: Severity.Warning,
      },
    ]);
  });

  it('returns alert if multiple submitted transactions', () => {
    const alerts = runHook({
      transactions: [TRANSACTION_META_MOCK, TRANSACTION_META_MOCK],
    });

    expect(alerts).toEqual([
      {
        key: 'pendingTransactions',
        message:
          'You have (2) pending transactions. This transaction will not process until that one is complete.',
        reason: 'Pending Transactions',
        severity: Severity.Warning,
      },
    ]);
  });
});
