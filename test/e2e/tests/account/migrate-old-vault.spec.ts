import { Suite } from 'mocha';
import FixtureBuilder from '../../fixture-builder';
import { withFixtures } from '../../helpers';
import { MockedEndpoint } from '../../mock-e2e';
import { Driver } from '../../webdriver/driver';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import LoginPage from '../../page-objects/pages/login-page';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { seeAuthenticationRequest } from './mocks/authentication';

describe('Migrate vault with old encryption', function (this: Suite) {
  it('successfully unlocks an old vault, locks it, and unlocks again', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().withKeyringControllerOldVault().build(),
        testSpecificMock: seeAuthenticationRequest,
        title: this.test?.fullTitle(),
      },
      async ({
        driver,
        mockedEndpoint,
      }: {
        driver: Driver;
        mockedEndpoint: MockedEndpoint[];
      }) => {
        await loginWithBalanceValidation(driver);

        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.check_pageIsLoaded();
        await headerNavbar.lockMetaMaskWithAuthWait(mockedEndpoint);
        const loginPage = new LoginPage(driver);
        await loginPage.check_pageIsLoaded();
        await loginWithBalanceValidation(driver);
      },
    );
  });
});
