import { Suite } from 'mocha';
import semver from 'semver';
import type { Mockttp } from 'mockttp';
import { WINDOW_TITLES } from '../../constants';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixtures/fixture-builder';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import UpdateModal from '../../page-objects/pages/dialog/update-modal';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { version } from '../../../../package.json';

describe('Update modal', function (this: Suite) {
  it('should not be shown by default', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilderV2().build(),
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
    const minimumVersion = semver.inc(version, 'patch');
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withAppStateController({
            pendingExtensionVersion: minimumVersion,
          })
          .build(),
        title: this.test?.fullTitle(),
        manifestFlags: {
          remoteFeatureFlags: {
            extensionUpdatePromptMinimumVersion: minimumVersion,
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

  it('is not shown when pending version is not newer than current version', async function () {
    const minimumVersion = semver.inc(version, 'patch');
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withAppStateController({
            pendingExtensionVersion: version,
          })
          .build(),
        title: this.test?.fullTitle(),
        manifestFlags: {
          remoteFeatureFlags: {
            extensionUpdatePromptMinimumVersion: minimumVersion,
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

  it('should disappear when closed', async function () {
    const minimumVersion = semver.inc(version, 'patch');
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withAppStateController({
            pendingExtensionVersion: minimumVersion,
          })
          .build(),
        title: this.test?.fullTitle(),
        manifestFlags: {
          remoteFeatureFlags: {
            extensionUpdatePromptMinimumVersion: minimumVersion,
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
    const minimumVersion = semver.inc(version, 'patch');
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withAppStateController({
            pendingExtensionVersion: minimumVersion,
          })
          .build(),
        title: this.test?.fullTitle(),
        disableServerMochaToBackground: true,
        manifestFlags: {
          remoteFeatureFlags: {
            extensionUpdatePromptMinimumVersion: minimumVersion,
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
    const minimumVersion = semver.inc(version, 'patch');
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withAppStateController({
            pendingExtensionVersion: minimumVersion,
            updateModalLastDismissedAt: Date.now(),
          })
          .build(),
        title: this.test?.fullTitle(),
        manifestFlags: {
          remoteFeatureFlags: {
            extensionUpdatePromptMinimumVersion: minimumVersion,
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
    const minimumVersion = semver.inc(version, 'patch');
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withAppStateController({
            pendingExtensionVersion: minimumVersion,
            lastUpdatedAt: Date.now(),
          })
          .build(),
        title: this.test?.fullTitle(),
        manifestFlags: {
          remoteFeatureFlags: {
            extensionUpdatePromptMinimumVersion: minimumVersion,
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
