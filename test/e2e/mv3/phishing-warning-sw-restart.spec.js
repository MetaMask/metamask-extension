const { strict: assert } = require('assert');
const {
  withFixtures,
  convertToHexValue,
  mockPhishingDetection,
  SERVICE_WORKER_URL,
  openDapp,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

const PRIVATE_KEY =
  '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC';

const generateETHBalance = (eth) => convertToHexValue(eth * 10 ** 18);

describe('Phishing warning page', function () {
  const defaultGanacheOptions = {
    accounts: [{ secretKey: PRIVATE_KEY, balance: generateETHBalance(25) }],
  };

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
