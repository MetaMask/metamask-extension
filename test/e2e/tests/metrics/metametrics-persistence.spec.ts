import { strict as assert } from 'assert';
import FixtureBuilder from '../../fixture-builder';
import { getCleanAppState, withFixtures } from '../../helpers';
import HomePage from '../../page-objects/pages/home/homepage';
import PrivacySettings from '../../page-objects/pages/settings/privacy-settings';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

describe('MetaMetrics ID persistence', function () {
  it('MetaMetrics ID should persist when the user opts-out and then opts-in again of MetaMetrics collection', async function () {
    const initialMetaMetricsId = 'test-metrics-id';

    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            metaMetricsId: initialMetaMetricsId,
            participateInMetaMetrics: true,
          })
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);

        let uiState = await getCleanAppState(driver);

        assert.equal(uiState.metamask.metaMetricsId, initialMetaMetricsId);

        // goes to the privacy settings screen and toggle off participate in metaMetrics
        await new HomePage(driver).headerNavbar.openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.check_pageIsLoaded();
        await settingsPage.goToPrivacySettings();
        const privacySettings = new PrivacySettings(driver);
        await privacySettings.check_pageIsLoaded();
        await privacySettings.toggleParticipateInMetaMetrics();

        // wait for state to update
        await driver.delay(500);

        uiState = await getCleanAppState(driver);

        assert.equal(
          uiState.metamask.metaMetricsId,
          initialMetaMetricsId,
          'Metametrics ID should be preserved when toggling off metametrics collection',
        );

        // toggle back on participate in metaMetrics
        await privacySettings.toggleParticipateInMetaMetrics();

        // wait for state to update
        await driver.delay(500);

        uiState = await getCleanAppState(driver);

        assert.equal(
          uiState.metamask.metaMetricsId,
          initialMetaMetricsId,
          'Metametrics ID should be preserved when toggling on metametrics collection',
        );
      },
    );
  });
});
