import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import {
  withSolanaAccountSnap,
} from './common-solana';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';


describe('Check balance', function (this: Suite) {
  this.timeout(300000);
  it.only('Just created Solana account shows 0 SOL when native token is enabled', async function () {
    await withSolanaAccountSnap(
      { title: this.test?.fullTitle(), showNativeTokenAsMainBalance: true },
      async (driver) => {
        await driver.refresh();
        const homePage = new NonEvmHomepage(driver);
        const balanceText = await homePage.getBalance();
        assert.equal(balanceText, '0 SOL');
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
        const balanceText = await homePage.getBalance();
        assert.equal(balanceText, '0.00\nUSD');
      },
    );
  });
  it('For a non 0 balance account - SOL balance', async function () {
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
        const balanceText = await homePage.getBalance();
        assert.equal(balanceText, `50\nSOL`);
      },
    );
  });
  it('For a non 0 balance account - USD balance', async function () {
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
        const balanceText = await homePage.getBalance();
        assert.equal(balanceText, `11294\nUSD`);
      },
    );
  });
});
