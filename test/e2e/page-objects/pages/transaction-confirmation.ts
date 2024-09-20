import { Driver } from '../../webdriver/driver';
import Confirmation from './confirmation';

class TransactionConfirmation extends Confirmation {
  constructor(driver: Driver) {
    super(driver);
  }
}

export default TransactionConfirmation;
