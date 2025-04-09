import { Driver } from '../../webdriver/driver';

const DAPP_HOST_ADDRESS = '127.0.0.1:8080';
const DAPP_URL = `http://${DAPP_HOST_ADDRESS}`;

class TestDappIndividualRequest {
  private readonly driver: Driver;

  private readonly result = 'main';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Verify the result of the request.
   *
   * @param expectedResult - The expected result from the individual request.
   */
  async checkExpectedResult(expectedResult: string) {
    console.log('Verify the result from the individual request.');
    await this.driver.waitForSelector({
      tag: this.result,
      text: expectedResult,
    });
  }

  /**
   * Open the test dapp individual request page.
   *
   * @param options - The options for opening the test dapp page.
   * @param options.contractAddress - The contract address to open the dapp with. Defaults to null.
   * @param options.url - The URL of the dapp. Defaults to DAPP_URL.
   * @returns A promise that resolves when the new page is opened.
   */
    async openTestDappIndividualPage({
      contractAddress = null,
      url = DAPP_URL,
    }: {
      contractAddress?: string | null;
      url?: string;
    } = {}): Promise<void> {
      const dappUrl = contractAddress
        ? `${url}/?contract=${contractAddress}`
        : url;
      await this.driver.openNewPage(dappUrl);
    }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async request(method: string, params: any[]) {
    await this.openTestDappIndividualPage({
      url: `${DAPP_URL}/request?method=${method}&params=${JSON.stringify(
        params,
      )}`,
    });
  }
}

export default TestDappIndividualRequest;
