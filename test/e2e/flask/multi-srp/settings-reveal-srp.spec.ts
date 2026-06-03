import { Suite } from 'mocha';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { E2E_SRP as FIRST_TEST_E2E_SRP } from '../../constants';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import {
  importAdditionalSecretRecoveryPhrase,
  SECOND_TEST_E2E_SRP,
  verifySrp,
} from '../../page-objects/flows/multi-srp.flow';
import { mockActiveNetworks } from './common-multi-srp';

describe('Multi SRP - Reveal Imported SRP', function (this: Suite) {
  const firstSrpIndex = 1;
  const secondSrpIndex = 2;

  it('successfully exports the default SRP', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockActiveNetworks,
      },
      async ({ driver }) => {
        await login(driver);
        await importAdditionalSecretRecoveryPhrase(driver);
        await verifySrp(driver, FIRST_TEST_E2E_SRP, firstSrpIndex);
      },
    );
  });

  it('successfully exports the imported SRP', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockActiveNetworks,
      },
      async ({ driver }) => {
        await login(driver);
        await importAdditionalSecretRecoveryPhrase(driver);
        await verifySrp(driver, SECOND_TEST_E2E_SRP, secondSrpIndex);
      },
    );
  });
});
