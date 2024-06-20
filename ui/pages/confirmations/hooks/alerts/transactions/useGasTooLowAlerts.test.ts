import {
  TransactionMeta,
  TransactionParams,
} from '@metamask/transaction-controller';
import { toHex } from '@metamask/controller-utils';
import { Severity } from '../../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { renderHookWithProvider } from '../../../../../../test/lib/render-helpers';
import mockState from '../../../../../../test/data/mock-state.json';
import { MIN_GAS_LIMIT_DEC } from '../../../send/send.constants';
import { MIN_GAS_LIMIT_HEX } from '../../../../../../shared/constants/gas';
import { useGasTooLowAlerts } from './useGasTooLowAlerts';

const TRANSACTION_ID_MOCK = '123-456';

function buildState({
  currentConfirmation,
}: {
  currentConfirmation?: Partial<TransactionMeta>;
} = {}) {
  return {
    ...mockState,
    confirm: {
      currentConfirmation,
    },
  };
}

function runHook(stateOptions?: Parameters<typeof buildState>[0]) {
  const state = buildState(stateOptions);
  const response = renderHookWithProvider(useGasTooLowAlerts, state);

  return response.result.current;
}

describe('useGasTooLowAlerts', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns no alerts if no confirmation', () => {
    expect(runHook()).toEqual([]);
  });

  it('returns no alerts if no gas', () => {
    expect(
      runHook({
        currentConfirmation: {
          id: TRANSACTION_ID_MOCK,
          txParams: { gas: undefined } as TransactionParams,
        },
      }),
    ).toEqual([]);
  });

  it('returns no alerts if sufficient gas', () => {
    expect(
      runHook({
        currentConfirmation: {
          id: TRANSACTION_ID_MOCK,
          txParams: { gas: MIN_GAS_LIMIT_HEX } as TransactionParams,
        },
      }),
    ).toEqual([]);
  });

  it('returns alert if insufficient gas', () => {
    const alerts = runHook({
      currentConfirmation: {
        id: TRANSACTION_ID_MOCK,
        txParams: {
          gas: toHex(MIN_GAS_LIMIT_DEC.toNumber() - 1),
        } as TransactionParams,
      },
    });

    expect(alerts).toEqual([
      {
        field: RowAlertKey.EstimatedFee,
        isBlocking: true,
        key: 'gasTooLow',
        message:
          'To continue with this transaction, you’ll need to increase the gas limit to 21000 or higher.',
        reason: 'Low gas limit',
        severity: Severity.Danger,
      },
    ]);
  });
});
