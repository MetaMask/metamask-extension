const { strict: assert } = require('assert');
const { expect } = require('@playwright/test');
const {
  withFixtures,
  defaultGanacheOptions,
  logInWithBalanceValidation,
  unlockWallet,
  getEventPayloads,
} = require('../../helpers');

const FixtureBuilder = require('../../fixture-builder');

async function mockSegment(mockServer) {
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
  it('Should show balance in crypto when toggle is on', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().withConversionRateDisabled().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver, ganacheServer }) => {
        await logInWithBalanceValidation(driver, ganacheServer);

        await driver.clickElement(
          '[data-testid="account-overview__asset-tab"]',
        );
        const tokenValue = '25 ETH';
        const tokenListAmount = await driver.findElement(
          '[data-testid="multichain-token-list-item-value"]',
        );
        await driver.waitForNonEmptyElement(tokenListAmount);
        assert.equal(await tokenListAmount.getText(), tokenValue);
      },
    );
  });

  it('Should show balance in fiat when toggle is OFF and not show popover twice', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withConversionRateEnabled()
          .withPreferencesControllerShowNativeTokenAsMainBalanceDisabled()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement({ text: 'Settings', tag: 'div' });

        await driver.clickElement({
          text: 'Advanced',
          tag: 'div',
        });
        await driver.clickElement('.show-fiat-on-testnets-toggle');

        await driver.delay(1000);

        await driver.clickElement(
          '.settings-page__header__title-container__close-button',
        );
        // close popover for the first time
        await driver.clickElement('[data-testid="popover-close"]');
        // go to setting and back to home page and make sure popover is not shown again
        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );
        await driver.clickElement({ text: 'Settings', tag: 'div' });
        // close setting
        await driver.clickElement(
          '.settings-page__header__title-container__close-button',
        );
        // assert popover does not exist
        await driver.assertElementNotPresent('[data-testid="popover-close"]');

        await driver.clickElement(
          '[data-testid="account-overview__asset-tab"]',
        );

        const tokenListAmount = await driver.findElement(
          '.eth-overview__primary-container',
        );
        await driver.delay(1000);
        assert.equal(await tokenListAmount.getText(), '$42,500.00USD');
        await driver.clickElement('[data-testid="account-menu-icon"]');
        const accountTokenValue = await driver.waitForSelector(
          '.multichain-account-list-item .multichain-account-list-item__asset',
        );

        assert.equal(await accountTokenValue.getText(), '$42,500.00USD');
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
        defaultGanacheOptions,
        title: this.test.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await unlockWallet(driver);

        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );

        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.clickElement({
          text: 'General',
          tag: 'div',
        });
        await driver.clickElement('.show-native-token-as-main-balance');

        const events = await getEventPayloads(driver, mockedEndpoints);
        expect(events[0].properties).toMatchObject({
          show_native_token_as_main_balance: false,
          category: 'Settings',
          locale: 'en',
          chain_id: '0x539',
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
        defaultGanacheOptions,
        title: this.test.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await unlockWallet(driver);

        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );

        await driver.clickElement({ text: 'Settings', tag: 'div' });
        await driver.clickElement({
          text: 'General',
          tag: 'div',
        });
        await driver.clickElement('.show-native-token-as-main-balance');

        const events = await getEventPayloads(driver, mockedEndpoints);
        expect(events[0].properties).toMatchObject({
          show_native_token_as_main_balance: true,
          category: 'Settings',
          locale: 'en',
          chain_id: '0x539',
          environment_type: 'fullscreen',
        });
      },
    );
  });
});
