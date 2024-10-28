import { waitFor } from '@testing-library/react';
import { act, renderHook } from '@testing-library/react-hooks';
import React, { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import * as actions from '../../../store/actions';
import {
  useAccountSyncingEffect,
  useDeleteAccountSyncingDataFromUserStorage,
} from './accountSyncing';
import * as ProfileSyncModule from './profileSyncing';

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

const arrangeMockStore = () => {
  const store = mockStore();

  store.dispatch = jest.fn().mockImplementation((action) => {
    if (typeof action === 'function') {
      return action(store.dispatch, store.getState);
    }
    return Promise.resolve();
  });

  jest.clearAllMocks();

  return { store };
};

const RenderWithProviders = ({
  store,
  children,
}: {
  store: Store;
  children: ReactNode;
}) => <Provider store={store}>{children}</Provider>;

describe('useDeleteAccountSyncingDataFromUserStorage()', () => {
  it('should dispatch account sync data deletion', async () => {
    const mockDeleteAccountSyncAction = jest.spyOn(
      actions,
      'deleteAccountSyncingDataFromUserStorage',
    );

    const { store } = arrangeMockStore();

    const { result } = renderHook(
      () => useDeleteAccountSyncingDataFromUserStorage(),
      {
        wrapper: ({ children }) => (
          <RenderWithProviders store={store}>{children}</RenderWithProviders>
        ),
      },
    );

    act(() => {
      result.current.dispatchDeleteAccountData();
    });

    expect(mockDeleteAccountSyncAction).toHaveBeenCalled();
  });
});

describe('useAccountSyncingEffect', () => {
  const arrangeMocks = () => {
    const mockUseShouldProfileSync = jest.spyOn(
      ProfileSyncModule,
      'useShouldDispatchProfileSyncing',
    );
    const mockSyncAccountsAction = jest.spyOn(
      actions,
      'syncInternalAccountsWithUserStorage',
    );
    return {
      mockUseShouldProfileSync,
      mockSyncAccountsAction,
    };
  };

  const arrangeAndAct = (props: { profileSyncConditionsMet: boolean }) => {
    const mocks = arrangeMocks();
    mocks.mockUseShouldProfileSync.mockReturnValue(
      props.profileSyncConditionsMet,
    );

    const { store } = arrangeMockStore();
    renderHook(() => useAccountSyncingEffect(), {
      wrapper: ({ children }) => (
        <RenderWithProviders store={store}>{children}</RenderWithProviders>
      ),
    });

    return mocks;
  };

  it('should run effect if profile sync conditions are met', async () => {
    const mocks = arrangeAndAct({ profileSyncConditionsMet: true });
    await waitFor(() => {
      expect(mocks.mockSyncAccountsAction).toHaveBeenCalled();
    });
  });

  it('should not run effect if profile sync conditions are not met', async () => {
    const mocks = arrangeAndAct({ profileSyncConditionsMet: false });
    await waitFor(() => {
      expect(mocks.mockSyncAccountsAction).not.toHaveBeenCalled();
    });
  });
});
