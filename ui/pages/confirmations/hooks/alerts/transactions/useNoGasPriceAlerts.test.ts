import {
  TransactionMeta,
  TransactionParams,
  UserFeeLevel,
} from '@metamask/transaction-controller';
import { GasEstimateTypes } from '../../../../../../shared/constants/gas';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import {
  getMockConfirmState,
  getMockConfirmStateForTransaction,
} from '../../../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { Severity } from '../../../../../helpers/constants/design-system';
import {
  AlertActionKey,
  RowAlertKey,
} from '../../../../../components/app/confirm/info/row/constants';
import { useNoGasPriceAlerts } from './useNoGasPriceAlerts';

const CONFIRMATION_MOCK = genUnapprovedContractInteractionConfirmation({
  chainId: '0x5',
}) as TransactionMeta;

function runHook(state: Record<string, unknown>) {
  const response = renderHookWithConfirmContextProvider(
    useNoGasPriceAlerts,
    state,
  );

  return response.result.current;
}

describe('useNoGasPriceAlerts', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns no alerts if no confirmation', () => {
    expect(runHook(getMockConfirmState())).toEqual([]);
  });

  it('returns no alerts if transaction has custom gas fee and no fee estimate', () => {
    expect(
      runHook(
        getMockConfirmStateForTransaction(
          {
            ...CONFIRMATION_MOCK,
            userFeeLevel: UserFeeLevel.CUSTOM,
          },
          {
            metamask: {
              gasEstimateType: GasEstimateTypes.none,
            },
          },
        ),
      ),
    ).toEqual([]);
  });

  it('returns no alerts if transaction has dApp suggested gas fee and no fee estimate', () => {
    expect(
      runHook(
        getMockConfirmStateForTransaction(
          {
            ...CONFIRMATION_MOCK,
            dappSuggestedGasFees: {
              maxFeePerGas: '0x2',
              maxPriorityFeePerGas: '0x1',
            },
            txParams: {
              maxFeePerGas: '0x2',
              maxPriorityFeePerGas: '0x1',
            } as TransactionParams,
          },
          {
            metamask: {
              gasEstimateType: GasEstimateTypes.none,
            },
          },
        ),
      ),
    ).toEqual([]);
  });

  it('returns no alerts if gas fee is not custom and has fee estimate', () => {
    expect(
      runHook(
        getMockConfirmStateForTransaction(
          {
            ...CONFIRMATION_MOCK,
            userFeeLevel: UserFeeLevel.MEDIUM,
          },
          {
            metamask: {
              gasEstimateType: GasEstimateTypes.feeMarket,
            },
          },
        ),
      ),
    ).toEqual([]);
  });

  it('returns alert if gas fee is not custom and no fee estimate', () => {
    const alerts = runHook(
      getMockConfirmStateForTransaction(
        {
          ...CONFIRMATION_MOCK,
          userFeeLevel: UserFeeLevel.MEDIUM,
        },
        {
          metamask: {
            gasEstimateType: GasEstimateTypes.none,
          },
        },
      ),
    );

    expect(alerts).toEqual([
      {
        actions: [
          {
            key: AlertActionKey.ShowAdvancedGasFeeModal,
            label: 'Update fee',
          },
        ],
        field: RowAlertKey.EstimatedFee,
        isBlocking: true,
        key: 'noGasPrice',
        message:
          'We can’t move forward with this transaction until you manually update the fee.',
        reason: 'Fee estimate unavailable',
        severity: Severity.Warning,
      },
    ]);
  });
});
