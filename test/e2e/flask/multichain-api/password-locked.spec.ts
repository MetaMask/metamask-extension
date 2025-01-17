import { strict as assert } from 'assert';
import {
  ACCOUNT_1,
  WALLET_PASSWORD,
  WINDOW_TITLES,
  withFixtures,
} from '../../helpers';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixture-builder';
import {
  DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
  escapeColon,
  type FixtureCallbackArgs,
  getExpectedSessionScope,
  getSessionScopes,
  openMultichainDappAndConnectWalletWithExternallyConnectable,
  passwordLockMetamaskExtension,
} from './testHelpers';

describe("A dapp is connected with account and chain permissions previously granted via `wallet_createSession`, user's extension becomes password locked", function () {
  describe('the dapp sends a request through the Multichain API that requires user confirmation on the permitted account', function () {
    it('should prompts the user to unlock MetaMask before showing the request confirmation', async function () {
      await withFixtures(
        {
          title: this.test?.fullTitle(),
          fixtures: new FixtureBuilder()
            .withNetworkControllerTripleGanache()
            .withPermissionControllerConnectedToMultichainTestDapp()
            .build(),
          ...DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
        },
        async ({ driver, extensionId }: FixtureCallbackArgs) => {
          await openMultichainDappAndConnectWalletWithExternallyConnectable(
            driver,
            extensionId,
          );
          await passwordLockMetamaskExtension(driver);
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.MultichainTestDApp,
          );

          await driver.clickElementSafe(
            '[data-testid="eip155:1337-eth_sendTransaction-option"]',
          );
          await driver.clickElement(
            '[data-testid="invoke-method-eip155:1337-btn"]',
          );

          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

          const unlockExtensionPageWebElement0 = await driver.findElement(
            '[data-testid="unlock-page"]',
          );

          assert.ok(
            unlockExtensionPageWebElement0,
            'Should prompt user to unlock Metamask Extension',
          );

          /**
           * We unlock metamask extension to assert a transfer request is being made
           */
          await driver.fill('[data-testid="unlock-password"]', WALLET_PASSWORD);
          await driver.clickElementSafe('[data-testid="unlock-submit"]');

          const transferRequestWebElement = await driver.findElement({
            text: 'Transfer request',
            type: 'h3',
          });

          assert.ok(
            transferRequestWebElement,
            'Should be attempting to make via wallet extension transfer',
          );

          await driver.clickElementSafe(
            '[data-testid="confirm-footer-cancel-button"]',
          );

          /**
           * We lock extension again to repeat action and assertion for `wallet_addEthereumChain`
           */
          await passwordLockMetamaskExtension(driver);

          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.MultichainTestDApp,
          );

          await driver.clickElementSafe(
            '[data-testid="wallet:eip155-wallet_addEthereumChain-option"]',
          );
          await driver.clickElement(
            '[data-testid="invoke-method-wallet:eip155-btn"]',
          );

          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

          const unlockExtensionPageWebElement1 = await driver.findElement(
            '[data-testid="unlock-page"]',
          );

          assert.ok(
            unlockExtensionPageWebElement1,
            'Should prompt user to unlock Metamask Extension',
          );

          /**
           * We unlock metamask extension to assert a request for adding chain is being made
           */
          await driver.fill('[data-testid="unlock-password"]', WALLET_PASSWORD);
          await driver.clickElementSafe('[data-testid="unlock-submit"]');

          const addChainWebElement = await driver.findElement({
            text: 'Add Gnosis',
            type: 'h3',
          });

          assert.ok(
            addChainWebElement,
            'Should be attempting to add Gnosis Chain',
          );
        },
      );
    });
  });

  describe('the dapp sends requests through the Multichain API that do NOT require user confirmation', function () {
    const SCOPE = 'eip155:1337';
    const CHAIN_ID = '0x539';
    it('should handle the requests without prompting the user to unlock the wallet', async function () {
      await withFixtures(
        {
          title: this.test?.fullTitle(),
          fixtures: new FixtureBuilder()
            .withNetworkControllerTripleGanache()
            .withPermissionControllerConnectedToMultichainTestDapp()
            .build(),
          ...DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
        },
        async ({
          driver,
          extensionId,
        }: {
          driver: Driver;
          extensionId: string;
        }) => {
          await openMultichainDappAndConnectWalletWithExternallyConnectable(
            driver,
            extensionId,
          );
          await passwordLockMetamaskExtension(driver);

          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.MultichainTestDApp,
          );

          const parsedResult = await getSessionScopes(driver);
          const sessionScope = parsedResult.sessionScopes[SCOPE];
          const expectedSessionScope = getExpectedSessionScope(SCOPE, [
            ACCOUNT_1,
          ]);

          await driver.clickElementSafe(
            `[data-testid="${SCOPE}-eth_chainId-option"]`,
          );
          await driver.clickElementSafe(
            `[data-testid="invoke-method-${SCOPE}-btn"]`,
          );
          const chainIdResultWebElement = await driver.findElement(
            `#invoke-method-${escapeColon(SCOPE)}-eth_chainId-result-0`,
          );
          const chainId = await chainIdResultWebElement.getText();

          assert.deepStrictEqual(
            sessionScope,
            expectedSessionScope,
            `Should receive result that specifies expected session scopes for ${SCOPE}`,
          );

          assert.deepStrictEqual(
            chainId,
            `"${CHAIN_ID}"`,
            'Should get expected result from calling eth_chainId',
          );
        },
      );
    });
  });
});
