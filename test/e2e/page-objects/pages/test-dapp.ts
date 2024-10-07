import { Driver } from '../../webdriver/driver';
import { RawLocator } from '../common';

const DAPP_HOST_ADDRESS = '127.0.0.1:8080';
const DAPP_URL = `http://${DAPP_HOST_ADDRESS}`;

class TestDapp {
  private driver: Driver;

  private erc721SetApprovalForAllButton: RawLocator;

  private erc1155SetApprovalForAllButton: RawLocator;

  private erc721RevokeSetApprovalForAllButton: RawLocator;

  private erc1155RevokeSetApprovalForAllButton: RawLocator;

  constructor(driver: Driver) {
    this.driver = driver;

    this.erc721SetApprovalForAllButton = '#setApprovalForAllButton';
    this.erc1155SetApprovalForAllButton = '#setApprovalForAllERC1155Button';
    this.erc721RevokeSetApprovalForAllButton = '#revokeButton';
    this.erc1155RevokeSetApprovalForAllButton = '#revokeERC1155Button';
  }

  async open({
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
  async request(method: string, params: any[]) {
    await this.open({
      url: `${DAPP_URL}/request?method=${method}&params=${JSON.stringify(
        params,
      )}`,
    });
  }

  async clickERC721SetApprovalForAllButton() {
    await this.driver.clickElement(this.erc721SetApprovalForAllButton);
  }

  async clickERC1155SetApprovalForAllButton() {
    await this.driver.clickElement(this.erc1155SetApprovalForAllButton);
  }

  public async clickERC721RevokeSetApprovalForAllButton() {
    await this.driver.clickElement(this.erc721RevokeSetApprovalForAllButton);
  }

  public async clickERC1155RevokeSetApprovalForAllButton() {
    await this.driver.clickElement(this.erc1155RevokeSetApprovalForAllButton);
  }
}

export default TestDapp;
import { Driver } from '../../webdriver/driver';

const DAPP_HOST_ADDRESS = '127.0.0.1:8080';
const DAPP_URL = `http://${DAPP_HOST_ADDRESS}`;

class TestDapp {
  private driver: Driver;

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async open({
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
  async request(method: string, params: any[]) {
    await this.open({
      url: `${DAPP_URL}/request?method=${method}&params=${JSON.stringify(
        params,
      )}`,
    });
  }
}

export default TestDapp;
