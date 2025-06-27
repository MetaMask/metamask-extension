import { shortenAddress } from '../../../ui/helpers/utils/util';
import { Driver } from '../webdriver/driver';

export type RawLocator =
  | string
  | { css?: string; text?: string }
  | { tag: string; text: string };

/**
 * Checks if an account is displayed
 *
 * @param driver - The driver to use
 * @param account - The account to check
 * @param options - Options for the check
 * @param options.isCaseSensitive - Whether to check the account name in a case-sensitive manner. Defaults to false.
 * @returns void
 */
export async function isAccountDisplayed(
  driver: Driver,
  account: string,
  options = {
    isCaseSensitive: false,
  },
): Promise<void> {
  const accountShort = shortenAddress(account);

  if (options.isCaseSensitive) {
    await driver.waitForSelector({
      text: accountShort,
      tag: 'p',
    });
    return;
  }

  await driver.waitForSelector({
    xpath: `//p[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${accountShort.toLowerCase()}')]`,
  });
}
