import React from 'react';
import { renderHook, cleanup } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import configureStore from '../store/store';
import usePolling from './usePolling';

describe('usePolling', () => {
  // eslint-disable-next-line jest/no-done-callback
  it('calls callback with polling token', (done) => {
    const mockStart = jest.fn().mockImplementation(() => {
      return 'pollingToken';
    });
    const mockStop = jest.fn();
    const networkClientId = 'mainnet';
    const options = {};
    const mockState = {
      metamask: {},
    };

    const wrapper = ({ children }) => (
      <>
        <Provider store={configureStore(mockState)}>{children}</Provider>
      </>
    );

    renderHook(
      () => {
        usePolling(
          (pollingToken) => {
            expect(mockStart).toHaveBeenCalledWith(networkClientId, options);
            expect(pollingToken).toBeDefined();
            done();
            return (_pollingToken) => {
              // noop
            };
          },
          mockStart,
          mockStop,
          networkClientId,
          options,
        );
      },
      { wrapper },
    );
  });
  // eslint-disable-next-line jest/no-done-callback
  it('calls the cleanup function when unmounted', (done) => {
    const mockStart = jest.fn().mockImplementation(() => {
      return 'pollingToken';
    });
    const mockStop = jest.fn();
    const networkClientId = 'mainnet';
    const options = {};
    const mockState = {
      metamask: {},
    };

    const wrapper = ({ children }) => (
      <>
        <Provider store={configureStore(mockState)}>{children}</Provider>
      </>
    );

    renderHook(
      () => {
        usePolling(
          () => {
            return (_pollingToken) => {
              expect(mockStop).toHaveBeenCalledWith(_pollingToken);
              expect(_pollingToken).toBeDefined();
              done();
            };
          },
          mockStart,
          mockStop,
          networkClientId,
          options,
        );
      },
      { wrapper },
    );
    cleanup();
  });
});
