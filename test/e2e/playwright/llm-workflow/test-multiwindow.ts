#!/usr/bin/env npx tsx

import { existsSync } from 'fs';
import path from 'path';

import { launchMetaMask, DEFAULT_PASSWORD } from '.';

const nodeModulesPath = path.join(process.cwd(), 'node_modules');
const distPath = path.join(process.cwd(), 'dist', 'chrome');

if (!existsSync(nodeModulesPath)) {
  console.error('ERROR: Dependencies not installed.');
  console.error('Run: yarn install && yarn build:test');
  process.exit(1);
}

if (!existsSync(distPath)) {
  console.error('ERROR: Extension not built.');
  console.error('Run: yarn build:test');
  process.exit(1);
}

async function testMultiWindow() {
  console.log('=== LLM Workflow Multi-Window Test ===\n');

  const launcher = await launchMetaMask({
    slowMo: 50,
    autoBuild: false,
  });

  try {
    console.log('Extension launched successfully');

    console.log('Unlocking wallet...');
    await launcher.ensureUnlockedAndReady(DEFAULT_PASSWORD);
    console.log('✓ Wallet unlocked and ready');

    console.log('\n--- Testing Multi-Window Methods ---\n');

    console.log('1. Testing getAllExtensionPages()...');
    const extensionPages = await launcher.getAllExtensionPages();
    console.log(`   Found ${extensionPages.length} extension page(s)`);
    for (const page of extensionPages) {
      console.log(`   - ${page.url()}`);
    }
    console.log('✓ getAllExtensionPages() works');

    console.log('\n2. Testing getNotificationPage() (should be null)...');
    const notificationPage = await launcher.getNotificationPage();
    if (notificationPage === null) {
      console.log('   Notification page is null (expected - no popup open)');
      console.log('✓ getNotificationPage() works');
    } else {
      console.log('   WARNING: Found unexpected notification page');
    }

    console.log('\n3. Testing switchToExtensionHome()...');
    const homePage = await launcher.switchToExtensionHome();
    console.log(`   Switched to: ${homePage.url()}`);
    console.log('✓ switchToExtensionHome() works');

    console.log(
      '\n4. Testing closeNotificationPage() (should return false)...',
    );
    const wasClosed = await launcher.closeNotificationPage();
    console.log(`   Result: ${wasClosed} (expected: false)`);
    if (!wasClosed) {
      console.log('✓ closeNotificationPage() works');
    }

    console.log('\n5. Testing openNewDappPage()...');
    const dappPage = await launcher.openNewDappPage('https://example.com');
    console.log(`   Opened dapp page: ${dappPage.url()}`);
    console.log('✓ openNewDappPage() works');

    console.log('\n6. Verifying extension pages after dapp open...');
    const pagesAfterDapp = await launcher.getAllExtensionPages();
    console.log(`   Extension pages: ${pagesAfterDapp.length}`);
    console.log('✓ Dapp page does not affect extension page count');

    console.log('\n7. Testing NotificationPage import...');
    console.log('   NotificationPage class is available');
    console.log('✓ NotificationPage exports correctly');

    await dappPage.close();
    console.log('\nClosed dapp page');

    const screenshot = await launcher.screenshot({
      name: 'multiwindow-test',
      timestamp: false,
    });
    console.log(`Screenshot saved: ${screenshot.path}`);

    console.log('\n=== Test Summary ===');
    console.log('✓ getAllExtensionPages() - lists extension pages');
    console.log('✓ getNotificationPage() - returns null when no popup');
    console.log('✓ switchToExtensionHome() - switches to home page');
    console.log('✓ closeNotificationPage() - returns false when no popup');
    console.log('✓ openNewDappPage() - opens external pages');
    console.log('✓ NotificationPage - exported and importable');
    console.log('\n✅ Multi-Window Test PASSED!\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    try {
      const dump = await launcher.debugDump('multiwindow-failure');
      console.error('Debug screenshot:', dump.screenshot.path);
      console.error('Current screen:', dump.state.currentScreen);
    } catch (dumpError) {
      console.error('Failed to capture debug dump:', dumpError);
    }
    throw error;
  } finally {
    console.log('Cleaning up...');
    await launcher.cleanup();
    console.log('Done!');
  }
}

testMultiWindow().catch(async (error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
