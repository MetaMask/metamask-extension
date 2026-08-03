import { Driver } from '../../webdriver/driver';
import TokensTab from '../pages/home/tokens-tab';
import NetworkManager from '../pages/network-manager';
import { dismissVisibleToasts } from './toast.flow';

// TODO: Replace this fixed delay with a deterministic wait. Non-EVM accounts (Tron, Bitcoin) are created
// asynchronously at runtime via BIP44 stage-2 alignment, and the Snap only kicks
// off its balance fetch when the network is switched while it is fully ready. If
// we switch too early, that trigger is missed and nothing re-fetches the balance
// afterwards.
// Solana is intentionally excluded as it's seeded in the fixtures vault
const NON_EVM_SNAP_READY_DELAY_MS = 10_000;
const NON_EVM_NETWORKS_NEEDING_DELAY = ['Tron', 'Bitcoin'];

export const switchToNetworkFromNetworkSelect = async (
  driver: Driver,
  networkCategory: string,
  networkName: string,
) => {
  console.log(
    `Switching to network: ${networkName} in category: ${networkCategory}`,
  );
  const tokensTab = new TokensTab(driver);
  const networkManager = new NetworkManager(driver);

  if (NON_EVM_NETWORKS_NEEDING_DELAY.includes(networkName)) {
    await driver.delay(NON_EVM_SNAP_READY_DELAY_MS);
  }

  // Pending tx toasts can appear during the snap delay; dismiss before opening
  // the picker so they cannot intercept tab/network clicks (Perps pattern).
  await dismissVisibleToasts(driver, 5_000);
  await tokensTab.openNetworksFilter();
  await dismissVisibleToasts(driver);
  await networkManager.selectTab(networkCategory);
  await dismissVisibleToasts(driver);
  await networkManager.selectNetworkByNameWithWait(networkName);
};

export async function waitForNetworkManagerBackdropToClear(
  driver: Driver,
): Promise<void> {
  await dismissVisibleToasts(driver);
  const backdropStillPresent = await driver.isElementPresentAndVisible(
    '.modal__backdrop',
    1_000,
  );
  if (backdropStillPresent) {
    // Selection sometimes leaves the modal open (e.g. toast raced the click).
    // Close it explicitly so later home-page clicks are not blocked.
    const networkManager = new NetworkManager(driver);
    try {
      await networkManager.closeNetworkManager();
    } catch {
      await dismissVisibleToasts(driver);
      await networkManager.closeNetworkManager();
    }
  }
  await driver.assertElementNotPresent('.modal__backdrop', { timeout: 15_000 });
}
