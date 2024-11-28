import { strict as assert } from 'assert';
import { DAPP_HOST_ADDRESS } from '../../../../constants';
import { Driver } from '../../../../webdriver/driver';
import Confirmation from './confirmation';

export default class SignTypedData extends Confirmation {
  constructor(driver: Driver) {
    super(driver);

    this.driver = driver;
  }

  private origin = { text: DAPP_HOST_ADDRESS };

  private signTypedDataMessage = { text: 'Hi, Alice!' };

  private contract = { css: '.name__value', text: '0xCcCCc...ccccC' };

  private primaryType = { text: 'Mail' };

  private fromName = { text: 'Cow' };

  private fromAddress = { css: '.name__value', text: '0xCD2a3...DD826' };

  private toName = { text: 'Bob' };

  private toAddress = { css: '.name__value', text: '0xbBbBB...bBBbB' };

  private contents = { text: 'Hello, Bob!' };

  private attachment = { text: '0x' };

  private toAddressNum2 = { css: '.name__value', text: '0xB0B0b...00000' };

  async verifyOrigin() {
    const origin = await this.driver.findElement(this.origin);
    assert.ok(origin, 'Origin element is missing or incorrect');
  }

  async verifySignTypedDataMessage() {
    const message = this.driver.findElement(this.signTypedDataMessage);
    assert.ok(await message);
  }

  async verifyContractPetName() {
    const contractPetName = await this.driver.findElement(this.contract);
    assert.ok(
      contractPetName,
      'Contract pet name element is missing or incorrect',
    );
  }

  async verifyPrimaryType() {
    const primaryType = await this.driver.findElement(this.primaryType);
    assert.ok(primaryType, 'Primary type element is missing or incorrect');
  }

  async verifyFromName() {
    const fromName = await this.driver.findElement(this.fromName);
    assert.ok(fromName, 'From name element is missing or incorrect');
  }

  async verifyFromAddress() {
    const fromAddress = await this.driver.findElement(this.fromAddress);
    assert.ok(fromAddress, 'From address element is missing or incorrect');
  }

  async verifyToName() {
    const toName = await this.driver.findElement(this.toName);
    assert.ok(toName, 'To name element is missing or incorrect');
  }

  async verifyToAddress() {
    const toAddress = await this.driver.findElement(this.toAddress);
    assert.ok(toAddress, 'To address element is missing or incorrect');
  }

  async verifyContents() {
    const contents = await this.driver.findElement(this.contents);
    assert.ok(contents, 'Contents element is missing or incorrect');
  }

  async verifyAttachment() {
    const attachment = await this.driver.findElement(this.attachment);
    assert.ok(attachment, 'Attachment element is missing or incorrect');
  }

  async verifyToAddressNum2() {
    const toAddressNum2 = await this.driver.findElement(this.toAddressNum2);
    assert.ok(toAddressNum2, 'To Address num2 element is missing or incorrect');
  }
}
