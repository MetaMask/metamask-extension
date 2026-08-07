import { PERPS_ACTIVITY_ROUTE } from '../../../../ui/helpers/constants/routes';
import type { Driver } from '../../webdriver/driver';
import { PerpsActivityPage } from '../pages/perps/perps-activity-page';

/**
 * After a simulated position change in E2E, pushes a `userFills` snapshot via
 * `pushUserFills`, opens Perps Activity, and asserts a trade row appears with
 * the expected title fragment.
 *
 * @param options
 * @param options.driver
 * @param options.pushUserFills
 * @param options.expectedTitleContains
 */
export async function assertPerpsActivityShowsCloseFill({
  driver,
  pushUserFills,
  expectedTitleContains,
}: {
  driver: Driver;
  pushUserFills: () => void;
  /** Substring of the trade title, e.g. `Closed long` or `Closed short`. */
  expectedTitleContains: string;
}): Promise<void> {
  pushUserFills();

  // Open Perps Activity by route rather than through Perps home. Home's
  // "See All" only renders once Recent Activity has history, and Recent
  // Activity reuses a coalesced snapshot taken at startup, before the fill
  // exists — so reaching Activity that way depends on the pushed frame winning
  // a race against navigation. This page fetches with `forceFreshOnMount`,
  // which drops that snapshot and queries `userFills` on the wire, where the
  // mock replays whatever `pushUserFills` last sent.
  await driver.openNewURL(
    `${driver.extensionUrl}/home.html#${PERPS_ACTIVITY_ROUTE}`,
  );

  const activityPage = new PerpsActivityPage(driver);
  await activityPage.checkPageIsLoaded();
  await activityPage.waitForAnyTransactionCard();
  await activityPage.waitForActivityTradeTitleContaining(expectedTitleContains);
}
