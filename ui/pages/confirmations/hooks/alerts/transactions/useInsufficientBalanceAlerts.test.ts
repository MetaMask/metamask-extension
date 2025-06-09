import { ApprovalType } from '@metamask/controller-utils';
import {
  TransactionMeta,
  TransactionParams,
  TransactionType,
} from '@metamask/transaction-controller';
import { createMockInternalAccount } from '../../../../../../test/jest/mocks';
import { getMockConfirmState } from '../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { renderHookWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { useInsufficientBalanceAlerts } from './useInsufficientBalanceAlerts';

const TRANSACTION_ID_MOCK = '123-456';
const TRANSACTION_ID_MOCK_2 = '456-789';

const TRANSACTION_MOCK = {
  ...genUnapprovedContractInteractionConfirmation({
    chainId: '0x5',
  }),
  id: TRANSACTION_ID_MOCK,
  txParams: {
    from: '0x123',
    value: '0x2',
    maxFeePerGas: '0x2',
    gas: '0x3',
  } as TransactionParams,
} as TransactionMeta;

const ALERT = [
  {
    actions: [
      {
        key: 'buy',
        label: 'Buy ETH',
      },
    ],
    field: 'estimatedFee',
    isBlocking: true,
    key: 'insufficientBalance',
    message:
      'You do not have enough ETH in your account to pay for network fees.',
    reason: 'Insufficient funds',
    severity: 'danger',
  },
];

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

  let pendingApprovals = {};
  if (currentConfirmation) {
    pendingApprovals = {
      [currentConfirmation.id as string]: {
        id: currentConfirmation.id,
        type: ApprovalType.Transaction,
      },
    };
  }

  return getMockConfirmState({
    metamask: {
      pendingApprovals,
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
  });
}

function runHook(stateOptions?: Parameters<typeof buildState>[0]) {
  const state = buildState(stateOptions);
  const response = renderHookWithConfirmContextProvider(
    useInsufficientBalanceAlerts,
    state,
  );

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
        currentConfirmation: TRANSACTION_MOCK,
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
        balance: 210000000002,
        currentConfirmation: TRANSACTION_MOCK,
        transaction: TRANSACTION_MOCK,
      }),
    ).toEqual([]);
  });

  it('returns alerts for batch transaction if account has balance less than total of the transactions in the batch', () => {
    const BATCH_TRANSACTION_MOCK = {
      ...TRANSACTION_MOCK,
      nestedTransactions: [
        {
          to: '0x1234567890123456789012345678901234567890',
          value: '0x3B9ACA00',
          type: TransactionType.simpleSend,
        },
        {
          to: '0x1234567890123456789012345678901234567891',
          value: '0x1DCD6500',
          type: TransactionType.simpleSend,
        },
      ],
    };
    expect(
      runHook({
        balance: 210000000002,
        currentConfirmation: TRANSACTION_MOCK as Partial<TransactionMeta>,
        transaction: TRANSACTION_MOCK as Partial<TransactionMeta>,
      }),
    ).toEqual([]);
    expect(
      runHook({
        balance: 210000000002,
        currentConfirmation: BATCH_TRANSACTION_MOCK as Partial<TransactionMeta>,
        transaction: BATCH_TRANSACTION_MOCK as Partial<TransactionMeta>,
      }),
    ).toEqual(ALERT);
  });

  it('returns no alerts if account has balance greater than gas fee plus value', () => {
    expect(
      runHook({
        balance: 400000000000,
        currentConfirmation: TRANSACTION_MOCK,
        transaction: TRANSACTION_MOCK,
      }),
    ).toEqual([]);
  });

  it('returns no alerts if account has balance less than gas fee plus value but gas fee token is selected', () => {
    const alerts = runHook({
      balance: 7,
      currentConfirmation: TRANSACTION_MOCK,
      transaction: { ...TRANSACTION_MOCK, selectedGasFeeToken: '0x123' },
    });

    expect(alerts).toEqual([]);
  });

  it('returns alert if account has balance less than gas fee plus value', () => {
    const alerts = runHook({
      balance: 7,
      currentConfirmation: TRANSACTION_MOCK,
      transaction: TRANSACTION_MOCK,
    });

    expect(alerts).toEqual(ALERT);
  });
});
