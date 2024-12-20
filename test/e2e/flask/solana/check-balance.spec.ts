import { Suite } from 'mocha';
import { strict as assert } from 'assert';
import HeaderNavbar from '../../page-objects/pages/header-navbar';import { SOL_BALANCE, USD_BALANCE, withSolanaAccountSnap } from './common-solana';

import SolanaHomepage from '../../page-objects/pages/home/solana-homepage';

const EXPECTED_MAINNET_BALANCE_USD = `$${USD_BALANCE}`;

describe('Check tbalance', function (this: Suite) {
  this.timeout(120000)
  it('Just created Solana account shows 0 SOL when native token is enabled', async function () {
    await withSolanaAccountSnap(
      { title: this.test?.fullTitle(),},
      async (driver) => {
        await driver.refresh()
        const homePage = new SolanaHomepage(driver)
        const balanceText = await homePage.getSolanaBalance()
        assert.equal(balanceText, "0 SOL");    },
    );
  });
  it.only('Just created Solana account shows 0 USD when native token is not enabled', async function () {
    await withSolanaAccountSnap(
      { title: this.test?.fullTitle(), solanaSupportEnabled: true, showNativeTokenAsMainBalance: false},
      async (driver) => {
        await driver.refresh()
        const homePage = new SolanaHomepage(driver)
        const balanceText = await homePage.getSolanaBalance()
        assert.equal(balanceText, "0 USD");    },
    );
  });
});
