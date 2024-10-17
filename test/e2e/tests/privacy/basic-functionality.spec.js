const { strict: assert } = require('assert');
const {
  TEST_SEED_PHRASE,
  withFixtures,
  importSRPOnboardingFlow,
  WALLET_PASSWORD,
  tinyDelayMs,
  regularDelayMs,
  largeDelayMs,
  defaultGanacheOptions,
} = require('../../helpers');
const { METAMASK_STALELIST_URL } = require('../phishing-controller/helpers');
const FixtureBuilder = require('../../fixture-builder');

async function mockApis(mockServer) {
  return [
    await mockServer.forGet(METAMASK_STALELIST_URL).thenCallback(() => {
      return {
        statusCode: 200,
        body: [{ fakedata: true }],
      };
    }),
    await mockServer
      .forGet('https://token.api.cx.metamask.io/tokens/1')
      .thenCallback(() => {
        return {
          statusCode: 200,
          body: [{ fakedata: true }],
        };
      }),
    await mockServer
      .forGet('https://min-api.cryptocompare.com/data/price')
      .withQuery({ fsym: 'ETH', tsyms: 'USD' })
      .thenCallback(() => {
        return {
          statusCode: 200,
          json: {
            fakedata: 0,
          },
        };
      }),
  ];
}

describe('MetaMask onboarding @no-mmi', function () {
  it('should prevent network requests to basic functionality endpoints when the basic functionality toggle is off', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
        testSpecificMock: mockApis,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await driver.navigate();
        await importSRPOnboardingFlow(
          driver,
          TEST_SEED_PHRASE,
          WALLET_PASSWORD,
        );

        await driver.clickElement({
          text: 'Manage default privacy settings',
          tag: 'button',
        });
        await driver.clickElement('[data-testid="category-item-General"]');

        await driver.delay(regularDelayMs);

        await driver.clickElement(
          '[data-testid="basic-functionality-toggle"] .toggle-button',
        );

        await driver.clickElement('[id="basic-configuration-checkbox"]');
        await driver.clickElement({ text: 'Turn off', tag: 'button' });
        await driver.clickElement('[data-testid="category-back-button"]');
        await driver.delay(regularDelayMs);
        await driver.clickElement('[data-testid="category-item-Assets"]');
        await driver.delay(regularDelayMs);
        await driver.clickElement(
          '[data-testid="currency-rate-check-toggle"] .toggle-button',
        );
        await driver.clickElement('[data-testid="category-back-button"]');

        // Wait until the onboarding carousel has stopped moving
        // otherwise the click has no effect.
        await driver.waitForElementToStopMoving(
          '[data-testid="privacy-settings-back-button"]',
        );
        await driver.clickElement(
          '[data-testid="privacy-settings-back-button"]',
        );

        await driver.clickElementAndWaitToDisappear({
          text: 'Done',
          tag: 'button',
        });
        await driver.clickElement({
          text: 'Next',
          tag: 'button',
        });

        // Wait until the onboarding carousel has stopped moving
        // otherwise the click has no effect.
        await driver.waitForElementToStopMoving({
          text: 'Done',
          tag: 'button',
        });
        await driver.clickElementAndWaitToDisappear({
          text: 'Done',
          tag: 'button',
        });

        await driver.clickElement('[data-testid="network-display"]');

        await driver.clickElement({ text: 'Ethereum Mainnet', tag: 'p' });
        await driver.delay(tinyDelayMs);

        // Wait until network is fully switched and refresh tokens before asserting to mitigate flakiness
        await driver.assertElementNotPresent('.loading-overlay');
        await driver.clickElement('[data-testid="refresh-list-button"]');

        for (let i = 0; i < mockedEndpoints.length; i += 1) {
          const requests = await mockedEndpoints[i].getSeenRequests();

          assert.equal(
            requests.length,
            0,
            `${mockedEndpoints[i]} should make requests after onboarding`,
          );
        }
      },
    );
  });

  it('should not prevent network requests to basic functionality endpoints when the basic functionality toggle is on', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
        testSpecificMock: mockApis,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await driver.navigate();
        await importSRPOnboardingFlow(
          driver,
          TEST_SEED_PHRASE,
          WALLET_PASSWORD,
        );

        await driver.clickElement({
          text: 'Manage default privacy settings',
          tag: 'button',
        });
        await driver.clickElement('[data-testid="category-item-General"]');
        await driver.delay(largeDelayMs);
        await driver.clickElement('[data-testid="category-back-button"]');
        await driver.delay(largeDelayMs);
        await driver.clickElement(
          '[data-testid="privacy-settings-back-button"]',
        );
        await driver.delay(largeDelayMs);
        await driver.clickElement({ text: 'Done', tag: 'button' });
        await driver.clickElement('[data-testid="pin-extension-next"]');
        await driver.clickElement({ text: 'Done', tag: 'button' });

        await driver.clickElement('[data-testid="network-display"]');

        await driver.clickElement({ text: 'Ethereum Mainnet', tag: 'p' });

        // Wait until network is fully switched and refresh tokens before asserting to mitigate flakiness
        await driver.assertElementNotPresent('.loading-overlay');
        await driver.clickElement('[data-testid="refresh-list-button"]');
        for (let i = 0; i < mockedEndpoints.length; i += 1) {
          const requests = await mockedEndpoints[i].getSeenRequests();
          assert.equal(
            requests.length,
            1,
            `${mockedEndpoints[i]} should make requests after onboarding`,
          );
        }
      },
    );
  });
});
