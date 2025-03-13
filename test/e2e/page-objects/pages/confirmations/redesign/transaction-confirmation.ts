import { strict as assert } from 'assert';
import { tEn } from '../../../../../lib/i18n-helpers';
import { Driver } from '../../../../webdriver/driver';
import { RawLocator } from '../../../common';
import Confirmation from './confirmation';

class TransactionConfirmation extends Confirmation {
  private walletInitiatedHeadingTitle: RawLocator;

  private dappInitiatedHeadingTitle: RawLocator;

  private advancedDetailsButton: RawLocator;

  private advancedDetailsSection: RawLocator;

  private advancedDetailsDataFunction: RawLocator;

  private advancedDetailsDataParam: RawLocator;

  private advancedDetailsHexData: RawLocator;

  constructor(driver: Driver) {
    super(driver);

    this.driver = driver;

    this.walletInitiatedHeadingTitle = {
      css: 'h3',
      text: tEn('review') as string,
    };
    this.dappInitiatedHeadingTitle = {
      css: 'h3',
      text: tEn('transferRequest') as string,
    };

    this.advancedDetailsButton = `[data-testid="header-advanced-details-button"]`;

    this.advancedDetailsSection =
      '[data-testid="advanced-details-data-section"]';
    this.advancedDetailsDataFunction =
      '[data-testid="advanced-details-data-function"]';
    this.advancedDetailsDataParam =
      '[data-testid="advanced-details-data-param-0"]';
    this.advancedDetailsHexData =
      '[data-testid="advanced-details-transaction-hex"]';
  }

  async check_walletInitiatedHeadingTitle() {
    await this.driver.waitForSelector(this.walletInitiatedHeadingTitle);
  }

  async check_dappInitiatedHeadingTitle() {
    await this.driver.waitForSelector(this.dappInitiatedHeadingTitle);
  }

  async clickAdvancedDetailsButton() {
    await this.driver.clickElement(this.advancedDetailsButton);
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

  async verifyUniswapDecodedTransactionAdvancedDetails() {
    const dataSections = await this.driver.findElements(
      this.advancedDetailsDataFunction,
    );

    const expectedData = [
      {
        functionName: 'WRAP_ETH',
        recipient: '0x00000...00002',
        amountMin: '100000000000000',
      },
      {
        functionName: 'V3_SWAP_EXACT_IN',
        recipient: '0x00000...00002',
        amountIn: '100000000000000',
        amountOutMin: '312344',
        path0: 'WETH',
        path1: '500',
        path2: 'USDC',
        payerIsUser: 'false',
      },
      {
        functionName: 'PAY_PORTION',
        token: 'USDC',
        recipient: '0x27213...71c47',
        bips: '25',
      },
      {
        functionName: 'SWEEP',
        token: 'USDC',
        recipient: '0x00000...00001',
        amountMin: '312344',
      },
    ];

    assert.strictEqual(
      dataSections.length,
      expectedData.length,
      'Mismatch between data sections and expected data count.',
    );

    await Promise.all(
      dataSections.map(async (dataSection, sectionIndex) => {
        await dataSection.isDisplayed();

        const data = expectedData[sectionIndex];

        const functionText = await dataSection.getText();
        assert.ok(
          functionText.includes(data.functionName),
          `Expected function name '${data.functionName}' in advanced details.`,
        );

        const params = `[data-testid="advanced-details-${functionText}-params"]`;

        const paramsData = await this.driver.findElement(params);
        const paramText = await paramsData.getText();

        for (const [key, expectedValue] of Object.entries(data)) {
          if (key === 'functionName') {
            continue;
          }
          assert.ok(
            paramText.includes(expectedValue),
            `Expected ${key} '${expectedValue}' in data section ${functionText}.`,
          );

          this.clickScrollToBottomButton();
        }
      }),
    );
  }
}

export default TransactionConfirmation;
