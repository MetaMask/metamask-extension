import { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import { completeQrSyncHappyPath } from '../../page-objects/flows/qr-sync.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import {
  buildQrSyncFixtures,
  QR_SYNC_E2E_PASSWORD,
} from './constants';

describe('QrSync', function () {
  this.timeout(120_000);

  it('syncs a single HD wallet to mobile (happy path)', async function () {
    await withFixtures(
      {
        fixtures: buildQrSyncFixtures(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await driver.delay(10_000);
        await login(driver, { password: QR_SYNC_E2E_PASSWORD });

        await completeQrSyncHappyPath(driver, {
          password: QR_SYNC_E2E_PASSWORD,
        });

        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
      },
    );
  });
});
