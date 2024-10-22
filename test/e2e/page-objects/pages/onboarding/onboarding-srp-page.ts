import { Driver } from '../../../webdriver/driver';
import { TEST_SEED_PHRASE } from '../../../helpers';

class OnboardingSrpPage {
  private driver: Driver;

  private readonly srpMessage = {
    text: "Access your wallet with your Secret Recovery Phrase",
    tag: 'h2',
  };

  private readonly srpWord0 = '[data-testid="import-srp__srp-word-0"]';

  private readonly srpConfirmButton = '[data-testid="import-srp-confirm"]';

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
      console.log('Timeout while waiting for onboarding srp page to be loaded', e);
      throw e;
    }
    console.log('Onboarding srp page is loaded');
  }

  /**
   * Fill the SRP words with the provided seed phrase
   * @param seedPhrase - The seed phrase to fill. Defaults to TEST_SEED_PHRASE.
   */
  async fillSrp(seedPhrase: string = TEST_SEED_PHRASE): Promise<void> {
    await this.driver.pasteIntoField(
      this.srpWord0,
      seedPhrase,
    );
  }

  async clickConfirmButton(): Promise<void> {
    await this.driver.clickElementAndWaitToDisappear(this.srpConfirmButton);
  }
}

export default OnboardingSrpPage;
