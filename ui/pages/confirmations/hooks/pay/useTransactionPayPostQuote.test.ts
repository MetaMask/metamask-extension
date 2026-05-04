import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { renderHook } from '@testing-library/react-hooks';
import { useConfirmContext } from '../../context/confirm';
import { setPostQuote } from '../../../../store/controller-actions/transaction-pay-controller';
import { useTransactionPayPostQuote } from './useTransactionPayPostQuote';

jest.mock('../../context/confirm', () => ({
  useConfirmContext: jest.fn(),
}));

jest.mock('../../../../store/controller-actions/transaction-pay-controller');

const useConfirmContextMock = jest.mocked(useConfirmContext);
const setPostQuoteMock = jest.mocked(setPostQuote);

function mockConfirmation(transactionMeta: Partial<TransactionMeta> | null) {
  useConfirmContextMock.mockReturnValue({
    currentConfirmation: transactionMeta as TransactionMeta,
  } as ReturnType<typeof useConfirmContext>);
}

describe('useTransactionPayPostQuote', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    setPostQuoteMock.mockResolvedValue(undefined);
  });

  it('calls setPostQuote with isHyperliquidSource for a perpsWithdraw transaction', () => {
    mockConfirmation({
      id: 'tx-1',
      type: TransactionType.perpsWithdraw,
    });

    renderHook(() => useTransactionPayPostQuote());

    expect(setPostQuoteMock).toHaveBeenCalledTimes(1);
    expect(setPostQuoteMock).toHaveBeenCalledWith('tx-1', {
      isHyperliquidSource: true,
    });
  });

  it('does not call setPostQuote for non-perpsWithdraw transactions', () => {
    mockConfirmation({
      id: 'tx-2',
      type: TransactionType.perpsDeposit,
    });

    renderHook(() => useTransactionPayPostQuote());

    expect(setPostQuoteMock).not.toHaveBeenCalled();
  });

  it('does not call setPostQuote when there is no current confirmation', () => {
    mockConfirmation(null);

    renderHook(() => useTransactionPayPostQuote());

    expect(setPostQuoteMock).not.toHaveBeenCalled();
  });

  it('does not call setPostQuote again on re-render for the same transaction id', () => {
    mockConfirmation({
      id: 'tx-3',
      type: TransactionType.perpsWithdraw,
    });

    const { rerender } = renderHook(() => useTransactionPayPostQuote());
    rerender();
    rerender();

    expect(setPostQuoteMock).toHaveBeenCalledTimes(1);
  });

  it('calls setPostQuote again when the transaction id changes', () => {
    mockConfirmation({
      id: 'tx-4',
      type: TransactionType.perpsWithdraw,
    });

    const { rerender } = renderHook(() => useTransactionPayPostQuote());
    expect(setPostQuoteMock).toHaveBeenCalledTimes(1);
    expect(setPostQuoteMock).toHaveBeenLastCalledWith('tx-4', {
      isHyperliquidSource: true,
    });

    mockConfirmation({
      id: 'tx-5',
      type: TransactionType.perpsWithdraw,
    });
    rerender();

    expect(setPostQuoteMock).toHaveBeenCalledTimes(2);
    expect(setPostQuoteMock).toHaveBeenLastCalledWith('tx-5', {
      isHyperliquidSource: true,
    });
  });

  it('catches errors from setPostQuote without throwing', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    setPostQuoteMock.mockRejectedValue(new Error('boom'));
    mockConfirmation({
      id: 'tx-6',
      type: TransactionType.perpsWithdraw,
    });

    expect(() => renderHook(() => useTransactionPayPostQuote())).not.toThrow();

    await new Promise((resolve) => setImmediate(resolve));

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to set post-quote config',
      expect.any(Error),
    );

    consoleErrorSpy.mockRestore();
  });

  it('retries setPostQuote when the transaction id returns to a previously-failed value', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    // First call (tx-7) fails; subsequent calls succeed.
    setPostQuoteMock.mockRejectedValueOnce(new Error('boom'));
    setPostQuoteMock.mockResolvedValue(undefined);

    mockConfirmation({
      id: 'tx-7',
      type: TransactionType.perpsWithdraw,
    });

    const { rerender } = renderHook(() => useTransactionPayPostQuote());
    await new Promise((resolve) => setImmediate(resolve));

    expect(setPostQuoteMock).toHaveBeenCalledTimes(1);

    // Switch to a different transaction so the deps change away.
    mockConfirmation({
      id: 'tx-8',
      type: TransactionType.perpsWithdraw,
    });
    rerender();
    await new Promise((resolve) => setImmediate(resolve));

    expect(setPostQuoteMock).toHaveBeenCalledTimes(2);

    // Switching back to tx-7 should retry — the previous rejection must
    // have cleared the in-flight ref, otherwise the dispatch is silently
    // skipped and the tx stays un-configured.
    mockConfirmation({
      id: 'tx-7',
      type: TransactionType.perpsWithdraw,
    });
    rerender();

    expect(setPostQuoteMock).toHaveBeenCalledTimes(3);
    expect(setPostQuoteMock).toHaveBeenLastCalledWith('tx-7', {
      isHyperliquidSource: true,
    });

    consoleErrorSpy.mockRestore();
  });
});
