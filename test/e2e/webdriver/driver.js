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
const { debounce } = require('lodash');
const { quoteXPathText } = require('../../helpers/quoteXPathText');
const { isManifestV3 } = require('../../../shared/modules/mv3.utils');
const { WindowHandles } = require('../background-socket/window-handles');

const PAGES = {
  BACKGROUND: 'background',
  HOME: 'home',
  NOTIFICATION: 'notification',
  OFFSCREEN: 'offscreen',
  POPUP: 'popup',
};

const artifactDir = (title) => `./test-artifacts/${this.browser}/${title}`;

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
      case 'disabled':
        return await driver.wait(until.elementIsDisabled(element), timeout);
      default:
        throw new Error(`Provided state: '${state}' is not supported`);
    }
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
        if (e.message.includes('<div class="mm-box loading-overlay"')) {
          // Wait for the loading overlay to disappear and try again
          await driver.wait(
            until.elementIsNotPresent(By.css('.loading-overlay')),
          );
        }
        if (e.message.includes('<div class="modal__backdrop"')) {
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

until.foundElementCountIs = function foundElementCountIs(locator, n) {
  return new Condition(`Element count is ${n}`, function (driver) {
    return driver.findElements(locator).then(function (elements) {
      return elements.length === n;
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
   * @param {string} extensionUrl
   * @param {number} timeout - Defaults to 10000 milliseconds (10 seconds)
   */
  constructor(driver, browser, extensionUrl, timeout = 10 * 1000) {
    this.driver = driver;
    this.browser = browser;
    this.extensionUrl = extensionUrl;
    this.timeout = timeout;
    this.exceptions = [];
    this.errors = [];
    this.eventProcessingStack = [];
    this.windowHandles = new WindowHandles(this.driver);

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
   * @example <caption>Example to locate the ‘Buy & Sell’ button using its unique attribute testId and its value on the overview screen</caption>
   *        await driver.findElement({testId: 'eth-overview-buy'});
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
      // If a testId prop was provided along with text, convert that to a css prop and continue
      if (locator.testId) {
        locator.css = `[data-testid="${locator.testId}"]`;
      }

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

      const quoted = quoteXPathText(locator.text);
      // The tag prop is optional and further refines which elements match
      return By.xpath(`//${locator.tag ?? '*'}[contains(text(), ${quoted})]`);
    } else if (locator.testId) {
      // Providing a testId prop will use css to look for an element with the
      // data-testid attribute that matches the testId provided.
      return By.css(`[data-testid="${locator.testId}"]`);
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

  async delayFirefox(time) {
    if (process.env.SELENIUM_BROWSER === 'firefox') {
      await new Promise((resolve) => setTimeout(resolve, time));
    }
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
   * @param {object} [options] - parameter object
   * @param {number} [options.timeout] - specifies the maximum amount of time (in milliseconds)
   * to wait for the condition to be met and desired state of the element to wait for.
   * It defaults to 'visible', indicating that the method will wait until the element is visible on the page.
   * The other supported state is 'detached', which means waiting until the element is removed from the DOM.
   * @param {string} [options.state] - specifies the state of the element to wait for.
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
    if (!['visible', 'detached', 'enabled'].includes(state)) {
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
    } else if (state === 'enabled') {
      element = await this.driver.wait(
        until.elementIsEnabled(await this.findElement(rawLocator)),
        timeout,
      );
    }

    return wrapElementWithAPI(element, this);
  }

  /**
   * Waits for multiple elements that match the given locators to reach the specified state within the timeout period.
   *
   * @param {Array<string | object>} rawLocators - Array of element locators
   * @param {number} timeout - Optional parameter that specifies the maximum amount of time (in milliseconds)
   * to wait for the condition to be met and desired state of the elements to wait for.
   * It defaults to 'visible', indicating that the method will wait until the elements are visible on the page.
   * The other supported state is 'detached', which means waiting until the elements are removed from the DOM.
   * @returns {Promise<Array<WebElement>>} Promise resolving when all elements meet the state or timeout occurs.
   * @throws {Error} Will throw an error if any of the elements do not reach the specified state within the timeout period.
   */
  async waitForMultipleSelectors(
    rawLocators,
    { timeout = this.timeout, state = 'visible' } = {},
  ) {
    const promises = rawLocators.map((rawLocator) =>
      this.waitForSelector(rawLocator, { timeout, state }),
    );
    return Promise.all(promises);
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
   * Waits until the expected number of tokens to be rendered
   *
   * @param {string | object} rawLocator - element locator
   * @param {number} n - The expected number of elements.
   * @param timeout
   * @returns {Promise} promise resolving when the count of elements is matched.
   */
  async elementCountBecomesN(rawLocator, n, timeout = this.timeout) {
    const locator = this.buildLocator(rawLocator);
    try {
      await this.driver.wait(until.foundElementCountIs(locator, n), timeout);
      return true;
    } catch (e) {
      const elements = await this.findElements(locator);
      console.error(
        `Waiting for count of ${locator} elements to be ${n}, but it is ${elements.length}`,
      );
      return false;
    }
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
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<WebElement>} A promise that resolves to the found element.
   */
  async findElement(rawLocator, timeout = this.timeout) {
    const locator = this.buildLocator(rawLocator);
    const element = await this.driver.wait(
      until.elementLocated(locator),
      timeout,
    );
    return wrapElementWithAPI(element, this);
  }

  /**
   * Finds a nested element within a parent element using the given locator.
   * This is useful when the parent element is already known and you want to find an element within it.
   *
   * @param {WebElement} element - Parent element
   * @param {string | object} nestedLocator - Nested element locator
   * @returns {Promise<WebElement>} A promise that resolves to the found nested element.
   */
  async findNestedElement(element, nestedLocator) {
    const locator = this.buildLocator(nestedLocator);
    const nestedElement = await element.findElement(locator);
    return wrapElementWithAPI(nestedElement, this);
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
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<WebElement>} A promise that resolves to the found clickable element.
   */
  async findClickableElement(rawLocator, timeout = this.timeout) {
    const element = await this.findElement(rawLocator, timeout);
    await Promise.all([
      this.driver.wait(until.elementIsVisible(element), timeout),
      this.driver.wait(until.elementIsEnabled(element), timeout),
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
   * @param {number} [retries] - The number of times to retry the click action if it fails
   * @returns {Promise} promise that resolves to the WebElement
   */
  async clickElement(rawLocator, retries = 3) {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const element = await this.findClickableElement(rawLocator);
        await element.click();
        return;
      } catch (error) {
        if (
          error.name === 'StaleElementReferenceError' &&
          attempt < retries - 1
        ) {
          await this.delay(1000);
        } else {
          throw error;
        }
      }
    }
  }

  /**
   * Checks if an element is moving by comparing its position at two different times.
   *
   * @param {string | object} rawLocator - Element locator.
   * @returns {Promise<boolean>} Promise that resolves to a boolean indicating if the element is moving.
   */
  async isElementMoving(rawLocator) {
    const element = await this.findElement(rawLocator);
    const initialPosition = await element.getRect();

    await new Promise((resolve) => setTimeout(resolve, 500)); // Wait for a short period

    const newPosition = await element.getRect();

    return (
      initialPosition.x !== newPosition.x || initialPosition.y !== newPosition.y
    );
  }

  /**
   * Waits until an element stops moving within a specified timeout period.
   *
   * @param {string | object} rawLocator - Element locator.
   * @param {number} timeout - The maximum time to wait for the element to stop moving.
   * @returns {Promise<void>} Promise that resolves when the element stops moving.
   * @throws {Error} Throws an error if the element does not stop moving within the timeout period.
   */
  async waitForElementToStopMoving(rawLocator, timeout = 5000) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (!(await this.isElementMoving(rawLocator))) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 500)); // Check every 500ms
    }

    throw new Error('Element did not stop moving within the timeout period');
  }

  /** @param {string} title - The title of the window or tab the screenshot is being taken in */
  async takeScreenshot(title) {
    const filepathBase = `${artifactDir(title)}/test-screenshot`;
    await fs.mkdir(artifactDir(title), { recursive: true });

    const screenshot = await this.driver.takeScreenshot();
    await fs.writeFile(`${filepathBase}-screenshot.png`, screenshot, {
      encoding: 'base64',
    });
  }

  /**
   * Clicks on an element identified by the provided locator and waits for it to disappear.
   * For scenarios where the clicked element, such as a notification or popup, needs to disappear afterward.
   * The wait ensures that subsequent interactions are not obscured by the initial notification or popup element.
   *
   * @param rawLocator - The locator used to identify the element to be clicked
   * @param timeout - The maximum time in ms to wait for the element to disappear after clicking.
   */
  async clickElementAndWaitToDisappear(rawLocator, timeout = 2000) {
    const element = await this.findClickableElement(rawLocator);
    await element.click();
    await element.waitForElementState('hidden', timeout);
  }

  /**
   * Clicks on an element if it's present. If the element is not found,
   * catch the exception, log the failure to the console, but do not cause the test to fail.
   * For scenario where an element such as a scroll button does not
   * show up because of render differences, proceed to the next step
   * without causing a test failure, but provide a console log of why.
   *
   * @param rawLocator - Element locator
   * @param timeout - The maximum time in ms to wait for the element
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
   * Waits for a condition to be met within a given timeout period.
   *
   * @param {Function} condition - The condition to wait for. This function should return a boolean indicating whether the condition is met.
   * @param {object} options - Options for the wait.
   * @param {number} options.timeout - The maximum amount of time (in milliseconds) to wait for the condition to be met.
   * @param {number} options.interval - The interval (in milliseconds) between checks for the condition.
   * @returns {Promise<void>} A promise that resolves when the condition is met or the timeout is reached.
   * @throws {Error} Throws an error if the condition is not met within the timeout period.
   */
  async waitUntil(condition, options) {
    const { timeout, interval } = options;
    const endTime = Date.now() + timeout;

    while (Date.now() < endTime) {
      if (await condition()) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
    throw new Error('Condition not met within timeout');
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
    // Click to focus the field
    await this.clickElement(rawLocator);
    await this.executeScript(
      `navigator.clipboard.writeText("${contentToPaste.replace(
        /"/gu,
        '\\"',
      )}")`,
    );
    await this.fill(rawLocator, Key.chord(this.Key.MODIFIER, 'v'));
  }

  async pasteFromClipboardIntoField(rawLocator) {
    await this.fill(rawLocator, Key.chord(this.Key.MODIFIER, 'v'));
  }

  // Navigation

  /**
   * Navigates to the specified page within a browser session.
   *
   * @param {string} [page] - its optional parameter to specify the page you want to navigate.
   * Defaults to home if no other page is specified.
   * @param {object} [options] - optional parameter to specify additional options.
   * @param {boolean} [options.waitForControllers] - optional parameter to specify whether to wait for the controllers to be loaded.
   * Defaults to true.
   * @returns {Promise} promise resolves when the page has finished loading
   * @throws {Error} Will throw an error if the navigation fails or the page does not load within the timeout period.
   */
  async navigate(page = PAGES.HOME, { waitForControllers = true } = {}) {
    const response = await this.driver.get(`${this.extensionUrl}/${page}.html`);
    // Wait for asynchronous JavaScript to load
    if (waitForControllers) {
      await this.waitForControllersLoaded();
    }
    return response;
  }

  /**
   * Waits for the controllers to be loaded on the page.
   *
   * This function waits until an element with the class 'controller-loaded' is located,
   * indicating that the controllers have finished loading.
   *
   * @returns {Promise<void>} A promise that resolves when the controllers are loaded.
   * @throws {Error} Will throw an error if the element is not located within the timeout period.
   */
  async waitForControllersLoaded() {
    await this.driver.wait(
      until.elementLocated(this.buildLocator('.controller-loaded')),
      10 * 1000,
    );
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
   * @returns {Promise<string>} The handle of the new window or tab.
   * This handle can be used later to switch between different tabs in window during the test.
   */
  async openNewPage(url) {
    await this.driver.switchTo().newWindow();
    await this.openNewURL(url);
    const newHandle = await this.driver.getWindowHandle();
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
    await this.windowHandles.getCurrentWindowProperties(null, handle);
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
    return await this.windowHandles.getAllWindowHandles();
  }

  /**
   * Function that aims to simulate a click action on a specified web element
   * within a web page and waits for the current window to close.
   *
   * @param {string | object} rawLocator - Element locator
   * @param {number} [retries] - The number of times to retry the click action if it fails
   * @returns {Promise<void>} promise that resolves to the WebElement
   */
  async clickElementAndWaitForWindowToClose(rawLocator, retries = 3) {
    const handle = await this.driver.getWindowHandle();
    await this.clickElement(rawLocator, retries);
    await this.waitForWindowToClose(handle);
  }

  /**
   * Waits for the specified window handle to close before returning.
   *
   * @param {string} handle - The handle of the window or tab we'll wait for.
   * @param {number} [timeout] - The amount of time in milliseconds to wait
   * before timing out. Defaults to `this.timeout`.
   * @throws {Error} throws an error if the window handle doesn't close within
   * the timeout.
   */
  async waitForWindowToClose(handle, timeout = this.timeout) {
    const start = Date.now();
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const handles = await this.getAllWindowHandles();
      if (!handles.includes(handle)) {
        return;
      }

      const timeElapsed = Date.now() - start;
      if (timeElapsed > timeout) {
        throw new Error(
          `waitForWindowToClose timed out waiting for window handle '${handle}' to close.`,
        );
      }
    }
  }

  /**
   * Waits until the specified number of window handles are present.
   *
   * @param {number} _x - The number of window handles to wait for
   * @param delayStep - defaults to 1000 milliseconds
   * @param {number} [timeout] - The amount of time in milliseconds to wait before timing out.
   * @returns {Promise} promise resolving when the target window handle count is met
   * @throws {Error} throws an error if the target number of window handles isn't met by the timeout.
   */
  async waitUntilXWindowHandles(_x, delayStep = 1000, timeout = this.timeout) {
    // In the MV3 build, there is an extra windowHandle with a title of "MetaMask Offscreen Page"
    // So we add 1 to the expected number of window handles
    const x = isManifestV3 ? _x + 1 : _x;

    let timeElapsed = 0;
    let windowHandles = [];
    while (timeElapsed <= timeout) {
      windowHandles = await this.getAllWindowHandles();

      if (windowHandles.length === x) {
        return windowHandles;
      }
      await this.delay(delayStep);
      timeElapsed += delayStep;
    }

    throw new Error(
      `waitUntilXWindowHandles timed out polling window handles. Expected: ${x}, Actual: ${windowHandles.length}`,
    );
  }

  /**
   * Switches to a specific window tab using its ID and waits for the title to match the expectedTitle.
   *
   * @param {int} handleId - unique ID for the tab whose title is needed.
   * @param {string} expectedTitle - the title we are expecting.
   * @returns nothing on success.
   * @throws {Error} Throws an error if the window title is incorrect.
   */
  async switchToHandleAndWaitForTitleToBe(handleId, expectedTitle) {
    await this.driver.switchTo().window(handleId);

    let currentTitle = await this.driver.getTitle();

    // Wait 25 x 200ms = 5 seconds for the title to be set properly
    for (let i = 0; i < 25 && currentTitle !== expectedTitle; i++) {
      await this.driver.sleep(200);
      currentTitle = await this.driver.getTitle();
    }

    if (currentTitle !== expectedTitle) {
      throw new Error(
        `switchToHandleAndWaitForTitleToBe got title ${currentTitle} instead of ${expectedTitle}`,
      );
    }
  }

  /**
   * Switches the context of the browser session to the window tab with the given title.
   * This functionality is especially valuable in complex testing scenarios involving multiple window tabs,
   * allowing for interaction with a particular window or tab based on its title
   *
   * @param {string} title - The title of the window or tab to switch to.
   * @returns {Promise<void>} promise that resolves once the switch is complete
   * @throws {Error} throws an error if no window with the specified title is found
   */
  async switchToWindowWithTitle(title) {
    return await this.windowHandles.switchToWindowWithProperty('title', title);
  }

  /**
   * Waits for the specified number of window handles to be present and then switches to the window
   * tab with the given title.
   *
   * @param {number} handles - The number window handles to wait for
   * @param {string} title - The title of the window to switch to
   * @returns {Promise<void>} promise that resolves once the switch is complete
   */
  async waitAndSwitchToWindowWithTitle(handles, title) {
    await this.waitUntilXWindowHandles(handles);
    await this.switchToWindowWithTitle(title);
  }

  /**
   * Switches the context of the browser session to the window tab with the given URL.
   *
   * @param {string} url - Window URL to find
   * @returns {Promise<void>}  promise that resolves once the switch is complete
   * @throws {Error} throws an error if no window with the specified URL is found
   */
  async switchToWindowWithUrl(url) {
    return await this.windowHandles.switchToWindowWithProperty(
      'url',
      new URL(url).toString(), // Make sure the URL has a trailing slash
    );
  }

  /**
   * If we already know this window, switch to it
   * Otherwise, return null
   * This is used in helpers.switchToOrOpenDapp() and when there's an alert open
   *
   * @param {string} title - The title of the window we want to switch to
   * @returns {Promise<void>}  promise that resolves once the switch is complete
   * @throws {Error} throws an error if no window with the specified URL is found
   */
  async switchToWindowIfKnown(title) {
    return await this.windowHandles.switchToWindowIfKnown(title);
  }

  /**
   * Waits until the current URL matches the specified URL.
   *
   * @param {object} options - Parameters for the function.
   * @param {string} options.url - URL to wait for.
   * @param {int} options.timeout - optional timeout period, defaults to this.timeout.
   * @returns {Promise<void>} Promise that resolves once the URL matches.
   * @throws {Error} Throws an error if the URL does not match within the timeout period.
   */
  async waitForUrl({ url, timeout = this.timeout }) {
    return await this.driver.wait(until.urlIs(url), timeout);
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

    const filepathBase = `${artifactDir(title)}/test-failure`;
    await fs.mkdir(artifactDir(title), { recursive: true });
    // On occasion there may be a bug in the offscreen document which does
    // not render visibly to the user and therefore no screenshot can be
    // taken. In this case we skip the screenshot and log the error.
    try {
      // If there's more than one tab open, we want to iterate through all of them and take a screenshot with a unique name
      const windowHandles = await this.driver.getAllWindowHandles();
      for (const handle of windowHandles) {
        await this.driver.switchTo().window(handle);
        const windowTitle = await this.driver.getTitle();
        if (windowTitle !== 'MetaMask Offscreen Page') {
          const screenshot = await this.driver.takeScreenshot();
          await fs.writeFile(
            `${filepathBase}-screenshot-${
              windowHandles.indexOf(handle) + 1
            }.png`,
            screenshot,
            {
              encoding: 'base64',
            },
          );
        }
      }
    } catch (e) {
      console.error('Failed to take screenshot', e);
    }
    const htmlSource = await this.driver.getPageSource();
    await fs.writeFile(`${filepathBase}-dom.html`, htmlSource);

    // We want to take a state snapshot of the app if possible, this is useful for debugging
    try {
      const windowHandles = await this.driver.getAllWindowHandles();
      for (const handle of windowHandles) {
        await this.driver.switchTo().window(handle);
        const uiState = await this.driver.executeScript(
          () =>
            window.stateHooks?.getCleanAppState &&
            window.stateHooks.getCleanAppState(),
        );
        if (uiState) {
          await fs.writeFile(
            `${filepathBase}-state-${windowHandles.indexOf(handle) + 1}.json`,
            JSON.stringify(uiState, null, 2),
          );
        }
      }
    } catch (e) {
      console.error('Failed to take state', e);
    }
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
      // Sentry error that is not actually a problem
      'Event fragment with id transaction-added-',
    ]);

    const cdpConnection = await this.driver.createCDPConnection('page');

    // Flush the event processing stack 50ms after the last event is added
    const debounceEventProcessingStack = debounce(
      this.#flushEventProcessingStack.bind(this),
      50,
    );

    this.driver.onLogEvent(cdpConnection, (event) => {
      if (event.type === 'error') {
        if (event.args.length !== 0) {
          event.ignoredConsoleErrors = ignoredConsoleErrors;

          this.eventProcessingStack.push(event);

          debounceEventProcessingStack();
        }
      }
    });
  }

  #flushEventProcessingStack() {
    let completeErrorText = '';

    // Combine all events together that have arrived in the last 50ms, because they are actually just one error
    this.eventProcessingStack.forEach((event) => {
      completeErrorText += `${this.#getErrorFromEvent(event)}\n`;
    });
    completeErrorText = completeErrorText.trim();

    const { ignoredConsoleErrors } = this.eventProcessingStack[0];

    const ignored = logBrowserError(ignoredConsoleErrors, completeErrorText);

    const ignoreAllErrors = ignoredConsoleErrors.includes('ignore-all');

    if (!ignored && !ignoreAllErrors) {
      this.errors.push(completeErrorText);
    }

    this.eventProcessingStack = [];
  }

  #getErrorFromEvent(event) {
    // Extract the values from the array
    const values = event.args.map((a) => {
      // Handle snaps error type
      if (a && a.preview && Array.isArray(a.preview.properties)) {
        return a.preview.properties
          .filter((prop) => prop.value !== 'Object')
          .map((prop) => prop.value)
          .join(', ');
      } else if (a.description) {
        // Handle RPC error type
        return a.description;
      } else if (a.value) {
        // Handle generic error types
        return a.value;
      }
      // Fallback for other error structures
      return JSON.stringify(a, null, 2);
    });

    if (values[0]?.includes('%s')) {
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

  return {
    ...results,
    ...window.stateHooks.getCustomTraces(),
  };
}

module.exports = { Driver, PAGES };
