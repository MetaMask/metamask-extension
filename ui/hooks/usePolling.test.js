import { cleanup } from '@testing-library/react-hooks';
import { renderHookWithProvider } from '../../test/lib/render-helpers';
import {
  addPollingTokenToAppState,
  removePollingTokenFromAppState,
} from '../store/actions';
import usePolling from './usePolling';

jest.mock('../store/actions', () => ({
  addPollingTokenToAppState: jest.fn(),
  removePollingTokenFromAppState: jest.fn(),
}));

describe('usePolling', () => {
  // eslint-disable-next-line jest/no-done-callback
  it('starts polling and executes the callback with the polling token when mounted', (done) => {
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
          expect(addPollingTokenToAppState).toHaveBeenCalledWith(pollingToken);
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
  it('calls the cleanup function with the correct polling token when unmounted', (done) => {
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
              expect(removePollingTokenFromAppState).toHaveBeenCalledWith(
                _pollingToken,
              );
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
