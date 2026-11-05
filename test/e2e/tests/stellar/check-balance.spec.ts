import { Suite } from 'mocha';
import { Mockttp } from 'mockttp';
import { HOMEPAGE_BALANCE_ASSERTION_TIMEOUT_MS } from '../../constants';
import { withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { login } from '../../page-objects/flows/login.flow';
import { selectStellarNetwork } from '../../page-objects/flows/stellar-network.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import {
  XLM_BALANCE_DISPLAY,
  XLM_FIAT_DISPLAY,
  buildStellarFixture,
  mockStellarApis,
  mockStellarApisZeroBalance,
  stellarFixtureOptions,
} from './mocks/common-stellar';

describe('Stellar - Check balance', function (this: Suite) {
  this.timeout(180_000);

  it('Just created Stellar account shows 0 XLM when native token is enabled', async function () {
    await withFixtures(
      stellarFixtureOptions({
        fixtures: buildStellarFixture().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockStellarApisZeroBalance,
      }),
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await selectStellarNetwork(driver);
        // Refresh re-hydrates the UI from background state so the asynchronously-fetched Snap balance is shown reliably.
        await driver.refresh();
        await homePage.checkExpectedBalanceIsDisplayed({
          expectedBalance: '0 XLM',
          timeout: HOMEPAGE_BALANCE_ASSERTION_TIMEOUT_MS,
        });
      },
    );
  });

  it('For a non 0 balance account - USD balance', async function () {
    await withFixtures(
      stellarFixtureOptions({
        fixtures: buildStellarFixture({
          showNativeTokenAsMainBalanceDisabled: true,
        }).build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (mockServer: Mockttp) => mockStellarApis(mockServer),
      }),
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await selectStellarNetwork(driver);
        await driver.refresh();
        await homePage.checkExpectedBalanceIsDisplayed({
          expectedBalance: XLM_FIAT_DISPLAY,
          timeout: HOMEPAGE_BALANCE_ASSERTION_TIMEOUT_MS,
        });
      },
    );
  });

  it('For a non 0 balance account - XLM balance', async function () {
    await withFixtures(
      stellarFixtureOptions({
        fixtures: buildStellarFixture().build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (mockServer: Mockttp) => mockStellarApis(mockServer),
      }),
      async ({ driver }: { driver: Driver }) => {
        await login(driver, { validateBalance: false });
        const homePage = new HomePage(driver);
        await homePage.checkPageIsLoaded();
        await selectStellarNetwork(driver);
        await driver.refresh();
        await homePage.checkExpectedBalanceIsDisplayed({
          expectedBalance: XLM_BALANCE_DISPLAY,
          timeout: HOMEPAGE_BALANCE_ASSERTION_TIMEOUT_MS,
        });
      },
    );
  });
});
