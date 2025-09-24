import { strict as assert } from 'assert';
import { isHexString } from '@metamask/utils';
import {
  ACCOUNT_1,
  ACCOUNT_2,
  convertETHToHexGwei,
  largeDelayMs,
  WINDOW_TITLES,
  withFixtures,
} from '../../../helpers';
import FixtureBuilder from '../../../fixture-builder';
import { DEFAULT_LOCAL_NODE_ETH_BALANCE_DEC } from '../../../constants';
import TestDappMultichain from '../../../page-objects/pages/test-dapp-multichain';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';
import ActivityListPage from '../../../page-objects/pages/home/activity-list';
import Confirmation from '../../../page-objects/pages/confirmations/redesign/confirmation';
import ConnectAccountConfirmation from '../../../page-objects/pages/confirmations/redesign/connect-account-confirmation';
import HomePage from '../../../page-objects/pages/home/homepage';
import TransactionConfirmation from '../../../page-objects/pages/confirmations/redesign/transaction-confirmation';
import Eip7702AndSendCalls from '../../../page-objects/pages/confirmations/redesign/batch-confirmation';
import { mockEip7702FeatureFlag } from '../../../tests/confirmations/helpers';
import {
  DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
  type FixtureCallbackArgs,
  addAccountInWalletAndAuthorize,
} from '../testHelpers';

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
            await loginWithBalanceValidation(driver);

            const testDapp = new TestDappMultichain(driver);
            await testDapp.openTestDappPage();
            await testDapp.checkPageIsLoaded();
            await testDapp.connectExternallyConnectable(extensionId);
            await testDapp.initCreateSessionScopes(
              GANACHE_SCOPES,
              CAIP_ACCOUNT_IDS,
            );
            await addAccountInWalletAndAuthorize(driver);

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
              await testDapp.invokeMethodAndCheckResult({
                scope,
                method: invokeMethod,
                expectedResult: EXPECTED_RESULTS[scope],
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
            await loginWithBalanceValidation(driver);

            const testDapp = new TestDappMultichain(driver);
            await testDapp.openTestDappPage();
            await testDapp.checkPageIsLoaded();
            await testDapp.connectExternallyConnectable(extensionId);
            await testDapp.initCreateSessionScopes(
              GANACHE_SCOPES,
              CAIP_ACCOUNT_IDS,
            );
            await addAccountInWalletAndAuthorize(driver);

            await driver.switchToWindowWithTitle(
              WINDOW_TITLES.MultichainTestDApp,
            );
            await testDapp.checkPageIsLoaded();

            for (const [i, scope] of GANACHE_SCOPES.entries()) {
              await testDapp.selectMethod({
                scope,
                method: 'eth_sendTransaction',
              });

              i === INDEX_FOR_ALTERNATE_ACCOUNT &&
                (await testDapp.selectAccount({
                  scope,
                  account: ACCOUNT_2,
                }));
            }
            await testDapp.clickInvokeAllMethodsButton();

            // first confirmation page should display Account 1 as sender account
            await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
            const confirmation = new TransactionConfirmation(driver);
            await confirmation.checkPageIsLoaded();
            assert.equal(
              await confirmation.checkIsSenderAccountDisplayed('Account 1'),
              true,
            );
            await confirmation.clickFooterConfirmButton();

            // check which account confirmation page is displayed on second screen
            await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
            await confirmation.checkPageIsLoaded();
            const screenForAccount2 =
              await confirmation.checkIsSenderAccountDisplayed('Account 2');
            if (screenForAccount2) {
              await confirmation.checkNetworkIsDisplayed('Localhost 8546');
              await confirmation.clickFooterConfirmButton();

              // third confirmation page should display Account 1 as sender account
              await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
              await confirmation.checkPageIsLoaded();
              assert.equal(
                await confirmation.checkIsSenderAccountDisplayed('Account 1'),
                true,
              );
              await confirmation.checkNetworkIsDisplayed('Localhost 7777');
              await confirmation.clickFooterConfirmButton();
            } else {
              await confirmation.checkNetworkIsDisplayed('Localhost 7777');
              await confirmation.clickFooterConfirmButton();

              // third confirmation page should display Account 2 as sender account
              await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
              await confirmation.checkPageIsLoaded();
              assert.equal(
                await confirmation.checkIsSenderAccountDisplayed('Account 2'),
                true,
              );
              await confirmation.checkNetworkIsDisplayed('Localhost 8546');
              await confirmation.clickFooterConfirmButton();
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
            await loginWithBalanceValidation(driver);

            const testDapp = new TestDappMultichain(driver);
            await testDapp.openTestDappPage();
            await testDapp.checkPageIsLoaded();
            await testDapp.connectExternallyConnectable(extensionId);
            await testDapp.initCreateSessionScopes(
              GANACHE_SCOPES,
              CAIP_ACCOUNT_IDS,
            );
            const connectAccountConfirmation = new ConnectAccountConfirmation(
              driver,
            );
            await connectAccountConfirmation.checkPageIsLoaded();
            await connectAccountConfirmation.confirmConnect();

            await driver.switchToWindowWithTitle(
              WINDOW_TITLES.MultichainTestDApp,
            );
            await testDapp.checkPageIsLoaded();
            for (const scope of GANACHE_SCOPES) {
              await testDapp.selectMethod({
                scope,
                method: 'eth_sendTransaction',
              });
            }

            await testDapp.clickInvokeAllMethodsButton();
            const totalNumberOfScopes = GANACHE_SCOPES.length;
            for (let i = 0; i < totalNumberOfScopes; i++) {
              await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
              const confirmation = new Confirmation(driver);
              await confirmation.checkPageIsLoaded();
              await confirmation.clickFooterConfirmButton();
            }

            await driver.switchToWindowWithTitle(
              WINDOW_TITLES.ExtensionInFullScreenView,
            );
            const homePage = new HomePage(driver);
            await homePage.checkPageIsLoaded();
            await homePage.goToActivityList();
            await new ActivityListPage(
              driver,
            ).checkConfirmedTxNumberDisplayedInActivity();

            await driver.switchToWindowWithTitle(
              WINDOW_TITLES.MultichainTestDApp,
            );
            await testDapp.checkPageIsLoaded();
            for (const scope of GANACHE_SCOPES) {
              await driver.delay(largeDelayMs);
              const currentBalance = await testDapp.invokeMethodAndReturnResult(
                {
                  scope,
                  method: 'eth_getBalance',
                },
              );
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

            await loginWithBalanceValidation(driver);

            const testDapp = new TestDappMultichain(driver);
            await testDapp.openTestDappPage();
            await testDapp.connectExternallyConnectable(extensionId);
            await testDapp.initCreateSessionScopes([scope]);

            await addAccountInWalletAndAuthorize(driver);

            await driver.switchToWindowWithTitle(
              WINDOW_TITLES.MultichainTestDApp,
            );
            await testDapp.checkPageIsLoaded();
            await testDapp.invokeMethodAndCheckResult({
              scope,
              method,
              expectedResult: '{"0x539":{"atomic":{"status":"ready"}}}',
            });
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

            await loginWithBalanceValidation(driver);

            const testDapp = new TestDappMultichain(driver);
            await testDapp.openTestDappPage();
            await testDapp.checkPageIsLoaded();
            await testDapp.connectExternallyConnectable(extensionId);
            await testDapp.initCreateSessionScopes([scope]);

            await addAccountInWalletAndAuthorize(driver);

            await driver.switchToWindowWithTitle(
              WINDOW_TITLES.MultichainTestDApp,
            );
            await testDapp.checkPageIsLoaded();
            await testDapp.invokeMethod({
              scope,
              method,
            });

            await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
            const upgradeAndBatchTxConfirmation = new Eip7702AndSendCalls(
              driver,
            );
            await upgradeAndBatchTxConfirmation.clickUseSmartAccountButton();
            await upgradeAndBatchTxConfirmation.clickFooterConfirmButton();

            await driver.switchToWindowWithTitle(
              WINDOW_TITLES.MultichainTestDApp,
            );
            await testDapp.checkPageIsLoaded();

            const invokeResult = await testDapp.getInvokeMethodResult({
              scope,
              method,
            });
            const result = JSON.parse(invokeResult);

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

            await loginWithBalanceValidation(driver);

            const testDapp = new TestDappMultichain(driver);
            await testDapp.openTestDappPage();
            await testDapp.checkPageIsLoaded();
            await testDapp.connectExternallyConnectable(extensionId);
            await testDapp.initCreateSessionScopes([scope]);

            await addAccountInWalletAndAuthorize(driver);

            await driver.switchToWindowWithTitle(
              WINDOW_TITLES.MultichainTestDApp,
            );
            await testDapp.checkPageIsLoaded();
            await testDapp.invokeMethod({
              scope,
              method,
            });

            await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
            const upgradeAndBatchTxConfirmation = new Eip7702AndSendCalls(
              driver,
            );
            await upgradeAndBatchTxConfirmation.clickUseSmartAccountButton();
            await upgradeAndBatchTxConfirmation.clickFooterConfirmButton();

            await driver.switchToWindowWithTitle(
              WINDOW_TITLES.MultichainTestDApp,
            );
            await testDapp.checkPageIsLoaded();

            const sendCallsResult = await testDapp.getInvokeMethodResult({
              scope,
              method,
            });
            const { id } = JSON.parse(sendCallsResult);

            const getCallsResult = await testDapp.invokeMethodAndReturnResult({
              scope,
              method: 'wallet_getCallsStatus',
              params: [id],
            });
            const result = JSON.parse(getCallsResult);

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
              isHexString(result.id as string),
              'id property is not a valid hex string',
            );
          },
        );
      });
    });
  });
});
