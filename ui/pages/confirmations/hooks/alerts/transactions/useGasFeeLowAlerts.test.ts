import { TransactionMeta } from '@metamask/transaction-controller';
import { ReactChildren } from 'react';
import { Severity } from '../../../../../helpers/constants/design-system';
import {
  AlertActionKey,
  RowAlertKey,
} from '../../../../../components/app/confirm/info/row/constants';
import { renderHookWithProvider } from '../../../../../../test/lib/render-helpers';
import mockState from '../../../../../../test/data/mock-state.json';
import { PriorityLevels } from '../../../../../../shared/constants/gas';
import { GasFeeContextProvider } from '../../../../../contexts/gasFee';
import { useGasFeeLowAlerts } from './useGasFeeLowAlerts';

const TRANSACTION_ID_MOCK = '123-456';
const TRANSACTION_ID_MOCK_2 = '456-789';

const CONFIRMATION_MOCK = {
  id: TRANSACTION_ID_MOCK,
};

function buildState({
  currentConfirmation,
  transaction,
}: {
  currentConfirmation?: Partial<TransactionMeta>;
  transaction?: Partial<TransactionMeta>;
} = {}) {
  return {
    ...mockState,
    confirm: {
      currentConfirmation,
    },
    metamask: {
      ...mockState.metamask,
      transactions: transaction ? [transaction] : [],
    },
  };
}

function runHook(stateOptions?: Parameters<typeof buildState>[0]) {
  const state = buildState(stateOptions);
  const transaction = stateOptions?.transaction;

  const response = renderHookWithProvider(
    useGasFeeLowAlerts,
    state,
    '/',
    ({ children }: { children: ReactChildren }) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      GasFeeContextProvider({ transaction, children } as any),
  );

  return response.result.current;
}

describe('useGasFeeLowAlerts', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns no alerts if no confirmation', () => {
    expect(runHook()).toEqual([]);
  });

  it('returns no alerts if confirmation does not match gas fee context transaction', () => {
    expect(
      runHook({
        currentConfirmation: CONFIRMATION_MOCK,
        transaction: {
          id: TRANSACTION_ID_MOCK_2,
          userFeeLevel: PriorityLevels.low,
        },
      }),
    ).toEqual([]);
  });

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each(
    Object.values(PriorityLevels).filter(
      (level) => level !== PriorityLevels.low,
    ),
  )(
    'returns no alerts if transaction has %s user fee level',
    (userFeeLevel: PriorityLevels) => {
      expect(
        runHook({
          currentConfirmation: CONFIRMATION_MOCK,
          transaction: { id: TRANSACTION_ID_MOCK, userFeeLevel },
        }),
      ).toEqual([]);
    },
  );

  it('returns alert if transaction has low user fee level', () => {
    const alerts = runHook({
      currentConfirmation: CONFIRMATION_MOCK,
      transaction: {
        id: TRANSACTION_ID_MOCK,
        userFeeLevel: PriorityLevels.low,
      },
    });

    expect(alerts).toEqual([
      {
        actions: [
          {
            key: AlertActionKey.UpdateGasFee,
            label: 'Update gas options',
          },
        ],
        field: RowAlertKey.EstimatedFee,
        key: 'gasFeeLow',
        message:
          'When choosing a low fee, expect slower transactions and longer wait times. For faster transactions, choose Market or Aggressive fee options.',
        reason: 'Slow speed',
        severity: Severity.Warning,
      },
    ]);
  });
});
