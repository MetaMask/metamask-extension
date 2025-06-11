import { strict as assert } from 'assert';
import { unlockWallet, withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import TestDappMultichain from '../../page-objects/pages/test-dapp-multichain';
import {
  DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
  replaceColon,
  type FixtureCallbackArgs,
} from './testHelpers';

describe('Calling `eth_subscribe` on a particular network event', function () {
  it('Should receive a notification through the Multichain API for the event app subscribed to', async function () {
    await withFixtures(
      {
        title: this.test?.fullTitle(),
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToMultichainTestDapp()
          .build(),
        ...DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
      },
      async ({ driver, extensionId }: FixtureCallbackArgs) => {
        await unlockWallet(driver);

        const testDapp = new TestDappMultichain(driver);
        await testDapp.openTestDappPage();
        await testDapp.connectExternallyConnectable(extensionId);
        const SCOPE = 'eip155:1337';

        await driver.clickElementSafe(
          `[data-testid="${replaceColon(SCOPE)}-eth_subscribe-option"]`,
        );
        await driver.clickElementSafe(
          `[data-testid="invoke-method-${replaceColon(SCOPE)}-btn"]`,
        );

        const walletNotifyNotificationWebElement = await driver.findElement(
          '#wallet-notify-result-0',
        );
        const resultSummaries = await driver.findElements('.result-summary');

        /**
         * Currently we don't have `data-testid` setup for the desired result, so we click on all available results
         * to make the complete text available and later evaluate if scopes match.
         */
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        resultSummaries.forEach(async (element) => await element.click());

        const parsedNotificationResult = JSON.parse(
          await walletNotifyNotificationWebElement.getText(),
        );

        const resultScope = parsedNotificationResult.params.scope;

        assert.strictEqual(
          parsedNotificationResult.params.scope,
          SCOPE,
          `received notification should come from the subscribed event and scope. Expected scope: ${SCOPE}, Actual scope: ${resultScope}`,
        );
      },
    );
  });
});
