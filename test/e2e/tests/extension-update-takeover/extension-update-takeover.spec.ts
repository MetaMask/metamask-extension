import { Suite } from 'mocha';
import semver from 'semver';
import type { MockedEndpoint, Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { getProductionRemoteFlagApiResponse } from '../../feature-flags';
import ExtensionUpdateTakeover from '../../page-objects/pages/dialog/extension-update-takeover';
import HeaderNavbar from '../../page-objects/pages/home/header-navbar';
import PrivacySettings from '../../page-objects/pages/settings/privacy-settings';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import { login } from '../../page-objects/flows/login.flow';
import {
  openBasicFunctionalityModal,
  openTakeoverInNewExtensionTab,
  waitForRemoteFeatureFlag,
} from '../../page-objects/flows/extension-update-takeover.flow';
import { version } from '../../../../package.json';

const minimumVersion = semver.inc(version, 'patch') as string;
const deprecatedVersion = semver.inc(version, 'minor') as string;

const versionUpdateFlags = {
  remoteFeatureFlags: {
    extensionUpdatePromptMinimumVersion: minimumVersion,
  },
};

const unsupportedFlags = {
  remoteFeatureFlags: {
    extensionUpdatePromptDeprecatedVersion: minimumVersion,
    extensionUpdatePromptMinimumVersion: deprecatedVersion,
  },
};

function qualifyingFixture(pendingExtensionVersion = minimumVersion) {
  return new FixtureBuilderV2()
    .withAppStateController({ pendingExtensionVersion })
    .build();
}

async function mockUpdatingPage(server: Mockttp): Promise<MockedEndpoint> {
  return await server
    .forGet('https://metamask.io/updating')
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
        fixtures: qualifyingFixture(deprecatedVersion),
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

        await openTakeoverInNewExtensionTab(driver, 'popup');
        await takeover.checkBackgroundIsBlocked();

        await openTakeoverInNewExtensionTab(driver, 'home', '#settings');
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
                  { extensionUpdatePromptMinimumVersion: minimumVersion },
                ],
              };
            }),
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await login(driver);
        const takeover = new ExtensionUpdateTakeover(driver);
        await takeover.checkPageIsNotPresent();

        await openBasicFunctionalityModal(driver);
        releaseFlags();
        await waitForRemoteFeatureFlag(
          driver,
          'extensionUpdatePromptMinimumVersion',
          minimumVersion,
        );
        await takeover.checkPageIsNotPresent();

        await new PrivacySettings(driver).cancelBasicFunctionalityModal();
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
        await takeover.confirmUpdate({ doubleClick: true });
      },
    );
  });
});
