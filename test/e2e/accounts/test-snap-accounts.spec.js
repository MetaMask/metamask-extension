const { strict: assert } = require('assert');
const util = require('ethereumjs-util');
const FixtureBuilder = require('../fixture-builder');
const {
  clickSignOnSignatureConfirmation,
  convertETHToHexGwei,
  openDapp,
  PRIVATE_KEY,
  PRIVATE_KEY_TWO,
  defaultGanacheOptions,
  sendTransaction,
  switchToNotificationWindow,
  switchToOrOpenDapp,
  unlockWallet,
  validateContractDetails,
  WINDOW_TITLES,
  withFixtures,
} = require('../helpers');
const Driver = require('../webdriver/driver'); // eslint-disable-line no-unused-vars -- this is imported for JSDoc
const { TEST_SNAPS_SIMPLE_KEYRING_WEBSITE_URL } = require('./utils');

describe('Test Snap Account', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey: PRIVATE_KEY,
        balance: convertETHToHexGwei(25),
      },
      {
        secretKey: PRIVATE_KEY_TWO,
        balance: convertETHToHexGwei(25),
      },
    ],
  };

  const accountSnapFixtures = (title) => {
    return {
      dapp: true,
      fixtures: new FixtureBuilder()
        .withPermissionControllerConnectedToTestDapp(false)
        .build(),
      ganacheOptions,
      failOnConsoleError: false,
      title,
    };
  };

  // convert PRIVATE_KEY to public key
  const PUBLIC_KEY = util
    .privateToAddress(Buffer.from(PRIVATE_KEY.slice(2), 'hex'))
    .toString('hex');

  it('can create a new Snap account', async function () {
    await withFixtures(
      accountSnapFixtures(this.test.title),
      async ({ driver }) => {
        await installSnapSimpleKeyring(driver, false);

        await makeNewAccountAndSwitch(driver);
      },
    );
  });

  it('will display the keyring snap account removal warning', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        failOnConsoleError: false,
        title: this.test.title,
      },
      async ({ driver }) => {
        await installSnapSimpleKeyring(driver, false);

        await makeNewAccountAndSwitch(driver);

        const windowHandles = await driver.waitUntilXWindowHandles(
          2,
          1000,
          10000,
        );

        // switch to metamask extension
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
          windowHandles,
        );

        await driver.clickElement(
          '[data-testid="account-options-menu-button"]',
        );

        await driver.clickElement({ text: 'Settings', tag: 'div' });

        await driver.clickElement({ text: 'Snaps', tag: 'div' });

        await driver.clickElement(
          '[data-testid="npm:@metamask/snap-simple-keyring-snap"]',
        );

        const removeButton = await driver.findElement(
          '[data-testid="remove-snap-button"]',
        );
        await driver.scrollToElement(removeButton);
        await driver.clickElement('[data-testid="remove-snap-button"]');

        assert.equal(
          await driver.isElementPresentAndVisible({ text: 'Account 2' }),
          true,
        );

        await driver.clickElement({
          text: 'Continue',
          tag: 'button',
        });

        await driver.fill(
          '[data-testid="remove-snap-confirmation-input"]',
          'MetaMask Simple Snap Keyring',
        );

        await driver.clickElement({
          text: 'Remove Snap',
          tag: 'button',
        });

        // Checking result modal
        assert.equal(
          await driver.isElementPresentAndVisible({
            text: 'MetaMask Simple Snap Keyring removed',
            tag: 'p',
          }),
          true,
        );
      },
    );
  });

  it('can import a private key and transfer 1 ETH (sync flow)', async function () {
    await withFixtures(
      accountSnapFixtures(this.test.title),
      async ({ driver }) => {
        await importPrivateKeyAndTransfer1ETH(driver, 'sync');
      },
    );
  });

  it('can import a private key and transfer 1 ETH (async flow approve)', async function () {
    await withFixtures(
      accountSnapFixtures(this.test.title),
      async ({ driver }) => {
        await importPrivateKeyAndTransfer1ETH(driver, 'approve');
      },
    );
  });

  it('can import a private key and transfer 1 ETH (async flow reject)', async function () {
    await withFixtures(
      accountSnapFixtures(this.test.title),
      async ({ driver }) => {
        await importPrivateKeyAndTransfer1ETH(driver, 'reject');
      },
    );
  });

  // run the full matrix of sign types and sync/async approve/async reject flows
  // (in Jest we could do this with test.each, but that does not exist here)
  [
    ['#personalSign', 'sync'],
    ['#personalSign', 'approve'],
    ['#personalSign', 'reject'],
    ['#signTypedData', 'sync'],
    ['#signTypedData', 'approve'],
    ['#signTypedData', 'reject'],
    ['#signTypedDataV3', 'sync'],
    ['#signTypedDataV3', 'approve'],
    ['#signTypedDataV3', 'reject'],
    ['#signTypedDataV4', 'sync'],
    ['#signTypedDataV4', 'approve'],
    ['#signTypedDataV4', 'reject'],
    ['#signPermit', 'sync'],
    ['#signPermit', 'approve'],
    ['#signPermit', 'reject'],
  ].forEach(([locatorID, flowType]) => {
    // generate title of the test from the locatorID and flowType
    let title = `can ${locatorID} (${
      flowType === 'sync' ? 'sync' : 'async'
    } flow`;

    title += flowType === 'sync' ? ')' : ` ${flowType})`;

    it(title, async function () {
      await withFixtures(
        accountSnapFixtures(this.test.title),
        async ({ driver }) => {
          const isAsyncFlow = flowType !== 'sync';

          await installSnapSimpleKeyring(driver, isAsyncFlow);

          const newPublicKey = await makeNewAccountAndSwitch(driver);

          await openDapp(driver);

          await signData(driver, locatorID, newPublicKey, flowType);
        },
      );
    });
  });

  it('can connect to the Test Dapp, then #signTypedDataV3, disconnect then connect, then #signTypedDataV4 (async flow approve)', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        failOnConsoleError: false,
        title: this.test.title,
      },
      async ({ driver }) => {
        const flowType = 'approve';
        const isAsyncFlow = flowType !== 'sync';

        await installSnapSimpleKeyring(driver, isAsyncFlow);

        const newPublicKey = await makeNewAccountAndSwitch(driver);

        // open the Test Dapp and connect Account 2 to it
        await connectAccountToTestDapp(driver);

        // do #signTypedDataV3
        await signData(driver, '#signTypedDataV3', newPublicKey, flowType);

        // disconnect from the Test Dapp
        await disconnectFromTestDapp(driver);

        // reconnect Account 2 to the Test Dapp
        await connectAccountToTestDapp(driver);

        // do #signTypedDataV4
        await signData(driver, '#signTypedDataV4', newPublicKey, flowType);
      },
    );
  });

  /**
   * @param {Driver} driver
   * @param {string} flowType
   */
  async function importPrivateKeyAndTransfer1ETH(driver, flowType) {
    const isAsyncFlow = flowType !== 'sync';

    await installSnapSimpleKeyring(driver, isAsyncFlow);
    await importKeyAndSwitch(driver);

    // send 1 ETH from Account 2 to Account 1
    await sendTransaction(driver, PUBLIC_KEY, 1, isAsyncFlow);

    if (isAsyncFlow) {
      await approveOrRejectRequest(driver, flowType);
    }

    if (flowType === 'sync' || flowType === 'approve') {
      // click on Accounts
      await driver.clickElement('[data-testid="account-menu-icon"]');

      // ensure one account has 26 ETH and the other has 24 ETH
      await driver.findElement('[title="26 ETH"]');
      await driver.findElement('[title="24 ETH"]');
    } else if (flowType === 'reject') {
      // ensure the transaction was rejected by the Snap
      await driver.findElement(
        '[data-original-title="Request rejected by user or snap."]',
      );
    }
  }

  /**
   * @param {Driver} driver
   * @param {string} locatorID
   * @param {string} newPublicKey
   * @param {string} flowType
   */
  async function signData(driver, locatorID, newPublicKey, flowType) {
    const isAsyncFlow = flowType !== 'sync';

    await switchToOrOpenDapp(driver);

    await driver.clickElement(locatorID);
    await switchToNotificationWindow(driver, 4);

    // these two don't have a contract details page
    if (locatorID !== '#personalSign' && locatorID !== '#signTypedData') {
      await validateContractDetails(driver);
    }

    await clickSignOnSignatureConfirmation(driver, 3);

    if (isAsyncFlow) {
      await approveOrRejectRequest(driver, flowType);
    }

    await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

    if (flowType === 'sync' || flowType === 'approve') {
      await driver.clickElement(`${locatorID}Verify`);

      const resultLocator =
        locatorID === '#personalSign'
          ? '#personalSignVerifyECRecoverResult' // the verify span IDs are different with Personal Sign
          : `${locatorID}VerifyResult`;

      await driver.findElement({
        css: resultLocator,
        text: newPublicKey.toLowerCase(),
      });
    } else if (flowType === 'reject') {
      // ensure the transaction was rejected by the Snap
      await driver.findElement({
        text: 'Error: Request rejected by user or snap.',
      });
    }
  }

  /**
   * @param {Driver} driver
   * @param {boolean} isAsyncFlow
   */
  async function installSnapSimpleKeyring(driver, isAsyncFlow) {
    driver.navigate();

    await unlockWallet(driver);

    // navigate to test Snaps page and connect
    await driver.openNewPage(TEST_SNAPS_SIMPLE_KEYRING_WEBSITE_URL);
    const connectButton = await driver.findElement('#connectButton');
    await driver.scrollToElement(connectButton);
    await connectButton.click();

    await switchToNotificationWindow(driver);
    await driver.clickElement({
      text: 'Connect',
      tag: 'button',
    });

    await driver.clickElementSafe('[data-testid="snap-install-scroll"]', 1000);

    await driver.waitForSelector({ text: 'Install' });

    await driver.clickElement({
      text: 'Install',
      tag: 'button',
    });

    await driver.waitForSelector({ text: 'OK' });

    await driver.clickElement({
      text: 'OK',
      tag: 'button',
    });

    await driver.switchToWindowWithTitle('SSK - Simple Snap Keyring');

    await driver.waitForSelector({
      text: 'Connected',
      tag: 'span',
    });

    if (isAsyncFlow) {
      await toggleAsyncFlow(driver);
    }
  }

  /**
   * @param {Driver} driver
   */
  async function toggleAsyncFlow(driver) {
    await driver.switchToWindowWithTitle('SSK - Simple Snap Keyring');

    // click the parent of #use-sync-flow-toggle (trying to click the element itself gives "ElementNotInteractableError: could not be scrolled into view")
    await driver.clickElement({
      xpath: '//input[@id="use-sync-flow-toggle"]/..',
    });
  }

  /**
   * @param {Driver} driver
   */
  async function importKeyAndSwitch(driver) {
    await driver.clickElement({
      text: 'Import account',
      tag: 'div',
    });

    await driver.fill('#import-account-private-key', PRIVATE_KEY_TWO);

    await driver.clickElement({
      text: 'Import Account',
      tag: 'button',
    });

    // Click "Create" on the Snap's confirmation popup
    await switchToNotificationWindow(driver, 3);
    await driver.clickElement('[data-testid="confirmation-submit-button"]');
    await driver.clickElement('[data-testid="confirmation-submit-button"]');
    await driver.switchToWindowWithTitle('SSK - Simple Snap Keyring');

    await switchToAccount2(driver);
  }

  /**
   * @param {Driver} driver
   */
  async function makeNewAccountAndSwitch(driver) {
    await driver.clickElement({
      text: 'Create account',
      tag: 'div',
    });

    await driver.clickElement({
      text: 'Create Account',
      tag: 'button',
    });

    // Click "Create" on the Snap's confirmation popup
    await switchToNotificationWindow(driver, 3);
    await driver.clickElement('[data-testid="confirmation-submit-button"]');
    await driver.clickElement('[data-testid="confirmation-submit-button"]');
    await driver.switchToWindowWithTitle('SSK - Simple Snap Keyring');

    const newPublicKey = await (
      await driver.findElement({
        text: '0x',
        tag: 'p',
      })
    ).getText();

    await switchToAccount2(driver);

    return newPublicKey;
  }

  /**
   * @param {Driver} driver
   */
  async function switchToAccount2(driver) {
    await driver.switchToWindowWithTitle(
      WINDOW_TITLES.ExtensionInFullScreenView,
    );

    // click on Accounts
    await driver.clickElement('[data-testid="account-menu-icon"]');

    const label = await driver.findElement({
      css: '.mm-tag',
      text: 'Snaps (Beta)',
    });

    label.click();

    await driver.waitForElementNotPresent('.mm-tag');
  }

  /**
   * @param {Driver} driver
   */
  async function connectAccountToTestDapp(driver) {
    await switchToOrOpenDapp(driver);
    await driver.clickElement('#connectButton');
    await switchToNotificationWindow(driver, 4);
    await driver.clickElement('[data-testid="page-container-footer-next"]');
    await driver.clickElement('[data-testid="page-container-footer-next"]');
  }

  /**
   * @param {Driver} driver
   */
  async function disconnectFromTestDapp(driver) {
    await driver.switchToWindowWithTitle(
      WINDOW_TITLES.ExtensionInFullScreenView,
    );
    await driver.clickElement('[data-testid="account-options-menu-button"]');
    await driver.clickElement('[data-testid="global-menu-connected-sites"]');
    await driver.clickElement({ text: 'Disconnect', tag: 'a' });
    await driver.clickElement({ text: 'Disconnect', tag: 'button' });
  }

  /**
   * @param {Driver} driver
   * @param {string} flowType
   */
  async function approveOrRejectRequest(driver, flowType) {
    await driver.switchToWindowWithTitle('SSK - Simple Snap Keyring');

    await driver.clickElementUsingMouseMove({
      text: 'List requests',
      tag: 'div',
    });

    await driver.clickElement({
      text: 'List Requests',
      tag: 'button',
    });

    // get the JSON from the screen
    const requestJSON = await (
      await driver.findElement({
        text: '"scope": "",',
        tag: 'div',
      })
    ).getText();

    const requestID = JSON.parse(requestJSON)[0].id;

    if (flowType === 'approve') {
      await driver.clickElementUsingMouseMove({
        text: 'Approve request',
        tag: 'div',
      });

      await driver.fill('#approve-request-request-id', requestID);

      await driver.clickElement({
        text: 'Approve Request',
        tag: 'button',
      });
    } else if (flowType === 'reject') {
      await driver.clickElementUsingMouseMove({
        text: 'Reject request',
        tag: 'div',
      });

      await driver.fill('#reject-request-request-id', requestID);

      await driver.clickElement({
        text: 'Reject Request',
        tag: 'button',
      });
    }

    await driver.switchToWindowWithTitle(
      WINDOW_TITLES.ExtensionInFullScreenView,
    );
  }
});
