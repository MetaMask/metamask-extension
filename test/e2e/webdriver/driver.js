const { promises: fs } = require('fs');
const { strict: assert } = require('assert');
const {
  By,
  Condition,
  Key,
  until,
  ThenableWebDriver, // eslint-disable-line no-unused-vars -- this is imported for JSDoc
  WebElement, // eslint-disable-line no-unused-vars -- this is imported for JSDoc
} = require('selenium-webdriver');
const cssToXPath = require('css-to-xpath');
const { sprintf } = require('sprintf-js');
const { retry } = require('../../../development/lib/retry');

const PAGES = {
  BACKGROUND: 'background',
  HOME: 'home',
  NOTIFICATION: 'notification',
  POPUP: 'popup',
};

/**
 * Temporary workaround to patch selenium's element handle API with methods
 * that match the playwright API for Elements
 *
 * @param {object} element - Selenium Element
 * @param {!ThenableWebDriver} driver
 * @returns {object} modified Selenium Element
 */
function wrapElementWithAPI(element, driver) {
  element.press = (key) => element.sendKeys(key);
  element.fill = async (input) => {
    // The 'fill' method in playwright replaces existing input
    await driver.wait(until.elementIsVisible(element));

    // Try 2 ways to clear input fields, first try with clear() method
    // Use keyboard simulation if the input field is not empty
    await element.sendKeys(
      Key.chord(driver.Key.MODIFIER, 'a', driver.Key.BACK_SPACE),
    );
    // If previous methods fail, use Selenium's actions to select all text and replace it with the expected value
    if ((await element.getProperty('value')) !== '') {
      await driver.driver
        .actions()
        .click(element)
        .keyDown(driver.Key.MODIFIER)
        .sendKeys('a')
        .keyUp(driver.Key.MODIFIER)
        .perform();
    }
    await element.sendKeys(input);
  };

  element.waitForElementState = async (state, timeout) => {
    switch (state) {
      case 'hidden':
        return await driver.wait(until.stalenessOf(element), timeout);
      case 'visible':
        return await driver.wait(until.elementIsVisible(element), timeout);
      default:
        throw new Error(`Provided state: '${state}' is not supported`);
    }
  };

  element.nestedFindElement = async (rawLocator) => {
    const locator = driver.buildLocator(rawLocator);
    const newElement = await element.findElement(locator);
    return wrapElementWithAPI(newElement, driver);
  };

  // We need to hold a pointer to the original click() method so that we can call it in the replaced click() method
  if (!element.originalClick) {
    element.originalClick = element.click;
  }

  // This special click() method waits for the loading overlay to disappear before clicking
  element.click = async () => {
    try {
      await element.originalClick();
    } catch (e) {
      if (e.name === 'ElementClickInterceptedError') {
        if (e.message.includes('<div class="mm-box loading-overlay">')) {
          // Wait for the loading overlay to disappear and try again
          await driver.wait(
            until.elementIsNotPresent(By.css('.loading-overlay')),
          );
        }
        if (e.message.includes('<div class="modal__backdrop">')) {
          // Wait for the modal to disappear and try again
          await driver.wait(
            until.elementIsNotPresent(By.css('.modal__backdrop')),
          );
        }
        await element.originalClick();
      } else {
        throw e; // If the error is not related to the loading overlay or modal backdrop, throw it
      }
    }
  };

  return element;
}

until.elementIsNotPresent = function elementIsNotPresent(locator) {
  return new Condition(`Element not present`, function (driver) {
    return driver.findElements(locator).then(function (elements) {
      return elements.length === 0;
    });
  });
};

/**
 * This is MetaMask's custom E2E test driver, wrapping the Selenium WebDriver.
 * For Selenium WebDriver API documentation, see:
 * https://www.selenium.dev/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_WebDriver.html
 */
class Driver {
  /**
   * @param {!ThenableWebDriver} driver - A {@code WebDriver} instance
   * @param {string} browser - The type of browser this driver is controlling
   * @param extensionUrl
   * @param {number} timeout
   */
  constructor(driver, browser, extensionUrl, timeout = 10 * 1000) {
    this.driver = driver;
    this.browser = browser;
    this.extensionUrl = extensionUrl;
    this.timeout = timeout;
    this.exceptions = [];
    this.errors = [];
    // The following values are found in
    // https://github.com/SeleniumHQ/selenium/blob/trunk/javascript/node/selenium-webdriver/lib/input.js#L50-L110
    // These should be replaced with string constants 'Enter' etc for playwright.
    this.Key = {
      BACK_SPACE: '\uE003',
      ENTER: '\uE007',
      SPACE: '\uE00D',
      CONTROL: '\uE009',
      COMMAND: '\uE03D',
      MODIFIER: process.platform === 'darwin' ? Key.COMMAND : Key.CONTROL,
    };
  }

  async executeAsyncScript(script, ...args) {
    return this.driver.executeAsyncScript(script, args);
  }

  async executeScript(script, ...args) {
    return this.driver.executeScript(script, args);
  }

  /**
   * In web automation testing, locators are crucial commands that guide the framework to identify
   * and select HTML elements on a webpage for interaction. They play a vital role in executing various
   * actions such as clicking buttons, filling text, or retrieving data from web pages.
   *
   * buildLocator function enhances element matching capabilities by introducing support for inline locators,
   * offering an alternative to the traditional use of Selenium's By abstraction.
   *
   * @param {string | object} locator - this could be 'css' or 'xpath' and value to use with the locator strategy.
   * @returns {object} By object that can be used to locate elements.
   * @throws {Error} Will throw an error if an invalid locator strategy is provided.
   *
   * To locate an element by its class using a CSS selector, prepend the class name with a dot (.) symbol.
   * @example <caption>Example to locate the amount text box using its class on the send transaction screen</caption>
   *        await driver.findElement('.unit-input__input’);
   *
   * To locate an element by its ID using a CSS selector, prepend the ID with a hash sign (#).
   * @example <caption>Example to locate the password text box using its ID on the login screen</caption>
   *        await driver.findElement('#password');
   *
   * To target an element based on its attribute using a CSS selector,
   * use square brackets ([]) to specify the attribute name and its value.
   * @example <caption>Example to locate the ‘Buy & Sell’ button using its unique attribute data-testid and its value on the overview screen</caption>
   *        await driver.findElement('[data-testid="eth-overview-buy"]');
   *
   * To locate an element by XPath locator strategy
   * @example <caption>Example to locate 'Confirm' button on the send transaction page</caption>
   *        await driver.findClickableElement({ text: 'Confirm', tag: 'button' });
   */
  buildLocator(locator) {
    if (typeof locator === 'string') {
      // If locator is a string we assume its a css selector
      return By.css(locator);
    } else if (locator.value) {
      // For backwards compatibility, checking if the locator has a value prop
      // tells us this is a Selenium locator
      return locator;
    } else if (locator.xpath) {
      // Providing an xpath prop to the object will consume the locator as an
      // xpath locator.
      return By.xpath(locator.xpath);
    } else if (locator.text) {
      // Providing a text prop, and optionally a tag or css prop, will use
      // xpath to look for an element with the tag that has matching text.
      if (locator.css) {
        // When providing css prop we use cssToXPath to build a xpath string
        // We provide two cases to check for, first a text node of the
        // element that matches the text provided OR we test the stringified
        // contents of the element in the case where text is split across
        // multiple children. In the later case non literal spaces are stripped
        // so we do the same with the input to provide a consistent API.
        const xpath = cssToXPath
          .parse(locator.css)
          .where(
            cssToXPath.xPathBuilder
              .string()
              .contains(locator.text)
              .or(
                cssToXPath.xPathBuilder
                  .string()
                  .contains(locator.text.split(' ').join('')),
              ),
          )
          .toXPath();
        return By.xpath(xpath);
      }
      // The tag prop is optional and further refines which elements match
      return By.xpath(
        `//${locator.tag ?? '*'}[contains(text(), '${locator.text}')]`,
      );
    }
    throw new Error(
      `The locator '${locator}' is not supported by the E2E test driver`,
    );
  }

  /**
   * Fills the given web element with the provided value.
   * This method is particularly useful for automating interactions with text fields,
   * such as username or password inputs, search boxes, or any editable text areas.
   *
   * @param {string | object} rawLocator - element locator
   * @param {string} input - The value to fill the element with.
   * @returns {Promise<WebElement>} Promise resolving to the filled element
   * @example <caption>Example to fill address in the send transaction screen</caption>
   *          await driver.fill(
   *                'input[data-testid="ens-input"]',
   *                '0xc427D562164062a23a5cFf596A4a3208e72Acd28');
   */
  async fill(rawLocator, input) {
    const element = await this.findElement(rawLocator);
    await element.fill(input);
    return element;
  }

  /**
   * Simulates a key press event on the given web element.
   * This can include typing characters into a text field,
   * activating keyboard shortcuts, or any other keyboard-related interactions
   *
   * @param {string | object} rawLocator - element locator
   * @param {string} keys - The key to press.
   * @returns {Promise<WebElement>} promise resolving to the filled element
   */
  async press(rawLocator, keys) {
    const element = await this.findElement(rawLocator);
    await element.press(keys);
    return element;
  }

  async delay(time) {
    await new Promise((resolve) => setTimeout(resolve, time));
  }

  /**
   * Function to wait for a specific condition to be met within a given timeout period,
   * with an option to catch and handle any errors that occur during the wait.
   *
   * @param {Function} condition - condition or function the method awaits to become true
   * @param {number} timeout - Optional parameter specifies the maximum milliseconds to wait.
   * @param catchError - Optional parameter that determines whether errors during the wait should be caught and handled within the method
   * @returns {Promise}  promise resolving with a delay
   * @throws {Error} Will throw an error if the condition is not met within the timeout period.
   * @example <caption>Example wait until a condition occurs</caption>
   *            await driver.wait(async () => {
   *              let info = await getBackupJson();
   *              return info !== null;
   *            }, 10000);
   * @example <caption>Example wait until the condition for finding the elements is met and ensuring that the length validation is also satisfied</caption>
   *            await driver.wait(async () => {
   *              const confirmedTxes = await driver.findElements(
   *              '.transaction-list__completed-transactions .transaction-list-item',
   *              );
   *            return confirmedTxes.length === 1;
   *            }, 10000);
   * @example <caption>Example wait until a mock condition occurs</caption>
   *           await driver.wait(async () => {
   *              const isPending = await mockedEndpoint.isPending();
   *              return isPending === false;
   *           }, 3000);
   */
  async wait(condition, timeout = this.timeout, catchError = false) {
    try {
      await this.driver.wait(condition, timeout);
    } catch (e) {
      if (!catchError) {
        throw e;
      }

      console.log('Caught error waiting for condition:', e);
    }
  }

  /**
   * Waits for an element that matches the given locator to reach the specified state within the timeout period.
   *
   * @param {string | object} rawLocator - Element locator
   * @param {number} timeout - optional parameter that specifies the maximum amount of time (in milliseconds)
   * to wait for the condition to be met and desired state of the element to wait for.
   * It defaults to 'visible', indicating that the method will wait until the element is visible on the page.
   * The other supported state is 'detached', which means waiting until the element is removed from the DOM.
   * @returns {Promise<WebElement>} promise resolving when the element meets the state or timeout occurs.
   * @throws {Error} Will throw an error if the element does not reach the specified state within the timeout period.
   */
  async waitForSelector(
    rawLocator,
    { timeout = this.timeout, state = 'visible' } = {},
  ) {
    // Playwright has a waitForSelector method that will become a shallow
    // replacement for the implementation below. It takes an option options
    // bucket that can include the state attribute to wait for elements that
    // match the selector to be removed from the DOM.
    let element;
    if (!['visible', 'detached'].includes(state)) {
      throw new Error(`Provided state selector ${state} is not supported`);
    }
    if (state === 'visible') {
      element = await this.driver.wait(
        until.elementLocated(this.buildLocator(rawLocator)),
        timeout,
      );
    } else if (state === 'detached') {
      element = await this.driver.wait(
        until.stalenessOf(await this.findElement(rawLocator)),
        timeout,
      );
    }
    return wrapElementWithAPI(element, this);
  }

  /**
   * Waits for an element that matches the given locator to become non-empty within the timeout period.
   * This is particularly useful for waiting for elements that are dynamically populated with content.
   *
   * @param {string | object} element - Element locator
   * @returns {Promise}  promise resolving once the element fills or timeout hits
   * @throws {Error} throws an error if the element does not become non-empty within the timeout period.
   */
  async waitForNonEmptyElement(element) {
    await this.driver.wait(async () => {
      const elemText = await element.getText();
      const empty = elemText === '';
      return !empty;
    }, this.timeout);
  }

  /**
   * Wait until an element is absent.
   *
   * This function MUST have a guard to prevent a race condition. For example,
   * when the previous step is to click a button that loads a new page, then of course
   * during page load, the rawLocator element will be absent, even though it will appear
   * a half-second later.
   *
   * The first choice for the guard is to use the findElementGuard, which executes before
   * the search for the rawLocator element.
   *
   * The second choice for the guard is to use the waitAtLeastGuard parameter.
   *
   * @param {string | object} rawLocator - element locator
   * @param {object} guards
   * @param {string | object} [guards.findElementGuard] - rawLocator to perform a findElement and act as a guard
   * @param {number} [guards.waitAtLeastGuard] - minimum milliseconds to wait before passing
   * @param {number} [guards.timeout]  - maximum milliseconds to wait before failing
   * @returns {Promise<void>}  promise resolving after the element is not present
   * @throws {Error}  throws an error if the element is present
   */
  async assertElementNotPresent(
    rawLocator,
    {
      findElementGuard = '',
      waitAtLeastGuard = 0,
      timeout = this.timeout,
    } = {},
  ) {
    assert(timeout > waitAtLeastGuard);
    if (waitAtLeastGuard > 0) {
      await this.delay(waitAtLeastGuard);
    }

    if (findElementGuard) {
      await this.findElement(findElementGuard);
    }

    const locator = this.buildLocator(rawLocator);

    try {
      await this.driver.wait(
        until.elementIsNotPresent(locator),
        timeout - waitAtLeastGuard,
      );
    } catch (err) {
      throw new Error(
        `Found element ${JSON.stringify(
          rawLocator,
        )} that should not be present`,
      );
    }
  }

  /**
   * Quits the browser session, closing all windows and tabs.
   *
   * @returns {Promise} promise resolving after quitting
   */
  async quit() {
    await this.driver.quit();
  }

  /**
   * Finds an element on the page using the given locator
   * and returns a reference to the first matching element.
   *
   * @param {string | object} rawLocator - Element locator
   * @returns {Promise<WebElement>} A promise that resolves to the found element.
   */
  async findElement(rawLocator) {
    const locator = this.buildLocator(rawLocator);
    const element = await this.driver.wait(
      until.elementLocated(locator),
      this.timeout,
    );
    return wrapElementWithAPI(element, this);
  }

  /**
   * Finds a visible element on the page using the given locator.
   *
   * @param {string | object} rawLocator - Element locator
   * @returns {Promise<WebElement>} A promise that resolves to the found visible element.
   */
  async findVisibleElement(rawLocator) {
    const element = await this.findElement(rawLocator);
    await this.driver.wait(until.elementIsVisible(element), this.timeout);
    return wrapElementWithAPI(element, this);
  }

  /**
   * Finds a clickable element on the page using the given locator.
   *
   * @param {string | object} rawLocator - Element locator
   * @returns {Promise<WebElement>} A promise that resolves to the found clickable element.
   */
  async findClickableElement(rawLocator) {
    const element = await this.findElement(rawLocator);
    await Promise.all([
      this.driver.wait(until.elementIsVisible(element), this.timeout),
      this.driver.wait(until.elementIsEnabled(element), this.timeout),
    ]);
    return wrapElementWithAPI(element, this);
  }

  /**
   * Finds all elements on the page that match the given locator.
   * If there are no matches, an empty list is returned.
   *
   * @param {string | object} rawLocator - Element locator
   * @returns {Promise<Array<WebElement>>} A promise that resolves to an array of found elements.
   */
  async findElements(rawLocator) {
    const locator = this.buildLocator(rawLocator);
    const elements = await this.driver.wait(
      until.elementsLocated(locator),
      this.timeout,
    );
    return elements.map((element) => wrapElementWithAPI(element, this));
  }

  /**
   * Finds all clickable elements on the page that match the given locator.
   *
   * @param {string | object} rawLocator - Element locator
   * @returns {Promise<Array<WebElement>>} A promise that resolves to an array of found clickable elements.
   */
  async findClickableElements(rawLocator) {
    const elements = await this.findElements(rawLocator);
    await Promise.all(
      elements.reduce((acc, element) => {
        acc.push(
          this.driver.wait(until.elementIsVisible(element), this.timeout),
          this.driver.wait(until.elementIsEnabled(element), this.timeout),
        );
        return acc;
      }, []),
    );
    return elements.map((element) => wrapElementWithAPI(element, this));
  }

  /**
   * Function that aims to simulate a click action on a specified web element within a web page
   *
   * @param {string | object} rawLocator - Element locator
   * @returns {Promise} promise that resolves to the WebElement
   */
  async clickElement(rawLocator) {
    const element = await this.findClickableElement(rawLocator);
    await element.click();
  }

  /**
   * for instances where an element such as a scroll button does not
   * show up because of render differences, proceed to the next step
   * without causing a test failure, but provide a console log of why.
   *
   * @param rawLocator
   * @param timeout
   */
  async clickElementSafe(rawLocator, timeout = 1000) {
    try {
      const locator = this.buildLocator(rawLocator);

      const elements = await this.driver.wait(
        until.elementsLocated(locator),
        timeout,
      );

      await elements[0].click();
    } catch (e) {
      console.log(`Element ${rawLocator} not found (${e})`);
    }
  }

  /**
   * Can fix instances where a normal click produces ElementClickInterceptedError
   *
   * @param rawLocator
   */
  async clickElementUsingMouseMove(rawLocator) {
    const element = await this.findClickableElement(rawLocator);
    await this.scrollToElement(element);
    await this.driver
      .actions()
      .move({ origin: element, x: 1, y: 1 })
      .click()
      .perform();
  }

  /**
   * Simulates a click at the given x and y coordinates.
   *
   * @param rawLocator - Element locator
   * @param {number} x  - coordinate to click at x
   * @param {number} y - coordinate to click at y
   * @returns {Promise<void>} promise resolving after a click
   */
  async clickPoint(rawLocator, x, y) {
    const element = await this.findElement(rawLocator);
    await this.driver
      .actions()
      .move({ origin: element, x, y })
      .click()
      .perform();
  }

  /**
   * Simulates holding the mouse button down on the given web element.
   *
   * @param {string | object} rawLocator - Element locator
   * @param {number} ms - number of milliseconds to hold the mouse button down
   * @returns {Promise<void>} promise resolving after mouse down completed
   */
  async holdMouseDownOnElement(rawLocator, ms) {
    const locator = this.buildLocator(rawLocator);
    const element = await this.findClickableElement(locator);
    await this.driver
      .actions()
      .move({ origin: element, x: 1, y: 1 })
      .press()
      .pause(ms)
      .release()
      .perform();
  }

  /**
   * Scrolls the page until the given web element is in view.
   *
   * @param {string | object} element - Element locator
   * @returns {Promise<void>} promise resolving after scrolling
   */
  async scrollToElement(element) {
    await this.driver.executeScript(
      'arguments[0].scrollIntoView(true)',
      element,
    );
  }

  /**
   * Checks if an element that matches the given locator is present on the page.
   *
   * @param {string | object} rawLocator - Element locator
   * @returns {Promise<boolean>} promise that resolves to a boolean indicating whether the element is present.
   */
  async isElementPresent(rawLocator) {
    try {
      await this.findElement(rawLocator);
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Checks if an element that matches the given locator is present and visible on the page.
   *
   * @param {string | object} rawLocator - Element locator
   * @returns {Promise<boolean>} promise that resolves to a boolean indicating whether the element is present and visible.
   */
  async isElementPresentAndVisible(rawLocator) {
    try {
      await this.findVisibleElement(rawLocator);
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Paste a string into a field.
   *
   * @param {string} rawLocator  - Element locator
   * @param {string} contentToPaste - content to paste
   * @returns {Promise<WebElement>}  promise that resolves to the WebElement
   */
  async pasteIntoField(rawLocator, contentToPaste) {
    // Throw if double-quote is present in content to paste
    // so that we don't have to worry about escaping double-quotes
    if (contentToPaste.includes('"')) {
      throw new Error('Cannot paste content with double-quote');
    }
    // Click to focus the field
    await this.clickElement(rawLocator);
    await this.executeScript(
      `navigator.clipboard.writeText("${contentToPaste}")`,
    );
    await this.fill(rawLocator, Key.chord(this.Key.MODIFIER, 'v'));
  }

  // Navigation

  /**
   * Navigates to the specified page within a browser session.
   *
   * @param {string} [page] - its optional parameter to specify the page you want to navigate.
   * Defaults to home if no other page is specified.
   * @returns {Promise} promise resolves when the page has finished loading
   * @throws {Error} Will throw an error if the navigation fails or the page does not load within the timeout period.
   */
  async navigate(page = PAGES.HOME) {
    const response = await this.driver.get(`${this.extensionUrl}/${page}.html`);
    // Wait for asynchronous JavaScript to load
    await this.driver.wait(
      until.elementLocated(this.buildLocator('.metamask-loaded')),
      10 * 1000,
    );
    return response;
  }

  /**
   * Retrieves the current URL of the browser session.
   *
   * @returns {Promise<string>} promise resolves upon retrieving the URL text.
   */
  async getCurrentUrl() {
    return await this.driver.getCurrentUrl();
  }

  // Metrics

  async collectMetrics() {
    return await this.driver.executeScript(collectMetrics);
  }

  // Window management

  /**
   * Opens a new URL in the browser window controlled by the driver
   *
   * @param {string} url - Any URL
   * @returns {Promise<void>} promise resolves when the URL page has finished loading
   */
  async openNewURL(url) {
    await this.driver.get(url);
  }

  /**
   * Opens a new window or tab in the browser session and navigates to the given URL.
   *
   * @param {string} url - The URL to navigate to in the new window tab.
   * @returns {newHandle} The handle of the new window or tab.
   * This handle can be used later to switch between different tabs in window during the test.
   */
  async openNewPage(url) {
    const newHandle = await this.driver.switchTo().newWindow();
    await this.openNewURL(url);
    return newHandle;
  }

  /**
   * Refreshes the current page in the browser session.
   *
   * @returns {Promise<void>} promise resolves page is loaded
   */
  async refresh() {
    await this.driver.navigate().refresh();
  }

  /**
   * Switches the context of the browser session to the window or tab with the given handle.
   *
   * @param {int} handle - unique identifier (window handle) of the browser window or tab to which you want to switch.
   * @returns {Promise<void>} promise that resolves once the switch is complete
   */
  async switchToWindow(handle) {
    await this.driver.switchTo().window(handle);
  }

  /**
   * Opens a new browser window and switch the WebDriver's context to this new window.
   *
   * @returns {Promise<void>} A promise resolves after switching to the new window.
   */
  async switchToNewWindow() {
    await this.driver.switchTo().newWindow('window');
  }

  /**
   * Switches the WebDriver's context to a specified iframe or frame within a web page.
   *
   * @param {string} element - The iframe or frame element to switch to.
   * @returns {Promise<void>} promise that resolves once the switch is complete
   */
  async switchToFrame(element) {
    await this.driver.switchTo().frame(element);
  }

  /**
   * Retrieves the handles of all open window tabs in the browser session.
   *
   * @returns {Promise<Array<string>>} A promise that will
   *     be resolved with an array of window handles.
   */
  async getAllWindowHandles() {
    return await this.driver.getAllWindowHandles();
  }

  /**
   * Waits until the specified number of window handles are present.
   *
   * @param {number} x - The number of window handles to wait for
   * @param delayStep - defaults to 1000 milliseconds
   * @param {number} [timeout] - The amount of time in milliseconds to wait before timing out.
   * @returns {Promise} promise resolving when the target window handle count is met
   * @throws {Error} throws an error if the target number of window handles isn't met by the timeout.
   */
  async waitUntilXWindowHandles(x, delayStep = 1000, timeout = this.timeout) {
    let timeElapsed = 0;
    let windowHandles = [];
    while (timeElapsed <= timeout) {
      windowHandles = await this.driver.getAllWindowHandles();

      if (windowHandles.length === x) {
        return windowHandles;
      }
      await this.delay(delayStep);
      timeElapsed += delayStep;
    }
    throw new Error('waitUntilXWindowHandles timed out polling window handles');
  }

  /**
   * Retrieves the title of the window tab with the given handle ID.
   *
   * @param {int} handlerId - unique ID for the tab whose title is needed.
   * @returns {Promise<string>} promise resolving to the tab title after command completion
   */
  async getWindowTitleByHandlerId(handlerId) {
    await this.driver.switchTo().window(handlerId);
    return await this.driver.getTitle();
  }

  /**
   * Switches the context of the browser session to the window tab with the given title.
   * This functionality is especially valuable in complex testing scenarios involving multiple window tabs,
   * allowing for interaction with a particular window or tab based on its title
   *
   * @param {string} title - The title of the window or tab to switch to.
   * @param {string} [initialWindowHandles] - optional array of window handles to search through.
   * If not provided, the function fetches all current window handles.
   * @param {int} delayStep - optional defaults to 1000 milliseconds
   * @param {int} timeout - optional set to the defaults to 1000 milliseconds in the file
   * @param {int} retries,retryDelay - optional for retrying the title fetch operation, ranging 8 ms to 2500 ms
   * @returns {Promise<void>} promise that resolves once the switch is complete
   * @throws {Error} throws an error if no window with the specified title is found
   */
  async switchToWindowWithTitle(
    title,
    initialWindowHandles,
    delayStep = 1000,
    timeout = this.timeout,
    { retries = 8, retryDelay = 2500 } = {},
  ) {
    let windowHandles =
      initialWindowHandles || (await this.driver.getAllWindowHandles());
    let timeElapsed = 0;

    while (timeElapsed <= timeout) {
      for (const handle of windowHandles) {
        const handleTitle = await retry(
          {
            retries,
            delay: retryDelay,
          },
          async () => {
            await this.driver.switchTo().window(handle);
            return await this.driver.getTitle();
          },
        );

        if (handleTitle === title) {
          return handle;
        }
      }
      await this.delay(delayStep);
      timeElapsed += delayStep;
      // refresh the window handles
      windowHandles = await this.driver.getAllWindowHandles();
    }

    throw new Error(`No window with title: ${title}`);
  }

  /**
   * Switches the context of the browser session to the window tab with the given URL.
   *
   * @param {string} url - Window URL to switch
   * @param {string} [initialWindowHandles] - optional array of window handles to search through.
   * If not provided, the function fetches all current window handles.
   * @param {int} delayStep - optional defaults to 1000 milliseconds
   * @param {int} timeout - optional set to the defaults to 1000 milliseconds in the file
   * @param {int} retries,retryDelay - optional for retrying the URL fetch operation, defaults to starting at 8 ms to 2500 ms
   * @returns {Promise<void>}  promise that resolves once the switch is complete
   * @throws {Error} throws an error if no window with the specified url is found
   */
  async switchToWindowWithUrl(
    url,
    initialWindowHandles,
    delayStep = 1000,
    timeout = this.timeout,
    { retries = 8, retryDelay = 2500 } = {},
  ) {
    let windowHandles =
      initialWindowHandles || (await this.driver.getAllWindowHandles());
    let timeElapsed = 0;

    while (timeElapsed <= timeout) {
      for (const handle of windowHandles) {
        const handleUrl = await retry(
          {
            retries,
            delay: retryDelay,
          },
          async () => {
            await this.driver.switchTo().window(handle);
            return await this.driver.getCurrentUrl();
          },
        );

        if (handleUrl === `${url}/`) {
          return handle;
        }
      }
      await this.delay(delayStep);
      timeElapsed += delayStep;
      // refresh the window handles
      windowHandles = await this.driver.getAllWindowHandles();
    }

    throw new Error(`No window with url: ${url}`);
  }

  /**
   * Closes the current window tab in the browser session
   *
   *  @returns {Promise<void>} promise resolving after closing the current window
   */
  async closeWindow() {
    await this.driver.close();
  }

  /**
   * Closes specific window tab identified by its window handle.
   *
   * @param {string} windowHandle - representing the unique identifier of the browser window to be closed.
   * @returns {Promise<void>} promise resolving after closing the specified window
   */
  async closeWindowHandle(windowHandle) {
    await this.driver.switchTo().window(windowHandle);
    await this.driver.close();
  }

  // Close Alert Popup
  /**
   * Close the alert popup that is currently open in the browser session.
   *
   * @returns {Promise} promise resolving when the alert is closed
   */
  async closeAlertPopup() {
    return await this.driver.switchTo().alert().accept();
  }

  /**
   * Closes all windows except those in the given list of exceptions
   *
   * @param {Array<string>} exceptions - The list of window handle exceptions
   * @param {Array} [windowHandles] - The full list of window handles
   * @returns {Promise<void>}
   */
  async closeAllWindowHandlesExcept(exceptions, windowHandles) {
    // eslint-disable-next-line no-param-reassign
    windowHandles = windowHandles || (await this.driver.getAllWindowHandles());

    for (const handle of windowHandles) {
      if (!exceptions.includes(handle)) {
        await this.driver.switchTo().window(handle);
        await this.delay(1000);
        await this.driver.close();
        await this.delay(1000);
      }
    }
  }

  // Error handling

  async verboseReportOnFailure(title, error) {
    console.error(
      `Failure on testcase: '${title}', for more information see the ${
        process.env.CIRCLECI ? 'artifacts tab in CI' : 'test-artifacts folder'
      }\n`,
    );
    console.error(`${error}\n`);

    const artifactDir = `./test-artifacts/${this.browser}/${title}`;
    const filepathBase = `${artifactDir}/test-failure`;
    await fs.mkdir(artifactDir, { recursive: true });
    // On occasion there may be a bug in the offscreen document which does
    // not render visibly to the user and therefore no screenshot can be
    // taken. In this case we skip the screenshot and log the error.
    try {
      const screenshot = await this.driver.takeScreenshot();
      await fs.writeFile(`${filepathBase}-screenshot.png`, screenshot, {
        encoding: 'base64',
      });
    } catch (e) {
      console.error('Failed to take screenshot', e);
    }
    const htmlSource = await this.driver.getPageSource();
    await fs.writeFile(`${filepathBase}-dom.html`, htmlSource);
    const uiState = await this.driver.executeScript(
      () =>
        window.stateHooks?.getCleanAppState &&
        window.stateHooks.getCleanAppState(),
    );
    await fs.writeFile(
      `${filepathBase}-state.json`,
      JSON.stringify(uiState, null, 2),
    );
  }

  async checkBrowserForLavamoatLogs() {
    const browserLogs = (
      await fs.readFile(
        `${process.cwd()}/test-artifacts/chrome/chrome_debug.log`,
      )
    )
      .toString('utf-8')
      .split(/\r?\n/u);

    await fs.writeFile('/tmp/all_logs.json', JSON.stringify(browserLogs));

    return browserLogs;
  }

  async checkBrowserForExceptions(ignoredConsoleErrors) {
    const cdpConnection = await this.driver.createCDPConnection('page');

    this.driver.onLogException(cdpConnection, (exception) => {
      const { description } = exception.exceptionDetails.exception;

      const ignored = logBrowserError(ignoredConsoleErrors, description);
      if (!ignored) {
        this.exceptions.push(description);
      }
    });
  }

  async checkBrowserForConsoleErrors(_ignoredConsoleErrors) {
    const ignoredConsoleErrors = _ignoredConsoleErrors.concat([
      // Third-party Favicon 404s show up as errors
      'favicon.ico - Failed to load resource: the server responded with a status of 404',
      // Sentry rate limiting
      'Failed to load resource: the server responded with a status of 429',
      // 4Byte
      'Failed to load resource: the server responded with a status of 502 (Bad Gateway)',
    ]);

    const cdpConnection = await this.driver.createCDPConnection('page');

    this.driver.onLogEvent(cdpConnection, (event) => {
      if (event.type === 'error') {
        const eventDescriptions = event.args.filter(
          (err) => err.description !== undefined,
        );

        if (eventDescriptions.length !== 0) {
          // If we received an SES_UNHANDLED_REJECTION from Chrome, eventDescriptions.length will be nonzero
          // Update: as of January 2024, this code path may never happen
          const [eventDescription] = eventDescriptions;
          const ignored = logBrowserError(
            ignoredConsoleErrors,
            eventDescription?.description,
          );

          if (!ignored) {
            this.errors.push(eventDescription?.description);
          }
        } else if (event.args.length !== 0) {
          const newError = this.#getErrorFromEvent(event);

          const ignored = logBrowserError(ignoredConsoleErrors, newError);

          if (!ignored) {
            this.errors.push(newError);
          }
        }
      }
    });
  }

  #getErrorFromEvent(event) {
    // Extract the values from the array
    const values = event.args.map((a) => a.value);

    if (values[0].includes('%s')) {
      // The values are in the "printf" form of [message, ...substitutions]
      // so use sprintf to parse
      return sprintf(...values);
    }

    return values.join(' ');
  }

  summarizeErrorsAndExceptions() {
    return this.errors.concat(this.exceptions).join('\n');
  }
}

function logBrowserError(ignoredConsoleErrors, errorMessage) {
  let ignored = false;

  console.error('\n-----Received an error from Chrome-----');
  console.error(errorMessage);
  console.error('----------End of Chrome error----------');

  if (errorMessage.startsWith('Warning:')) {
    console.error("-----We will ignore this 'Warning'-----");
    ignored = true;
  } else if (isInIgnoreList(errorMessage, ignoredConsoleErrors)) {
    console.error('---This error is on the ignore list----');
    ignored = true;
  }

  console.error('\n');

  return ignored;
}

function isInIgnoreList(errorMessage, ignoreList) {
  return ignoreList.some((ignore) => errorMessage.includes(ignore));
}

function collectMetrics() {
  const results = {
    paint: {},
    navigation: [],
  };

  window.performance.getEntriesByType('paint').forEach((paintEntry) => {
    results.paint[paintEntry.name] = paintEntry.startTime;
  });

  window.performance
    .getEntriesByType('navigation')
    .forEach((navigationEntry) => {
      results.navigation.push({
        domContentLoaded: navigationEntry.domContentLoadedEventEnd,
        load: navigationEntry.loadEventEnd,
        domInteractive: navigationEntry.domInteractive,
        redirectCount: navigationEntry.redirectCount,
        type: navigationEntry.type,
      });
    });

  return results;
}

module.exports = { Driver, PAGES };
