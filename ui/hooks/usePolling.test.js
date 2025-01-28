import { cleanup } from '@testing-library/react-hooks';
import { renderHookWithProvider } from '../../test/lib/render-helpers';
import usePolling from './usePolling';

describe('usePolling', () => {
  // eslint-disable-next-line jest/no-done-callback
  it('calls startPolling and calls back with polling token when component instantiating the hook mounts', (done) => {
    const mockStart = jest.fn().mockImplementation(() => {
      return Promise.resolve('pollingToken');
    });
    const mockStop = jest.fn();
    const networkClientId = 'mainnet';
    const mockState = {
      metamask: {},
    };

    renderHookWithProvider(() => {
      usePolling({
        callback: (pollingToken) => {
          expect(mockStart).toHaveBeenCalledWith({ networkClientId });
          expect(pollingToken).toBeDefined();
          done();
          return (_pollingToken) => {
            // noop
          };
        },
        startPolling: mockStart,
        stopPollingByPollingToken: mockStop,
        input: { networkClientId },
      });
    }, mockState);
  });
  // eslint-disable-next-line jest/no-done-callback
  it('calls the cleanup function with the correct pollingToken when unmounted', (done) => {
    const mockStart = jest.fn().mockImplementation(() => {
      return Promise.resolve('pollingToken');
    });
    const mockStop = jest.fn();
    const networkClientId = 'mainnet';
    const mockState = {
      metamask: {},
    };

    renderHookWithProvider(
      () =>
        usePolling({
          callback: () => {
            return (_pollingToken) => {
              expect(mockStop).toHaveBeenCalledWith(_pollingToken);
              expect(_pollingToken).toBeDefined();
              done();
            };
          },
          startPolling: mockStart,
          stopPollingByPollingToken: mockStop,
          input: { networkClientId },
        }),
      mockState,
    );
    cleanup();
  });
});
