import { Suite } from 'mocha';
import { strict as assert } from 'assert';
import HeaderNavbar from '../../page-objects/pages/header-navbar';import { LAMPORTS_PER_SOL, SOL_BALANCE, SOL_TO_USD_RATE, USD_BALANCE, withSolanaAccountSnap } from './common-solana';
import BitcoinHomepage from '../../page-objects/pages/home/bitcoin-homepage';


const EXPECTED_MAINNET_BALANCE_USD = `$${USD_BALANCE}`;

describe('Check tbalance', function (this: Suite) {
  this.timeout(120000)
  it('Just created Solana account shows 0 SOL when native token is enabled', async function () {
    await withSolanaAccountSnap(
      { title: this.test?.fullTitle(), showNativeTokenAsMainBalance: true},
      async (driver) => {
        await driver.refresh()
        const homePage = new BitcoinHomepage(driver)
        const balanceText = await homePage.getBalanceText()
        assert.equal(balanceText, "0\nSOL");    },
    );
  });
  it('Just created Solana account shows 0 USD when native token is not enabled', async function () {
    await withSolanaAccountSnap(
      { title: this.test?.fullTitle(), solanaSupportEnabled: true, showNativeTokenAsMainBalance: false},
      async (driver) => {
        await driver.refresh()
        const homePage = new BitcoinHomepage(driver)
        const balanceText = await homePage.getBalanceText()
        assert.equal(balanceText, "0.00\nUSD");    },
    );
  });
  it('For a non 0 balance account - SOL balance', async function () {
    await withSolanaAccountSnap(
      { title: this.test?.fullTitle(), solanaSupportEnabled: true, showNativeTokenAsMainBalance: true, mockCalls: true},
      async (driver) => {
        await driver.refresh()
        const homePage = new BitcoinHomepage(driver)
        const balanceText = await homePage.getBalanceText()
        assert.equal(balanceText, `${SOL_BALANCE/LAMPORTS_PER_SOL}\nSOL`);    },
    );
  });
  it('For a non 0 balance account - USD balance', async function () {
    await withSolanaAccountSnap(
      { title: this.test?.fullTitle(), solanaSupportEnabled: true, showNativeTokenAsMainBalance: false, mockCalls: true},
      async (driver) => {
        await driver.refresh()
        const homePage = new BitcoinHomepage(driver)
        const balanceText = await homePage.getBalanceText()
        assert.equal(balanceText, `${(SOL_BALANCE/LAMPORTS_PER_SOL)*SOL_TO_USD_RATE}\nUSD`);    },
    );
  });
});
