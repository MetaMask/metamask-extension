#!/usr/bin/env npx tsx

import { launchMetaMask, DEFAULT_PASSWORD, HomePage } from './index';

async function testOnboarding() {
  console.log('=== LLM Workflow Onboarding Test ===\n');

  const launcher = await launchMetaMask({
    slowMo: 50,
    autoBuild: false,
    stateMode: 'onboarding',
  });

  let testPassed = false;

  try {
    console.log('Extension launched in onboarding mode');
    const page = launcher.getPage();
    console.log(`Current URL: ${page.url()}`);

    await page.waitForLoadState('domcontentloaded');

    const screenshot1 = await launcher.screenshot({
      name: 'onboarding-start',
      timestamp: false,
    });
    console.log(`Screenshot saved: ${screenshot1.path}`);

    console.log('Starting onboarding flow...');
    await launcher.completeOnboarding({
      password: DEFAULT_PASSWORD,
    });
    console.log('✓ Onboarding complete');

    console.log('Ensuring wallet is unlocked and ready...');
    try {
      await launcher.ensureUnlockedAndReady(DEFAULT_PASSWORD);
      console.log('✓ Wallet is unlocked and ready');
    } catch (readyError) {
      const state = await launcher.getState();
      const failScreenshot = await launcher.screenshot({
        name: 'onboarding-failure',
        timestamp: false,
      });
      console.error('\n❌ FAILURE: Could not reach home state');
      console.error(`   Current screen: ${state.currentScreen}`);
      console.error(`   Current URL: ${state.currentUrl}`);
      console.error(`   Failure screenshot: ${failScreenshot.path}`);
      throw readyError;
    }

    const homePage = new HomePage(page);
    const balance = await homePage.getBalance().catch(() => 'N/A');
    const network = await homePage.getNetworkName().catch(() => 'N/A');
    const address = await homePage.getAccountAddress().catch(() => 'N/A');

    console.log(`Balance: ${balance}`);
    console.log(`Network: ${network}`);
    console.log(`Address: ${address}`);

    const screenshot2 = await launcher.screenshot({
      name: 'onboarding-home-page',
      timestamp: false,
    });
    console.log(`Screenshot saved: ${screenshot2.path}`);

    console.log('\n=== Test Summary ===');
    console.log('✓ Onboarding mode launched successfully');
    console.log('✓ Wallet created via onboarding flow');
    console.log('✓ Home page reached and verified');
    console.log('\n✅ Onboarding Test PASSED!\n');
    testPassed = true;
  } finally {
    console.log('Cleaning up...');
    await launcher.cleanup();
    console.log('Done!');
  }

  if (!testPassed) {
    process.exit(1);
  }
}

testOnboarding().catch(async (error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
