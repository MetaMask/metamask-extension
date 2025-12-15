import { Suite } from 'mocha';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import { withSolanaAccountSnap } from './common-solana';

describe('Check balance', function (this: Suite) {
  this.timeout(300000);
  it('Just created Solana account shows 0 SOL when native token is enabled', async function () {
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        showNativeTokenAsMainBalance: true,
        mockZeroBalance: true,
      },
      async (driver) => {
        const homePage = new NonEvmHomepage(driver);
        await homePage.checkPageIsLoaded({ amount: '0 SOL' });
      },
    );
  });
  it('Just created Solana account shows 0 USD when native token is not enabled', async function () {
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        mockZeroBalance: true,
        showNativeTokenAsMainBalance: false,
      },
      async (driver) => {
        const homePage = new NonEvmHomepage(driver);
        await homePage.checkPageIsLoaded({ amount: '$0' });
      },
    );
  });
  it('For a non 0 balance account - USD balance', async function () {
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        mockZeroBalance: false,
        showNativeTokenAsMainBalance: false,
      },
      async (driver) => {
        const homePage = new NonEvmHomepage(driver);
        await homePage.checkPageIsLoaded({ amount: '$5,643.50' });
      },
    );
  });
  it('For a non 0 balance account - SOL balance', async function () {
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        showNativeTokenAsMainBalance: true,
      },
      async (driver) => {
        const homePage = new NonEvmHomepage(driver);
        await homePage.checkPageIsLoaded({ amount: '50 SOL' });
      },
    );
  });
});
