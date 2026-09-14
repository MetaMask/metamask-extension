import { act, renderHook } from '@testing-library/react';
import { useSelector } from 'react-redux';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type {
  SolanaPayQuote,
  TransactionPayIntent,
  TransactionPayRequiredToken,
} from '@metamask/transaction-pay-controller';
import { useConfirmContext } from '../../context/confirm';
import {
  selectSolanaPayQuoteByTransactionId,
  selectTransactionPayIntentByTransactionId,
} from '../../../../selectors/transactionPayController';
import { refreshSolanaPayQuote } from '../../../../store/controller-actions/transaction-pay-controller';
import { useRefreshSolanaPayQuote } from './useRefreshSolanaPayQuote';

jest.mock('react-redux', () => ({ useSelector: jest.fn() }));
jest.mock('../../context/confirm', () => ({ useConfirmContext: jest.fn() }));
jest.mock('../../../../selectors/transactionPayController', () => ({
  selectSolanaPayQuoteByTransactionId: jest.fn(),
  selectTransactionPayIntentByTransactionId: jest.fn(),
}));
jest.mock(
  '../../../../store/controller-actions/transaction-pay-controller',
  () => ({ refreshSolanaPayQuote: jest.fn() }),
);

const requiredToken = {
  amountRaw: '900000',
} as TransactionPayRequiredToken;
const intent = {
  sourceChainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
} as unknown as TransactionPayIntent;

describe('useRefreshSolanaPayQuote', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.resetAllMocks();
    jest.mocked(useSelector).mockImplementation((selector) => selector({}));
    jest.mocked(useConfirmContext).mockReturnValue({
      currentConfirmation: { id: 'transaction-id' } as TransactionMeta,
    } as ReturnType<typeof useConfirmContext>);
    jest
      .mocked(selectTransactionPayIntentByTransactionId)
      .mockReturnValue(intent);
    jest.mocked(refreshSolanaPayQuote).mockResolvedValue();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('refreshes when Core has not quoted the current target amount', async () => {
    jest.mocked(selectSolanaPayQuoteByTransactionId).mockReturnValue({
      route: { targetAmountMinimum: '800000' },
    } as SolanaPayQuote);

    renderHook(() => useRefreshSolanaPayQuote(requiredToken));
    await act(async () => jest.advanceTimersByTime(500));

    expect(refreshSolanaPayQuote).toHaveBeenCalledWith('transaction-id');
  });

  it('does not refresh when Core route matches the current target amount', () => {
    jest.mocked(selectSolanaPayQuoteByTransactionId).mockReturnValue({
      route: { targetAmountMinimum: '900000' },
    } as SolanaPayQuote);

    renderHook(() => useRefreshSolanaPayQuote(requiredToken));
    act(() => jest.advanceTimersByTime(500));

    expect(refreshSolanaPayQuote).not.toHaveBeenCalled();
  });
});
