const {
  defaultGanacheOptions,
  withFixtures,
  openDapp,
  DAPP_ONE_URL,
  unlockWallet,
} = require('../helpers');
const FixtureBuilder = require('../fixture-builder');

describe('eth_subscribe', function () {
  it('only broadcasts subscription notifications on the page that registered the subscription', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        dappOptions: { numberOfDapps: 2 },
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await openDapp(driver);

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
        await driver.findElement('[data-testid="eth-subscribe-response"]');

        // Switch to the second dapp
        await openDapp(driver, null, DAPP_ONE_URL);

        // Setup the same subscription listener as on the first dapp, but without registering a new subscription
        await driver.executeScript(setupSubscriptionListener);

        await driver.assertElementNotPresent(
          '[data-testid="eth-subscribe-response"]',
          { waitAtLeastGuard: 1000 }, // A waitAtLeastGuard of 1000ms is the best choice here
        );
      },
    );
  });
});
