import { renderHook, act } from '@testing-library/react-hooks';
import {
  useAsyncResult,
  useAsyncResultOrThrow,
  useAsyncCallback,
  AsyncResult,
  RESULT_IDLE,
  RESULT_PENDING,
} from './useAsync';

// Helper to create a controlled promise for testing timing scenarios
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
const createControlledPromise = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

// Test helpers
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
const successState = <T>(value: T) =>
  expect.objectContaining({
    status: 'success',
    value,
  });

const errorState = (error: Error) =>
  expect.objectContaining({
    status: 'error',
    error,
  });

describe('useAsyncCallback', () => {
  it('starts in idle state', () => {
    const { result } = renderHook(() => useAsyncCallback(async () => 'test'));
    expect(result.current[1]).toEqual(RESULT_IDLE);
  });

  it('updates when asyncFn changes', async () => {
    let counter = 0;
    const { result, rerender, waitForNextUpdate } = renderHook(
      ({ fn }) => useAsyncCallback(fn),
      { initialProps: { fn: async () => `count: ${counter}` } },
    );

    // Execute with counter=0
    act(() => {
      result.current[0]();
    });
    await waitForNextUpdate();
    expect(result.current[1]).toEqual(successState('count: 0'));

    // Change counter and function, execute again
    counter = 1;
    rerender({ fn: async () => `count: ${counter}` });
    act(() => {
      result.current[0]();
    });
    await waitForNextUpdate();
    expect(result.current[1]).toEqual(successState('count: 1'));
  });

  it('transitions through states correctly for success', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useAsyncCallback(async () => 'test'),
    );

    // Execute and check pending state
    act(() => {
      result.current[0]();
    });
    expect(result.current[1]).toEqual(RESULT_PENDING);

    // Wait for completion and check success state
    await waitForNextUpdate();
    expect(result.current[1]).toEqual(successState('test'));
  });

  it('handles errors correctly', async () => {
    const error = new Error('Custom test error');
    const { result, waitForNextUpdate } = renderHook(() =>
      useAsyncCallback(() => Promise.reject(error)),
    );

    act(() => {
      result.current[0]();
    });
    await waitForNextUpdate();
    expect(result.current[1]).toEqual(errorState(error));
  });

  it('handles rapid consecutive executions', async () => {
    const executionLog: string[] = [];
    const { result, waitForNextUpdate } = renderHook(() =>
      useAsyncCallback(async () => {
        executionLog.push('executed');
        await new Promise((resolve) => setTimeout(resolve, 10));
        return 'test';
      }),
    );

    // Trigger multiple executions
    act(() => {
      result.current[0]();
      result.current[0]();
      result.current[0]();
    });

    expect(result.current[1]).toEqual(RESULT_PENDING);
    await waitForNextUpdate();
    expect(result.current[1]).toEqual(successState('test'));
    expect(executionLog.length).toBe(3);
  });

  it('handles race conditions with dependency changes', async () => {
    const { promise: p1, resolve: r1 } = createControlledPromise<string>();
    const { promise: p2, resolve: r2 } = createControlledPromise<string>();
    let currentPromise = p1;

    const { result, rerender } = renderHook(
      ({ value }) =>
        useAsyncCallback(async () => await currentPromise, [value]),
      { initialProps: { value: 'test1' } },
    );

    // Start first execution then change deps and execute again
    act(() => {
      result.current[0]();
    });
    currentPromise = p2;
    rerender({ value: 'test2' });
    act(() => {
      result.current[0]();
    });

    // Resolve both promises in order
    await act(async () => {
      r1('test1');
      await p1;
    });
    await act(async () => {
      r2('test2');
      await p2;
    });

    // Latest result should win
    expect(result.current[1]).toEqual(successState('test2'));
  });

  it('handles various error types appropriately', async () => {
    const errors = [
      new TypeError('Type error'),
      new ReferenceError('Reference error'),
      { name: 'CustomError', message: 'Custom error' } as Error,
    ];

    for (const error of errors) {
      const { result, waitForNextUpdate } = renderHook(() =>
        useAsyncCallback(() => Promise.reject(error)),
      );

      act(() => {
        result.current[0]();
      });
      await waitForNextUpdate();
      const state = result.current[1];

      expect(state.error).toBe(error);
    }
  });

  it('recovers from errors on re-execution', async () => {
    let shouldFail = true;
    const { result, waitForNextUpdate } = renderHook(() =>
      useAsyncCallback(async () => {
        if (shouldFail) {
          shouldFail = false;
          throw new Error('Temporary error');
        }
        return 'success';
      }),
    );

    // First execution fails
    act(() => {
      result.current[0]();
    });
    await waitForNextUpdate();
    expect(result.current[1].status).toBe('error');

    // Second execution succeeds
    act(() => {
      result.current[0]();
    });
    await waitForNextUpdate();
    expect(result.current[1]).toEqual(successState('success'));
  });

  it('preserves state during execution phases', async () => {
    const { promise, resolve } = createControlledPromise<string>();
    const { result } = renderHook(() => useAsyncCallback(async () => promise));
    const states: AsyncResult<string>[] = [];

    // Capture state transitions
    states.push({ ...result.current[1] });
    act(() => {
      result.current[0]();
    });
    states.push({ ...result.current[1] });
    await act(async () => {
      resolve('test');
      await promise;
    });
    states.push({ ...result.current[1] });

    expect(states[0]).toEqual(RESULT_IDLE);
    expect(states[1]).toEqual(RESULT_PENDING);
    expect(states[2]).toEqual(successState('test'));
  });
});

describe('useAsyncResult', () => {
  it('handles immediate execution with correct state transitions', async () => {
    const { promise, resolve } = createControlledPromise<string>();
    const { result, waitForNextUpdate } = renderHook(() =>
      useAsyncResult(async () => await promise),
    );

    // Verify initial state is pending
    expect(result.current).toEqual(RESULT_PENDING);

    // Resolve and check success state
    act(() => {
      resolve('test');
    });
    await waitForNextUpdate();
    expect(result.current).toEqual(successState('test'));
  });

  it('handles async errors with stack trace preservation', async () => {
    const error = new Error('Async error');
    const { promise, reject } = createControlledPromise<string>();

    const { result, waitForNextUpdate } = renderHook(() =>
      useAsyncResult(async () => {
        await promise;
        throw error;
      }),
    );

    act(() => {
      reject(error);
    });
    await waitForNextUpdate();

    if (result.current.status === 'error') {
      expect(result.current.error).toBe(error);
      expect(result.current.error.stack).toBeDefined();
    } else {
      fail('Expected error state');
    }
  });
});

describe('useAsyncResultOrThrow', () => {
  it('throws errors for error boundaries to catch', async () => {
    const error = new Error('Boundary error');
    const { result, waitForNextUpdate } = renderHook(() =>
      useAsyncResultOrThrow(() => Promise.reject(error)),
    );

    await waitForNextUpdate();
    expect(() => result.current).toThrow(error);
  });

  it('preserves error properties when throwing', async () => {
    type CustomError = Error & { code?: string };
    const error = new Error('Context error') as CustomError;
    error.code = 'CUSTOM_CODE';

    const { result, waitForNextUpdate } = renderHook(() =>
      useAsyncResultOrThrow(() => Promise.reject(error)),
    );

    await waitForNextUpdate();
    try {
      Object.prototype.toString.call(result.current);
      fail('Should have thrown');
    } catch (e) {
      const thrownError = e as CustomError;
      expect(thrownError).toBe(error);
      expect(thrownError.code).toBe('CUSTOM_CODE');
    }
  });
});
