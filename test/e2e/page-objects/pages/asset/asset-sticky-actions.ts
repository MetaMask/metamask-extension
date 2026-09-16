import { Driver } from '../../../webdriver/driver';

/**
 * Sticky Buy / Swap CTA bar on the Token Detail Page V2.
 *
 * Screen: `#/asset/:chainId/:asset?/:id?`
 * Owns: presence of the sticky footer and its Buy / Swap buttons, plus
 * asserting the bar stays pinned to the bottom of the viewport after scroll.
 * Boundaries: does not own destinations of Buy / Swap clicks.
 *
 * @see ui/pages/asset/components/asset-sticky-actions.tsx
 */
class AssetStickyActions {
  private driver: Driver;

  private readonly scrollContainer =
    '[data-testid="asset-page-scroll-container"]';

  private readonly stickyActions = '[data-testid="asset-sticky-actions"]';

  private readonly stickyBuy = '[data-testid="asset-sticky-buy"]';

  private readonly stickySwap = '[data-testid="asset-sticky-swap"]';

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Waits for the sticky Buy and Swap CTAs to be present.
   */
  async checkPageIsLoaded(): Promise<void> {
    console.log('Check asset sticky actions are loaded');
    await this.driver.waitForSelector(this.stickyActions);
    await this.driver.waitForSelector(this.stickyBuy);
    await this.driver.waitForSelector(this.stickySwap);
  }

  /**
   * Asserts the sticky bar is pinned near the bottom of the visual viewport.
   * Uses a small tolerance so scrollbar / safe-area padding do not flake.
   */
  async checkPinnedToViewportBottom(): Promise<void> {
    console.log('Check asset sticky actions are pinned to the viewport bottom');
    await this.driver.wait(async () => {
      const isPinned = await this.driver.executeScript(`
        const bar = document.querySelector('[data-testid="asset-sticky-actions"]');
        if (!bar) {
          return false;
        }
        const rect = bar.getBoundingClientRect();
        return Math.abs(rect.bottom - window.innerHeight) < 8 && rect.top >= 0;
      `);
      return Boolean(isPinned);
    }, this.driver.timeout);
  }

  /**
   * Scrolls the Token Detail Page scrollport to the bottom, far enough that a
   * non-sticky footer would leave the viewport.
   */
  async scrollToBottom(): Promise<void> {
    console.log('Scroll the token detail page to the bottom');
    await this.driver.waitForSelector(this.scrollContainer);
    await this.driver.executeScript(`
      const scroller = document.querySelector('[data-testid="asset-page-scroll-container"]');
      if (scroller) {
        scroller.scrollTo(0, scroller.scrollHeight);
      }
    `);
  }
}

export default AssetStickyActions;
