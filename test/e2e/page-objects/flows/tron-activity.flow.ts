import { Driver } from '../../webdriver/driver';
import ActivityTab from '../pages/home/activity-tab';
import NonEvmHomepage from '../pages/home/non-evm-homepage';
import { selectTronNetwork } from './tron-network.flow';

/**
 * Selects the Tron network (waiting for the snap and account readiness) and
 * opens the activity list on the unlocked wallet's homepage.
 *
 * Assumes the wallet is already logged in; the spec is responsible for logging
 * in, keeping this flow reusable regardless of the wallet's lock state.
 *
 * @param driver - The WebDriver instance.
 * @returns The loaded activity tab.
 */
export async function openTronActivityList(
  driver: Driver,
): Promise<ActivityTab> {
  await selectTronNetwork(driver);

  const homePage = new NonEvmHomepage(driver);
  await homePage.checkPageIsLoaded();
  await homePage.goToActivityList();

  const activityTab = new ActivityTab(driver);
  await activityTab.checkPageIsLoaded();
  return activityTab;
}
