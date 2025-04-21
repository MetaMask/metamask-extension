import { TransactionMeta } from '@metamask/transaction-controller';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../../helpers/constants/design-system';
import { getMockConfirmStateForTransaction } from '../../../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { isBatchTransaction } from '../../../../../../shared/lib/transactions.utils';
import { genUnapprovedApproveConfirmation } from '../../../../../../test/data/confirmations/token-approve';
import { useAccountTypeUpgrade } from './useAccountTypeUpgrade';
import { AccountTypeMessage } from './AccountTypeMessage';

jest.mock('../../../../../../shared/lib/transactions.utils');
jest.mock(
  '../../../../../components/app/alert-system/contexts/alertMetricsContext',
  () => ({
    useAlertMetrics: jest.fn(() => ({
      trackAlertMetrics: jest.fn(),
    })),
  }),
);
jest.mock('./AccountTypeMessage', () => ({
  AccountTypeMessage: jest.fn(() => 'Mocked AccountTypeMessage'),
}));

function runHook() {
  const transactionMeta = genUnapprovedApproveConfirmation() as TransactionMeta;
  const state = getMockConfirmStateForTransaction(transactionMeta);

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
    expect(runHook()).toEqual([
      {
        field: 'accountTypeUpgrade',
        key: RowAlertKey.AccountTypeUpgrade,
        content: AccountTypeMessage(),
        reason: 'Account type',
        severity: Severity.Info,
      },
    ]);
  });
});
