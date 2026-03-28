import { TransactionMeta } from '@metamask/transaction-controller';

import { getMockConfirmStateForTransaction } from '../../../../test/data/confirmations/helper';
import { genUnapprovedTokenTransferConfirmation } from '../../../../test/data/confirmations/token-transfer';
import { renderHookWithConfirmContextProvider } from '../../../../test/lib/confirmations/render-helpers';
import * as ConfirmSendNavigation from './useConfirmSendNavigation';
import { useConfirmActions } from './useConfirmActions';

const mockDispatch = jest.fn();
const mockNavigate = jest.fn();
const mockReturnTo = jest.fn<string | undefined, []>(() => undefined);

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  return {
    ...actual,
    useDispatch: () => mockDispatch,
  };
});

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('./useConfirmationNavigation', () => ({
  ...jest.requireActual('./useConfirmationNavigation'),
  useConfirmationNavigationOptions: () => ({
    returnTo: mockReturnTo(),
  }),
}));

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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns correct functions', () => {
    const result = renderHook();
    expect(result.onCancel).toBeDefined();
    expect(result.resetTransactionState).toBeDefined();
  });

  it('resetTransactionState dispatches actions to clear custom nonce and next nonce', () => {
    const result = renderHook();
    result.resetTransactionState();

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'UPDATE_CUSTOM_NONCE',
      value: '',
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_NEXT_NONCE',
      payload: '',
    });
  });

  it('call navigateBackIfSend when onCancel is called, if navigateBackForSend is true', () => {
    const mockNavigateBackIfSend = jest.fn();
    jest
      .spyOn(ConfirmSendNavigation, 'useConfirmSendNavigation')
      .mockReturnValue({ navigateBackIfSend: mockNavigateBackIfSend });
    const result = renderHook();
    result.onCancel({ location: 'dummy', navigateBackForSend: true });
    expect(mockNavigateBackIfSend).toHaveBeenCalled();
  });

  it('does not call navigateBackIfSend when onCancel is called by default', () => {
    const mockNavigateBackIfSend = jest.fn();
    jest
      .spyOn(ConfirmSendNavigation, 'useConfirmSendNavigation')
      .mockReturnValue({ navigateBackIfSend: mockNavigateBackIfSend });
    const result = renderHook();
    result.onCancel({ location: 'dummy' });
    expect(mockNavigateBackIfSend).not.toHaveBeenCalled();
  });

  it('navigates to returnTo when navigateBackToPreviousPage is true', async () => {
    mockReturnTo.mockReturnValue('/asset/0x1/0xabc');
    mockDispatch.mockResolvedValue(undefined);
    const result = renderHook();
    await result.onCancel({
      location: 'dummy',
      navigateBackToPreviousPage: true,
    });
    expect(mockNavigate).toHaveBeenCalledWith('/asset/0x1/0xabc');
  });

  it('navigates to DEFAULT_ROUTE when navigateBackToPreviousPage is true but no returnTo', async () => {
    mockReturnTo.mockReturnValue(undefined);
    mockDispatch.mockResolvedValue(undefined);
    const result = renderHook();
    await result.onCancel({
      location: 'dummy',
      navigateBackToPreviousPage: true,
    });
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('does not navigate back by default', async () => {
    mockReturnTo.mockReturnValue('/some-page');
    mockDispatch.mockResolvedValue(undefined);
    const result = renderHook();
    await result.onCancel({ location: 'dummy' });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
