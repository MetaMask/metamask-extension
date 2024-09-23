import { Driver } from '../webdriver/driver';
import { Page } from './page';

export class SnapInstallationPage extends Page {
  constructor(driver: Driver) {
    super(driver);
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
