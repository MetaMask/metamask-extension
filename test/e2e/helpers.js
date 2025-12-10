const path = require('path');
const { promises: fs, writeFileSync, readFileSync } = require('fs');
const BigNumber = require('bignumber.js');
const mockttp = require('mockttp');
const detectPort = require('detect-port');
const { difference } = require('lodash');
const WebSocket = require('ws');
const createStaticServer = require('../../development/create-static-server');
const { setupMocking } = require('./mock-e2e');
const { setupMockingPassThrough } = require('./mock-e2e-pass-through');
const { Anvil } = require('./seeder/anvil');
const { Ganache } = require('./seeder/ganache');
const FixtureServer = require('./fixtures/fixture-server');
const PhishingWarningPageServer = require('./phishing-warning-page-server');
const { buildWebDriver } = require('./webdriver');
const { PAGES } = require('./webdriver/driver');
const AnvilSeeder = require('./seeder/anvil-seeder');
const GanacheSeeder = require('./seeder/ganache-seeder');
const { Bundler } = require('./bundler');
const { SMART_CONTRACTS } = require('./seeder/smart-contracts');
const { setManifestFlags } = require('./set-manifest-flags');
const {
  ERC_4337_ACCOUNT,
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
  WALLET_PASSWORD,
  WINDOW_TITLES,
  DAPP_PATHS,
} = require('./constants');
const {
  getServerMochaToBackground,
} = require('./background-socket/server-mocha-to-background');
const LocalWebSocketServer = require('./websocket-server').default;
const { setupSolanaWebsocketMocks } = require('./websocket-solana-mocks');

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

const {
  mockMultichainAccountsFeatureFlagStateTwo,
} = require('./tests/multichain-accounts/feature-flag-mocks');

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
 * Normalizes the smartContract option into a consistent format to handle different data structures.
 * Examples:
 * // Case 1: Single string: SMART_CONTRACTS.HST
 * // Case 2: Array of strings: [SMART_CONTRACTS.HST, SMART_CONTRACTS.NFTS]
 * // Case 3: Object with deployer options: { name: SMART_CONTRACTS.HST, deployerOptions: { fromAddress: '0x...' } }
 * // Case 4: Mixed array: [SMART_CONTRACTS.HST, { name: SMART_CONTRACTS.NFTS, deployerOptions: { fromPrivateKey: '0x...' } }]
 *
 * @param {string | {name: string, deployerOptions?: object} | Array<string | {name: string, deployerOptions?: object}>} smartContract
 * @returns {{ name: string, deployerOptions?: object }[]}
 */
function normalizeSmartContracts(smartContract) {
  const contractsInput = Array.isArray(smartContract)
    ? smartContract
    : [smartContract];

  return contractsInput.map((entry) => {
    if (typeof entry === 'string') {
      return { name: entry };
    }
    if (entry && typeof entry === 'object' && typeof entry.name === 'string') {
      return entry;
    }
    throw new Error(
      `Invalid smartContract entry: ${JSON.stringify(entry)}. Expected string or { name, deployerOptions } object.`,
    );
  });
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
    fixtures,
    localNodeOptions = 'anvil',
    smartContract,
    driverOptions,
    dappOptions,
    staticServerOptions,
    title,
    ignoredConsoleErrors = [],
    disableServerMochaToBackground = false,
    testSpecificMock = function () {
      // do nothing.
    },
    useMockingPassThrough,
    useBundler,
    usePaymaster,
    ethConversionInUsd,
    monConversionInUsd,
    manifestFlags,
    solanaWebSocketSpecificMocks = [],
    forceBip44Version = true,
  } = options;

  // Normalize localNodeOptions
  const localNodeOptsNormalized = normalizeLocalNodeOptions(localNodeOptions);

  const fixtureServer = new FixtureServer();

  const bundlerServer = new Bundler();
  const https = await mockttp.generateCACertificate();
  const mockServer = mockttp.getLocal({ https, cors: true });
  const dappOpts = dappOptions || {};
  const hasCustomPaths =
    Array.isArray(dappOpts.customDappPaths) &&
    dappOpts.customDappPaths.length > 0;
  const customCount = hasCustomPaths ? dappOpts.customDappPaths.length : 0;
  const defaultCount =
    typeof dappOpts.numberOfTestDapps === 'number' &&
    dappOpts.numberOfTestDapps > 0
      ? dappOpts.numberOfTestDapps
      : 0;
  const numberOfDapps = customCount + defaultCount;
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

  let webSocketServer;

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
      const contractsNormalized = normalizeSmartContracts(smartContract);

      const hardfork = localNodeOptsNormalized[0].options.hardfork || 'prague';
      for (const contract of contractsNormalized) {
        await seeder.deploySmartContract(
          contract.name,
          hardfork,
          contract.deployerOptions,
        );
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
    if (numberOfDapps > 0) {
      // Ensure the default test dapp occupies the lowest ports first (e.g., 8080),
      // then any custom dapps follow (e.g., 8081, 8082, ...).
      for (let i = 0; i < numberOfDapps; i++) {
        let dappDirectory;
        let currentDappPath;
        if (i < defaultCount) {
          // First spin up the default test-dapp instances
          currentDappPath = 'test-dapp';
        } else if (hasCustomPaths) {
          // Then start custom dapps on subsequent ports
          currentDappPath = dappOpts.customDappPaths[i - defaultCount];
        } else {
          currentDappPath = 'test-dapp';
        }

        if (DAPP_PATHS && DAPP_PATHS[currentDappPath]) {
          dappDirectory = path.resolve(
            __dirname,
            ...DAPP_PATHS[currentDappPath],
          );
        } else {
          dappDirectory = path.resolve(__dirname, currentDappPath);
        }
        dappServer.push(
          createStaticServer({ public: dappDirectory, ...staticServerOptions }),
        );
        const basePort =
          typeof dappOpts.basePort === 'number'
            ? dappOpts.basePort
            : dappBasePort;
        dappServer[i].listen(`${basePort + i}`);
        await new Promise((resolve, reject) => {
          dappServer[i].on('listening', resolve);
          dappServer[i].on('error', reject);
        });
      }
    }

    // Start WebSocket server and apply Solana mocks (defaults + overrides)
    webSocketServer = LocalWebSocketServer.getServerInstance();
    webSocketServer.start();
    await setupSolanaWebsocketMocks(solanaWebSocketSpecificMocks);

    if (forceBip44Version) {
      console.log('BIP-44 stage 2 enabled');
      await mockMultichainAccountsFeatureFlagStateTwo(mockServer);
    }

    // Decide between the regular setupMocking and the passThrough version
    const mockingSetupFunction = useMockingPassThrough
      ? setupMockingPassThrough
      : setupMocking;

    // Use the mockingSetupFunction we just chose
    const {
      mockedEndpoint,
      getPrivacyReport,
      getNetworkReport,
      clearNetworkReport,
    } = await mockingSetupFunction(mockServer, testSpecificMock, {
      chainId: localNodeOptsNormalized[0]?.options.chainId || 1337,
      ethConversionInUsd,
      monConversionInUsd,
    });

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
      getNetworkReport,
      clearNetworkReport,
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
          `${JSON.stringify(mergedReport, null, 2)}\n`, // must add trailing newline to satisfy prettier
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
      if (numberOfDapps > 0) {
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

      shutdownTasks.push(
        (async () => {
          try {
            if (
              webSocketServer &&
              typeof webSocketServer.stopAndCleanup === 'function'
            ) {
              await webSocketServer.stopAndCleanup();
            }
          } catch (e) {
            console.log('WebSocket server already stopped or not initialized');
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

const openDapp = async (driver, contract = null, dappURL = DAPP_URL) => {
  return contract
    ? await driver.openNewPage(`${dappURL}/?contract=${contract}`)
    : await driver.openNewPage(dappURL);
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

const clickNestedButton = async (driver, tabName) => {
  try {
    await driver.clickElement({ text: tabName, tag: 'button' });
  } catch (error) {
    await driver.clickElement({
      xpath: `//*[contains(text(),"${tabName}")]/parent::button`,
    });
  }
};

/**
 * Unlocks the wallet using the provided password.
 * This method is intended to replace driver.navigate and should not be called after driver.navigate.
 *
 * @param {WebDriver} driver - The webdriver instance
 * @param {object} [options] - Options for unlocking the wallet
 * @param {boolean} [options.navigate] - Whether to navigate to the root page prior to unlocking - defaults to true
 * @param {string} [options.password] - Password to unlock wallet - defaults to shared WALLET_PASSWORD
 */
async function unlockWallet(
  driver,
  { navigate = true, password = WALLET_PASSWORD } = {},
) {
  if (navigate) {
    await driver.navigate();
  }

  await driver.waitForSelector('#password', { state: 'enabled' });
  await driver.fill('#password', password);
  await driver.press('#password', driver.Key.ENTER);
  await driver.assertElementNotPresent('[data-testid="unlock-page"]');
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

function roundToXDecimalPlaces(number, decimalPlaces) {
  return Math.round(number * 10 ** decimalPlaces) / 10 ** decimalPlaces;
}

function generateRandNumBetween(x, y) {
  const min = Math.min(x, y);
  const max = Math.max(x, y);
  const randomNumber = Math.random() * (max - min) + min;

  return randomNumber;
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

const sentryRegEx = /^https:\/\/sentry\.io\/api\/\d+\/envelope/gu;

/**
 * Check if sidepanel is enabled by examining the build flag at runtime.
 * Only works on Chrome-based browsers (Firefox doesn't support sidepanel).
 * Use this check for now in case we need to disable sidepanel in future.
 *
 * @returns {Promise<boolean>} True if sidepanel permission is present in manifest
 */
async function isSidePanelEnabled() {
  try {
    const hasSidepanel =
      process.env.SELENIUM_BROWSER === 'chrome' &&
      process.env.IS_SIDEPANEL === 'true';

    // Log for debugging
    console.log(`Sidepanel check: ${hasSidepanel ? 'enabled' : 'disabled'}`);

    return hasSidepanel;
  } catch (error) {
    // Chrome API not accessible (e.g., LavaMoat scuttling mode, Firefox)
    console.log('Sidepanel check failed:', error.message);
    return false;
  }
}

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
  convertToHexValue,
  tinyDelayMs,
  regularDelayMs,
  largeDelayMs,
  veryLargeDelayMs,
  withFixtures,
  createDownloadFolder,
  openDapp,
  switchToOrOpenDapp,
  unlockWallet,
  WALLET_PASSWORD,
  WINDOW_TITLES,
  convertETHToHexGwei,
  roundToXDecimalPlaces,
  generateRandNumBetween,
  getEventPayloads,
  assertInAnyOrder,
  getCleanAppState,
  clickNestedButton,
  sentryRegEx,
  createWebSocketConnection,
  isSidePanelEnabled,
};
