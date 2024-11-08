import { strict as assert } from 'assert';
import { DAPP_HOST_ADDRESS } from "../../../../constants";
import { Driver } from "../../../../webdriver/driver";
import Confirmation from "./confirmation";

export default class SignTypedDatav3 extends Confirmation{
  constructor(driver: Driver) {
    super(driver);

    this.driver = driver;
  }

  private originSelector = { text: DAPP_HOST_ADDRESS };
  private messageSelector = { text: 'Example `personal_sign` message' }

  async verifyOrigin() {
    const origin = await this.driver.findElement(this.originSelector);
    assert.ok(origin, 'Origin element is missing or incorrect');
  }

  async verifyMessage() {
    const message = this.driver.findElement(this.messageSelector);
    assert.ok(await message);
  }

}