import { Driver } from '../webdriver/driver';
import { Page } from './page';

export class SnapInstallationPage extends Page {
  constructor(driver: Driver) {
    super(driver);
  }

  async navigateToTestSnapsPage(): Promise<void> {
    await this.driver.navigate('https://metamask.github.io/test-snaps/');
  }

  async clickConnectButton(): Promise<void> {
    await this.driver.clickElement('[data-testid="connect-button"]');
  }

  async switchToDialogWindow(): Promise<void> {
    await this.driver.switchToWindowWithTitle('MetaMask Notification');
  }

  async confirmConnection(): Promise<void> {
    await this.driver.clickElement('[data-testid="page-container-footer-next"]');
  }

  async addToMetaMask(): Promise<void> {
    await this.driver.clickElement('[data-testid="add-to-metamask-button"]');
  }

  async installSnap(snapId: string): Promise<void> {
    await this.driver.clickElement(`[data-testid="install-snap-${snapId}"]`);
    await this.driver.wait(async () => {
      const installButton = await this.driver.findElement(`[data-testid="snap-install-button"]`);
      return installButton !== null;
    }, 5000);
    await this.driver.clickElement(`[data-testid="snap-install-button"]`);
  }

  async confirmInstallation(): Promise<void> {
    await this.driver.wait(async () => {
      const confirmButton = await this.driver.findElement(`[data-testid="snap-install-confirm"]`);
      return confirmButton !== null;
    }, 5000);
    await this.driver.clickElement(`[data-testid="snap-install-confirm"]`);
  }

  async waitForPopupClose(): Promise<void> {
    await this.driver.waitForWindowToClose('MetaMask Notification');
  }

  async switchToSnapSimpleKeyringDapp(): Promise<void> {
    await this.driver.switchToWindowWithTitle('Snap Simple Keyring');
  }

  async waitForConnection(): Promise<void> {
    await this.driver.wait(async () => {
      const connectionStatus = await this.driver.findElement('[data-testid="connection-status"]');
      return connectionStatus !== null && (await connectionStatus.getText()) === 'Connected';
    }, 10000);
  }

  async verifyInstallation(snapId: string): Promise<boolean> {
    try {
      await this.driver.wait(async () => {
        const installedSnap = await this.driver.findElement(`[data-testid="installed-snap-${snapId}"]`);
        return installedSnap !== null;
      }, 5000);
      return true;
    } catch (error) {
      console.error(`Failed to verify installation of snap with ID: ${snapId}`);
      return false;
    }
  }
}
