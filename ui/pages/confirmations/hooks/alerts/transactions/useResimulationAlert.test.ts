import { ApprovalType } from '@metamask/controller-utils';
import {
  TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';

import { ORIGIN_METAMASK } from '../../../../../../shared/constants/app';
import { getMockConfirmState } from '../../../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { Severity } from '../../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { useResimulationAlert } from './useResimulationAlert';

const ACCOUNT_ADDRESS = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';
const TRANSACTION_ID_MOCK = '123-456';

const CONFIRMATION_MOCK = genUnapprovedContractInteractionConfirmation({
  chainId: '0x5',
}) as TransactionMeta;

const TRANSACTION_META_MOCK = {
  id: TRANSACTION_ID_MOCK,
  chainId: '0x5',
  networkClientId: 'testNetworkClientId',
  status: TransactionStatus.submitted,
  type: TransactionType.contractInteraction,
  txParams: {
    from: ACCOUNT_ADDRESS,
  },
  time: new Date().getTime() - 10000,
  simulationData: {
    isUpdatedAfterSecurityCheck: true,
    tokenBalanceChanges: [],
  },
} as TransactionMeta;

function runHook({
  currentConfirmation,
  transactions = [],
}: {
  currentConfirmation?: TransactionMeta;
  transactions?: TransactionMeta[];
} = {}) {
  let pendingApprovals = {};
  if (currentConfirmation) {
    pendingApprovals = {
      [currentConfirmation.id as string]: {
        id: currentConfirmation.id,
        type: ApprovalType.Transaction,
      },
    };
    transactions.push(currentConfirmation);
  }
  const state = getMockConfirmState({
    metamask: {
      pendingApprovals,
      transactions,
    },
  });
  const response = renderHookWithConfirmContextProvider(
    useResimulationAlert,
    state,
  );

  return response.result.current;
}

describe('useResimulationAlert', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns no alerts if no confirmation', () => {
    expect(runHook()).toEqual([]);
  });

  it('returns no alerts if no transactions', () => {
    expect(
      runHook({
        currentConfirmation: CONFIRMATION_MOCK,
        transactions: [],
      }),
    ).toEqual([]);
  });

  it('returns no alerts if isUpdatedAfterSecurityCheck is false', () => {
    const notResimulatedConfirmation = {
      ...TRANSACTION_META_MOCK,
      simulationData: {
        isUpdatedAfterSecurityCheck: false,
        tokenBalanceChanges: [],
      },
    };
    expect(
      runHook({
        currentConfirmation: notResimulatedConfirmation,
      }),
    ).toEqual([]);
  });

  it('returns no alerts if transaction is wallet initiated', () => {
    const walletInitiatedConfirmation = {
      ...TRANSACTION_META_MOCK,
      origin: ORIGIN_METAMASK,
    };
    expect(
      runHook({ currentConfirmation: walletInitiatedConfirmation }),
    ).toEqual([]);
  });

  it('returns alert if isUpdatedAfterSecurityCheck is true', () => {
    const resimulatedConfirmation = {
      ...CONFIRMATION_MOCK,
      simulationData: {
        isUpdatedAfterSecurityCheck: true,
        tokenBalanceChanges: [],
      },
    };
    const alerts = runHook({
      currentConfirmation: resimulatedConfirmation,
    });

    expect(alerts).toEqual([
      {
        actions: [],
        field: RowAlertKey.Resimulation,
        isBlocking: false,
        key: 'simulationDetailsTitle',
        message:
          'Estimated changes for this transaction have been updated. Review them closely before proceeding.',
        reason: 'Results have changed',
        severity: Severity.Danger,
      },
    ]);
  });
});
