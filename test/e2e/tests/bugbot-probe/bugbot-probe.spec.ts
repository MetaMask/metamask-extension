/**
 * BUGBOT PROBE ONLY — intentional POM anti-patterns for MMQA-2248 CI validation.
 * Remove after confirming Bugbot catches these on the PR.
 */
import { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { login } from '../../page-objects/flows/login.flow';

// 3.5 — helper in a spec that performs UI actions
async function clickAccountMenuHelper(driver: Driver): Promise<void> {
  await driver.clickElement('[data-testid="account-menu-icon"]');
}

describe('Bugbot probe (MMQA-2248)', function () {
  it('triggers POM anti-pattern detectors', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver);

        // 3.6 — spec interacts with elements directly
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );

        // 3.5 — local UI helper from the spec
        await clickAccountMenuHelper(driver);

        // 3.7 — hardcoded delay with no justifying comment
        await driver.delay(1500);

        // 3.7 — setTimeout-style wait
        await new Promise((resolve) => setTimeout(resolve, 500));
      },
    );
  });
});
