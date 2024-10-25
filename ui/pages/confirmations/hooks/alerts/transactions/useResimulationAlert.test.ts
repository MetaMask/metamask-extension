import { ApprovalType } from '@metamask/controller-utils';
import {
  TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';

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
  status: TransactionStatus.submitted,
  type: TransactionType.contractInteraction,
  txParams: {
    from: ACCOUNT_ADDRESS,
  },
  time: new Date().getTime() - 10000,
  simulationData: {
    isReSimulatedDueToSecurity: true,
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

  it('returns no alerts if isReSimulatedDueToSecurity is false', () => {
    const notResimulatedConfirmation = {
      ...TRANSACTION_META_MOCK,
      simulationData: {
        isReSimulatedDueToSecurity: false,
      },
    };
    expect(
      runHook({
        currentConfirmation: notResimulatedConfirmation,
      }),
    ).toEqual([]);
  });

  it('returns alert if isReSimulatedDueToSecurity is true', () => {
    const resimulatedConfirmation = {
      ...CONFIRMATION_MOCK,
      simulationData: {
        isReSimulatedDueToSecurity: true,
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
          'Simulation results have changed and reflect loss of assets. Please review the changes before you proceed.',
        reason: 'Change in Simulation results',
        severity: Severity.Danger,
      },
    ]);
  });
});
