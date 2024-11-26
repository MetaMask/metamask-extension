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
import { useFirstTimeInteractionAlert } from './useFirstTimeInteractionAlert';

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
  firstTimeInteraction: true,
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
    useFirstTimeInteractionAlert,
    state,
  );

  return response.result.current;
}

describe('useFirstTimeInteractionAlert', () => {
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

  it('returns no alerts if firstTimeInteraction is false', () => {
    const notFirstTimeConfirmation = {
      ...TRANSACTION_META_MOCK,
      firstTimeInteraction: false,
    };
    expect(
      runHook({
        currentConfirmation: notFirstTimeConfirmation,
      }),
    ).toEqual([]);
  });

  it('returns no alerts if firstTimeInteraction is undefined', () => {
    const notFirstTimeConfirmation = {
      ...TRANSACTION_META_MOCK,
      firstTimeInteraction: undefined,
    };
    expect(
      runHook({
        currentConfirmation: notFirstTimeConfirmation,
      }),
    ).toEqual([]);
  });

  it('returns alert if isFirstTimeInteraction is true', () => {
    const firstTimeConfirmation = {
      ...CONFIRMATION_MOCK,
      isFirstTimeInteraction: true,
    };
    const alerts = runHook({
      currentConfirmation: firstTimeConfirmation,
    });

    expect(alerts).toEqual([
      {
        actions: [],
        field: RowAlertKey.FirstTimeInteraction,
        isBlocking: false,
        key: 'firstTimeInteractionTitle',
        message:
          "You're interacting with this address for the first time. Make sure that it's correct before you continue.",
        reason: '1st interaction',
        severity: Severity.Warning,
      },
    ]);
  });
});
