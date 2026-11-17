import { HOMEPAGE_BALANCE_ASSERTION_TIMEOUT_MS } from '../../../constants';
import { Driver } from '../../../webdriver/driver';
import { login } from '../../../page-objects/flows/login.flow';
import { selectStellarNetwork } from '../../../page-objects/flows/stellar-network.flow';
import HomePage from '../../../page-objects/pages/home/homepage';
import TokensTab from '../../../page-objects/pages/home/tokens-tab';
import { XLM_BALANCE_DISPLAY } from '../../stellar/mocks/common-stellar';

/** Same timeout assets E2E uses for Stellar token rows after refresh. */
export const STELLAR_SEND_ASSET_LIST_TIMEOUT_MS = 30_000;

/**
 * Types a Stellar recipient into the Send form.
 *
 * Prefer typing over `pasteIntoField`: clipboard paste does not reliably update
 * the controlled recipient input in local test builds.
 *
 * @param driver - WebDriver instance.
 * @param recipientAddress - Stellar address (G…).
 * @param options - Optional wait behavior.
 * @param options.validAddress - When true, wait for the formatted recipient row.
 */
export async function fillStellarRecipient(
  driver: Driver,
  recipientAddress: string,
  { validAddress = true }: { validAddress?: boolean } = {},
): Promise<void> {
  await driver.fill({ testId: 'recipient-address-input' }, recipientAddress);
  if (validAddress) {
    await driver.waitForSelector('.break-all');
  }
}

/**
 * Types a Stellar send amount.
 *
 * Same paste flake as the recipient field: `SendPage.fillAmount` uses
 * `pasteIntoField`, which often leaves the amount at `0` / empty locally.
 *
 * @param driver - WebDriver instance.
 * @param amount - Amount string to type.
 */
export async function fillStellarAmount(
  driver: Driver,
  amount: string,
): Promise<void> {
  await driver.fill({ testId: 'send-amount-input' }, amount);
}

/**
 * Same landing path as check-balance / assets: login → home → Stellar → refresh.
 *
 * @param driver - WebDriver instance.
 */
export async function landOnStellarSendHome(driver: Driver): Promise<HomePage> {
  await login(driver, { validateBalance: false });
  const homePage = new HomePage(driver);
  await homePage.checkPageIsLoaded();
  await selectStellarNetwork(driver);
  await driver.refresh();
  await homePage.checkPageIsLoaded();
  return homePage;
}

/**
 * Assert funded XLM the same way check-balance does (homepage main balance).
 *
 * @param homePage - Loaded home page.
 */
export async function checkStellarHomeXlmBalance(
  homePage: HomePage,
): Promise<void> {
  await homePage.checkExpectedBalanceIsDisplayed({
    expectedBalance: XLM_BALANCE_DISPLAY,
    timeout: HOMEPAGE_BALANCE_ASSERTION_TIMEOUT_MS,
  });
}

/**
 * Assert USDC in the token list the same way assets E2E does.
 *
 * @param driver - WebDriver instance.
 * @param amount - Expected list amount string.
 */
export async function checkStellarUsdcInTokenList(
  driver: Driver,
  amount: string = '25 USDC',
): Promise<void> {
  const tokensTab = new TokensTab(driver);
  await tokensTab.checkTokenExistsInList('USD Coin', amount, {
    timeout: STELLAR_SEND_ASSET_LIST_TIMEOUT_MS,
  });
}
