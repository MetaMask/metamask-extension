import { useGasEstimateFailedAlerts } from './useGasEstimateFailedAlerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { renderHookWithProvider } from '../../../../../../test/lib/render-helpers';
import mockState from '../../../../../../test/data/mock-state.json';
import {
  TransactionEnvelopeType,
  TransactionMeta,
  TransactionStatus,
  TransactionType,
  UserFeeLevel,
} from '@metamask/transaction-controller';
import { useGasFeeLowAlerts } from './useGasFeeLowAlerts';
import { PriorityLevels } from '../../../../../../shared/constants/gas';
import { GasFeeContextProvider } from '../../../../../contexts/gasFee';

function buildState({
  transaction,
}: {
  transaction?: Partial<TransactionMeta>;
} = {}) {
  return {
    ...mockState,
    metamask: {
      ...mockState.metamask,
      transactions: transaction ? [transaction] : [],
    },
  };
}

function runHook({
  transaction,
}: {
  currentConfirmation?: Partial<TransactionMeta>;
  transaction?: Partial<TransactionMeta>;
} = {}) {
  const state = buildState({ transaction });
  const response = renderHookWithProvider(
    useGasFeeLowAlerts,
    state,
    '/',
    ({ children }: any) =>
      GasFeeContextProvider({ transaction, children } as any),
  );

  return response.result.current;
}

describe('useGasFeeLowAlerts', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns no alerts if no transaction', () => {
    expect(runHook()).toEqual([]);
  });

  it.each(
    Object.values(PriorityLevels).filter(
      (level) => level !== PriorityLevels.low,
    ),
  )(
    'returns no alerts if transaction has %s user fee level',
    (userFeeLevel) => {
      expect(runHook({ transaction: { userFeeLevel } })).toEqual([]);
    },
  );

  it('returns alert if transaction has low user fee level', () => {
    const alerts = runHook({
      transaction: {
        userFeeLevel: PriorityLevels.low,
      },
    });

    expect(alerts).toEqual([
      {
        field: RowAlertKey.EstimatedFee,
        key: 'gasFeeLow',
        message: 'Future transactions will queue after this one.',
        reason: 'Low Gas Fee',
        severity: Severity.Warning,
      },
    ]);
  });
});
