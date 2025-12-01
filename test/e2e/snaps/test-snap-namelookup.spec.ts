import { Mockttp } from 'mockttp';

import { CHAIN_IDS } from '../../../shared/constants/network';
import { Driver } from '../webdriver/driver';
import HomePage from '../page-objects/pages/home/homepage';
import FixtureBuilder from '../fixtures/fixture-builder';
import { loginWithoutBalanceValidation } from '../page-objects/flows/login.flow';
import { withFixtures, WINDOW_TITLES } from '../helpers';
import { openTestSnapClickButtonAndInstall } from '../page-objects/flows/install-test-snap.flow';
import { mockSendRedesignFeatureFlag } from '../tests/send/common';
import { mockLookupSnap } from '../mock-response-data/snaps/snap-binary-mocks';
import SendPage from '../page-objects/pages/send/send-page';
import { DAPP_PATH } from '../constants';

describe('Name lookup', function () {
  it('validate the recipient address appears in the send flow', async function () {
    await withFixtures(
      {
        dappOptions: {
          customDappPaths: [DAPP_PATH.TEST_SNAPS],
        },
        fixtures: new FixtureBuilder({
          inputChainId: CHAIN_IDS.MAINNET,
        }).build(),
        testSpecificMock: async (mockServer: Mockttp) => [
          await mockLookupSnap(mockServer),
          await mockSendRedesignFeatureFlag(mockServer),
        ],
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);

        const homePage = new HomePage(driver);
        const sendPage = new SendPage(driver);

        // Open a new tab and navigate to test snaps page and click name lookup
        await openTestSnapClickButtonAndInstall(
          driver,
          'connectNameLookUpButton',
        );
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        // Navigate to the extension home page and validate the recipient address in the send flow
        await homePage.startSendFlow();

        await sendPage.selectToken('0x1', 'ETH');
        await sendPage.fillRecipient('metamask.domain');

        await driver.findElement({ text: '0xc0ffe...54979' });
      },
    );
  });
});
