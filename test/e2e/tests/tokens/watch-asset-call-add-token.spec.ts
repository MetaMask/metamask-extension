import {
  DAPP_URL,
  LOCALHOST_NETWORK_CLIENT_ID,
  SECOND_NODE_NETWORK_CLIENT_ID,
  WINDOW_TITLES,
} from '../../constants';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import AddTokenConfirmation from '../../page-objects/pages/confirmations/add-token-confirmations';
import TokensTab from '../../page-objects/pages/home/tokens-tab';
import TestDapp from '../../page-objects/pages/test-dapp';
import { login } from '../../page-objects/flows/login.flow';

describe('Add token using wallet_watchAsset', function () {
  const smartContract = SMART_CONTRACTS.HST;

  it('opens a notification that adds a token when wallet_watchAsset is executed, then approves', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        smartContract,
        title: this.test?.fullTitle(),
      },
      async ({ driver, localNodes, contractRegistry }) => {
        const contractAddress =
          await contractRegistry.getContractAddress(smartContract);
        await login(driver, { localNode: localNodes[0] });
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();

        await testDapp.requestWatchErc20Asset({
          address: contractAddress,
          decimals: 4,
          symbol: 'TST',
        });
        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        const addTokenConfirmation = new AddTokenConfirmation(driver);
        await addTokenConfirmation.checkPageIsLoaded();
        await addTokenConfirmation.confirmAddToken();

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await new TokensTab(driver).checkTokenAmountIsDisplayed('0 TST');
      },
    );
  });

  it('opens a notification that adds a token when wallet_watchAsset is executed, then rejects', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        smartContract,
        title: this.test?.fullTitle(),
      },
      async ({ driver, localNodes, contractRegistry }) => {
        const contractAddress =
          await contractRegistry.getContractAddress(smartContract);
        await login(driver, { localNode: localNodes[0] });
        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();

        await testDapp.requestWatchErc20Asset({
          address: contractAddress,
          decimals: 4,
          symbol: 'TST',
        });

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const addTokenConfirmation = new AddTokenConfirmation(driver);
        await addTokenConfirmation.checkPageIsLoaded();
        await addTokenConfirmation.rejectAddToken();

        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await new TokensTab(driver).checkTokenItemNumber(1);
      },
    );
  });

  it.only('shows the balance from the network the dapp requested the token on', async function () {
    await withFixtures(
      {
        dappOptions: { numberOfTestDapps: 1 },
        fixtures: new FixtureBuilderV2()
          .withNetworkControllerDoubleNode()
          // The wallet is on the second node (0x53a), where the token contract
          // does not exist, ...
          .withNetworkController({
            selectedNetworkClientId: SECOND_NODE_NETWORK_CLIENT_ID,
          })
          .withEnabledNetworks({ eip155: { '0x539': true, '0x53a': true } })
          // ... while the dapp stays on the first node (0x539), where the token
          // is deployed and the account holds a balance.
          .withPermissionControllerConnectedToTestDapp()
          .withSelectedNetworkController({
            domains: { [DAPP_URL]: LOCALHOST_NETWORK_CLIENT_ID },
          })
          .build(),
        localNodeOptions: [
          { type: 'anvil' },
          { type: 'anvil', options: { port: 8546, chainId: 1338 } },
        ],
        smartContract,
        title: this.test?.fullTitle(),
      },
      async ({ driver, contractRegistry }) => {
        const contractAddress =
          await contractRegistry.getContractAddress(smartContract);
        await login(driver, { validateBalance: false });

        const testDapp = new TestDapp(driver);
        await testDapp.openTestDappPage();
        await testDapp.checkPageIsLoaded();
        await testDapp.requestWatchErc20Asset({
          address: contractAddress,
          decimals: 4,
          symbol: 'TST',
        });

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        const addTokenConfirmation = new AddTokenConfirmation(driver);
        await addTokenConfirmation.checkPageIsLoaded();
        await addTokenConfirmation.checkSuggestedTokenBalanceIsDisplayed(
          '10 TST',
        );
      },
    );
  });
});
