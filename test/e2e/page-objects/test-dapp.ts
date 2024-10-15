import { Driver } from '../webdriver/driver';

export class TestDapp {
  constructor(private readonly driver: Driver) {}

  async open(contractAddress: string): Promise<void> {
    await this.driver.openNewPage(`http://127.0.0.1:8080/?contract=${contractAddress}`);
  }

  async createDepositTransaction(): Promise<void> {
    await this.driver.clickElement('#depositButton');
  }

  async connect(): Promise<void> {
    await this.driver.clickElement('#connectButton');
  }

  async disconnect(): Promise<void> {
    await this.driver.clickElement('#disconnectButton');
  }

  async signTypedDataV3(): Promise<void> {
    await this.driver.clickElement('#signTypedDataV3');
  }

  async signTypedDataV4(): Promise<void> {
    await this.driver.clickElement('#signTypedDataV4');
  }
}
