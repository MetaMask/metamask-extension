import { Driver } from '../../webdriver/driver';
import { RawLocator } from '../common';

const DAPP_HOST_ADDRESS = '127.0.0.1:8080';
const DAPP_URL = `http://${DAPP_HOST_ADDRESS}`;

class TestDapp {
  private driver: Driver;

  private erc721SetApprovalForAllButton: RawLocator;

  private erc1155SetApprovalForAllButton: RawLocator;

  constructor(driver: Driver) {
    this.driver = driver;

    this.erc721SetApprovalForAllButton = '#setApprovalForAllButton';
    this.erc1155SetApprovalForAllButton = '#setApprovalForAllERC1155Button';
  }

  public async open({
    contractAddress,
    url = DAPP_URL,
  }: {
    contractAddress?: string;
    url?: string;
  }) {
    const dappUrl = contractAddress
      ? `${url}/?contract=${contractAddress}`
      : url;

    return await this.driver.openNewPage(dappUrl);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async request(method: string, params: any[]) {
    await this.open({
      url: `${DAPP_URL}/request?method=${method}&params=${JSON.stringify(
        params,
      )}`,
    });
  }

  public async clickERC721SetApprovalForAllButton() {
    await this.driver.clickElement(this.erc721SetApprovalForAllButton);
  }

  public async clickERC1155SetApprovalForAllButton() {
    await this.driver.clickElement(this.erc1155SetApprovalForAllButton);
  }
}

export default TestDapp;
