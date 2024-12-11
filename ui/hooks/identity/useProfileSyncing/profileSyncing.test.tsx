import { act } from '@testing-library/react-hooks';
import { renderHookWithProviderTyped } from '../../../../test/lib/render-helpers';
import { MetamaskNotificationsProvider } from '../../../contexts/metamask-notifications';
import * as actions from '../../../store/actions';
import {
  useDisableProfileSyncing,
  useEnableProfileSyncing,
} from './profileSyncing';

describe('useEnableProfileSyncing()', () => {
  it('should enable profile syncing', async () => {
    const mockEnableProfileSyncingAction = jest.spyOn(
      actions,
      'enableProfileSyncing',
    );

    const { result } = renderHookWithProviderTyped(
      () => useEnableProfileSyncing(),
      {},
    );
    await act(async () => {
      await result.current.enableProfileSyncing();
    });

    expect(mockEnableProfileSyncingAction).toHaveBeenCalled();
  });
});

describe('useDisableProfileSyncing()', () => {
  it('should disable profile syncing', async () => {
    const mockDisableProfileSyncingAction = jest.spyOn(
      actions,
      'disableProfileSyncing',
    );

    const { result } = renderHookWithProviderTyped(
      () => useDisableProfileSyncing(),
      {},
      undefined,
      MetamaskNotificationsProvider,
    );

    await act(async () => {
      await result.current.disableProfileSyncing();
    });

    expect(mockDisableProfileSyncingAction).toHaveBeenCalled();
  });

  it('should sign out the user if MetaMetrics is not enabled', async () => {
    const mockPerformSignOutAction = jest.spyOn(actions, 'performSignOut');

    const { result } = renderHookWithProviderTyped(
      () => useDisableProfileSyncing(),
      {
        metamask: {
          participateInMetaMetrics: false,
        },
      },
      undefined,
      MetamaskNotificationsProvider,
    );

    await act(async () => {
      await result.current.disableProfileSyncing();
    });

    expect(mockPerformSignOutAction).toHaveBeenCalled();
  });
});
