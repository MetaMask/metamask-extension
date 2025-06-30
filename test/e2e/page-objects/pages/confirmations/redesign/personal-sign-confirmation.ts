import { strict as assert } from 'assert';
import { DAPP_HOST_ADDRESS } from '../../../../constants';
import { Driver } from '../../../../webdriver/driver';
import Confirmation from './confirmation';

export default class PersonalSignConfirmation extends Confirmation {
  constructor(driver: Driver) {
    super(driver);

    this.driver = driver;
  }

  private signatureHeadingTitle = { text: 'Signature request' };

  private originSelector = { text: DAPP_HOST_ADDRESS };

  private messageSelector = { text: 'Example `personal_sign` message' };

  private signinConfirmationTitle = {
    text: 'Sign-in request',
    css: 'h2',
  };

  private siweMessage = {
    text: 'I accept the MetaMask Terms of Service: https://community.metamask.io/tos',
  };

  private signinMessageTitle = {
    text: 'A site wants you to sign in to prove you own this account.',
    css: 'p',
  };

  private signinMessageUrl = {
    text: 'https://127.0.0.1:8080',
    css: 'p',
  };

  async verifyOrigin() {
    const origin = await this.driver.findElement(this.originSelector);
    assert.ok(origin, 'Origin element is missing or incorrect');
  }

  async verifyMessage() {
    const message = this.driver.findElement(this.messageSelector);
    assert.ok(await message);
  }

  async check_siweMessage() {
    console.log('Verify sign in with ethereum message on confirmation screen');
    await this.driver.waitForMultipleSelectors([
      this.signinConfirmationTitle,
      this.signinMessageTitle,
      this.siweMessage,
      this.signinMessageUrl,
    ]);
  }

  async verifyConfirmationHeadingTitle() {
    console.log('Verify confirmation heading title is Signature request');
    await this.driver.waitForSelector(this.signatureHeadingTitle);
  }
}
