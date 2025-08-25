import { LavaDomeDebug } from '@lavamoat/lavadome-core';
import { tEn } from '../../../../lib/i18n-helpers';
import { Driver } from '../../../webdriver/driver';
import { WALLET_PASSWORD } from '../../../constants';

type RevealPrivateKeyOptions = {
  expectedPrivateKey: string;
  password?: string;
  expectedPasswordError?: boolean;
};

class AccountDetailsModal {
  private driver: Driver;

  private readonly accountAddressText =
    '[data-testid="account-address-shortened"]';

  private readonly accountAuthenticateInput = '#account-details-authenticate';

  private readonly accountPrivateKeyText =
    '[data-testid="account-details-key"]';

  private readonly accountQrCodeImage = '.qr-code__wrapper';

  private readonly closeAccountModalButton =
    'header button[aria-label="Close"]';

  private readonly copyAddressButton =
    '[data-testid="address-copy-button-text"]';

  private readonly editableLabelButton =
    '[data-testid="editable-label-button"]';

  private readonly detailsTabButton = '[data-testid="editable-label-button"]';

  private readonly editableLabelInput = '[data-testid="editable-input"] input';

  private readonly errorMessageForIncorrectPassword = {
    css: '.mm-help-text',
    text: 'Incorrect Password.',
  };

  private readonly holdToRevealPrivateKeyButton = {
    text: tEn('holdToRevealPrivateKey'),
    tag: 'span',
  };

  private readonly saveAccountLabelButton =
    '[data-testid="save-account-label-input"]';

  private readonly showPrivateKeyButton = {
    css: 'button',
    text: 'Show private key',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.editableLabelButton,
        this.copyAddressButton,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for account details modal to be loaded',
        e,
      );
      throw e;
    }
    console.log('Account details modal is loaded');
  }

  async goToDetailsTab(): Promise<void> {
    await this.driver.clickElementSafe({ text: 'Details', tag: 'button' });
  }

  async closeAccountDetailsModal(): Promise<void> {
    await this.driver.clickElementAndWaitToDisappear(
      this.closeAccountModalButton,
    );
  }

  /**
   * Change the label of the account in the account details modal.
   *
   * @param newLabel - The new label to set for the account.
   */
  async changeAccountLabel(newLabel: string): Promise<void> {
    console.log(
      `Account details modal opened, changing account label to: ${newLabel}`,
    );
    await this.driver.clickElement(this.editableLabelButton);
    await this.driver.fill(this.editableLabelInput, newLabel);
    await this.driver.clickElement(this.saveAccountLabelButton);
    await this.closeAccountDetailsModal();
  }

  async getAccountAddress(): Promise<string> {
    console.log(`Get account address in account details modal`);
    await this.driver.waitForSelector(this.accountAddressText);
    const accountAddress = await (
      await this.driver.findElement(this.accountAddressText)
    ).getText();
    await this.closeAccountDetailsModal();
    return accountAddress;
  }

  /**
   * Reveal the private key of the account and verify it is correct in account details modal.
   *
   * @param options - The options object.
   * @param options.expectedPrivateKey - The expected private key to verify.
   * @param options.password - The password to authenticate with. Defaults to the default wallet password.
   * @param options.expectedPasswordError - Whether to expect a password error. Defaults to false.
   */
  async revealPrivateKeyAndVerify({
    expectedPrivateKey,
    password = WALLET_PASSWORD,
    expectedPasswordError = false,
  }: RevealPrivateKeyOptions): Promise<void> {
    console.log(
      `Reveal private key and verify it is correct in account details modal`,
    );
    await this.driver.clickElement(this.showPrivateKeyButton);
    await this.driver.fill(this.accountAuthenticateInput, password);
    await this.driver.press(
      this.accountAuthenticateInput,
      this.driver.Key.ENTER,
    );
    if (expectedPasswordError) {
      await this.driver.waitForSelector(this.errorMessageForIncorrectPassword);
      await this.driver.assertElementNotPresent(
        this.holdToRevealPrivateKeyButton,
      );
    } else {
      await this.driver.holdMouseDownOnElement(
        this.holdToRevealPrivateKeyButton,
        2000,
      );
      // Verify the private key is expected
      await this.driver.wait(async () => {
        const privateKey = await this.driver.findElement(
          this.accountPrivateKeyText,
        );
        const displayedPrivateKey = LavaDomeDebug.stripDistractionFromText(
          await privateKey.getText(),
        );
        return displayedPrivateKey === expectedPrivateKey;
      });
    }
  }

  /**
   * Check that the correct address is displayed in the account details modal.
   *
   * @param expectedAddress - The expected address to check.
   */
  async checkAddressInAccountDetailsModal(
    expectedAddress: string,
  ): Promise<void> {
    console.log(
      `Check that address ${expectedAddress} is displayed in account details modal`,
    );
    await this.driver.waitForSelector(this.accountQrCodeImage);
    await this.driver.waitForSelector({
      css: this.accountAddressText,
      text: expectedAddress,
    });
  }

  async checkShowPrivateKeyButtonIsNotDisplayed(): Promise<void> {
    console.log('Check that show private key button is not displayed');
    await this.driver.assertElementNotPresent(this.showPrivateKeyButton);
  }

  async triggerAccountSwitch(): Promise<void> {
    await this.driver.clickElement(
      '[data-testid="switch_account-Localhost 8545"]',
    );
  }
}

export default AccountDetailsModal;
