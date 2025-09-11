import { Suite } from 'mocha';
import { Hex } from '@metamask/utils';
import FixtureBuilder from '../../fixture-builder';
import { withFixtures, WINDOW_TITLES } from '../../helpers';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import TestDapp from '../../page-objects/pages/test-dapp';
import TokenList from '../../page-objects/pages/token-list';
import ConfirmAlertModal from '../../page-objects/pages/dialog/confirm-alert';
import { WALLET_ADDRESS } from '../confirmations/signatures/signature-helpers';
import { Driver } from '../../webdriver/driver';
import { CHAIN_IDS } from '../../../../shared/constants/network';

// Network configuration type
type NetworkConfig = {
  name: string;
  tokenSymbol: string;
  fixtureMethod: (builder: FixtureBuilder) => FixtureBuilder;
  testTitle: string;
  chainId: Hex;
};

// Network configurations
const networkConfigs: NetworkConfig[] = [
  {
    name: 'Monad Testnet',
    tokenSymbol: 'MON',
    fixtureMethod: (builder) => builder.withNetworkControllerOnMonad(),
    testTitle: 'Monad Network Connection Tests',
    chainId: CHAIN_IDS.MONAD_TESTNET,
  },
  {
    name: 'Mega Testnet',
    tokenSymbol: 'ETH',
    fixtureMethod: (builder) => builder.withNetworkControllerOnMegaETH(),
    testTitle: 'MegaETH Network Connection Tests',
    chainId: CHAIN_IDS.MEGAETH_TESTNET,
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
  const confirmAlertModal = new ConfirmAlertModal(driver);
  await confirmAlertModal.verifyNetworkDisplay(networkName);
};

// Generate test cases for each network
networkConfigs.forEach((config) => {
  describe(config.testTitle, function (this: Suite) {
    it(`should connect dapp to ${config.name} and verify ${config.tokenSymbol} network and tokens`, async function () {
      await withFixtures(
        {
          dapp: true,
          fixtures: config
            .fixtureMethod(new FixtureBuilder())
            .withPermissionControllerConnectedToTestDapp()
            .withEnabledNetworks({
              eip155: {
                [config.chainId]: true,
              },
            })
            .build(),
          title: this.test?.fullTitle(),
        },
        async ({ driver }: { driver: Driver }) => {
          await loginWithBalanceValidation(driver);

          const tokenList = new TokenList(driver);
          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );

          // Verify token is displayed
          await tokenList.checkTokenName(config.tokenSymbol);

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
