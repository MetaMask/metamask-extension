import { Suite } from 'mocha';
import { E2E_SRP as FIRST_TEST_E2E_SRP } from '../../constants';
import { withFixtures } from '../../helpers';
import { login } from '../../page-objects/flows/login.flow';
import {
  importAdditionalSecretRecoveryPhrase,
  SECOND_TEST_E2E_SRP,
  verifySrp,
} from '../../page-objects/flows/multi-srp.flow';
import {
  buildZeroBalanceMultiSrpFixture,
  mockActiveNetworks,
  ZERO_UNIFIED_EVM_BALANCES,
} from './common-multi-srp';

describe('Multi SRP - Reveal Imported SRP', function (this: Suite) {
  const firstSrpIndex = 1;
  const secondSrpIndex = 2;

  it('successfully exports the default SRP', async function () {
    await withFixtures(
      {
        fixtures: buildZeroBalanceMultiSrpFixture(),
        unifiedEvmAccountsApiBalances: ZERO_UNIFIED_EVM_BALANCES,
        title: this.test?.fullTitle(),
        testSpecificMock: mockActiveNetworks,
      },
      async ({ driver }) => {
        await login(driver, { validateBalance: false });
        await importAdditionalSecretRecoveryPhrase(driver);
        await verifySrp(driver, FIRST_TEST_E2E_SRP, firstSrpIndex);
      },
    );
  });

  it('successfully exports the imported SRP', async function () {
    await withFixtures(
      {
        fixtures: buildZeroBalanceMultiSrpFixture(),
        unifiedEvmAccountsApiBalances: ZERO_UNIFIED_EVM_BALANCES,
        title: this.test?.fullTitle(),
        testSpecificMock: mockActiveNetworks,
      },
      async ({ driver }) => {
        await login(driver, { validateBalance: false });
        await importAdditionalSecretRecoveryPhrase(driver);
        await verifySrp(driver, SECOND_TEST_E2E_SRP, secondSrpIndex);
      },
    );
  });
});
