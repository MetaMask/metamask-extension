const assert = require('assert');
const path = require('path');
const { By, Key } = require('selenium-webdriver');

const { largeDelayMs } = require('./helpers');
const { buildWebDriver } = require('./webdriver');
const FixtureServer = require('./fixture-server');
const Ganache = require('./ganache');

const fixtureServer = new FixtureServer();

const ganacheServer = new Ganache();

describe('MetaMask', function () {
  let driver;

  this.timeout(0);
  this.bail(true);

  before(async function () {
    await ganacheServer.start();
    await fixtureServer.start();
    await fixtureServer.loadState(
      path.join(__dirname, 'fixtures', 'imported-account'),
    );
    const result = await buildWebDriver();
    driver = result.driver;
    await driver.navigate();
  });

  afterEach(async function () {
    if (process.env.SELENIUM_BROWSER === 'chrome') {
      const errors = await driver.checkBrowserForConsoleErrors();
      if (errors.length) {
        const errorReports = errors.map((err) => err.message);
        const errorMessage = `Errors found in browser console:\n${errorReports.join(
          '\n',
        )}`;
        console.error(new Error(errorMessage));
      }
    }
    if (this.currentTest.state === 'failed') {
      await driver.verboseReportOnFailure(this.currentTest.title);
    }
  });

  after(async function () {
    await ganacheServer.quit();
    await fixtureServer.stop();
    await driver.quit();
  });

  it('accepts the account password after lock', async function () {
    await driver.delay(1000);
    const passwordField = await driver.findElement(By.id('password'));
    await passwordField.sendKeys('correct horse battery staple');
    await passwordField.sendKeys(Key.ENTER);
    await driver.delay(largeDelayMs * 4);
  });

  describe('Swaps Feature', function () {
    it('', async function () {
      assert(true);
    });
  });
});
