import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import configureStore from '../store/store';
import usePolling from './usePolling';

describe('usePolling', () => {
  it('calls callback with polling token', (done) => {
    const mockStart = jest.fn();
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
          (pollingToken: string) => {
            expect(pollingToken).toBeDefined();
            done();
            return (_pollingToken: string) => {
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
});
