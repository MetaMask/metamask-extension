import { strict as assert } from 'assert';
import { Key, Origin } from 'selenium-webdriver';
import { Driver } from '../../../webdriver/driver';
import { regularDelayMs } from '../../../helpers';
import { WINDOW_TITLES } from '../../../constants';

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

async function findWindowsWithTitle(
  driver: Driver,
  title: string,
): Promise<string[]> {
  const matches: string[] = [];
  for (const handle of await driver.driver.getAllWindowHandles()) {
    try {
      await driver.driver.switchTo().window(handle);
      if ((await driver.driver.getTitle()) === title) {
        matches.push(handle);
      }
    } catch {
      // The extension reload can close windows while they are inspected.
    }
  }
  return matches;
}

async function waitForFocusedTestId(
  driver: Driver,
  expectedTestId: string,
): Promise<void> {
  await driver.driver.wait(
    async () =>
      (await driver.executeScript(
        () => document.activeElement?.getAttribute('data-testid') ?? '',
      )) === expectedTestId,
    driver.timeout,
    `Expected focus on [data-testid="${expectedTestId}"]`,
  );
}

/**
 * Full-screen extension update takeover.
 *
 * Screen: takeover portaled over the current UI (`data-testid="extension-update-takeover"`).
 * Owns: variant checks, dismiss, update, initial focus, and pointer blocking.
 * Boundaries: stops at the takeover. Update leaves the driver on the
 * "MetaMask Updating" tab; anything after the extension reload belongs to the
 * caller.
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
    await waitForFocusedTestId(this.driver, this.updateButton.testId);
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
      css: `[data-testid="${this.title.testId}"]`,
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
    await this.driver.driver
      .actions()
      .move({ origin: Origin.VIEWPORT, x: 4, y: 4 })
      .click()
      .perform();
  }

  /**
   * Clicks Update, waits for the extension reload to close the current window,
   * and checks exactly one "MetaMask Updating" tab was opened. Leaves the
   * driver on that tab.
   *
   * @param options - Update options.
   * @param options.doubleClick - Double-clicks Update to check that the
   * takeover's busy state ignores a second click in the same window.
   */
  async confirmUpdate({
    doubleClick = false,
  }: { doubleClick?: boolean } = {}): Promise<void> {
    // Window lookups below bypass the background socket, which disconnects
    // while the extension reloads.
    const takeoverHandle = await this.driver.getCurrentWindowHandle();
    if (doubleClick) {
      const button = await this.driver.findClickableElement(this.updateButton);
      await this.driver.driver.actions().doubleClick(button).perform();
    } else {
      await this.driver.clickElement(this.updateButton);
    }
    await this.driver.wait(async () => {
      const handles = await this.driver.driver.getAllWindowHandles();
      return !handles.includes(takeoverHandle);
    });
    let updatingHandles: string[] = [];
    await this.driver.wait(async () => {
      updatingHandles = await findWindowsWithTitle(
        this.driver,
        WINDOW_TITLES.ExtensionUpdating,
      );
      return updatingHandles.length > 0;
    });
    assert.equal(
      updatingHandles.length,
      1,
      'Expected exactly one updating tab',
    );
    await this.driver.driver.switchTo().window(updatingHandles[0]);
  }

  async dismiss(): Promise<void> {
    await this.driver.clickElementAndWaitToDisappear(this.dismissButton);
  }

  async pressEscape(): Promise<void> {
    await this.driver.press(this.updateButton, Key.ESCAPE);
  }
}

export default ExtensionUpdateTakeover;
