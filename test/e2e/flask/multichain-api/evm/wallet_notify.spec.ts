import { withFixtures } from '../../../helpers';
import FixtureBuilder from '../../../fixture-builder';
import TestDappMultichain from '../../../page-objects/pages/test-dapp-multichain';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';
import {
  DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
  type FixtureCallbackArgs,
} from '../testHelpers';

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
        await loginWithBalanceValidation(driver);

        const testDapp = new TestDappMultichain(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();
        await testDapp.connectExternallyConnectable(extensionId);
        const SCOPE = 'eip155:1337';
        await testDapp.invokeMethod({
          scope: SCOPE,
          method: 'eth_subscribe',
        });

        /**
         * Currently we don't have `data-testid` setup for the desired result, so we click on all available results
         * to make the complete text available and later evaluate if scopes match.
         */
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31879
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        // TODO: temporarily leave this line in place, will migrate to POM once the ticket is resolved
        const resultSummaries = await driver.findElements('.result-summary');
        resultSummaries.forEach(async (element) => await element.click());
        await testDapp.checkWalletNotifyResult(SCOPE);
      },
    );
  });
});
