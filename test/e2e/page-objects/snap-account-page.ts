// Snap Account Page Object

import { Driver } from '../webdriver/driver';

export class SnapAccountPage {
  private readonly driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async installSnapSimpleKeyring(isAsyncFlow: boolean): Promise<void> {
    await this.driver.clickElement('#installSnap');
    if (isAsyncFlow) {
      await this.driver.clickElement('#approveSnapInstall');
    }
  }

  async makeNewAccountAndSwitch(): Promise<string> {
    await this.driver.clickElement('#createAccount');
    const newAccountElement = await this.driver.findElement('.account-menu__account');
    return await newAccountElement.getText();
  }

  async signData(locatorID: string, publicKey: string, flowType: string): Promise<void> {
    await this.driver.clickElement(locatorID);
    if (flowType === 'approve') {
      await this.driver.clickElement('#approveSignature');
    } else if (flowType === 'reject') {
      await this.driver.clickElement('#rejectSignature');
    }
  }

  async tempToggleSettingRedesignedConfirmations(): Promise<void> {
    await this.driver.clickElement('#toggleRedesignedConfirmations');
  }
}
