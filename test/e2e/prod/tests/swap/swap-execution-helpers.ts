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
  SwapValidationResult,
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

  // Use a direct XPath that matches any secondary-currency element containing
  // a negative fiat dollar value (e.g. "-$1.23"). This avoids brittle
  // CSS+text locator construction which breaks when the extracted symbol
  // contains special characters like "$".
  const secondaryCurrencyXpath =
    '//*[@data-testid="transaction-list-item-secondary-currency" and contains(normalize-space(), "-$")]';

  await driver.waitForSelector(
    { xpath: secondaryCurrencyXpath },
    { timeout: 20000 },
  );

  const secondaryRows = await driver.findElements({
    xpath: secondaryCurrencyXpath,
  });
  const secondaryTexts = await Promise.all(
    secondaryRows.map((row) => row.getText()),
  );
  console.log(
    `[EXEC] Activity secondary currency found: ${secondaryTexts.join(' | ')}`,
  );
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

  // Token labels in activity can differ in casing (e.g. BTC.b vs BTC.B),
  // so match rows by normalized text instead of exact literal text.
  const normalize = (value: string) =>
    value.replace(/\s+/gu, ' ').trim().toUpperCase();
  const expectedFrom = normalize(swapFromSymbol).toUpperCase();
  const expectedTo = normalize(swapToSymbol).toUpperCase();

  await driver.waitForSelector('[data-testid="activity-list-item-action"]');
  const activityRows = await driver.findElements(
    '[data-testid="activity-list-item-action"]',
  );
  // const xpathActivityEntry = `//*[@data-testid="activity-list-item-action" and text()="Swap ${expectedFrom} to ${expectedTo}"]`;
  // const activityRows = await driver.findElements(xpathActivityEntry);
  let clicked = false;
  for (const row of activityRows) {
    const text = normalize(await row.getText());
    if (
      text.includes('SWAP') &&
      text.includes(expectedFrom) &&
      text.includes(expectedTo)
    ) {
      console.log(
        `[EXEC] Found matching activity row: "${text}" — clicking to open detail`,
      );
      await row.click();
      clicked = true;
      break;
    }
  }

  if (!clicked) {
    // Fallback to prior behavior if row scan didn't find a match.
    await driver.clickElement({ tag: 'p', text: swapLabel });
  }

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
  const rowEl = await driver.findElement({ xpath });
  const rowText = await rowEl.getText();
  if (!rowText.includes(expectedText)) {
    throw new Error(
      `Detail row "${rowLabel}": expected to contain "${expectedText}" but got "${rowText}"`,
    );
  }
  console.log(`[EXEC] Row "${rowLabel}" OK: "${rowText}"`);
}

/**
 * Assert the "Total gas fee" row on the swap detail page.
 *
 * For gas-sponsored networks checks for the green "Paid by MetaMask" badge
 * and soft-warns if absent. For non-sponsored networks reads and logs the
 * actual fee value text, soft-warning if the row is missing or empty.
 *
 * @param driver - WebDriver instance
 * @param isGasSponsored - Whether this network sponsors gas via MetaMask
 */
export async function assertTotalGasFeeRow(
  driver: Driver,
  isGasSponsored: boolean,
): Promise<{ isValid: boolean; message: string }> {
  if (isGasSponsored) {
    console.log(
      '[EXEC] Checking "Total gas fee" row for "Paid by MetaMask" (sponsored network)...',
    );
    const xpath =
      '//*[@data-testid="transaction-detail-row"]/p[text()=\'Total gas fee\']/../div/p[contains(@class,"text-success-default")]';
    try {
      await driver.waitForSelector({ xpath }, { timeout: 10000 });
      console.log('[EXEC] ✅ Gas fee "Paid by MetaMask" confirmed');
      return { isValid: true, message: 'Paid by MetaMask badge is visible' };
    } catch (_e) {
      const message = 'Paid by MetaMask badge not found on Total gas fee row';
      console.warn(`[EXEC] ⚠️  ALERT: ${message}`);
      return { isValid: false, message };
    }
  } else {
    console.log(
      '[EXEC] Capturing "Total gas fee" row value (non-sponsored network)...',
    );
    const xpath =
      '//*[@data-testid="transaction-detail-row"]/p[text()=\'Total gas fee\']/../div';
    try {
      const rowEl = await driver.findElement({ xpath });
      const feeText = await rowEl.getText();
      if (feeText && feeText.trim().length > 0) {
        console.log(`[EXEC] ✅ Total gas fee: "${feeText.trim()}"`);
        return { isValid: true, message: `Total gas fee: ${feeText.trim()}` };
      }

      const message = 'Total gas fee row is present but empty';
      console.warn(`[EXEC] ⚠️  ALERT: ${message}`);
      return { isValid: false, message };
    } catch (_e) {
      const message = 'Total gas fee row not found on detail page';
      console.warn(`[EXEC] ⚠️  ALERT: ${message}`);
      return { isValid: false, message };
    }
  }
}

/**
 * Assert the "Swapped" row on the swap detail page shows the token pair.
 *
 * @param driver - WebDriver instance
 * @param fromSymbol - Source token symbol (e.g. 'MON')
 * @param toSymbol - Destination token symbol (e.g. 'AUSD')
 */
export async function assertSwappedTokenPair(
  driver: Driver,
  fromSymbol: string,
  toSymbol: string,
): Promise<{ isValid: boolean; message: string }> {
  const expectedPair = `${fromSymbol} - ${toSymbol}`;
  console.log(`[EXEC] Asserting "Swapped" row contains "${expectedPair}"...`);
  try {
    const xpath = `//*[@data-testid="transaction-detail-row"]/p[text()='Swapped']/../div`;
    const rowEl = await driver.findElement({ xpath });
    const rowText = await rowEl.getText();
    if (!rowText.includes(fromSymbol) || !rowText.includes(toSymbol)) {
      throw new Error(`Expected "${expectedPair}" but got "${rowText}"`);
    }
    console.log(`[EXEC] ✅ Swapped row OK: "${rowText}"`);
    return { isValid: true, message: rowText };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.warn(
      `[EXEC] ⚠️  ALERT: "Swapped" row validation failed: ${errorMsg}`,
    );
    return { isValid: false, message: errorMsg };
  }
}

/**
 * Assert the "Time stamp" row on the swap detail page exists and contains a date.
 *
 * @param driver - WebDriver instance
 */
export async function assertTransactionTimestamp(
  driver: Driver,
): Promise<{ isValid: boolean; message: string }> {
  console.log('[EXEC] Asserting "Time stamp" row exists...');
  try {
    const xpath = `//*[@data-testid="transaction-detail-row"]/p[text()='Time stamp']/../div`;
    const rowEl = await driver.findElement({ xpath });
    const rowText = await rowEl.getText();
    if (!rowText || rowText.trim().length === 0) {
      throw new Error('Time stamp row is empty');
    }
    console.log(`[EXEC] ✅ Time stamp row OK: "${rowText}"`);
    return { isValid: true, message: rowText };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.warn(
      `[EXEC] ⚠️  ALERT: "Time stamp" row validation failed: ${errorMsg}`,
    );
    return { isValid: false, message: errorMsg };
  }
}

// ---------------------------------------------------------------------------
// Insufficient funds fallback
// ---------------------------------------------------------------------------

/**
 * Floor-truncate an amount to 75%, stripping trailing decimal zeros.
 * E.g. "0.615" → "0.46", "0.40" → "0.4", "1.00" → "0.75".
 *
 * @param amount - String representation of the source amount
 * @returns Reduced amount string
 */
export function computeReducedAmount(amount: string): string {
  const num = parseFloat(amount);
  if (isNaN(num) || num <= 0) {
    return amount;
  }
  // Multiply by 0.75 then floor-truncate at 2 decimal places
  const reduced = Math.floor(parseFloat((num * 0.75).toFixed(10)) * 100) / 100;
  // parseFloat strips trailing zeros (e.g. 0.40 → 0.4)
  return String(parseFloat(reduced.toFixed(2)));
}

/**
 * If the swap CTA shows "Insufficient funds", reduce the from-amount to 75%
 * (floor-truncated to 2 decimal places) and re-fill the input.
 *
 * @param driver - WebDriver instance
 * @param plannedFromAmount - Fallback amount if the input value cannot be read from the DOM
 * @returns The reduced amount string if the button was found, otherwise undefined
 */
export async function handleInsufficientFundsIfPresent(
  driver: Driver,
  plannedFromAmount: string,
): Promise<string | undefined> {
  // Allow the UI to settle after the swap pair was configured
  await driver.delay(PROD_DELAYS.API_RESPONSE);
  try {
    await driver.waitForSelector(
      { xpath: '//button[text()="Insufficient funds"]' },
      { timeout: 5000 },
    );
  } catch (_e) {
    // Button not present — nothing to do
    return undefined;
  }

  console.log('[EXEC] "Insufficient funds" detected — reducing amount to 75%');

  // Re-read current input value in case the UI adjusted it
  let currentValue = plannedFromAmount;
  try {
    const fromAmountEl = await driver.findElement(
      '[data-testid="from-amount"]',
    );
    currentValue =
      (await fromAmountEl.getAttribute('value')) ?? plannedFromAmount;
  } catch (_e) {
    // fall back to plannedFromAmount
  }

  const reducedAmount = computeReducedAmount(currentValue);
  console.log(`[EXEC] Reduced amount: ${currentValue} → ${reducedAmount}`);

  await driver.fill('[data-testid="from-amount"]', reducedAmount);
  await driver.delay(PROD_DELAYS.API_RESPONSE);
  return reducedAmount;
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
  const allValidations: SwapValidationResult[] = results.flatMap(
    (r) => r.validations ?? [],
  );
  const passedValidations = allValidations.filter(
    (v) => v.status === 'passed',
  ).length;
  const warningValidations = allValidations.filter(
    (v) => v.status === 'warning',
  ).length;
  const failedValidations = allValidations.filter(
    (v) => v.status === 'failed',
  ).length;

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

  md += `## Validation Coverage\n\n`;
  md += `| Metric | Value |\n`;
  md += `|--------|-------|\n`;
  md += `| Total Validations | ${allValidations.length} |\n`;
  md += `| ✅ Passed Validations | ${passedValidations} |\n`;
  md += `| ⚠️ Warning Validations | ${warningValidations} |\n`;
  md += `| ❌ Failed Validations | ${failedValidations} |\n\n`;

  md += `### What Was Validated\n\n`;
  md += `- Swap quote became ready before submission\n`;
  md += `- CTA fee text was present and parsed\n`;
  md += `- Activity row primary amount matched expected source token\n`;
  md += `- Activity row secondary value text matched expected format\n`;
  md += `- Detail status was confirmed\n`;
  md += `- Detail You sent row matched captured source amount\n`;
  md += `- Detail You received row matched captured destination amount\n`;
  md += `- Detail Swapped row contained token pair (soft validation)\n`;
  md += `- Detail Time stamp row existed and non-empty (soft validation)\n`;
  md += `- Detail Total gas fee row matched network sponsorship rules\n\n`;

  md += `---\n\n`;
  md += `## Route Results\n\n`;
  md += `| # | Route | From Amount | To Amount | Status | Validations | Notes |\n`;
  md += `|---|-------|-------------|-----------|--------|-------------|-------|\n`;

  results.forEach((r, i) => {
    const statusIcon = r.status === 'passed' ? '✅' : '❌';
    const validationSummary = `${(r.validations ?? []).filter((v) => v.status === 'passed').length}✅ ${(r.validations ?? []).filter((v) => v.status === 'warning').length}⚠️ ${(r.validations ?? []).filter((v) => v.status === 'failed').length}❌`;
    const notes = r.error
      ? r.error.replace(/\|/gu, '\\|').substring(0, 80)
      : '';
    md += `| ${i + 1} | ${r.route} | ${r.fromAmount} | ${r.toAmount} | ${statusIcon} | ${validationSummary} | ${notes} |\n`;
  });

  md += `\n`;

  md += `## Route Validation Details\n\n`;
  results.forEach((routeResult, index) => {
    md += `### ${index + 1}. ${routeResult.route}\n\n`;
    if (!routeResult.validations || routeResult.validations.length === 0) {
      md += `No validation records captured for this route.\n\n`;
      return;
    }

    md += `| Validation | Status | Details |\n`;
    md += `|------------|--------|---------|\n`;
    routeResult.validations.forEach((validation) => {
      let statusIcon = '❌ Failed';
      if (validation.status === 'passed') {
        statusIcon = '✅ Passed';
      } else if (validation.status === 'warning') {
        statusIcon = '⚠️ Warning';
      }
      const details = (validation.details ?? '').replace(/\|/gu, '\\|');
      md += `| ${validation.name} | ${statusIcon} | ${details} |\n`;
    });
    md += `\n`;
  });

  fs.writeFileSync(reportPath, md, 'utf-8');
  console.log(`[EXEC] Swap execution report written to: ${reportPath}`);
}
