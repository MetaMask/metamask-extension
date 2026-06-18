import { Driver } from '../../../webdriver/driver';

class TronTransactionDetailsPage {
  private readonly driver: Driver;

  private readonly tronExplorerUrl = 'https://tronscan.org';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  // The multichain transaction details modal renders the principal amount via
  // `amountComponent(... 'transaction-amount')` (multichain-transaction-details-modal.tsx:329)
  private readonly amount = (text: string) => ({
    css: '[data-testid="transaction-amount"]',
    text,
  });

  private readonly networkFee = (text: string) => ({
    css: '[data-testid="transaction-base-fee"]',
    text,
  });

  // Status renders as a body-md `<p>` whose color encodes the state but the
  // text alone is unique enough to disambiguate within the modal.
  private readonly statusSelector = (text: string) => ({ tag: 'p', text });

  // The multichain transaction details modal renders the type label inside a
  // styled `<Text variant=headingMd>` (a `span`/`div`), not an `<h1>` — match
  // by class instead so we don't depend on the underlying tag.
  private readonly titleSelector = (text: string) => ({
    css: '[class*="mm-text--heading-md"]',
    text,
  });

  // The multichain transaction details modal renders the timestamp as a
  // body-md paragraph in the alternative color directly under the title; no
  // testid is attached. Match the wrapping <p> by its distinctive class
  // combo and require the comma+space that `formatTimestamp` always emits
  // between the date and "HH:mm" portions (helpers.ts:formatTimestamp).
  private readonly timeRow = {
    css: 'p.mm-text--text-align-center.mm-box--color-text-alternative',
    text: ', ',
  };

  private hashLink(txHash: string) {
    return `a[href='${this.tronExplorerUrl}/#/transaction/${txHash}']`;
  }

  // The legacy EVM "View details" link does not exist in the multichain
  // transaction details modal — the modal IS the details view. Tests should
  // call `checkHashLink` to verify the explorer link instead.
  private readonly viewDetailsLink = { tag: 'button', text: 'View details' };

  async checkTitle(text: string): Promise<void> {
    await this.driver.waitForSelector(this.titleSelector(text));
  }

  async checkTime(): Promise<void> {
    await this.driver.waitForSelector(this.timeRow);
  }

  async checkStatus(status: string): Promise<void> {
    await this.driver.waitForSelector(this.statusSelector(status));
  }

  async checkAmount(text: string): Promise<void> {
    await this.driver.waitForSelector(this.amount(text));
  }

  async checkNetworkFee(fee: string): Promise<void> {
    await this.driver.waitForSelector(this.networkFee(fee));
  }

  async checkHashLink(txHash: string): Promise<void> {
    await this.driver.waitForSelector(this.hashLink(txHash));
  }

  // The multichain modal renders addresses inside an `<a>` button-link as
  // `shortenAddress(addr)` — `${addr.slice(0,7)}...${addr.slice(-5)}` per
  // shared/constants/labels.ts (TRUNCATED_ADDRESS_START_CHARS=7, _END_CHARS=5).
  async checkAddressInLog(address: string): Promise<void> {
    const shortened = `${address.slice(0, 7)}...${address.slice(-5)}`;
    await this.driver.waitForSelector({
      css: '[class*="mm-button-link"], [class*="mm-text"]',
      text: shortened,
    });
  }

  async checkViewDetailsLink(): Promise<void> {
    await this.driver.waitForSelector(this.viewDetailsLink);
  }
}

export default TronTransactionDetailsPage;
