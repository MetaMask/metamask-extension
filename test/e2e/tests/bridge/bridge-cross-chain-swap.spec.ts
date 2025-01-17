const { strict: assert } = require('assert');
import { ethers } from 'ethers';
import { Suite } from 'mocha';
import { unlockWallet, withFixtures } from '../../helpers';
import { BridgePage, getBridgeFixtures } from './bridge-test-utils';
import { DEFAULT_FEATURE_FLAGS_RESPONSE } from './constants';
import { Tenderly, addFundsToAccount } from '../../tenderly-network';
import AccountListPage from '../../page-objects/pages/account-list-page';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import BridgeQuotePage from '../../page-objects/pages/bridge/quote-page';

describe('Bridge tests @no-mmi', function (this: Suite) {
  it('Cross chain swap ETH from Ethereum to Linea', async function () {
    await withFixtures(
      getBridgeFixtures(this.test?.fullTitle(), {
        'extension-config': {
          ...DEFAULT_FEATURE_FLAGS_RESPONSE['extension-config'],
          support: true,
        },
      }),
      async ({ driver }) => {
        await await unlockWallet(driver);

        const wallet = ethers.Wallet.createRandom();
        const response = await addFundsToAccount(
          Tenderly.Mainnet.url,
          wallet.address,
        );
        assert.equal(response.error, undefined);

        await importAccount(driver, wallet.privateKey);

        // Navigate to Bridge page
        const homePage = new HomePage(driver);
        await homePage.startBridgeFlow();

        const bridgePage = new BridgeQuotePage(driver);
        await bridgePage.enterBridgeQuote('.3', 'ETH', 'Ethereum', 'Linea');

        // TODO
        // Submit bridge button missing
        await driver.clickElement({
          text: 'Submit',
          tag: 'button',
        });

        // TODO: move this to activity object page
        // Go and check activity
        const activity = await driver.findElement(
          '[data-testid="activity-list-item-action"]',
        );
        assert.equal(await activity.getText(), 'Bridge to Linea Mainnet');

        const primaryCurrency = await driver.findElement(
          '[data-testid="transaction-list-item-primary-currency"]',
        );
        assert.equal(await primaryCurrency.getText(), '-1 ETH');

        await driver.clickElement('[data-testid="activity-list-item-action"]');
      },
    );
  });

  async function importAccount(driver: any, privateKey: any) {
    const headerNavbar = new HeaderNavbar(driver);
    await headerNavbar.openAccountMenu();

    const accountListPage = new AccountListPage(driver);
    await accountListPage.check_pageIsLoaded();

    // Import private key
    await accountListPage.addNewImportedAccount(privateKey);

    // Wallet should contain 1 ETH
    const assetListPage = new AssetListPage(driver);
    await assetListPage.check_tokenAmountIsDisplayed('1 ETH');
  }
});
