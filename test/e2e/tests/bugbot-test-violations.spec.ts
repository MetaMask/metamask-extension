// THIS FILE IS FOR TESTING BUGBOT ONLY - DELETE AFTER TESTING
// It contains intentional violations of E2E anti-patterns

import { Driver } from '../webdriver/driver';

describe('Bugbot Test Violations', () => {
  let driver: Driver;

  // CRITICAL: "should" in test name
  it('should do something with the wallet', async () => {
    // CRITICAL: Hard-coded delay
    await driver.delay(1000);

    // CRITICAL: Deprecated method
    const exists = await driver.isElementPresent('.some-selector');

    // CRITICAL: Raw Selenium access
    const element = await driver.driver.findElement({ css: '.test' });

    // WARNING: CSS selector
    await driver.clickElement('#submit-button');
    await driver.findElement('.modal-content');

    // WARNING: setTimeout
    await new Promise((resolve) => setTimeout(resolve, 500));
  });

  // WARNING: Multiple behaviors in test name
  it('connects wallet and sends transaction and checks balance', async () => {
    // More violations here
    await driver.delay(2000);
  });
});
