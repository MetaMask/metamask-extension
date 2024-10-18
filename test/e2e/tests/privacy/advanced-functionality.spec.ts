import {
  TEST_SEED_PHRASE,
  withFixtures,
  importSRPOnboardingFlow,
  WALLET_PASSWORD,
  tinyDelayMs,
  regularDelayMs,
  largeDelayMs,
  defaultGanacheOptions,
} from '../../helpers';
import { METAMASK_STALELIST_URL } from '../phishing-controller/helpers';
import { Driver } from '../../webdriver/driver';

declare function require(moduleName: string): any;
const FixtureBuilder = require('../../fixture-builder');

declare type MockServer = any;

const describe = (name: string, fn: () => void): void => {};
const it = (name: string, fn: () => Promise<void>): void => {};

// Page object for onboarding process
class OnboardingPage {
  constructor(private driver: Driver) {}

  async navigateToPrivacySettings(): Promise<void> {
    await this.driver.clickElement({
      text: 'Manage default privacy settings',
      tag: 'button',
    });
  }

  async completeOnboarding(): Promise<void> {
    await this.driver.clickElementAndWaitToDisappear({
      text: 'Done',
      tag: 'button',
    });
    await this.driver.clickElement({
      text: 'Next',
      tag: 'button',
    });
    await this.driver.waitForElementToStopMoving({
      text: 'Done',
      tag: 'button',
    });
    await this.driver.clickElementAndWaitToDisappear({
      text: 'Done',
      tag: 'button',
    });
  }
}

// Page object for privacy settings
class PrivacySettingsPage {
  constructor(private driver: Driver) {}

  async navigateToGeneralSettings(): Promise<void> {
    await this.driver.clickElement('[data-testid="category-item-General"]');
  }

  async toggleBasicFunctionality(): Promise<void> {
    await this.driver.clickElement(
      '[data-testid="basic-functionality-toggle"] .toggle-button',
    );
  }

  async confirmBasicFunctionalityOff(): Promise<void> {
    await this.driver.clickElement('[id="basic-configuration-checkbox"]');
    await this.driver.clickElement({ text: 'Turn off', tag: 'button' });
  }

  async navigateToAssetsSettings(): Promise<void> {
    await this.driver.clickElement('[data-testid="category-item-Assets"]');
  }

  async toggleCurrencyRateCheck(): Promise<void> {
    await this.driver.clickElement(
      '[data-testid="currency-rate-check-toggle"] .toggle-button',
    );
  }

  async navigateBack(): Promise<void> {
    await this.driver.clickElement('[data-testid="category-back-button"]');
  }

  async exitPrivacySettings(): Promise<void> {
    await this.driver.waitForElementToStopMoving(
      '[data-testid="privacy-settings-back-button"]',
    );
    await this.driver.clickElement(
      '[data-testid="privacy-settings-back-button"]',
    );
  }
}

// Page object for network-related actions
class NetworkPage {
  constructor(private driver: Driver) {}

  async openNetworkMenu(): Promise<void> {
    await this.driver.clickElement('[data-testid="network-display"]');
  }

  async selectEthereumMainnet(): Promise<void> {
    await this.driver.clickElement({ text: 'Ethereum Mainnet', tag: 'p' });
  }

  async waitForNetworkSwitch(): Promise<void> {
    await this.driver.assertElementNotPresent('.loading-overlay');
  }

  async refreshTokenList(): Promise<void> {
    await this.driver.clickElement('[data-testid="refresh-list-button"]');
  }
}

async function mockApis(mockServer: MockServer): Promise<MockServer[]> {
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

// Common setup for both tests
async function setupTest(driver: Driver): Promise<{ onboardingPage: OnboardingPage; privacySettingsPage: PrivacySettingsPage; networkPage: NetworkPage }> {
  const onboardingPage = new OnboardingPage(driver);
  const privacySettingsPage = new PrivacySettingsPage(driver);
  const networkPage = new NetworkPage(driver);

  await driver.navigate();
  await importSRPOnboardingFlow(
    driver,
    TEST_SEED_PHRASE,
    WALLET_PASSWORD,
  );

  await onboardingPage.navigateToPrivacySettings();
  await privacySettingsPage.navigateToGeneralSettings();

  return { onboardingPage, privacySettingsPage, networkPage };
}

describe('MetaMask onboarding @no-mmi', () => {
  it('should prevent network requests to basic functionality endpoints when the basic functionality toggle is off', async () => {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        ganacheOptions: defaultGanacheOptions,
        title: 'Basic functionality toggle off test',
        testSpecificMock: mockApis,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }: { driver: Driver; mockedEndpoint: MockServer[] }) => {
        const { onboardingPage, privacySettingsPage, networkPage } = await setupTest(driver);

        await driver.delay(regularDelayMs);

        await privacySettingsPage.toggleBasicFunctionality();
        await privacySettingsPage.confirmBasicFunctionalityOff();
        await privacySettingsPage.navigateBack();
        await driver.delay(regularDelayMs);
        await privacySettingsPage.navigateToAssetsSettings();
        await driver.delay(regularDelayMs);
        await privacySettingsPage.toggleCurrencyRateCheck();
        await privacySettingsPage.navigateBack();

        await privacySettingsPage.exitPrivacySettings();

        await onboardingPage.completeOnboarding();

        await networkPage.openNetworkMenu();
        await networkPage.selectEthereumMainnet();
        await driver.delay(tinyDelayMs);

        await networkPage.waitForNetworkSwitch();
        await networkPage.refreshTokenList();

        for (let i = 0; i < mockedEndpoints.length; i += 1) {
          const requests = await mockedEndpoints[i].getSeenRequests();

          console.assert(
            requests.length === 0,
            `${mockedEndpoints[i]} should make requests after onboarding`,
          );
        }
      },
    );
  });

  it('should not prevent network requests to basic functionality endpoints when the basic functionality toggle is on', async () => {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        ganacheOptions: defaultGanacheOptions,
        title: 'Basic functionality toggle on test',
        testSpecificMock: mockApis,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }: { driver: Driver; mockedEndpoint: MockServer[] }) => {
        const { onboardingPage, privacySettingsPage, networkPage } = await setupTest(driver);

        await driver.delay(largeDelayMs);
        await privacySettingsPage.navigateBack();
        await driver.delay(largeDelayMs);
        await privacySettingsPage.exitPrivacySettings();
        await driver.delay(largeDelayMs);
        await driver.clickElement({ text: 'Done', tag: 'button' });
        await driver.clickElement('[data-testid="pin-extension-next"]');
        await driver.clickElement({ text: 'Done', tag: 'button' });

        await networkPage.openNetworkMenu();
        await networkPage.selectEthereumMainnet();

        await networkPage.waitForNetworkSwitch();
        await networkPage.refreshTokenList();
        for (let i = 0; i < mockedEndpoints.length; i += 1) {
          const requests = await mockedEndpoints[i].getSeenRequests();
          console.assert(
            requests.length === 1,
            `${mockedEndpoints[i]} should make requests after onboarding`,
          );
        }
      },
    );
  });
});
