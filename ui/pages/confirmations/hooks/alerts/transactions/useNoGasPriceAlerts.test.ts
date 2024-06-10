import {
  TransactionMeta,
  TransactionParams,
  UserFeeLevel,
} from '@metamask/transaction-controller';
import { Severity } from '../../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { renderHookWithProvider } from '../../../../../../test/lib/render-helpers';
import mockState from '../../../../../../test/data/mock-state.json';
import { GasEstimateTypes } from '../../../../../../shared/constants/gas';
import { useNoGasPriceAlerts } from './useNoGasPriceAlerts';

const TRANSACTION_ID_MOCK = '123-456';

function buildState({
  currentConfirmation,
  gasEstimateType,
  transaction,
}: {
  currentConfirmation?: Partial<TransactionMeta>;
  gasEstimateType?: GasEstimateTypes;
  transaction?: Partial<TransactionMeta>;
} = {}) {
  return {
    ...mockState,
    confirm: {
      currentConfirmation,
    },
    metamask: {
      ...mockState.metamask,
      gasEstimateType,
      transactions: transaction ? [transaction] : [],
    },
  };
}

function runHook({
  currentConfirmation,
  gasEstimateType,
  transaction,
}: {
  currentConfirmation?: Partial<TransactionMeta>;
  gasEstimateType?: GasEstimateTypes;
  transaction?: Partial<TransactionMeta>;
} = {}) {
  const state = buildState({
    currentConfirmation,
    gasEstimateType,
    transaction,
  });

  const response = renderHookWithProvider(useNoGasPriceAlerts, state);

  return response.result.current;
}

describe('useNoGasPriceAlerts', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns no alerts if no confirmation', () => {
    expect(runHook()).toEqual([]);
  });

  it('returns no alerts if no transaction matching confirmation', () => {
    expect(
      runHook({
        currentConfirmation: { id: TRANSACTION_ID_MOCK },
        transaction: {
          id: TRANSACTION_ID_MOCK,
          userFeeLevel: UserFeeLevel.MEDIUM,
        },
      }),
    ).toEqual([]);
  });

  it('returns no alerts if transaction has custom gas fee and no fee estimate', () => {
    expect(
      runHook({
        currentConfirmation: { id: TRANSACTION_ID_MOCK },
        gasEstimateType: GasEstimateTypes.none,
        transaction: {
          id: TRANSACTION_ID_MOCK,
          userFeeLevel: UserFeeLevel.CUSTOM,
        },
      }),
    ).toEqual([]);
  });

  it('returns no alerts if transaction has dApp suggested gas fee and no fee estimate', () => {
    expect(
      runHook({
        currentConfirmation: { id: TRANSACTION_ID_MOCK },
        gasEstimateType: GasEstimateTypes.none,
        transaction: {
          id: TRANSACTION_ID_MOCK,
          dappSuggestedGasFees: {
            maxFeePerGas: '0x2',
            maxPriorityFeePerGas: '0x1',
          },
          txParams: {
            maxFeePerGas: '0x2',
            maxPriorityFeePerGas: '0x1',
          } as TransactionParams,
        },
      }),
    ).toEqual([]);
  });

  it('returns no alerts if gas fee is not custom and has fee estimate', () => {
    expect(
      runHook({
        currentConfirmation: { id: TRANSACTION_ID_MOCK },
        gasEstimateType: GasEstimateTypes.feeMarket,
        transaction: {
          id: TRANSACTION_ID_MOCK,
          userFeeLevel: UserFeeLevel.MEDIUM,
        },
      }),
    ).toEqual([]);
  });

  it('returns alert if gas fee is not custom and no fee estimate', () => {
    const alerts = runHook({
      currentConfirmation: { id: TRANSACTION_ID_MOCK },
      gasEstimateType: GasEstimateTypes.none,
      transaction: {
        id: TRANSACTION_ID_MOCK,
        userFeeLevel: UserFeeLevel.MEDIUM,
      },
    });

    expect(alerts).toEqual([
      {
        field: RowAlertKey.EstimatedFee,
        isBlocking: true,
        key: 'noGasPrice',
        message: 'Gas price estimation failed due to network error.',
        reason: 'No Gas Price',
        severity: Severity.Danger,
      },
    ]);
  });
});
