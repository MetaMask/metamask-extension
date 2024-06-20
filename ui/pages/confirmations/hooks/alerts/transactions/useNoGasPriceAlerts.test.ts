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
}: {
  currentConfirmation?: Partial<TransactionMeta>;
  gasEstimateType?: GasEstimateTypes;
} = {}) {
  return {
    ...mockState,
    confirm: {
      currentConfirmation,
    },
    metamask: {
      ...mockState.metamask,
      gasEstimateType,
    },
  };
}

function runHook(stateOptions?: Parameters<typeof buildState>[0]) {
  const state = buildState(stateOptions);
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

  it('returns no alerts if transaction has custom gas fee and no fee estimate', () => {
    expect(
      runHook({
        currentConfirmation: {
          id: TRANSACTION_ID_MOCK,
          userFeeLevel: UserFeeLevel.CUSTOM,
        },
        gasEstimateType: GasEstimateTypes.none,
      }),
    ).toEqual([]);
  });

  it('returns no alerts if transaction has dApp suggested gas fee and no fee estimate', () => {
    expect(
      runHook({
        currentConfirmation: {
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
        gasEstimateType: GasEstimateTypes.none,
      }),
    ).toEqual([]);
  });

  it('returns no alerts if gas fee is not custom and has fee estimate', () => {
    expect(
      runHook({
        currentConfirmation: {
          id: TRANSACTION_ID_MOCK,
          userFeeLevel: UserFeeLevel.MEDIUM,
        },
        gasEstimateType: GasEstimateTypes.feeMarket,
      }),
    ).toEqual([]);
  });

  it('returns alert if gas fee is not custom and no fee estimate', () => {
    const alerts = runHook({
      currentConfirmation: {
        id: TRANSACTION_ID_MOCK,
        userFeeLevel: UserFeeLevel.MEDIUM,
      },
      gasEstimateType: GasEstimateTypes.none,
    });

    expect(alerts).toEqual([
      {
        field: RowAlertKey.EstimatedFee,
        isBlocking: true,
        key: 'noGasPrice',
        message:
          'We can’t move forward with this transaction until you manually update the fee.',
        reason: 'Fee estimate unavailable',
        severity: Severity.Danger,
      },
    ]);
  });
});
