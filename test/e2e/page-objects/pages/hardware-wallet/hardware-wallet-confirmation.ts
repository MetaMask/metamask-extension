import { Driver } from '../../../webdriver/driver';
import Confirmation from '../confirmations/confirmation';
import {
  confirmOrReconnect,
  confirmOrReconnectAndWaitForWindowToClose,
} from './hardware-wallet-helpers';

class HardwareWalletConfirmation extends Confirmation {
  private reconnectHardwareWalletButton =
    '[data-testid="reconnect-hardware-wallet-button"]';

  constructor(driver: Driver) {
    super(driver);
  }

  async clickReconnectHardwareWalletButton() {
    await this.driver.clickElement(this.reconnectHardwareWalletButton);
  }

  async clickFooterConfirmButtonOrReconnect() {
    await confirmOrReconnect(this.driver);
  }

  async clickFooterConfirmButtonAndAndWaitForWindowToClose() {
    await confirmOrReconnectAndWaitForWindowToClose(this.driver);
  }
}

export default HardwareWalletConfirmation;
