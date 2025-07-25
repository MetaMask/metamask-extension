import { Driver } from '../../../webdriver/driver';

class SendTokenConfirmPage {
  private driver: Driver;

  private readonly cancelButton = '[data-testid="cancel-footer-button"]';

  private readonly confirmButton = '[data-testid="confirm-footer-button"]';

  private readonly nftImage = '[data-testid="nft-default-image"]';

  private readonly recipientAddress = '[data-testid="recipient-address"]';

  private readonly senderAddress = '[data-testid="sender-address"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_nftTransfer(options: {
    sender: string;
    recipient: string;
    nftName: string;
  }): Promise<void> {
    console.log('Checking NFT transfer details');

    const { sender, recipient, nftName } = options;

    await this.driver.waitForSelector(this.nftImage, { timeout: 10000 });

    await this.driver.waitForSelector({
      css: 'h2',
      text: nftName,
    });

    await this.driver.waitForSelector({
      css: this.senderAddress,
      text: sender,
    });

    await this.driver.waitForSelector({
      css: this.recipientAddress,
      text: recipient,
    });

    console.log('NFT transfer details are displayed correctly');
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_tokenTransfer(options: {
    sender: string;
    recipient: string;
    amount: string;
    tokenName: string;
  }): Promise<void> {
    console.log('Checking token transfer details');

    const { sender, recipient, amount, tokenName } = options;

    await this.driver.waitForSelector(
      {
        text: `${amount} ${tokenName}`,
        tag: 'h2',
      },
      { timeout: 10000 },
    );

    await this.driver.waitForSelector(
      {
        css: this.senderAddress,
        text: sender,
      },
      { timeout: 10000 },
    );

    await this.driver.waitForSelector(
      {
        css: this.recipientAddress,
        text: recipient,
      },
      { timeout: 10000 },
    );

    console.log('Token transfer details are correct');
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_pageIsLoaded(): Promise<void> {
    console.log('Checking if Send Token Confirmation page is loaded');
    await this.driver.waitForSelector(this.recipientAddress, {
      timeout: 10000,
    });
    await this.driver.waitForSelector(this.senderAddress, { timeout: 10000 });
    console.log('Send Token Confirmation page is loaded');
  }

  async clickOnCancel(): Promise<void> {
    console.log('Clicking on Cancel button');
    await this.driver.clickElementAndWaitToDisappear(this.cancelButton);
    console.log('Cancel button clicked');
  }

  async clickOnConfirm(): Promise<void> {
    console.log('Clicking on Confirm button');
    await this.driver.clickElementAndWaitToDisappear(this.confirmButton);
    console.log('Confirm button clicked');
  }
}

export default SendTokenConfirmPage;
