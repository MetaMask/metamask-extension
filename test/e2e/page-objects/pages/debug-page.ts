import { strict as assert } from 'assert';
import { Driver } from '../../webdriver/driver';
import {
  MOCK_REMOTE_FEATURE_FLAGS_RESPONSE,
  MOCK_CUSTOMIZED_REMOTE_FEATURE_FLAGS,
} from '../../constants';

/**
 * Developer / Debug settings tab for feature-flag inspection and crash hooks.
 *
 * Screen: `#/settings/debug`, reached from Settings when developer options
 * are available.
 * Owns: remote feature flags details toggle/state assertions and the generate
 * page-crash control on the debug tab.
 * Boundaries: debug tab content only. Broader settings hub navigation belongs
 * to `SettingsPage`; Sentry/error landing after a crash belongs to `ErrorPage`.
 * Related: `SettingsPage`, `ErrorPage`.
 *
 * @see ui/pages/settings/debug-tab/debug-tab.tsx
 * @see ui/pages/settings/debug-tab/debug-content/debug-content.tsx
 */
class DebugOptions {
  private readonly developerOptionsRemoteFeatureFlagsState: string =
    '[data-testid="developer-options-remote-feature-flags"]';

  private readonly driver: Driver;

  // Locators
  private readonly generatePageCrashButton: string =
    '[data-testid="developer-options-generate-page-crash-button"]';

  private readonly remoteFeatureFlagsDetailsToggle: string =
    '[data-testid="remote-feature-flags-toggle"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    try {
      await this.driver.waitForSelector(
        this.developerOptionsRemoteFeatureFlagsState,
      );
    } catch (e) {
      console.log('Timeout while waiting for Debug page to be loaded', e);
      throw e;
    }
    console.log('Debug page is loaded');
  }

  async clickGenerateCrashButton(): Promise<void> {
    console.log('Generate a page crash in Debug page');
    await this.driver.clickElement(this.generatePageCrashButton);
  }

  async validateRemoteFeatureFlagState(): Promise<void> {
    console.log('Validate remote feature flags state in Debug page');
    // Click to expand the collapsible details element
    await this.driver.clickElement(this.remoteFeatureFlagsDetailsToggle);
    const element = await this.driver.findElement(
      this.developerOptionsRemoteFeatureFlagsState,
    );
    const remoteFeatureFlagsState = await element.getText();
    assert.equal(
      remoteFeatureFlagsState,
      JSON.stringify(
        {
          ...MOCK_REMOTE_FEATURE_FLAGS_RESPONSE,
          ...MOCK_CUSTOMIZED_REMOTE_FEATURE_FLAGS,
        },
        null,
        2,
      ),
    );
  }
}

export default DebugOptions;
