/* eslint-disable jsdoc/require-jsdoc, jsdoc/require-param -- shim file mirrors the Selenium Driver public API */
import fs from 'node:fs/promises';
import path from 'node:path';
import { expect } from '@playwright/test';
import type { BrowserContext, Locator, Page } from '@playwright/test';

/**
 * PlaywrightDriver — drop-in replacement for `webdriver/driver.js`'s `Driver`
 * class, backed by Playwright. The public method signatures and the `Key`
 * constants mirror the Selenium driver so existing page objects and flows
 * keep working without modification.
 *
 * The shim is intentionally incremental: methods that the easiest migrated
 * specs need are fully implemented; less common methods throw a clear error
 * pointing at the gap. As more specs migrate, gaps get filled in-place.
 *
 */

const SELENIUM_KEY = {
  BACK_SPACE: '\uE003',
  ENTER: '\uE007',
  SPACE: '\uE00D',
  CONTROL: '\uE009',
  COMMAND: '\uE03D',
  TAB: '\uE004',
  ESCAPE: '\uE00C',
  ARROW_DOWN: '\uE015',
  ARROW_UP: '\uE013',
  ARROW_LEFT: '\uE012',
  ARROW_RIGHT: '\uE014',
} as const;

const SELENIUM_TO_PW_KEY: Record<string, string> = {
  [SELENIUM_KEY.BACK_SPACE]: 'Backspace',
  [SELENIUM_KEY.ENTER]: 'Enter',
  [SELENIUM_KEY.SPACE]: 'Space',
  [SELENIUM_KEY.CONTROL]: 'Control',
  [SELENIUM_KEY.COMMAND]: 'Meta',
  [SELENIUM_KEY.TAB]: 'Tab',
  [SELENIUM_KEY.ESCAPE]: 'Escape',
  [SELENIUM_KEY.ARROW_DOWN]: 'ArrowDown',
  [SELENIUM_KEY.ARROW_UP]: 'ArrowUp',
  [SELENIUM_KEY.ARROW_LEFT]: 'ArrowLeft',
  [SELENIUM_KEY.ARROW_RIGHT]: 'ArrowRight',
};

function translateKey(key: string): string {
  if (key in SELENIUM_TO_PW_KEY) {
    return SELENIUM_TO_PW_KEY[key];
  }
  return key;
}

export const PAGES = {
  BACKGROUND: 'background',
  HOME: 'home',
  NOTIFICATION: 'notification',
  OFFSCREEN: 'offscreen',
  POPUP: 'popup',
  SIDEPANEL: 'sidepanel',
} as const;

export type RawLocator =
  | string
  | {
      css?: string;
      xpath?: string;
      text?: string;
      tag?: string;
      testId?: string;
      value?: string;
    };

export type WaitState =
  | 'visible'
  | 'detached'
  | 'enabled'
  | 'disabled'
  | 'hidden';

export type PlaywrightDriverBrowser = 'chrome' | 'firefox';

export type PlaywrightDriverOptions = {
  context: BrowserContext;
  page: Page;
  browser: PlaywrightDriverBrowser;
  extensionId: string;
  extensionUrl: string;
  timeout?: number;
  disableServerMochaToBackground?: boolean;
};

function sanitizeTestTitle(title: string): string {
  return title.replace(/[^a-zA-Z0-9-_]/gu, '_');
}

/**
 * Wraps a Playwright `Locator` with the same surface as the Selenium-flavored
 * elements returned by `wrapElementWithAPI` in `webdriver/driver.js`. Page
 * objects rely on this surface (`element.fill`, `element.click`,
 * `element.getText`, `element.waitForElementState`, …).
 */
export class PlaywrightElement {
  public readonly locator: Locator;

  protected readonly driver: PlaywrightDriver;

  constructor(locator: Locator, driver: PlaywrightDriver) {
    this.locator = locator;
    this.driver = driver;
  }

  // Selenium's wrapElementWithAPI exposes `originalClick`. Preserve it for
  // call sites that bypass the loading-overlay retry logic.
  async originalClick(): Promise<void> {
    await this.locator.click();
  }

  async click(): Promise<void> {
    await this.locator.click();
  }

  async fill(input: string): Promise<void> {
    await this.locator.fill(input);
  }

  async clear(): Promise<void> {
    await this.locator.clear();
  }

  async press(keys: string): Promise<void> {
    await this.locator.press(translateKey(keys));
  }

  async sendKeys(input: string): Promise<void> {
    if (input.length === 1 && input in SELENIUM_TO_PW_KEY) {
      await this.locator.press(translateKey(input));
      return;
    }
    await this.locator.pressSequentially(input);
  }

  async getText(): Promise<string> {
    return (await this.locator.innerText()).trim();
  }

  async getAttribute(name: string): Promise<string | null> {
    return await this.locator.getAttribute(name);
  }

  async getProperty(name: string): Promise<unknown> {
    return await this.locator.evaluate(
      (element, propertyName) =>
        (element as unknown as Record<string, unknown>)[propertyName],
      name,
    );
  }

  async getRect(): Promise<{
    x: number;
    y: number;
    width: number;
    height: number;
  }> {
    const box = await this.locator.boundingBox();
    return box ?? { x: 0, y: 0, width: 0, height: 0 };
  }

  async isDisplayed(): Promise<boolean> {
    return await this.locator.isVisible();
  }

  async isEnabled(): Promise<boolean> {
    return await this.locator.isEnabled();
  }

  async waitForElementState(state: WaitState, timeout?: number): Promise<void> {
    switch (state) {
      case 'visible':
        await this.locator.waitFor({ state: 'visible', timeout });
        return;
      case 'hidden':
      case 'detached':
        await this.locator.waitFor({ state: 'hidden', timeout });
        return;
      case 'enabled':
        // See `PlaywrightDriver.waitForSelector` for why we use Playwright's
        // `toBeEnabled` matcher instead of polling `isEnabled()` manually.
        await this.locator.waitFor({ state: 'visible', timeout });
        await expect(this.locator).toBeEnabled({
          timeout: timeout ?? this.driver.timeout,
        });
        return;
      case 'disabled':
        await this.locator.waitFor({ state: 'visible', timeout });
        await expect(this.locator).toBeDisabled({
          timeout: timeout ?? this.driver.timeout,
        });
        return;
      default:
        throw new Error(
          `PlaywrightElement.waitForElementState: unsupported state '${String(state)}'`,
        );
    }
  }
}

export class PlaywrightDriver {
  // Public properties mirroring the Selenium Driver shape.
  public driver: BrowserContext;

  public browser: PlaywrightDriverBrowser;

  public extensionUrl: string;

  public extensionId: string;

  public timeout: number;

  // Mirrors the Selenium driver's public `Key` constants. The PascalCase
  // property name and UPPER_CASE keys are part of the public API contract
  // that page objects (e.g. `driver.Key.ENTER`, `driver.Key.MODIFIER`) rely
  // on; renaming them would break the migration goal of leaving page
  // objects unchanged.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  public Key: typeof SELENIUM_KEY & { MODIFIER: string };

  public exceptions: unknown[] = [];

  public errors: unknown[] = [];

  public eventProcessingStack: unknown[] = [];

  // Selenium driver lazily creates `WindowHandles` from the
  // background-socket. We keep this hook as `null` until the integration
  // layer wires it up.
  public windowHandles: unknown = null;

  // Internals
  private readonly context: BrowserContext;

  private currentPage: Page;

  private readonly pages: Map<string, Page> = new Map();

  private handleCounter = 0;

  constructor({
    context,
    page,
    browser,
    extensionId,
    extensionUrl,
    timeout = 10 * 1000,
  }: PlaywrightDriverOptions) {
    this.context = context;
    this.currentPage = page;
    this.driver = context;
    this.browser = browser;
    this.extensionId = extensionId;
    this.extensionUrl = extensionUrl;
    this.timeout = timeout;

    this.Key = {
      ...SELENIUM_KEY,
      MODIFIER: process.platform === 'darwin' ? 'Meta' : 'Control',
    };

    this.registerPage(page);
    this.context.on('page', (newPage) => {
      this.registerPage(newPage);
    });
    this.context.on('weberror', (webError) => {
      this.errors.push(webError.error());
    });
  }

  // -- Internal helpers -----------------------------------------------------

  private registerPage(page: Page): string {
    for (const [existingHandle, existingPage] of this.pages.entries()) {
      if (existingPage === page) {
        return existingHandle;
      }
    }
    this.handleCounter += 1;
    const handle = `pw-handle-${this.handleCounter}`;
    this.pages.set(handle, page);
    page.on('close', () => {
      this.pages.delete(handle);
      if (this.currentPage === page) {
        const next = this.pages.values().next();
        if (!next.done) {
          this.currentPage = next.value;
        }
      }
    });
    return handle;
  }

  private handleFor(page: Page): string {
    for (const [handle, candidate] of this.pages.entries()) {
      if (candidate === page) {
        return handle;
      }
    }
    return this.registerPage(page);
  }

  private get page(): Page {
    if (!this.currentPage || this.currentPage.isClosed()) {
      const next = this.pages.values().next();
      if (!next.done) {
        this.currentPage = next.value;
      }
    }
    return this.currentPage;
  }

  // -- Locator construction --------------------------------------------------

  /**
   * Translates a Selenium-flavored `rawLocator` (string CSS, `{ css }`,
   * `{ xpath }`, `{ testId }`, `{ text, tag }`, `{ css, text }`,
   * `{ css, value }`) into a Playwright `Locator` rooted at the current page.
   */
  buildLocator(rawLocator: RawLocator): Locator {
    return this.buildLocatorOn(this.page, rawLocator);
  }

  private buildLocatorOn(
    root: Page | Locator,
    rawLocator: RawLocator,
  ): Locator {
    if (typeof rawLocator === 'string') {
      return root.locator(rawLocator);
    }
    if (rawLocator.xpath) {
      return root.locator(`xpath=${rawLocator.xpath}`);
    }
    if (rawLocator.css && rawLocator.value !== undefined) {
      // {css, value} – find an element matching the CSS that also has a
      // matching @value attribute. Mirrors Selenium driver behaviour.
      return root
        .locator(rawLocator.css)
        .and(root.locator(`[value="${rawLocator.value}"]`));
    }
    if (rawLocator.text !== undefined) {
      const { text, tag, testId, css } = rawLocator;
      if (css) {
        return root.locator(css, { hasText: text });
      }
      if (testId) {
        return root.getByTestId(testId).filter({ hasText: text });
      }
      if (tag) {
        return root.locator(tag, { hasText: text });
      }
      return root.locator(`*:has-text("${text}")`);
    }
    if (rawLocator.testId) {
      return root.getByTestId(rawLocator.testId);
    }
    if (rawLocator.css) {
      return root.locator(rawLocator.css);
    }
    throw new Error(
      `PlaywrightDriver.buildLocator: unsupported locator ${JSON.stringify(rawLocator)}`,
    );
  }

  // -- Script execution ------------------------------------------------------

  /**
   * Selenium-compatible executeScript. Accepts either a string of JS code
   * (where `arguments[0]`, `arguments[1]`, … bind to the trailing varargs)
   * or a function (in which case the varargs become its arguments).
   *
   * For element-targeted scripts, prefer `element.locator.evaluate((el, arg)
   * => ..., arg)` directly — it is type-safe and avoids the function
   * serialization roundtrip.
   */
  async executeScript<TResult = unknown>(
    script: string | ((...args: unknown[]) => unknown),
    ...args: unknown[]
  ): Promise<TResult> {
    // Selenium's `executeScript` takes either:
    //   - a string of JS statements where `arguments[N]` binds to varargs, or
    //   - a function which receives the varargs as its parameters.
    // Playwright's `page.evaluate` only ships ONE argument and stringifies
    // the page-side function via `.toString()`. We bridge by reconstructing
    // a callable on the page side with `new Function` and spreading our
    // single args-tuple parameter back into the script.
    //
    // Single-wrap: previous revision wrapped twice ("outer" + "inner"
    // function), which made for harder-to-read stack traces and an extra
    // round of source-string mutation. This version is one wrapper.
    let source =
      typeof script === 'string'
        ? `function() { ${script} }`
        : script.toString();
    // When tsx/esbuild transpiles TypeScript it can inject `__name(...)`
    // helpers that don't exist in the page context. Define a no-op shim so
    // serialized functions don't throw in-page. Mirrors `driver.js`.
    if (typeof script === 'function' && source.includes('__name')) {
      source = `function() { var __name = (fn) => fn; return (${source}).apply(null, arguments); }`;
    }
    return (await this.page.evaluate<
      TResult,
      { source: string; passedArgs: unknown[] }
    >(
      ({ source: src, passedArgs }) => {
        // eslint-disable-next-line no-new-func, @typescript-eslint/no-implied-eval
        const fn = new Function('args', `return (${src}).apply(null, args);`);
        return fn(passedArgs) as TResult;
      },
      { source, passedArgs: args },
    )) as TResult;
  }

  // Selenium's executeAsyncScript resolves when the script invokes its trailing
  // completion callback (`arguments[arguments.length - 1]`). No migrated spec
  // exercises it yet, so it's left as a gap rather than shipping an unverified
  // implementation — implement (and verify) it alongside the first spec that
  // needs it. See `driver.js` for the contract to mirror.
  async executeAsyncScript<TResult = unknown>(
    _script: string | ((...args: unknown[]) => unknown),
    ..._args: unknown[]
  ): Promise<TResult> {
    throw new Error(
      'PlaywrightDriver.executeAsyncScript is not yet implemented.',
    );
  }

  // -- Element finders -------------------------------------------------------

  async findElement(
    rawLocator: RawLocator,
    _timeout: number = this.timeout,
  ): Promise<PlaywrightElement> {
    // Playwright `Locator`s are lazy: returning one here is free, and every
    // downstream action (`click`, `fill`, `getText`, ...) already auto-waits
    // for the right state before it dispatches. The Selenium driver had to
    // resolve the element eagerly because WebDriver returned a live element
    // handle; on Playwright that round-trip is pure overhead.
    //
    // Callers that need an explicit existence assertion should use
    // `waitForSelector` (preserved with its wait semantics) or wrap their
    // findElement in `findVisibleElement`.
    const locator = this.buildLocator(rawLocator).first();
    return new PlaywrightElement(locator, this);
  }

  async findElements(rawLocator: RawLocator): Promise<PlaywrightElement[]> {
    const locator = this.buildLocator(rawLocator);
    const count = await locator.count();
    const result: PlaywrightElement[] = [];
    for (let index = 0; index < count; index += 1) {
      result.push(new PlaywrightElement(locator.nth(index), this));
    }
    return result;
  }

  async findVisibleElement(
    rawLocator: RawLocator,
    timeout: number = this.timeout,
  ): Promise<PlaywrightElement> {
    const locator = this.buildLocator(rawLocator).first();
    await locator.waitFor({ state: 'visible', timeout });
    return new PlaywrightElement(locator, this);
  }

  async findClickableElement(
    rawLocator: RawLocator,
    options: { waitAtLeastGuard?: number; timeout?: number } = {},
  ): Promise<PlaywrightElement> {
    const { waitAtLeastGuard = 0, timeout = this.timeout } = options;
    if (timeout <= waitAtLeastGuard) {
      throw new Error('timeout must be greater than waitAtLeastGuard');
    }
    if (waitAtLeastGuard > 0) {
      await this.delay(waitAtLeastGuard);
    }
    // Playwright's `click()` already auto-waits for actionability — visible,
    // stable (no animation), enabled, and receives-pointer-events — before
    // dispatching. The Selenium driver had to pre-check visible + enabled
    // because `click()` had no built-in actionability guard. We keep only the
    // visibility wait so callers that don't immediately click (rare) still
    // get a meaningful "element is on screen" signal; the enabled poll is
    // dropped as it duplicates Playwright's auto-wait.
    const locator = this.buildLocator(rawLocator).first();
    await locator.waitFor({ state: 'visible', timeout });
    return new PlaywrightElement(locator, this);
  }

  async findClickableElements(
    rawLocator: RawLocator,
  ): Promise<PlaywrightElement[]> {
    // See `findClickableElement` for why we drop the `isEnabled` poll.
    const elements = await this.findElements(rawLocator);
    await Promise.all(
      elements.map(async (element) => {
        await element.locator.waitFor({
          state: 'visible',
          timeout: this.timeout,
        });
      }),
    );
    return elements;
  }

  async findNestedElement(
    parent: PlaywrightElement,
    nestedLocator: RawLocator,
  ): Promise<PlaywrightElement> {
    // See `findElement` for why we skip the eager `waitFor`.
    const locator = this.buildLocatorOn(parent.locator, nestedLocator).first();
    return new PlaywrightElement(locator, this);
  }

  // -- Waits ----------------------------------------------------------------

  async waitForSelector(
    rawLocator: RawLocator,
    options: {
      timeout?: number;
      state?: WaitState;
      waitAtLeastGuard?: number;
    } = {},
  ): Promise<PlaywrightElement> {
    const {
      timeout = this.timeout,
      state = 'visible',
      waitAtLeastGuard = 0,
    } = options;
    if (timeout <= waitAtLeastGuard) {
      throw new Error('timeout must be greater than waitAtLeastGuard');
    }
    if (waitAtLeastGuard > 0) {
      await this.delay(waitAtLeastGuard);
    }

    const locator = this.buildLocator(rawLocator).first();
    if (state === 'visible' || state === 'hidden') {
      await locator.waitFor({ state, timeout });
    } else if (state === 'detached') {
      await locator.waitFor({ state: 'detached', timeout });
    } else if (state === 'enabled') {
      // Playwright's `toBeEnabled` matcher polls in-page at a faster
      // cadence than our 100ms JS-loop and avoids a protocol round trip
      // per check. We still pre-wait for `visible` to preserve the
      // Selenium contract of "the element is on screen AND interactive".
      await locator.waitFor({ state: 'visible', timeout });
      await expect(locator).toBeEnabled({ timeout });
    } else if (state === 'disabled') {
      await locator.waitFor({ state: 'visible', timeout });
      await expect(locator).toBeDisabled({ timeout });
    } else {
      throw new Error(
        `Provided state selector ${state as string} is not supported`,
      );
    }
    return new PlaywrightElement(locator, this);
  }

  async waitForMultipleSelectors(
    rawLocators: RawLocator[],
    options: { timeout?: number; state?: WaitState } = {},
  ): Promise<PlaywrightElement[]> {
    return await Promise.all(
      rawLocators.map((rawLocator) =>
        this.waitForSelector(rawLocator, options),
      ),
    );
  }

  async waitForNonEmptyElement(element: PlaywrightElement): Promise<void> {
    // Waits for at least one non-whitespace character. Matches the
    // semantics of the original `getText().length > 0` poll (which
    // trimmed via `innerText`) without the per-poll protocol round trip.
    await expect(element.locator).toHaveText(/\S/u, { timeout: this.timeout });
  }

  async elementCountBecomesN(
    rawLocator: RawLocator,
    expectedCount: number,
    timeout: number = this.timeout,
  ): Promise<boolean> {
    const locator = this.buildLocator(rawLocator);
    try {
      await expect(locator).toHaveCount(expectedCount, { timeout });
      return true;
    } catch {
      const actual = await locator.count();
      console.error(
        `Waiting for count of ${JSON.stringify(rawLocator)} elements to be ${expectedCount}, but it is ${actual}`,
      );
      return false;
    }
  }

  async wait(
    condition: () => Promise<boolean | unknown>,
    timeout: number = this.timeout,
    catchError = false,
  ): Promise<void> {
    try {
      await this.waitUntil(async () => Boolean(await condition()), {
        interval: 100,
        timeout,
      });
    } catch (error) {
      if (!catchError) {
        throw error;
      }
      console.log('Caught error waiting for condition:', error);
    }
  }

  async waitUntil(
    condition: () => Promise<boolean>,
    options: { interval?: number; timeout?: number; stableFor?: number } = {},
  ): Promise<void> {
    const { interval = 100, timeout = this.timeout, stableFor } = options;
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      if (await condition()) {
        if (stableFor) {
          await this.delay(stableFor);
          if (await condition()) {
            return;
          }
        } else {
          return;
        }
      }
      await this.delay(interval);
    }
    throw new Error(`waitUntil: condition not met within ${timeout}ms`);
  }

  async assertElementNotPresent(
    rawLocator: RawLocator,
    options: {
      findElementGuard?: RawLocator | '';
      waitAtLeastGuard?: number;
      timeout?: number;
    } = {},
  ): Promise<void> {
    const {
      findElementGuard = '',
      waitAtLeastGuard = 0,
      timeout = this.timeout,
    } = options;
    if (timeout <= waitAtLeastGuard) {
      throw new Error('timeout must be greater than waitAtLeastGuard');
    }
    if (waitAtLeastGuard > 0) {
      await this.delay(waitAtLeastGuard);
    }
    if (findElementGuard) {
      await this.findElement(findElementGuard);
    }
    const locator = this.buildLocator(rawLocator);
    try {
      await expect(locator).toHaveCount(0, {
        timeout: timeout - waitAtLeastGuard,
      });
    } catch {
      throw new Error(
        `Found element ${JSON.stringify(rawLocator)} that should not be present`,
      );
    }
  }

  // -- Predicates -----------------------------------------------------------

  async isElementPresent(rawLocator: RawLocator): Promise<boolean> {
    return (await this.buildLocator(rawLocator).count()) > 0;
  }

  async isElementPresentAndVisible(rawLocator: RawLocator): Promise<boolean> {
    const locator = this.buildLocator(rawLocator).first();
    if ((await locator.count()) === 0) {
      return false;
    }
    return await locator.isVisible();
  }

  // -- Interactions ---------------------------------------------------------

  async fill(
    rawLocator: RawLocator,
    input: string,
    options: { retries?: number } = {},
  ): Promise<PlaywrightElement> {
    const { retries = 0 } = options;
    const element = await this.findElement(rawLocator);
    if (retries === 0) {
      await element.fill(input);
      return element;
    }
    for (let attempt = 0; attempt < retries; attempt += 1) {
      await element.fill(input);
      try {
        await this.waitUntil(
          async () => (await element.getAttribute('value')) === input,
          { interval: 50, timeout: 1000 },
        );
        return element;
      } catch {
        // retry
      }
    }
    const current = await element.getAttribute('value');
    if (current !== input) {
      throw new Error(
        `Failed to set exact value after ${retries} attempts. Expected '${input}', got '${current ?? ''}'.`,
      );
    }
    return element;
  }

  async press(
    rawLocator: RawLocator,
    keys: string,
  ): Promise<PlaywrightElement> {
    const element = await this.findElement(rawLocator);
    await element.press(keys);
    return element;
  }

  async clickElement(rawLocator: RawLocator, retries = 3): Promise<void> {
    // Direct `locator.click()` — Playwright's built-in auto-wait already
    // checks attached + visible + stable + enabled + receives-pointer-events
    // before dispatching, so the `findClickableElement` pre-flight round
    // trip is redundant on the click path.
    //
    // The outer retry loop is kept because page objects rely on
    // `clickElement` swallowing the occasional transient failure
    // (e.g. element detached mid-click during a re-render). Inter-attempt
    // delay was 1000ms — a Selenium-era constant from when ChromeDriver
    // could throw StaleElementReferenceError that resolved itself after a
    // brief wait. Playwright's `Locator` is re-resolved on every action so
    // that wait is unnecessary; 100ms is enough to let a re-render settle.
    const locator = this.buildLocator(rawLocator).first();
    let lastError: unknown;
    for (let attempt = 0; attempt < retries; attempt += 1) {
      try {
        await locator.click({ timeout: this.timeout });
        return;
      } catch (error) {
        lastError = error;
        if (attempt < retries - 1) {
          console.warn(
            `Retrying click (attempt ${attempt + 1}/${retries}) due to:`,
            error,
          );
          await this.delay(100);
        }
      }
    }
    throw lastError;
  }

  async clickElementSafe(
    rawLocator: RawLocator,
    timeout = 2000,
  ): Promise<void> {
    try {
      const locator = this.buildLocator(rawLocator).first();
      await locator.waitFor({ state: 'visible', timeout });
      await locator.click({ timeout });
    } catch (error) {
      console.log(
        `Element ${JSON.stringify(rawLocator)} not found (${String(error)})`,
      );
    }
  }

  async clickElementAndWaitToDisappear(
    rawLocator: RawLocator,
    timeout = 3000,
  ): Promise<void> {
    const element = await this.findClickableElement(rawLocator);
    await element.click();
    await element.waitForElementState('hidden', timeout);
  }

  async findScrollToAndClickElement(rawLocator: RawLocator): Promise<void> {
    const locator = this.buildLocator(rawLocator).first();
    await locator.scrollIntoViewIfNeeded();
    await locator.click();
  }

  async scrollToElement(element: PlaywrightElement): Promise<void> {
    await element.locator.scrollIntoViewIfNeeded();
  }

  async hoverElement(element: PlaywrightElement): Promise<void> {
    await element.locator.hover();
  }

  async clickElementUsingMouseMove(_rawLocator: RawLocator): Promise<void> {
    throw new Error(
      'PlaywrightDriver.clickElementUsingMouseMove is not yet implemented.',
    );
  }

  async pasteIntoField(
    _rawLocator: RawLocator,
    _content: string,
  ): Promise<void> {
    throw new Error('PlaywrightDriver.pasteIntoField is not yet implemented.');
  }

  async holdMouseDownOnElement(
    _rawLocator: RawLocator,
    _ms: number,
  ): Promise<void> {
    throw new Error(
      'PlaywrightDriver.holdMouseDownOnElement is not yet implemented.',
    );
  }

  async clickPoint(
    _rawLocator: RawLocator,
    _x: number,
    _y: number,
  ): Promise<void> {
    throw new Error('PlaywrightDriver.clickPoint is not yet implemented.');
  }

  async isElementMoving(_rawLocator: RawLocator): Promise<boolean> {
    throw new Error('PlaywrightDriver.isElementMoving is not yet implemented.');
  }

  /**
   * Effectively a no-op on the Playwright path. Every actionable method
   * (`click`, `fill`, `hover`, ...) already auto-waits for the element to
   * be stable — Playwright defines "stable" as the bounding box not
   * changing for two consecutive animation frames — before dispatching.
   * The Selenium driver had to poll the rect manually because Selenium's
   * actions had no built-in stability guard.
   *
   * We still resolve the locator's `visible` state so the call surfaces a
   * missing-element failure at the same site Selenium did, and so anyone
   * who calls this method *without* a follow-up action still gets a
   * meaningful "the element is on screen" signal.
   *
   * @param rawLocator - Element locator.
   * @param timeout - Maximum wait for the element to become visible
   * (default 6000ms, matches the Selenium driver's outer timeout).
   */
  async waitForElementToStopMoving(
    rawLocator: RawLocator,
    timeout = 6000,
  ): Promise<void> {
    await this.buildLocator(rawLocator)
      .first()
      .waitFor({ state: 'visible', timeout });
  }

  // -- Navigation -----------------------------------------------------------

  async navigate(page: string = PAGES.HOME): Promise<void> {
    const target =
      this.browser === 'firefox' && page === PAGES.SIDEPANEL
        ? PAGES.HOME
        : page;
    await this.page.goto(`${this.extensionUrl}/${target}.html`, {
      waitUntil: 'domcontentloaded',
    });
  }

  async openNewPage(url: string): Promise<string> {
    const page = await this.context.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    this.currentPage = page;
    return this.handleFor(page);
  }

  async openNewURL(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  }

  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  async refresh(): Promise<void> {
    await this.page.reload({ waitUntil: 'domcontentloaded' });
  }

  async delay(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  async delayFirefox(ms: number): Promise<void> {
    if (this.browser === 'firefox') {
      await this.delay(ms);
    }
  }

  // -- Window / tab management ---------------------------------------------

  async getAllWindowHandles(): Promise<string[]> {
    throw new Error(
      'PlaywrightDriver.getAllWindowHandles is not yet implemented.',
    );
  }

  async switchToWindow(_handle: string): Promise<void> {
    throw new Error('PlaywrightDriver.switchToWindow is not yet implemented.');
  }

  async switchToNewWindow(): Promise<void> {
    throw new Error(
      'PlaywrightDriver.switchToNewWindow is not yet implemented.',
    );
  }

  async switchToWindowWithUrl(
    _url: string,
    _initialHandles?: string[],
    _delayStep = 1000,
    _timeout = this.timeout,
  ): Promise<void> {
    throw new Error(
      'PlaywrightDriver.switchToWindowWithUrl is not yet implemented.',
    );
  }

  async switchToWindowWithTitle(
    _title: string,
    _initialHandles?: string[],
    _delayStep = 1000,
    _timeout = this.timeout,
  ): Promise<void> {
    throw new Error(
      'PlaywrightDriver.switchToWindowWithTitle is not yet implemented.',
    );
  }

  async waitUntilXWindowHandles(
    _expected: number,
    _delayStep = 1000,
    _timeout = this.timeout,
  ): Promise<string[]> {
    throw new Error(
      'PlaywrightDriver.waitUntilXWindowHandles is not yet implemented.',
    );
  }

  async closeWindow(): Promise<void> {
    throw new Error('PlaywrightDriver.closeWindow is not yet implemented.');
  }

  async closeWindowHandle(_handle: string): Promise<void> {
    throw new Error(
      'PlaywrightDriver.closeWindowHandle is not yet implemented.',
    );
  }

  async switchToFrame(frame: PlaywrightElement | string): Promise<void> {
    throw new Error(
      `PlaywrightDriver.switchToFrame is not yet implemented. ` +
        `Frame target: ${typeof frame === 'string' ? frame : 'PlaywrightElement'}. ` +
        `Implement when migrating a spec that needs it.`,
    );
  }

  // -- Alerts ---------------------------------------------------------------

  async closeAlertPopup(): Promise<void> {
    // PW dialogs are handled via `page.on('dialog', …)`. The Selenium-style
    // closeAlertPopup is rarely needed in tests; stub for now.
    this.page.once('dialog', async (dialog) => {
      await dialog.dismiss();
    });
  }

  // -- Diagnostics ----------------------------------------------------------

  async takeScreenshot(
    _testTitle: string,
    _screenshotTitle: string,
  ): Promise<void> {
    throw new Error('PlaywrightDriver.takeScreenshot is not yet implemented.');
  }

  /**
   * Returns a newline-joined dump of recorded page errors and exceptions.
   * Mirrors the Selenium driver's synchronous signature so the call site
   * `if (driver.summarizeErrorsAndExceptions()) { throw new Error(...) }`
   * keeps working without modification.
   */
  summarizeErrorsAndExceptions(): string {
    return [...this.errors, ...this.exceptions]
      .map((value) =>
        value instanceof Error ? (value.stack ?? value.message) : String(value),
      )
      .join('\n');
  }

  /**
   * Best-effort capture of test-failure artifacts: screenshots and DOM
   * snapshots for every open page. Mirrors the Selenium driver's
   * `verboseReportOnFailure` so `withFixtures` can call it uniformly.
   *
   * @param testTitle - Full mocha/playwright test title.
   * @param error - The error that triggered the failure (logged for context).
   */
  async verboseReportOnFailure(
    testTitle: string,
    error: unknown,
  ): Promise<void> {
    console.error(
      `Failure on testcase: '${testTitle}', for more information see the ${
        process.env.CI ? 'artifacts tab in CI' : 'test-artifacts folder'
      }\n`,
    );
    console.error(`${String(error)}\n`);

    const artifactDir = path.join(
      './test-artifacts',
      this.browser,
      sanitizeTestTitle(testTitle),
    );
    await fs.mkdir(artifactDir, { recursive: true });

    const pages = this.context.pages();
    for (let index = 0; index < pages.length; index += 1) {
      const targetPage = pages[index];
      const suffix = index + 1;
      try {
        const title = await targetPage.title();
        if (title !== 'MetaMask Offscreen Page') {
          const buffer = await targetPage.screenshot();
          await fs.writeFile(
            path.join(artifactDir, `test-failure-screenshot-${suffix}.png`),
            buffer,
          );
        }
      } catch (screenshotError) {
        console.error('Failed to take screenshot', screenshotError);
      }
      try {
        const html = await targetPage.content();
        await fs.writeFile(
          path.join(artifactDir, `test-failure-dom-${suffix}.html`),
          html,
        );
      } catch (domError) {
        console.error('Failed to capture DOM snapshot', domError);
      }
    }
  }

  /**
   * Selenium-only hook for CDP exception streaming. The Playwright shim
   * already records `weberror` events into `this.errors` via the
   * constructor, so this method is a no-op kept for API parity.
   *
   * @param _ignoredConsoleErrors - Unused on the Playwright path.
   */
  async checkBrowserForExceptions(
    _ignoredConsoleErrors: string[] = [],
  ): Promise<void> {
    // no-op; see method docstring
  }

  /**
   * Selenium-only hook for CDP console.error streaming. No-op on
   * Playwright; surfaced errors should be added to `this.errors` via
   * `page.on('pageerror', ...)` integration if needed by a future spec.
   *
   * @param _ignoredConsoleErrors - Unused on the Playwright path.
   */
  async checkBrowserForConsoleErrors(
    _ignoredConsoleErrors: string[] = [],
  ): Promise<void> {
    // no-op; see method docstring
  }

  // -- Teardown -------------------------------------------------------------

  async quit(): Promise<void> {
    try {
      await this.context.close();
    } catch (error) {
      console.warn(
        'PlaywrightDriver: failed to close context cleanly; continuing.',
        error,
      );
    }
  }
}
