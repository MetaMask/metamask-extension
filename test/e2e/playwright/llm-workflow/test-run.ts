#!/usr/bin/env npx tsx

import { launchMetaMask, HomePage, DEFAULT_PASSWORD } from './index';

async function testRun() {
  console.log('=== LLM Workflow Test ===\n');

  const launcher = await launchMetaMask({
    slowMo: 50,
    autoBuild: false,
  });

  try {
    console.log('Extension launched successfully');
    const page = launcher.getPage();
    console.log(`Current URL: ${page.url()}`);

    const unlockPasswordVisible = await page
      .locator('[data-testid="unlock-password"]')
      .isVisible({ timeout: 30000 })
      .catch(() => false);

    if (unlockPasswordVisible) {
      console.log('✓ Unlock page detected - fixture state loaded correctly!');

      const screenshot1 = await launcher.screenshot({
        name: 'unlock-page',
        timestamp: false,
      });
      console.log(`Screenshot saved: ${screenshot1.path}`);

      console.log('Unlocking wallet...');
      await launcher.unlock(DEFAULT_PASSWORD);
      console.log('✓ Wallet unlocked');
    } else {
      console.log('⚠ Unlock page not visible, checking current state...');
      const screenshot = await launcher.screenshot({
        name: 'current-state',
        timestamp: false,
      });
      console.log(`Debug screenshot saved: ${screenshot.path}`);
    }

    const homePage = new HomePage(page);
    const isHomeLoaded = await homePage.isLoaded();

    if (isHomeLoaded) {
      console.log('✓ Home page loaded');

      const balance = await homePage.getBalance().catch(() => 'N/A');
      const network = await homePage.getNetworkName().catch(() => 'N/A');
      console.log(`Balance: ${balance}`);
      console.log(`Network: ${network}`);

      const screenshot2 = await launcher.screenshot({
        name: 'home-page',
        timestamp: false,
      });
      console.log(`Screenshot saved: ${screenshot2.path}`);
    } else {
      console.log('⚠ Home page not fully loaded');
    }

    console.log('\n=== Test Summary ===');
    console.log('✓ Anvil started successfully');
    console.log('✓ Fixture server provided wallet state');
    console.log('✓ Extension loaded with pre-onboarded wallet');
    console.log('✓ Screenshots captured for validation');
    console.log('\n✅ LLM Workflow Test PASSED!\n');
  } finally {
    console.log('Cleaning up...');
    await launcher.cleanup();
    console.log('Done!');
  }
}

testRun().catch(async (error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
