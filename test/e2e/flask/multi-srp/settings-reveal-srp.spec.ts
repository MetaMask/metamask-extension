import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import { E2E_SRP as FIRST_TEST_E2E_SRP } from '../../default-fixture';
import {
  mockActiveNetworks,
  SECOND_TEST_E2E_SRP,
  withMultiSrp,
  verifySrp,
} from './common-multi-srp';

describe('Multi SRP - Reveal Imported SRP', function (this: Suite) {
  const firstSrpIndex = 1;
  const secondSrpIndex = 2;

  it('successfully exports the default SRP', async function () {
    await withMultiSrp(
      {
        title: this.test?.fullTitle(),
        testSpecificMock: mockActiveNetworks,
      },
      async (driver: Driver) => {
        await verifySrp(driver, FIRST_TEST_E2E_SRP, firstSrpIndex);
      },
    );
  });

  it('successfully exports the imported SRP', async function () {
    await withMultiSrp(
      {
        title: this.test?.fullTitle(),
        testSpecificMock: mockActiveNetworks,
      },
      async (driver: Driver) => {
        await verifySrp(driver, SECOND_TEST_E2E_SRP, secondSrpIndex);
      },
    );
  });
});
