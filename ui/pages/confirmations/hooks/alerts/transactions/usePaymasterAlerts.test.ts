import { useGasEstimateFailedAlerts } from './useGasEstimateFailedAlerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { renderHookWithProvider } from '../../../../../../test/lib/render-helpers';
import mockState from '../../../../../../test/data/mock-state.json';
import { TransactionMeta } from '@metamask/transaction-controller';
import { usePaymasterAlerts } from './usePaymasterAlerts';
import {
  UserOperation,
  UserOperationMetadata,
} from '@metamask/user-operation-controller';

const USER_OPERATION_ID_MOCK = '123-456';
const USER_OPERATION_ID_2_MOCK = '456-789';

function buildState({
  confirmTransaction,
  userOperation,
}: {
  confirmTransaction?: Partial<TransactionMeta>;
  userOperation?: Partial<UserOperationMetadata>;
} = {}) {
  return {
    ...mockState,
    confirmTransaction: {
      txData: confirmTransaction,
    },
    metamask: {
      ...mockState.metamask,
      userOperations: userOperation
        ? { [userOperation.id as string]: userOperation }
        : {},
    },
  };
}

function runHook({
  confirmTransaction,
  userOperation,
}: {
  confirmTransaction?: Partial<TransactionMeta>;
  userOperation?: Partial<UserOperationMetadata>;
} = {}) {
  const state = buildState({ confirmTransaction, userOperation });
  const response = renderHookWithProvider(usePaymasterAlerts, state);

  return response.result.current;
}

describe('usePaymasterAlerts', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns no alerts if no confirm transaction', () => {
    expect(runHook()).toEqual([]);
  });

  it('returns no alerts if no user operation matching confirm transaction', () => {
    expect(
      runHook({
        confirmTransaction: { id: USER_OPERATION_ID_MOCK },
        userOperation: {
          id: USER_OPERATION_ID_2_MOCK,
          userOperation: { paymasterAndData: '0x1' } as UserOperation,
        },
      }),
    ).toEqual([]);
  });

  it('returns no alerts if confirm transaction is not user operation', () => {
    expect(
      runHook({
        confirmTransaction: {
          id: USER_OPERATION_ID_MOCK,
          isUserOperation: false,
        },
        userOperation: {
          id: USER_OPERATION_ID_MOCK,
          userOperation: { paymasterAndData: '0x1' } as UserOperation,
        },
      }),
    ).toEqual([]);
  });

  it('returns alert if user operation has paymaster', () => {
    const alerts = runHook({
      confirmTransaction: { id: USER_OPERATION_ID_MOCK, isUserOperation: true },
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
