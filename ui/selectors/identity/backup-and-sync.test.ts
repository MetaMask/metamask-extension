import {
  selectIsBackupAndSyncEnabled,
  selectIsAccountSyncingEnabled,
  selectIsBackupAndSyncUpdateLoading,
  selectIsContactSyncingEnabled,
} from './backup-and-sync';

describe('Backup And Sync Selectors', () => {
  const mockState = {
    metamask: {
      isBackupAndSyncEnabled: true,
      isBackupAndSyncUpdateLoading: false,
      isAccountSyncingEnabled: true,
      hasAccountSyncingSyncedAtLeastOnce: false,
      isAccountSyncingInProgress: false,
      isContactSyncingEnabled: true,
      isContactSyncingInProgress: false,
    },
  };

  it('selects the Backup And Sync status', () => {
    expect(selectIsBackupAndSyncEnabled(mockState)).toBe(true);
  });

  it('selects the Account Syncing status', () => {
    expect(selectIsAccountSyncingEnabled(mockState)).toBe(true);
  });

  it('selects the Backup And Sync update loading status', () => {
    expect(selectIsBackupAndSyncUpdateLoading(mockState)).toBe(false);
  });

  it('selects the Contact Syncing status', () => {
    expect(selectIsContactSyncingEnabled(mockState)).toBe(true);
  });
});
