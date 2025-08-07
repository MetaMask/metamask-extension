import { expect } from '@playwright/test';
import { getEventPayloads, withFixtures } from '../../helpers';
import { MockedEndpoint, Mockttp } from '../../mock-e2e';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixture-builder';
import AdvancedSettings from '../../page-objects/pages/settings/advanced-settings';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import {
  loginWithBalanceValidation,
  loginWithoutBalanceValidation,
} from '../../page-objects/flows/login.flow';

async function mockSegment(mockServer: Mockttp) {
  return [
    await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [{ type: 'track', event: 'Show native token as main balance' }],
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      }),
  ];
}

describe('Settings: Show native token as main balance', function () {
  it('Should show balance in crypto when toggle is off', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().withConversionRateDisabled().build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        const assetListPage = new AssetListPage(driver);
        await assetListPage.checkTokenAmountIsDisplayed('25 ETH');
      },
    );
  });

  it('Should show balance in fiat when toggle is on', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withConversionRateEnabled()
          .withPreferencesControllerShowNativeTokenAsMainBalanceDisabled()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkExpectedBalanceIsDisplayed('$42,500.00', 'USD');

        await homePage.headerNavbar.openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.clickAdvancedTab();
        const advancedSettingsPage = new AdvancedSettings(driver);
        await advancedSettingsPage.checkPageIsLoaded();
        await advancedSettingsPage.toggleShowConversionOnTestnets();
        await settingsPage.closeSettingsPage();

        // assert amount displayed
        const assetListPage = new AssetListPage(driver);
        await assetListPage.checkTokenFiatAmountIsDisplayed('$42,500.00');
      },
    );
  });

  it('Should not show popover twice', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withConversionRateEnabled()
          .withPreferencesControllerShowNativeTokenAsMainBalanceDisabled()
          .build(),
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithoutBalanceValidation(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkExpectedBalanceIsDisplayed('$42,500.00', 'USD');

        await homePage.headerNavbar.openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.clickAdvancedTab();
        const advancedSettingsPage = new AdvancedSettings(driver);
        await advancedSettingsPage.checkPageIsLoaded();
        await advancedSettingsPage.toggleShowConversionOnTestnets();
        await settingsPage.closeSettingsPage();

        // go to setting and back to home page and make sure popover is not shown again
        await homePage.headerNavbar.openSettingsPage();
        await settingsPage.checkPageIsLoaded();
        await settingsPage.closeSettingsPage();
        await homePage.checkPageIsLoaded();
      },
    );
  });

  it('Should Successfully track the event when toggle is turned off', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            metaMetricsId: 'fake-metrics-fd20',
            participateInMetaMetrics: true,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({
        driver,
        mockedEndpoint: mockedEndpoints,
      }: {
        driver: Driver;
        mockedEndpoint: MockedEndpoint[];
      }) => {
        await loginWithBalanceValidation(driver);
        await new HeaderNavbar(driver).openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.toggleBalanceSetting();

        const events = await getEventPayloads(driver, mockedEndpoints);
        expect(events[0].properties).toMatchObject({
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          show_native_token_as_main_balance: false,
          category: 'Settings',
          locale: 'en',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: '0x539',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          environment_type: 'fullscreen',
        });
      },
    );
  });

  it('Should Successfully track the event when toggle is turned on', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            metaMetricsId: 'fake-metrics-fd20',
            participateInMetaMetrics: true,
          })
          .withPreferencesControllerShowNativeTokenAsMainBalanceDisabled()
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({
        driver,
        mockedEndpoint: mockedEndpoints,
      }: {
        driver: Driver;
        mockedEndpoint: MockedEndpoint[];
      }) => {
        await loginWithoutBalanceValidation(driver);
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await homePage.checkExpectedBalanceIsDisplayed('$42,500.00', 'USD');

        await homePage.headerNavbar.openSettingsPage();
        const settingsPage = new SettingsPage(driver);
        await settingsPage.checkPageIsLoaded();
        await settingsPage.toggleBalanceSetting();

        const events = await getEventPayloads(driver, mockedEndpoints);
        expect(events[0].properties).toMatchObject({
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          show_native_token_as_main_balance: true,
          category: 'Settings',
          locale: 'en',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: '0x539',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          environment_type: 'fullscreen',
        });
      },
    );
  });
});
