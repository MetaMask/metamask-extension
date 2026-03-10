import { act } from '@testing-library/react-hooks';
import mockState from '../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { createPerpsWithdrawTransaction } from './createPerpsWithdrawTransaction';
import { usePerpsWithdraw } from './usePerpsWithdraw';

jest.mock('./createPerpsWithdrawTransaction', () => ({
  createPerpsWithdrawTransaction: jest.fn(),
}));

const mockCreatePerpsWithdrawTransaction =
  createPerpsWithdrawTransaction as jest.MockedFunction<
    typeof createPerpsWithdrawTransaction
  >;

describe('usePerpsWithdraw', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('submits withdraw and returns success', async () => {
    mockCreatePerpsWithdrawTransaction.mockResolvedValue({ success: true });

    const { result } = renderHookWithProvider(
      () => usePerpsWithdraw(),
      mockState,
    );

    let response: Awaited<ReturnType<typeof result.current.trigger>> = {
      success: false,
    };

    await act(async () => {
      response = await result.current.trigger({ amount: '10' });
    });

    expect(mockCreatePerpsWithdrawTransaction).toHaveBeenCalledWith({
      amount: '10',
    });
    expect(response).toStrictEqual({ success: true });
    expect(result.current.error).toBeNull();
  });

  it('surfaces controller error when withdraw fails', async () => {
    mockCreatePerpsWithdrawTransaction.mockResolvedValue({
      success: false,
      error: 'Insufficient withdrawable balance',
    });

    const { result } = renderHookWithProvider(
      () => usePerpsWithdraw(),
      mockState,
    );

    await act(async () => {
      await result.current.trigger({ amount: '10000' });
    });

    expect(result.current.error).toBe('Insufficient withdrawable balance');
  });

  it('rejects invalid amount before background call', async () => {
    const { result } = renderHookWithProvider(
      () => usePerpsWithdraw(),
      mockState,
    );

    let response: Awaited<ReturnType<typeof result.current.trigger>> = {
      success: true,
    };
    await act(async () => {
      response = await result.current.trigger({ amount: '-1' });
    });

    expect(mockCreatePerpsWithdrawTransaction).not.toHaveBeenCalled();
    expect(response).toStrictEqual({
      success: false,
      error: 'Invalid amount',
    });
    expect(result.current.error).toBe('Invalid amount');
  });

  it('prevents duplicate in-flight requests', async () => {
    let resolveWithdraw:
      | ((value: { success: boolean; error?: string }) => void)
      | undefined;
    mockCreatePerpsWithdrawTransaction.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveWithdraw = resolve;
        }),
    );

    const { result } = renderHookWithProvider(
      () => usePerpsWithdraw(),
      mockState,
    );

    let firstCall:
      | Promise<Awaited<ReturnType<typeof result.current.trigger>>>
      | undefined;
    await act(async () => {
      firstCall = result.current.trigger({ amount: '5' });
    });

    let secondResponse: Awaited<ReturnType<typeof result.current.trigger>> = {
      success: true,
    };
    await act(async () => {
      secondResponse = await result.current.trigger({ amount: '5' });
    });

    expect(secondResponse).toStrictEqual({ success: false });
    expect(mockCreatePerpsWithdrawTransaction).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveWithdraw?.({ success: true });
      await firstCall;
    });
  });
});
