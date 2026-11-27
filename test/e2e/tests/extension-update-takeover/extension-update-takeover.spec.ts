import { Suite } from 'mocha';
import semver from 'semver';
import type { MockedEndpoint, Mockttp } from 'mockttp';
import { waitForRemoteFeatureFlag, withFixtures } from '../../helpers';
import { WINDOW_TITLES } from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { getProductionRemoteFlagApiResponse } from '../../feature-flags';
import ExtensionUpdateTakeover from '../../page-objects/pages/dialog/extension-update-takeover';
import HeaderNavbar from '../../page-objects/pages/home/header-navbar';
import PrivacySettings from '../../page-objects/pages/settings/privacy/privacy-settings';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import { login } from '../../page-objects/flows/login.flow';
import { navigateToPrivacySettings } from '../../page-objects/flows/settings.flow';
import { version } from '../../../../package.json';

const nextPatchVersion = semver.inc(version, 'patch') as string;
const nextMinorVersion = semver.inc(version, 'minor') as string;

const versionUpdateFlags = {
  remoteFeatureFlags: {
    extensionUpdatePromptMinimumVersion: nextPatchVersion,
  },
};

// The installed version is below the deprecated version, which is at or
// below the minimum, so the unsupported variant shows.
const unsupportedFlags = {
  remoteFeatureFlags: {
    extensionUpdatePromptDeprecatedVersion: nextPatchVersion,
    extensionUpdatePromptMinimumVersion: nextMinorVersion,
  },
};

function qualifyingFixture(pendingExtensionVersion = nextPatchVersion) {
  return new FixtureBuilderV2()
    .withAppStateController({ pendingExtensionVersion })
    .build();
}

async function mockUpdatingPage(server: Mockttp): Promise<MockedEndpoint> {
  // openUpdateTabAndReload opens metamask.com, so the mock has to match it.
  return await server
    .forGet('https://metamask.com/updating')
    .thenCallback(() => ({
      statusCode: 200,
      body: '<title>MetaMask Updating</title><link rel="icon" href="data:image/png;base64,iVBORw0KGgo=">',
    }));
}

describe('Extension update takeover', function (this: Suite) {
  it('shows the version update and returns to the wallet after dismissal', async function () {
    await withFixtures(
      {
        fixtures: qualifyingFixture(),
        manifestFlags: versionUpdateFlags,
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver);
        const takeover = new ExtensionUpdateTakeover(driver);
        await takeover.checkVersionUpdateIsDisplayed();
        await takeover.dismiss();
        await takeover.checkPageIsNotPresent();

        await new HeaderNavbar(driver).openSettingsPage();
        await new SettingsPage(driver).checkPageIsLoaded();
      },
    );
  });

  it('shows and dismisses the unsupported variant', async function () {
    await withFixtures(
      {
        fixtures: qualifyingFixture(nextMinorVersion),
        manifestFlags: unsupportedFlags,
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver);
        const takeover = new ExtensionUpdateTakeover(driver);
        await takeover.checkUnsupportedVersionIsDisplayed();
        await takeover.dismiss();
        await takeover.checkPageIsNotPresent();
      },
    );
  });

  it('focuses Update, ignores escape and outside clicks, and blocks the page underneath', async function () {
    await withFixtures(
      {
        fixtures: qualifyingFixture(),
        manifestFlags: versionUpdateFlags,
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver);
        const takeover = new ExtensionUpdateTakeover(driver);
        await takeover.checkVersionUpdateIsDisplayed();
        await takeover.checkPrimaryButtonIsFocused();

        await takeover.pressEscape();
        await takeover.clickOutsideContent();
        await takeover.checkStaysDisplayed();
        await takeover.checkVersionUpdateIsDisplayed();
        await takeover.checkBackgroundIsBlocked();
      },
    );
  });

  it('covers the popup and extension routes other than home', async function () {
    await withFixtures(
      {
        fixtures: qualifyingFixture(),
        manifestFlags: versionUpdateFlags,
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver);
        const takeover = new ExtensionUpdateTakeover(driver);
        await takeover.checkVersionUpdateIsDisplayed();

        await takeover.openInNewExtensionTab('popup');
        await takeover.checkBackgroundIsBlocked();

        await takeover.openInNewExtensionTab('home', '#settings');
        await takeover.checkBackgroundIsBlocked();
      },
    );
  });

  it('waits for an open dialog to close before appearing', async function () {
    let releaseFlags: () => void = () => undefined;
    const flagsReleased = new Promise<void>((resolve) => {
      releaseFlags = resolve;
    });

    await withFixtures(
      {
        fixtures: qualifyingFixture(),
        testSpecificMock: async (server: Mockttp) =>
          await server
            .forGet('https://client-config.api.cx.metamask.io/v1/flags')
            .always()
            .thenCallback(async () => {
              await flagsReleased;
              return {
                statusCode: 200,
                json: [
                  ...getProductionRemoteFlagApiResponse(),
                  { extensionUpdatePromptMinimumVersion: nextPatchVersion },
                ],
              };
            }),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver);
        const takeover = new ExtensionUpdateTakeover(driver);
        await takeover.checkPageIsNotPresent();

        await navigateToPrivacySettings(driver);
        const privacySettings = new PrivacySettings(driver);
        await privacySettings.toggleBasicFunctionality();
        await privacySettings.checkBasicFunctionalityModalIsDisplayed();
        releaseFlags();
        await waitForRemoteFeatureFlag(
          driver,
          'extensionUpdatePromptMinimumVersion',
          nextPatchVersion,
        );
        await takeover.checkPageIsNotPresent();

        await privacySettings.cancelBasicFunctionalityModal();
        await takeover.checkVersionUpdateIsDisplayed();
      },
    );
  });

  it('ignores a second Update click and opens a single updating tab', async function () {
    await withFixtures(
      {
        disableServerMochaToBackground: true,
        fixtures: qualifyingFixture(),
        manifestFlags: versionUpdateFlags,
        testSpecificMock: mockUpdatingPage,
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver);
        const takeover = new ExtensionUpdateTakeover(driver);
        await takeover.checkVersionUpdateIsDisplayed();
        const takeoverHandle = await driver.getCurrentWindowHandle();
        await takeover.clickUpdate({ doubleClick: true });
        await driver.waitForWindowToClose(takeoverHandle);
        // A duplicate Update would open its tab moments after the first, so
        // the single tab has to hold, not just appear.
        await driver.waitForWindowsWithTitle(
          WINDOW_TITLES.ExtensionUpdating,
          1,
          { stableFor: 2000 },
        );
        await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionUpdating);
      },
    );
  });
});
