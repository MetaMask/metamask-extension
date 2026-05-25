import { Suite } from 'mocha';
import { sleep } from '@metamask/test-bundler/dist/utils';

import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import NonEvmHomepage from '../../page-objects/pages/home/non-evm-homepage';
import { selectTronNetwork } from '../../page-objects/flows/tron-network.flow';

import { TRON_PORTFOLIO_ACCOUNT } from './fixtures/environments';
import { withTronFixtures } from './fixtures/with-tron-fixtures';

describe('Tron Manual Testing', function (this: Suite) {
  this.timeout(60_000_000);

  /**
   * This leverages existing Tron E2E framework, which already starts a Tron node
   * And starts automated tests on a modified environment:
   * - Isolated Chrome instance.
   * - Tron requests redirected to our local node (instead of hitting prod).
   * The "test" is designed to enter the password, select Tron and wait for 60 mins.
   */
  it('waits 60 min for manual user testing', async function () {
    await withTronFixtures(
      {
        accounts: [TRON_PORTFOLIO_ACCOUNT],
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        await selectTronNetwork(driver);

        const home = new NonEvmHomepage(driver);
        await home.checkPageIsLoaded();
        console.info('================= INFO =================');
        console.info('== Waiting during user manual testing ==');
        console.info('========================================');
        await sleep(60_000_000);
        console.info('User manual testing session ended.');
      },
    );
  });
});
