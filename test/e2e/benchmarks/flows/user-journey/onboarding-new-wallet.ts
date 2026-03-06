/**
 * Benchmark: Onboarding - Create new wallet
 * Measures time for creating a new wallet during onboarding
 */

import { Browser } from 'selenium-webdriver';
import { ALL_POPULAR_NETWORKS } from '../../../../../app/scripts/fixtures/with-networks';
import FixtureBuilderV2 from '../../../fixtures/fixture-builder-v2';
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
import { collectTimerResults } from '../../utils/timer-helper';
import {
  measureStepWithLongTasks,
  buildLongTaskTimerResults,
} from '../../utils/long-task-helper';
import {
  getTestSpecificMock,
  shouldUseMockedRequests,
} from '../../utils/mock-config';
import { BENCHMARK_PERSONA, BENCHMARK_TYPE } from '../../utils/constants';
import type { BenchmarkRunResult, LongTaskStepResult } from '../../utils/types';

export const testTitle = 'benchmark-onboarding-new-wallet';
export const persona = BENCHMARK_PERSONA.STANDARD;

export async function runOnboardingNewWalletBenchmark(): Promise<BenchmarkRunResult> {
  const steps: LongTaskStepResult[] = [];
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
        useMockingPassThrough: !shouldUseMockedRequests(),
        disableServerMochaToBackground: true,
        extendedTimeoutMultiplier: 3,
        fixtures: new FixtureBuilderV2({ onboarding: true })
          .withEnabledNetworks(ALL_POPULAR_NETWORKS)
          .build(),
        testSpecificMock: getTestSpecificMock(),
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

        // Measure: Create wallet to Social screen
        const startOnboardingPage = new StartOnboardingPage(driver);
        await startOnboardingPage.checkLoginPageIsLoaded();
        await startOnboardingPage.createWalletWithSrp(false);
        steps.push(
          await measureStepWithLongTasks(
            driver,
            'createWalletToSocialScreen',
            async () => {
              await startOnboardingPage.checkSocialSignUpFormIsVisible();
            },
          ),
        );

        // Measure: SRP button to Password form
        await startOnboardingPage.clickCreateWithSrpButton();
        steps.push(
          await measureStepWithLongTasks(
            driver,
            'srpButtonToPwForm',
            async () => {
              const onboardingPasswordPage = new OnboardingPasswordPage(driver);
              await onboardingPasswordPage.checkPageIsLoaded();
            },
          ),
        );

        // Measure: Password to Recovery
        const onboardingPasswordPage = new OnboardingPasswordPage(driver);
        await onboardingPasswordPage.createWalletPassword(WALLET_PASSWORD);
        steps.push(
          await measureStepWithLongTasks(
            driver,
            'createPwToRecoveryScreen',
            async () => {
              const secureWalletPage = new SecureWalletPage(driver);
              await secureWalletPage.checkPageIsLoaded();
            },
          ),
        );

        // Skip recovery backup
        const secureWalletPage = new SecureWalletPage(driver);
        await secureWalletPage.skipSRPBackup();

        // Measure: Skip to Metrics (Chrome only)
        if (!isFirefox) {
          steps.push(
            await measureStepWithLongTasks(
              driver,
              'skipBackupToMetricsScreen',
              async () => {
                const onboardingMetricsPage = new OnboardingMetricsPage(driver);
                await onboardingMetricsPage.checkPageIsLoaded();
              },
            ),
          );
          const onboardingMetricsPage = new OnboardingMetricsPage(driver);
          await onboardingMetricsPage.clickOnContinueButton();
        }

        // Measure: Agree to Complete
        steps.push(
          await measureStepWithLongTasks(
            driver,
            'agreeButtonToOnboardingSuccess',
            async () => {
              const onboardingCompletePage = new OnboardingCompletePage(driver);
              await onboardingCompletePage.checkPageIsLoaded();
            },
          ),
        );

        // Measure: Done to Asset list
        const onboardingCompletePage = new OnboardingCompletePage(driver);
        await onboardingCompletePage.completeOnboarding();
        await handleSidepanelPostOnboarding(driver);
        steps.push(
          await measureStepWithLongTasks(
            driver,
            'doneButtonToAssetList',
            async () => {
              const homePage = new HomePage(driver);
              await homePage.checkPageIsLoaded();
              const assetListPage = new AssetListPage(driver);
              await assetListPage.checkTokenListIsDisplayed();
              await assetListPage.waitForTokenToBeDisplayed('Ethereum');
              await assetListPage.waitForTokenToBeDisplayed('Solana', 60000);
            },
          ),
        );
      },
    );

    return {
      timers: [...collectTimerResults(), ...buildLongTaskTimerResults(steps)],
      success: true,
      benchmarkType: BENCHMARK_TYPE.PERFORMANCE,
    };
  } catch (error) {
    return {
      timers: [...collectTimerResults(), ...buildLongTaskTimerResults(steps)],
      success: false,
      error: error instanceof Error ? error.message : String(error),
      benchmarkType: BENCHMARK_TYPE.PERFORMANCE,
    };
  }
}

export const run = runOnboardingNewWalletBenchmark;
