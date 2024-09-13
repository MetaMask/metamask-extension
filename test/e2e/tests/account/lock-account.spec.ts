import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import {
  defaultGanacheOptions,
  withFixtures,
  unlockWallet,
  Fixtures,
} from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { AccountOptionsMenu } from '../../page-objects/account-options-menu';
import HomePage from '../../page-objects/home-page';

describe('Lock and unlock', function (this: Suite) {
  it('successfully unlocks after lock', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle() || '',
      },
      async ({ driver }: Fixtures) => {
        const accountOptionsMenu = new AccountOptionsMenu(driver);
        const homePage = new HomePage(driver);

        await unlockWallet(driver);

        await accountOptionsMenu.clickAccountOptionsMenuButton();
        const lockButton = await accountOptionsMenu.findLockButton();
        assert.equal(await lockButton.getText(), 'Lock MetaMask');
        await lockButton.click();
        await unlockWallet(driver);

        const walletBalance = await homePage.getPrimaryBalance();
        assert.equal(/^25\s*ETH$/u.test(walletBalance), true);
      },
    );
  });
});
