import { WALLET_PASSWORD } from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { withFixtures } from '../../helpers';
import { importPrivateKeyAccount } from '../../page-objects/flows/add-account.flow';
import { login } from '../../page-objects/flows/login.flow';
import { completeQrSyncFlow } from '../../page-objects/flows/qr-sync.flow';
import { Driver } from '../../webdriver/driver';

const TEST_PRIVATE_KEY =
  '14abe6f4aab7f9f626fe981c864d0adeb5685f289ac9270c27b8fd790b4235d6';

describe('QrSync', function () {
  it('syncs a single HD wallet to mobile', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { password: WALLET_PASSWORD });
        await completeQrSyncFlow({
          driver,
          expectedWalletCount: 1,
          expectedImportedAccountCount: 0,
        });
      },
    );
  });

  it('syncs one HD wallet and one imported account to mobile', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { password: WALLET_PASSWORD });
        await importPrivateKeyAccount(driver, TEST_PRIVATE_KEY);
        await completeQrSyncFlow({
          driver,
          expectedWalletCount: 1,
          expectedImportedAccountCount: 1,
        });
      },
    );
  });

  // Exercises private-key import under multi-SRP load before QR sync. Keep this
  // case in CI (do not skip) — import confirm can take longer than the default
  // 3s staleness wait when Solana/account-tree work is busy.
  it('syncs two HD wallets and one imported account to mobile', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withKeyringControllerMultiSRP()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, {
          password: WALLET_PASSWORD,
          validateBalance: false,
        });
        await importPrivateKeyAccount(driver, TEST_PRIVATE_KEY, {
          accountListTimeout: 30000,
        });
        await completeQrSyncFlow({
          driver,
          expectedWalletCount: 2,
          expectedImportedAccountCount: 1,
        });
      },
    );
  });
});
