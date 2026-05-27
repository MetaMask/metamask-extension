import { Driver } from '../../../webdriver/driver';
import TokenTransferTransactionConfirmation from '../confirmations/token-transfer-confirmation';
import { confirmOrReconnect } from './hardware-wallet-helpers';

class HardwareWalletTokenTransferConfirmation extends TokenTransferTransactionConfirmation {
  private readonly hardwareWalletConfirmButton =
    '[data-testid="confirm-footer-button"]';

  private readonly reconnectButton =
    '[data-testid="reconnect-hardware-wallet-button"]';

  async clickConfirmButton(): Promise<void> {
    console.log(
      '[HardwareWallet] Click confirm button for token transfer transaction',
    );
    const dialogHandle = await this.driver.getCurrentWindowHandle();
    const hasReconnect = await this.driver.isElementPresent(
      this.reconnectButton,
    );
    if (hasReconnect) {
      await this.driver.clickElement(this.reconnectButton);
      await this.driver.waitForSelector(this.hardwareWalletConfirmButton);
    }
    await this.driver.clickElement(this.hardwareWalletConfirmButton);
    await this.driver.waitForWindowToClose(dialogHandle, 90000);
  }

  async clickConfirmButtonOrReconnect(): Promise<void> {
    await confirmOrReconnect(this.driver);
  }
}

export default HardwareWalletTokenTransferConfirmation;
