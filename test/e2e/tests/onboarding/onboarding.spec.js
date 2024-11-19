const { strict: assert } = require('assert');
const { toHex } = require('@metamask/controller-utils');
const { By } = require('selenium-webdriver');
const {
  TEST_SEED_PHRASE,
  convertToHexValue,
  withFixtures,
  completeCreateNewWalletOnboardingFlow,
  completeImportSRPOnboardingFlow,
  importSRPOnboardingFlow,
  importWrongSRPOnboardingFlow,
  testSRPDropdownIterations,
  locateAccountBalanceDOM,
  defaultGanacheOptions,
  WALLET_PASSWORD,
  onboardingBeginCreateNewWallet,
  onboardingChooseMetametricsOption,
  onboardingCreatePassword,
  onboardingRevealAndConfirmSRP,
  onboardingCompleteWalletCreation,
  regularDelayMs,
  unlockWallet,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');
const {
  FirstTimeFlowType,
} = require('../../../../shared/constants/onboarding');

describe('MetaMask onboarding @no-mmi', function () {
  const wrongSeedPhrase =
    'test test test test test test test test test test test test';
  const wrongTestPassword = 'test test test test';

  const ganacheOptions2 = {
    accounts: [
      {
        secretKey:
          '0x53CB0AB5226EEBF4D872113D98332C1555DC304443BEE1CF759D15798D3C55A9',
        balance: convertToHexValue(10000000000000000000),
      },
    ],
  };

  it('Clicks create a new wallet, accepts a secure password, reveals the Secret Recovery Phrase, confirm SRP', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await driver.navigate();

        await completeCreateNewWalletOnboardingFlow(driver, WALLET_PASSWORD);

        const homePage = await driver.findElement('.home__main-view');
        const homePageDisplayed = await homePage.isDisplayed();

        assert.equal(homePageDisplayed, true);
      },
    );
  });

  it('Clicks import a new wallet, accepts a secure password, reveals the Secret Recovery Phrase, confirm SRP', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await driver.navigate();

        await completeImportSRPOnboardingFlow(
          driver,
          TEST_SEED_PHRASE,
          WALLET_PASSWORD,
        );

        const homePage = await driver.findElement('.home__main-view');
        const homePageDisplayed = await homePage.isDisplayed();

        assert.equal(homePageDisplayed, true);
      },
    );
  });

  it('User import wrong Secret Recovery Phrase', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await driver.navigate();

        await importWrongSRPOnboardingFlow(driver, wrongSeedPhrase);

        const confirmSeedPhrase = await driver.findElement(
          '[data-testid="import-srp-confirm"]',
        );

        assert.equal(await confirmSeedPhrase.isEnabled(), false);
      },
    );
  });

  it('Check if user select different type of secret recovery phrase', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await driver.navigate();

        // accept terms of use
        await driver.clickElement('[data-testid="onboarding-terms-checkbox"]');

        // welcome
        await driver.clickElement('[data-testid="onboarding-import-wallet"]');

        await driver.clickElement('[data-testid="metametrics-no-thanks"]');

        const dropdownElement = await driver.findElement(
          '.import-srp__number-of-words-dropdown',
        );
        await dropdownElement.click();
        const options = await dropdownElement.findElements(By.css('option'));

        const iterations = options.length;

        await testSRPDropdownIterations(options, driver, iterations);

        const finalFormFields = await driver.findElements(
          '.import-srp__srp-word-label',
        );
        const expectedFinalNumFields = 24; // The last iteration will have 24 fields
        const actualFinalNumFields = finalFormFields.length;
        assert.equal(actualFinalNumFields, expectedFinalNumFields);
      },
    );
  });

  it('User enters the wrong password during password creation', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await driver.navigate();

        await driver.clickElement('[data-testid="onboarding-terms-checkbox"]');
        await driver.clickElement('[data-testid="onboarding-create-wallet"]');

        // metrics
        await driver.clickElement('[data-testid="metametrics-no-thanks"]');

        // Fill in confirm password field with incorrect password
        await driver.fill(
          '[data-testid="create-password-new"]',
          WALLET_PASSWORD,
        );
        await driver.fill(
          '[data-testid="create-password-confirm"]',
          wrongTestPassword,
        );

        // Check that the error message is displayed for the password fields
        await driver.isElementPresent(
          { text: "Passwords don't match", tag: 'h6' },
          true,
        );

        // Check that the "Confirm Password" button is disabled
        const confirmPasswordButton = await driver.findElement(
          '[data-testid="create-password-wallet"]',
        );
        assert.equal(await confirmPasswordButton.isEnabled(), false);
      },
    );
  });

  it('Verify that the user has been redirected to the correct page after importing their wallet', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await driver.navigate();

        await importSRPOnboardingFlow(
          driver,
          TEST_SEED_PHRASE,
          WALLET_PASSWORD,
        );
        // Verify site
        assert.equal(
          await driver.isElementPresent({
            text: 'Your wallet is ready',
            tag: 'h2',
          }),
          true,
        );
      },
    );
  });

  it('Verify that the user has been redirected to the correct page after creating a password for their new wallet', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await driver.navigate();

        await driver.clickElement('[data-testid="onboarding-terms-checkbox"]');
        await driver.clickElement('[data-testid="onboarding-create-wallet"]');

        // metrics
        await driver.clickElement('[data-testid="metametrics-no-thanks"]');

        // Fill in confirm password field with correct password
        await driver.fill(
          '[data-testid="create-password-new"]',
          WALLET_PASSWORD,
        );
        await driver.fill(
          '[data-testid="create-password-confirm"]',
          WALLET_PASSWORD,
        );
        await driver.clickElement('[data-testid="create-password-terms"]');
        await driver.clickElement('[data-testid="create-password-wallet"]');

        // Verify site
        assert.equal(
          await driver.isElementPresent({
            text: 'Secure your wallet',
            tag: 'h2',
          }),
          true,
        );
      },
    );
  });

  it('User can add custom network during onboarding', async function () {
    const networkName = 'Localhost 8546';
    const networkUrl = 'http://127.0.0.1:8546';
    const currencySymbol = 'ETH';
    const port = 8546;
    const chainId = 1338;
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        ganacheOptions: {
          ...defaultGanacheOptions,
          concurrent: [{ port, chainId, ganacheOptions2 }],
        },
        title: this.test.fullTitle(),
      },

      async ({ driver, secondaryGanacheServer }) => {
        try {
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

          await driver.clickElement({
            text: 'General',
          });
          await driver.clickElement({ text: 'Add a network' });

          await driver.waitForSelector(
            '.multichain-network-list-menu-content-wrapper__dialog',
          );

          await driver.fill(
            '[data-testid="network-form-network-name"]',
            networkName,
          );
          await driver.fill(
            '[data-testid="network-form-chain-id"]',
            chainId.toString(),
          );
          await driver.fill(
            '[data-testid="network-form-ticker-input"]',
            currencySymbol,
          );

          // Add rpc url
          const rpcUrlInputDropDown = await driver.waitForSelector(
            '[data-testid="test-add-rpc-drop-down"]',
          );
          await rpcUrlInputDropDown.click();
          await driver.clickElement({
            text: 'Add RPC URL',
            tag: 'button',
          });
          const rpcUrlInput = await driver.waitForSelector(
            '[data-testid="rpc-url-input-test"]',
          );
          await rpcUrlInput.clear();
          await rpcUrlInput.sendKeys(networkUrl);
          await driver.clickElement({
            text: 'Add URL',
            tag: 'button',
          });

          await driver.clickElementAndWaitToDisappear({
            tag: 'button',
            text: 'Save',
          });

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

          await driver.clickElement('.mm-picker-network');
          await driver.clickElement(
            `[data-rbd-draggable-id="${toHex(chainId)}"]`,
          );
          // Check localhost 8546 is selected and its balance value is correct
          await driver.findElement({
            css: '[data-testid="network-display"]',
            text: networkName,
          });

          await locateAccountBalanceDOM(driver, secondaryGanacheServer[0]);
        } catch (error) {
          console.error('Error in test:', error);
          throw error;
        }
      },
    );
  });

  it('User can turn off basic functionality in default settings', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
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
        await driver.clickElement(
          '[data-testid="basic-functionality-toggle"] .toggle-button',
        );
        await driver.clickElement('[id="basic-configuration-checkbox"]');
        await driver.clickElement({ text: 'Turn off', tag: 'button' });
        await driver.clickElement('[data-testid="category-back-button"]');

        // Wait until the onboarding carousel has stopped moving
        // otherwise the click has no effect.
        await driver.waitForElementToStopMoving(
          '[data-testid="privacy-settings-back-button"]',
        );
        await driver.clickElement(
          '[data-testid="privacy-settings-back-button"]',
        );

        await driver.clickElement('[data-testid="onboarding-complete-done"]');
        await driver.clickElement('[data-testid="pin-extension-next"]');
        await driver.clickElement('[data-testid="pin-extension-done"]');

        // Check that the 'basic functionality is off' banner is displayed on the home screen after onboarding completion
        await driver.waitForSelector({
          text: 'Basic functionality is off',
          css: '.mm-banner-alert',
        });
      },
    );
  });

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

  it('Provides an onboarding path for a user who has restored their account from state persistence failure', async function () {
    // We don't use onboarding:true here because we want there to be a vault,
    // simulating what will happen when a user eventually restores their vault
    // during a state persistence failure. Instead, we set the
    // firstTimeFlowType to 'restore' and completedOnboarding to false. as well
    // as some other first time state options to get us into an onboarding
    // state similar to a new state tree.
    await withFixtures(
      {
        fixtures: new FixtureBuilder()
          .withOnboardingController({
            completedOnboarding: false,
            firstTimeFlowType: FirstTimeFlowType.restore,
            seedPhraseBackedUp: null,
          })
          .withMetaMetricsController({
            participateInMetaMetrics: null,
            metaMetricsId: null,
          })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // First screen we should be on is MetaMetrics
        assert.equal(
          await driver.isElementPresent({
            text: 'Help us improve MetaMask',
            tag: 'h2',
          }),
          true,
          'First screen should be MetaMetrics',
        );

        // select no thanks
        await driver.clickElement('[data-testid="metametrics-no-thanks"]');

        // Next should be Secure your wallet screen
        assert.equal(
          await driver.isElementPresent({
            text: 'Secure your wallet',
            tag: 'h2',
          }),
          true,
        );
      },
    );
  });
});
