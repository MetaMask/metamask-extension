const path = require('path');
const BigNumber = require('bignumber.js');
const mockttp = require('mockttp');
const createStaticServer = require('../../development/create-static-server');
const enLocaleMessages = require('../../app/_locales/en/messages.json');
const { setupMocking } = require('./mock-e2e');
const Ganache = require('./ganache');
const FixtureServer = require('./fixture-server');
const { buildWebDriver } = require('./webdriver');
const { ensureXServerIsRunning } = require('./x-server');
const GanacheSeeder = require('./seeder/ganache-seeder');

const tinyDelayMs = 200;
const regularDelayMs = tinyDelayMs * 2;
const largeDelayMs = regularDelayMs * 2;
const veryLargeDelayMs = largeDelayMs * 2;
const dappBasePort = 8080;

const convertToHexValue = (val) => `0x${new BigNumber(val, 10).toString(16)}`;

async function withFixtures(options, testSuite) {
  const {
    dapp,
    fixtures,
    ganacheOptions,
    driverOptions,
    dappOptions,
    title,
    failOnConsoleError = true,
    dappPath = undefined,
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

  let webDriver;
  let failed = false;
  try {
    await ganacheServer.start(ganacheOptions);

    // Deploy initial smart contracts
    const debugGanacheSeeder = true;
    const ganacheSeeder = new GanacheSeeder(debugGanacheSeeder);
    await ganacheSeeder.deploySmartContracts();
    const contractRegistry = ganacheSeeder.getContractRegistry();

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
    await fixtureServer.loadState(path.join(__dirname, 'fixtures', fixtures));
    if (dapp) {
      if (dappOptions?.numberOfDapps) {
        numberOfDapps = dappOptions.numberOfDapps;
      }
      for (let i = 0; i < numberOfDapps; i++) {
        let dappDirectory;
        if (dappPath) {
          dappDirectory = path.resolve(__dirname, dappPath);
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
    const { driver } = await buildWebDriver(driverOptions);
    webDriver = driver;

    console.log(`\nExecuting test suite: ${title}\n`);

    await testSuite({
      driver,
      mockServer,
      contractRegistry,
    });

<<<<<<< HEAD
    if (process.env.SELENIUM_BROWSER === 'chrome') {
      const errors = await driver.checkBrowserForConsoleErrors(driver);
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
=======
    // At this point the suite has executed successfully, so we can log out a
    // success message.
    console.log(`\nSuccess on test suite: '${title}'\n`);

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

    // To determine if a new host was requsted, we use the lodash difference
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
>>>>>>> upstream/multichain-swaps-controller
      }
    }
  } catch (error) {
    failed = true;
    if (webDriver) {
      try {
<<<<<<< HEAD
        await webDriver.verboseReportOnFailure(title);
=======
        await driver.verboseReportOnFailure(title, error);
>>>>>>> upstream/multichain-swaps-controller
      } catch (verboseReportError) {
        console.error(verboseReportError);
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
        await webDriver.quit();
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
      await mockServer.stop();
    }
  }
}

<<<<<<< HEAD
=======
const WINDOW_TITLES = Object.freeze({
  ExtensionInFullScreenView: 'MetaMask',
  InstalledExtensions: 'Extensions',
  Notification: 'MetaMask Notification',
  Phishing: 'MetaMask Phishing Detection',
  ServiceWorkerSettings: 'Inspect with Chrome Developer Tools',
  SnapSimpleKeyringDapp: 'SSK - Simple Snap Keyring',
  TestDApp: 'E2E Test Dapp',
  TestSnaps: 'Test Snaps',
});

>>>>>>> upstream/multichain-swaps-controller
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

const connectDappWithExtensionPopup = async (driver) => {
  await driver.openNewPage(`http://127.0.0.1:${dappBasePort}/`);
  await driver.delay(regularDelayMs);
  await driver.clickElement({ text: 'Connect', tag: 'button' });
  await driver.delay(regularDelayMs);

  const windowHandles = await getWindowHandles(driver, 3);

  // open extension popup and confirm connect
  await driver.switchToWindow(windowHandles.popup);
  await driver.delay(largeDelayMs);
  await driver.clickElement({ text: 'Next', tag: 'button' });
  await driver.clickElement({ text: 'Connect', tag: 'button' });

  // send from dapp
  await driver.waitUntilXWindowHandles(2);
  await driver.switchToWindow(windowHandles.dapp);
  await driver.delay(regularDelayMs);
};

const completeImportSRPOnboardingFlow = async (
  driver,
  seedPhrase,
  password,
) => {
  if (process.env.ONBOARDING_V2 === '1') {
    // welcome
    await driver.clickElement('[data-testid="onboarding-import-wallet"]');

    // metrics
    await driver.clickElement('[data-testid="metametrics-no-thanks"]');

    // import with recovery phrase
    await driver.fill('[data-testid="import-srp-text"]', seedPhrase);
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
  } else {
    // clicks the continue button on the welcome screen
    await driver.findElement('.welcome-page__header');
    await driver.clickElement({
      text: enLocaleMessages.getStarted.message,
      tag: 'button',
    });

    // clicks the "Import Wallet" option
    await driver.clickElement({ text: 'Import wallet', tag: 'button' });

    // clicks the "No thanks" option on the metametrics opt-in screen
    await driver.clickElement('.btn-secondary');

    // Import Secret Recovery Phrase
    await driver.pasteIntoField(
      '[data-testid="import-srp__srp-word-0"]',
      seedPhrase,
    );

    await driver.fill('#password', password);
    await driver.fill('#confirm-password', password);

<<<<<<< HEAD
    await driver.clickElement(
      '[data-testid="create-new-vault__terms-checkbox"]',
=======
  // complete
  await driver.clickElement('[data-testid="onboarding-complete-done"]');

  // pin extension
  await driver.clickElement('[data-testid="pin-extension-next"]');
  await driver.clickElement('[data-testid="pin-extension-done"]');
};

/**
 * Begin the create new wallet flow on onboarding screen.
 *
 * @param {WebDriver} driver
 */
const onboardingBeginCreateNewWallet = async (driver) => {
  // agree to terms of use
  await driver.clickElement('[data-testid="onboarding-terms-checkbox"]');

  // welcome
  await driver.clickElement('[data-testid="onboarding-create-wallet"]');
};

/**
 * Choose either "I Agree" or "No Thanks" on the MetaMetrics onboarding screen
 *
 * @param {WebDriver} driver
 * @param {boolean} option - true to opt into metrics, default is false
 */
const onboardingChooseMetametricsOption = async (driver, option = false) => {
  const optionIdentifier = option ? 'i-agree' : 'no-thanks';
  // metrics
  await driver.clickElement(`[data-testid="metametrics-${optionIdentifier}"]`);
};

/**
 * Set a password for MetaMask during onboarding
 *
 * @param {WebDriver} driver
 * @param {string} password - Password to set
 */
const onboardingCreatePassword = async (driver, password) => {
  // create password
  await driver.fill('[data-testid="create-password-new"]', password);
  await driver.fill('[data-testid="create-password-confirm"]', password);
  await driver.clickElement('[data-testid="create-password-terms"]');
  await driver.clickElement('[data-testid="create-password-wallet"]');
};

/**
 * Choose to secure wallet, and then get recovery phrase and confirm the SRP
 * during onboarding flow.
 *
 * @param {WebDriver} driver
 */
const onboardingRevealAndConfirmSRP = async (driver) => {
  // secure my wallet
  await driver.clickElement('[data-testid="secure-wallet-recommended"]');

  // reveal SRP
  await driver.clickElement('[data-testid="recovery-phrase-reveal"]');

  const revealedSeedPhrase = await driver.findElement(
    '[data-testid="recovery-phrase-chips"]',
  );

  const recoveryPhrase = await revealedSeedPhrase.getText();

  await driver.clickElement('[data-testid="recovery-phrase-next"]');

  // confirm SRP
  const words = recoveryPhrase.split(/\s*(?:[0-9)]+|\n|\.|^$|$)\s*/u);
  const finalWords = words.filter((str) => str !== '');
  assert.equal(finalWords.length, 12);

  await driver.fill('[data-testid="recovery-phrase-input-2"]', finalWords[2]);
  await driver.fill('[data-testid="recovery-phrase-input-3"]', finalWords[3]);
  await driver.fill('[data-testid="recovery-phrase-input-7"]', finalWords[7]);

  await driver.clickElement('[data-testid="confirm-recovery-phrase"]');

  await driver.clickElement({ text: 'Confirm', tag: 'button' });
};

/**
 * Complete the onboarding flow by confirming completion. Final step before the
 * reminder to pin the extension.
 *
 * @param {WebDriver} driver
 */
const onboardingCompleteWalletCreation = async (driver) => {
  // complete
  await driver.findElement({ text: 'Wallet creation successful', tag: 'h2' });
  await driver.clickElement('[data-testid="onboarding-complete-done"]');
};

/**
 * Move through the steps of pinning extension after successful onboarding
 *
 * @param {WebDriver} driver
 */
const onboardingPinExtension = async (driver) => {
  // pin extension
  await driver.clickElement('[data-testid="pin-extension-next"]');
  await driver.clickElement('[data-testid="pin-extension-done"]');
};

const completeCreateNewWalletOnboardingFlow = async (driver, password) => {
  await onboardingBeginCreateNewWallet(driver);
  await onboardingChooseMetametricsOption(driver, false);
  await onboardingCreatePassword(driver, password);
  await onboardingRevealAndConfirmSRP(driver);
  await onboardingCompleteWalletCreation(driver);
  await onboardingPinExtension(driver);
};

const importWrongSRPOnboardingFlow = async (driver, seedPhrase) => {
  // agree to terms of use
  await driver.clickElement('[data-testid="onboarding-terms-checkbox"]');

  // welcome
  await driver.clickElement('[data-testid="onboarding-import-wallet"]');

  // metrics
  await driver.clickElement('[data-testid="metametrics-no-thanks"]');

  // import with recovery phrase
  await driver.pasteIntoField(
    '[data-testid="import-srp__srp-word-0"]',
    seedPhrase,
  );

  const warningText = 'Invalid Secret Recovery Phrase';
  const warnings = await driver.findElements('.import-srp__banner-alert-text');
  const warning = warnings[1];

  assert.equal(await warning.getText(), warningText);
};

const selectDropdownByNum = async (elements, index) => {
  await elements[index].click();
};

const testSRPDropdownIterations = async (options, driver, iterations) => {
  for (let i = 0; i < iterations; i++) {
    await selectDropdownByNum(options, i);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const formFields = await driver.findElements('.import-srp__srp-word-label');
    const expectedNumFields = 12 + i * 3;
    const actualNumFields = formFields.length;
    assert.equal(actualNumFields, expectedNumFields);
  }
};

const passwordUnlockOpenSRPRevealQuiz = async (driver) => {
  await driver.navigate();
  await unlockWallet(driver);

  // navigate settings to reveal SRP
  await driver.clickElement('[data-testid="account-options-menu-button"]');
  await driver.clickElement({ text: 'Settings', tag: 'div' });
  await driver.clickElement({ text: 'Security & privacy', tag: 'div' });
  await driver.clickElement('[data-testid="reveal-seed-words"]');
};

const completeSRPRevealQuiz = async (driver) => {
  // start quiz
  await driver.clickElement('[data-testid="srp-quiz-get-started"]');

  // tap correct answer 1
  await driver.clickElement('[data-testid="srp-quiz-right-answer"]');

  // tap Continue 1
  await driver.clickElement('[data-testid="srp-quiz-continue"]');

  // tap correct answer 2
  await driver.clickElement('[data-testid="srp-quiz-right-answer"]');

  // tap Continue 2
  await driver.clickElement('[data-testid="srp-quiz-continue"]');
};

const tapAndHoldToRevealSRP = async (driver) => {
  await driver.holdMouseDownOnElement(
    {
      text: tEn('holdToRevealSRP'),
      tag: 'span',
    },
    2000,
  );
};

const closeSRPReveal = async (driver) => {
  await driver.clickElement({
    text: tEn('close'),
    tag: 'button',
  });
  await driver.findVisibleElement({
    text: tEn('tokens'),
    tag: 'button',
  });
};

const DAPP_URL = 'http://127.0.0.1:8080';
const DAPP_ONE_URL = 'http://127.0.0.1:8081';

const openDapp = async (driver, contract = null, dappURL = DAPP_URL) => {
  contract
    ? await driver.openNewPage(`${dappURL}/?contract=${contract}`)
    : await driver.openNewPage(dappURL);
};

const switchToOrOpenDapp = async (
  driver,
  contract = null,
  dappURL = DAPP_URL,
) => {
  try {
    // Do an unusually fast switchToWindowWithTitle, just 1 second
    await driver.switchToWindowWithTitle(
      WINDOW_TITLES.TestDApp,
      null,
      1000,
      1000,
    );
  } catch {
    await openDapp(driver, contract, dappURL);
  }
};

const PRIVATE_KEY =
  '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC';

const PRIVATE_KEY_TWO =
  '0xa444f52ea41e3a39586d7069cb8e8233e9f6b9dea9cbb700cce69ae860661cc8';

const convertETHToHexGwei = (eth) => convertToHexValue(eth * 10 ** 18);

const defaultGanacheOptions = {
  accounts: [{ secretKey: PRIVATE_KEY, balance: convertETHToHexGwei(25) }],
};

const openActionMenuAndStartSendFlow = async (driver) => {
  // TODO: Update Test when Multichain Send Flow is added
  if (process.env.MULTICHAIN) {
    await driver.clickElement('[data-testid="app-footer-actions-button"]');
    await driver.clickElement('[data-testid="select-action-modal-item-send"]');
  } else {
    await driver.clickElement('[data-testid="eth-overview-send"]');
  }
};

const sendTransaction = async (
  driver,
  recipientAddress,
  quantity,
  isAsyncFlow = false,
) => {
  // TODO: Update Test when Multichain Send Flow is added
  if (process.env.MULTICHAIN) {
    return;
  }
  await openActionMenuAndStartSendFlow(driver);
  await driver.fill('[data-testid="ens-input"]', recipientAddress);
  await driver.fill('.unit-input__input', quantity);
  await driver.clickElement({
    text: 'Next',
    tag: 'button',
    css: '[data-testid="page-container-footer-next"]',
  });
  await driver.clickElement({
    text: 'Confirm',
    tag: 'button',
    css: '[data-testid="page-container-footer-next"]',
  });

  // the default is to do this block, but if we're testing an async flow, it would get stuck here
  if (!isAsyncFlow) {
    await driver.clickElement('[data-testid="home__activity-tab"]');
    await driver.waitForElementNotPresent(
      '.transaction-list-item--unconfirmed',
>>>>>>> upstream/multichain-swaps-controller
    );

    await driver.clickElement({ text: 'Import', tag: 'button' });

    // clicks through the success screen
    await driver.findElement({ text: 'Congratulations', tag: 'div' });
    await driver.clickElement({
      text: enLocaleMessages.endOfFlowMessage10.message,
      tag: 'button',
    });
  }
};

<<<<<<< HEAD
module.exports = {
=======
const findAnotherAccountFromAccountList = async (
  driver,
  itemNumber,
  accountName,
) => {
  await driver.clickElement('[data-testid="account-menu-icon"]');
  const accountMenuItemSelector = `.multichain-account-list-item:nth-child(${itemNumber})`;

  await driver.findElement({
    css: `${accountMenuItemSelector} .multichain-account-list-item__account-name__button`,
    text: accountName,
  });

  return accountMenuItemSelector;
};

const TEST_SEED_PHRASE =
  'forum vessel pink push lonely enact gentle tail admit parrot grunt dress';

const TEST_SEED_PHRASE_TWO =
  'phrase upgrade clock rough situate wedding elder clever doctor stamp excess tent';

// Usually happens when onboarded to make sure the state is retrieved from metamaskState properly, or after txn is made
const locateAccountBalanceDOM = async (driver, ganacheServer) => {
  const balance = await ganacheServer.getBalance();
  if (process.env.MULTICHAIN) {
    await driver.clickElement(`[data-testid="home__asset-tab"]`);
    await driver.findElement({
      css: '[data-testid="token-balance-overview-currency-display"]',
      text: `${balance} ETH`,
    });
  } else {
    await driver.findElement({
      css: '[data-testid="eth-overview__primary-currency"]',
      text: `${balance} ETH`,
    });
  }
};

const WALLET_PASSWORD = 'correct horse battery staple';

const DEFAULT_GANACHE_OPTIONS = {
  accounts: [
    {
      secretKey: PRIVATE_KEY,
      balance: convertETHToHexGwei(25),
    },
  ],
};

const generateGanacheOptions = (overrides) => ({
  ...DEFAULT_GANACHE_OPTIONS,
  ...overrides,
});

async function waitForAccountRendered(driver) {
  await driver.waitForSelector(
    process.env.MULTICHAIN
      ? '[data-testid="token-balance-overview-currency-display"]'
      : '[data-testid="eth-overview__primary-currency"]',
  );
}

async function unlockWallet(driver) {
  await driver.fill('#password', WALLET_PASSWORD);
  await driver.press('#password', driver.Key.ENTER);
}

const logInWithBalanceValidation = async (driver, ganacheServer) => {
  await unlockWallet(driver);
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
 * This method handles clicking the sign button on signature confrimation
 * screen.
 *
 * @param {WebDriver} driver
 * @param {number} numHandles
 * @param {string} locatorID
 */
async function clickSignOnSignatureConfirmation(
  driver,
  numHandles = 2, // eslint-disable-line no-unused-vars
  locatorID = null,
) {
  await driver.clickElement({ text: 'Sign', tag: 'button' });

  // #ethSign has a second Sign confirmation button that says "Your funds may be at risk"
  if (locatorID === '#ethSign') {
    await driver.clickElement({
      text: 'Sign',
      tag: 'button',
      css: '[data-testid="signature-warning-sign-button"]',
    });
  }
}

/**
 * Some signing methods have extra security that requires the user to click a
 * button to validate that they have verified the details. This method handles
 * performing the necessary steps to click that button.
 *
 * @param {WebDriver} driver
 */
async function validateContractDetails(driver) {
  const verifyContractDetailsButton = await driver.findElement(
    '.signature-request-content__verify-contract-details',
  );

  verifyContractDetailsButton.click();
  await driver.clickElement({ text: 'Got it', tag: 'button' });

  // Approve signing typed data
  try {
    await driver.clickElement(
      '[data-testid="signature-request-scroll-button"]',
    );
  } catch (error) {
    // Ignore error if scroll button is not present
  }
  await driver.delay(regularDelayMs);
}

/**
 * This method assumes the extension is open, the dapp is open and waits for a
 * third window handle to open (the notification window). Once it does it
 * switches to the new window.
 *
 * @param {WebDriver} driver
 * @param numHandles
 */
async function switchToNotificationWindow(driver, numHandles = 3) {
  const windowHandles = await driver.waitUntilXWindowHandles(numHandles);

  await driver.switchToWindowWithTitle(
    WINDOW_TITLES.Notification,
    windowHandles,
  );
}

/**
 * When mocking the segment server and returning an array of mocks from the
 * mockServer method, this method will allow getting all of the seen requests
 * for each mock in the array.
 *
 * @param {WebDriver} driver
 * @param {import('mockttp').Mockttp} mockedEndpoints
 * @param {boolean} hasRequest
 * @returns {import('mockttp/dist/pluggable-admin').MockttpClientResponse[]}
 */
async function getEventPayloads(driver, mockedEndpoints, hasRequest = true) {
  await driver.wait(async () => {
    let isPending = true;

    for (const mockedEndpoint of mockedEndpoints) {
      isPending = await mockedEndpoint.isPending();
    }

    return isPending === !hasRequest;
  }, driver.timeout);
  const mockedRequests = [];
  for (const mockedEndpoint of mockedEndpoints) {
    mockedRequests.push(...(await mockedEndpoint.getSeenRequests()));
  }

  return mockedRequests.map((req) => req.body.json?.batch).flat();
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

module.exports = {
  DAPP_URL,
  DAPP_ONE_URL,
  TEST_SEED_PHRASE,
  TEST_SEED_PHRASE_TWO,
  PRIVATE_KEY,
  PRIVATE_KEY_TWO,
>>>>>>> upstream/multichain-swaps-controller
  getWindowHandles,
  convertToHexValue,
  tinyDelayMs,
  regularDelayMs,
  largeDelayMs,
  veryLargeDelayMs,
  withFixtures,
  connectDappWithExtensionPopup,
  completeImportSRPOnboardingFlow,
<<<<<<< HEAD
=======
  completeImportSRPOnboardingFlowWordByWord,
  completeCreateNewWalletOnboardingFlow,
  passwordUnlockOpenSRPRevealQuiz,
  completeSRPRevealQuiz,
  closeSRPReveal,
  tapAndHoldToRevealSRP,
  createDownloadFolder,
  importWrongSRPOnboardingFlow,
  testSRPDropdownIterations,
  openDapp,
  switchToOrOpenDapp,
  defaultGanacheOptions,
  sendTransaction,
  findAnotherAccountFromAccountList,
  unlockWallet,
  logInWithBalanceValidation,
  locateAccountBalanceDOM,
  waitForAccountRendered,
  generateGanacheOptions,
  WALLET_PASSWORD,
  WINDOW_TITLES,
  DEFAULT_GANACHE_OPTIONS,
  convertETHToHexGwei,
  roundToXDecimalPlaces,
  generateRandNumBetween,
  clickSignOnSignatureConfirmation,
  validateContractDetails,
  switchToNotificationWindow,
  getEventPayloads,
  onboardingBeginCreateNewWallet,
  onboardingChooseMetametricsOption,
  onboardingCreatePassword,
  onboardingRevealAndConfirmSRP,
  onboardingCompleteWalletCreation,
  onboardingPinExtension,
  assertInAnyOrder,
  genRandInitBal,
  openActionMenuAndStartSendFlow,
>>>>>>> upstream/multichain-swaps-controller
};
