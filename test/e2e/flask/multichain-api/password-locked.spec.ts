import { strict as assert } from 'assert';
import {
  ACCOUNT_1,
  ACCOUNT_2,
  largeDelayMs,
  veryLargeDelayMs,
  WINDOW_TITLES,
  withFixtures,
} from '../../helpers';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixture-builder';
import {
  addAccountInWalletAndAuthorize,
  DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
  getExpectedSessionScope,
  getSessionScopes,
  initCreateSessionScopes,
  openMultichainDappAndConnectWalletWithExternallyConnectable,
  passwordLockMetamaskExtension,
  updateNetworkCheckboxes,
} from './testHelpers';

describe("A dapp has permission to suggest transactions for a user's MetaMask account and chain permissions for a user's RPC networks, user's extension becomes password locked", function () {
  const SCOPE = 'eip155:1337';
  describe('the dapp sends a request through the Multichain API that requires user confirmation on the permitted account', function () {
    it.only('should prompts the user to unlock MetaMask before returning an RPC response to the dapp', async function () {
      await withFixtures(
        {
          title: this.test?.fullTitle(),
          fixtures: new FixtureBuilder()
            .withNetworkControllerTripleGanache()
            .withPermissionControllerConnectedToTestDappMultichain()
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

          await driver.clickElement({
            text: 'wallet_createSession',
            tag: 'span',
          });
          await driver.delay(30_000);
          // await driver.delay(100_000);
          // await driver.waitUntilXWindowHandles(4, 100000, 150000);
          // await driver.waitUntilXWindowHandles(4, 100000, 1500000);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
          // TODO: After focus switches to Dialog, assert window is there and defined ?
          // TODO: Problem: No window found by background script with title: MetaMask Dialog" always thrown before we see the actual popup extension password prompt window show
        },
      );
    });
  });

  describe('the dapp sends a request through the Multichain API that does NOT require user confirmation', function () {
    it('should accept and handle the RPC request & response back to the dapp', async function () {
      await withFixtures(
        {
          title: this.test?.fullTitle(),
          fixtures: new FixtureBuilder()
            .withNetworkControllerTripleGanache()
            .withPermissionControllerConnectedToTestDappMultichain()
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

          assert.deepStrictEqual(
            sessionScope,
            expectedSessionScope,
            `Should receive result that specifies expected session scopes for ${SCOPE}`,
          );
        },
      );
    });
  });
});
