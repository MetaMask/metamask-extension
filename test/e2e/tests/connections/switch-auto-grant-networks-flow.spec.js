const { strict: assert } = require('assert');
const {
  withFixtures,
  WINDOW_TITLES,
  defaultGanacheOptions,
  openPopupWithActiveTabOrigin,
  openDapp,
  unlockWallet,
  DAPP_URL,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');
const {
  PermissionNames,
} = require('../../../../app/scripts/controllers/permissions');
const { CaveatTypes } = require('../../../../shared/constants/permissions');

describe('Switch Auto Grant Networks Flow', function () {
  it('should be able to automatically grant additional `permitted-chains` for an unpermitted network being switched to for a dapp via the network menu', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNetworkController()
          .withPreferencesControllerUseRequestQueueEnabled()
          .withSelectedNetworkControllerPerDomain()
          .build(),
        title: this.test.fullTitle(),
        ganacheOptions: defaultGanacheOptions,
        driverOptions: { constrainWindowSize: true },
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await openDapp(driver);

        await driver.clickElement({
          text: 'Connect',
          tag: 'button',
        });

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const editButtons = await driver.findElements('[data-testid="edit"]');

        // Click the edit button for networks
        await editButtons[1].click();

        // Disconnect Testnet
        await driver.clickElement({
          text: 'Localhost 8545',
          tag: 'p',
        });

        await driver.clickElement('[data-testid="connect-more-chains-button"]');
        await driver.clickElementAndWaitForWindowToClose({
          text: 'Connect',
          tag: 'button',
        });

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        const getPermissionsRequest = JSON.stringify({
          method: 'wallet_getPermissions',
        });
        const getPermissionsResultBeforeSwitch = await driver.executeScript(
          `return window.ethereum.request(${getPermissionsRequest})`,
        );

        const permittedChainsBeforeSwitch =
          getPermissionsResultBeforeSwitch
            ?.find(
              (permission) =>
                permission.parentCapability === PermissionNames.permittedChains,
            )
            ?.caveats.find(
              (caveat) => caveat.type === CaveatTypes.restrictNetworkSwitching,
            )?.value || [];

        assert.ok(
          !permittedChainsBeforeSwitch.includes('0x1337'),
          'Localhost 8545 is not connected.',
        );

        await openPopupWithActiveTabOrigin(driver, DAPP_URL);

        // Network Selector
        await driver.clickElement('[data-testid="network-display"]');

        // Switch network
        await driver.clickElement({
          text: 'Localhost 8545',
          css: 'p',
        });

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        const getPermissionsResultAfterSwitch = await driver.executeScript(
          `return window.ethereum.request(${getPermissionsRequest})`,
        );

        const permittedChainsAfterSwitch =
          getPermissionsResultAfterSwitch
            ?.find(
              (permission) =>
                permission.parentCapability === PermissionNames.permittedChains,
            )
            ?.caveats.find(
              (caveat) => caveat.type === CaveatTypes.restrictNetworkSwitching,
            )?.value || [];

        assert.equal(
          permittedChainsBeforeSwitch.length + 1,
          permittedChainsAfterSwitch.length,
        );
        assert.ok(
          permittedChainsBeforeSwitch.includes('0x1337'),
          'Localhost 8545 is connected.',
        );
      },
    );
  });
});
