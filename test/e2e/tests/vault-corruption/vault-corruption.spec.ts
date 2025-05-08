import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';

describe('Vault Corruption', function () {
  it('reset metamask state when primary and backup are missing vault', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {},
    );
  });

  it('should restore the vault when primary is missing vault but it exists in the backup', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {},
    );
  });
});
