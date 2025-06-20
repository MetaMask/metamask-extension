import { strict as assert } from 'assert';
import { isHexString } from '@metamask/utils';
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
import { mockEip7702FeatureFlag } from '../../tests/confirmations/helpers';
import Eip7702AndSendCalls from '../../page-objects/pages/confirmations/redesign/batch-confirmation';
import {
  DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
  addAccountInWalletAndAuthorize,
  replaceColon,
  type FixtureCallbackArgs,
} from './testHelpers';

describe('Multichain API', function () {
  const GANACHE_SCOPES = ['eip155:1337', 'eip155:1338', 'eip155:1000'];
  const CAIP_ACCOUNT_IDS = [`eip155:0:${ACCOUNT_1}`, `eip155:0:${ACCOUNT_2}`];
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
            await testDapp.initCreateSessionScopes(
              GANACHE_SCOPES,
              CAIP_ACCOUNT_IDS,
            );
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
                `[data-testid="${replaceColon(scope)}-${invokeMethod}-option"]`,
              );

              await driver.clickElementSafe(
                `[data-testid="invoke-method-${replaceColon(scope)}-btn"]`,
              );

              await driver.waitForSelector({
                css: `[id="invoke-method-${replaceColon(
                  scope,
                )}-${invokeMethod}-result-0"]`,
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
            await testDapp.initCreateSessionScopes(
              GANACHE_SCOPES,
              CAIP_ACCOUNT_IDS,
            );
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
                `[data-testid="${replaceColon(
                  scope,
                )}-eth_sendTransaction-option"]`,
              );

              i === INDEX_FOR_ALTERNATE_ACCOUNT &&
                (await driver.clickElementSafe(
                  `[data-testid="${replaceColon(scope)}-${ACCOUNT_2}-option"]`,
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
                testId: 'sender-address',
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
            await testDapp.initCreateSessionScopes(
              GANACHE_SCOPES,
              CAIP_ACCOUNT_IDS,
            );
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
                `[data-testid="${replaceColon(
                  scope,
                )}-eth_sendTransaction-option"]`,
              );

              i === INDEX_FOR_ALTERNATE_ACCOUNT &&
                (await driver.clickElementSafe(
                  `[data-testid="${replaceColon(scope)}-${ACCOUNT_2}-option"]`,
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
                `[data-testid="${replaceColon(scope)}-eth_getBalance-option"]`,
              );

              await driver.delay(largeDelayMs);
              await driver.clickElementSafe(
                `[data-testid="invoke-method-${replaceColon(scope)}-btn"]`,
              );

              const resultWebElement = await driver.findElement(
                `#invoke-method-${replaceColon(scope)}-eth_getBalance-result-0`,
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

  describe('EIP-5792 Methods', function () {
    describe('Calling `wallet_getCapabalities`', function () {
      it('should return the available capabilities', async function () {
        await withFixtures(
          {
            ...DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
            title: this.test?.fullTitle(),
            fixtures: new FixtureBuilder()
              .withPermissionControllerConnectedToMultichainTestDapp()
              .build(),
            localNodeOptions: [
              {
                type: 'anvil',
                options: {
                  hardfork: 'prague',
                  loadState:
                    './test/e2e/seeder/network-states/eip7702-state/withDelegatorContracts.json',
                },
              },
            ],
            testSpecificMock: mockEip7702FeatureFlag,
          },
          async ({ driver, extensionId }: FixtureCallbackArgs) => {
            const scope = GANACHE_SCOPES[0];
            const method = 'wallet_getCapabilities';

            await unlockWallet(driver);

            const testDapp = new TestDappMultichain(driver);
            await testDapp.openTestDappPage();
            await testDapp.connectExternallyConnectable(extensionId);
            await testDapp.initCreateSessionScopes([scope]);

            await addAccountInWalletAndAuthorize(driver);
            await driver.clickElementAndWaitForWindowToClose({
              text: 'Connect',
              tag: 'button',
            });

            await driver.switchToWindowWithTitle(
              WINDOW_TITLES.MultichainTestDApp,
            );

            await driver.clickElementSafe(
              `[data-testid="${replaceColon(scope)}-${method}-option"]`,
            );

            await driver.delay(largeDelayMs);
            await driver.clickElementSafe(
              `[data-testid="invoke-method-${replaceColon(scope)}-btn"]`,
            );

            await driver.delay(largeDelayMs);
            const resultWebElement = await driver.findElement(
              `#invoke-method-${replaceColon(scope)}-${method}-result-0`,
            );

            const text = await resultWebElement.getText();

            assert.deepEqual(
              JSON.parse(text),
              {
                '0x539': { atomic: { status: 'ready' } },
              },
              `Scope ${scope} should have atomic capabilities with status: ready`,
            );
          },
        );
      });
    });

    describe('Calling `wallet_sendCalls`', function () {
      it('should return the transaction hash for the atomic call', async function () {
        await withFixtures(
          {
            ...DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
            title: this.test?.fullTitle(),
            fixtures: new FixtureBuilder()
              .withPermissionControllerConnectedToMultichainTestDapp()
              .build(),
            localNodeOptions: [
              {
                type: 'anvil',
                options: {
                  hardfork: 'prague',
                  loadState:
                    './test/e2e/seeder/network-states/eip7702-state/withDelegatorContracts.json',
                },
              },
            ],
            testSpecificMock: mockEip7702FeatureFlag,
          },
          async ({ driver, extensionId }: FixtureCallbackArgs) => {
            const scope = GANACHE_SCOPES[0];
            const method = 'wallet_sendCalls';

            await unlockWallet(driver);

            const testDapp = new TestDappMultichain(driver);
            await testDapp.openTestDappPage();
            await testDapp.connectExternallyConnectable(extensionId);
            await testDapp.initCreateSessionScopes([scope]);

            await addAccountInWalletAndAuthorize(driver);
            await driver.clickElementAndWaitForWindowToClose({
              text: 'Connect',
              tag: 'button',
            });

            await driver.switchToWindowWithTitle(
              WINDOW_TITLES.MultichainTestDApp,
            );

            await driver.clickElementSafe(
              `[data-testid="${replaceColon(scope)}-${method}-option"]`,
            );

            await driver.delay(largeDelayMs);
            await driver.clickElementSafe(
              `[data-testid="invoke-method-${replaceColon(scope)}-btn"]`,
            );

            await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
            const upgradeAndBatchTxConfirmation = new Eip7702AndSendCalls(
              driver,
            );
            await upgradeAndBatchTxConfirmation.clickUseSmartAccountButton();
            await upgradeAndBatchTxConfirmation.clickFooterConfirmButton();

            await driver.switchToWindowWithTitle(
              WINDOW_TITLES.MultichainTestDApp,
            );

            const resultWebElement = await driver.findElement(
              `#invoke-method-${replaceColon(scope)}-${method}-result-0`,
            );

            const result = await resultWebElement
              .getText()
              .then((t) => JSON.parse(t));

            assert.ok(
              Object.prototype.hasOwnProperty.call(result, 'id'),
              'Result should have an `id` property',
            );
            assert.ok(
              isHexString(result.id),
              '`id` property should be a transaction hash',
            );
          },
        );
      });
    });

    describe('Calling `wallet_getCallsStatus`', function () {
      it('should return the status', async function () {
        await withFixtures(
          {
            ...DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
            title: this.test?.fullTitle(),
            fixtures: new FixtureBuilder()
              .withPermissionControllerConnectedToMultichainTestDapp()
              .build(),
            localNodeOptions: [
              {
                type: 'anvil',
                options: {
                  hardfork: 'prague',
                  loadState:
                    './test/e2e/seeder/network-states/eip7702-state/withDelegatorContracts.json',
                },
              },
            ],
            testSpecificMock: mockEip7702FeatureFlag,
          },
          async ({ driver, extensionId }: FixtureCallbackArgs) => {
            const scope = GANACHE_SCOPES[0];
            const method = 'wallet_sendCalls';

            await unlockWallet(driver);

            const testDapp = new TestDappMultichain(driver);
            await testDapp.openTestDappPage();
            await testDapp.connectExternallyConnectable(extensionId);
            await testDapp.initCreateSessionScopes([scope]);

            await addAccountInWalletAndAuthorize(driver);
            await driver.clickElementAndWaitForWindowToClose({
              text: 'Connect',
              tag: 'button',
            });

            await driver.switchToWindowWithTitle(
              WINDOW_TITLES.MultichainTestDApp,
            );

            await driver.clickElementSafe(
              `[data-testid="${replaceColon(scope)}-${method}-option"]`,
            );

            await driver.delay(largeDelayMs);
            await driver.clickElementSafe(
              `[data-testid="invoke-method-${replaceColon(scope)}-btn"]`,
            );

            await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
            const upgradeAndBatchTxConfirmation = new Eip7702AndSendCalls(
              driver,
            );
            await upgradeAndBatchTxConfirmation.clickUseSmartAccountButton();
            await upgradeAndBatchTxConfirmation.clickFooterConfirmButton();

            await driver.switchToWindowWithTitle(
              WINDOW_TITLES.MultichainTestDApp,
            );

            const resultWebElement = await driver.findElement(
              `#invoke-method-${replaceColon(scope)}-${method}-result-0`,
            );

            const sendCallsResult = await resultWebElement
              .getText()
              .then((t) => JSON.parse(t));

            const { id } = sendCallsResult;

            const result = (await testDapp.invokeMethod(
              scope,
              'wallet_getCallsStatus',
              [id],
            )) as object & { id: string };

            assert.deepStrictEqual(
              { ...result, id: undefined },
              {
                version: '2.0.0',
                id: undefined,
                chainId: '0x539',
                atomic: true,
                status: 100,
              },
              'Result structure does not match',
            );

            assert.ok(
              isHexString(result.id),
              'id property is not a valid hex string',
            );
          },
        );
      });
    });
  });
});
