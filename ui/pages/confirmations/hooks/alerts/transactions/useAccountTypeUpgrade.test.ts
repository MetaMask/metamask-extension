import {
  TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../../helpers/constants/design-system';
import { getMockConfirmStateForTransaction } from '../../../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { isBatchTransaction } from '../../../../../../shared/lib/transactions.utils';
import { AccountTypeMessage } from './AccountTypeMessage';
import { useAccountTypeUpgrade } from './useAccountTypeUpgrade';

jest.mock('../../../../../../shared/lib/transactions.utils');
jest.mock(
  '../../../../../components/app/alert-system/contexts/alertMetricsContext',
  () => ({
    useAlertMetrics: jest.fn(() => ({
      trackAlertMetrics: jest.fn(),
    })),
  }),
);

const TO_MOCK = '0x1234567890abcdef1234567890abcdef12345678';
const NESTED_TRANSACTIONS_MOCK = [{ data: '0x', to: TO_MOCK }];
const ACCOUNT_ADDRESS_MOCK = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';
const TRANSACTION_ID_MOCK = '123-456';

const TRANSACTION_META_MOCK = {
  id: TRANSACTION_ID_MOCK,
  chainId: '0x5',
  networkClientId: 'testNetworkClientId',
  status: TransactionStatus.unapproved,
  type: TransactionType.contractInteraction,
  txParams: {
    from: ACCOUNT_ADDRESS_MOCK,
  },
  time: new Date().getTime() - 10000,
} as TransactionMeta;

function runHook({
  currentConfirmation,
}: {
  currentConfirmation?: TransactionMeta;
} = {}) {
  const state = currentConfirmation
    ? getMockConfirmStateForTransaction(currentConfirmation)
    : {};

  const response = renderHookWithConfirmContextProvider(
    () => useAccountTypeUpgrade(),
    state,
  );

  return response.result.current;
}

describe('useAccountTypeUpgrade', () => {
  const isBatchTransactionMock = jest.mocked(isBatchTransaction);
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns an empty array when the transaction is not a batch transaction', () => {
    expect(runHook()).toEqual([]);
  });

  it('returns an alert when the transaction is a batch transaction', () => {
    isBatchTransactionMock.mockReturnValue(true);
    expect(
      runHook({
        currentConfirmation: {
          ...TRANSACTION_META_MOCK,
          nestedTransactions: NESTED_TRANSACTIONS_MOCK,
        } as TransactionMeta,
      }),
    ).toEqual([
      {
        field: 'accountType',
        key: RowAlertKey.AccountTypeUpgrade,
        content: AccountTypeMessage,
        reason: 'Account type',
        severity: Severity.Info,
      },
    ]);
  });
});
