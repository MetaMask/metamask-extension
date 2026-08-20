import { DAPP_HOST_ADDRESS } from '../../../constants';
import { Driver } from '../../../webdriver/driver';
import { RawLocator } from '../../common';
import Confirmation from './confirmation';

/**
 * Personal sign and SIWE (sign-in with Ethereum) confirmation.
 *
 * Screen: `#/confirmation` for personal_sign / SIWE signature approvals.
 * Owns: signature vs sign-in titles, origin/message checks, and SIWE terms
 * copy.
 * Boundaries: inherits footer/nav from `Confirmation`. Typed-data and permit
 * signatures are `SignTypedData` / `PermitConfirmation`. Snap-rendered
 * sign-in is `SnapSignInConfirmation`.
 * Related: `Confirmation`, `SignTypedData`, `PermitConfirmation`.
 *
 * @see ui/pages/confirmations/components/confirm/info/personal-sign/personal-sign.tsx
 * @see ui/pages/confirmations/components/confirm/info/personal-sign/siwe-sign/siwe-sign.tsx
 * @see ui/pages/confirmations/components/confirm/title/title.tsx
 */
export default class PersonalSignConfirmation extends Confirmation {
  private readonly messageSelector: RawLocator = {
    text: 'Example `personal_sign` message',
  };

  private readonly originSelector: RawLocator = { text: DAPP_HOST_ADDRESS };

  private readonly signatureHeadingTitle: RawLocator = {
    testId: 'confirm-title-text',
    text: 'Signature request',
  };

  private readonly signinConfirmationTitle: RawLocator = {
    testId: 'confirm-title-text',
    text: 'Sign-in request',
  };

  private readonly signinMessageTitle: RawLocator = {
    testId: 'confirm-title-description',
    text: 'A site wants you to sign in to prove you own this account.',
  };

  private readonly signinMessageUrl: RawLocator = {
    text: 'https://127.0.0.1:8080',
  };

  private readonly siweMessage: RawLocator = {
    text: 'I accept the MetaMask Terms of Service: https://community.metamask.io/tos',
  };

  constructor(driver: Driver) {
    super(driver);

    this.driver = driver;
  }

  async checkSiweMessage(): Promise<void> {
    console.log('Verify sign in with ethereum message on confirmation screen');
    await this.driver.waitForMultipleSelectors([
      this.signinConfirmationTitle,
      this.signinMessageTitle,
      this.siweMessage,
      this.signinMessageUrl,
    ]);
  }

  async verifyConfirmationHeadingTitle(): Promise<void> {
    console.log('Verify confirmation heading title is Signature request');
    await this.driver.waitForSelector(this.signatureHeadingTitle);
  }

  async verifyMessage(): Promise<void> {
    console.log('Verify personal sign message on confirmation screen');
    await this.driver.waitForSelector(this.messageSelector);
  }

  async verifyOrigin(): Promise<void> {
    console.log('Verify origin on personal sign confirmation screen');
    await this.driver.waitForSelector(this.originSelector);
  }

  async verifyPersonalSignInfo(): Promise<void> {
    console.log('Verify personal sign info on confirmation screen');
    await this.verifyOrigin();
    await this.verifyMessage();
  }
}
