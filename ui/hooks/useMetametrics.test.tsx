import { renderHook, act } from '@testing-library/react-hooks';
import React from 'react';
import { Provider } from 'react-redux';
import type { Store } from 'redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import * as actions from '../store/actions';
import { useEnableMetametrics, useDisableMetametrics } from './useMetametrics';

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

jest.mock('../store/actions', () => ({
  setParticipateInMetaMetrics: jest.fn(),
  showLoadingIndication: jest.fn(),
  hideLoadingIndication: jest.fn(),
}));

describe('useMetametrics', () => {
  let store: Store;

  beforeEach(() => {
    store = mockStore({
      metamask: {
        participateInMetaMetrics: false,
      },
    });

    store.dispatch = jest.fn().mockImplementation((action) => {
      if (typeof action === 'function') {
        // eslint-disable-next-line @typescript-eslint/unbound-method -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31863
        return action(store.dispatch, store.getState);
      }
      return Promise.resolve();
    });

    jest.clearAllMocks();
  });

  it('should enable MetaMetrics', async () => {
    store.getState = () => ({
      metamask: {
        participateInMetaMetrics: false,
      },
    });

    const { result, waitForNextUpdate } = renderHook(
      () => useEnableMetametrics(),
      {
        wrapper: ({ children }) => (
          <Provider store={store}>{children}</Provider>
        ),
      },
    );

    act(() => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31878
      result.current.enableMetametrics();
    });

    await waitForNextUpdate();

    expect(actions.setParticipateInMetaMetrics).toHaveBeenCalledWith(true);
    expect(store.dispatch).toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });

  it('should disable MetaMetrics', async () => {
    store.getState = () => ({
      metamask: {
        participateInMetaMetrics: true,
      },
    });

    const { result, waitForNextUpdate } = renderHook(
      () => useDisableMetametrics(),
      {
        wrapper: ({ children }) => (
          <Provider store={store}>{children}</Provider>
        ),
      },
    );

    act(() => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises -- TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31878
      result.current.disableMetametrics();
    });

    await waitForNextUpdate();

    expect(actions.setParticipateInMetaMetrics).toHaveBeenCalledWith(false);
    expect(result.current.loading).toBe(false);
  });
});
