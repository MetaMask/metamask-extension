import { strict as assert } from 'assert';
import {
  ACCOUNT_1,
  ACCOUNT_2,
  convertETHToHexGwei,
  largeDelayMs,
  WINDOW_TITLES,
  withFixtures,
} from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { DEFAULT_LOCAL_NODE_ETH_BALANCE_DEC } from '../../constants';
import Confirmation from '../../page-objects/pages/confirmations/redesign/confirmation';
import ConnectAccountConfirmation from '../../page-objects/pages/confirmations/redesign/connect-account-confirmation';
import EditConnectedAccountsModal from '../../page-objects/pages/dialog/edit-connected-accounts-modal';
import TestDappMultichain from '../../page-objects/pages/test-dapp-multichain';
import TransactionConfirmation from '../../page-objects/pages/confirmations/redesign/transaction-confirmation';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import {
  DEFAULT_MULTICHAIN_TEST_DAPP_FIXTURE_OPTIONS,
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
            await loginWithBalanceValidation(driver);

            const testDapp = new TestDappMultichain(driver);
            await testDapp.openTestDappPage();
            await testDapp.check_pageIsLoaded();
            await testDapp.connectExternallyConnectable(extensionId);
            await testDapp.initCreateSessionScopes(
              GANACHE_SCOPES,
              CAIP_ACCOUNT_IDS,
            );

            const connectAccountConfirmation = new ConnectAccountConfirmation(
              driver,
            );
            await connectAccountConfirmation.check_pageIsLoaded();
            await connectAccountConfirmation.openEditAccountsModal();

            const editConnectedAccountsModal = new EditConnectedAccountsModal(
              driver,
            );
            await editConnectedAccountsModal.check_pageIsLoaded();
            await editConnectedAccountsModal.addNewEthereumAccount();

            await connectAccountConfirmation.check_pageIsLoaded();
            await connectAccountConfirmation.confirmConnect();
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
            await testDapp.check_pageIsLoaded();
            await testDapp.connectExternallyConnectable(extensionId);
            await testDapp.initCreateSessionScopes(
              GANACHE_SCOPES,
              CAIP_ACCOUNT_IDS,
            );
            const connectAccountConfirmation = new ConnectAccountConfirmation(
              driver,
            );
            await connectAccountConfirmation.check_pageIsLoaded();
            await connectAccountConfirmation.openEditAccountsModal();

            const editConnectedAccountsModal = new EditConnectedAccountsModal(
              driver,
            );
            await editConnectedAccountsModal.check_pageIsLoaded();
            await editConnectedAccountsModal.addNewEthereumAccount();
            await connectAccountConfirmation.check_pageIsLoaded();
            await connectAccountConfirmation.confirmConnect();

            await driver.switchToWindowWithTitle(
              WINDOW_TITLES.MultichainTestDApp,
            );
            await testDapp.check_pageIsLoaded();

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

            for (const i of GANACHE_SCOPES.keys()) {
              await driver.delay(largeDelayMs);
              await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
              const confirmation = new TransactionConfirmation(driver);
              await confirmation.check_pageIsLoaded();

              const expectedAccount =
                i === INDEX_FOR_ALTERNATE_ACCOUNT ? 'Account 2' : 'Account 1';

              await confirmation.check_senderAccount(expectedAccount);
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
            await testDapp.check_pageIsLoaded();
            await testDapp.connectExternallyConnectable(extensionId);
            await testDapp.initCreateSessionScopes(
              GANACHE_SCOPES,
              CAIP_ACCOUNT_IDS,
            );
            const connectAccountConfirmation = new ConnectAccountConfirmation(
              driver,
            );
            await connectAccountConfirmation.check_pageIsLoaded();
            await connectAccountConfirmation.confirmConnect();

            await driver.switchToWindowWithTitle(
              WINDOW_TITLES.MultichainTestDApp,
            );
            await testDapp.check_pageIsLoaded();
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
              await confirmation.check_pageIsLoaded();
              await confirmation.clickFooterConfirmButton();
            }
            await driver.delay(2000);
            await driver.switchToWindowWithTitle(
              WINDOW_TITLES.MultichainTestDApp,
            );
            await testDapp.check_pageIsLoaded();
            for (const scope of GANACHE_SCOPES) {
              const currentBalance = await testDapp.invokeMethod({
                scope,
                method: 'eth_getBalance',
              });
              assert.notStrictEqual(
                currentBalance,
                `"${DEFAULT_INITIAL_BALANCE_HEX}"`,
                `${scope} scope balance should be different after eth_sendTransaction due to gas`,
              );
              await driver.delay(largeDelayMs);
            }
          },
        );
      });
    });
  });
});
