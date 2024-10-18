import { Driver } from '../../../../webdriver/driver';
import { RawLocator } from '../../../common';

class WatchAssetConfirmation {
  private driver: Driver;

  private footerConfirmButton: RawLocator;

  constructor(driver: Driver) {
    this.driver = driver;

    this.footerConfirmButton = '[data-testid="page-container-footer-next"]';
  }

  async clickFooterConfirmButton() {
    await this.driver.clickElement(this.footerConfirmButton);
  }
}

export default WatchAssetConfirmation;
