const { strict: assert } = require('assert');
import { ethers } from 'ethers';
import { Suite } from 'mocha';
import { unlockWallet, withFixtures } from '../../helpers';
import { getBridgeFixtures } from './bridge-test-utils';
import { DEFAULT_FEATURE_FLAGS_RESPONSE } from './constants';
import { Tenderly, addFundsToAccount } from '../../tenderly-network';
import AccountListPage from '../../page-objects/pages/account-list-page';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import BridgeQuotePage, {
  BridgeQuote,
} from '../../page-objects/pages/bridge/quote-page';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import { sleep } from '@metamask/test-bundler/dist/utils';

describe('Bridge tests @no-mmi', function (this: Suite) {
  let txCount = 1;
  it('Execute various bridge transactions', async function () {
    await withFixtures(
      getBridgeFixtures(
        this.test?.fullTitle(),
        {
          'extension-config': {
            ...DEFAULT_FEATURE_FLAGS_RESPONSE['extension-config'],
            support: true,
          },
        },
        false,
      ),
      async ({ driver }) => {
        await await unlockWallet(driver);

        const wallet = ethers.Wallet.createRandom();
        const response = await addFundsToAccount(
          Tenderly.Mainnet.url,
          wallet.address,
        );
        assert.equal(response.error, undefined);

        await importAccount(driver, wallet.privateKey);

        await bridgeTransaction(driver, {
          amount: '.03',
          tokenFrom: 'ETH',
          tokenTo: 'ETH',
          fromChain: 'Ethereum',
          toChain: 'Linea',
        });
      },
    );
  });

  async function bridgeTransaction(driver: any, quote: BridgeQuote) {
    // Navigate to Bridge page
    const homePage = new HomePage(driver);
    await homePage.startBridgeFlow();

    const bridgePage = new BridgeQuotePage(driver);
    await bridgePage.enterBridgeQuote(quote);
    await bridgePage.submitQuote();

    // BUGBUG: Github issue 29793 has changed the flow, should land on activity
    await bridgePage.goBack();
    await homePage.goToActivityList();

    const activityList = new ActivityListPage(driver);
    await activityList.check_txAction(`Bridge to ${quote.toChain}`);
    await activityList.check_txAmountInActivity(
      `-0${quote.amount} ${quote.tokenFrom}`,
    );
    await activityList.check_completedBridgeTransactionActivity(txCount++);

    await sleep(500);
  }

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
