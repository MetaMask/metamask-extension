import {
  selectIsBackupAndSyncEnabled,
  selectIsAccountSyncingEnabled,
  selectIsAccountSyncingReadyToBeDispatched,
  selectIsBackupAndSyncUpdateLoading,
} from './backup-and-sync';

describe('Backup And Sync Selectors', () => {
  const mockState = {
    metamask: {
      isProfileSyncingEnabled: true,
      isProfileSyncingUpdateLoading: false,
      isAccountSyncingEnabled: true,
      isAccountSyncingReadyToBeDispatched: false,
      hasAccountSyncingSyncedAtLeastOnce: false,
      isAccountSyncingInProgress: false,
    },
  };

  it('should select the Backup And Sync status', () => {
    expect(selectIsBackupAndSyncEnabled(mockState)).toBe(true);
  });

  it('should select the Account Syncing status', () => {
    expect(selectIsAccountSyncingEnabled(mockState)).toBe(true);
  });

  it('should select the Account Syncing ready to be dispatched status', () => {
    expect(selectIsAccountSyncingReadyToBeDispatched(mockState)).toBe(false);
  });

  it('should select the Backup And Sync update loading status', () => {
    expect(selectIsBackupAndSyncUpdateLoading(mockState)).toBe(false);
  });
});
