import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import Homepage from '../../page-objects/pages/home/homepage';
import PermissionListPage from '../../page-objects/pages/permission/permission-list-page';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';

describe('Permissions Page Navigation', function () {
  it('should navigate to gator-permissions route when back button is clicked and Gator Permissions feature is enabled', async function () {
    const originalValue = process.env.GATOR_PERMISSIONS_ENABLED;
    process.env.GATOR_PERMISSIONS_ENABLED = 'true';

    try {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          title: this.test?.fullTitle(),
        },
        async ({ driver }) => {
          await loginWithoutBalanceValidation(driver);

          const homepage = new Homepage(driver);
          await homepage.checkPageIsLoaded();
          const headerNavbar = new HeaderNavbar(driver);
          await headerNavbar.openPermissionsPage();

          const permissionListPage = new PermissionListPage(driver);
          await permissionListPage.checkPageIsLoaded();

          await permissionListPage.clickBackButton();

          await driver.waitForUrl({
            url: '/gator-permissions',
          });
        },
      );
    } finally {
      if (originalValue === undefined) {
        delete process.env.GATOR_PERMISSIONS_ENABLED;
      } else {
        process.env.GATOR_PERMISSIONS_ENABLED = originalValue;
      }
    }
  });

  it('should navigate to home route when back button is clicked and Gator Permissions feature is disabled', async function () {
    const originalValue = process.env.GATOR_PERMISSIONS_ENABLED;
    process.env.GATOR_PERMISSIONS_ENABLED = 'false';

    try {
      await withFixtures(
        {
          dapp: true,
          fixtures: new FixtureBuilder()
            .withPermissionControllerConnectedToTestDapp()
            .build(),
          title: this.test?.fullTitle(),
        },
        async ({ driver }) => {
          await loginWithoutBalanceValidation(driver);

          const homepage = new Homepage(driver);
          await homepage.checkPageIsLoaded();
          const headerNavbar = new HeaderNavbar(driver);
          await headerNavbar.openPermissionsPage();

          const permissionListPage = new PermissionListPage(driver);
          await permissionListPage.checkPageIsLoaded();

          await permissionListPage.clickBackButton();

          await driver.waitForUrl({
            url: '/',
          });
        },
      );
    } finally {
      if (originalValue === undefined) {
        delete process.env.GATOR_PERMISSIONS_ENABLED;
      } else {
        process.env.GATOR_PERMISSIONS_ENABLED = originalValue;
      }
    }
  });
});
