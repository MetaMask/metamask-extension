import { Suite } from 'mocha';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
import { Driver } from '../../../webdriver/driver';
import { setupTronAssetsHome } from '../../../page-objects/flows/tron-assets.flow';
import HomePage from '../../../page-objects/pages/home/homepage';
import {
  EMPTY_TRON_ACCOUNT,
  TRON_CHECK_BALANCE_ACCOUNT,
} from '../../tron/fixtures/environments';
import { withTronFixtures } from '../../tron/fixtures/with-tron-fixtures';

describe('Tron - Check balance', function (this: Suite) {
  this.timeout(180_000);

  it('displays zero TRX for a newly created Tron account', async function () {
    await withTronFixtures(
      {
        accounts: [EMPTY_TRON_ACCOUNT],
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await setupTronAssetsHome(driver);
        const homePage = new HomePage(driver);
        await homePage.navigateToHome('0 TRX');
      },
    );
  });

  it('displays the fiat balance for a funded Tron account', async function () {
    await withTronFixtures(
      {
        accounts: [TRON_CHECK_BALANCE_ACCOUNT],
        fixtures: new FixtureBuilderV2()
          .withShowNativeTokenAsMainBalanceDisabled()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await setupTronAssetsHome(driver, { expectedTrxAmount: '106.072' });

        // TRX_BALANCE = 106072392 SUN = ~106.07 TRX * $0.29469 = ~$31.26
        // Total Fiat = TRX $31.26, HTX DAO $5.30, USDT $2.80, USDD $0.29 = $39.65
        const homePage = new HomePage(driver);
        await homePage.navigateToHome('$39.65');
      },
    );
  });

  it('displays the native TRX balance for a funded Tron account', async function () {
    await withTronFixtures(
      {
        accounts: [TRON_CHECK_BALANCE_ACCOUNT],
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await setupTronAssetsHome(driver, { expectedTrxAmount: '106.072' });

        // TRX_BALANCE = 106072392 SUN = ~106.07 TRX
        const homePage = new HomePage(driver);
        await homePage.navigateToHome('106.072 TRX');
      },
    );
  });
});
