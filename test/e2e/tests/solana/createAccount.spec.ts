import {
  defaultGanacheOptions,
  openDapp,
  unlockWallet,
  withFixtures,
} from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { Driver } from '../../webdriver/driver';
import { Ganache } from '../../seeder/ganache';
import HomePage from '../../page-objects/pages/homepage';

describe('Create Solana Account @no-mmi', function () {
  it('Create a new solana account', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver; ganacheServer?: Ganache }) => {
        const homePage = new HomePage(driver);
        await unlockWallet(driver);
        await openDapp(driver);
      },
    );
  });
});
