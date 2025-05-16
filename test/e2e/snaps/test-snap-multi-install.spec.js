const { withFixtures, unlockWallet, WINDOW_TITLES } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const {
  mockBip32Snap,
  mockBip44Snap,
} = require('../mock-response-data/snaps/snap-binary-mocks');
const { TEST_SNAPS_WEBSITE_URL } = require('./enums');

async function mockSnapBinaries(mockServer) {
  return [await mockBip32Snap(mockServer), await mockBip44Snap(mockServer)];
}

describe('Test Snap Multi Install', function () {
  it('test multi install snaps', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        failOnConsoleError: false,
        testSpecificMock: mockSnapBinaries,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // navigate to test snaps page and multi-install snaps
        await driver.openNewPage(TEST_SNAPS_WEBSITE_URL);

        // wait for page to load
        await driver.waitForSelector({
          text: 'Installed Snaps',
          tag: 'h2',
        });

        // scroll to multi-install snap
        const dialogButton = await driver.findElement('#multi-install-connect');
        await driver.scrollToElement(dialogButton);

        // added delay for firefox (deflake)
        await driver.delayFirefox(1000);

        // wait for and click connect
        await driver.waitForSelector('#multi-install-connect');
        await driver.clickElement('#multi-install-connect');

        // switch to metamask extension
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // wait for and click connect
        await driver.waitForSelector({
          text: 'Connect',
          tag: 'button',
        });
        await driver.clickElement({
          text: 'Connect',
          tag: 'button',
        });

        // wait and scroll if necessary
        await driver.waitForSelector({
          tag: 'h3',
          text: 'Add to MetaMask',
        });
        await driver.clickElementSafe(
          '[data-testid="snap-install-scroll"]',
          3000,
        );

        // wait for and click confirm for BIP-32 snap connection request
        await driver.waitForSelector({ text: 'Confirm' });
        await driver.clickElement({
          text: 'Confirm',
          tag: 'button',
        });

        // wait for permissions popover, click checkboxes and confirm
        await driver.waitForSelector('.mm-checkbox__input');
        await driver.clickElement('.mm-checkbox__input');
        await driver.waitForSelector(
          '[data-testid="snap-install-warning-modal-confirm"]',
        );
        await driver.clickElement(
          '[data-testid="snap-install-warning-modal-confirm"]',
        );

        // wait for and click OK
        await driver.waitForSelector({ text: 'OK' });
        await driver.clickElement({
          text: 'OK',
          tag: 'button',
        });

        // wait and scroll if necessary
        await driver.clickElementSafe(
          '[data-testid="snap-install-scroll"]',
          3000,
        );

        // wait for and click confirm for BIP-44 snap connection request
        await driver.waitForSelector({ text: 'Confirm' });
        await driver.clickElement({
          text: 'Confirm',
          tag: 'button',
        });

        // wait and scroll if necessary
        await driver.clickElementSafe('[data-testid="snap-install-scroll"]');

        // wait for permissions popover, click checkboxes and confirm
        await driver.waitForSelector('.mm-checkbox__input');
        await driver.clickElement('.mm-checkbox__input');
        await driver.waitForSelector(
          '[data-testid="snap-install-warning-modal-confirm"]',
        );
        await driver.clickElement(
          '[data-testid="snap-install-warning-modal-confirm"]',
        );

        // wait for and click OK
        await driver.waitForSelector({ text: 'OK' });
        await driver.clickElement({
          text: 'OK',
          tag: 'button',
        });

        // switch to test snaps tab
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // wait for npm installation success
        await driver.waitForSelector({
          css: '#installedSnapsResult',
          text: 'npm:@metamask/bip32-example-snap, npm:@metamask/bip44-example-snap',
        });
      },
    );
  });
});
