const {
  defaultGanacheOptions,
  withFixtures,
  unlockWallet,
  WINDOW_TITLES,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { TEST_SNAPS_WEBSITE_URL } = require('./enums');

describe('Test Snap Interactive UI', function () {
  it('test interactive ui elements', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        failOnConsoleError: false,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // navigate to test snaps page and connect to interactive ui snap
        await driver.openNewPage(TEST_SNAPS_WEBSITE_URL);
        await driver.delay(1000);
        const dialogButton = await driver.findElement('#connectinteractive-ui');
        await driver.scrollToElement(dialogButton);
        await driver.delay(1000);
        await driver.clickElement('#connectinteractive-ui');

        // switch to metamask extension and click connect
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.clickElement({
          text: 'Connect',
          tag: 'button',
        });

        // We need a bigger timeout as the Connect action takes some time
        await driver.clickElementSafe(
          '[data-testid="snap-install-scroll"]',
          3000,
        );

        // wait for and click confirm
        await driver.waitForSelector({ text: 'Confirm' });
        await driver.clickElement({
          text: 'Confirm',
          tag: 'button',
        });

        // wait for anc click OK
        await driver.waitForSelector({ text: 'OK' });
        await driver.clickElement({
          text: 'OK',
          tag: 'button',
        });

        // switch to test snaps tab
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // wait for npm installation success
        await driver.waitForSelector('#connectinteractive-ui');

        // click create dialog button
        await driver.clickElement('#createDialogButton');
        await driver.delay(500);

        // switch to dialog popup
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.delay(500);

        // fill in thr example input
        await driver.fill('#example-input', 'foo bar');

        // try to click on dropdown
        await driver.waitForSelector('[data-testid="snaps-dropdown"]');
        await driver.clickElement('[data-testid="snaps-dropdown"]');

        // try to select option 2 from the list
        await driver.clickElement({ text: 'Option 2', tag: 'option' });

        // click on option 3 radio button
        await driver.clickElement({ text: 'Option 3', tag: 'label' });

        // click on checkbox
        await driver.clickElement({ tag: 'span', text: 'Checkbox' });

        // try to click approve
        await driver.clickElement('#submit');

        // check for returned values
        await driver.waitForSelector({ text: 'foo bar', tag: 'p' });
        await driver.waitForSelector({ text: 'option2', tag: 'p' });
        await driver.waitForSelector({ text: 'option3', tag: 'p' });
        await driver.waitForSelector({ text: 'true', tag: 'p' });

        // try to click on approve
        await driver.clickElement('[data-testid="confirmation-submit-button"]');

        // switch to test snaps tab
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // look for returned true
        await driver.waitForSelector({
          text: 'true',
          css: '#interactiveUIResult',
        });
      },
    );
  });
});
