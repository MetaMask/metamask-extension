/* eslint-disable */
// Playwright smoketest: New onboarding flow + import existing SRP

import { test } from '@playwright/test';
import { ChromeExtensionPage } from '../../shared/pageObjects/extension-page';
import { SignUpPage } from '../../shared/pageObjects/signup-page';

function getSrp(): string {
  const srp = process.env.SRP_PHRASE || process.env.SRP || '';
  if (!srp) {
    throw new Error('SRP phrase not provided. Set SRP_PHRASE in env to run this test.');
  }
  return srp;
}

test('MetaMask Onboarding: Import existing SRP via new flow', async () => {
  const extension = new ChromeExtensionPage();
  const page = await extension.initExtension();
  page.setDefaultTimeout(25000);
  const signUp = new SignUpPage(page);
  await signUp.clickGetStarted();
  await signUp.clickScrollAndAgreeTermsOfUse();
  await signUp.importExistingWallet();
  const ctx = page.context();
  await ctx.tracing.stopChunk().catch(() => {});
  await signUp.pasteSrp(getSrp());
  await ctx.tracing.startChunk({ title: 'post-srp' }).catch(() => {});
  await signUp.createPassword('Test123!');
  await signUp.clickMetric();
  await signUp.clickCompletion();
  await signUp.clickContinue();
  await signUp.clickCompletion();
  await signUp.assertWalletVisible();
});




