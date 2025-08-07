import { generateWalletState } from '../../../app/scripts/fixtures/generate-wallet-state';
import { withFixtures } from '../helpers';
import { loginWithBalanceValidation } from '../page-objects/flows/login.flow';
import { Driver } from '../webdriver/driver';

const withState = {
  withAccounts: 30,
  withConfirmedTransactions: 40,
  withContacts: 40,
  withErc20Tokens: true,
  withNetworks: true,
  withPreferences: true,
  withUnreadNotifications: 15,
};

describe('Power user persona', function () {
  it('loads and unlocks the wallet', async function () {
    await withFixtures(
      {
        title: this.test?.fullTitle(),
        fixtures: (await generateWalletState(withState, true)).build(),
        manifestFlags: {
          testing: { disableSync: true },
        },
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
      },
    );
  });
});
