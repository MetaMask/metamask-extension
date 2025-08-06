import { Suite } from 'mocha';
import semver from 'semver';
import type { Mockttp } from 'mockttp';
import { WINDOW_TITLES, withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import UpdateModal from '../../page-objects/pages/dialog/update-modal';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { version } from '../../../../package.json';

describe('Update modal', function (this: Suite) {
  it('should not be shown by default', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const updateModal = new UpdateModal(driver);
        await updateModal.checkPageIsNotPresent();
      },
    );
  });

  it('should be shown if an update is available on an outdated version', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withAppStateController({
            isUpdateAvailable: true,
          })
          .build(),
        title: this.test?.fullTitle(),
        manifestFlags: {
          remoteFeatureFlags: {
            extensionUpdatePromptMinimumVersion: semver.inc(version, 'patch'),
          },
        },
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const updateModal = new UpdateModal(driver);
        await updateModal.checkPageIsLoaded();
      },
    );
  });

  it('should disappear when closed', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withAppStateController({
            isUpdateAvailable: true,
          })
          .build(),
        title: this.test?.fullTitle(),
        manifestFlags: {
          remoteFeatureFlags: {
            extensionUpdatePromptMinimumVersion: semver.inc(version, 'patch'),
          },
        },
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const updateModal = new UpdateModal(driver);
        await updateModal.checkPageIsLoaded();
        await updateModal.close();
        await updateModal.checkPageIsNotPresent();
      },
    );
  });

  it('should reload the extension when confirmed', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withAppStateController({
            isUpdateAvailable: true,
          })
          .build(),
        title: this.test?.fullTitle(),
        disableServerMochaToBackground: true,
        manifestFlags: {
          remoteFeatureFlags: {
            extensionUpdatePromptMinimumVersion: semver.inc(version, 'patch'),
          },
        },
        // we need to mock the updating page that is opened when the user confirms the update
        testSpecificMock: async (server: Mockttp) => {
          await server
            .forGet('https://metamask.io/updating')
            .thenCallback(() => ({
              statusCode: 200,
              body: '<title>MetaMask Updating</title><link rel="icon" href="data:image/png;base64,iVBORw0KGgo=">',
            }));
        },
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const updateModal = new UpdateModal(driver);
        await updateModal.checkPageIsLoaded();
        await updateModal.confirm();
        await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionUpdating);
      },
    );
  });

  it('should not be shown if the modal was recently dismissed', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withAppStateController({
            isUpdateAvailable: true,
            updateModalLastDismissedAt: Date.now(),
          })
          .build(),
        title: this.test?.fullTitle(),
        manifestFlags: {
          remoteFeatureFlags: {
            extensionUpdatePromptMinimumVersion: semver.inc(version, 'patch'),
          },
        },
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const updateModal = new UpdateModal(driver);
        await updateModal.checkPageIsNotPresent();
      },
    );
  });

  it('should not be shown if the extension was recently updated', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withAppStateController({
            isUpdateAvailable: true,
            lastUpdatedAt: Date.now(),
          })
          .build(),
        title: this.test?.fullTitle(),
        manifestFlags: {
          remoteFeatureFlags: {
            extensionUpdatePromptMinimumVersion: semver.inc(version, 'patch'),
          },
        },
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const updateModal = new UpdateModal(driver);
        await updateModal.checkPageIsNotPresent();
      },
    );
  });
});
