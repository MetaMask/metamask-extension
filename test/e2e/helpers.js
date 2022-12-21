const path = require('path');
const { promises: fs } = require('fs');
const BigNumber = require('bignumber.js');
const mockttp = require('mockttp');
const createStaticServer = require('../../development/create-static-server');
const { setupMocking } = require('./mock-e2e');
const Ganache = require('./ganache');
const FixtureServer = require('./fixture-server');
const PhishingWarningPageServer = require('./phishing-warning-page-server');
const { buildWebDriver } = require('./webdriver');
const { PAGES } = require('./webdriver/driver');
const { ensureXServerIsRunning } = require('./x-server');
const GanacheSeeder = require('./seeder/ganache-seeder');

const tinyDelayMs = 200;
const regularDelayMs = tinyDelayMs * 2;
const largeDelayMs = regularDelayMs * 2;
const veryLargeDelayMs = largeDelayMs * 2;
const dappBasePort = 8080;

const createDownloadFolder = async (downloadsFolder) => {
  await fs.rm(downloadsFolder, { recursive: true, force: true });
  await fs.mkdir(downloadsFolder, { recursive: true });
};

const convertToHexValue = (val) => `0x${new BigNumber(val, 10).toString(16)}`;

async function withFixtures(options, testSuite) {
  const {
    dapp,
    fixtures,
    ganacheOptions,
    smartContract,
    driverOptions,
    dappOptions,
    title,
    failOnConsoleError = true,
    dappPath = undefined,
    dappPaths,
    testSpecificMock = function () {
      // do nothing.
    },
  } = options;
  const fixtureServer = new FixtureServer();
  const ganacheServer = new Ganache();
  const https = await mockttp.generateCACertificate();
  const mockServer = mockttp.getLocal({ https, cors: true });
  let secondaryGanacheServer;
  let numberOfDapps = dapp ? 1 : 0;
  const dappServer = [];
  const phishingPageServer = new PhishingWarningPageServer();

  let webDriver;
  let driver;
  const errors = [];
  let failed = false;
  try {
    await ganacheServer.start(ganacheOptions);
    let contractRegistry;

    if (smartContract) {
      const ganacheSeeder = new GanacheSeeder(ganacheServer.getProvider());
      await ganacheSeeder.deploySmartContract(smartContract);
      contractRegistry = ganacheSeeder.getContractRegistry();
    }

    if (ganacheOptions?.concurrent) {
      const { port, chainId } = ganacheOptions.concurrent;
      secondaryGanacheServer = new Ganache();
      await secondaryGanacheServer.start({
        blockTime: 2,
        chain: { chainId },
        port,
        vmErrorsOnRPCResponse: false,
      });
    }
    await fixtureServer.start();
    fixtureServer.loadJsonState(fixtures);
    await phishingPageServer.start();
    if (dapp) {
      if (dappOptions?.numberOfDapps) {
        numberOfDapps = dappOptions.numberOfDapps;
      }
      for (let i = 0; i < numberOfDapps; i++) {
        let dappDirectory;
        if (dappPath || (dappPaths && dappPaths[i])) {
          dappDirectory = path.resolve(__dirname, dappPath || dappPaths[i]);
        } else {
          dappDirectory = path.resolve(
            __dirname,
            '..',
            '..',
            'node_modules',
            '@metamask',
            'test-dapp',
            'dist',
          );
        }
        dappServer.push(createStaticServer(dappDirectory));
        dappServer[i].listen(`${dappBasePort + i}`);
        await new Promise((resolve, reject) => {
          dappServer[i].on('listening', resolve);
          dappServer[i].on('error', reject);
        });
      }
    }
    await setupMocking(mockServer, testSpecificMock);
    await mockServer.start(8000);
    if (
      process.env.SELENIUM_BROWSER === 'chrome' &&
      process.env.CI === 'true'
    ) {
      await ensureXServerIsRunning();
    }
    driver = (await buildWebDriver(driverOptions)).driver;
    webDriver = driver.driver;

    if (process.env.SELENIUM_BROWSER === 'chrome') {
      await driver.checkBrowserForExceptions();
    }

    let driverProxy;
    if (process.env.E2E_DEBUG === 'true') {
      driverProxy = new Proxy(driver, {
        get(target, prop, receiver) {
          const originalProperty = target[prop];
          if (typeof originalProperty === 'function') {
            return (...args) => {
              console.log(
                `[driver] Called '${prop}' with arguments ${JSON.stringify(
                  args,
                )}`,
              );
              return originalProperty.bind(target)(...args);
            };
          }
          return Reflect.get(target, prop, receiver);
        },
      });
    }

    await testSuite({
      driver: driverProxy ?? driver,
      mockServer,
      contractRegistry,
    });

    if (process.env.SELENIUM_BROWSER === 'chrome') {
      errors.concat(await driver.checkBrowserForConsoleErrors(driver));
      if (errors.length) {
        const errorReports = errors.map((err) => err.message);
        const errorMessage = `Errors found in browser console:\n${errorReports.join(
          '\n',
        )}`;
        if (failOnConsoleError) {
          throw new Error(errorMessage);
        } else {
          console.error(new Error(errorMessage));
        }
      }
    }
  } catch (error) {
    failed = true;
    if (webDriver) {
      try {
        await driver.verboseReportOnFailure(title);
      } catch (verboseReportError) {
        console.error(verboseReportError);
      }
      if (
        errors.length === 0 &&
        driver.exceptions.length > 0 &&
        failOnConsoleError
      ) {
        /**
         * Navigate to the background
         * forcing background exceptions to be captured
         * proving more helpful context
         */
        await driver.navigate(PAGES.BACKGROUND);
        const errorMessage = `Errors found in browser console including the background:\n${driver.exceptions.join(
          '\n',
        )}`;
        throw Error(errorMessage);
      }
    }
    throw error;
  } finally {
    if (!failed || process.env.E2E_LEAVE_RUNNING !== 'true') {
      await fixtureServer.stop();
      await ganacheServer.quit();
      if (ganacheOptions?.concurrent) {
        await secondaryGanacheServer.quit();
      }
      if (webDriver) {
        await driver.quit();
      }
      if (dapp) {
        for (let i = 0; i < numberOfDapps; i++) {
          if (dappServer[i] && dappServer[i].listening) {
            await new Promise((resolve, reject) => {
              dappServer[i].close((error) => {
                if (error) {
                  return reject(error);
                }
                return resolve();
              });
            });
          }
        }
      }
      if (phishingPageServer.isRunning()) {
        await phishingPageServer.quit();
      }
      await mockServer.stop();
    }
  }
}

/**
 * @param {*} driver - selinium driver
 * @param {*} handlesCount - total count of windows that should be loaded
 * @returns handles - an object with window handles, properties in object represent windows:
 *            1. extension: metamask extension window
 *            2. dapp: test-app window
 *            3. popup: metsmask extension popup window
 */
const getWindowHandles = async (driver, handlesCount) => {
  await driver.waitUntilXWindowHandles(handlesCount);
  const windowHandles = await driver.getAllWindowHandles();

  const extension = windowHandles[0];
  const dapp = await driver.switchToWindowWithTitle(
    'E2E Test Dapp',
    windowHandles,
  );
  const popup = windowHandles.find(
    (handle) => handle !== extension && handle !== dapp,
  );
  return { extension, dapp, popup };
};

const completeImportSRPOnboardingFlow = async (
  driver,
  seedPhrase,
  password,
) => {
  // welcome
  await driver.clickElement('[data-testid="onboarding-import-wallet"]');

  // metrics
  await driver.clickElement('[data-testid="metametrics-no-thanks"]');

  // import with recovery phrase
  await driver.pasteIntoField(
    '[data-testid="import-srp__srp-word-0"]',
    seedPhrase,
  );
  await driver.clickElement('[data-testid="import-srp-confirm"]');

  // create password
  await driver.fill('[data-testid="create-password-new"]', password);
  await driver.fill('[data-testid="create-password-confirm"]', password);
  await driver.clickElement('[data-testid="create-password-terms"]');
  await driver.clickElement('[data-testid="create-password-import"]');

  // complete
  await driver.clickElement('[data-testid="onboarding-complete-done"]');

  // pin extension
  await driver.clickElement('[data-testid="pin-extension-next"]');
  await driver.clickElement('[data-testid="pin-extension-done"]');
};

const completeImportSRPOnboardingFlowWordByWord = async (
  driver,
  seedPhrase,
  password,
) => {
  // welcome
  await driver.clickElement('[data-testid="onboarding-import-wallet"]');

  // metrics
  await driver.clickElement('[data-testid="metametrics-no-thanks"]');

  // import with recovery phrase, word by word
  const words = seedPhrase.split(' ');
  for (const word of words) {
    await driver.pasteIntoField(
      `[data-testid="import-srp__srp-word-${words.indexOf(word)}"]`,
      word,
    );
  }
  await driver.clickElement('[data-testid="import-srp-confirm"]');

  // create password
  await driver.fill('[data-testid="create-password-new"]', password);
  await driver.fill('[data-testid="create-password-confirm"]', password);
  await driver.clickElement('[data-testid="create-password-terms"]');
  await driver.clickElement('[data-testid="create-password-import"]');

  // complete
  await driver.clickElement('[data-testid="onboarding-complete-done"]');

  // pin extension
  await driver.clickElement('[data-testid="pin-extension-next"]');
  await driver.clickElement('[data-testid="pin-extension-done"]');
};

module.exports = {
  getWindowHandles,
  convertToHexValue,
  tinyDelayMs,
  regularDelayMs,
  largeDelayMs,
  veryLargeDelayMs,
  withFixtures,
  completeImportSRPOnboardingFlow,
  completeImportSRPOnboardingFlowWordByWord,
  createDownloadFolder,
};
