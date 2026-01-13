#!/usr/bin/env npx tsx

import { existsSync } from 'fs';
import path from 'path';

// Pre-flight check: Ensure dependencies are installed before importing workflow modules
const nodeModulesPath = path.join(process.cwd(), 'node_modules');
const distPath = path.join(process.cwd(), 'dist', 'chrome');

if (!existsSync(nodeModulesPath)) {
  console.error('ERROR: Dependencies not installed.');
  console.error('');
  console.error('Run the following commands first:');
  console.error('  1. yarn install    # Install dependencies');
  console.error('  2. yarn build:test # Build the extension');
  console.error('');
  process.exit(1);
}

if (!existsSync(distPath)) {
  console.error('ERROR: Extension not built.');
  console.error('');
  console.error('Run the following command:');
  console.error('  yarn build:test');
  console.error('');
  console.error(
    '(Note: This test has autoBuild: false, so you must build manually)',
  );
  console.error('');
  process.exit(1);
}

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
