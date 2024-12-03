import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { getCleanAppState, withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { TestSuiteArguments } from '../confirmations/transactions/shared';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { MOCK_REMOTE_FEATURE_FLAGS_RESPONSE } from './mock-data';

describe('Remote feature flag', function (this: Suite) {
  it('should be fetched when basic functionality toggle is on', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: TestSuiteArguments) => {
        await loginWithBalanceValidation(driver);
        const uiState = await getCleanAppState(driver);
        assert.deepStrictEqual(
          uiState.metamask.remoteFeatureFlags,
          MOCK_REMOTE_FEATURE_FLAGS_RESPONSE,
        );
      },
    );
  });

  it('should not be fetched when basic functionality toggle is off', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withUseBasicFunctionalityDisabled()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: TestSuiteArguments) => {
        await loginWithBalanceValidation(driver);
        const uiState = await getCleanAppState(driver);
        assert.deepStrictEqual(uiState.metamask.remoteFeatureFlags, {});
      },
    );
  });
});
