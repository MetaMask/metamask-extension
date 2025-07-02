import { Driver } from '../../../webdriver/driver';

class BackupAndSyncSettings {
  private readonly driver: Driver;

  private readonly accountSyncToggle =
    '[data-testid="account-syncing-toggle-container"]';

  private readonly backupAndSyncToggle =
    '[data-testid="backup-and-sync-toggle-container"]';

  private readonly contactSyncToggle =
    '[data-testid="contact-syncing-toggle-container"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
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
