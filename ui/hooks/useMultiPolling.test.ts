import { waitFor } from '@testing-library/react';
import { renderHookWithProvider } from '../../test/lib/render-helpers-navigate';
import useMultiPolling from './useMultiPolling';

describe('useMultiPolling', () => {
  it('should start polling for all inputs when component mounts', async () => {
    const promises: Promise<string>[] = [];
    const mockStartPolling = jest.fn().mockImplementation((input) => {
      const promise = Promise.resolve(`${input}_token`);
      promises.push(promise);
      return promise;
    });
    const mockStopPollingByPollingToken = jest.fn();
    const inputs = ['foo', 'bar'];

    renderHookWithProvider(
      () =>
        useMultiPolling({
          startPolling: mockStartPolling,
          stopPollingByPollingToken: mockStopPollingByPollingToken,
          input: inputs,
        }),
      {
        metamask: {
          completedOnboarding: true,
        },
      },
    );

    await Promise.all(promises);

    expect(mockStartPolling).toHaveBeenCalledTimes(2);
    expect(mockStartPolling).toHaveBeenCalledWith('foo');
    expect(mockStartPolling).toHaveBeenCalledWith('bar');
  });

  it('should stop all polling on unmount', async () => {
    const promises: Promise<string>[] = [];
    const mockStartPolling = jest.fn().mockImplementation((input) => {
      const promise = Promise.resolve(`${input}_token`);
      promises.push(promise);
      return promise;
    });
    const mockStopPollingByPollingToken = jest.fn();
    const inputs = ['foo', 'bar'];

    const { unmount } = renderHookWithProvider(
      () =>
        useMultiPolling({
          startPolling: mockStartPolling,
          stopPollingByPollingToken: mockStopPollingByPollingToken,
          input: inputs,
        }),
      {
        metamask: {
          completedOnboarding: true,
        },
      },
    );

    await Promise.all(promises);
    unmount();

    expect(mockStopPollingByPollingToken).toHaveBeenCalledWith('foo_token');
    expect(mockStopPollingByPollingToken).toHaveBeenCalledWith('bar_token');
  });

  it('should start new polls and stop removed polls when inputs change', async () => {
    const promises: Promise<string>[] = [];
    const mockStartPolling = jest.fn().mockImplementation((input) => {
      const promise = Promise.resolve(`${input}_token`);
      promises.push(promise);
      return promise;
    });
    const mockStopPollingByPollingToken = jest.fn();

    let currentInputs = ['foo', 'bar'];

    const { rerender } = renderHookWithProvider(
      () =>
        useMultiPolling({
          startPolling: mockStartPolling,
          stopPollingByPollingToken: mockStopPollingByPollingToken,
          input: currentInputs,
        }),
      {
        metamask: {
          completedOnboarding: true,
        },
      },
    );

    await Promise.all(promises);

    expect(mockStartPolling).toHaveBeenCalledWith('foo');
    expect(mockStartPolling).toHaveBeenCalledWith('bar');

    // Change inputs: remove 'foo', keep 'bar', add 'baz'
    currentInputs = ['bar', 'baz'];
    rerender();
    await Promise.all(promises);

    // Should stop the removed input
    expect(mockStopPollingByPollingToken).toHaveBeenCalledWith('foo_token');
    // Should start the new input
    expect(mockStartPolling).toHaveBeenCalledWith('baz');
    // 'bar' should not be restarted (already polling)
    expect(mockStartPolling).toHaveBeenCalledTimes(3); // foo, bar, baz
  });

  it('should not start polling if onboarding is not completed', async () => {
    const mockStartPolling = jest.fn().mockResolvedValue('token');
    const mockStopPollingByPollingToken = jest.fn();

    renderHookWithProvider(
      () =>
        useMultiPolling({
          startPolling: mockStartPolling,
          stopPollingByPollingToken: mockStopPollingByPollingToken,
          input: ['foo'],
        }),
      {
        metamask: {
          completedOnboarding: false,
        },
      },
    );

    // Give effects time to run
    await waitFor(() => {
      expect(mockStartPolling).not.toHaveBeenCalled();
    });
  });

  it('should not poll when inputs array is empty', async () => {
    const mockStartPolling = jest.fn().mockResolvedValue('token');
    const mockStopPollingByPollingToken = jest.fn();

    renderHookWithProvider(
      () =>
        useMultiPolling({
          startPolling: mockStartPolling,
          stopPollingByPollingToken: mockStopPollingByPollingToken,
          input: [],
        }),
      {
        metamask: {
          completedOnboarding: true,
        },
      },
    );

    await waitFor(() => {
      expect(mockStartPolling).not.toHaveBeenCalled();
    });
  });

  it('should handle race conditions by stopping stale tokens', async () => {
    let resolveFoo: (value: string) => void = () => undefined;
    let resolveBar: (value: string) => void = () => undefined;

    const mockStartPolling = jest.fn().mockImplementation((input) => {
      if (input === 'foo') {
        return new Promise<string>((resolve) => {
          resolveFoo = resolve;
        });
      }
      if (input === 'bar') {
        return new Promise<string>((resolve) => {
          resolveBar = resolve;
        });
      }
      return Promise.resolve(`${input}_token`);
    });
    const mockStopPollingByPollingToken = jest.fn();

    let currentInputs = ['foo'];

    const { rerender } = renderHookWithProvider(
      () =>
        useMultiPolling({
          startPolling: mockStartPolling,
          stopPollingByPollingToken: mockStopPollingByPollingToken,
          input: currentInputs,
        }),
      {
        metamask: {
          completedOnboarding: true,
        },
      },
    );

    // Remove 'foo' before its promise resolves
    currentInputs = ['bar'];
    rerender();

    // Resolve in order: bar first (current input), then foo (stale)
    resolveBar('bar_token');
    resolveFoo('foo_token');

    // The stale token should be immediately stopped
    await waitFor(() => {
      expect(mockStopPollingByPollingToken).toHaveBeenCalledWith('foo_token');
    });
  });

  it('should handle object inputs with JSON serialization', async () => {
    const promises: Promise<string>[] = [];
    const mockStartPolling = jest.fn().mockImplementation((input) => {
      const promise = Promise.resolve(
        `${JSON.stringify(input).replace(/"/gu, '')}_token`,
      );
      promises.push(promise);
      return promise;
    });
    const mockStopPollingByPollingToken = jest.fn();

    const inputs = [
      { chainId: '0x1', networkClientId: 'mainnet' },
      { chainId: '0x89', networkClientId: 'polygon' },
    ];

    const { unmount } = renderHookWithProvider(
      () =>
        useMultiPolling({
          startPolling: mockStartPolling,
          stopPollingByPollingToken: mockStopPollingByPollingToken,
          input: inputs,
        }),
      {
        metamask: {
          completedOnboarding: true,
        },
      },
    );

    await Promise.all(promises);

    expect(mockStartPolling).toHaveBeenCalledTimes(2);
    expect(mockStartPolling).toHaveBeenCalledWith(inputs[0]);
    expect(mockStartPolling).toHaveBeenCalledWith(inputs[1]);

    unmount();

    expect(mockStopPollingByPollingToken).toHaveBeenCalledTimes(2);
  });

  it('should not restart polling when input reference changes but content is same', async () => {
    const promises: Promise<string>[] = [];
    const mockStartPolling = jest.fn().mockImplementation((input) => {
      const promise = Promise.resolve(`${input}_token`);
      promises.push(promise);
      return promise;
    });
    const mockStopPollingByPollingToken = jest.fn();

    let currentInputs: string[] = ['foo', 'bar'];

    const { rerender } = renderHookWithProvider(
      () =>
        useMultiPolling({
          startPolling: mockStartPolling,
          stopPollingByPollingToken: mockStopPollingByPollingToken,
          input: currentInputs,
        }),
      {
        metamask: {
          completedOnboarding: true,
        },
      },
    );

    await Promise.all(promises);

    expect(mockStartPolling).toHaveBeenCalledTimes(2);

    // Rerender with a new array reference but same content
    currentInputs = ['foo', 'bar'];
    rerender();

    // Should not have started any new polls
    await waitFor(() => {
      expect(mockStartPolling).toHaveBeenCalledTimes(2);
    });
    // Should not have stopped any polls
    expect(mockStopPollingByPollingToken).not.toHaveBeenCalled();
  });

  it('should stop polls for inputs removed after unmount', async () => {
    const promises: Promise<string>[] = [];
    const mockStartPolling = jest.fn().mockImplementation((input) => {
      const promise = Promise.resolve(`${input}_token`);
      promises.push(promise);
      return promise;
    });
    const mockStopPollingByPollingToken = jest.fn();

    const { unmount } = renderHookWithProvider(
      () =>
        useMultiPolling({
          startPolling: mockStartPolling,
          stopPollingByPollingToken: mockStopPollingByPollingToken,
          input: ['foo', 'bar', 'baz'],
        }),
      {
        metamask: {
          completedOnboarding: true,
        },
      },
    );

    await Promise.all(promises);

    expect(mockStartPolling).toHaveBeenCalledTimes(3);

    unmount();

    // All three should be stopped
    expect(mockStopPollingByPollingToken).toHaveBeenCalledTimes(3);
    expect(mockStopPollingByPollingToken).toHaveBeenCalledWith('foo_token');
    expect(mockStopPollingByPollingToken).toHaveBeenCalledWith('bar_token');
    expect(mockStopPollingByPollingToken).toHaveBeenCalledWith('baz_token');
  });

  it('should not stop valid pending polls when effect re-runs due to function reference change', async () => {
    let resolveFoo: (value: string) => void = () => undefined;

    // Track function instances to verify reference changes
    const startPollingFn1 = jest.fn().mockImplementation((input) => {
      if (input === 'foo') {
        return new Promise<string>((resolve) => {
          resolveFoo = resolve;
        });
      }
      return Promise.resolve(`${input}_token`);
    });

    // New function reference with same behavior
    const startPollingFn2 = jest.fn().mockImplementation((input) => {
      return Promise.resolve(`${input}_token_v2`);
    });

    const mockStopPollingByPollingToken = jest.fn();
    let currentStartPolling = startPollingFn1;

    const { rerender } = renderHookWithProvider(
      () =>
        useMultiPolling({
          startPolling: currentStartPolling,
          stopPollingByPollingToken: mockStopPollingByPollingToken,
          input: ['foo'],
        }),
      {
        metamask: {
          completedOnboarding: true,
        },
      },
    );

    // Effect 1: startPolling called, promise pending
    expect(startPollingFn1).toHaveBeenCalledWith('foo');
    expect(startPollingFn1).toHaveBeenCalledTimes(1);

    // Simulate function reference change (e.g., parent re-render creates new function)
    currentStartPolling = startPollingFn2;
    rerender();

    // Effect 2 should NOT start a new poll because 'foo' is still pending
    expect(startPollingFn2).not.toHaveBeenCalled();

    // Now resolve the first promise
    resolveFoo('foo_token');

    // Wait for the promise callback to execute
    await waitFor(() => {
      // The token should NOT be stopped - 'foo' is still a valid input
      expect(mockStopPollingByPollingToken).not.toHaveBeenCalledWith(
        'foo_token',
      );
    });
  });

  it('should not start duplicate polls when effect re-runs while promise is pending', async () => {
    let resolveFoo: (value: string) => void = () => undefined;
    let callCount = 0;

    const mockStartPolling = jest.fn().mockImplementation((input) => {
      callCount += 1;
      if (input === 'foo' && callCount === 1) {
        return new Promise<string>((resolve) => {
          resolveFoo = resolve;
        });
      }
      return Promise.resolve(`${input}_token_${callCount}`);
    });

    const mockStopPollingByPollingToken = jest.fn();
    let forceRerender = 0;

    const { rerender } = renderHookWithProvider(
      () => {
        // Use a changing value to force effect re-run
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        forceRerender;
        return useMultiPolling({
          startPolling: mockStartPolling,
          stopPollingByPollingToken: mockStopPollingByPollingToken,
          input: ['foo'],
        });
      },
      {
        metamask: {
          completedOnboarding: true,
        },
      },
    );

    expect(mockStartPolling).toHaveBeenCalledTimes(1);

    // Force multiple rerenders while promise is pending
    forceRerender = 1;
    rerender();
    forceRerender = 2;
    rerender();

    // Should still only have one startPolling call (pending check prevents duplicates)
    expect(mockStartPolling).toHaveBeenCalledTimes(1);

    // Resolve the pending promise
    resolveFoo('foo_token');

    await waitFor(() => {
      // Token should be stored, not stopped
      expect(mockStopPollingByPollingToken).not.toHaveBeenCalled();
    });
  });

  it('should allow retry after startPolling rejection', async () => {
    let rejectFoo: (error: Error) => void = () => undefined;
    let callCount = 0;

    const mockStartPolling = jest.fn().mockImplementation((input) => {
      callCount += 1;
      if (input === 'foo' && callCount === 1) {
        // First call rejects
        return new Promise<string>((_, reject) => {
          rejectFoo = reject;
        });
      }
      // Subsequent calls succeed
      return Promise.resolve(`${input}_token_${callCount}`);
    });

    const mockStopPollingByPollingToken = jest.fn();
    let currentInputs: string[] = ['foo'];

    const { rerender } = renderHookWithProvider(
      () =>
        useMultiPolling({
          startPolling: mockStartPolling,
          stopPollingByPollingToken: mockStopPollingByPollingToken,
          input: currentInputs,
        }),
      {
        metamask: {
          completedOnboarding: true,
        },
      },
    );

    // First call is made
    expect(mockStartPolling).toHaveBeenCalledTimes(1);

    // Reject the promise - .finally() will clear pendingPolls
    rejectFoo(new Error('Network error'));

    // Wait for the rejection to propagate and .finally() to run
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Change inputs to trigger effect re-run (useSyncEqualityCheck returns same ref for same content)
    // First remove 'foo', then add it back to force the effect to run again
    currentInputs = ['bar'];
    rerender();

    await waitFor(() => {
      expect(mockStartPolling).toHaveBeenCalledWith('bar');
    });

    // Now add 'foo' back - should retry since pendingPolls was cleared
    currentInputs = ['bar', 'foo'];
    rerender();

    await waitFor(() => {
      expect(mockStartPolling).toHaveBeenCalledTimes(3); // foo (rejected), bar, foo (retry)
    });
  });
});
