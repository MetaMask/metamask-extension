import { Driver } from '../../webdriver/driver';

export default class SnapListPage {
  private driver: Driver;

  private snapListContainer: string;
  private snapItem: string;
  private snapToggle: string;
  private snapName: string;
  private noSnapsMessage: string;

  constructor(driver: Driver) {
    this.driver = driver;
    this.snapListContainer = '.snap-list-container';
    this.snapItem = '.snap-item';
    this.snapToggle = '.snap-toggle';
    this.snapName = '.snap-name';
    this.noSnapsMessage = '.no-snaps-message';
  }

  async getSnapList(): Promise<any[]> {
    return await this.driver.findElements(this.snapItem);
  }

  async toggleSnap(snapName: string): Promise<void> {
    const snapItems = await this.getSnapList();
    for (const item of snapItems) {
      const name = await item.findElement(this.snapName).getText();
      if (name === snapName) {
        await item.findElement(this.snapToggle).click();
        break;
      }
    }
  }

  async isSnapEnabled(snapName: string): Promise<boolean> {
    const snapItems = await this.getSnapList();
    for (const item of snapItems) {
      const name = await item.findElement(this.snapName).getText();
      if (name === snapName) {
        const toggleClass = await item.findElement(this.snapToggle).getAttribute('class');
        return toggleClass.includes('enabled');
      }
    }
    return false;
  }

  async verifyNoSnapsMessage(): Promise<void> {
    await this.driver.waitForSelector(this.noSnapsMessage);
  }
}
