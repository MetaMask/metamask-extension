const { strict: assert } = require('assert');
const {
  withFixtures,
  mockPhishingDetection,
  openDapp,
  defaultGanacheOptions,
  assertAccountBalanceForDOM,
  SERVICE_WORKER_URL,
  regularDelayMs,
  WALLET_PASSWORD,
  unlockWallet,
  terminateServiceWorker,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('Phishing warning page', function () {
  const driverOptions = { openDevToolsForTabs: true };

  it('should restore the transaction when service worker restarts', async function () {
    let windowHandles;

    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.title,
        testSpecificMock: mockPhishingDetection,
        driverOptions,
      },
      async ({ driver, ganacheServer }) => {
        await driver.navigate();

        await unlockWallet(driver, WALLET_PASSWORD);

        // DAPP is detected as phishing page
        await openDapp(driver);

        const phishingPageHeader = await driver.findElements({
          text: 'Deceptive site ahead',
          tag: 'h1',
        });
        assert.ok(phishingPageHeader.length, 1);

        // Restart service worker
        await driver.openNewPage(SERVICE_WORKER_URL);
        await terminateServiceWorker(driver);

        await driver.delay(regularDelayMs);
        // wait until extension is reloaded
        windowHandles = await driver.getAllWindowHandles();
        const extension = windowHandles[0];
        await driver.switchToWindow(extension);
        await assertAccountBalanceForDOM(driver, ganacheServer);

        // Open the dapp site and extension detect it as phishing warning page
        await openDapp(driver);
        // - extension, dapp, service worker and new dapp
        await driver.waitUntilXWindowHandles(4);

        const newPhishingPageHeader = await driver.findElements({
          text: 'Deceptive site ahead',
          tag: 'h1',
        });
        assert.ok(newPhishingPageHeader.length, 1);
      },
    );
  });
});
