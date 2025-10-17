import { renderHookWithProvider } from '../../test/lib/render-helpers';
import useMultiPolling from './useMultiPolling';

describe('useMultiPolling', () => {
  it('Should start/stop polling when inputs are added/removed, and stop on dismount', async () => {
    const promises: Promise<string>[] = [];
    const mockStartPolling = jest.fn().mockImplementation((input) => {
      const promise = Promise.resolve(`${input}_token`);
      promises.push(promise);
      return promise;
    });

    const mockStopPollingByPollingToken = jest.fn();
    const inputs = ['foo', 'bar'];

    const { unmount, rerender } = renderHookWithProvider(
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

    // All inputs should start polling
    await Promise.all(promises);
    for (const input of inputs) {
      expect(mockStartPolling).toHaveBeenCalledWith(input);
    }

    // Remove one input, and add another
    inputs[0] = 'baz';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rerender({ input: inputs } as any);
    expect(mockStopPollingByPollingToken).toHaveBeenCalledWith('foo_token');
    expect(mockStartPolling).toHaveBeenCalledWith('baz');

    // All inputs should stop polling on dismount
    await Promise.all(promises);
    unmount();
    for (const input of inputs) {
      expect(mockStopPollingByPollingToken).toHaveBeenCalledWith(
        `${input}_token`,
      );
    }
  });
});
