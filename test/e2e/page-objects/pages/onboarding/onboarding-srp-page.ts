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
    text: 'Import a wallet',
    tag: 'h2',
  };

  private readonly srpWord0 = '[data-testid="srp-input-import__srp-note"]';

  private readonly srpWords = '.import-srp__srp-word';

  private readonly wrongSrpWarningMessage = {
    text: 'Secret Recovery Phrase not found.',
    css: '.import-srp__banner-alert-text',
  };

  private readonly srpError = '[data-testid="import-srp-error"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
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

  async clickConfirmButtonWithSrpError(): Promise<void> {
    await this.driver.clickElement(this.srpConfirmButton);
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
      const wordIndex = words.indexOf(word);
      if (wordIndex === 0) {
        await this.driver.waitForSelector(this.srpWord0);
        const srpWord0Input = await this.driver.findElement(this.srpWord0);
        await this.driver.fill(this.srpWord0, word);
        await srpWord0Input.sendKeys(this.driver.Key.SPACE);
      } else {
        const srpWordSelector = `[data-testid="import-srp__srp-word-${wordIndex}"]`;
        await this.driver.waitForSelector(srpWordSelector);
        const srpWordInput = await this.driver.findElement(srpWordSelector);
        await srpWordInput.sendKeys(word);
        if (wordIndex < words.length - 1) {
          await srpWordInput.sendKeys(this.driver.Key.SPACE);
        }
      }
    }
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_confirmSrpButtonIsDisabled(): Promise<void> {
    console.log('Check that confirm SRP button is disabled');
    const confirmSeedPhrase = await this.driver.findElement(
      this.srpConfirmButton,
    );
    assert.equal(await confirmSeedPhrase.isEnabled(), false);
  }

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  async check_srpError(): Promise<void> {
    console.log('Check that SRP error is displayed');
    await this.driver.waitForSelector(this.srpError);
  }
}

export default OnboardingSrpPage;
