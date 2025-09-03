import { strict as assert } from 'assert';
import { Driver } from '../../webdriver/driver';
import {
  MOCK_REMOTE_FEATURE_FLAGS_RESPONSE,
  MOCK_CUSTOMIZED_REMOTE_FEATURE_FLAGS,
} from '../../constants';

class DevelopOptions {
  private readonly driver: Driver;

  // Locators
  private readonly generatePageCrashButton: string =
    '[data-testid="developer-options-generate-page-crash-button"]';

  private readonly developOptionsPageTitle: object = {
    text: 'Developer Options',
    css: 'h4',
  };

  private readonly developerOptionsRemoteFeatureFlagsState: string =
    '[data-testid="developer-options-remote-feature-flags"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForSelector(this.developOptionsPageTitle);
    } catch (e) {
      console.log(
        'Timeout while waiting for Developer options page to be loaded',
        e,
      );
      throw e;
    }
    console.log('Developer option page is loaded');
  }

  async clickGenerateCrashButton(): Promise<void> {
    console.log('Generate a page crash in Developer option page');
    await this.driver.clickElement(this.generatePageCrashButton);
  }

  async validateRemoteFeatureFlagState(): Promise<void> {
    console.log('Validate remote feature flags state in Developer option page');
    const element = await this.driver.findElement(
      this.developerOptionsRemoteFeatureFlagsState,
    );
    const remoteFeatureFlagsState = await element.getText();
    assert.equal(
      remoteFeatureFlagsState,
      JSON.stringify({
        ...MOCK_REMOTE_FEATURE_FLAGS_RESPONSE,
        ...MOCK_CUSTOMIZED_REMOTE_FEATURE_FLAGS,
      }),
    );
  }
}

export default DevelopOptions;
