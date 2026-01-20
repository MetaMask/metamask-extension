import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../../helpers/constants/design-system';
import { getMockConfirmStateForTransaction } from '../../../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { isBatchTransaction } from '../../../../../../shared/lib/transactions.utils';
import {
  upgradeAccountConfirmation,
  upgradeAccountConfirmationOnly,
} from '../../../../../../test/data/confirmations/batch-transaction';
import { genUnapprovedTokenTransferConfirmation } from '../../../../../../test/data/confirmations/token-transfer';
import { Confirmation } from '../../../types/confirm';
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
jest.mock('./AccountTypeMessage', () => ({
  AccountTypeMessage: jest.fn(() => 'Mocked AccountTypeMessage'),
}));

function runHook(confirmation: Confirmation) {
  const state = getMockConfirmStateForTransaction(confirmation);

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
    expect(runHook(genUnapprovedTokenTransferConfirmation())).toEqual([]);
  });

  it('returns an alert when the transaction is a upgrade transaction', () => {
    isBatchTransactionMock.mockReturnValue(true);
    expect(runHook(upgradeAccountConfirmation)).toEqual([
      {
        field: 'accountTypeUpgrade',
        key: RowAlertKey.AccountTypeUpgrade,
        content: AccountTypeMessage(),
        reason: 'Account type',
        severity: Severity.Info,
      },
    ]);
  });

  it('returns an alert when the transaction is a upgrade only transaction', () => {
    isBatchTransactionMock.mockReturnValue(true);
    expect(runHook(upgradeAccountConfirmationOnly)).toEqual([
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
