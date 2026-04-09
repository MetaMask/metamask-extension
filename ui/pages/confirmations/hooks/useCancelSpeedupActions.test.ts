import { renderHook, act } from '@testing-library/react-hooks';
import { useCancelSpeedupActions } from './useCancelSpeedupActions';

describe('useCancelSpeedupActions', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null error initially', () => {
    const { result } = renderHook(() => useCancelSpeedupActions(mockOnClose));
    expect(result.current.error).toBeNull();
  });

  it('calls onClose and resolves without setting error on success', async () => {
    const { result } = renderHook(() => useCancelSpeedupActions(mockOnClose));

    await act(async () => {
      await result.current.submitTransaction(() => Promise.resolve(), true);
    });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeNull();
  });

  it('calls onClose and sets error state when action rejects', async () => {
    const { result } = renderHook(() => useCancelSpeedupActions(mockOnClose));

    await act(async () => {
      await result.current.submitTransaction(
        () => Promise.reject(new Error('tx already confirmed')),
        true,
      );
    });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(result.current.error).toStrictEqual({
      message: 'tx already confirmed',
      isCancel: true,
    });
  });

  it('sets isCancel to false for speed-up errors', async () => {
    const { result } = renderHook(() => useCancelSpeedupActions(mockOnClose));

    await act(async () => {
      await result.current.submitTransaction(
        () => Promise.reject(new Error('gas too low')),
        false,
      );
    });

    expect(result.current.error).toStrictEqual({
      message: 'gas too low',
      isCancel: false,
    });
  });

  it('normalizes non-Error rejection values to a string message', async () => {
    const { result } = renderHook(() => useCancelSpeedupActions(mockOnClose));

    await act(async () => {
      await result.current.submitTransaction(
        () => Promise.reject('string rejection'),
        true,
      );
    });

    expect(result.current.error).toStrictEqual({
      message: 'string rejection',
      isCancel: true,
    });
  });

  it('uses String() for arbitrary rejection values', async () => {
    const { result } = renderHook(() => useCancelSpeedupActions(mockOnClose));

    await act(async () => {
      await result.current.submitTransaction(
        () => Promise.reject({ code: 400 }),
        false,
      );
    });

    expect(result.current.error).toStrictEqual({
      message: '[object Object]',
      isCancel: false,
    });
  });

  it('clears error when clearError is called', async () => {
    const { result } = renderHook(() => useCancelSpeedupActions(mockOnClose));

    await act(async () => {
      await result.current.submitTransaction(
        () => Promise.reject(new Error('boom')),
        true,
      );
    });

    expect(result.current.error).not.toBeNull();

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('clears previous error when a subsequent submit succeeds', async () => {
    const { result } = renderHook(() => useCancelSpeedupActions(mockOnClose));

    await act(async () => {
      await result.current.submitTransaction(
        () => Promise.reject(new Error('first failure')),
        true,
      );
    });

    expect(result.current.error).toStrictEqual({
      message: 'first failure',
      isCancel: true,
    });

    await act(async () => {
      await result.current.submitTransaction(() => Promise.resolve(), false);
    });

    expect(result.current.error).toBeNull();
    expect(mockOnClose).toHaveBeenCalledTimes(2);
  });
});
