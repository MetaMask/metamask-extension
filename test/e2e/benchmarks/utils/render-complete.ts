import type { Driver } from '../../webdriver/driver';

export const BENCHMARK_ACCOUNT_LIST_RENDER_TIMEOUT = 120000;
export const BENCHMARK_ACCOUNT_LIST_STABLE_FOR = 500;
export const BENCHMARK_SWAP_PAGE_RENDER_TIMEOUT = 60000;

type WaitForFunctionDriver = Pick<Driver, 'waitForFunction'>;

/**
 * Returns whether the account menu has rendered at least the expected number
 * of accounts.
 *
 * Selectors and counts are inlined so this function serializes correctly when
 * passed to `driver.executeScript`, which runs it in the browser context where
 * module-level variables are not in scope.
 *
 * @param expectedCount - The number of account rows expected to be rendered.
 * @returns Whether the account menu render is complete.
 */
export function isAccountListRenderComplete(expectedCount: number): boolean {
  return (
    document.querySelectorAll(
      '[data-testid="account-item"], [data-testid="account-list-item"]',
    ).length >= expectedCount
  );
}

/**
 * Waits for the account menu to render the expected number of accounts.
 *
 * @param options - Wait options.
 * @param options.driver - The webdriver instance.
 * @param options.expectedCount - The number of account rows expected.
 * @param options.timeout - Optional timeout override.
 * @param options.stableFor - Optional stability window in milliseconds.
 */
export async function waitForAccountListRenderComplete({
  driver,
  expectedCount,
  timeout = 10000,
  stableFor = 0,
}: {
  driver: WaitForFunctionDriver;
  expectedCount: number;
  timeout?: number;
  stableFor?: number;
}): Promise<void> {
  await driver.waitForFunction(isAccountListRenderComplete, {
    args: [expectedCount],
    stableFor,
    timeout,
  });
}

/**
 * Returns whether the swap page has finished rendering its initial state.
 * The swap screen reuses the bridge prepare-page test IDs for its source token
 * button and quote details.
 *
 * Selectors, counts, and the editability check are inlined so this function
 * serializes correctly when passed to `driver.executeScript`, which runs it in
 * the browser context where module-level variables are not in scope.
 *
 * @returns Whether the swap page render is complete.
 */
export function isSwapPageRenderComplete(): boolean {
  const fromTokenSelector = document.querySelector<HTMLElement>(
    '[data-testid="bridge-source-button"]',
  );
  const fromAmountInput = document.querySelector<HTMLInputElement>(
    '[data-testid="from-amount"]',
  );
  const fromTokenText = fromTokenSelector?.textContent?.trim() ?? '';

  const hasEditableQuoteInput = Boolean(
    fromAmountInput &&
      !fromAmountInput.disabled &&
      !fromAmountInput.readOnly &&
      (!fromAmountInput.hasAttribute('aria-disabled') ||
        fromAmountInput.getAttribute('aria-disabled') === 'false'),
  );

  const hasRenderedQuoteDetails =
    document.querySelectorAll(
      '[data-testid="network-fees"], [data-testid="minimum-received"], [data-testid="slippage-edit-button"]',
    ).length >= 3;

  return (
    fromTokenText.length > 0 &&
    !fromTokenText.includes('Select token') &&
    hasEditableQuoteInput &&
    hasRenderedQuoteDetails
  );
}

/**
 * Waits for the swap page to finish rendering its initial quote-ready state.
 *
 * @param options - Wait options.
 * @param options.driver - The webdriver instance.
 * @param options.timeout - Optional timeout override.
 */
export async function waitForSwapPageRenderComplete({
  driver,
  timeout = 30000,
}: {
  driver: WaitForFunctionDriver;
  timeout?: number;
}): Promise<void> {
  await driver.waitForFunction(isSwapPageRenderComplete, { timeout });
}
