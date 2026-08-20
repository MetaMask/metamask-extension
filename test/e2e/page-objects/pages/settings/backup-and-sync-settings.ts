import { Driver } from '../../../webdriver/driver';

/**
 * Settings → Backup and sync: account / contact sync toggles.
 *
 * Screen: `#/settings/backup-and-sync`, reached from
 * `SettingsPage.goToBackupAndSyncSettings`.
 * Owns: page load checks and toggling backup-and-sync, account sync, and
 * contact sync.
 * Boundaries: toggle surface only. QR sync / add-wallet flows belong to
 * `SyncAccountsSettingsPage`; contact CRUD belongs to `ContactsSettings`.
 * Related: `SettingsPage`, `SyncAccountsSettingsPage`, `ContactsSettings`.
 *
 * @see ui/pages/settings/backup-and-sync-tab/backup-and-sync-tab.tsx
 */
class BackupAndSyncSettings {
  private readonly accountSyncToggle =
    '[data-testid="account-syncing-toggle-container"]';

  private readonly backupAndSyncToggle =
    '[data-testid="backup-and-sync-toggle-container"]';

  private readonly contactSyncToggle =
    '[data-testid="contact-syncing-toggle-container"]';

  private readonly driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.accountSyncToggle,
        this.backupAndSyncToggle,
        this.contactSyncToggle,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for Backup And Sync Settings page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Backup And Sync page is loaded');
  }

  async toggleAccountSync(): Promise<void> {
    console.log('Toggling account sync setting');
    await this.driver.clickElement(this.accountSyncToggle);
  }

  async toggleBackupAndSync(): Promise<void> {
    console.log('Toggling backup and sync setting');
    await this.driver.clickElement(this.backupAndSyncToggle);
  }

  async toggleContactSync(): Promise<void> {
    console.log('Toggling contact sync setting');
    await this.driver.clickElement(this.contactSyncToggle);
  }
}

export default BackupAndSyncSettings;
