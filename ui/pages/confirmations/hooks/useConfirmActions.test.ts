import { TransactionMeta } from '@metamask/transaction-controller';

import { getMockConfirmStateForTransaction } from '../../../../test/data/confirmations/helper';
import { genUnapprovedTokenTransferConfirmation } from '../../../../test/data/confirmations/token-transfer';
import { renderHookWithConfirmContextProvider } from '../../../../test/lib/confirmations/render-helpers';
import { PREVIOUS_ROUTE } from '../../../helpers/constants/routes';
import * as ConfirmSendNavigation from './useConfirmSendNavigation';
import { useConfirmActions } from './useConfirmActions';

const mockDispatch = jest.fn();
const mockNavigate = jest.fn();
let mockLocationKey = 'default';

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
  useLocation: () => ({
    pathname: '/',
    search: '',
    hash: '',
    state: null,
    key: mockLocationKey,
  }),
}));

function renderHook(pathname = '/') {
  const transactionMeta = genUnapprovedTokenTransferConfirmation({
    amountHex:
      '0000000000000000000000000000000000000000000000000000000000011170',
  }) as TransactionMeta;

  const { result } = renderHookWithConfirmContextProvider(
    () => useConfirmActions(),
    getMockConfirmStateForTransaction(transactionMeta),
    pathname,
  );
  return result.current;
}

describe('useConfirmActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocationKey = 'default';
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

  // TAT-3131: navigating back from a transient wallet-initiated confirmation
  // (perpsDeposit / perpsWithdraw / musdClaim) must REPLACE the confirmation
  // history entry, not push on top of it. Pushing left a phantom
  // confirm-transaction entry that broke Perps order-screen back navigation
  // (double-tap) and post-trade navigation.
  it('navigates to goBackTo with replace when navigateBackToPreviousPage is true', async () => {
    mockDispatch.mockResolvedValue(undefined);
    const result = renderHook('/?goBackTo=%2Fasset%2F0x1%2F0xabc');
    await result.onCancel({
      location: 'dummy',
      navigateBackToPreviousPage: true,
    });
    expect(mockNavigate).toHaveBeenCalledWith('/asset/0x1/0xabc', {
      replace: true,
    });
  });

  it('navigates to DEFAULT_ROUTE with replace when navigateBackToPreviousPage is true but no goBackTo', async () => {
    mockDispatch.mockResolvedValue(undefined);
    const result = renderHook();
    await result.onCancel({
      location: 'dummy',
      navigateBackToPreviousPage: true,
    });
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('pops history when the confirmation was pushed onto an in-app page', async () => {
    mockLocationKey = 'earn-page';
    mockDispatch.mockResolvedValue(undefined);
    const result = renderHook(
      '/?goBackTo=%2Fmoney-home%2Fearn&goBackAction=pop',
    );
    await result.onCancel({
      location: 'dummy',
      navigateBackToPreviousPage: true,
    });
    expect(mockNavigate).toHaveBeenCalledWith(PREVIOUS_ROUTE);
  });

  it('replaces with goBackTo when pop was requested from the first history entry', async () => {
    mockDispatch.mockResolvedValue(undefined);
    const result = renderHook(
      '/?goBackTo=%2Fmoney-home%2Fearn&goBackAction=pop',
    );
    await result.onCancel({
      location: 'dummy',
      navigateBackToPreviousPage: true,
    });
    expect(mockNavigate).toHaveBeenCalledWith('/money-home/earn', {
      replace: true,
    });
  });

  it('does not navigate back by default', async () => {
    mockDispatch.mockResolvedValue(undefined);
    const result = renderHook('/?goBackTo=%2Fsome-page');
    await result.onCancel({ location: 'dummy' });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
