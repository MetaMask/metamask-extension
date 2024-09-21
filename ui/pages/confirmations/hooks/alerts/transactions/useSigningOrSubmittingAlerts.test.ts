import { ApprovalType } from '@metamask/controller-utils';
import {
  TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';

import { getMockConfirmState } from '../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { renderHookWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { Severity } from '../../../../../helpers/constants/design-system';
import { useSigningOrSubmittingAlerts } from './useSigningOrSubmittingAlerts';

const EXPECTED_ALERT = {
  isBlocking: true,
  key: 'signingOrSubmitting',
  message:
    'This transaction will only go through once your previous transaction is complete.',
  severity: Severity.Warning,
};
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
    useSigningOrSubmittingAlerts,
    state,
  );

  return response.result.current;
}

describe('useSigningOrSubmittingAlerts', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns no alerts if no confirmation', () => {
    expect(
      runHook({
        currentConfirmation: undefined,
        transactions: [TRANSACTION_META_MOCK],
      }),
    ).toEqual([]);
  });

  it('returns no alerts if no transactions', () => {
    expect(
      runHook({ currentConfirmation: CONFIRMATION_MOCK, transactions: [] }),
    ).toEqual([]);
  });

  it('returns alerts if transaction on different chain', () => {
    expect(
      runHook({
        currentConfirmation: CONFIRMATION_MOCK,
        transactions: [
          {
            ...TRANSACTION_META_MOCK,
            status: TransactionStatus.approved,
            chainId: '0x6',
          },
        ],
      }),
    ).toEqual([EXPECTED_ALERT]);
  });

  it('returns no alerts if transaction has alternate status', () => {
    expect(
      runHook({
        currentConfirmation: CONFIRMATION_MOCK,
        transactions: [
          { ...TRANSACTION_META_MOCK, status: TransactionStatus.submitted },
        ],
      }),
    ).toEqual([]);
  });

  it('returns no alerts if confirmation has incorrect type', () => {
    expect(
      runHook({
        currentConfirmation: {
          ...CONFIRMATION_MOCK,
          type: TransactionType.signTypedData,
        },
        transactions: [TRANSACTION_META_MOCK],
      }),
    ).toEqual([]);
  });

  it('returns alert if signed transaction', () => {
    const alerts = runHook({
      currentConfirmation: CONFIRMATION_MOCK,
      transactions: [
        { ...TRANSACTION_META_MOCK, status: TransactionStatus.signed },
      ],
    });

    expect(alerts).toEqual([EXPECTED_ALERT]);
  });

  it('returns alert if approved transaction', () => {
    const alerts = runHook({
      currentConfirmation: CONFIRMATION_MOCK,
      transactions: [
        { ...TRANSACTION_META_MOCK, status: TransactionStatus.approved },
      ],
    });

    expect(alerts).toEqual([EXPECTED_ALERT]);
  });
});
