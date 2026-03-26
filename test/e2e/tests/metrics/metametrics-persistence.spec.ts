import { strict as assert } from 'assert';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { getCleanAppState, withFixtures } from '../../helpers';
import { MOCK_META_METRICS_ID } from '../../constants';
import HomePage from '../../page-objects/pages/home/homepage';
import PrivacySettings from '../../page-objects/pages/settings/privacy-settings';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import { login } from '../../page-objects/flows/login.flow';

describe('MetaMetrics ID persistence', function () {
  it('MetaMetrics ID should persist when the user opts-out and then opts-in again of MetaMetrics collection', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2()
          .withMetaMetricsController({
            metaMetricsId: MOCK_META_METRICS_ID,
            participateInMetaMetrics: true,
          })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver);

        let uiState = await getCleanAppState(driver);

        assert.equal(uiState.metamask.metaMetricsId, MOCK_META_METRICS_ID);

        // goes to the privacy settings screen and toggle off participate in metaMetrics
        await new HomePage(driver).headerNavbar.openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.goToPrivacySettings();
        const privacySettings = new PrivacySettings(driver);
        await privacySettings.checkPageIsLoaded();
        await privacySettings.toggleParticipateInMetaMetrics({
          targetState: 'off',
        });

        // wait for state to update
        await driver.delay(500);

        uiState = await getCleanAppState(driver);

        assert.equal(
          uiState.metamask.metaMetricsId,
          MOCK_META_METRICS_ID,
          'Metametrics ID should be preserved when toggling off metametrics collection',
        );

        // toggle back on participate in metaMetrics
        await privacySettings.toggleParticipateInMetaMetrics();

        // wait for state to update
        await driver.delay(500);

        uiState = await getCleanAppState(driver);

        assert.equal(
          uiState.metamask.metaMetricsId,
          MOCK_META_METRICS_ID,
          'Metametrics ID should be preserved when toggling on metametrics collection',
        );
      },
    );
  });
});
