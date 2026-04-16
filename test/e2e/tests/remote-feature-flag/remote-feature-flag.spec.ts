import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { getCleanAppState, withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { TestSuiteArguments } from '../confirmations/transactions/shared';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import DevelopOptions from '../../page-objects/pages/developer-options-page';
import {
  MOCK_CUSTOMIZED_REMOTE_FEATURE_FLAGS,
  MOCK_META_METRICS_ID,
  MOCK_REMOTE_FEATURE_FLAGS_RESPONSE,
} from '../../constants';
import { Mockttp } from '../../mock-e2e';

const FEATURE_FLAGS_URL = 'https://client-config.api.cx.metamask.io/v1/flags';

async function mockRemoteFeatureFlags(mockServer: Mockttp) {
  return [
    await mockServer
      .forGet(FEATURE_FLAGS_URL)
      .withQuery({
        client: 'extension',
        distribution: 'main',
        environment: 'dev',
      })
      .thenCallback(() => ({
        statusCode: 200,
        json: [
          { feature1: true },
          { feature2: false },
          {
            feature3: [
              {
                value: 'valueA',
                name: 'groupA',
                scope: { type: 'threshold', value: 0.3 },
              },
              {
                value: 'valueB',
                name: 'groupB',
                scope: { type: 'threshold', value: 0.5 },
              },
              {
                scope: { type: 'threshold', value: 1 },
                value: 'valueC',
                name: 'groupC',
              },
            ],
          },
        ],
      })),
  ];
}

describe('Remote feature flag', function (this: Suite) {
  it('should be fetched with threshold value when basic functionality toggle is on', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            metaMetricsId: MOCK_META_METRICS_ID,
            participateInMetaMetrics: true,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockRemoteFeatureFlags,
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

  it('offers the option to pass into manifest file for developers along with original response', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            metaMetricsId: MOCK_META_METRICS_ID,
            participateInMetaMetrics: true,
          })
          .build(),
        manifestFlags: {
          remoteFeatureFlags: MOCK_CUSTOMIZED_REMOTE_FEATURE_FLAGS,
        },
        title: this.test?.fullTitle(),
        testSpecificMock: mockRemoteFeatureFlags,
      },
      async ({ driver }: TestSuiteArguments) => {
        await loginWithBalanceValidation(driver);
        const headerNavbar = new HeaderNavbar(driver);
        await headerNavbar.openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.goToDeveloperOptions();

        const developOptionsPage = new DevelopOptions(driver);
        await developOptionsPage.checkPageIsLoaded();
        await developOptionsPage.validateRemoteFeatureFlagState();
      },
    );
  });
});
