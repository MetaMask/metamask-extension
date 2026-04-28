import { JsonRpcParams } from '@metamask/utils';
import { Driver } from '../../webdriver/driver';
import { DAPP_URL } from '../../constants';

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
   * Wait for the request to resolve and return the parsed JSON-RPC result.
   *
   * The dapp renders `Response: <JSON.stringify(result)>` to the main element
   * once the request resolves.
   */
  async getResult<Result = unknown>(): Promise<Result> {
    await this.driver.waitForSelector({
      tag: this.result,
      text: 'Response: ',
    });

    const element = await this.driver.findElement(this.result);
    const text = await element.getText();
    const match = text.match(/^Response:\s*(.+)$/u);

    if (!match) {
      throw new Error(`Test dapp did not render a response: ${text}`);
    }

    return JSON.parse(match[1]) as Result;
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

  async request(method: string, params: JsonRpcParams) {
    await this.openTestDappIndividualPage({
      url: `${DAPP_URL}/request?method=${method}&params=${JSON.stringify(
        params,
      )}`,
    });
  }
}

export default TestDappIndividualRequest;
