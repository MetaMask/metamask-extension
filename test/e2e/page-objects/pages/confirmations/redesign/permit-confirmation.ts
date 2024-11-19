import { strict as assert } from 'assert';
import { Driver } from '../../../../webdriver/driver';
import { DAPP_HOST_ADDRESS } from '../../../../constants';
import Confirmation from './confirmation';

export default class PermitConfirmation extends Confirmation {
  constructor(driver: Driver) {
    super(driver);

    this.driver = driver;
  }

  private originSelector = { text: DAPP_HOST_ADDRESS };

  private contractPetNameSelector = {
    css: '.name__value',
    text: '0xCcCCc...ccccC',
  };

  private primaryTypeSelector = { text: 'Permit' };

  private ownerSelector = { css: '.name__name', text: 'Account 1' };

  private spenderSelector = { css: '.name__value', text: '0x5B38D...eddC4' };

  private valueSelector = { text: '3,000' };

  private nonceSelector = { text: '0' };

  private deadlineSelector = { text: '09 June 3554, 16:53' };

  async verifyOrigin() {
    const origin = await this.driver.findElement(this.originSelector);
    assert.ok(origin, 'Origin element is missing or incorrect');
  }

  async verifyContractPetName() {
    const contractPetName = await this.driver.findElement(
      this.contractPetNameSelector,
    );
    assert.ok(
      contractPetName,
      'Contract Pet Name element is missing or incorrect',
    );
  }

  async verifyPrimaryType() {
    const primaryType = await this.driver.findElement(this.primaryTypeSelector);
    assert.ok(primaryType, 'Primary Type element is missing or incorrect');
  }

  async verifyOwner() {
    const owner = await this.driver.findElement(this.ownerSelector);
    assert.ok(owner, 'Owner element is missing or incorrect');
  }

  async verifySpender() {
    const spender = await this.driver.findElement(this.spenderSelector);
    assert.ok(spender, 'Spender element is missing or incorrect');
  }

  async verifyValue() {
    const value = await this.driver.findElement(this.valueSelector);
    assert.ok(value, 'Value element is missing or incorrect');
  }

  async verifyNonce() {
    const nonce = await this.driver.findElement(this.nonceSelector);
    assert.ok(nonce, 'Nonce element is missing or incorrect');
  }

  async verifyDeadline() {
    const deadline = await this.driver.findElement(this.deadlineSelector);
    assert.ok(deadline, 'Deadline element is missing or incorrect');
  }
}
