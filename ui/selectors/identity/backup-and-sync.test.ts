import {
  selectIsBackupAndSyncEnabled,
  selectIsAccountSyncingEnabled,
  selectIsAccountSyncingReadyToBeDispatched,
  selectIsBackupAndSyncUpdateLoading,
} from './backup-and-sync';

describe('Backup And Sync Selectors', () => {
  const mockState = {
    metamask: {
      isBackupAndSyncEnabled: true,
      isBackupAndSyncUpdateLoading: false,
      isAccountSyncingEnabled: true,
      isAccountSyncingReadyToBeDispatched: false,
      hasAccountSyncingSyncedAtLeastOnce: false,
      isAccountSyncingInProgress: false,
    },
  };

  it('selects the Backup And Sync status', () => {
    expect(selectIsBackupAndSyncEnabled(mockState)).toBe(true);
  });

  it('selects the Account Syncing status', () => {
    expect(selectIsAccountSyncingEnabled(mockState)).toBe(true);
  });

  it('selects the Account Syncing ready to be dispatched status', () => {
    expect(selectIsAccountSyncingReadyToBeDispatched(mockState)).toBe(false);
  });

  it('selects the Backup And Sync update loading status', () => {
    expect(selectIsBackupAndSyncUpdateLoading(mockState)).toBe(false);
  });
});
