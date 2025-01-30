import {
  TransactionMeta,
  TransactionParams,
} from '@metamask/transaction-controller';
import { toHex } from '@metamask/controller-utils';

import { MIN_GAS_LIMIT_HEX } from '../../../../../../shared/constants/gas';
import {
  getMockConfirmState,
  getMockConfirmStateForTransaction,
} from '../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { renderHookWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { Severity } from '../../../../../helpers/constants/design-system';
import {
  AlertActionKey,
  RowAlertKey,
} from '../../../../../components/app/confirm/info/row/constants';
import { MIN_GAS_LIMIT_DEC } from '../../../send/send.constants';
import { Confirmation } from '../../../types/confirm';
import { useGasTooLowAlerts } from './useGasTooLowAlerts';

const CONFIRMATION_MOCK = genUnapprovedContractInteractionConfirmation({
  chainId: '0x5',
}) as TransactionMeta;

function runHook(confirmation?: Confirmation) {
  const state = confirmation
    ? getMockConfirmStateForTransaction(confirmation)
    : getMockConfirmState();
  const response = renderHookWithConfirmContextProvider(
    useGasTooLowAlerts,
    state,
  );

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
        ...CONFIRMATION_MOCK,
        txParams: { gas: undefined } as TransactionParams,
      }),
    ).toEqual([]);
  });

  it('returns no alerts if sufficient gas', () => {
    expect(
      runHook({
        ...CONFIRMATION_MOCK,
        txParams: { gas: MIN_GAS_LIMIT_HEX } as TransactionParams,
      }),
    ).toEqual([]);
  });

  it('returns alert if insufficient gas', () => {
    const alerts = runHook({
      ...CONFIRMATION_MOCK,
      txParams: {
        gas: toHex(MIN_GAS_LIMIT_DEC.toNumber() - 1),
      } as TransactionParams,
    });

    expect(alerts).toEqual([
      {
        actions: [
          {
            key: AlertActionKey.ShowAdvancedGasFeeModal,
            label: 'Update gas limit',
          },
        ],
        field: RowAlertKey.EstimatedFee,
        isBlocking: true,
        key: 'gasTooLow',
        message:
          'To continue with this transaction, you’ll need to increase the gas limit to 21000 or higher.',
        reason: 'Low gas limit',
        severity: Severity.Warning,
      },
    ]);
  });
});
