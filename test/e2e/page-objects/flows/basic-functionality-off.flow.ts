import {
  BASIC_FUNCTIONALITY_OFF_ROUTE,
  SWAP_PATH,
} from '../../../../ui/helpers/constants/routes';
import { Driver } from '../../webdriver/driver';

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
    `${driver.extensionUrl}/home.html#${SWAP_PATH}?swaps=true`,
  );
  await driver.waitForUrl({
    url: `${driver.extensionUrl}/home.html#${BASIC_FUNCTIONALITY_OFF_ROUTE}`,
  });
}
