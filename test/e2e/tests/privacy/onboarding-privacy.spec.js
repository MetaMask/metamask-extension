const { strict: assert } = require('assert');
const {
  TEST_SEED_PHRASE,
  withFixtures,
  importSRPOnboardingFlow,
  defaultGanacheOptions,
  onboardingBeginCreateNewWallet,
  onboardingChooseMetametricsOption,
  onboardingCreatePassword,
  onboardingRevealAndConfirmSRP,
  onboardingCompleteWalletCreation,
  regularDelayMs,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

describe('MetaMask onboarding @no-mmi', function () {
  it("doesn't make any network requests to infura before onboarding is completed", async function () {
    async function mockInfura(mockServer) {
      const infuraUrl =
        'https://mainnet.infura.io/v3/00000000000000000000000000000000';
      const sampleAddress = '1111111111111111111111111111111111111111';

      return [
        await mockServer
          .forPost(infuraUrl)
          .withJsonBodyIncluding({ method: 'eth_blockNumber' })
          .thenCallback(() => {
            return {
              statusCode: 200,
              json: {
                jsonrpc: '2.0',
                id: '1111111111111111',
                result: '0x1',
              },
            };
          }),
        await mockServer
          .forPost(infuraUrl)
          .withJsonBodyIncluding({ method: 'eth_getBalance' })
          .thenCallback(() => {
            return {
              statusCode: 200,
              json: {
                jsonrpc: '2.0',
                id: '1111111111111111',
                result: '0x0',
              },
            };
          }),
        await mockServer
          .forPost(infuraUrl)
          .withJsonBodyIncluding({ method: 'eth_getBlockByNumber' })
          .thenCallback(() => {
            return {
              statusCode: 200,
              json: {
                jsonrpc: '2.0',
                id: '1111111111111111',
                result: {},
              },
            };
          }),
        await mockServer
          .forPost(infuraUrl)
          .withJsonBodyIncluding({ method: 'eth_call' })
          .thenCallback(() => {
            return {
              statusCode: 200,
              json: {
                jsonrpc: '2.0',
                id: '1111111111111111',
                result: `0x000000000000000000000000${sampleAddress}`,
              },
            };
          }),
        await mockServer
          .forPost(infuraUrl)
          .withJsonBodyIncluding({ method: 'net_version' })
          .thenCallback(() => {
            return {
              statusCode: 200,
              json: { id: 8262367391254633, jsonrpc: '2.0', result: '1337' },
            };
          }),
      ];
    }

    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true })
          .withNetworkControllerOnMainnet()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
        testSpecificMock: mockInfura,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        const password = 'password';

        await driver.navigate();

        await onboardingBeginCreateNewWallet(driver);
        await onboardingChooseMetametricsOption(driver, false);
        await onboardingCreatePassword(driver, password);
        await onboardingRevealAndConfirmSRP(driver);
        await onboardingCompleteWalletCreation(driver);

        // pin extension walkthrough screen
        await driver.clickElement('[data-testid="pin-extension-next"]');

        await driver.delay(regularDelayMs);

        for (let i = 0; i < mockedEndpoints.length; i += 1) {
          const mockedEndpoint = await mockedEndpoints[i];
          const isPending = await mockedEndpoint.isPending();
          assert.equal(
            isPending,
            true,
            `${mockedEndpoints[i]} mock should still be pending before onboarding`,
          );
          const requests = await mockedEndpoint.getSeenRequests();

          assert.equal(
            requests.length,
            0,
            `${mockedEndpoints[i]} should make no requests before onboarding`,
          );
        }

        await driver.clickElement('[data-testid="pin-extension-done"]');
        // requests happen here!

        for (let i = 0; i < mockedEndpoints.length; i += 1) {
          const mockedEndpoint = await mockedEndpoints[i];

          await driver.wait(async () => {
            const isPending = await mockedEndpoint.isPending();
            return isPending === false;
          }, driver.timeout);

          const requests = await mockedEndpoint.getSeenRequests();

          assert.equal(
            requests.length > 0,
            true,
            `${mockedEndpoints[i]} should make requests after onboarding`,
          );
        }
      },
    );
  });

  it("doesn't make any network requests to infura before onboarding by import is completed", async function () {
    async function mockInfura(mockServer) {
      const infuraUrl =
        'https://mainnet.infura.io/v3/00000000000000000000000000000000';
      const sampleAddress = '1111111111111111111111111111111111111111';

      return [
        await mockServer
          .forPost(infuraUrl)
          .withJsonBodyIncluding({ method: 'eth_blockNumber' })
          .thenCallback(() => {
            return {
              statusCode: 200,
              json: {
                jsonrpc: '2.0',
                id: '1111111111111111',
                result: '0x1',
              },
            };
          }),
        await mockServer
          .forPost(infuraUrl)
          .withJsonBodyIncluding({ method: 'eth_getBalance' })
          .thenCallback(() => {
            return {
              statusCode: 200,
              json: {
                jsonrpc: '2.0',
                id: '1111111111111111',
                result: '0x0',
              },
            };
          }),
        await mockServer
          .forPost(infuraUrl)
          .withJsonBodyIncluding({ method: 'eth_getBlockByNumber' })
          .thenCallback(() => {
            return {
              statusCode: 200,
              json: {
                jsonrpc: '2.0',
                id: '1111111111111111',
                result: {},
              },
            };
          }),
        await mockServer
          .forPost(infuraUrl)
          .withJsonBodyIncluding({ method: 'eth_call' })
          .thenCallback(() => {
            return {
              statusCode: 200,
              json: {
                jsonrpc: '2.0',
                id: '1111111111111111',
                result: `0x000000000000000000000000${sampleAddress}`,
              },
            };
          }),
        await mockServer
          .forPost(infuraUrl)
          .withJsonBodyIncluding({ method: 'net_version' })
          .thenCallback(() => {
            return {
              statusCode: 200,
              json: { id: 8262367391254633, jsonrpc: '2.0', result: '1337' },
            };
          }),
      ];
    }

    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true })
          .withNetworkControllerOnMainnet()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
        testSpecificMock: mockInfura,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        const password = 'password';

        await driver.navigate();

        await importSRPOnboardingFlow(driver, TEST_SEED_PHRASE, password);

        await driver.delay(regularDelayMs);

        for (let i = 0; i < mockedEndpoints.length; i += 1) {
          const mockedEndpoint = await mockedEndpoints[i];
          const requests = await mockedEndpoint.getSeenRequests();

          assert.equal(
            requests.length,
            0,
            `${mockedEndpoints[i]} should make no requests before onboarding`,
          );
        }

        // complete
        await driver.clickElement('[data-testid="onboarding-complete-done"]');

        // pin extension
        await driver.clickElement('[data-testid="pin-extension-next"]');
        await driver.clickElement('[data-testid="pin-extension-done"]');

        // pin extension walkthrough screen
        await driver.findElement('[data-testid="account-menu-icon"]');
        // requests happen here!

        for (let i = 0; i < mockedEndpoints.length; i += 1) {
          const mockedEndpoint = await mockedEndpoints[i];

          await driver.wait(async () => {
            const isPending = await mockedEndpoint.isPending();
            return isPending === false;
          }, driver.timeout);

          const requests = await mockedEndpoint.getSeenRequests();

          assert.equal(
            requests.length > 0,
            true,
            `${mockedEndpoints[i]} should make requests after onboarding`,
          );
        }
      },
    );
  });
});
