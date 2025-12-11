import { act, waitFor } from '@testing-library/react';
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
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockStartPolling).not.toHaveBeenCalled();
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

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockStartPolling).not.toHaveBeenCalled();
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

    // Resolve bar first (the current input)
    await act(async () => {
      resolveBar('bar_token');
    });

    // Now resolve foo (stale - was removed before resolving)
    await act(async () => {
      resolveFoo('foo_token');
    });

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

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Should not have started any new polls
    expect(mockStartPolling).toHaveBeenCalledTimes(2);
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
});
