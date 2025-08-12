import path from 'path';
import { promises as fs } from 'fs';
import { test as pwTest, expect } from '@playwright/test';

pwTest.describe('Benchmark Setup Test', () => {
  pwTest('should have extension build available', async () => {
    const extensionPath = path.join(process.cwd(), 'dist', 'chrome');

    try {
      await fs.access(extensionPath);
      console.log('✅ Extension build found at:', extensionPath);
    } catch (error) {
      console.log(
        '⚠️  Extension build not found, will be built during benchmark',
      );
    }
  });

  pwTest('should be able to access test dapp', async ({ page }) => {
    const testUrl = 'https://metamask.github.io/test-dapp/';

    try {
      await page.goto(testUrl, { timeout: 30000 });
      await page.waitForLoadState('networkidle');

      // Verify the page loaded correctly
      const title = await page.title();
      expect(title).toContain('E2E Test Dapp');

      console.log('✅ Test dapp accessible:', testUrl);
    } catch (error) {
      console.error('❌ Test dapp not accessible:', error);
      throw error;
    }
  });

  pwTest('should have required environment variables', () => {
    const browserLoads = process.env.BENCHMARK_BROWSER_LOADS || '10';
    const pageLoads = process.env.BENCHMARK_PAGE_LOADS || '10';

    console.log('📊 Benchmark configuration:');
    console.log(`  Browser loads: ${browserLoads}`);
    console.log(`  Page loads per browser: ${pageLoads}`);

    expect(parseInt(browserLoads, 10)).toBeGreaterThan(0);
    expect(parseInt(pageLoads, 10)).toBeGreaterThan(0);
  });
});
