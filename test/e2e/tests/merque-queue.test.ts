import { Suite } from 'mocha';
import { defaultGanacheOptions, withFixtures } from '../helpers';
import { Driver } from '../webdriver/driver';
import FixtureBuilder from '../fixture-builder';

// This spec is created just for the purposes of testing the merge queue
// We are doing a live request, and once the PR is in the merge queue,
// we change the live site to make the test fail
describe('Merge Queue', function (this: Suite) {
  it('merge queue test kicked out', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await driver.openNewPage('https://seaona.github.io/blog/');
        await driver.waitForSelector({
          text: 'Hacking in the Ethereum Dark Forest',
          tag: 'a',
        })
      },
    );
  });
});
