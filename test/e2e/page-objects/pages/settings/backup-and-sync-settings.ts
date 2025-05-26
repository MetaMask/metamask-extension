import { Driver } from '../../../webdriver/driver';

class BackupAndSyncSettings {
  private readonly driver: Driver;

  private readonly accountSyncToggle =
    '[data-testid="account-syncing-toggle-container"]';

  private readonly backupAndSyncToggle =
    '[data-testid="backup-and-sync-toggle-container"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.accountSyncToggle,
        this.backupAndSyncToggle,
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
}

export default BackupAndSyncSettings;
