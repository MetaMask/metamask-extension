/**
 * This test suite is for testing connecting to a dapp with different wallet providers (EVM and Solana).
 */
import { strict as assert } from 'assert';
import { BtcScope, SolScope, TrxScope } from '@metamask/keyring-api';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import {
  ACCOUNT_2,
  DAPP_HOST_ADDRESS,
  DAPP_PATH,
  DAPP_URL,
  DEFAULT_FIXTURE_ACCOUNT as EVM_ADDRESS_ONE,
  WINDOW_TITLES,
} from '../../constants';
import { withFixtures } from '../../helpers';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import TestDapp from '../../page-objects/pages/test-dapp';
import ConnectAccountConfirmation from '../../page-objects/pages/confirmations/connect-account-confirmation';
import { login } from '../../page-objects/flows/login.flow';
import { Driver } from '../../webdriver/driver';
import { connectAccountToTestDapp } from '../../page-objects/flows/test-dapp.flow';
import { getEditConnectedAccountsPageForHost } from '../../page-objects/flows/permissions.flow';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { buildSolanaFixtureScopes } from '../../fixtures/permission-scopes';
import { TestDappSolana } from '../../page-objects/pages/test-dapp-solana';
import { connectSolanaTestDapp } from '../../page-objects/flows/solana-dapp.flow';
import { switchToNetworkFromNetworkSelect } from '../../page-objects/flows/network.flow';
import {
  getPermittedChainIdsForOrigin,
  getRequestPermissionsRequestObject,
  getRestrictedNetworks,
} from './helpers';

const EVM_ADDRESS_TWO = ACCOUNT_2;

const EVM_ACCOUNT_LABEL_ONE = 'Account 1';
const EVM_ACCOUNT_LABEL_TWO = 'Account 2';

const SOLANA_PERMISSIONS = buildSolanaFixtureScopes();

/**
 * CAIP chain IDs granted by a default connect: every non-test network in the
 * default fixture.
 */
const DEFAULT_PERMITTED_CAIP_CHAIN_IDS = [
  toEvmCaipChainId(CHAIN_IDS.MAINNET),
  toEvmCaipChainId(CHAIN_IDS.LINEA_MAINNET),
  toEvmCaipChainId(CHAIN_IDS.BASE),
  toEvmCaipChainId(CHAIN_IDS.ARBITRUM),
  toEvmCaipChainId(CHAIN_IDS.BSC),
  toEvmCaipChainId(CHAIN_IDS.POLYGON),
  toEvmCaipChainId(CHAIN_IDS.OPTIMISM),
  toEvmCaipChainId(CHAIN_IDS.MONAD),
  SolScope.Mainnet,
  BtcScope.Mainnet,
  TrxScope.Mainnet,
];

/**
 * Asserts, from the PermissionController state, that the dapp's permitted
 * chains exactly match the expected CAIP chain IDs.
 *
 * @param driver - The webdriver instance.
 * @param expectedCaipChainIds - The expected permitted CAIP chain IDs.
 */
async function checkPermittedChainIds(
  driver: Driver,
  expectedCaipChainIds: string[],
): Promise<void> {
  const permittedChainIds = await getPermittedChainIdsForOrigin(
    driver,
    DAPP_URL,
  );
  assert.deepEqual(
    [...permittedChainIds].sort(),
    [...expectedCaipChainIds].sort(),
  );
}

describe('Multiple Standard Dapp Connections', function () {
  it('should default account selection to already permitted account(s) plus the selected account (if not already permissioned) when `wallet_requestPermissions` is called with no accounts specified', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withKeyringControllerAdditionalAccountVault()
          .withAccountsControllerAdditionalAccountVault()
          .withPermissionControllerConnectedToTestDapp({
            account: EVM_ADDRESS_TWO,
          })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver, { validateBalance: false });
        const testDapp = new TestDapp(driver);

        const connectAccountConfirmation = new ConnectAccountConfirmation(
          driver,
        );

        await testDapp.openTestDappPage();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        await testDapp.checkPageIsLoaded();

        await testDapp.checkConnectedAccounts(EVM_ADDRESS_TWO);

        const requestPermissionsWithoutAccounts =
          getRequestPermissionsRequestObject();

        await driver.executeScript(
          `window.ethereum.request(${requestPermissionsWithoutAccounts})`,
        );

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await connectAccountConfirmation.checkPageIsLoaded();

        await connectAccountConfirmation.checkForAccountsInPermissionList([
          EVM_ACCOUNT_LABEL_TWO,
        ]);

        await connectAccountConfirmation.confirmConnect();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.checkConnectedAccounts(EVM_ADDRESS_TWO);
      },
    );
  });

  it('should default account selection to both accounts when `wallet_requestPermissions` is called with specific account while another is already connected', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withKeyringControllerAdditionalAccountVault()
          .withAccountsControllerAdditionalAccountVault()
          .withPermissionControllerConnectedToTestDapp({
            account: EVM_ADDRESS_TWO,
          })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver, { validateBalance: false });
        const testDapp = new TestDapp(driver);
        const connectAccountConfirmation = new ConnectAccountConfirmation(
          driver,
        );

        await testDapp.openTestDappPage();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.checkPageIsLoaded();

        await testDapp.checkConnectedAccounts(EVM_ADDRESS_TWO);

        const requestPermissionsWithAccount1 =
          getRequestPermissionsRequestObject([EVM_ADDRESS_ONE]);

        await driver.executeScript(
          `window.ethereum.request(${requestPermissionsWithAccount1})`,
        );

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await connectAccountConfirmation.checkPageIsLoaded();

        await connectAccountConfirmation.checkForAccountsInPermissionList([
          EVM_ACCOUNT_LABEL_ONE,
          EVM_ACCOUNT_LABEL_TWO,
        ]);

        await connectAccountConfirmation.confirmConnect();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        const expectedConnectedAccounts = `${EVM_ADDRESS_TWO.toLowerCase()},${EVM_ADDRESS_ONE.toLowerCase()}`;
        await testDapp.checkConnectedAccounts(expectedConnectedAccounts);
      },
    );
  });

  it('should retain EVM permissions when connecting through the Solana Wallet Standard', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withKeyringControllerAdditionalAccountVault()
          .withAccountsControllerAdditionalAccountVault()
          .withPermissionControllerConnectedToTestDapp({
            account: [EVM_ADDRESS_ONE.toLowerCase(), EVM_ADDRESS_TWO],
          })
          .build(),
        title: this.test?.fullTitle(),
        dappOptions: {
          customDappPaths: [DAPP_PATH.TEST_DAPP_SOLANA],
        },
      },
      async ({ driver }) => {
        await login(driver);
        await switchToNetworkFromNetworkSelect(driver, 'Solana');
        const testDapp = new TestDappSolana(driver);

        await testDapp.openTestDappPage();
        await testDapp.switchTo();

        await connectSolanaTestDapp(driver, testDapp);

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        const editConnectedAccountsPage =
          await getEditConnectedAccountsPageForHost(driver, DAPP_HOST_ADDRESS);

        await editConnectedAccountsPage.checkAccountsAreSelected([
          EVM_ACCOUNT_LABEL_ONE,
          EVM_ACCOUNT_LABEL_TWO,
        ]);

        await checkPermittedChainIds(driver, DEFAULT_PERMITTED_CAIP_CHAIN_IDS);
      },
    );
  });

  it('should retain Solana permissions when connecting through the EVM provider', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withPermissionControllerConnectedToTestDapp({
            scopes: SOLANA_PERMISSIONS,
          })
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .build(),
        title: this.test?.fullTitle(),
        dappOptions: { numberOfTestDapps: 1 },
      },
      async ({ driver }) => {
        await login(driver);
        await switchToNetworkFromNetworkSelect(driver, 'Solana');
        const testDapp = new TestDapp(driver);

        await testDapp.openTestDappPage();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.checkPageIsLoaded();

        await connectAccountToTestDapp(driver);

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        const editConnectedAccountsPage =
          await getEditConnectedAccountsPageForHost(driver, DAPP_HOST_ADDRESS);

        await editConnectedAccountsPage.checkAccountsAreSelected([
          EVM_ACCOUNT_LABEL_ONE,
        ]);

        await checkPermittedChainIds(driver, DEFAULT_PERMITTED_CAIP_CHAIN_IDS);
      },
    );
  });

  it('should default account selection to already permissioned Solana account and requested Ethereum account when `wallet_requestPermissions` is called with specific Ethereum account', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withKeyringControllerAdditionalAccountVault()
          .withAccountsControllerAdditionalAccountVault()
          .withPermissionControllerConnectedToTestDapp({
            scopes: SOLANA_PERMISSIONS,
          })
          .build(),
        title: this.test?.fullTitle(),
        dappOptions: { numberOfTestDapps: 1 },
      },
      async ({ driver }) => {
        await login(driver);
        await switchToNetworkFromNetworkSelect(driver, 'Solana');
        const testDapp = new TestDapp(driver);

        await testDapp.openTestDappPage();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

        const requestPermissionsWithEthAccount2 =
          getRequestPermissionsRequestObject([EVM_ADDRESS_TWO]);

        await driver.executeScript(
          `window.ethereum.request(${requestPermissionsWithEthAccount2})`,
        );

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const connectAccountConfirmation = new ConnectAccountConfirmation(
          driver,
        );

        await connectAccountConfirmation.checkPageIsLoaded();

        // Both the existing Solana account and the requested EVM account should be pre-selected
        await connectAccountConfirmation.checkForAccountsInPermissionList([
          EVM_ACCOUNT_LABEL_ONE,
          EVM_ACCOUNT_LABEL_TWO,
        ]);

        await connectAccountConfirmation.confirmConnect();

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        const editConnectedAccountsPage =
          await getEditConnectedAccountsPageForHost(driver, DAPP_HOST_ADDRESS);

        await editConnectedAccountsPage.checkAccountsAreSelected([
          EVM_ACCOUNT_LABEL_ONE,
          EVM_ACCOUNT_LABEL_TWO,
        ]);

        await checkPermittedChainIds(driver, DEFAULT_PERMITTED_CAIP_CHAIN_IDS);
      },
    );
  });

  it('should be able to request specific chains when connecting through the EVM provider with existing permissions', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withPermissionControllerConnectedToTestDapp({
            scopes: SOLANA_PERMISSIONS,
          })
          .withEnabledNetworks({ eip155: { '0x1': true } })
          .build(),
        title: this.test?.fullTitle(),
        dappOptions: { numberOfTestDapps: 1 },
      },
      async ({ driver }) => {
        await login(driver);
        const testDapp = new TestDapp(driver);

        await testDapp.openTestDappPage();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await testDapp.checkPageIsLoaded();

        const requestSpecificNetwork = getRestrictedNetworks(['0x1']);

        await driver.executeScript(
          `window.ethereum.request(${requestSpecificNetwork})`,
        );

        const connectAccountConfirmation = new ConnectAccountConfirmation(
          driver,
        );

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await connectAccountConfirmation.checkPageIsLoaded();
        await connectAccountConfirmation.confirmConnect();

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );

        const editConnectedAccountsPage =
          await getEditConnectedAccountsPageForHost(driver, DAPP_HOST_ADDRESS);

        await editConnectedAccountsPage.checkAccountsAreSelected([
          EVM_ACCOUNT_LABEL_ONE,
        ]);

        await checkPermittedChainIds(driver, [
          toEvmCaipChainId(CHAIN_IDS.MAINNET),
          SolScope.Mainnet,
        ]);
      },
    );
  });
});
