import { Suite } from 'mocha';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import { switchToNetworkFromNetworkSelect } from '../../page-objects/flows/network.flow';
import { buildSolanaTestSpecificMock } from './common-solana';

const SOL_ACCOUNT_ID = '688e01b8-3134-4ef4-80e6-8772bab38ef7';
const SOL_CAIP_ASSET = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501';
const SOL_SPOT_PRICE = 112.87;

describe('Check balance', function (this: Suite) {
  this.timeout(300000);
  it('Just created Solana account shows 0 SOL when native token is enabled', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: buildSolanaTestSpecificMock({ balance: 0 }),
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new NonEvmHomepage(driver);
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Solana');
        await homePage.checkPageIsLoaded({ amount: '0 SOL' });
      },
    );
  });
  it('Just created Solana account shows 0 USD when native token is not enabled', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withShowNativeTokenAsMainBalanceDisabled()
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: buildSolanaTestSpecificMock({ balance: 0 }),
      },
      async ({ driver }) => {
        await login(driver, { validateBalance: false });
        const homePage = new NonEvmHomepage(driver);
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Solana');
        await homePage.checkPageIsLoaded({ amount: '$0' });
      },
    );
  });
  it('For a non 0 balance account - USD balance', async function () {
    const fixture = new FixtureBuilderV2()
      .withShowNativeTokenAsMainBalanceDisabled()
      .withAssetsController({
        assetsBalance: {
          [SOL_ACCOUNT_ID]: {
            [SOL_CAIP_ASSET]: { amount: '50' },
          },
        },
        assetsPrice: {
          [SOL_CAIP_ASSET]: {
            assetPriceType: 'fungible' as const,
            id: 'solana',
            lastUpdated: 0,
            price: SOL_SPOT_PRICE,
            usdPrice: SOL_SPOT_PRICE,
          },
        },
      })
      .build();

    await withFixtures(
      {
        fixtures: fixture,
        title: this.test?.fullTitle(),
        testSpecificMock: buildSolanaTestSpecificMock(),
      },
      async ({ driver }) => {
        await login(driver, { validateBalance: false });
        const homePage = new NonEvmHomepage(driver);
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Solana');
        await homePage.checkPageIsLoaded({ amount: '$5,643.50' });
      },
    );
  });
  it('For a non 0 balance account - SOL balance', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: buildSolanaTestSpecificMock(),
      },
      async ({ driver }) => {
        await login(driver);
        const homePage = new NonEvmHomepage(driver);
        await switchToNetworkFromNetworkSelect(driver, 'Popular', 'Solana');
        await homePage.checkPageIsLoaded({ amount: '50 SOL' });
      },
    );
  });
});
