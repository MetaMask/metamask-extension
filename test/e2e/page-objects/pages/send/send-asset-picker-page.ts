import { Driver } from '../../../webdriver/driver';

/**
 * Send asset picker: the first step of the multichain send flow.
 *
 * Screen: `#/send/asset` (also `#/send` without a page).
 * Owns: network filter, token list and NFT list.
 * Boundaries: picking an asset opens the send form, which is
 * `SendAmountRecipientPage`.
 * Related: `SendAmountRecipientPage`, `flows/transaction.flow.ts`.
 *
 * @see ui/pages/confirmations/components/send/asset/asset.tsx
 * @see test/e2e/page-objects/flows/transaction.flow.ts
 */
class SendAssetPickerPage {
  private readonly driver: Driver;

  private readonly header = {
    tag: 'h4',
    text: 'Send',
  };

  private readonly networkFilterToggle = {
    testId: 'send-network-filter-toggle',
  };

  private readonly networkName = (networkName: string) => {
    return {
      testId: networkName,
    };
  };

  private readonly sendPage = {
    testId: 'parent-selector-send-page',
  };

  private readonly solanaNetwork = {
    text: 'Solana',
  };

  private readonly tokenAsset = (chainId: string, symbol: string) => {
    return {
      testId: `token-asset-${chainId}-${symbol}`,
    };
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkNetworkFilterToggleIsDisplayed(): Promise<void> {
    await this.driver.waitForSelector(this.networkFilterToggle);
  }

  async checkPageIsLoaded(): Promise<void> {
    console.log('Checking if send asset picker is loaded');
    await this.driver.waitForMultipleSelectors([
      this.header,
      this.networkFilterToggle,
      this.sendPage,
    ]);
    console.log('Send asset picker is loaded');
  }

  async checkSolanaNetworkIsPresent(): Promise<void> {
    console.log('Checking if Solana network is present');
    await this.driver.findElement(this.solanaNetwork);
  }

  async selectNetworkByName(networkName: string): Promise<void> {
    console.log(`Selecting network ${networkName}`);
    await this.driver.clickElement(this.networkFilterToggle);
    await this.driver.clickElement(this.networkName(networkName));
  }

  async selectNft(nftName: string): Promise<void> {
    console.log(`Selecting nft ${nftName}`);
    await this.driver.waitForElementToStopMoving({ text: nftName });
    await this.driver.clickElement({ text: nftName });
  }

  async selectToken(chainId: string, symbol: string): Promise<void> {
    console.log(`Selecting token ${symbol} on chain ${chainId}`);
    const tokenAsset = this.tokenAsset(chainId, symbol);
    await this.driver.waitForSelector(tokenAsset);
    await this.driver.clickElement(tokenAsset);
  }
}

export default SendAssetPickerPage;
