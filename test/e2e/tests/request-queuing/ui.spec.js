const { strict: assert } = require('assert');
const FixtureBuilder = require('../../fixture-builder');
const {
  withFixtures,
  openDapp,
  unlockWallet,
  DAPP_URL,
  DAPP_ONE_URL,
  regularDelayMs,
  WINDOW_TITLES,
  defaultGanacheOptions,
  switchToNotificationWindow,
  veryLargeDelayMs,
} = require('../../helpers');
const { PAGES } = require('../../webdriver/driver');

async function openDappAndSwitchChain(driver, dappUrl, chainId) {
  const notificationWindowIndex = chainId ? 4 : 3;

  // Open the dapp
  await openDapp(driver, undefined, dappUrl);
  await driver.delay(regularDelayMs);

  // Connect to the dapp
  await driver.findClickableElement({ text: 'Connect', tag: 'button' });
  await driver.clickElement('#connectButton');
  await driver.delay(regularDelayMs);
  await switchToNotificationWindow(driver, notificationWindowIndex);
  await driver.clickElement({
    text: 'Next',
    tag: 'button',
    css: '[data-testid="page-container-footer-next"]',
  });
  await driver.clickElement({
    text: 'Confirm',
    tag: 'button',
    css: '[data-testid="page-container-footer-next"]',
  });

  // Switch back to the dapp
  await driver.switchToWindowWithUrl(dappUrl);

  // Switch chains if necessary
  if (chainId) {
    await driver.delay(veryLargeDelayMs);
    const switchChainRequest = JSON.stringify({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }],
    });

    await driver.executeScript(
      `window.ethereum.request(${switchChainRequest})`,
    );

    await driver.delay(veryLargeDelayMs);
    await switchToNotificationWindow(driver, notificationWindowIndex);

    await driver.findClickableElement(
      '[data-testid="confirmation-submit-button"]',
    );
    await driver.clickElement('[data-testid="confirmation-submit-button"]');
  }
}

async function selectDappClickSendGetNetwork(driver, dappUrl) {
  await driver.switchToWindowWithUrl(dappUrl);
  await driver.clickElement('#sendButton');
  await switchToNotificationWindow(driver, 4);
  const networkPill = await driver.findElement(
    '[data-testid="network-display"]',
  );
  const networkText = await networkPill.getText();
  await driver.clickElement({ css: 'button', text: 'Reject' });
  return networkText;
}

describe('Request-queue UI changes', function () {
  it('UI should show network specific to domain @no-mmi', async function () {
    const port = 8546;
    const chainId = 1338;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkControllerDoubleGanache()
          .withPreferencesControllerUseRequestQueueEnabled()
          .withSelectedNetworkControllerPerDomain()
          .build(),
        ganacheOptions: {
          ...defaultGanacheOptions,
          concurrent: [
            {
              port,
              chainId,
              ganacheOptions2: defaultGanacheOptions,
            },
          ],
        },
        dappOptions: { numberOfDapps: 2 },
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // Navigate to extension home screen
        await driver.navigate(PAGES.HOME);

        // Open the first dapp
        await openDappAndSwitchChain(driver, DAPP_URL);

        // Open the second dapp and switch chains
        await openDappAndSwitchChain(driver, DAPP_ONE_URL, '0x1');

        // Go to wallet fullscreen, ensure that the global network changed to Ethereum Mainnet
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await driver.findElement({
          css: '[data-testid="network-display"]',
          text: 'Ethereum Mainnet',
        });

        // Go to the first dapp, ensure it uses localhost
        const dappOneNetworkPillText = await selectDappClickSendGetNetwork(
          driver,
          DAPP_URL,
        );
        assert.equal(dappOneNetworkPillText, 'Localhost 8545');

        // Go to the second dapp, ensure it uses Ethereum Mainnet
        const dappTwoNetworkPillText = await selectDappClickSendGetNetwork(
          driver,
          DAPP_ONE_URL,
        );
        assert.equal(dappTwoNetworkPillText, 'Ethereum Mainnet');
      },
    );
  });
});
