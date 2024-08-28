const chrome = require('selenium-webdriver/chrome');
const firefox = require('selenium-webdriver/firefox');
const { buildWebDriver } = require('../webdriver');

let driverService;
let driver;

/**
 * Creates the driver service.
 * This function should be called before all tests.
 *
 * @async
 * @function createServiceBuilder
 * @returns {Promise<void>} A promise that resolves when the driver service is created.
 */
async function createServiceBuilder() {
  console.log('Creating driver service');
  const browser = process.env.SELENIUM_BROWSER;
  if (browser === 'chrome') {
    driverService = new chrome.ServiceBuilder();
  } else if (browser === 'firefox') {
    driverService = new firefox.ServiceBuilder();
  }
}

/**
 * Stops the driver service if it is running.
 * This function should be called after all tests.
 *
 * @async
 * @function stopServiceBuilder
 * @returns {Promise<void>} A promise that resolves when the driver service is stopped.
 */
async function stopServiceBuilder() {
  if (driverService) {
    console.log('Stopping driver service');
    await driverService.stop();
  }
}

/**
 * Creates a new WebDriver instance using the specified options and the existing driver service.
 *
 * @async
 * @function createDriver
 * @param {object} [driverOptions] - Options to configure the WebDriver instance.
 * @returns {Promise<object>} A promise that resolves to the created WebDriver instance.
 */
async function createDriver(driverOptions = {}) {
  driver = (await buildWebDriver({ ...driverOptions, driverService })).driver;
  return driver;
}

/**
 * Quits the WebDriver instance if it is running.
 *
 * @async
 * @function quitDriver
 * @returns {Promise<void>} A promise that resolves when the WebDriver instance is quit.
 */
async function quitDriver() {
  if (driver) {
    await driver.quit();
  }
}

module.exports = {
  createServiceBuilder,
  stopServiceBuilder,
  createDriver,
  quitDriver,
  getDriverServiceAddress: () => driverService.address(),
};
