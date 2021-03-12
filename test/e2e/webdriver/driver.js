const { promises: fs } = require('fs');
const { strict: assert } = require('assert');
const { until, error: webdriverError } = require('selenium-webdriver');

class Driver {
  /**
   * @param {!ThenableWebDriver} driver - A {@code WebDriver} instance
   * @param {string} browser - The type of browser this driver is controlling
   * @param {number} timeout
   */
  constructor(driver, browser, extensionUrl, timeout = 10000) {
    this.driver = driver;
    this.browser = browser;
    this.extensionUrl = extensionUrl;
    this.timeout = timeout;
  }

  async delay(time) {
    await new Promise((resolve) => setTimeout(resolve, time));
  }

  async wait(condition, timeout = this.timeout) {
    await this.driver.wait(condition, timeout);
  }

  async quit() {
    await this.driver.quit();
  }

  // Element interactions

  async findElement(locator) {
    return await this.driver.wait(until.elementLocated(locator), this.timeout);
  }

  async findVisibleElement(locator) {
    const element = await this.findElement(locator);
    await this.driver.wait(until.elementIsVisible(element), this.timeout);
    return element;
  }

  async findClickableElement(locator) {
    const element = await this.findElement(locator);
    await Promise.all([
      this.driver.wait(until.elementIsVisible(element), this.timeout),
      this.driver.wait(until.elementIsEnabled(element), this.timeout),
    ]);
    return element;
  }

  async findElements(locator) {
    return await this.driver.wait(until.elementsLocated(locator), this.timeout);
  }

  async findClickableElements(locator) {
    const elements = await this.findElements(locator);
    await Promise.all(
      elements.reduce((acc, element) => {
        acc.push(
          this.driver.wait(until.elementIsVisible(element), this.timeout),
          this.driver.wait(until.elementIsEnabled(element), this.timeout),
        );
        return acc;
      }, []),
    );
    return elements;
  }

  async clickElement(locator) {
    const element = await this.findClickableElement(locator);
    await element.click();
  }

  async clickPoint(locator, x, y) {
    const element = await this.findElement(locator);
    await this.driver
      .actions()
      .move({ origin: element, x, y })
      .click()
      .perform();
  }

  async scrollToElement(element) {
    await this.driver.executeScript(
      'arguments[0].scrollIntoView(true)',
      element,
    );
  }

  async assertElementNotPresent(locator) {
    let dataTab;
    try {
      dataTab = await this.findElement(locator);
    } catch (err) {
      assert(
        err instanceof webdriverError.NoSuchElementError ||
          err instanceof webdriverError.TimeoutError,
      );
    }
    assert.ok(!dataTab, 'Found element that should not be present');
  }

  // Navigation

  async navigate(page = Driver.PAGES.HOME) {
    return await this.driver.get(`${this.extensionUrl}/${page}.html`);
  }

  // Metrics

  async collectMetrics() {
    return await this.driver.executeScript(collectMetrics);
  }

  // Window management

  async openNewPage(url) {
    const newHandle = await this.driver.switchTo().newWindow();
    await this.driver.get(url);
    return newHandle;
  }

  async switchToWindow(handle) {
    await this.driver.switchTo().window(handle);
  }

  async getAllWindowHandles() {
    return await this.driver.getAllWindowHandles();
  }

  async waitUntilXWindowHandles(x, delayStep = 1000, timeout = 5000) {
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

  async switchToWindowWithTitle(title, windowHandles) {
    // eslint-disable-next-line no-param-reassign
    windowHandles = windowHandles || (await this.driver.getAllWindowHandles());

    for (const handle of windowHandles) {
      await this.driver.switchTo().window(handle);
      const handleTitle = await this.driver.getTitle();
      if (handleTitle === title) {
        return handle;
      }
    }

    throw new Error(`No window with title: ${title}`);
  }

  /**
   * Closes all windows except those in the given list of exceptions
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

  async verboseReportOnFailure(title) {
    const artifactDir = `./test-artifacts/${this.browser}/${title}`;
    const filepathBase = `${artifactDir}/test-failure`;
    await fs.mkdir(artifactDir, { recursive: true });
    const screenshot = await this.driver.takeScreenshot();
    await fs.writeFile(`${filepathBase}-screenshot.png`, screenshot, {
      encoding: 'base64',
    });
    const htmlSource = await this.driver.getPageSource();
    await fs.writeFile(`${filepathBase}-dom.html`, htmlSource);
    const uiState = await this.driver.executeScript(
      () => window.getCleanAppState && window.getCleanAppState(),
    );
    await fs.writeFile(
      `${filepathBase}-state.json`,
      JSON.stringify(uiState, null, 2),
    );
  }

  async checkBrowserForConsoleErrors() {
    const ignoredLogTypes = ['WARNING'];
    const ignoredErrorMessages = [
      // Third-party Favicon 404s show up as errors
      'favicon.ico - Failed to load resource: the server responded with a status of 404 (Not Found)',
    ];
    const browserLogs = await this.driver.manage().logs().get('browser');
    const errorEntries = browserLogs.filter(
      (entry) => !ignoredLogTypes.includes(entry.level.toString()),
    );
    const errorObjects = errorEntries.map((entry) => entry.toJSON());
    return errorObjects.filter(
      (entry) =>
        !ignoredErrorMessages.some((message) =>
          entry.message.includes(message),
        ),
    );
  }
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

Driver.PAGES = {
  HOME: 'home',
  NOTIFICATION: 'notification',
  POPUP: 'popup',
};

module.exports = Driver;
