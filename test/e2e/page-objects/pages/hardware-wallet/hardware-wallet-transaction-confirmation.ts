import { Driver } from '../../../webdriver/driver';
import TransactionConfirmation from '../confirmations/transaction-confirmation';
import {
  confirmOrReconnect,
  confirmOrReconnectAndWaitForWindowToClose,
} from './hardware-wallet-helpers';

class HardwareWalletTransactionConfirmation extends TransactionConfirmation {
  constructor(driver: Driver) {
    super(driver);
  }

  async clickFooterConfirmButtonOrReconnect() {
    await confirmOrReconnect(this.driver);
  }

  async clickFooterConfirmButtonAndAndWaitForWindowToClose() {
    await confirmOrReconnectAndWaitForWindowToClose(this.driver);
  }
}

export default HardwareWalletTransactionConfirmation;
