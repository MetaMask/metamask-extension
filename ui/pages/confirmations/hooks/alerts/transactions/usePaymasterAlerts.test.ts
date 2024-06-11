import { TransactionMeta } from '@metamask/transaction-controller';
import {
  UserOperation,
  UserOperationMetadata,
} from '@metamask/user-operation-controller';
import { Severity } from '../../../../../helpers/constants/design-system';
import { renderHookWithProvider } from '../../../../../../test/lib/render-helpers';
import mockState from '../../../../../../test/data/mock-state.json';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { usePaymasterAlerts } from './usePaymasterAlerts';

const USER_OPERATION_ID_MOCK = '123-456';
const USER_OPERATION_ID_2_MOCK = '456-789';

function buildState({
  currentConfirmation,
  transaction,
  userOperation,
}: {
  currentConfirmation?: Partial<TransactionMeta>;
  transaction?: Partial<TransactionMeta>;
  userOperation?: Partial<UserOperationMetadata>;
} = {}) {
  return {
    ...mockState,
    confirm: {
      currentConfirmation,
    },
    metamask: {
      ...mockState.metamask,
      transactions: transaction ? [transaction] : [],
      userOperations: userOperation
        ? { [userOperation.id as string]: userOperation }
        : {},
    },
  };
}

function runHook({
  currentConfirmation,
  transaction,
  userOperation,
}: {
  currentConfirmation?: Partial<TransactionMeta>;
  transaction?: Partial<TransactionMeta>;
  userOperation?: Partial<UserOperationMetadata>;
} = {}) {
  const state = buildState({ currentConfirmation, transaction, userOperation });
  const response = renderHookWithProvider(usePaymasterAlerts, state);

  return response.result.current;
}

describe('usePaymasterAlerts', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns no alerts if no confirmation', () => {
    expect(runHook()).toEqual([]);
  });

  it('returns no alerts if no transaction matching confirmation', () => {
    expect(
      runHook({
        currentConfirmation: { id: USER_OPERATION_ID_MOCK },
        transaction: { id: USER_OPERATION_ID_2_MOCK },
        userOperation: {
          id: USER_OPERATION_ID_MOCK,
          userOperation: { paymasterAndData: '0x1' } as UserOperation,
        },
      }),
    ).toEqual([]);
  });

  it('returns no alerts if no user operation matching transaction', () => {
    expect(
      runHook({
        currentConfirmation: { id: USER_OPERATION_ID_MOCK },
        transaction: { id: USER_OPERATION_ID_MOCK },
        userOperation: {
          id: USER_OPERATION_ID_2_MOCK,
          userOperation: { paymasterAndData: '0x1' } as UserOperation,
        },
      }),
    ).toEqual([]);
  });

  it('returns no alerts if confirmation is not user operation', () => {
    expect(
      runHook({
        currentConfirmation: {
          id: USER_OPERATION_ID_MOCK,
        },
        transaction: { id: USER_OPERATION_ID_MOCK, isUserOperation: false },
        userOperation: {
          id: USER_OPERATION_ID_MOCK,
          userOperation: { paymasterAndData: '0x1' } as UserOperation,
        },
      }),
    ).toEqual([]);
  });

  it('returns alert if user operation has paymaster', () => {
    const alerts = runHook({
      currentConfirmation: {
        id: USER_OPERATION_ID_MOCK,
      },
      transaction: {
        id: USER_OPERATION_ID_MOCK,
        isUserOperation: true,
      },
      userOperation: {
        id: USER_OPERATION_ID_MOCK,
        userOperation: { paymasterAndData: '0x1' } as UserOperation,
      },
    });

    expect(alerts).toEqual([
      {
        field: RowAlertKey.EstimatedFee,
        key: 'usingPaymaster',
        message: 'The gas for this transaction will be paid by a paymaster.',
        reason: 'Using Paymaster',
        severity: Severity.Info,
      },
    ]);
  });
});
