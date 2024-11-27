import { ApprovalType } from '@metamask/controller-utils';
import {
  TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { getMockConfirmState } from '../../../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../../helpers/constants/design-system';
import {
  getRedesignedTransactionsEnabled,
  submittedPendingTransactionsSelector,
} from '../../../../../selectors';
import { PendingTransactionAlertMessage } from './PendingTransactionAlertMessage';
import { usePendingTransactionAlerts } from './usePendingTransactionAlerts';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

jest.mock('./PendingTransactionAlertMessage', () => ({
  PendingTransactionAlertMessage: () => 'PendingTransactionAlertMessage',
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn().mockReturnValue({ id: 'mock-transaction-id' }),
}));

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
    usePendingTransactionAlerts,
    state,
  );

  return response.result.current;
}

describe('usePendingTransactionAlerts', () => {
  const useSelectorMock = useSelector as jest.Mock;

  beforeEach(() => {
    jest.resetAllMocks();

    (useParams as jest.Mock).mockReturnValue({ id: 'mock-transaction-id' });
  });

  it('returns no alerts if no confirmation', () => {
    expect(runHook({ transactions: [TRANSACTION_META_MOCK] })).toEqual([]);
  });

  it('returns no alerts if no transactions', () => {
    expect(
      runHook({ currentConfirmation: CONFIRMATION_MOCK, transactions: [] }),
    ).toEqual([]);
  });

  it('returns no alerts if transaction on different chain', () => {
    expect(
      runHook({
        currentConfirmation: CONFIRMATION_MOCK,
        transactions: [{ ...TRANSACTION_META_MOCK, chainId: '0x6' }],
      }),
    ).toEqual([]);
  });

  it('returns no alerts if transaction from different account', () => {
    expect(
      runHook({
        currentConfirmation: CONFIRMATION_MOCK,
        transactions: [
          { ...TRANSACTION_META_MOCK, txParams: { from: '0x456' } },
        ],
      }),
    ).toEqual([]);
  });

  it('returns no alerts if transaction has alternate status', () => {
    expect(
      runHook({
        currentConfirmation: CONFIRMATION_MOCK,
        transactions: [
          { ...TRANSACTION_META_MOCK, status: TransactionStatus.confirmed },
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

  it('returns alert if submitted transaction', () => {
    useSelectorMock.mockImplementation((selector) => {
      if (selector === submittedPendingTransactionsSelector) {
        return [
          { name: 'first transaction', id: '1' },
          { name: 'second transaction', id: '2' },
        ];
      } else if (selector === getRedesignedTransactionsEnabled) {
        return true;
      } else if (selector.toString().includes('getUnapprovedTransaction')) {
        return { type: TransactionType.contractInteraction };
      }
      return undefined;
    });

    const alerts = runHook({
      currentConfirmation: CONFIRMATION_MOCK,
      transactions: [TRANSACTION_META_MOCK],
    });

    expect(alerts).toEqual([
      {
        field: RowAlertKey.Speed,
        key: 'pendingTransactions',
        message: PendingTransactionAlertMessage(),
        reason: 'Pending transaction',
        severity: Severity.Warning,
      },
    ]);
  });
});
