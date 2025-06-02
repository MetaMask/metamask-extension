import { Suite } from 'mocha';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import UpdateModal from '../../page-objects/pages/dialog/update-modal';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import semver from 'semver';
import { version } from '../../../../package.json';
import { strict as assert } from 'assert';

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
        await updateModal.check_pageIsNotPresent();
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
            extensionMinimumVersion: semver.inc(version, 'patch'),
          },
        },
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const updateModal = new UpdateModal(driver);
        await updateModal.check_pageIsLoaded();
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
            extensionMinimumVersion: semver.inc(version, 'patch'),
          },
        },
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const updateModal = new UpdateModal(driver);
        await updateModal.check_pageIsLoaded();
        await updateModal.close();
        await updateModal.check_pageIsNotPresent();
      },
    );
  });

  it.only('should reload the extension when confirmed', async function () {
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
            extensionMinimumVersion: semver.inc(version, 'patch'),
          },
        },
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const updateModal = new UpdateModal(driver);
        await updateModal.check_pageIsLoaded();
        await updateModal.confirm();
        const windowHandles = await driver.getAllWindowHandles();
        const extension = windowHandles[0];
        assert.equal(extension, undefined, 'Extension failed to reload');
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
            extensionMinimumVersion: semver.inc(version, 'patch'),
          },
        },
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const updateModal = new UpdateModal(driver);
        await updateModal.check_pageIsNotPresent();
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
            extensionMinimumVersion: semver.inc(version, 'patch'),
          },
        },
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        const updateModal = new UpdateModal(driver);
        await updateModal.check_pageIsNotPresent();
      },
    );
  });
});
