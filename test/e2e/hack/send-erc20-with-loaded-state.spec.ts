import { withFixtures } from '../helpers';
import FixtureBuilder from '../fixture-builder';
import ActivityListPage from '../page-objects/pages/home/activity-list';
import AssetListPage from '../page-objects/pages/home/asset-list';
import HomePage from '../page-objects/pages/home/homepage';
import SendTokenPage from '../page-objects/pages/send/send-token-page';
import TokenOverviewPage from '../page-objects/pages/token-overview-page';
import TokenTransferTransactionConfirmation from '../page-objects/pages/confirmations/redesign/token-transfer-confirmation';
import { loginWithBalanceValidation } from '../page-objects/flows/login.flow';
import { buildQuote, checkActivityTransaction, reviewQuote, waitForTransactionToComplete } from '../tests/swaps/shared';

describe('Send ERC20', function () {
  it('should send DAI', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withTokensController({
            allTokens: {
              '0x1': {
                '0x5cfe73b6021e818b776b421b1c4db2474086a7e1': [
                  {
                    address: '0x6b175474e89094c44da98b954eedeac495271d0f',
                    symbol: 'DAI',
                    decimals: 18,
                    isERC721: false,
                    aggregators: [],
                  },
                ],
              },
            },
          })
          .build(),
        title: this.test?.fullTitle(),
        localNodeOptions: [
          {
            type: 'anvil',
            options: {
              balance: 25,
              blockTime: 2,
              chainId: 1337,
              gasLimit: 30000000,
              gasPrice: 2000000000,
            //  loadState: './test/e2e/seeder/network-states/with50Dai.json',
              // forkUrl: `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
              host: '127.0.0.1',
              mnemonic:
                'spread raise short crane omit tent fringe mandate neglect detail suspect cradle',
              port: 8545
            },
          },
        ],
      },
      async ({ driver, localNodes }) => {
        await loginWithBalanceValidation(driver, localNodes[0]);

        const homePage = new HomePage(driver);

        await homePage.check_pageIsLoaded();

        await buildQuote(driver, {
          amount: 2,
          swapTo: 'DAI',
        });

        await reviewQuote(driver, {
          amount: 2,
          swapFrom: 'TESTETH',
          swapTo: 'DAI',
          skipCounter: true,
        });

        await driver.waitForSelector({ text: 'Swap', tag: 'button' }, { state: 'enabled' });
        await driver.clickElement({ text: 'Swap', tag: 'button' });
        await waitForTransactionToComplete(driver, { tokenName: 'DAI' });
        await checkActivityTransaction(driver, {
          index: 0,
          amount: '4',
          swapFrom: 'TESTETH',
          swapTo: 'DAI',
        });
      },
    );
  });
});
