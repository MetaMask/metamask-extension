import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';

describe('State Persistence', function () {
  it('should persist state', async function () {
     await withFixtures(
      { fixtures: new FixtureBuilder().build() },
      async () => {
        // TODO
      },
    );
  });
});
