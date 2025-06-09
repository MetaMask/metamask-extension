import { strict as assert } from 'assert';
import { Driver } from '../../../webdriver/driver';
import { E2E_SRP } from '../../../default-fixture';

class OnboardingSrpPage {
  private driver: Driver;

  private readonly srpConfirmButton = '[data-testid="import-srp-confirm"]';

  private readonly srpDropdown = '.import-srp__number-of-words-dropdown';

  private readonly srpDropdownOptions =
    '.import-srp__number-of-words-dropdown option';

  private readonly srpMessage = {
    text: 'Access your wallet with your Secret Recovery Phrase',
    tag: 'h2',
  };

  private readonly srpWord0 = '[data-testid="import-srp__srp-word-0"]';

  private readonly srpWords = '.import-srp__srp-word';

  private readonly wrongSrpWarningMessage = {
    text: 'Invalid Secret Recovery Phrase',
    css: '.import-srp__banner-alert-text',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async check_pageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForMultipleSelectors([
        this.srpMessage,
        this.srpWord0,
      ]);
    } catch (e) {
      console.log(
        'Timeout while waiting for onboarding srp page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Onboarding srp page is loaded');
  }

  async clickConfirmButton(): Promise<void> {
    await this.driver.clickElementAndWaitToDisappear(this.srpConfirmButton);
  }

  /**
   * Fill the SRP words with the provided seed phrase
   *
   * @param seedPhrase - The seed phrase to fill. Defaults to E2E_SRP.
   */
  async fillSrp(seedPhrase: string = E2E_SRP): Promise<void> {
    await this.driver.pasteIntoField(this.srpWord0, seedPhrase);
  }

  /**
   * Fill the SRP words with the provided seed phrase word by word
   *
   * @param seedPhrase - The seed phrase to fill. Defaults to E2E_SRP.
   */
  async fillSrpWordByWord(seedPhrase: string = E2E_SRP): Promise<void> {
    const words = seedPhrase.split(' ');
    for (const word of words) {
      await this.driver.pasteIntoField(
        `[data-testid="import-srp__srp-word-${words.indexOf(word)}"]`,
        word,
      );
    }
  }

  async check_confirmSrpButtonIsDisabled(): Promise<void> {
    console.log('Check that confirm SRP button is disabled');
    const confirmSeedPhrase = await this.driver.findElement(
      this.srpConfirmButton,
    );
    assert.equal(await confirmSeedPhrase.isEnabled(), false);
  }

  /**
   * Check the SRP dropdown iterates through each option
   *
   * @param numOptions - The number of options to check. Defaults to 5.
   */
  async check_srpDropdownIterations(numOptions: number = 5) {
    console.log(
      `Check the SRP dropdown iterates through ${numOptions} options`,
    );
    await this.driver.clickElement(this.srpDropdown);
    await this.driver.wait(async () => {
      const options = await this.driver.findElements(this.srpDropdownOptions);
      return options.length === numOptions;
    }, this.driver.timeout);

    const options = await this.driver.findElements(this.srpDropdownOptions);
    for (let i = 0; i < options.length; i++) {
      if (i !== 0) {
        await this.driver.clickElement(this.srpDropdown);
      }
      await options[i].click();
      const expectedNumFields = 12 + i * 3;
      await this.driver.wait(async () => {
        const srpWordsFields = await this.driver.findElements(this.srpWords);
        return expectedNumFields === srpWordsFields.length;
      }, this.driver.timeout);
    }
  }

  async check_wrongSrpWarningMessage(): Promise<void> {
    console.log('Check that wrong SRP warning message is displayed');
    await this.driver.waitForSelector(this.wrongSrpWarningMessage);
  }
}

export default OnboardingSrpPage;
