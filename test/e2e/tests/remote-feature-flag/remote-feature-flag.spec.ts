import { strict as assert } from 'assert';
import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { getCleanAppState, withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
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

  it('should persist the walletFrameworkRpcFailoverEnabled flag across restarts', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            metaMetricsId: MOCK_META_METRICS_ID,
            participateInMetaMetrics: true,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: async (mockServer: Mockttp) => {
          return [
            await mockServer
              .forGet('https://client-config.api.cx.metamask.io/v1/config')
              .thenCallback(() => {
                return {
                  statusCode: 200,
                  json: {
                    walletFrameworkRpcFailoverEnabled: true,
                  },
                };
              }),
          ];
        },
      },
      async ({ driver }: TestSuiteArguments) => {
        // First run: login and check state
        await loginWithBalanceValidation(driver);
        const appState1 = await getCleanAppState(driver);
        assert.equal(
          appState1.metamask.networkController.rpcFailover,
          true,
          'RPC failover should be enabled after first run',
        );

        // Reload the extension
        await driver.executeAsyncScript(
          'browser.runtime.reload(); arguments[arguments.length - 1]();',
        );

        // After reload, navigate back to the home page to log in again
        await driver.navigate();

        // The mock is gone, so the state must come from persistence
        await loginWithBalanceValidation(driver);

        const appState2 = await getCleanAppState(driver);
        assert.equal(
          appState2.metamask.networkController.rpcFailover,
          true,
          'RPC failover should remain enabled after restart',
        );
      },
    );
  });
});
