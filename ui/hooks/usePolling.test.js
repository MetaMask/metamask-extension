import { cleanup } from '@testing-library/react-hooks';
import { renderHookWithProvider } from '../../test/lib/render-helpers';
import usePolling from './usePolling';

describe('usePolling', () => {
  // eslint-disable-next-line jest/no-done-callback
  it('calls startPollingByNetworkClientId and callback option args with polling token when component instantiating the hook mounts', (done) => {
    const mockStart = jest.fn().mockImplementation(() => {
      return Promise.resolve('pollingToken');
    });
    const mockStop = jest.fn();
    const networkClientId = 'mainnet';
    const options = {};
    const mockState = {
      metamask: {},
    };

    renderHookWithProvider(() => {
      usePolling({
        callback: (pollingToken) => {
          expect(mockStart).toHaveBeenCalledWith(networkClientId, options);
          expect(pollingToken).toBeDefined();
          done();
          return (_pollingToken) => {
            // noop
          };
        },
        startPollingByNetworkClientId: mockStart,
        stopPollingByPollingToken: mockStop,
        networkClientId,
        options,
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
    const options = {};
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
          startPollingByNetworkClientId: mockStart,
          stopPollingByPollingToken: mockStop,
          networkClientId,
          options,
        }),
      mockState,
    );
    cleanup();
  });
});
