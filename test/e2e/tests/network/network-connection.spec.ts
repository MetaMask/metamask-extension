import { Suite } from 'mocha';
import { Hex } from '@metamask/utils';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import {
  DEFAULT_FIXTURE_ACCOUNT,
  NETWORK_CLIENT_ID,
  WINDOW_TITLES,
} from '../../constants';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import TestDapp from '../../page-objects/pages/test-dapp';
import TokensTab from '../../page-objects/pages/home/tokens-tab';
import ConfirmAlertModal from '../../page-objects/pages/dialog/confirm-alert';
import { WALLET_ADDRESS } from '../confirmations/signatures/signature-helpers';
import { Driver } from '../../webdriver/driver';
import { CHAIN_IDS } from '../../../../shared/constants/network';

// Network configuration type
type NetworkConfig = {
  name: string;
  tokenSymbol: string;
  fixtureMethod: (builder: FixtureBuilderV2) => FixtureBuilderV2;
  testTitle: string;
  chainId: Hex;
};

/** Default Anvil account balance (25 ETH) in wei. */
const ANVIL_DEFAULT_BALANCE = '0x15af1d78b58c40000';

// Network configurations
const networkConfigs: NetworkConfig[] = [
  {
    name: 'Monad Testnet',
    tokenSymbol: 'MON',
    fixtureMethod: (builder) =>
      builder.withSelectedNetwork(NETWORK_CLIENT_ID.MONAD_TESTNET),
    testTitle: 'Monad Network Connection Tests',
    chainId: CHAIN_IDS.MONAD_TESTNET,
  },
  {
    name: 'MegaETH Testnet',
    tokenSymbol: 'MegaETH',
    fixtureMethod: (builder) =>
      builder.withSelectedNetwork(NETWORK_CLIENT_ID.MEGAETH_TESTNET_V2),
    testTitle: 'MegaETH Network Connection Tests',
    chainId: CHAIN_IDS.MEGAETH_TESTNET_V2,
  },
  {
    name: 'Sei',
    tokenSymbol: 'SEI',
    fixtureMethod: (builder) => builder.withNetworkControllerOnSei(),
    testTitle: 'Sei Network Connection Tests',
    chainId: CHAIN_IDS.SEI,
  },
];

// Helper function to perform Dapp action and verify
const performDappActionAndVerify = async (
  driver: Driver,
  action: () => Promise<void>,
  networkName: string,
) => {
  await action();
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
  await driver.delay(500);
  const confirmAlertModal = new ConfirmAlertModal(driver);
  await confirmAlertModal.verifyNetworkDisplay(networkName);
};

// Generate test cases for each network
networkConfigs.forEach((config) => {
  describe(config.testTitle, function (this: Suite) {
    it(`should connect dapp to ${config.name} and verify ${config.tokenSymbol} network and tokens`, async function () {
      await withFixtures(
        {
          dappOptions: { numberOfTestDapps: 1 },
          fixtures: config
            .fixtureMethod(new FixtureBuilderV2())
            .withPermissionControllerConnectedToTestDapp({
              chainIds: [parseInt(config.chainId, 16)],
            })
            .withEnabledNetworks({
              eip155: {
                [config.chainId]: true,
              },
            })
            .withAccountTracker({
              accountsByChainId: {
                [config.chainId]: {
                  [DEFAULT_FIXTURE_ACCOUNT]: {
                    balance: ANVIL_DEFAULT_BALANCE,
                    stakedBalance: '0x0',
                  },
                },
              },
            })
            .build(),
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
          // TODO: Investigate why the balance intermittently fails to load on Monad
          // Testnet in CI and re-enable balance validation once the root cause is found.
          await login(driver, { validateBalance: false });

          const tokensTab = new TokensTab(driver);
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );

          // Verify token is displayed
          await tokensTab.checkTokenExistsInList(config.tokenSymbol);

          // Open the test dapp and verify balance
          const testDapp = new TestDapp(driver);
          await testDapp.openTestDappPage();
          await testDapp.checkPageIsLoaded();
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

          // Verify dapp can access the account
          await testDapp.checkGetAccountsResult(WALLET_ADDRESS.toLowerCase());

          // Test various Dapp functionalities
          await performDappActionAndVerify(
            driver,
            () => testDapp.clickSimpleSendButton(),
            config.name,
          );
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

          await performDappActionAndVerify(
            driver,
            () => testDapp.clickCreateToken(),
            config.name,
          );
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

          await performDappActionAndVerify(
            driver,
            () => testDapp.clickERC721DeployButton(),
            config.name,
          );
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

          await performDappActionAndVerify(
            driver,
            () => testDapp.clickPersonalSign(),
            config.name,
          );
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

          await performDappActionAndVerify(
            driver,
            () => testDapp.clickSignTypedData(),
            config.name,
          );
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

          await performDappActionAndVerify(
            driver,
            () => testDapp.clickSignTypedDatav3(),
            config.name,
          );
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

          await performDappActionAndVerify(
            driver,
            () => testDapp.clickSignTypedDatav4(),
            config.name,
          );
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

          await performDappActionAndVerify(
            driver,
            () => testDapp.clickPermit(),
            config.name,
          );
          await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

          await performDappActionAndVerify(
            driver,
            () => testDapp.clickERC1155DeployButton(),
            config.name,
          );
        },
      );
    });
  });
});
