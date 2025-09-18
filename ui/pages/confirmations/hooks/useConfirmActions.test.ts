import { TransactionMeta } from '@metamask/transaction-controller';

import { getMockConfirmStateForTransaction } from '../../../../test/data/confirmations/helper';
import { genUnapprovedTokenTransferConfirmation } from '../../../../test/data/confirmations/token-transfer';
import { renderHookWithConfirmContextProvider } from '../../../../test/lib/confirmations/render-helpers';
import * as ConfirmSendNavigation from './useConfirmSendNavigation';
import { useConfirmActions } from './useConfirmActions';

const mockDispatch = jest.fn();

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  return {
    ...actual,
    useDispatch: () => mockDispatch,
  };
});

function renderHook() {
  const transactionMeta = genUnapprovedTokenTransferConfirmation({
    amountHex:
      '0000000000000000000000000000000000000000000000000000000000011170',
  }) as TransactionMeta;

  const { result } = renderHookWithConfirmContextProvider(
    () => useConfirmActions(),
    getMockConfirmStateForTransaction(transactionMeta),
  );
  return result.current;
}

describe('useConfirmActions', () => {
  it('returns correct functions', () => {
    const result = renderHook();
    expect(result.onCancel).toBeDefined();
    expect(result.resetTransactionState).toBeDefined();
  });

  it('call navigateBackIfSend when onCancel is called', () => {
    const mockNavigateBackIfSend = jest.fn();
    jest
      .spyOn(ConfirmSendNavigation, 'useConfirmSendNavigation')
      .mockReturnValue({ navigateBackIfSend: mockNavigateBackIfSend });
    const result = renderHook();
    result.onCancel();
    expect(mockNavigateBackIfSend).toHaveBeenCalled();
  });
});
