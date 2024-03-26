import { renderHook } from '@testing-library/react-hooks';
import * as hookModule from './useAsyncResult';

const { useAsyncResult, useAsyncResultOrThrow: useAsyncResultStrict } =
  hookModule;

describe('useAsyncResult', () => {
  it('should return pending state initially', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useAsyncResult(async () => 'test'),
    );
    expect(result.current).toEqual({ pending: true });
    await waitForNextUpdate();
  });

  it('should return success state with value on successful async function', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useAsyncResult(async () => 'test'),
    );
    await waitForNextUpdate();
    expect(result.current).toEqual({ pending: false, value: 'test' });
  });

  it('should return error state on async function error', async () => {
    const error = new Error('test error');
    const { result, waitForNextUpdate } = renderHook(() =>
      useAsyncResult(() => Promise.reject(error)),
    );
    await waitForNextUpdate();
    expect(result.current).toEqual({ pending: false, error });
  });

  it('should cancel async function on unmount', async () => {
    const { unmount, result } = renderHook(() =>
      useAsyncResult(async () => 'test'),
    );
    unmount();
    await Promise.resolve();
    expect(result.current).toEqual({ pending: true });
  });
});

describe('useAsyncResultStrict', () => {
  it('correctly passes through the pending and success states', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useAsyncResultStrict(async () => 'test'),
    );
    expect(result.current).toEqual({ pending: true });
    await waitForNextUpdate();
    expect(result.current).toEqual({ pending: false, value: 'test' });
  });

  it('should throw error on async function error', async () => {
    // TODO
  });
});
