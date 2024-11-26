const path = require('path');
const { promises: fs, writeFileSync, readFileSync } = require('fs');
const BigNumber = require('bignumber.js');
const mockttp = require('mockttp');
const detectPort = require('detect-port');
const { difference } = require('lodash');
const createStaticServer = require('../../development/create-static-server');
const { setupMocking } = require('./mock-e2e');
const { Ganache } = require('./seeder/ganache');
const FixtureServer = require('./fixture-server');
const PhishingWarningPageServer = require('./phishing-warning-page-server');
const { buildWebDriver } = require('./webdriver');
const { PAGES } = require('./webdriver/driver');
const GanacheSeeder = require('./seeder/ganache-seeder');
const { Bundler } = require('./bundler');
const { SMART_CONTRACTS } = require('./seeder/smart-contracts');
const { setManifestFlags } = require('./set-manifest-flags');
const {
  ERC_4337_ACCOUNT,
  DEFAULT_GANACHE_ETH_BALANCE_DEC,
} = require('./constants');
const {
  getServerMochaToBackground,
} = require('./background-socket/server-mocha-to-background');

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

const convertETHToHexGwei = (eth) => convertToHexValue(eth * 10 ** 18);

/**
 * @typedef {object} Fixtures
 * @property {import('./webdriver/driver').Driver} driver - The driver number.
 * @property {ContractAddressRegistry | undefined} contractRegistry - The contract registry.
 * @property {Ganache | undefined} ganacheServer - The Ganache server.
 * @property {Ganache | undefined} secondaryGanacheServer - The secondary Ganache server.
 * @property {mockttp.MockedEndpoint[]} mockedEndpoint - The mocked endpoint.
 * @property {Bundler} bundlerServer - The bundler server.
 * @property {mockttp.Mockttp} mockServer - The mock server.
 * @property {object} manifestFlags - Flags to add to the manifest in order to change things at runtime.
 */

/**
 *
 * @param {object} options
 * @param {({driver: Driver, mockedEndpoint: MockedEndpoint}: TestSuiteArguments) => Promise<void>} testSuite
 */
async function withFixtures(options, testSuite) {
  const {
    dapp,
    fixtures,
    ganacheOptions,
    smartContract,
    driverOptions,
    dappOptions,
    staticServerOptions,
    title,
    ignoredConsoleErrors = [],
    dappPath = undefined,
    disableGanache,
    disableServerMochaToBackground = false,
    dappPaths,
    testSpecificMock = function () {
      // do nothing.
    },
    useBundler,
    usePaymaster,
    ethConversionInUsd,
    manifestFlags,
  } = options;

  const fixtureServer = new FixtureServer();
  let ganacheServer;
  if (!disableGanache) {
    ganacheServer = new Ganache();
  }
  const bundlerServer = new Bundler();
  const https = await mockttp.generateCACertificate();
  const mockServer = mockttp.getLocal({ https, cors: true });
  const secondaryGanacheServer = [];
  let numberOfDapps = dapp ? 1 : 0;
  const dappServer = [];
  const phishingPageServer = new PhishingWarningPageServer();

  if (!disableServerMochaToBackground) {
    getServerMochaToBackground();
  }

  let webDriver;
  let driver;
  let failed = false;
  try {
    if (!disableGanache) {
      await ganacheServer.start(ganacheOptions);
    }
    let contractRegistry;

    if (smartContract && !disableGanache) {
      const ganacheSeeder = new GanacheSeeder(ganacheServer.getProvider());
      const contracts =
        smartContract instanceof Array ? smartContract : [smartContract];
      await Promise.all(
        contracts.map((contract) =>
          ganacheSeeder.deploySmartContract(contract),
        ),
      );
      contractRegistry = ganacheSeeder.getContractRegistry();
    }

    await fixtureServer.start();
    fixtureServer.loadJsonState(fixtures, contractRegistry);

    if (ganacheOptions?.concurrent) {
      ganacheOptions.concurrent.forEach(async (ganacheSettings) => {
        const { port, chainId, ganacheOptions2 } = ganacheSettings;
        const server = new Ganache();
        secondaryGanacheServer.push(server);
        await server.start({
          blockTime: 2,
          chain: { chainId },
          port,
          vmErrorsOnRPCResponse: false,
          ...ganacheOptions2,
        });
      });
    }

    if (!disableGanache && useBundler) {
      await initBundler(bundlerServer, ganacheServer, usePaymaster);
    }

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
        dappServer.push(
          createStaticServer({ public: dappDirectory, ...staticServerOptions }),
        );
        dappServer[i].listen(`${dappBasePort + i}`);
        await new Promise((resolve, reject) => {
          dappServer[i].on('listening', resolve);
          dappServer[i].on('error', reject);
        });
      }
    }
    const { mockedEndpoint, getPrivacyReport } = await setupMocking(
      mockServer,
      testSpecificMock,
      {
        chainId: ganacheOptions?.chainId || 1337,
        ethConversionInUsd,
      },
    );
    if ((await detectPort(8000)) !== 8000) {
      throw new Error(
        'Failed to set up mock server, something else may be running on port 8000.',
      );
    }
    await mockServer.start(8000);

    setManifestFlags(manifestFlags);

    driver = (await buildWebDriver(driverOptions)).driver;
    webDriver = driver.driver;

    if (process.env.SELENIUM_BROWSER === 'chrome') {
      await driver.checkBrowserForExceptions(ignoredConsoleErrors);
      await driver.checkBrowserForConsoleErrors(ignoredConsoleErrors);
    }

    let driverProxy;
    if (process.env.E2E_DEBUG === 'true') {
      driverProxy = new Proxy(driver, {
        get(target, prop, receiver) {
          const originalProperty = target[prop];
          if (typeof originalProperty === 'function') {
            return (...args) => {
              console.log(
                `${new Date().toISOString()} [driver] Called '${prop}' with arguments ${JSON.stringify(
                  args,
                ).slice(0, 224)}`, // limit the length of the log entry to 224 characters
              );
              return originalProperty.bind(target)(...args);
            };
          }
          return Reflect.get(target, prop, receiver);
        },
      });
    }

    console.log(`\nExecuting testcase: '${title}'\n`);

    await testSuite({
      driver: driverProxy ?? driver,
      contractRegistry,
      ganacheServer,
      secondaryGanacheServer,
      mockedEndpoint,
      bundlerServer,
      mockServer,
    });

    const errorsAndExceptions = driver.summarizeErrorsAndExceptions();
    if (errorsAndExceptions) {
      throw new Error(errorsAndExceptions);
    }

    // Evaluate whether any new hosts received network requests during E2E test
    // suite execution. If so, fail the test unless the
    // --update-privacy-snapshot was specified. In that case, update the
    // snapshot file.
    const privacySnapshotRaw = readFileSync('./privacy-snapshot.json');
    const privacySnapshot = JSON.parse(privacySnapshotRaw);
    const privacyReport = getPrivacyReport();

    // We must add to our privacyReport all of the known hosts that are
    // included in the privacySnapshot. If no new hosts were requested during
    // this test suite execution, then the mergedReport and the privacySnapshot
    // should be identical.
    const mergedReport = [
      ...new Set([...privacyReport, ...privacySnapshot]),
    ].sort();

    // To determine if a new host was requested, we use the lodash difference
    // method to generate an array of the items included in the first argument
    // but not in the second
    const newHosts = difference(mergedReport, privacySnapshot);

    if (newHosts.length > 0) {
      if (process.env.UPDATE_PRIVACY_SNAPSHOT === 'true') {
        writeFileSync(
          './privacy-snapshot.json',
          JSON.stringify(mergedReport, null, 2),
        );
      } else {
        throw new Error(
          `A new host not contained in the privacy-snapshot received a network
           request during test execution. Please update the privacy-snapshot
           file by passing the --update-privacy-snapshot option to the test
           command or add the new hosts to the snapshot manually.

           New hosts found: ${newHosts}.`,
        );
      }
    }

    // At this point the suite has executed successfully, so we can log out a success message
    // (Note: a Chrome browser error will unfortunately pop up after this success message)
    console.log(`\nSuccess on testcase: '${title}'\n`);
  } catch (error) {
    failed = true;
    if (webDriver) {
      try {
        await driver.verboseReportOnFailure(title, error);
      } catch (verboseReportError) {
        console.error(verboseReportError);
      }
      if (
        process.env.E2E_LEAVE_RUNNING !== 'true' &&
        (driver.errors.length > 0 || driver.exceptions.length > 0)
      ) {
        /**
         * Navigate to the background
         * forcing background exceptions to be captured
         * proving more helpful context
         */
        await driver.navigate(PAGES.BACKGROUND);
      }
    }

    // Add information to the end of the error message that should surface in the "Tests" tab of CircleCI
    if (process.env.CIRCLE_NODE_INDEX) {
      error.message += `\n  (Ran on CircleCI Node ${process.env.CIRCLE_NODE_INDEX} of ${process.env.CIRCLE_NODE_TOTAL}, Job ${process.env.CIRCLE_JOB})`;
    }

    throw error;
  } finally {
    if (!failed || process.env.E2E_LEAVE_RUNNING !== 'true') {
      await fixtureServer.stop();
      if (ganacheServer) {
        await ganacheServer.quit();
      }

      if (ganacheOptions?.concurrent) {
        secondaryGanacheServer.forEach(async (server) => {
          await server.quit();
        });
      }

      if (useBundler) {
        await bundlerServer.stop();
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

      // Since mockServer could be stop'd at another location,
      // use a try/catch to avoid an error
      try {
        await mockServer.stop();
      } catch (e) {
        console.log('mockServer already stopped');
      }
    }
  }
}

const WINDOW_TITLES = Object.freeze({
  ExtensionInFullScreenView: 'MetaMask',
  InstalledExtensions: 'Extensions',
  Dialog: 'MetaMask Dialog',
  Phishing: 'MetaMask Phishing Detection',
  ServiceWorkerSettings: 'Inspect with Chrome Developer Tools',
  SnapSimpleKeyringDapp: 'SSK - Simple Snap Keyring',
  TestDApp: 'E2E Test Dapp',
  TestSnaps: 'Test Snaps',
  ERC4337Snap: 'Account Abstraction Snap',
});

/**
 * @param {*} driver - Selenium driver
 * @param {*} handlesCount - total count of windows that should be loaded
 * @returns handles - an object with window handles, properties in object represent windows:
 *            1. extension: MetaMask extension window
 *            2. dapp: test-app window
 *            3. popup: MetaMask extension popup window
 */
const getWindowHandles = async (driver, handlesCount) => {
  await driver.waitUntilXWindowHandles(handlesCount);
  const windowHandles = await driver.getAllWindowHandles();

  const extension = windowHandles[0];
  const dapp = await driver.switchToWindowWithTitle(
    WINDOW_TITLES.TestDApp,
    windowHandles,
  );
  const popup = windowHandles.find(
    (handle) => handle !== extension && handle !== dapp,
  );
  return { extension, dapp, popup };
};

const DAPP_HOST_ADDRESS = '127.0.0.1:8080';
const DAPP_URL = `http://${DAPP_HOST_ADDRESS}`;
const DAPP_ONE_URL = 'http://127.0.0.1:8081';
const DAPP_TWO_URL = 'http://127.0.0.1:8082';

const openDapp = async (driver, contract = null, dappURL = DAPP_URL) => {
  return contract
    ? await driver.openNewPage(`${dappURL}/?contract=${contract}`)
    : await driver.openNewPage(dappURL);
};

const openDappConnectionsPage = async (driver) => {
  await driver.openNewPage(
    `${driver.extensionUrl}/home.html#connections/${encodeURIComponent(
      DAPP_URL,
    )}`,
  );
};

const createDappTransaction = async (driver, transaction) => {
  await openDapp(
    driver,
    null,
    `${DAPP_URL}/request?method=eth_sendTransaction&params=${JSON.stringify([
      transaction,
    ])}`,
  );
};

const switchToOrOpenDapp = async (
  driver,
  contract = null,
  dappURL = DAPP_URL,
) => {
  const handle = await driver.windowHandles.switchToWindowIfKnown(
    WINDOW_TITLES.TestDApp,
  );

  if (!handle) {
    await openDapp(driver, contract, dappURL);
  }
};

/**
 *
 * @param {import('./webdriver/driver').Driver} driver
 */
const connectToDapp = async (driver) => {
  await openDapp(driver);
  // Connect to dapp
  await driver.clickElement({
    text: 'Connect',
    tag: 'button',
  });

  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  await driver.clickElementAndWaitForWindowToClose({
    text: 'Connect',
    tag: 'button',
  });
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
};

const PRIVATE_KEY =
  '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC';

const PRIVATE_KEY_TWO =
  '0xf444f52ea41e3a39586d7069cb8e8233e9f6b9dea9cbb700cce69ae860661cc8';

const ACCOUNT_1 = '0x5cfe73b6021e818b776b421b1c4db2474086a7e1';
const ACCOUNT_2 = '0x09781764c08de8ca82e156bbf156a3ca217c7950';

const defaultGanacheOptions = {
  accounts: [
    {
      secretKey: PRIVATE_KEY,
      balance: convertETHToHexGwei(DEFAULT_GANACHE_ETH_BALANCE_DEC),
    },
  ],
};

const defaultGanacheOptionsForType2Transactions = {
  ...defaultGanacheOptions,
  // EVM version that supports type 2 transactions (EIP1559)
  hardfork: 'london',
};

const multipleGanacheOptions = {
  accounts: [
    {
      secretKey: PRIVATE_KEY,
      balance: convertETHToHexGwei(DEFAULT_GANACHE_ETH_BALANCE_DEC),
    },
    {
      secretKey: PRIVATE_KEY_TWO,
      balance: convertETHToHexGwei(DEFAULT_GANACHE_ETH_BALANCE_DEC),
    },
  ],
};

const multipleGanacheOptionsForType2Transactions = {
  ...multipleGanacheOptions,
  // EVM version that supports type 2 transactions (EIP1559)
  hardfork: 'london',
};

const generateGanacheOptions = ({
  secretKey = PRIVATE_KEY,
  balance = convertETHToHexGwei(DEFAULT_GANACHE_ETH_BALANCE_DEC),
  ...otherProps
}) => {
  const accounts = [
    {
      secretKey,
      balance,
    },
  ];

  return {
    accounts,
    ...otherProps, // eg: hardfork
  };
};

// Edit priority gas fee form
const editGasFeeForm = async (driver, gasLimit, gasPrice) => {
  const inputs = await driver.findElements('input[type="number"]');
  const gasLimitInput = inputs[0];
  const gasPriceInput = inputs[1];
  await gasLimitInput.fill(gasLimit);
  await gasPriceInput.fill(gasPrice);
  await driver.clickElement({ text: 'Save', tag: 'button' });
};

const openActionMenuAndStartSendFlow = async (driver) => {
  await driver.clickElement('[data-testid="eth-overview-send"]');
};

const clickNestedButton = async (driver, tabName) => {
  try {
    await driver.clickElement({ text: tabName, tag: 'button' });
  } catch (error) {
    await driver.clickElement({
      xpath: `//*[contains(text(),"${tabName}")]/parent::button`,
    });
  }
};

const sendScreenToConfirmScreen = async (
  driver,
  recipientAddress,
  quantity,
) => {
  await openActionMenuAndStartSendFlow(driver);
  await driver.waitForSelector('[data-testid="ens-input"]');
  await driver.pasteIntoField('[data-testid="ens-input"]', recipientAddress);
  await driver.fill('.unit-input__input', quantity);

  // check if element exists and click it
  await driver.clickElementSafe({
    text: 'I understand',
    tag: 'button',
  });

  await driver.clickElement({ text: 'Continue', tag: 'button' });
};

const sendTransaction = async (
  driver,
  recipientAddress,
  quantity,
  isAsyncFlow = false,
) => {
  await openActionMenuAndStartSendFlow(driver);
  await driver.waitForSelector('[data-testid="ens-input"]');
  await driver.pasteIntoField('[data-testid="ens-input"]', recipientAddress);
  await driver.fill('.unit-input__input', quantity);

  await driver.clickElement({
    text: 'Continue',
    tag: 'button',
  });
  await driver.clickElement({
    text: 'Confirm',
    tag: 'button',
  });

  // the default is to do this block, but if we're testing an async flow, it would get stuck here
  if (!isAsyncFlow) {
    await driver.clickElement('[data-testid="account-overview__activity-tab"]');
    await driver.assertElementNotPresent('.transaction-list-item--unconfirmed');
    await driver.findElement('.transaction-list-item');
  }
};

const TEST_SEED_PHRASE =
  'forum vessel pink push lonely enact gentle tail admit parrot grunt dress';

const TEST_SEED_PHRASE_TWO =
  'phrase upgrade clock rough situate wedding elder clever doctor stamp excess tent';

/**
 * Checks the balance for a specific address. If no address is provided, it defaults to the first address.
 * This function is typically used during onboarding to ensure the state is retrieved correctly from metamaskState,
 * or after a transaction is made.
 *
 * @param {WebDriver} driver - The WebDriver instance.
 * @param {Ganache} [ganacheServer] - The Ganache server instance (optional).
 * @param {string} [address] - The address to check the balance for (optional).
 */
const locateAccountBalanceDOM = async (
  driver,
  ganacheServer,
  address = null,
) => {
  const balanceSelector = '[data-testid="eth-overview__primary-currency"]';
  if (ganacheServer) {
    const balance = await ganacheServer.getBalance(address);
    await driver.waitForSelector({
      css: balanceSelector,
      text: `${balance} ETH`,
    });
  } else {
    await driver.findElement(balanceSelector);
  }
};

const WALLET_PASSWORD = 'correct horse battery staple';

/**
 * Unlocks the wallet using the provided password.
 * This method is intended to replace driver.navigate and should not be called after driver.navigate.
 *
 * @param {WebDriver} driver - The webdriver instance
 * @param {object} [options] - Options for unlocking the wallet
 * @param {boolean} [options.navigate] - Whether to navigate to the root page prior to unlocking - defaults to true
 * @param {boolean} [options.waitLoginSuccess] - Whether to wait for the login to succeed - defaults to true
 * @param {string} [options.password] - Password to unlock wallet - defaults to shared WALLET_PASSWORD
 */
async function unlockWallet(
  driver,
  { navigate = true, waitLoginSuccess = true, password = WALLET_PASSWORD } = {},
) {
  if (navigate) {
    await driver.navigate();
  }

  await driver.fill('#password', password);
  await driver.press('#password', driver.Key.ENTER);

  if (waitLoginSuccess) {
    await driver.assertElementNotPresent('[data-testid="unlock-page"]');
  }
}

const logInWithBalanceValidation = async (driver, ganacheServer) => {
  await unlockWallet(driver);
  // Wait for balance to load
  await locateAccountBalanceDOM(driver, ganacheServer);
};

function roundToXDecimalPlaces(number, decimalPlaces) {
  return Math.round(number * 10 ** decimalPlaces) / 10 ** decimalPlaces;
}

function generateRandNumBetween(x, y) {
  const min = Math.min(x, y);
  const max = Math.max(x, y);
  const randomNumber = Math.random() * (max - min) + min;

  return randomNumber;
}

function genRandInitBal(minETHBal = 10, maxETHBal = 100, decimalPlaces = 4) {
  const initialBalance = roundToXDecimalPlaces(
    generateRandNumBetween(minETHBal, maxETHBal),
    decimalPlaces,
  );

  const initialBalanceInHex = convertETHToHexGwei(initialBalance);

  return { initialBalance, initialBalanceInHex };
}

/**
 * This method handles clicking the sign button on signature confirmation
 * screen.
 *
 * @param {object} options - Options for the function.
 * @param {WebDriver} options.driver - The WebDriver instance controlling the browser.
 * @param {boolean} [options.snapSigInsights] - Whether to wait for the insights snap to be ready before clicking the sign button.
 */
async function clickSignOnSignatureConfirmation({
  driver,
  snapSigInsights = false,
}) {
  if (snapSigInsights) {
    // there is no condition we can wait for to know the snap is ready,
    // so we have to add a small delay as the last alternative to avoid flakiness.
    await driver.delay(regularDelayMs);
  }

  await driver.clickElement({ text: 'Sign', tag: 'button' });
}

/**
 * Some signing methods have extra security that requires the user to click a
 * button to validate that they have verified the details. This method handles
 * performing the necessary steps to click that button.
 *
 * @param {WebDriver} driver
 */
async function validateContractDetails(driver) {
  const verifyDetailsBtnSelector =
    '.signature-request-content__verify-contract-details';

  await driver.clickElement(verifyDetailsBtnSelector);
  await driver.clickElement({ text: 'Got it', tag: 'button' });

  await driver.clickElementSafe(
    '[data-testid="signature-request-scroll-button"]',
  );
}

/**
 * @deprecated since the background socket was added, and special handling is no longer necessary
 * Just call `await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog)` instead.
 * @param {WebDriver} driver
 */
async function switchToNotificationWindow(driver) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
}

/**
 * When mocking the segment server and returning an array of mocks from the
 * mockServer method, this method will allow getting all of the seen requests
 * for each mock in the array.
 *
 * @param {WebDriver} driver
 * @param {import('mockttp').MockedEndpoint[]} mockedEndpoints
 * @param {boolean} hasRequest
 * @returns {Promise<import('mockttp/dist/pluggable-admin').MockttpClientResponse[]>}
 */
async function getEventPayloads(driver, mockedEndpoints, hasRequest = true) {
  await driver.wait(
    async () => {
      let isPending = true;

      for (const mockedEndpoint of mockedEndpoints) {
        isPending = await mockedEndpoint.isPending();
      }

      return isPending === !hasRequest;
    },
    driver.timeout,
    true,
  );
  const mockedRequests = [];
  for (const mockedEndpoint of mockedEndpoints) {
    mockedRequests.push(...(await mockedEndpoint.getSeenRequests()));
  }

  return (
    await Promise.all(
      mockedRequests.map(async (req) => {
        return (await req.body?.getJson())?.batch;
      }),
    )
  ).flat();
}

// Asserts that  each request passes all assertions in one group of assertions, and the order does not matter.
function assertInAnyOrder(requests, assertions) {
  // Clone the array to avoid mutating the original
  const assertionsClone = [...assertions];

  return (
    requests.every((request) => {
      for (let a = 0; a < assertionsClone.length; a++) {
        const assertionArray = assertionsClone[a];

        const passed = assertionArray.reduce(
          (acc, currAssertionFn) => currAssertionFn(request) && acc,
          true,
        );

        if (passed) {
          // Remove the used assertion array
          assertionsClone.splice(a, 1);
          // Exit the loop early since we found a matching assertion
          return true;
        }
      }

      // No matching assertion found for this request
      return false;
    }) &&
    // Ensure all assertions were used
    assertionsClone.length === 0
  );
}

async function getCleanAppState(driver) {
  return await driver.executeScript(
    () =>
      window.stateHooks?.getCleanAppState &&
      window.stateHooks.getCleanAppState(),
  );
}

async function initBundler(bundlerServer, ganacheServer, usePaymaster) {
  try {
    const ganacheSeeder = new GanacheSeeder(ganacheServer.getProvider());

    await ganacheSeeder.deploySmartContract(SMART_CONTRACTS.ENTRYPOINT);

    await ganacheSeeder.deploySmartContract(
      SMART_CONTRACTS.SIMPLE_ACCOUNT_FACTORY,
    );

    if (usePaymaster) {
      await ganacheSeeder.deploySmartContract(
        SMART_CONTRACTS.VERIFYING_PAYMASTER,
      );

      await ganacheSeeder.paymasterDeposit(convertETHToHexGwei(1));
    }

    await ganacheSeeder.transfer(ERC_4337_ACCOUNT, convertETHToHexGwei(10));

    await bundlerServer.start();
  } catch (error) {
    console.log('Failed to initialize bundler', error);
    throw error;
  }
}

/**
 * Rather than using the FixtureBuilder#withPreferencesController to set the setting
 * we need to manually set the setting because the migration #122 overrides this.
 * We should be able to remove this when we delete the redesignedConfirmationsEnabled setting.
 *
 * @param driver
 */
async function tempToggleSettingRedesignedConfirmations(driver) {
  // Ensure we are on the extension window
  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);

  // Open settings menu button
  await driver.clickElement('[data-testid="account-options-menu-button"]');

  // fix race condition with mmi build
  if (process.env.MMI) {
    await driver.waitForSelector('[data-testid="global-menu-mmi-portfolio"]');
  }

  // Click settings from dropdown menu
  await driver.clickElement('[data-testid="global-menu-settings"]');

  // Click Experimental tab
  const experimentalTabRawLocator = {
    text: 'Experimental',
    tag: 'div',
  };
  await driver.clickElement(experimentalTabRawLocator);

  // Click redesignedConfirmationsEnabled toggle
  await driver.clickElement(
    '[data-testid="toggle-redesigned-confirmations-container"]',
  );
}

/**
 * Rather than using the FixtureBuilder#withPreferencesController to set the setting
 * we need to manually set the setting because the migration #132 overrides this.
 * We should be able to remove this when we delete the redesignedTransactionsEnabled setting.
 *
 * @param driver
 */
async function tempToggleSettingRedesignedTransactionConfirmations(driver) {
  // Ensure we are on the extension window
  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);

  // Open settings menu button
  await driver.clickElement('[data-testid="account-options-menu-button"]');

  // fix race condition with mmi build
  if (process.env.MMI) {
    await driver.waitForSelector('[data-testid="global-menu-mmi-portfolio"]');
  }

  // Click settings from dropdown menu
  await driver.clickElement('[data-testid="global-menu-settings"]');

  // Click Experimental tab
  const experimentalTabRawLocator = {
    text: 'Experimental',
    tag: 'div',
  };
  await driver.clickElement(experimentalTabRawLocator);

  // Click redesigned transactions toggle
  await driver.clickElement(
    '[data-testid="toggle-redesigned-transactions-container"]',
  );

  // Close settings page
  await driver.clickElement(
    '.settings-page__header__title-container__close-button',
  );
}

/**
 * Opens the account options menu safely, handling potential race conditions
 * with the MMI build.
 *
 * @param {WebDriver} driver - The WebDriver instance used to interact with the browser.
 * @returns {Promise<void>} A promise that resolves when the menu is opened and any necessary waits are complete.
 */
async function openMenuSafe(driver) {
  await driver.clickElement('[data-testid="account-options-menu-button"]');

  // fix race condition with mmi build
  if (process.env.MMI) {
    await driver.waitForSelector('[data-testid="global-menu-mmi-portfolio"]');
  }
}

const sentryRegEx = /^https:\/\/sentry\.io\/api\/\d+\/envelope/gu;

module.exports = {
  DAPP_HOST_ADDRESS,
  DAPP_URL,
  DAPP_ONE_URL,
  DAPP_TWO_URL,
  TEST_SEED_PHRASE,
  TEST_SEED_PHRASE_TWO,
  PRIVATE_KEY,
  PRIVATE_KEY_TWO,
  ACCOUNT_1,
  ACCOUNT_2,
  getWindowHandles,
  convertToHexValue,
  tinyDelayMs,
  regularDelayMs,
  largeDelayMs,
  veryLargeDelayMs,
  withFixtures,
  createDownloadFolder,
  openDapp,
  openDappConnectionsPage,
  createDappTransaction,
  switchToOrOpenDapp,
  connectToDapp,
  multipleGanacheOptions,
  defaultGanacheOptions,
  defaultGanacheOptionsForType2Transactions,
  multipleGanacheOptionsForType2Transactions,
  sendTransaction,
  sendScreenToConfirmScreen,
  unlockWallet,
  logInWithBalanceValidation,
  locateAccountBalanceDOM,
  generateGanacheOptions,
  WALLET_PASSWORD,
  WINDOW_TITLES,
  convertETHToHexGwei,
  roundToXDecimalPlaces,
  generateRandNumBetween,
  clickSignOnSignatureConfirmation,
  validateContractDetails,
  switchToNotificationWindow,
  getEventPayloads,
  assertInAnyOrder,
  genRandInitBal,
  openActionMenuAndStartSendFlow,
  getCleanAppState,
  editGasFeeForm,
  clickNestedButton,
  tempToggleSettingRedesignedConfirmations,
  tempToggleSettingRedesignedTransactionConfirmations,
  openMenuSafe,
  sentryRegEx,
};
