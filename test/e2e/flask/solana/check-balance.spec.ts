import { Suite } from 'mocha';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import { withSolanaAccountSnap } from './common-solana';

describe('Check balance', function (this: Suite) {
  this.timeout(300000);
  it('Just created Solana account shows 50 SOL when native token is enabled', async function () {
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        solanaSupportEnabled: true,
        showNativeTokenAsMainBalance: true,
        mockCalls: true,
      },
      async (driver) => {
        const homePage = new NonEvmHomepage(driver);
        await homePage.check_getBalance('50 SOL');
      },
    );
  });
  it('Just created Solana account shows 0 USD when native token is not enabled', async function () {
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        solanaSupportEnabled: true,
        showNativeTokenAsMainBalance: false,
        mockZeroBalance: true,
      },
      async (driver) => {
        const homePage = new NonEvmHomepage(driver);
        await homePage.check_getBalance(`$0.00 USD`);
      },
    );
  });
  it.skip('For a non 0 balance account - USD balance', async function () {
    // skipped due to https://consensyssoftware.atlassian.net/browse/SOL-173
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        solanaSupportEnabled: true,
        showNativeTokenAsMainBalance: false,
        mockCalls: true,
      },
      async (driver) => {
        const homePage = new NonEvmHomepage(driver);
        await homePage.check_getBalance('$8,736.00 USD');
      },
    );
  });
});
