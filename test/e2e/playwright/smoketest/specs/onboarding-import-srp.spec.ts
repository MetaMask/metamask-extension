/* eslint-disable */
// Playwright smoketest: New onboarding flow + import existing SRP

import { test } from '@playwright/test';
import { ChromeExtensionPage } from '../../shared/pageObjects/extension-page';
import { SignUpPage } from '../../shared/pageObjects/signup-page';

const TEST_SEED_PHRASE = 'civil blame ecology always elder brick admit foam fury bunker squirrel harsh';

test('MetaMask Onboarding: Import existing SRP via new flow', async () => {
  const extension = new ChromeExtensionPage();
  const page = await extension.initExtension();
  page.setDefaultTimeout(25000);
  const signUp = new SignUpPage(page);
  await signUp.clickGetStarted();
  await signUp.clickScrollAndAgreeTermsOfUse();
  await signUp.importExistingWallet();
  await signUp.pasteSrp(TEST_SEED_PHRASE);
  await signUp.createPassword('Test123!');
  await signUp.clickMetric();
  await signUp.clickCompletion();
  await signUp.clickContinue();
  await signUp.clickCompletion();
  await signUp.assertWalletVisible();
});




