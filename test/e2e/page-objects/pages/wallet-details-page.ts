import { Driver } from '../../webdriver/driver';

class WalletDetailsPage {
  private readonly driver: Driver;

  private readonly walletDetailsPage = '.wallet-details-page';

  private readonly addAccountButton =
    '.wallet-details-page__add-account-button';

  private readonly accountTypeModal = '.multichain-account-menu-popover';

  private readonly ethereumAccountOption = {
    text: 'Ethereum account',
    tag: 'button',
  };

  private readonly solanaAccountOption = {
    text: 'Solana account',
    tag: 'button',
  };

  private readonly accountItems =
    '[data-testid^="wallet-details-account-item-"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    console.log('Check wallet details page is loaded');
    await this.driver.waitForSelector(this.walletDetailsPage);
  }

  async checkWalletNameIsDisplayed(walletName: string): Promise<void> {
    console.log(`Check wallet name "${walletName}" is displayed`);
    await this.driver.waitForSelector({
      text: walletName,
      tag: 'p',
    });
  }

  async checkBalanceIsDisplayed(balance: string): Promise<void> {
    console.log(`Check balance "${balance}" is displayed`);
    await this.driver.waitForSelector({
      text: balance,
      tag: 'span',
    });
  }

  async checkAccountIsDisplayed(accountName: string): Promise<void> {
    console.log(`Check account "${accountName}" is displayed`);
    await this.driver.waitForSelector({
      text: accountName,
      tag: 'p',
    });
  }

  async checkAddAccountButtonIsDisplayed(): Promise<void> {
    console.log('Check add account button is displayed');
    await this.driver.waitForSelector(this.addAccountButton);
  }

  async clickAddAccountButton(): Promise<void> {
    console.log('Click add account button');
    await this.driver.clickElement(this.addAccountButton);
  }

  async checkAccountTypeModalIsDisplayed(): Promise<void> {
    console.log('Check account type selection modal is displayed');
    await this.driver.waitForSelector(this.accountTypeModal);
  }

  async checkEthereumAccountOptionIsDisplayed(): Promise<void> {
    console.log('Check Ethereum account option is displayed');
    await this.driver.waitForSelector(this.ethereumAccountOption);
  }

  async checkSolanaAccountOptionIsDisplayed(): Promise<void> {
    console.log('Check Solana account option is displayed');
    await this.driver.waitForSelector(this.solanaAccountOption);
  }

  async clickEthereumAccountOption(): Promise<void> {
    console.log('Click Ethereum account option');
    await this.driver.clickElement(this.ethereumAccountOption);
  }

  async checkNumberOfAccountsDisplayed(expectedCount: number): Promise<void> {
    console.log(`Check ${expectedCount} accounts are displayed`);

    await this.driver.wait(async () => {
      const accountItemElements = await this.driver.findElements(
        this.accountItems,
      );
      const isValid = accountItemElements.length === expectedCount;
      console.log(
        `Number of accounts: ${accountItemElements.length} is equal to ${expectedCount}? ${isValid}`,
      );
      return isValid;
    }, 10000);

    const accountItemElements = await this.driver.findElements(
      this.accountItems,
    );
    if (accountItemElements.length !== expectedCount) {
      throw new Error(
        `Expected ${expectedCount} accounts, but found ${accountItemElements.length}`,
      );
    }
  }
}

export default WalletDetailsPage;
