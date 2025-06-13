import { act } from '@testing-library/react-hooks';
import { BACKUPANDSYNC_FEATURES } from '@metamask/profile-sync-controller/user-storage';
import { renderHookWithProviderTyped } from '../../../../test/lib/render-helpers';
import { MetamaskIdentityProvider } from '../../../contexts/identity';
import * as actions from '../../../store/actions';
import { useBackupAndSync } from './useBackupAndSync';

describe('useBackupAndSync()', () => {
  it('should enable backup and sync', async () => {
    const mockSetIsBackupAndSyncFeatureEnabled = jest.spyOn(
      actions,
      'setIsBackupAndSyncFeatureEnabled',
    );

    const { result } = renderHookWithProviderTyped(
      () => useBackupAndSync(),
      {
        metamask: {
          keyrings: [],
        },
      },
      undefined,
      MetamaskIdentityProvider,
    );
    await act(async () => {
      await result.current.setIsBackupAndSyncFeatureEnabled(
        BACKUPANDSYNC_FEATURES.main,
        true,
      );
    });

    expect(mockSetIsBackupAndSyncFeatureEnabled).toHaveBeenCalledWith(
      BACKUPANDSYNC_FEATURES.main,
      true,
    );
  });
});
