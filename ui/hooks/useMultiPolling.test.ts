import { renderHook } from '@testing-library/react-hooks';

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
    const initialProps = {
      startPolling: mockStartPolling,
      stopPollingByPollingToken: mockStopPollingByPollingToken,
      input: inputs,
    };

    const { unmount, rerender } = renderHook(
      ({ startPolling, stopPollingByPollingToken, input }) =>
        useMultiPolling({
          startPolling,
          stopPollingByPollingToken,
          input,
        }),
      {
        initialProps,
      },
    );

    // All inputs should start polling
    await Promise.all(promises);
    for (const input of inputs) {
      expect(mockStartPolling).toHaveBeenCalledWith(input);
    }

    // Remove one input, and add another
    rerender({ ...initialProps, input: ['baz', ...inputs.slice(1)] });
    expect(mockStartPolling).toHaveBeenCalledWith('baz');
    expect(mockStopPollingByPollingToken).toHaveBeenCalledWith('foo_token');

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
