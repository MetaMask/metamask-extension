import { Driver } from '../../webdriver/driver';

const SWAP_URL_PATH = '/cross-chain/swaps/prepare-bridge-page';
const BASIC_FUNCTIONALITY_OFF_PATH = '/basic-functionality-off';

/** Path for the Swaps prepare-bridge route (e.g. for URL assertions). */
export const swapUrlPath = SWAP_URL_PATH;

/**
 * Opens the Swaps prepare-bridge route. When Basic functionality is off,
 * the app redirects to the basic-functionality-off page; this function waits
 * for that redirect.
 *
 * @param driver - The webdriver instance.
 */
export async function openSwapsPageAndWaitForRedirectToBasicFunctionalityOffPage(
  driver: Driver,
): Promise<void> {
  await driver.openNewURL(
    `${driver.extensionUrl}/home.html#${SWAP_URL_PATH}?swaps=true`,
  );
  await driver.waitForUrl({
    url: `${driver.extensionUrl}/home.html#${BASIC_FUNCTIONALITY_OFF_PATH}`,
  });
}
