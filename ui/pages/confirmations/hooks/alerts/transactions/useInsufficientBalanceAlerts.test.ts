import {
  TransactionMeta,
  TransactionParams,
} from '@metamask/transaction-controller';
import { Severity } from '../../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { renderHookWithProvider } from '../../../../../../test/lib/render-helpers';
import mockState from '../../../../../../test/data/mock-state.json';
import { useInsufficientBalanceAlerts } from './useInsufficientBalanceAlerts';
import { createMockInternalAccount } from '../../../../../../test/jest/mocks';

const TRANSACTION_ID_MOCK = '123-456';
const TRANSACTION_ID_MOCK_2 = '456-789';

const TRANSACTION_MOCK = {
  id: TRANSACTION_ID_MOCK,
  txParams: {
    from: '0x123',
    value: '0x2',
    maxFeePerGas: '0x2',
    gas: '0x3',
  } as TransactionParams,
};

function buildState({
  balance,
  currentConfirmation,
  transaction,
}: {
  balance?: number;
  currentConfirmation?: Partial<TransactionMeta>;
  transaction?: Partial<TransactionMeta>;
} = {}) {
  const accountAddress = transaction?.txParams?.from as string;
  const mockAccount = createMockInternalAccount({
    address: accountAddress,
    name: 'Account 1',
  });

  return {
    ...mockState,
    confirm: {
      currentConfirmation,
    },
    metamask: {
      ...mockState.metamask,
      internalAccounts: {
        accounts:
          balance && transaction
            ? {
                [mockAccount.id]: {
                  ...mockAccount,
                  balance,
                },
              }
            : {},
      },
      transactions: transaction ? [transaction] : [],
    },
  };
}

function runHook(stateOptions?: Parameters<typeof buildState>[0]) {
  const state = buildState(stateOptions);
  const response = renderHookWithProvider(useInsufficientBalanceAlerts, state);

  return response.result.current;
}

describe('useInsufficientBalanceAlerts', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns no alerts if no confirmation', () => {
    expect(runHook()).toEqual([]);
  });

  it('returns no alerts if no transaction matching confirmation', () => {
    expect(
      runHook({
        balance: 7,
        currentConfirmation: { id: TRANSACTION_ID_MOCK },
        transaction: {
          ...TRANSACTION_MOCK,
          id: TRANSACTION_ID_MOCK_2,
        },
      }),
    ).toEqual([]);
  });

  it('returns no alerts if account has balance equal to gas fee plus value', () => {
    expect(
      runHook({
        balance: 8,
        currentConfirmation: { id: TRANSACTION_ID_MOCK },
        transaction: TRANSACTION_MOCK,
      }),
    ).toEqual([]);
  });

  it('returns no alerts if account has balance greater than gas fee plus value', () => {
    expect(
      runHook({
        balance: 9,
        currentConfirmation: { id: TRANSACTION_ID_MOCK },
        transaction: TRANSACTION_MOCK,
      }),
    ).toEqual([]);
  });

  it('returns alert if account has balance less than gas fee plus value', () => {
    const alerts = runHook({
      balance: 7,
      currentConfirmation: { id: TRANSACTION_ID_MOCK },
      transaction: TRANSACTION_MOCK,
    });

    expect(alerts).toEqual([
      {
        actions: [
          {
            key: 'buy',
            label: 'Buy ETH',
          },
        ],
        field: RowAlertKey.EstimatedFee,
        isBlocking: true,
        key: 'insufficientBalance',
        message:
          'You do not have enough ETH in your account to pay for transaction fees.',
        reason: 'Insufficient funds',
        severity: Severity.Danger,
      },
    ]);
  });
});
