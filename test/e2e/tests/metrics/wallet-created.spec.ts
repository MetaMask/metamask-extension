import { strict as assert } from 'assert';
import { Browser } from 'selenium-webdriver';
import { Mockttp } from 'mockttp';
import { getEventPayloads, withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import {
  completeCreateNewWalletOnboardingFlow,
  createNewWalletWithSocialLoginOnboardingFlow,
} from '../../page-objects/flows/onboarding.flow';
import { MOCK_META_METRICS_ID } from '../../constants';
import { OAuthMockttpService } from '../../helpers/seedless-onboarding/mocks';
import OnboardingCompletePage from '../../page-objects/pages/onboarding/onboarding-complete-page';
import { Driver } from '../../webdriver/driver';

/**
 * Mocks the segment API multiple times for specific payloads that we expect to
 * see when these tests are run. In this case, we are looking for
 * 'Permissions Requested' and 'Permissions Received'. Do not use the constants
 * from the metrics constants files, because if these change we want a strong
 * indicator to our data team that the shape of data will change.
 *
 * @param mockServer - The mock server instance.
 * @returns
 */
async function mockSegment(mockServer: Mockttp) {
  return [
    // Wallet Setup Started event is omitted because of the onboarding fixture eventsBeforeMetricsOptIn
    await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [{ type: 'track', event: 'Wallet Creation Attempted' }],
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      }),
    await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [{ type: 'track', event: 'SRP Backup Selected' }],
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      }),
    await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [{ type: 'track', event: 'SRP Revealed' }],
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      }),
    await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [{ type: 'track', event: 'SRP Backup Confirm Display' }],
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      }),
    await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [{ type: 'track', event: 'SRP Backup Confirmed' }],
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      }),

    await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [{ type: 'track', event: 'Wallet Created' }],
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      }),
    await mockServer
      .forPost('https://api.segment.io/v1/batch')
      .withJsonBodyIncluding({
        batch: [{ type: 'track', event: 'Wallet Setup Completed' }],
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
        };
      }),
  ];
}

describe('Wallet Created Events', function () {
  it('are sent when onboarding user who chooses to opt in metrics', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true })
          .withMetaMetricsController({
            metaMetricsId: MOCK_META_METRICS_ID,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await completeCreateNewWalletOnboardingFlow({
          driver,
          participateInMetaMetrics: true,
        });
        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.equal(events.length, 6);

        if (process.env.SELENIUM_BROWSER === Browser.FIREFOX) {
          assert.equal(events[0].event, 'Wallet Creation Attempted');
          assert.deepStrictEqual(events[0].properties, {
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            account_type: 'metamask',
            category: 'Onboarding',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            chain_id: '0x1',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            environment_type: 'fullscreen',
            locale: 'en',
          });
          assert.equal(events[1].event, 'SRP Revealed');
          assert.deepStrictEqual(events[1].properties, {
            category: 'Onboarding',
            locale: 'en',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            chain_id: '0x1',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            environment_type: 'fullscreen',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            hd_entropy_index: 0,
          });
          assert.equal(events[2].event, 'SRP Backup Confirm Display');
          assert.ok(
            events[2].properties.category === 'Onboarding' &&
              events[2].properties.chain_id === '0x1' &&
              events[2].properties.environment_type === 'fullscreen' &&
              events[2].properties.locale === 'en' &&
              (events[2].properties.hd_entropy_index === 0 ||
                events[2].properties.hd_entropy_index === undefined),
          );
          assert.equal(events[3].event, 'SRP Backup Confirmed');
          assert.ok(
            events[3].properties.category === 'Onboarding' &&
              events[3].properties.chain_id === '0x1' &&
              events[3].properties.environment_type === 'fullscreen' &&
              events[3].properties.locale === 'en' &&
              (events[3].properties.hd_entropy_index === 0 ||
                events[3].properties.hd_entropy_index === undefined),
          );
          assert.equal(events[4].event, 'Wallet Created');
          assert.ok(
            events[4].properties.category === 'Onboarding' &&
              events[4].properties.chain_id === '0x1' &&
              events[4].properties.environment_type === 'fullscreen' &&
              events[4].properties.locale === 'en' &&
              events[4].properties.biometrics_enabled === false,
          );
          assert.equal(events[5].event, 'Wallet Setup Completed');
          assert.deepStrictEqual(events[5].properties, {
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            account_type: 'metamask',
            category: 'Onboarding',
            locale: 'en',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            chain_id: '0x1',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            environment_type: 'fullscreen',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            wallet_setup_type: 'new',
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            new_wallet: true,
          });
        }
      },
    );
  });

  it('are not sent when onboarding user who chooses to opt out metrics', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true })
          .withMetaMetricsController({
            metaMetricsId: MOCK_META_METRICS_ID,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockSegment,
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        await completeCreateNewWalletOnboardingFlow({
          driver,
        });
        const mockedRequests = await getEventPayloads(
          driver,
          mockedEndpoints,
          false,
        );
        assert.equal(mockedRequests.length, 0);
      },
    );
  });

  it('are sent when user onboarding with social login', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder({ onboarding: true }).build(),
        title: this.test?.fullTitle(),
        testSpecificMock: (server: Mockttp) => {
          // using this to mock the OAuth Service (Web Authentication flow + Auth server)
          const oAuthMockttpService = new OAuthMockttpService();
          oAuthMockttpService.setup(server);

          return mockSegment(server);
        },
      },
      async ({ driver, mockedEndpoint: mockedEndpoints }) => {
        const onboardingOptions: {
          driver: Driver;
          participateInMetaMetrics?: boolean;
          dataCollectionForMarketing?: boolean;
        } = {
          driver,
        };
        // If running in Firefox, set the onboarding options to true
        // Otherwise, `participateInMetaMetrics` is automatically set to true for social login users
        if (process.env.SELENIUM_BROWSER === Browser.FIREFOX) {
          onboardingOptions.participateInMetaMetrics = true;
          onboardingOptions.dataCollectionForMarketing = true;
        }

        await createNewWalletWithSocialLoginOnboardingFlow(onboardingOptions);

        const onboardingCompletePage = new OnboardingCompletePage(driver);
        await onboardingCompletePage.displayDownloadAppPageAndContinue();
        await onboardingCompletePage.checkPageIsLoaded();
        await onboardingCompletePage.checkWalletReadyMessageIsDisplayed();
        await onboardingCompletePage.completeOnboarding();

        const events = await getEventPayloads(driver, mockedEndpoints);
        assert.equal(events.length, 3);

        assert.deepEqual(events[0].event, 'Wallet Creation Attempted');
        assert.deepStrictEqual(events[0].properties, {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: 'metamask_google',
          category: 'Onboarding',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: '0x1',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          environment_type: 'fullscreen',
          locale: 'en',
        });

        assert.deepEqual(events[1].event, 'Wallet Created');
        assert.deepStrictEqual(events[1].properties, {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: 'metamask_google',
          category: 'Onboarding',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: '0x1',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          environment_type: 'fullscreen',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          biometrics_enabled: false,
          locale: 'en',
        });

        assert.deepEqual(events[2].event, 'Wallet Setup Completed');
        assert.deepStrictEqual(events[2].properties, {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: 'metamask_google',
          category: 'Onboarding',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: '0x1',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          environment_type: 'fullscreen',
          locale: 'en',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          wallet_setup_type: 'new',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          new_wallet: true,
        });
      },
    );
  });
});
