import { Driver } from '../../../webdriver/driver';
import { RawLocator } from '../../common';
import Confirmation from './confirmation';

export type PermitInfoValues = {
  contractPetName: string;
  deadline: string;
  nonce: string;
  origin: string;
  ownerName: string;
  primaryType: string;
  spenderAddress: string;
  value: string;
};

export default class PermitConfirmation extends Confirmation {
  private readonly addressName = (text: string): RawLocator => ({
    css: '.name__name',
    text,
  });

  private readonly addressValue = (text: string): RawLocator => ({
    css: '.name__value',
    text,
  });

  private readonly confirmDescription = (text: string): RawLocator => ({
    testId: 'confirm-title-description',
    text,
  });

  private readonly confirmTitle = (text: string): RawLocator => ({
    testId: 'confirm-title-text',
    text,
  });

  private readonly dataTreeRowWithText = (
    field: string,
    text: string,
  ): RawLocator => ({
    css: `[data-testid^="confirmation_data-${field}"]`,
    text,
  });

  private readonly origin = (text: string): RawLocator => ({
    testId: 'confirmation__details-origin',
    text,
  });

  private readonly primaryType = (text: string): RawLocator => ({
    testId: 'confirmation__message-primary-type',
    text,
  });

  constructor(driver: Driver) {
    super(driver);

    this.driver = driver;
  }

  async checkAddressName(name: string) {
    await this.driver.waitForSelector(this.addressName(name));
  }

  async checkAddressValue(address: string) {
    await this.driver.waitForSelector(this.addressValue(address));
  }

  async checkDataTreeField(field: string, text: string) {
    await this.driver.waitForSelector(this.dataTreeRowWithText(field, text));
  }

  async checkDescription(description: string) {
    await this.driver.waitForSelector(this.confirmDescription(description));
  }

  /**
   * Assert Permit confirmation details from caller-provided expected values.
   *
   * @param info - Expected origin, addresses, and data-tree field values.
   */
  async checkInfoValues(info: PermitInfoValues): Promise<void> {
    await this.clickCollapseSectionButton();
    await this.checkOrigin(info.origin);
    await this.checkAddressValue(info.contractPetName);
    await this.checkPrimaryType(info.primaryType);
    await this.checkAddressName(info.ownerName);
    await this.checkAddressValue(info.spenderAddress);
    await this.checkDataTreeField('value', info.value);
    await this.checkDataTreeField('nonce', info.nonce);
    await this.checkDataTreeField('deadline', info.deadline);
  }

  async checkOrigin(origin: string) {
    await this.driver.waitForSelector(this.origin(origin));
  }

  async checkPrimaryType(primaryType: string) {
    await this.driver.waitForSelector(this.primaryType(primaryType));
  }

  async checkTitle(title: string) {
    await this.driver.waitForSelector(this.confirmTitle(title));
  }
}
