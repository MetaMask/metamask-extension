import { Suite } from 'mocha';
import { Key } from 'selenium-webdriver';
import { withFixtures, logInWithBalanceValidation } from '../../helpers';
import { Ganache } from '../../seeder/ganache';
import { Driver } from '../../webdriver/driver';
import GanacheContractAddressRegistry from '../../seeder/ganache-contract-address-registry';
import { BridgePage, getBridgeFixtures } from './bridge-test-utils';

const ETHEREUM_MAINNET = 'Ethereum Mainnet';
const ARBITRUM_ONE = 'Arbitrum One';
const TOKEN_ON_ETHEREUM_MAINNET = 'TST';
const TOKEN_ON_ARBITRUM_ONE = 'HST';
const USDC_TOKEN = 'USDC';

describe('Submit bridge transaction successfully @no-mmi', function (this: Suite) {
  it('after adding a new network', async function () {
    await withFixtures(
      getBridgeFixtures(
        this.test?.fullTitle(),
        {
          'extension-support': true,
        },
        false,
      ),
      async ({
        driver,
        ganacheServer,
        secondaryContractRegistry,
        contractRegistry,
      }: {
        driver: Driver;
        ganacheServer: Ganache;
        contractRegistry: GanacheContractAddressRegistry;
        secondaryContractRegistry: GanacheContractAddressRegistry[];
      }) => {
        const bridgePage = new BridgePage(driver);
        await logInWithBalanceValidation(driver, ganacheServer);

        // Add secondary network (arb)
        await bridgePage.addNetwork();

        // Import TST token to primary network
        await bridgePage.navigateToAssetPage(
          contractRegistry,
          TOKEN_ON_ETHEREUM_MAINNET,
        );
        await bridgePage.navigateToBridgePage('token-overview');
        await bridgePage.verifySwapPage(1);
        await bridgePage.verifySelectedInputs(
          ETHEREUM_MAINNET,
          TOKEN_ON_ETHEREUM_MAINNET,
        );

        // Switch to secondary network
        await bridgePage.selectNetwork('from', ARBITRUM_ONE);
        await bridgePage.reloadHome();

        // Import HST token to secondary network
        await bridgePage.navigateToAssetPage(
          secondaryContractRegistry[0],
          TOKEN_ON_ARBITRUM_ONE,
        );
        await bridgePage.navigateToBridgePage('token-overview');
        await bridgePage.verifySelectedInputs(
          ARBITRUM_ONE,
          TOKEN_ON_ARBITRUM_ONE,
        );

        // Change selected dest network and token
        await bridgePage.selectNetwork('to', ETHEREUM_MAINNET);
        await bridgePage.verifyDestTokenNotInList(TOKEN_ON_ETHEREUM_MAINNET);
        await bridgePage.selectToken(USDC_TOKEN);
        await bridgePage.verifySelectedInputs(
          ARBITRUM_ONE,
          TOKEN_ON_ARBITRUM_ONE,
          '',
          ETHEREUM_MAINNET,
          USDC_TOKEN,
        );

        // Change src token amount
        await bridgePage.changeTokenAmount([
          '5',
          '0',
          '0',
          Key.BACK_SPACE,
          Key.BACK_SPACE,
          '0',
        ]);
        await bridgePage.verifySelectedInputs(
          ARBITRUM_ONE,
          TOKEN_ON_ARBITRUM_ONE,
          '50',
          ETHEREUM_MAINNET,
          USDC_TOKEN,
        );

        // TODO verify quote display, verify tracking
      },
    );
  });
  // TODO add a separate test for tx submission with preloaded fixtures for faster iterations
});
