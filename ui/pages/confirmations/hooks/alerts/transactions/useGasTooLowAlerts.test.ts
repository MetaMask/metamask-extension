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
const TRANSACTION_ID_MOCK_2 = '456-789';

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

function runHook({
  currentConfirmation,
  transaction,
}: {
  currentConfirmation?: Partial<TransactionMeta>;
  transaction?: Partial<TransactionMeta>;
} = {}) {
  const state = buildState({ currentConfirmation, transaction });
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

  it('returns no alerts if no transaction matching confirmation', () => {
    expect(
      runHook({
        currentConfirmation: { id: TRANSACTION_ID_MOCK },
        transaction: {
          id: TRANSACTION_ID_MOCK_2,
          txParams: {
            gas: '0x1',
          } as TransactionParams,
        },
      }),
    ).toEqual([]);
  });

  it('returns no alerts if transaction has sufficient gas', () => {
    expect(
      runHook({
        currentConfirmation: { id: TRANSACTION_ID_MOCK },
        transaction: {
          id: TRANSACTION_ID_MOCK,
          txParams: { gas: MIN_GAS_LIMIT_HEX } as TransactionParams,
        },
      }),
    ).toEqual([]);
  });

  it('returns alert if transaction has insufficient gas', () => {
    const alerts = runHook({
      currentConfirmation: { id: TRANSACTION_ID_MOCK },
      transaction: {
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
        message: 'Gas limit must be at least 21000',
        reason: 'Low Gas',
        severity: Severity.Danger,
      },
    ]);
  });
});
