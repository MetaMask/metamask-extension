import { Driver } from '../webdriver/driver';
import { Page } from './page';

export class SnapInstallationPage extends Page {
  private readonly connectButtonSelector = '[data-testid="connect-button"]';
  private readonly confirmConnectionSelector = '[data-testid="page-container-footer-next"]';
  private readonly addToMetaMaskSelector = '[data-testid="add-to-metamask-button"]';
  private readonly snapInstallButtonSelector = '[data-testid="snap-install-button"]';
  private readonly snapInstallConfirmSelector = '[data-testid="snap-install-confirm"]';
  private readonly connectionStatusSelector = '[data-testid="connection-status"]';

  constructor(driver: Driver) {
    super(driver);
  }

  async navigateToTestSnapsPage(): Promise<void> {
    await this.driver.navigate('https://metamask.github.io/test-snaps/');
  }

  private async getConnectButton() {
    return await this.driver.findElement(this.connectButtonSelector);
  }

  async clickConnectButton(): Promise<void> {
    const connectButton = await this.getConnectButton();
    await connectButton.click();
  }

  async switchToDialogWindow(): Promise<void> {
    await this.driver.switchToWindowWithTitle('MetaMask Notification');
  }

  private async getConfirmConnectionButton() {
    return await this.driver.findElement(this.confirmConnectionSelector);
  }

  async confirmConnection(): Promise<void> {
    const confirmButton = await this.getConfirmConnectionButton();
    await confirmButton.click();
  }

  private async getAddToMetaMaskButton() {
    return await this.driver.findElement(this.addToMetaMaskSelector);
  }

  async addToMetaMask(): Promise<void> {
    const addButton = await this.getAddToMetaMaskButton();
    await addButton.click();
  }

  private async getInstallSnapButton(snapId: string) {
    return await this.driver.findElement(`[data-testid="install-snap-${snapId}"]`);
  }

  async installSnap(snapId: string): Promise<void> {
    const installButton = await this.getInstallSnapButton(snapId);
    await installButton.click();
    await this.driver.wait(async () => {
      const snapInstallButton = await this.driver.findElement(this.snapInstallButtonSelector);
      return snapInstallButton !== null;
    }, 5000);
    const snapInstallButton = await this.driver.findElement(this.snapInstallButtonSelector);
    await snapInstallButton.click();
  }

  private async getConfirmInstallationButton() {
    return await this.driver.findElement(this.snapInstallConfirmSelector);
  }

  async confirmInstallation(): Promise<void> {
    await this.driver.wait(async () => {
      const confirmButton = await this.getConfirmInstallationButton();
      return confirmButton !== null;
    }, 5000);
    const confirmButton = await this.getConfirmInstallationButton();
    await confirmButton.click();
  }

  async waitForPopupClose(): Promise<void> {
    await this.driver.waitForWindowToClose('MetaMask Notification');
  }

  async switchToSnapSimpleKeyringDapp(): Promise<void> {
    await this.driver.switchToWindowWithTitle('Snap Simple Keyring');
  }

  private async getConnectionStatus() {
    return await this.driver.findElement(this.connectionStatusSelector);
  }

  async waitForConnection(): Promise<void> {
    await this.driver.wait(async () => {
      const connectionStatus = await this.getConnectionStatus();
      return connectionStatus !== null && (await connectionStatus.getText()) === 'Connected';
    }, 10000);
  }

  private async getInstalledSnap(snapId: string) {
    return await this.driver.findElement(`[data-testid="installed-snap-${snapId}"]`);
  }

  async verifyInstallation(snapId: string): Promise<boolean> {
    try {
      await this.driver.wait(async () => {
        const installedSnap = await this.getInstalledSnap(snapId);
        return installedSnap !== null;
      }, 5000);
      return true;
    } catch (error) {
      console.error(`Failed to verify installation of snap with ID: ${snapId}`);
      return false;
    }
  }
}
