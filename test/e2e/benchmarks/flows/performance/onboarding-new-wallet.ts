/**
 * Benchmark: Onboarding - Create new wallet
 * Measures time for creating a new wallet during onboarding
 */

import { Mockttp } from 'mockttp';
import { Browser } from 'selenium-webdriver';
import { ALL_POPULAR_NETWORKS } from '../../../../../app/scripts/fixtures/with-networks';
import FixtureBuilder from '../../../fixtures/fixture-builder';
import { WALLET_PASSWORD } from '../../../constants';
import { withFixtures } from '../../../helpers';
import {
  handleSidepanelPostOnboarding,
  onboardingMetricsFlow,
} from '../../../page-objects/flows/onboarding.flow';
import AssetListPage from '../../../page-objects/pages/home/asset-list';
import HomePage from '../../../page-objects/pages/home/homepage';
import OnboardingCompletePage from '../../../page-objects/pages/onboarding/onboarding-complete-page';
import OnboardingMetricsPage from '../../../page-objects/pages/onboarding/onboarding-metrics-page';
import OnboardingPasswordPage from '../../../page-objects/pages/onboarding/onboarding-password-page';
import SecureWalletPage from '../../../page-objects/pages/onboarding/secure-wallet-page';
import StartOnboardingPage from '../../../page-objects/pages/onboarding/start-onboarding-page';
import { Driver } from '../../../webdriver/driver';
import TimerHelper from '../../utils/TimerHelper';
import Timers from '../../utils/Timers';
import { collectTimerResults } from '../../utils/timer-utils';
import type { BenchmarkRunResult } from '../../utils/types';

async function getCommonMocks(server: Mockttp) {
  return [
    await server
      .forGet(/^https:\/\/proxy\.metafi\.codefi\.network\/price\/.*/)
      .thenCallback(() => ({
        statusCode: 200,
        json: {},
      })),
  ];
}

export const testTitle = 'benchmark-onboarding-new-wallet';
export const persona = 'standard';

export async function runOnboardingNewWalletBenchmark(): Promise<BenchmarkRunResult> {
  Timers.resetTimers();

  try {
    await withFixtures(
      {
        title: testTitle,
        manifestFlags: {
          testing: {
            disableSync: true,
            infuraProjectId: process.env.INFURA_PROJECT_ID,
          },
        },
        useMockingPassThrough: true,
        disableServerMochaToBackground: true,
        extendedTimeoutMultiplier: 3,
        fixtures: new FixtureBuilder({ onboarding: true })
          .withEnabledNetworks(ALL_POPULAR_NETWORKS)
          .build(),
        testSpecificMock: async (server: Mockttp) => {
          return [...(await getCommonMocks(server))];
        },
      },
      async ({ driver }: { driver: Driver }) => {
        await driver.navigate();
        const isFirefox = process.env.SELENIUM_BROWSER === Browser.FIREFOX;
        if (isFirefox) {
          await onboardingMetricsFlow(driver, {
            participateInMetaMetrics: false,
            dataCollectionForMarketing: false,
          });
        }

        // Timer: Create wallet to Social screen
        const timerCreateWalletToSocial = new TimerHelper(
          'createWalletToSocialScreen',
          2000,
        );
        const startOnboardingPage = new StartOnboardingPage(driver);
        await startOnboardingPage.checkLoginPageIsLoaded();
        await startOnboardingPage.createWalletWithSrp(false);
        await timerCreateWalletToSocial.measure(async () => {
          await startOnboardingPage.checkSocialSignUpFormIsVisible();
        });

        // Timer: SRP button to Password form
        const timerSrpButtonToPassword = new TimerHelper(
          'srpButtonToPasswordForm',
          2000,
        );
        await startOnboardingPage.clickCreateWithSrpButton();
        await timerSrpButtonToPassword.measure(async () => {
          const onboardingPasswordPage = new OnboardingPasswordPage(driver);
          await onboardingPasswordPage.checkPageIsLoaded();
        });

        // Timer: Password to Recovery
        const timerPasswordToRecovery = new TimerHelper(
          'createPasswordToRecoveryScreen',
          3000,
        );
        const onboardingPasswordPage = new OnboardingPasswordPage(driver);
        await onboardingPasswordPage.createWalletPassword(WALLET_PASSWORD);
        await timerPasswordToRecovery.measure(async () => {
          const secureWalletPage = new SecureWalletPage(driver);
          await secureWalletPage.checkPageIsLoaded();
        });

        // Skip recovery backup
        const secureWalletPage = new SecureWalletPage(driver);
        await secureWalletPage.skipSRPBackup();

        // Timer: Skip to Metrics (Chrome only)
        if (!isFirefox) {
          const timerSkipToMetrics = new TimerHelper(
            'skipBackupToMetricsScreen',
            3000,
          );
          await timerSkipToMetrics.measure(async () => {
            const onboardingMetricsPage = new OnboardingMetricsPage(driver);
            await onboardingMetricsPage.checkPageIsLoaded();
          });
          const onboardingMetricsPage = new OnboardingMetricsPage(driver);
          await onboardingMetricsPage.clickOnContinueButton();
        }

        // Timer: Agree to Complete
        const timerAgreeToComplete = new TimerHelper(
          'agreeButtonToOnboardingSuccess',
          3000,
        );
        await timerAgreeToComplete.measure(async () => {
          const onboardingCompletePage = new OnboardingCompletePage(driver);
          await onboardingCompletePage.checkPageIsLoaded();
        });

        // Timer: Done to Asset list
        const timerDoneToAssetList = new TimerHelper(
          'doneButtonToAssetList',
          15000,
        );
        const onboardingCompletePage = new OnboardingCompletePage(driver);
        await onboardingCompletePage.completeOnboarding();
        await handleSidepanelPostOnboarding(driver);
        await timerDoneToAssetList.measure(async () => {
          const homePage = new HomePage(driver);
          await homePage.checkPageIsLoaded();
          const assetListPage = new AssetListPage(driver);
          await assetListPage.checkTokenListIsDisplayed();
          await assetListPage.checkConversionRateDisplayed();
          await assetListPage.waitForTokenToBeDisplayed('Ethereum');
          await assetListPage.waitForTokenToBeDisplayed('Solana', 60000);
        });
      },
    );

    return { timers: collectTimerResults(), success: true };
  } catch (error) {
    return {
      timers: collectTimerResults(),
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export const run = runOnboardingNewWalletBenchmark;
