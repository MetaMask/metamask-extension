const { strict: assert } = require('assert');
const {
  withFixtures,
  mockPhishingDetection,
  SERVICE_WORKER_URL,
  openDapp,
  defaultGanacheOptions,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('Phishing warning page', function () {
  it('should restore the transaction when service worker restarts', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.title,
        testSpecificMock: mockPhishingDetection,
      },
      async ({ driver }) => {
        await driver.navigate();
        // log in wallet
        await driver.fill('#password', 'correct horse battery staple');
        await driver.press('#password', driver.Key.ENTER);

        // Restart service worker
        await driver.openNewPage(SERVICE_WORKER_URL);

        await driver.clickElement({
          text: 'Service workers',
          tag: 'button',
        });

        await driver.clickElement({
          text: 'terminate',
          tag: 'span',
        });

        // Open the dapp site and extension detect it as phishing warning page
        await openDapp(driver);

        await driver.switchToWindowWithTitle('MetaMask Phishing Detection');
        const phishingPageHeader = await driver.findElements({
          text: 'Deceptive site ahead',
          tag: 'h1',
        });
        assert.ok(phishingPageHeader.length, 1);
      },
    );
  });
});
