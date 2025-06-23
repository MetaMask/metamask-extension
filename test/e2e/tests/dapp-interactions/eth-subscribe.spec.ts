import { DAPP_ONE_URL, withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import TestDapp from '../../page-objects/pages/test-dapp';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

describe('eth_subscribe', function () {
  it('only broadcasts subscription notifications on the page that registered the subscription', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        dappOptions: { numberOfDapps: 2 },
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.check_pageIsLoaded();

        const setupSubscriptionListener = `
          const responseContainer = document.createElement('div');
          responseContainer.setAttribute('id', 'eth-subscribe-responses');

          const body = window.document.getElementsByTagName('body')[0];
          body.appendChild(responseContainer);

          window.ethereum.addListener('message', (message) => {
            if (message.type === 'eth_subscription') {
              const response = document.createElement('p');
              response.setAttribute('data-testid', 'eth-subscribe-response');
              response.append(JSON.stringify(message.data.result));

              const responses = window.document.getElementById('eth-subscribe-responses');
              responses.appendChild(response)
            }
          });
        `;

        await driver.executeScript(setupSubscriptionListener);
        // A `newHeads` subscription will emit a notification for each new block
        // See here for more information: https://docs.infura.io/infura/networks/ethereum/json-rpc-methods/subscription-methods/eth_subscribe
        await driver.executeScript(`
          window.ethereum.request({
            method: 'eth_subscribe',
            params: ['newHeads']
          });
        `);

        // Verify that the new block is seen on the first dapp
        await testDapp.check_ethSubscribeResponse(true);

        // Switch to the second dapp
        const testDapp2 = new TestDapp(driver);
        await testDapp2.openTestDappPage({ url: DAPP_ONE_URL });
        await testDapp2.check_pageIsLoaded();

        // Setup the same subscription listener as on the first dapp, but without registering a new subscription
        await driver.executeScript(setupSubscriptionListener);
        await testDapp2.check_ethSubscribeResponse(false);
      },
    );
  });
});
