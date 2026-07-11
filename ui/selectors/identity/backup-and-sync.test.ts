import {
  selectIsBackupAndSyncEnabled,
  selectIsAccountSyncingEnabled,
  selectIsBackupAndSyncUpdateLoading,
  selectIsContactSyncingEnabled,
  selectIsRampsSyncingEnabled,
} from './backup-and-sync';

describe('Backup And Sync Selectors', () => {
  const mockState = {
    metamask: {
      isBackupAndSyncEnabled: true,
      isBackupAndSyncUpdateLoading: false,
      isAccountSyncingEnabled: true,
      isContactSyncingEnabled: true,
      isContactSyncingInProgress: false,
      isRampsSyncingEnabled: true,
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

  it('selects the Ramps Syncing status', () => {
    expect(selectIsRampsSyncingEnabled(mockState)).toBe(true);
  });

  it('defaults Ramps Syncing to true when absent', () => {
    expect(
      selectIsRampsSyncingEnabled({
        metamask: {
          isBackupAndSyncEnabled: true,
          isBackupAndSyncUpdateLoading: false,
          isAccountSyncingEnabled: true,
          isContactSyncingEnabled: true,
        },
      }),
    ).toBe(true);
  });
});
