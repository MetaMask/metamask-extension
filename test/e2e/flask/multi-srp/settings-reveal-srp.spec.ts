import { Suite } from 'mocha';
import { Driver } from '../../webdriver/driver';
import { E2E_SRP } from '../../constants';
import {
  mockActiveNetworks,
  SECOND_TEST_MNEMONIC,
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
        await verifySrp(driver, E2E_SRP, firstSrpIndex);
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
        await verifySrp(driver, SECOND_TEST_MNEMONIC, secondSrpIndex);
      },
    );
  });
});
