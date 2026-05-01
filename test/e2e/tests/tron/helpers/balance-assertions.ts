import { strict as assert } from 'assert';
import { Driver } from '../../../webdriver/driver';

/**
 * Strips trailing symbol, leading +/-, and commas from a displayed amount string.
 * Examples: "5.0 TRX" -> 5.0, "+0.295 USDT" -> 0.295, "1,234.56 USDT" -> 1234.56
 *
 * @param displayed - The raw text from the UI
 * @returns The numeric value
 */
export function parseDisplayedAmount(displayed: string): number {
  const cleaned = displayed
    .replace(/[+,]/gu, '')
    .replace(/\s+[A-Z]+$/u, '')
    .trim();
  const value = Number(cleaned);
  if (Number.isNaN(value)) {
    throw new Error(`Could not parse displayed amount: "${displayed}"`);
  }
  return value;
}

/**
 * Finds a token row by symbol text and asserts its displayed balance is within
 * [expected - tolerance, expected + tolerance].
 *
 * @param opts - Options
 * @param opts.driver - WebDriver instance
 * @param opts.symbol - Token symbol or name to search for in the row text
 * @param opts.expected - Expected numeric balance
 * @param opts.tolerance - Maximum allowed absolute deviation
 */
export async function checkBalanceWithinTolerance({
  driver,
  symbol,
  expected,
  tolerance,
}: {
  driver: Driver;
  symbol: string;
  expected: number;
  tolerance: number;
}): Promise<void> {
  const row = await driver.findElement({
    css: '[data-testid="multichain-token-list-button"]',
    text: symbol,
  });
  const text = await row.getText();
  const match = text.match(/(\d[\d,]*\.?\d*)/u);
  if (!match) {
    throw new Error(`No amount found in ${symbol} row: "${text}"`);
  }
  const actual = parseDisplayedAmount(match[1]);
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${symbol} balance ${actual} not within ±${tolerance} of ${expected}`,
  );
}
