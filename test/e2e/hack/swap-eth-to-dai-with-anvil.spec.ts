import { MockttpServer } from 'mockttp';
import { withFixtures } from '../helpers';
import FixtureBuilder from '../fixture-builder';
import HomePage from '../page-objects/pages/home/homepage';
import { loginWithBalanceValidation } from '../page-objects/flows/login.flow';
import {
  buildQuote,
  checkActivityTransaction,
  reviewQuote,
  validation,
  waitForSmartTransactionToComplete,
  waitForTransactionToComplete,
} from '../tests/swaps/shared';
import { mockSmartTransactionRequests } from '../tests/smart-transactions/mocks';

async function mockAccountApi(mockServer: MockttpServer) {
  return [
    await mockServer
      .forGet(
        'https://accounts.api.cx.metamask.io/v2/accounts/0x5cfe73b6021e818b776b421b1c4db2474086a7e1/balances',
      )
      .withQuery({
        networks: '1,59144',
      })
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          count: 0,
          balances: [
            {
              object: 'token',
              address: '0x0000000000000000000000000000000000000000',
              symbol: 'ETH',
              name: 'Ether',
              type: 'native',
              timestamp: '2015-07-30T03:26:13.000Z',
              decimals: 18,
              chainId: 1,
              balance: '25',
            },
          ],
          unprocessedNetworks: [],
        },
      })),
  ];
}
const infuraUrl: string =
  'https://mainnet.infura.io/v3/00000000000000000000000000000000';

async function mockInfuraGetBalance(mockServer: MockttpServer) {
  await mockServer
    .forPost(infuraUrl)
    .withJsonBodyIncluding({ method: 'eth_getBalance' })
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        jsonrpc: '2.0',
        id: '1111111111111111',
        result: '0x15AF1D78B58C40000',
      },
    }));
}

async function mockSwapRequests(mockServer: MockttpServer) {
  await mockSmartTransactionRequests(mockServer, '0x15AF1D78B58C40000');
  await mockAccountApi(mockServer);
  await mockInfuraGetBalance(mockServer);
}

async function mockInfuraEstimateGas(mockServer: MockttpServer) {
  await mockServer
    .forPost(infuraUrl)
    .withJsonBodyIncluding({ method: 'eth_estimateGas' })
    .thenCallback(() => ({
      statusCode: 200,
      json: {
        code: -32000,
        message:
          'failed with 35929725 gas: insufficient funds for gas * price + value: address 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 have 5 want 1000000000000000000',
      },
    }));
}

const localNodeOptions = {
  type: 'anvil',
  options: {
    balance: 25,
    blockTime: 2,
    chainId: 1,
    gasLimit: 30000000,
    gasPrice: 2000000000,
    loadState: './test/e2e/seeder/network-states/with50Dai.json',
    // ...(process.env.INFURA_PROJECT_ID
    //   ? {
    //       forkUrl: `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
    //     }
    //   : {}),
    host: '127.0.0.1',
    mnemonic:
      'spread raise short crane omit tent fringe mandate neglect detail suspect cradle',
    port: 8545,
  },
};

const tokens = {
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
};

describe('Swap', function () {
  it('TESTETH to DAI MAINNET', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withTokensController(tokens)
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSwapRequests,
        localNodeOptions: [localNodeOptions],
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
          swapFrom: 'ETH',
          swapTo: 'DAI',
          skipCounter: true,
        });

        await driver.waitForSelector(
          { text: 'Swap', tag: 'button' },
          { state: 'enabled' },
        );
        await driver.clickElement({ text: 'Swap', tag: 'button' });
        await waitForSmartTransactionToComplete(driver, { tokenName: 'DAI' });
        await checkActivityTransaction(driver, {
          index: 0,
          amount: '2',
          swapFrom: 'ETH',
          swapTo: 'DAI',
        });
      },
    );
  });

  it('Validation - Insufficient balance', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withTokensController(tokens)
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockInfuraEstimateGas,
        localNodeOptions: [localNodeOptions],
      },
      async ({ driver, localNodes }) => {
        await loginWithBalanceValidation(driver, localNodes[0]);
        const homePage = new HomePage(driver);

        await homePage.check_pageIsLoaded();

        await buildQuote(driver, {
          amount: 100,
          swapTo: 'DAI',
        });

        // Add validation for insufficient balance
        await validation(driver, {
          messageTitle: 'Insufficient balance',
          messageText: 'You need 75 more ETH to complete this swap',
        });
      },
    );
  });

  it('ETH to inauthentic token', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withNetworkControllerOnMainnet()
          .withTokensController(tokens)
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSwapRequests,
        localNodeOptions: [localNodeOptions],
      },
      async ({ driver, localNodes }) => {
        await loginWithBalanceValidation(driver, localNodes[0]);
        const homePage = new HomePage(driver);

        await homePage.check_pageIsLoaded();

        await buildQuote(driver, {
          amount: 2,
          swapTo: 'INUINU',
        });

        await validation(driver, {
          messageTitle: 'Potentially inauthentic token',
          messageText:
            'INUINU is only verified on 1 source. Consider verifying it on Etherscan before proceeding.',
        });

        await driver.clickElement({ text: 'Continue swapping', tag: 'button' });

        await reviewQuote(driver, {
          amount: 2,
          swapFrom: 'ETH',
          swapTo: 'INUINU',
          skipCounter: true,
        });

        await driver.waitForSelector(
          { text: 'Swap', tag: 'button' },
          { state: 'enabled' },
        );
      },
    );
  });

  it('TESTETH to DAI TESTNET', async function () {
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
              // ...(process.env.INFURA_PROJECT_ID
              //   ? {
              //       forkUrl: `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
              //     }
              //   : {}),
              host: '127.0.0.1',
              mnemonic:
                'spread raise short crane omit tent fringe mandate neglect detail suspect cradle',
              port: 8545,
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

        await driver.waitForSelector(
          { text: 'Swap', tag: 'button' },
          { state: 'enabled' },
        );
        await driver.clickElement({ text: 'Swap', tag: 'button' });
        await waitForTransactionToComplete(driver, { tokenName: 'DAI' });
        await checkActivityTransaction(driver, {
          index: 0,
          amount: '2',
          swapFrom: 'TESTETH',
          swapTo: 'DAI',
        });
      },
    );
  });
});
