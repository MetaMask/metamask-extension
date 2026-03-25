import type { Driver } from '../../webdriver/driver';
import { withFixtures } from '../../helpers';
import { configureFixtureSession } from '../../helpers/fixture-session';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import AboutPage from '../../page-objects/pages/settings/about-page';
import AdvancedSettings from '../../page-objects/pages/settings/advanced-settings';
import ExperimentalSettings from '../../page-objects/pages/settings/experimental-settings';
import GeneralSettings from '../../page-objects/pages/settings/general-settings';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import PrivacySettings from '../../page-objects/pages/settings/privacy-settings';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import { login } from '../../page-objects/flows/login.flow';

type BenchmarkMode = 'isolated' | 'shared';
type BenchmarkCase = {
  title: string;
  run: (driver: Driver) => Promise<void>;
};

const benchmarkMode = process.env
  .FIXTURE_SESSION_BENCHMARK_MODE as BenchmarkMode;

if (!['isolated', 'shared'].includes(benchmarkMode)) {
  throw new Error(
    `Expected FIXTURE_SESSION_BENCHMARK_MODE to be "isolated" or "shared"; received "${benchmarkMode}".`,
  );
}

const fixtureOptions = {
  fixtures: new FixtureBuilderV2().build(),
};

const settingsSearch = {
  about: 'Terms of Use',
  advanced: 'State logs',
  experimental: 'Snaps',
  general: 'Show native token as main balance',
  security: 'Reveal Secret',
};

const benchmarkCases: BenchmarkCase[] = [
  {
    title: 'finds an element inside the General tab',
    run: async (driver: Driver) => {
      await new HeaderNavbar(driver).openSettingsPage();
      const settingsPage = new SettingsPage(driver);
      await settingsPage.checkPageIsLoaded();
      await settingsPage.fillSearchSettingsInput(settingsSearch.general);
      await settingsPage.goToSearchResultPage('General');
      await new GeneralSettings(driver).checkPageIsLoaded();
    },
  },
  {
    title: 'finds an element inside the Advanced tab',
    run: async (driver: Driver) => {
      await new HeaderNavbar(driver).openSettingsPage();
      const settingsPage = new SettingsPage(driver);
      await settingsPage.checkPageIsLoaded();
      await settingsPage.fillSearchSettingsInput(settingsSearch.advanced);
      await settingsPage.goToSearchResultPage('Advanced');
      await new AdvancedSettings(driver).checkPageIsLoaded();
    },
  },
  {
    title: 'finds an element inside the Security tab',
    run: async (driver: Driver) => {
      await new HeaderNavbar(driver).openSettingsPage();
      const settingsPage = new SettingsPage(driver);
      await settingsPage.checkPageIsLoaded();
      await settingsPage.fillSearchSettingsInput(settingsSearch.security);
      await settingsPage.goToSearchResultPage('Security');
      await new PrivacySettings(driver).checkPageIsLoaded();
    },
  },
  {
    title: 'finds an element inside the Experimental tab',
    run: async (driver: Driver) => {
      await new HeaderNavbar(driver).openSettingsPage();
      const settingsPage = new SettingsPage(driver);
      await settingsPage.checkPageIsLoaded();
      await settingsPage.fillSearchSettingsInput(settingsSearch.experimental);
      await settingsPage.goToSearchResultPage('Experimental');
      await new ExperimentalSettings(driver).checkPageIsLoaded();
    },
  },
  {
    title: 'finds an element inside the About tab',
    run: async (driver: Driver) => {
      await new HeaderNavbar(driver).openSettingsPage();
      const settingsPage = new SettingsPage(driver);
      await settingsPage.checkPageIsLoaded();
      await settingsPage.fillSearchSettingsInput(settingsSearch.about);
      await settingsPage.goToSearchResultPage('About');
      await new AboutPage(driver).checkPageIsLoaded();
    },
  },
  {
    title: 'shows the empty-state message for a missing setting',
    run: async (driver: Driver) => {
      await new HeaderNavbar(driver).openSettingsPage();
      const settingsPage = new SettingsPage(driver);
      await settingsPage.checkPageIsLoaded();
      await settingsPage.fillSearchSettingsInput('Lorem ipsum');
      await settingsPage.checkNoMatchingResultsFoundMessageIsDisplayed();
    },
  },
];

if (benchmarkMode === 'shared') {
  configureFixtureSession(
    'Fixture session benchmark (shared)',
    fixtureOptions,
    ({ getDriver }) => {
      // eslint-disable-next-line mocha/no-top-level-hooks -- configureFixtureSession defines the nested suite for this callback
      before(
        'Unlock wallet once for the shared-session benchmark',
        async function () {
          await login(getDriver());
        },
      );

      for (const benchmarkCase of benchmarkCases) {
        it(benchmarkCase.title, async function () {
          const driver = getDriver();
          await driver.navigate();
          await benchmarkCase.run(driver);
        });
      }
    },
  );
} else {
  describe('Fixture session benchmark (isolated)', function () {
    for (const benchmarkCase of benchmarkCases) {
      it(benchmarkCase.title, async function () {
        await withFixtures(
          {
            ...fixtureOptions,
            title: this.test?.fullTitle(),
          },
          async ({ driver }) => {
            await login(driver);
            await benchmarkCase.run(driver);
          },
        );
      });
    }
  });
}
