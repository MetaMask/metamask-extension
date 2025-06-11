const { withFixtures, WINDOW_TITLES } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const {
  mockDialogSnap,
} = require('../mock-response-data/snaps/snap-binary-mocks');
import { loginWithoutBalanceValidation } from '../page-objects/flows/login.flow';
import { openTestSnapClickButtonAndInstall } from '../page-objects/flows/install-test-snap.flow';
import { TestSnaps } from '../page-objects/pages/test-snaps';

describe('Test Snap UI Links', function () {
  it('test link in confirmation snap_dialog type', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        failOnConsoleError: false,
        testSpecificMock: mockDialogSnap,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithoutBalanceValidation(driver);
        const testSnaps = new TestSnaps(driver);
        await openTestSnapClickButtonAndInstall(driver, 'connectDialogsButton',{ withExtraScreen: true });



        // wait for npm installation success
        await testSnaps.check_installationComplete(
          'connectdialogs',
          'Reconnect to Dialogs Snap',
        );

        await testSnaps.clickElement('confirmationButton');


        // switch to dialog popup
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // delay added for rendering (deflake)
        await driver.delay(500);

        // wait for link to appear and click it
        await driver.waitForSelector({
          text: 'That',
          tag: 'span',
        });
        await driver.clickElement({
          text: 'That',
          tag: 'span',
        });

        // wait for the link to be provided
        await driver.waitForSelector({
          text: 'snaps.metamask.io',
          tag: 'b',
        });

        // wait for and click visit site button
        await driver.waitForSelector({
          text: 'Visit site',
          tag: 'a',
        });
        await driver.clickElement({
          text: 'Visit site',
          tag: 'a',
        });

        // switch to new tab
        await driver.switchToWindowWithTitle('MetaMask Snaps Directory');

        // check that the correct page has been opened
        await driver.waitForSelector({
          text: 'Most popular',
          tag: 'h2',
        });

        // switch back to metamask window
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        // wait for and click approve button
        await driver.waitForSelector({
          text: 'Approve',
          tag: 'button',
        });
        await driver.clickElement({
          text: 'Approve',
          tag: 'button',
        });

        // switch back to test snaps tab
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestSnaps);

        // check for false result
        await driver.waitForSelector({
          css: '#dialogResult',
          text: 'true',
        });
      },
    );
  });
});
