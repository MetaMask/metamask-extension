import { Key } from 'selenium-webdriver';
import { Driver } from '../../../webdriver/driver';
import { regularDelayMs } from '../../../helpers';

type PromptType = 'versionUpdate' | 'unsupportedVersion';

type BackgroundState = {
  allPointsInsideTakeover: boolean;
  takeoverMounted: boolean;
};

const TAKEOVER_TEST_ID = 'extension-update-takeover';

async function readBackgroundState(driver: Driver): Promise<BackgroundState> {
  return await driver.executeScript((testId: string) => {
    const takeover = document.querySelector(`[data-testid="${testId}"]`);
    const { innerWidth: width, innerHeight: height } = window;
    const points = [
      [2, 2],
      [width - 2, 2],
      [2, height - 2],
      [width - 2, height - 2],
      [width / 2, height / 2],
    ];
    return {
      allPointsInsideTakeover: Boolean(
        takeover &&
        points.every(([x, y]) =>
          takeover.contains(document.elementFromPoint(x, y)),
        ),
      ),
      takeoverMounted: Boolean(takeover),
    };
  }, TAKEOVER_TEST_ID);
}

/**
 * Full-screen extension update takeover.
 *
 * Screen: takeover portaled over the current UI (`data-testid="extension-update-takeover"`).
 * Owns: variant checks, dismiss, the Update click, initial focus, and pointer
 * blocking.
 * Boundaries: stops at the takeover. Update reloads the extension; the windows
 * it closes and opens belong to the caller.
 *
 * @see ui/components/app/extension-update-takeover/extension-update-takeover.tsx
 */
class ExtensionUpdateTakeover {
  private readonly dismissButton = {
    testId: 'extension-update-takeover-dismiss-button',
  };

  private driver: Driver;

  private readonly takeover = {
    testId: TAKEOVER_TEST_ID,
  };

  private readonly title = {
    testId: 'extension-update-takeover-title',
  };

  private readonly updateButton = {
    testId: 'extension-update-takeover-update-button',
  };

  constructor(driver: Driver) {
    this.driver = driver;
  }

  /**
   * Checks hit-testing the viewport corners and center lands inside the
   * takeover, so the page behind it cannot be reached by pointer.
   */
  async checkBackgroundIsBlocked(): Promise<void> {
    await this.checkPageIsLoaded();
    await this.driver.wait(async () => {
      const state = await readBackgroundState(this.driver);
      return state.takeoverMounted && state.allPointsInsideTakeover;
    });
  }

  async checkPageIsLoaded(): Promise<void> {
    await this.driver.waitForSelector(this.takeover);
  }

  async checkPageIsNotPresent(): Promise<void> {
    await this.driver.assertElementNotPresent(this.takeover, {
      waitAtLeastGuard: regularDelayMs,
    });
  }

  async checkPrimaryButtonIsFocused(): Promise<void> {
    await this.driver.waitForSelector(this.updateButton);
    await this.driver.wait(
      async () =>
        (await this.driver.executeScript(
          () => document.activeElement?.getAttribute('data-testid') ?? '',
        )) === this.updateButton.testId,
    );
  }

  /**
   * Checks the takeover is still shown after a short wait, so a close that is
   * already in flight fails the check.
   */
  async checkStaysDisplayed(): Promise<void> {
    await this.driver.waitUntil(
      async () =>
        await this.driver.isElementPresentAndVisible(this.takeover, 500),
      { timeout: this.driver.timeout, interval: 200, stableFor: 2000 },
    );
  }

  async checkUnsupportedVersionIsDisplayed(): Promise<void> {
    await this.checkVariantIsDisplayed(
      'unsupportedVersion',
      'This version is no longer supported',
    );
  }

  async checkVariantIsDisplayed(
    promptType: PromptType,
    titleText: string,
  ): Promise<void> {
    await this.driver.waitForSelector(
      `[data-testid="${TAKEOVER_TEST_ID}"][data-variant="${promptType}"]`,
    );
    await this.driver.waitForSelector({
      testId: this.title.testId,
      text: titleText,
    });
  }

  async checkVersionUpdateIsDisplayed(): Promise<void> {
    await this.checkVariantIsDisplayed(
      'versionUpdate',
      'A new version is available',
    );
  }

  /**
   * Clicks the top-left corner of the viewport, outside the content card and
   * buttons.
   */
  async clickOutsideContent(): Promise<void> {
    await this.driver.clickViewportPoint(4, 4);
  }

  /**
   * Clicks Update. The extension then reloads, so this window closes.
   *
   * @param options - Click options.
   * @param options.doubleClick - Double-clicks Update to check that the
   * takeover's busy state ignores a second click in the same window.
   */
  async clickUpdate({
    doubleClick = false,
  }: { doubleClick?: boolean } = {}): Promise<void> {
    if (doubleClick) {
      await this.driver.doubleClickElement(this.updateButton);
    } else {
      await this.driver.clickElement(this.updateButton);
    }
  }

  async dismiss(): Promise<void> {
    await this.driver.clickElementAndWaitToDisappear(this.dismissButton);
  }

  /**
   * Opens an extension page in a new tab and waits for the takeover there.
   *
   * @param page - Extension HTML entry point.
   * @param route - Optional hash route, for example `#settings`.
   */
  async openInNewExtensionTab(
    page: 'home' | 'popup',
    route = '',
  ): Promise<void> {
    await this.driver.openNewPage(
      `${this.driver.extensionUrl}/${page}.html${route}`,
    );
    await this.checkPageIsLoaded();
  }

  async pressEscape(): Promise<void> {
    await this.driver.press(this.updateButton, Key.ESCAPE);
  }
}

export default ExtensionUpdateTakeover;
