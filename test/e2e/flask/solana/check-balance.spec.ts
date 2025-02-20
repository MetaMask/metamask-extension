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
        await driver.refresh();
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
      },
      async (driver) => {
        await driver.refresh();
        const homePage = new NonEvmHomepage(driver);
        await homePage.check_getBalance(`USD`);
      },
    );
  });
  it.skip('For a non 0 balance account - USD balance', async function () {
    await withSolanaAccountSnap(
      {
        title: this.test?.fullTitle(),
        solanaSupportEnabled: true,
        showNativeTokenAsMainBalance: false,
        mockCalls: true,
      },
      async (driver) => {
        await driver.refresh();
        const homePage = new NonEvmHomepage(driver);
        await homePage.check_getBalance('$8,736.00 USD');
      },
    );
  });
});
