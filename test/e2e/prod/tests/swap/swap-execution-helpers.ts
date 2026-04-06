/**
 * Shared helper functions for swap execution tests
 *
 * Covers:
 * - Resolving tokens by symbol from a fetched tokenlist
 * - Importing a single funded account for swap balance
 * - Waiting for quote readiness and asserting CTA text
 * - Submitting swaps and waiting for confirmation
 * - Activity list assertions for confirmed swaps
 * - Detail-page assertions (status, You sent/received, gas fee)
 * - Simple markdown report generation
 */

import * as fs from 'fs';
import * as path from 'path';
import { Driver } from '../../../webdriver/driver';
import { PROD_DELAYS } from '../../helpers/prod-test-helpers';
import HomePage from '../../../page-objects/pages/home/homepage';
import AccountListPage from '../../../page-objects/pages/account-list-page';
import ActivityListPage from '../../../page-objects/pages/home/activity-list';
import {
  Token,
  NetworkSwapConfig,
  SwapRouteResult,
  SwapExecutionReport,
} from './network-swap-config';
import { navigateBack } from './swap-quotation-helpers';

// ---------------------------------------------------------------------------
// Token resolution
// ---------------------------------------------------------------------------

/**
 * Filter a fetched token list down to the requested symbols, preserving order.
 *
 * @param tokens - Full list returned by importTokensFromTokenlist
 * @param symbols - Ordered list of symbols to resolve (e.g. ['AUSD', 'AZND', 'BTC.b'])
 * @returns Tokens matching each symbol in the given order
 * @throws Error if any symbol is not found in the list
 */
export function resolveTokensBySymbols(
  tokens: Token[],
  symbols: string[],
): Token[] {
  const resolved: Token[] = [];
  for (const symbol of symbols) {
    const found = tokens.find((t) => t.symbol === symbol);
    if (!found) {
      throw new Error(
        `Token symbol "${symbol}" not found in fetched tokenlist. ` +
          `Available symbols: ${tokens.map((t) => t.symbol).join(', ')}`,
      );
    }
    resolved.push(found);
  }
  return resolved;
}

// ---------------------------------------------------------------------------
// Account import
// ---------------------------------------------------------------------------

/**
 * Import a single funded account using a private key and make it active.
 *
 * Follows the "Import Account 1" pattern from the send parameterized spec.
 * The account keeps the default MetaMask-assigned imported account name.
 *
 * @param driver - WebDriver instance
 * @param privateKey - Private key of the funded account to import
 */
export async function importSingleFundedAccount(
  driver: Driver,
  privateKey: string,
): Promise<void> {
  console.log('[EXEC] Importing funded account for swap...');
  const homePage = new HomePage(driver);

  await homePage.headerNavbar.openAccountMenu();

  const accountListPage = new AccountListPage(driver);
  await accountListPage.checkPageIsLoaded();

  // Import the funded account; keep the default name assigned by MetaMask
  await accountListPage.addNewImportedAccount(privateKey, undefined, {
    isMultichainAccountsState2Enabled: true,
  });
  console.log('[EXEC] Funded account imported successfully');

  await accountListPage.closeMultichainAccountsPage();

  // Allow account state to settle before proceeding
  await driver.delay(PROD_DELAYS.API_RESPONSE * 2);
  await homePage.checkPageIsLoaded();
  console.log('[EXEC] Imported account is now active');
}

// ---------------------------------------------------------------------------
// Quote readiness
// ---------------------------------------------------------------------------

/**
 * Wait for the swap CTA button to become interactive (not disabled).
 *
 * @param driver - WebDriver instance
 * @param timeout - Max wait in ms (default 30 s)
 */
export async function waitForSwapQuoteReady(
  driver: Driver,
  timeout = 30000,
): Promise<void> {
  console.log('[EXEC] Waiting for swap quote to be ready...');
  // :not([disabled]) ensures the button is enabled (not just present)
  await driver.waitForSelector(
    '[data-testid="bridge-cta-button"]:not([disabled])',
    { timeout },
  );
  console.log('[EXEC] Swap quote is ready');
}

// ---------------------------------------------------------------------------
// CTA fee text assertion
// ---------------------------------------------------------------------------

/**
 * Assert that the CTA info text contains the expected MetaMask fee line.
 *
 * @param driver - WebDriver instance
 */
export async function assertCtaFeeText(driver: Driver): Promise<void> {
  console.log('[EXEC] Asserting CTA fee text...');
  const ctaInfoText = '[data-testid="bridge-cta-info-text"]';
  const expectedFee = 'Includes 0.875% MM fee.';
  await driver.waitForSelector({
    css: ctaInfoText,
    text: expectedFee,
  });
  console.log(`[EXEC] CTA fee text confirmed: "${expectedFee}"`);
}

// ---------------------------------------------------------------------------
// Amount capture
// ---------------------------------------------------------------------------

/**
 * Capture the current from-amount and to-amount input values on the swap page.
 *
 * @param driver - WebDriver instance
 * @returns Object with fromAmount and toAmount strings
 */
export async function captureSwapAmounts(
  driver: Driver,
): Promise<{ fromAmount: string; toAmount: string }> {
  const fromAmountEl = await driver.findElement('[data-testid="from-amount"]');
  const toAmountEl = await driver.findElement('[data-testid="to-amount"]');

  const fromAmount = (await fromAmountEl.getAttribute('value')) ?? '';
  const toAmount = (await toAmountEl.getAttribute('value')) ?? '';

  console.log(`[EXEC] Captured amounts — from: ${fromAmount}, to: ${toAmount}`);
  return { fromAmount, toAmount };
}

// ---------------------------------------------------------------------------
// Swap submission
// ---------------------------------------------------------------------------

/**
 * Click the swap CTA button, navigate back to home, then wait for the
 * transaction to appear as a confirmed swap entry in the activity list.
 *
 * @param driver - WebDriver instance
 * @param swapFromSymbol - Source token symbol (for activity-list label)
 * @param swapToSymbol - Destination token symbol (for activity-list label)
 * @param timeout - Max wait for confirmation in ms (default 120 s)
 */
export async function submitSwapAndWaitForConfirmed(
  driver: Driver,
  swapFromSymbol: string,
  swapToSymbol: string,
  timeout = 120000,
): Promise<void> {
  console.log(`[EXEC] Submitting swap ${swapFromSymbol} → ${swapToSymbol}...`);
  await driver.clickElement('[data-testid="bridge-cta-button"]');

  // Allow the transaction to be submitted before navigating
  await driver.delay(PROD_DELAYS.API_RESPONSE * 2);

  // Navigate back to home (the bridge confirmation view stays visible;
  // multiple back-button clicks return to the home activity view)
  await recoverToHome(driver);

  // Open the activity tab and wait for the confirmed swap entry
  const activityListPage = new ActivityListPage(driver);
  await activityListPage.openActivityTab();

  const swapLabel = `Swap ${swapFromSymbol} to ${swapToSymbol}`;
  console.log(
    `[EXEC] Waiting for confirmed activity: "${swapLabel}" (timeout: ${timeout}ms)`,
  );
  await driver.waitForSelector({ tag: 'p', text: swapLabel }, { timeout });
  console.log(`[EXEC] Swap activity entry confirmed`);
}

// ---------------------------------------------------------------------------
// Activity list assertions
// ---------------------------------------------------------------------------

/**
 * Assert the primary-currency field on the latest swap activity entry.
 *
 * @param driver - WebDriver instance
 * @param expectedText - Expected text (e.g. "-20 MON")
 */
export async function assertActivityPrimaryCurrency(
  driver: Driver,
  expectedText: string,
): Promise<void> {
  console.log(`[EXEC] Asserting activity primary currency: "${expectedText}"`);
  await driver.waitForSelector({
    css: '[data-testid="transaction-list-item-primary-currency"]',
    text: expectedText,
  });
}

/**
 * Assert the secondary-currency field on the latest swap activity entry.
 *
 * @param driver - WebDriver instance
 * @param expectedText - Expected text (e.g. "+12.34 AUSD")
 */
export async function assertActivitySecondaryCurrency(
  driver: Driver,
  expectedText: string,
): Promise<void> {
  console.log(
    `[EXEC] Asserting activity secondary currency: "${expectedText}"`,
  );
  await driver.waitForSelector({
    css: '[data-testid="transaction-list-item-secondary-currency"]',
    text: expectedText,
  });
}

// ---------------------------------------------------------------------------
// Open swap detail record
// ---------------------------------------------------------------------------

/**
 * Click the confirmed swap activity entry to open the detail page.
 *
 * @param driver - WebDriver instance
 * @param swapFromSymbol - Source token symbol
 * @param swapToSymbol - Destination token symbol
 */
export async function openLatestSwapActivityRecord(
  driver: Driver,
  swapFromSymbol: string,
  swapToSymbol: string,
): Promise<void> {
  const swapLabel = `Swap ${swapFromSymbol} to ${swapToSymbol}`;
  console.log(`[EXEC] Opening swap detail for: "${swapLabel}"`);
  await driver.clickElement({ tag: 'p', text: swapLabel });
  // Wait for detail page URL
  await driver.waitForUrlContaining({ url: '/cross-chain/tx-details' });
  console.log('[EXEC] Swap detail page loaded');
}

// ---------------------------------------------------------------------------
// Detail page assertions
// ---------------------------------------------------------------------------

/**
 * Assert that the swap status badge shows "confirmed".
 *
 * @param driver - WebDriver instance
 */
export async function assertSwapDetailConfirmed(driver: Driver): Promise<void> {
  console.log('[EXEC] Asserting swap detail status = confirmed...');
  await driver.waitForSelector({
    css: '[data-testid="bridge-transaction-details-tx-status"]',
    text: 'confirmed',
  });
  console.log('[EXEC] Status confirmed');
}

/**
 * Assert text content in a labelled transaction-detail-row.
 *
 * @param driver - WebDriver instance
 * @param rowLabel - Row label text (e.g. 'You sent', 'You received', 'Total gas fee')
 * @param expectedText - Text that must appear somewhere in the row value div
 */
export async function assertDetailRow(
  driver: Driver,
  rowLabel: string,
  expectedText: string,
): Promise<void> {
  console.log(
    `[EXEC] Asserting detail row "${rowLabel}" contains "${expectedText}"`,
  );
  const xpath = `//*[@data-testid="transaction-detail-row"]/p[text()='${rowLabel}']/../div`;
  const rowEl = await driver.findElement(xpath);
  const rowText = await rowEl.getText();
  if (!rowText.includes(expectedText)) {
    throw new Error(
      `Detail row "${rowLabel}": expected to contain "${expectedText}" but got "${rowText}"`,
    );
  }
  console.log(`[EXEC] Row "${rowLabel}" OK: "${rowText}"`);
}

/**
 * Assert the "Total gas fee" row shows "Paid by MetaMask" text.
 *
 * @param driver - WebDriver instance
 */
export async function assertGasFeeRowPaidByMetaMask(
  driver: Driver,
): Promise<void> {
  console.log('[EXEC] Asserting gas fee row "Paid by MetaMask"...');
  const xpath =
    '//*[@data-testid="transaction-detail-row"]/p[text()=\'Total gas fee\']/../div/p[contains(@class,"text-success-default")]';
  await driver.waitForSelector(xpath);
  console.log('[EXEC] Gas fee "Paid by MetaMask" confirmed');
}

// ---------------------------------------------------------------------------
// Navigation helpers
// ---------------------------------------------------------------------------

/**
 * Navigate from the swap detail page back to the home activity view.
 *
 * @param driver - WebDriver instance
 */
export async function navigateBackToHome(driver: Driver): Promise<void> {
  console.log('[EXEC] Navigating back to home...');
  await navigateBack(driver, { timeout: 5000 });
  await driver.waitForSelector(
    '[data-testid="account-overview__activity-tab"]',
  );
  console.log('[EXEC] Home activity tab visible');
}

/**
 * Recover from a broken state by navigating back until the home activity tab
 * is visible, or up to maxAttempts back-button clicks.
 *
 * @param driver - WebDriver instance
 * @param maxAttempts - Maximum back-button clicks before giving up (default 4)
 * @returns true if recovered to home, false otherwise
 */
export async function recoverToHome(
  driver: Driver,
  maxAttempts = 4,
): Promise<boolean> {
  const homeActivityTab = '[data-testid="account-overview__activity-tab"]';
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await driver.waitForSelector(homeActivityTab, { timeout: 3000 });
      return true;
    } catch (_e) {
      // not home yet
    }
    await navigateBack(driver, { timeout: 2000 });
    await driver.delay(1000);
  }
  try {
    await driver.waitForSelector(homeActivityTab, { timeout: 3000 });
    return true;
  } catch (_e) {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Report generation
// ---------------------------------------------------------------------------

/**
 * Generate a simple markdown execution report, writing it to the swap test
 * folder and removing any stale previous execution-report files.
 *
 * @param results - Per-route results collected during the run
 * @param networkConfig - Network config for header metadata
 */
export function generateSwapExecutionReport(
  results: SwapRouteResult[],
  networkConfig: NetworkSwapConfig,
): void {
  const reportDir = path.join(
    process.cwd(),
    'test',
    'e2e',
    'prod',
    'tests',
    'swap',
  );
  const reportFileName = 'swap-execution-report.md';
  const reportPath = path.join(reportDir, reportFileName);

  // Remove any stale execution reports
  try {
    const existingFiles = fs.readdirSync(reportDir);
    const stale = existingFiles.filter(
      (f) => f.startsWith('swap-execution-report') && f.endsWith('.md'),
    );
    stale.forEach((f) => {
      try {
        fs.unlinkSync(path.join(reportDir, f));
      } catch (_e) {
        // best-effort
      }
    });
  } catch (_e) {
    // directory may not exist yet
  }

  try {
    fs.mkdirSync(reportDir, { recursive: true });
  } catch (_e) {
    // already exists
  }

  const passed = results.filter((r) => r.status === 'passed').length;
  const failed = results.filter((r) => r.status === 'failed').length;
  const timestamp = new Date().toISOString();

  const report: SwapExecutionReport = {
    networkName: networkConfig.networkName,
    chainId: networkConfig.chainId,
    timestamp,
    totalRoutes: results.length,
    passedRoutes: passed,
    failedRoutes: failed,
    routeResults: results,
  };

  let md = `# Swap Execution Report\n\n`;
  md += `**Network:** ${report.networkName} (Chain ID: ${report.chainId})\n`;
  md += `**Generated:** ${new Date(timestamp).toLocaleString()}\n\n`;
  md += `---\n\n`;

  md += `## Summary\n\n`;
  md += `| Metric | Value |\n`;
  md += `|--------|-------|\n`;
  md += `| Total Routes | ${report.totalRoutes} |\n`;
  md += `| ✅ Passed | ${report.passedRoutes} |\n`;
  md += `| ❌ Failed | ${report.failedRoutes} |\n\n`;

  md += `---\n\n`;
  md += `## Route Results\n\n`;
  md += `| # | Route | From Amount | To Amount | Status | Notes |\n`;
  md += `|---|-------|-------------|-----------|--------|-------|\n`;

  results.forEach((r, i) => {
    const statusIcon = r.status === 'passed' ? '✅' : '❌';
    const notes = r.error ? r.error.replace(/\|/g, '\\|').substring(0, 80) : '';
    md += `| ${i + 1} | ${r.route} | ${r.fromAmount} | ${r.toAmount} | ${statusIcon} | ${notes} |\n`;
  });

  md += `\n`;

  fs.writeFileSync(reportPath, md, 'utf-8');
  console.log(`[EXEC] Swap execution report written to: ${reportPath}`);
}
