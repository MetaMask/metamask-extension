const { buildWebDriver } = require('../webdriver');
const { withFixtures, tinyDelayMs, unlockWallet } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('Settings', function () {
  const ENS_NAME = 'metamask.eth';
  const ENS_NAME_URL = `https://${ENS_NAME}/`;
  const ENS_DESTINATION_URL = `https://app.ens.domains/name/${ENS_NAME}`;

  it('Redirects to ENS domains when user inputs ENS into address bar', async function () {
    // Using proxy port that doesn't resolve so that the browser can error out properly
    // on the ".eth" hostname.  The proxy does too much interference with 8000.
    const { driver } = await buildWebDriver({ proxyUrl: '127.0.0.1:8001' });
    await driver.navigate();

    // The setting defaults to "on" so we can simply enter an ENS address
    // into the address bar and listen for address change
    try {
      await driver.openNewPage(ENS_NAME_URL);
    } catch (e) {
      // Ignore ERR_PROXY_CONNECTION_FAILED error
      // since all we care about is getting to the correct URL
    }

    // Ensure that the redirect to ENS Domains has happened
    await driver.wait(async () => {
      const currentUrl = await driver.getCurrentUrl();
      return currentUrl === ENS_DESTINATION_URL;
    }, tinyDelayMs);

    await driver.quit();
  });

  it('Does not fetch ENS data for ENS Domain when ENS and IPFS switched off', async function () {
    let server;

    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test.fullTitle(),
        testSpecificMock: (mockServer) => {
          server = mockServer;
        },
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // goes to the settings screen
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.clickElement({ text: 'Security & privacy', tag: 'div' });

        // turns off IPFS setting
        await driver.clickElement('[data-testid="ipfsToggle"] .toggle-button');

        // turns off ENS domain resolution
        await driver.clickElement(
          '[data-testid="ipfs-gateway-resolution-container"] .toggle-button',
        );

        // Now that we no longer need the MetaMask UI, and want the browser
        // to handle the request error, we need to stop the server
        await server.stop();

        try {
          await driver.openNewPage(ENS_NAME_URL);
        } catch (e) {
          // Ignore ERR_PROXY_CONNECTION_FAILED error
          // since all we care about is getting to the correct URL
        }

        // Ensure that the redirect to ENS Domains does not happen
        // Instead, the domain will be kept which is a 404
        await driver.wait(async () => {
          const currentUrl = await driver.getCurrentUrl();
          return currentUrl === ENS_NAME_URL;
        }, tinyDelayMs);
      },
    );
  });
});
