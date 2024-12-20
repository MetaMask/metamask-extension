import { Suite } from 'mocha';
import { strict as assert } from 'assert';
import HeaderNavbar from '../../page-objects/pages/header-navbar';import { SOL_BALANCE, USD_BALANCE, withSolanaAccountSnap } from './common-solana';

import SolanaHomepage from '../../page-objects/pages/home/solana-homepage';

const EXPECTED_MAINNET_BALANCE_USD = `$${USD_BALANCE}`;

describe('Switching between account from different networks', function (this: Suite) {
  this.timeout(120000)
  it.only('Switch from Solana account to another Network account', async function () {
    await withSolanaAccountSnap(
      { title: this.test?.fullTitle(),},
      async (driver) => {
        await driver.refresh()
        const homePage = new SolanaHomepage(driver)
        const balanceText = await homePage.getSolanaBalance()
        assert.equal(balanceText, "0 SOL");    },
    );
  });
});
