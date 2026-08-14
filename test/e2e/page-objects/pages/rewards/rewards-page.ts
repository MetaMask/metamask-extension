import { Driver } from '../../../webdriver/driver';

/**
 * Rewards onboarding modal shown after the rewards deep-link route.
 *
 * Screen: `#/rewards` redirects to home and surfaces the rewards modal
 * (`data-testid="rewards-modal"`).
 * Owns: waiting for the rewards modal to be loaded.
 * Boundaries: modal presence only. Rewards deeplink routing and referral
 * handling live in the rewards page/container; home chrome is `HomePage`.
 * Related: home-hosted rewards onboarding entry.
 *
 * @see ui/components/app/rewards/onboarding/RewardsModal.tsx
 * @see ui/pages/rewards/index.tsx
 */
export default class RewardsPage {
  protected readonly driver: Driver;

  private readonly rewardsModal = '[data-testid="rewards-modal"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  async checkPageIsLoaded(): Promise<void> {
    await this.driver.waitForSelector(this.rewardsModal);
  }
}
