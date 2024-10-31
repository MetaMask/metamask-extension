import { strict as assert } from 'assert';
import { Driver } from '../../../../webdriver/driver';
import { RawLocator } from '../../../common';
import TransactionConfirmation from './transaction-confirmation';

class MintNftTransactionConfirmation extends TransactionConfirmation {
  private advancedDetailsSection: RawLocator;

  private advancedDetailsDataFunction: RawLocator;

  private advancedDetailsDataParam: RawLocator;

  private advancedDetailsHexData: RawLocator;

  constructor(driver: Driver) {
    super(driver);

    this.driver = driver;

    this.advancedDetailsSection =
      '[data-testid="advanced-details-data-section"]';
    this.advancedDetailsDataFunction =
      '[data-testid="advanced-details-data-function"]';
    this.advancedDetailsDataParam =
      '[data-testid="advanced-details-data-param-0"]';
    this.advancedDetailsHexData =
      '[data-testid="advanced-details-transaction-hex"]';
  }

  async verifyAdvancedDetailsIsDisplayed(type: string) {
    const advancedDetailsSection = await this.driver.findElement(
      this.advancedDetailsSection,
    );

    await advancedDetailsSection.isDisplayed();
    await advancedDetailsSection
      .findElement({ css: this.advancedDetailsDataFunction.toString() })
      .isDisplayed();
    await advancedDetailsSection
      .findElement({ css: this.advancedDetailsDataParam.toString() })
      .isDisplayed();

    const functionInfo = await this.driver.findElement(
      this.advancedDetailsDataFunction,
    );
    const functionText = await functionInfo.getText();

    assert.ok(
      functionText.includes('Function'),
      'Expected key "Function" to be included in the function text',
    );
    assert.ok(
      functionText.includes('mintNFTs'),
      'Expected "mintNFTs" to be included in the function text',
    );

    const paramsInfo = await this.driver.findElement(
      this.advancedDetailsDataParam,
    );
    const paramsText = await paramsInfo.getText();

    if (type === '4Bytes') {
      assert.ok(
        paramsText.includes('Param #1'),
        'Expected "Param #1" to be included in the param text',
      );
    } else if (type === 'Sourcify') {
      assert.ok(
        paramsText.includes('Number Of Tokens'),
        'Expected "Number Of Tokens" to be included in the param text',
      );
    }

    assert.ok(
      paramsText.includes('1'),
      'Expected "1" to be included in the param value',
    );
  }

  async verifyAdvancedDetailsHexDataIsDisplayed() {
    const advancedDetailsSection = await this.driver.findElement(
      this.advancedDetailsSection,
    );

    await advancedDetailsSection.isDisplayed();
    await advancedDetailsSection
      .findElement({ css: this.advancedDetailsHexData.toString() })
      .isDisplayed();

    const hexDataInfo = (
      await this.driver.findElement(this.advancedDetailsHexData)
    ).getText();

    assert.ok(
      (await hexDataInfo).includes(
        '0x3b4b13810000000000000000000000000000000000000000000000000000000000000001',
      ),
      'Expected hex data to be displayed',
    );
  }
}

export default MintNftTransactionConfirmation;
