import { until } from 'selenium-webdriver';
import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { withFixtures, veryLargeDelayMs } from '../../helpers';
import { WINDOW_TITLES } from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import HomePage from '../../page-objects/pages/home/homepage';
import PhishingWarningPage from '../../page-objects/pages/phishing-warning-page';
import { login } from '../../page-objects/flows/login.flow';
import { setupPhishingDetectionMocks } from './mocks';
import {
  DEFAULT_BLOCKED_DOMAIN,
  BlockProvider,
  waitForPhishingBlocklistToBeLoaded,
} from './helpers';

describe('Phishing Detection - Path-based URLs', function (this: Suite) {
  describe('blocklisted paths', function () {
    it('displays the MetaMask Phishing Detection page when accessing a blocklisted path', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2().build(),
          title: this.test?.fullTitle(),
          testSpecificMock: async (mockServer: Mockttp) => {
            return setupPhishingDetectionMocks(mockServer, {
              statusCode: 200,
              blockProvider: BlockProvider.MetaMask,
              blocklist: [],
              c2DomainBlocklist: [DEFAULT_BLOCKED_DOMAIN],
              blocklistPaths: ['127.0.0.1/path1'],
            });
          },
          dappOptions: {
            customDappPaths: [
              './tests/phishing-controller/mock-page-with-paths',
            ],
          },
        },
        async ({ driver }) => {
          await login(driver);
          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
          await waitForPhishingBlocklistToBeLoaded(driver);

          await driver.openNewPage('http://127.0.0.1:8080/path1/');
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Phishing);
          const phishingWarningPage = new PhishingWarningPage(driver);
          await phishingWarningPage.checkPageIsLoaded();
        },
      );
    });

    it('blocks access to blocklisted subpaths', async function () {
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2().build(),
          title: this.test?.fullTitle(),
          testSpecificMock: async (mockServer: Mockttp) => {
            return setupPhishingDetectionMocks(mockServer, {
              statusCode: 200,
              blockProvider: BlockProvider.MetaMask,
              blocklist: [],
              c2DomainBlocklist: [DEFAULT_BLOCKED_DOMAIN],
              blocklistPaths: ['127.0.0.1/path1'],
            });
          },
          dappOptions: {
            customDappPaths: [
              './tests/phishing-controller/mock-page-with-paths',
            ],
          },
        },
        async ({ driver }) => {
          await login(driver);
          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
          await waitForPhishingBlocklistToBeLoaded(driver);

          await driver.openNewPage('http://127.0.0.1:8080/path1/path2');

          await driver.switchToWindowWithTitle(WINDOW_TITLES.Phishing);
          const phishingWarningPage = new PhishingWarningPage(driver);
          await phishingWarningPage.checkPageIsLoaded();
        },
      );
    });
  });

  describe('whitelisted paths', function () {
    it('does not display the MetaMask Phishing Detection page when accessing a whitelisted path', async function () {
      if (process.env.SELENIUM_BROWSER === 'firefox') {
        this.skip();
      }
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2().build(),
          title: this.test?.fullTitle(),
          testSpecificMock: async (mockServer: Mockttp) => {
            return setupPhishingDetectionMocks(mockServer, {
              statusCode: 200,
              blockProvider: BlockProvider.MetaMask,
              blocklist: [],
              c2DomainBlocklist: [DEFAULT_BLOCKED_DOMAIN],
              blocklistPaths: ['127.0.0.1/path1'],
            });
          },
          dappOptions: {
            customDappPaths: [
              './tests/phishing-controller/mock-page-with-paths',
            ],
          },
        },
        async ({ driver }) => {
          await login(driver);
          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
          await waitForPhishingBlocklistToBeLoaded(driver);

          await driver.openNewPage('http://127.0.0.1:8080/path1/');
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Phishing);
          const phishingWarningPage = new PhishingWarningPage(driver);
          await phishingWarningPage.checkPageIsLoaded();
          await phishingWarningPage.clickProceedAnywayButton();

          // Wait for navigation to complete
          await driver.waitForWindowWithTitleToBePresent(
            'Mock E2E Phishing Page: Path 1',
            15000,
          );
          await driver.switchToWindowWithTitle(
            'Mock E2E Phishing Page: Path 1',
          );
        },
      );
    });

    it('when the subpath is whitelisted, the phishing warning page is not displayed for the blocklisted path and all subpaths', async function () {
      if (process.env.SELENIUM_BROWSER === 'firefox') {
        this.skip();
      }
      await withFixtures(
        {
          fixtures: new FixtureBuilderV2().build(),
          title: this.test?.fullTitle(),
          testSpecificMock: async (mockServer: Mockttp) => {
            return setupPhishingDetectionMocks(mockServer, {
              statusCode: 200,
              blockProvider: BlockProvider.MetaMask,
              blocklist: [],
              c2DomainBlocklist: [DEFAULT_BLOCKED_DOMAIN],
              blocklistPaths: ['127.0.0.1/path1'],
            });
          },
          dappOptions: {
            customDappPaths: [
              './tests/phishing-controller/mock-page-with-paths',
            ],
          },
        },
        async ({ driver }) => {
          await login(driver);
          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
          await waitForPhishingBlocklistToBeLoaded(driver);

          await driver.openNewPage('http://127.0.0.1:8080/path1/path2');
          // Note: unsure why it's needed but it stabilizes the test
          await driver.delay(veryLargeDelayMs);
          await driver.switchToWindowWithTitle(WINDOW_TITLES.Phishing);
          const phishingWarningPage = new PhishingWarningPage(driver);
          await phishingWarningPage.checkPageIsLoaded();
          await phishingWarningPage.clickProceedAnywayButton();
          await driver.waitForWindowWithTitleToBePresent(
            'Mock E2E Phishing Page: Path 2',
            15000,
          );
          await driver.switchToWindowWithTitle(
            'Mock E2E Phishing Page: Path 2',
          );

          await driver.openNewPage('http://127.0.0.1:8080/path1');
          await driver.wait(
            until.titleIs('Mock E2E Phishing Page: Path 1'),
            10000,
          );
        },
      );
    });
  });
});
