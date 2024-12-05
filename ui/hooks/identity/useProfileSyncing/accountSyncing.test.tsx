import { waitFor } from '@testing-library/react';
import { act } from '@testing-library/react-hooks';
import { renderHookWithProviderTyped } from '../../../../test/lib/render-helpers';
import * as actions from '../../../store/actions';
import {
  useAccountSyncingEffect,
  useDeleteAccountSyncingDataFromUserStorage,
} from './accountSyncing';
import * as ProfileSyncModule from './profileSyncing';

describe('useDeleteAccountSyncingDataFromUserStorage()', () => {
  it('should dispatch account sync data deletion', async () => {
    const mockDeleteAccountSyncAction = jest.spyOn(
      actions,
      'deleteAccountSyncingDataFromUserStorage',
    );

    const { result } = renderHookWithProviderTyped(
      () => useDeleteAccountSyncingDataFromUserStorage(),
      {},
    );

    await act(async () => {
      await result.current.dispatchDeleteAccountData();
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

    renderHookWithProviderTyped(() => useAccountSyncingEffect(), {});
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
