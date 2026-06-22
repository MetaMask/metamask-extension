import { Driver } from '../../../webdriver/driver';
import { RawLocator } from '../../common';
import {
  SignTypedDataV1Info,
  SignTypedDataV3Info,
  SignTypedDataV4Info,
} from '../../../tests/confirmations/signatures/sign-typed-data-expected';
import Confirmation from './confirmation';

export default class SignTypedData extends Confirmation {
  private readonly contractAddress = (text: string): RawLocator => ({
    css: '[data-testid="confirmation_request-section"]',
    text,
  });

  private readonly dataTreeRowWithText = (
    field: string,
    text: string,
  ): RawLocator => ({
    css: `[data-testid^="confirmation_data-${field}"]`,
    text,
  });

  private readonly networkDisplay = (network: string): RawLocator => ({
    testId: 'confirmation__details-network-name',
    text: network,
  });

  private readonly origin = (text: string): RawLocator => ({
    testId: 'confirmation__details-origin',
    text,
  });

  private readonly primaryType = (text: string): RawLocator => ({
    testId: 'confirmation__message-primary-type',
    text,
  });

  private readonly signatureHeadingTitle = (text: string): RawLocator => ({
    testId: 'confirm-title-text',
    text,
  });

  private readonly signTypedDataMessage = (text: string): RawLocator => ({
    css: '[data-testid^="confirmation_data-Message"]',
    text,
  });

  constructor(driver: Driver) {
    super(driver);

    this.driver = driver;
  }

  async verifyOrigin(origin: string): Promise<void> {
    console.log(
      `Verify origin ${origin} is displayed on sign typed data confirmation page`,
    );
    await this.driver.waitForSelector(this.origin(origin));
  }

  async verifySignTypedDataMessage(message: string): Promise<void> {
    console.log(
      `Verify sign typed data message ${message} is displayed on sign typed data confirmation page`,
    );
    await this.driver.waitForSelector(this.signTypedDataMessage(message));
  }

  async verifyContractPetName(contract: string): Promise<void> {
    console.log(
      `Verify contract ${contract} is displayed on sign typed data confirmation page`,
    );
    await this.driver.waitForSelector(this.contractAddress(contract));
  }

  async verifyPrimaryType(primaryType: string): Promise<void> {
    console.log(
      `Verify primary type ${primaryType} is displayed on sign typed data confirmation page`,
    );
    await this.driver.waitForSelector(this.primaryType(primaryType));
  }

  async verifyFromName(fromName: string): Promise<void> {
    console.log(
      `Verify from name ${fromName} is displayed on sign typed data confirmation page`,
    );
    await this.driver.waitForSelector(
      this.dataTreeRowWithText('name', fromName),
    );
  }

  async verifyFromAddress(fromAddress: string): Promise<void> {
    console.log(
      `Verify from address ${fromAddress} is displayed on sign typed data confirmation page`,
    );
    await this.driver.waitForSelector(
      this.dataTreeRowWithText('0', fromAddress),
    );
  }

  async verifyFromWalletAddress(fromAddress: string): Promise<void> {
    console.log(
      `Verify from wallet address ${fromAddress} is displayed on sign typed data confirmation page`,
    );
    await this.driver.waitForSelector(
      this.dataTreeRowWithText('wallet', fromAddress),
    );
  }

  async verifyToName(toName: string): Promise<void> {
    console.log(
      `Verify to name ${toName} is displayed on sign typed data confirmation page`,
    );
    await this.driver.waitForSelector(this.dataTreeRowWithText('name', toName));
  }

  async verifyToAddress(toAddress: string): Promise<void> {
    console.log(
      `Verify to address ${toAddress} is displayed on sign typed data confirmation page`,
    );
    await this.driver.waitForSelector(this.dataTreeRowWithText('0', toAddress));
  }

  async verifyToWalletAddress(toAddress: string): Promise<void> {
    console.log(
      `Verify to wallet address ${toAddress} is displayed on sign typed data confirmation page`,
    );
    await this.driver.waitForSelector(
      this.dataTreeRowWithText('wallet', toAddress),
    );
  }

  async verifyContents(contents: string): Promise<void> {
    console.log(
      `Verify contents ${contents} is displayed on sign typed data confirmation page`,
    );
    await this.driver.waitForSelector(
      this.dataTreeRowWithText('contents', contents),
    );
  }

  async verifyAttachment(attachment: string): Promise<void> {
    console.log(
      `Verify attachment ${attachment} is displayed on sign typed data confirmation page`,
    );
    await this.driver.waitForSelector(
      this.dataTreeRowWithText('attachment', attachment),
    );
  }

  async verifyToAddressNum2(toAddress: string): Promise<void> {
    console.log(
      `Verify to address num2 ${toAddress} is displayed on sign typed data confirmation page`,
    );
    await this.driver.waitForSelector(this.dataTreeRowWithText('2', toAddress));
  }

  async verifySignTypedDataInfo(expected: SignTypedDataV1Info): Promise<void> {
    console.log(
      'Verify sign typed data v1 info on sign typed data confirmation page',
    );
    await this.verifyOrigin(expected.origin);
    await this.verifySignTypedDataMessage(expected.message);
  }

  async verifySignTypedDataV3Info(
    expected: SignTypedDataV3Info,
  ): Promise<void> {
    console.log(
      'Verify sign typed data v3 info on sign typed data confirmation page',
    );
    await this.verifyOrigin(expected.origin);
    await this.verifyFromWalletAddress(expected.fromAddress);
    await this.verifyToWalletAddress(expected.toAddress);
    await this.verifyContents(expected.contents);
  }

  async verifySignTypedDataV4Info(
    expected: SignTypedDataV4Info,
  ): Promise<void> {
    console.log(
      'Verify sign typed data v4 info on sign typed data confirmation page',
    );
    await this.verifyOrigin(expected.origin);
    await this.verifyFromAddress(expected.fromAddress);
    await this.verifyToAddress(expected.toAddress);
    await this.verifyContents(expected.contents);
    await this.verifyAttachment(expected.attachment);
  }

  async verifySignatureHeadingTitle(heading: string): Promise<void> {
    console.log(
      `Verify signature heading title ${heading} is displayed on sign typed data confirmation page`,
    );
    await this.driver.waitForSelector(this.signatureHeadingTitle(heading));
  }

  async checkNetworkIsDisplayed(network: string): Promise<void> {
    console.log(
      `Check network ${network} is displayed on sign typed data confirmation page`,
    );
    await this.driver.waitForSelector(this.networkDisplay(network));
  }
}
