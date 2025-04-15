import { act } from '@testing-library/react-hooks';
import { BACKUPANDSYNC_FEATURES } from '@metamask/profile-sync-controller/user-storage';
import { renderHookWithProviderTyped } from '../../../../test/lib/render-helpers';
import { MetamaskIdentityProvider } from '../../../contexts/identity';
import * as actions from '../../../store/actions';
import {
  useDisableProfileSyncing,
  useEnableProfileSyncing,
} from './useProfileSyncing';

describe('useEnableProfileSyncing()', () => {
  it('should enable profile syncing', async () => {
    const mockSetIsBackupAndSyncFeatureEnabled = jest.spyOn(
      actions,
      'setIsBackupAndSyncFeatureEnabled',
    );

    const { result } = renderHookWithProviderTyped(
      () => useEnableProfileSyncing(),
      {},
    );
    await act(async () => {
      await result.current.enableProfileSyncing();
    });

    expect(mockSetIsBackupAndSyncFeatureEnabled).toHaveBeenCalledWith(
      BACKUPANDSYNC_FEATURES.main,
      true,
    );
  });
});

describe('useDisableProfileSyncing()', () => {
  it('should disable profile syncing', async () => {
    const mockSetIsBackupAndSyncFeatureEnabled = jest.spyOn(
      actions,
      'setIsBackupAndSyncFeatureEnabled',
    );

    const { result } = renderHookWithProviderTyped(
      () => useDisableProfileSyncing(),
      {},
      undefined,
      MetamaskIdentityProvider,
    );

    await act(async () => {
      await result.current.disableProfileSyncing();
    });

    expect(mockSetIsBackupAndSyncFeatureEnabled).toHaveBeenCalledWith(
      BACKUPANDSYNC_FEATURES.main,
      false,
    );
  });
});
