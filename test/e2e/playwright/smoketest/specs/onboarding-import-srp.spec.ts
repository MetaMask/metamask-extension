/* eslint-disable */
// Playwright smoketest: New onboarding flow + import existing SRP

import { test } from '@playwright/test';
import { ChromeExtensionPage } from '../../shared/pageObjects/extension-page';
import { OnboardingPage } from '../../page-objects/onboarding-page.ts';

function getSrp(): string {
  const srp = process.env.SMOKE_TEST_SRP;
  if (!srp) {
    throw new Error('Missing SMOKE_TEST_SRP env var');
  }
  return srp;
}

test('MetaMask Onboarding: Import existing SRP via new flow', async () => {
  const extension = new ChromeExtensionPage();
  const page = await extension.initExtension();
  page.setDefaultTimeout(25000);
  const onboarding = new OnboardingPage(page);
  await onboarding.clickGetStarted();
  await onboarding.clickScrollAndAgreeTermsOfUse();
  await onboarding.importExistingWallet();
  await onboarding.stopTracing();
  await onboarding.pasteSrp(getSrp());
  await onboarding.startTracing('post-srp');
  await onboarding.createPassword('Test123!');
  await onboarding.clickMetric();
  await onboarding.clickCompletion();
  await onboarding.clickContinue();
  await onboarding.clickCompletion();
  await onboarding.assertWalletVisible();
});




