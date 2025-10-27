import { withFixtures } from '../../helpers';
import { loginWithoutBalanceValidation } from '../../page-objects/flows/login.flow';
import FixtureBuilder from '../../fixture-builder';
import HeaderNavbar from '../../page-objects/pages/header-navbar';

describe('Debugging', function () {
  it('should log in and find the solana account list of addresses', async function () {
    await withFixtures(
      {
        forceBip44Version: 2,
        title: this.test?.fullTitle(),
        fixtures: new FixtureBuilder().withEnabledNetworks({
          eip155: {
            '0x539': true,
          },
          solana: {
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': false,
          },
        })
        .build(),
      },
      async ({ driver }) => {
        await loginWithoutBalanceValidation(driver);
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.clickNetworkAddresses();
        await driver.delay(120000)
      }
    );
  });
});
