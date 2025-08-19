const path = require('path');
const { promises: fs, writeFileSync, readFileSync } = require('fs');
const BigNumber = require('bignumber.js');
const mockttp = require('mockttp');
const detectPort = require('detect-port');
const { difference } = require('lodash');
const WebSocket = require('ws');
const createStaticServer = require('../../development/create-static-server');
const { setupMocking } = require('./mock-e2e');
const { Anvil } = require('./seeder/anvil');
const { Ganache } = require('./seeder/ganache');
const FixtureServer = require('./fixture-server');
const PhishingWarningPageServer = require('./phishing-warning-page-server');
const { buildWebDriver } = require('./webdriver');
const { PAGES } = require('./webdriver/driver');
const AnvilSeeder = require('./seeder/anvil-seeder');
const GanacheSeeder = require('./seeder/ganache-seeder');
const { Bundler } = require('./bundler');
const { SMART_CONTRACTS } = require('./seeder/smart-contracts');
const { readManifest, setManifestFlags } = require('./set-manifest-flags');
const {
  DEFAULT_LOCAL_NODE_ETH_BALANCE_DEC,
  ERC_4337_ACCOUNT,
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
 * Normalizes the localNodeOptions into a consistent format to handle different data structures.
 * Case 1: A string: localNodeOptions = 'anvil'
 * Case 2: Array of strings: localNodeOptions = ['anvil', 'bitcoin']
 * Case 3: Array of objects: localNodeOptions =
 * [
 *  { type: 'anvil', options: {anvilOpts}},
 *  { type: 'bitcoin',options: {bitcoinOpts}},
 * ]
 * Case 4: Options object without type: localNodeOptions = {options}
 *
 * @param {string | object | Array} localNodeOptions - The input local node options.
 * @returns {Array} The normalized local node options.
 */
function normalizeLocalNodeOptions(localNodeOptions) {
  if (typeof localNodeOptions === 'string') {
    // Case 1: Passing a string
    return [{ type: localNodeOptions, options: {} }];
  } else if (Array.isArray(localNodeOptions)) {
    return localNodeOptions.map((node) => {
      if (typeof node === 'string') {
        // Case 2: Array of strings
        return { type: node, options: {} };
      }
      if (typeof node === 'object' && node !== null) {
        // Case 3: Array of objects
        return {
          type: node.type || 'anvil',
          options: node.options || {},
        };
      }
      throw new Error(`Invalid localNodeOptions entry: ${node}`);
    });
  }
  if (typeof localNodeOptions === 'object' && localNodeOptions !== null) {
    // Case 4: Passing an options object without type
    return [
      {
        type: 'anvil',
        options: localNodeOptions,
      },
    ];
  }
  throw new Error(`Invalid localNodeOptions type: ${typeof localNodeOptions}`);
}

/**
 * @typedef {object} Fixtures
 * @property {import('./webdriver/driver').Driver} driver - The driver number.
 * @property {ContractAddressRegistry | undefined} contractRegistry - The contract registry.
 * @property {string | object | Array} localNodeOptions - The local node(s) and options chosen ('ganache', 'anvil'...).
 * @property {mockttp.MockedEndpoint[]} mockedEndpoint - The mocked endpoint.
 * @property {Bundler} bundlerServer - The bundler server.
 * @property {mockttp.Mockttp} mockServer - The mock server.
 * @property {object} manifestFlags - Flags to add to the manifest in order to change things at runtime.
 * @property {string} extensionId - The extension ID (useful for connecting via `externally_connectable`).
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
    localNodeOptions = 'anvil',
    smartContract,
    driverOptions,
    dappOptions,
    staticServerOptions,
    title,
    ignoredConsoleErrors = [],
    dappPath = undefined,
    disableServerMochaToBackground = false,
    dappPaths,
    testSpecificMock = function () {
      // do nothing.
    },
    useBundler,
    usePaymaster,
    ethConversionInUsd,
    monConversionInUsd,
    manifestFlags,
  } = options;

  // Normalize localNodeOptions
  const localNodeOptsNormalized = normalizeLocalNodeOptions(localNodeOptions);

  const fixtureServer = new FixtureServer();

  const bundlerServer = new Bundler();
  const https = await mockttp.generateCACertificate();
  const mockServer = mockttp.getLocal({ https, cors: true });
  let numberOfDapps = dapp ? 1 : 0;
  const dappServer = [];
  const phishingPageServer = new PhishingWarningPageServer();

  if (!disableServerMochaToBackground) {
    getServerMochaToBackground();
  }

  let webDriver;
  let driver;
  let extensionId;
  let failed = false;

  let localNode;
  const localNodes = [];

  try {
    // Start servers based on the localNodes array
    for (let i = 0; i < localNodeOptsNormalized.length; i++) {
      const nodeType = localNodeOptsNormalized[i].type;
      const nodeOptions = localNodeOptsNormalized[i].options || {};

      switch (nodeType) {
        case 'anvil':
          localNode = new Anvil();
          await localNode.start(nodeOptions);
          localNodes.push(localNode);
          break;

        case 'ganache':
          localNode = new Ganache();
          await localNode.start(nodeOptions);
          localNodes.push(localNode);
          break;

        case 'none':
          break;

        default:
          throw new Error(
            `Unsupported localNode: '${nodeType}'. Cannot start the server.`,
          );
      }
    }

    let contractRegistry;
    let seeder;

    // We default the smart contract seeder to the first node client
    // If there's a future need to deploy multiple smart contracts in multiple clients
    // this assumption is no longer correct and the below code needs to be modified accordingly
    if (smartContract) {
      switch (localNodeOptsNormalized[0].type) {
        case 'anvil':
          seeder = new AnvilSeeder(localNodes[0].getProvider());
          break;

        case 'ganache':
          seeder = new GanacheSeeder(localNodes[0].getProvider());
          break;

        default:
          throw new Error(
            `Unsupported localNode: '${localNodeOptsNormalized[0].type}'. Cannot deploy smart contracts.`,
          );
      }
      const contracts =
        smartContract instanceof Array ? smartContract : [smartContract];

      const hardfork = localNodeOptsNormalized[0].options.hardfork || 'prague';
      for (const contract of contracts) {
        await seeder.deploySmartContract(contract, hardfork);
      }

      contractRegistry = seeder.getContractRegistry();
    }

    await fixtureServer.start();
    fixtureServer.loadJsonState(fixtures, contractRegistry);

    if (localNodes[0] && useBundler) {
      await initBundler(
        bundlerServer,
        localNodes[0],
        usePaymaster,
        localNodeOptsNormalized,
      );
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
        chainId: localNodeOptsNormalized[0]?.options.chainId || 1337,
        ethConversionInUsd,
        monConversionInUsd,
      },
    );
    if ((await detectPort(8000)) !== 8000) {
      throw new Error(
        'Failed to set up mock server, something else may be running on port 8000.',
      );
    }
    await mockServer.start(8000);

    await setManifestFlags(manifestFlags);

    const wd = await buildWebDriver({
      ...driverOptions,
      disableServerMochaToBackground,
    });
    driver = wd.driver;
    extensionId = wd.extensionId;
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
      bundlerServer,
      contractRegistry,
      driver: driverProxy ?? driver,
      localNodes,
      mockedEndpoint,
      mockServer,
      extensionId,
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

    throw error;
  } finally {
    if (!failed || process.env.E2E_LEAVE_RUNNING !== 'true') {
      const shutdownTasks = [fixtureServer.stop()];

      for (const server of localNodes) {
        if (server) {
          shutdownTasks.push(server.quit());
        }
      }

      if (useBundler) {
        shutdownTasks.push(bundlerServer.stop());
      }

      if (webDriver) {
        shutdownTasks.push(driver.quit());
      }
      if (dapp) {
        for (let i = 0; i < numberOfDapps; i++) {
          if (dappServer[i] && dappServer[i].listening) {
            shutdownTasks.push(
              new Promise((resolve, reject) => {
                dappServer[i].close((error) => {
                  if (error) {
                    return reject(error);
                  }
                  return resolve();
                });
                // We need to close all connections to stop the server quickly
                // Otherwise it takes a few seconds for it to close
                dappServer[i].closeAllConnections();
              }),
            );
          }
        }
      }
      if (phishingPageServer.isRunning()) {
        shutdownTasks.push(phishingPageServer.quit());
      }

      shutdownTasks.push(
        (async () => {
          // Since mockServer could be stop'd at another location,
          // use a try/catch to avoid an error
          try {
            await mockServer.stop();
          } catch (e) {
            console.log('mockServer already stopped');
          }
        })(),
      );

      const results = await Promise.allSettled(shutdownTasks);
      const failures = results.filter((result) => result.status === 'rejected');
      for (const { reason } of failures) {
        console.error('Failed to shut down:', reason);
      }
      if (failures.length) {
        // A test error may get overridden here by the shutdown error, but this is OK because a
        // shutdown error indicates a bug in our test tooling that might invalidate later tests.
        // eslint-disable-next-line no-unsafe-finally
        throw new AggregateError(
          failures.map((failure) => failure.reason),
          'Failed to shut down test servers',
        );
      }
    }
  }
}

const WINDOW_TITLES = Object.freeze({
  ExtensionInFullScreenView: 'MetaMask',
  ExtensionUpdating: 'MetaMask Updating',
  InstalledExtensions: 'Extensions',
  Dialog: 'MetaMask Dialog',
  Phishing: 'MetaMask Phishing Detection',
  ServiceWorkerSettings: 'Inspect with Chrome Developer Tools',
  SnapSimpleKeyringDapp: 'SSK - Simple Snap Keyring',
  TestDApp: 'E2E Test Dapp',
  TestDappSendIndividualRequest: 'E2E Test Dapp - Send Individual Request',
  MultichainTestDApp: 'Multichain Test Dapp',
  SolanaTestDApp: 'Solana Test Dapp',
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
const openPopupWithActiveTabOrigin = async (driver, origin = DAPP_URL) => {
  await driver.openNewPage(
    `${driver.extensionUrl}/${PAGES.POPUP}.html?activeTabOrigin=${origin}`,
  );

  // Resize the popup window after it's opened
  await driver.driver.manage().window().setRect({ width: 400, height: 600 });
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

const multipleGanacheOptions = {
  accounts: [
    {
      secretKey: PRIVATE_KEY,
      balance: convertETHToHexGwei(DEFAULT_LOCAL_NODE_ETH_BALANCE_DEC),
    },
    {
      secretKey: PRIVATE_KEY_TWO,
      balance: convertETHToHexGwei(DEFAULT_LOCAL_NODE_ETH_BALANCE_DEC),
    },
  ],
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
  console.log('Opening action menu and starting send flow');
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
 * @param {Ganache | Anvil} [localNode] - The local server instance (optional).
 * @param {string} [address] - The address to check the balance for (optional).
 */
const locateAccountBalanceDOM = async (driver, localNode, address = null) => {
  const balanceSelector = '[data-testid="eth-overview__primary-currency"]';
  if (localNode) {
    const balance = await localNode.getBalance(address);
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

  await driver.waitForSelector('#password', { state: 'enabled' });
  await driver.fill('#password', password);
  await driver.press('#password', driver.Key.ENTER);
  if (waitLoginSuccess) {
    await driver.assertElementNotPresent('[data-testid="unlock-page"]');
  }
}

/**
 * Simulates a WebSocket connection by executing a script in the browser context.
 *
 * @param {WebDriver} driver - The WebDriver instance.
 * @param {string} hostname - The hostname to connect to.
 */
async function createWebSocketConnection(driver, hostname) {
  try {
    await driver.executeScript(async (wsHostname) => {
      const url = `ws://${wsHostname}:8000`;
      const socket = new WebSocket(url);
      socket.onopen = () => {
        console.log('WebSocket connection opened');
        socket.send('Hello, server!');
      };
      socket.onerror = (error) => {
        console.error(
          'WebSocket error:',
          error.message || 'Connection blocked',
        );
      };
      socket.onmessage = (event) => {
        console.log('Message received from server:', event.data);
      };
      socket.onclose = () => {
        console.log('WebSocket connection closed');
      };
    }, hostname);
  } catch (error) {
    console.error(
      `Failed to execute WebSocket connection script for ws://${hostname}:8000`,
      error,
    );
    throw error;
  }
}

const logInWithBalanceValidation = async (driver, localNode) => {
  await unlockWallet(driver);
  // Wait for balance to load
  await locateAccountBalanceDOM(driver, localNode);
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
async function clickSignOnRedesignedSignatureConfirmation({
  driver,
  snapSigInsights = false,
}) {
  await driver.clickElementSafe('.confirm-scroll-to-bottom__button');

  if (snapSigInsights) {
    // there is no condition we can wait for to know the snap is ready,
    // so we have to add a small delay as the last alternative to avoid flakiness.
    await driver.delay(largeDelayMs);
  }

  await driver.clickElement({ text: 'Confirm', tag: 'button' });
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
 * @param {WebDriver} driver - The WebDriver instance.
 * @param {import('mockttp').MockedEndpoint[]} mockedEndpoints - mockttp mocked endpoints
 * @param {boolean} [waitWhilePending] - Wait until no requests are pending
 * @returns {Promise<import('mockttp/dist/pluggable-admin').MockttpClientResponse[]>}
 */
async function getEventPayloads(
  driver,
  mockedEndpoints,
  waitWhilePending = true,
) {
  if (waitWhilePending) {
    await driver.wait(
      async () => {
        const pendingStatuses = await Promise.all(
          mockedEndpoints.map((mockedEndpoint) => mockedEndpoint.isPending()),
        );
        const isSomethingPending = pendingStatuses.some(
          (pendingStatus) => pendingStatus,
        );

        return !isSomethingPending;
      },
      driver.timeout,
      true,
    );
  }
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

async function initBundler(
  bundlerServer,
  localNodeServer,
  usePaymaster,
  localNodeOptsNormalized,
) {
  try {
    const nodeType = localNodeOptsNormalized[0].type;
    const seeder =
      nodeType === 'ganache'
        ? new GanacheSeeder(localNodeServer.getProvider())
        : new AnvilSeeder(localNodeServer.getProvider());

    await seeder.deploySmartContract(SMART_CONTRACTS.ENTRYPOINT);

    await seeder.deploySmartContract(SMART_CONTRACTS.SIMPLE_ACCOUNT_FACTORY);

    if (usePaymaster) {
      await seeder.deploySmartContract(SMART_CONTRACTS.VERIFYING_PAYMASTER);

      await seeder.paymasterDeposit(convertETHToHexGwei(1));
    }

    await seeder.transfer(ERC_4337_ACCOUNT, convertETHToHexGwei(10));

    await bundlerServer.start();
  } catch (error) {
    console.log('Failed to initialize bundler', error);
    throw error;
  }
}

/**
 * Opens the account options menu safely
 *
 * @param {WebDriver} driver - The WebDriver instance used to interact with the browser.
 * @returns {Promise<void>} A promise that resolves when the menu is opened and any necessary waits are complete.
 */
async function openMenuSafe(driver) {
  await driver.clickElement('[data-testid="account-options-menu-button"]');
}

const sentryRegEx = /^https:\/\/sentry\.io\/api\/\d+\/envelope/gu;

// TODO(34913): remove this function when browserify builds are removed
const isWebpack = () => {
  const manifest = readManifest();
  return !manifest.content_scripts[0].js.includes('scripts/disable-console.js');
};

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
  openPopupWithActiveTabOrigin,
  openDappConnectionsPage,
  createDappTransaction,
  switchToOrOpenDapp,
  connectToDapp,
  multipleGanacheOptions,
  sendTransaction,
  sendScreenToConfirmScreen,
  unlockWallet,
  logInWithBalanceValidation,
  locateAccountBalanceDOM,
  WALLET_PASSWORD,
  WINDOW_TITLES,
  convertETHToHexGwei,
  roundToXDecimalPlaces,
  generateRandNumBetween,
  clickSignOnRedesignedSignatureConfirmation,
  switchToNotificationWindow,
  getEventPayloads,
  assertInAnyOrder,
  genRandInitBal,
  openActionMenuAndStartSendFlow,
  getCleanAppState,
  editGasFeeForm,
  clickNestedButton,
  openMenuSafe,
  sentryRegEx,
  createWebSocketConnection,
  isWebpack,
};
