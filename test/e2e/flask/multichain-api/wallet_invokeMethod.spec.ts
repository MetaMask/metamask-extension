import { strict as assert } from 'assert';
import {
  ACCOUNT_1,
  ACCOUNT_2,
  convertETHToHexGwei,
  largeDelayMs,
  unlockWallet,
  WINDOW_TITLES,
  withFixtures,
} from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { DEFAULT_LOCAL_NODE_ETH_BALANCE_DEC } from '../../constants';
import TestDappMultichain from '../../page-objects/pages/test-dapp-multichain';
import {
  DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
  addAccountInWalletAndAuthorize,
  escapeColon,
  type FixtureCallbackArgs,
} from './testHelpers';

describe('Multichain API', function () {
  const GANACHE_SCOPES = ['eip155:1337', 'eip155:1338', 'eip155:1000'];
  const ACCOUNTS = [ACCOUNT_1, ACCOUNT_2];
  const DEFAULT_INITIAL_BALANCE_HEX = convertETHToHexGwei(
    DEFAULT_LOCAL_NODE_ETH_BALANCE_DEC,
  );

  describe('Calling `wallet_invokeMethod` on the same dapp across three different connected chains', function () {
    describe('Read operations: calling different methods on each connected scope', function () {
      it('Should match selected method to the expected output', async function () {
        await withFixtures(
          {
            title: this.test?.fullTitle(),
            fixtures: new FixtureBuilder()
              .withNetworkControllerTripleNode()
              .build(),
            ...DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
          },
          async ({ driver, extensionId }: FixtureCallbackArgs) => {
            await unlockWallet(driver);

            const testDapp = new TestDappMultichain(driver);
            await testDapp.openTestDappPage();
            await testDapp.connectExternallyConnectable(extensionId);
            await testDapp.initCreateSessionScopes(GANACHE_SCOPES, ACCOUNTS);
            await addAccountInWalletAndAuthorize(driver);
            await driver.clickElementAndWaitForWindowToClose({
              text: 'Connect',
              tag: 'button',
            });
            await driver.switchToWindowWithTitle(
              WINDOW_TITLES.MultichainTestDApp,
            );

            const TEST_METHODS = {
              [GANACHE_SCOPES[0]]: 'eth_chainId',
              [GANACHE_SCOPES[1]]: 'eth_getBalance',
              [GANACHE_SCOPES[2]]: 'eth_gasPrice',
            };
            const EXPECTED_RESULTS = {
              [GANACHE_SCOPES[0]]: '0x539',
              [GANACHE_SCOPES[1]]: DEFAULT_INITIAL_BALANCE_HEX,
              [GANACHE_SCOPES[2]]: '0x77359400',
            };

            for (const scope of GANACHE_SCOPES) {
              const invokeMethod = TEST_METHODS[scope];
              await driver.clickElementSafe(
                `[data-testid="${scope}-${invokeMethod}-option"]`,
              );

              await driver.clickElementSafe(
                `[data-testid="invoke-method-${scope}-btn"]`,
              );

              await driver.waitForSelector({
                css: `[id="invoke-method-${scope}-${invokeMethod}-result-0"]`,
                text: `"${EXPECTED_RESULTS[scope]}"`,
              });
            }
          },
        );
      });
    });

    describe('Write operations: calling `eth_sendTransaction` on each connected scope', function () {
      const INDEX_FOR_ALTERNATE_ACCOUNT = 1;

      it('should match chosen addresses in each chain to the selected address per scope in extension window', async function () {
        await withFixtures(
          {
            title: this.test?.fullTitle(),
            fixtures: new FixtureBuilder()
              .withNetworkControllerTripleNode()
              .build(),
            ...DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
          },
          async ({ driver, extensionId }: FixtureCallbackArgs) => {
            await unlockWallet(driver);

            const testDapp = new TestDappMultichain(driver);
            await testDapp.openTestDappPage();
            await testDapp.connectExternallyConnectable(extensionId);
            await testDapp.initCreateSessionScopes(GANACHE_SCOPES, ACCOUNTS);
            await addAccountInWalletAndAuthorize(driver);
            await driver.clickElementAndWaitForWindowToClose({
              text: 'Connect',
              tag: 'button',
            });

            await driver.switchToWindowWithTitle(
              WINDOW_TITLES.MultichainTestDApp,
            );

            for (const [i, scope] of GANACHE_SCOPES.entries()) {
              await driver.clickElementSafe(
                `[data-testid="${scope}-eth_sendTransaction-option"]`,
              );

              i === INDEX_FOR_ALTERNATE_ACCOUNT &&
                (await driver.clickElementSafe(
                  `[data-testid="${scope}:${ACCOUNT_2}-option"]`,
                ));
            }

            await driver.clickElement({
              text: 'Invoke All Selected Methods',
              tag: 'button',
            });

            for (const i of GANACHE_SCOPES.keys()) {
              await driver.delay(largeDelayMs);
              await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

              const expectedAccount =
                i === INDEX_FOR_ALTERNATE_ACCOUNT ? 'Account 2' : 'Account 1';

              await driver.waitForSelector({
                tesId: 'sender-address',
                text: expectedAccount,
              });

              await driver.clickElement({
                text: 'Confirm',
                tag: 'button',
              });
            }
          },
        );
      });

      it('should have less balance due to gas after transaction is sent', async function () {
        await withFixtures(
          {
            title: this.test?.fullTitle(),
            fixtures: new FixtureBuilder()
              .withNetworkControllerTripleNode()
              .build(),
            ...DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
          },
          async ({ driver, extensionId }: FixtureCallbackArgs) => {
            await unlockWallet(driver);

            const testDapp = new TestDappMultichain(driver);
            await testDapp.openTestDappPage();
            await testDapp.connectExternallyConnectable(extensionId);
            await testDapp.initCreateSessionScopes(GANACHE_SCOPES, ACCOUNTS);
            await addAccountInWalletAndAuthorize(driver);
            await driver.clickElementAndWaitForWindowToClose({
              text: 'Connect',
              tag: 'button',
            });
            await driver.switchToWindowWithTitle(
              WINDOW_TITLES.MultichainTestDApp,
            );

            for (const [i, scope] of GANACHE_SCOPES.entries()) {
              await driver.clickElementSafe(
                `[data-testid="${scope}-eth_sendTransaction-option"]`,
              );

              i === INDEX_FOR_ALTERNATE_ACCOUNT &&
                (await driver.clickElementSafe(
                  `[data-testid="${scope}:${ACCOUNT_2}-option"]`,
                ));
            }

            await driver.clickElement({
              text: 'Invoke All Selected Methods',
              tag: 'button',
            });

            const totalNumberOfScopes = GANACHE_SCOPES.length;
            for (let i = 0; i < totalNumberOfScopes; i++) {
              await driver.delay(largeDelayMs);
              await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
              await driver.clickElement({
                text: 'Confirm',
                tag: 'button',
              });
            }

            await driver.delay(largeDelayMs);
            await driver.switchToWindowWithTitle(
              WINDOW_TITLES.MultichainTestDApp,
            );

            await driver.clickElementSafe({
              text: 'Clear Results',
              tag: 'button',
            });

            for (const scope of GANACHE_SCOPES) {
              await driver.clickElementSafe(
                `[data-testid="${scope}-eth_getBalance-option"]`,
              );

              await driver.delay(largeDelayMs);
              await driver.clickElementSafe(
                `[data-testid="invoke-method-${scope}-btn"]`,
              );

              const resultWebElement = await driver.findElement(
                `#invoke-method-${escapeColon(scope)}-eth_getBalance-result-0`,
              );
              const currentBalance = await resultWebElement.getText();

              assert.notStrictEqual(
                currentBalance,
                `"${DEFAULT_INITIAL_BALANCE_HEX}"`,
                `${scope} scope balance should be different after eth_sendTransaction due to gas`,
              );
            }
          },
        );
      });
    });
  });
});
