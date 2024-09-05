import React, { ReactChildren } from 'react';
import { ApprovalType } from '@metamask/controller-utils';
import { TransactionMeta } from '@metamask/transaction-controller';

import { PriorityLevels } from '../../../../../../shared/constants/gas';
import { getMockConfirmState } from '../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { renderHookWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { Severity } from '../../../../../helpers/constants/design-system';
import {
  AlertActionKey,
  RowAlertKey,
} from '../../../../../components/app/confirm/info/row/constants';
import { GasFeeContextProvider } from '../../../../../contexts/gasFee';
import { useGasFeeLowAlerts } from './useGasFeeLowAlerts';

const TRANSACTION_ID_MOCK = '123-456';
const TRANSACTION_ID_MOCK_2 = '456-789';

const CONFIRMATION_MOCK = {
  ...genUnapprovedContractInteractionConfirmation({
    chainId: '0x5',
  }),
  id: TRANSACTION_ID_MOCK,
} as TransactionMeta;

function buildState({
  currentConfirmation,
  transaction,
}: {
  currentConfirmation?: TransactionMeta;
  transaction?: TransactionMeta;
} = {}) {
  let pendingApprovals = {};
  if (currentConfirmation) {
    pendingApprovals = {
      [currentConfirmation.id as string]: {
        id: currentConfirmation.id,
        type: ApprovalType.Transaction,
      },
    };
  }

  return getMockConfirmState({
    metamask: {
      pendingApprovals,
      transactions: transaction ? [transaction] : [],
    },
  });
}

function runHook(stateOptions?: Parameters<typeof buildState>[0]) {
  const state = buildState(stateOptions);
  const transaction = stateOptions?.transaction;

  const response = renderHookWithConfirmContextProvider(
    useGasFeeLowAlerts,
    state,
    '/',
    ({ children }: { children: ReactChildren }) => (
      <GasFeeContextProvider transaction={transaction}>
        {children}
      </GasFeeContextProvider>
    ),
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
          ...CONFIRMATION_MOCK,
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
          transaction: {
            ...CONFIRMATION_MOCK,
            id: TRANSACTION_ID_MOCK,
            userFeeLevel,
          },
        }),
      ).toEqual([]);
    },
  );

  it('returns alert if transaction has low user fee level', () => {
    const alerts = runHook({
      currentConfirmation: CONFIRMATION_MOCK,
      transaction: {
        ...CONFIRMATION_MOCK,
        id: TRANSACTION_ID_MOCK,
        userFeeLevel: PriorityLevels.low,
      },
    });

    expect(alerts).toEqual([
      {
        actions: [
          {
            key: AlertActionKey.ShowGasFeeModal,
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
