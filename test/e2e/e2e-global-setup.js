const { buildWebDriver } = require('./webdriver');

let driver;

async function globalSetup() {
  driver = (await buildWebDriver({})).driver;
}

async function globalTeardown() {
  if (driver) {
    await driver.quit();
  }
}

module.exports = {
  globalSetup,
  globalTeardown,
  getDriver: () => driver, // Export the global driver
  setDriver: (newDriver) => { driver = newDriver; }, // Export a function to set a new driver
};
