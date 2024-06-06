const { strict: assert } = require('assert');
const { hexToNumber } = require('@metamask/utils');
const {
  defaultGanacheOptions,
  defaultGanacheOptionsForType2Transactions,
  openDapp,
  unlockWallet,
  WINDOW_TITLES,
  withFixtures,
} = require('../../../helpers');
const FixtureBuilder = require('../../../fixture-builder');
const { scrollAndConfirmAndAssertConfirm } = require('../helpers');
const { CHAIN_IDS } = require('../../../../../shared/constants/network');

describe('Confirmation Redesign Contract Interaction Component', function () {
  if (!process.env.ENABLE_CONFIRMATION_REDESIGN) {
    return;
  }

  it('Sends a contract interaction type 0 transaction without custom nonce editing', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .withPreferencesController({
            preferences: { redesignedConfirmationsEnabled: true },
          })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);
        await openDapp(driver);

        await createContractDeploymentTransaction(driver);
        await confirmContractDeploymentTransaction(driver);

        await createDepositTransaction(driver);
        await confirmDepositTransaction(driver);
      },
    );
  });

  it(`Opens a contract interaction type 0 transaction (Legacy)`, async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .withPreferencesController({
            preferences: { redesignedConfirmationsEnabled: true },
          })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);
        await openDapp(driver);

        await deployContract(driver);
        await initiateContractInteractionTx(driver);
      },
    );
  });

  it('Sends a contract interaction type 0 transaction with custom nonce editing', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .withPreferencesController({
            preferences: { redesignedConfirmationsEnabled: true },
          })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);
        await openDapp(driver);

        await toggleOnCustomNonce(driver);

        await createContractDeploymentTransaction(driver);
        await confirmContractDeploymentTransaction(driver);

        await createDepositTransaction(driver);
        await confirmDepositTransactionWithCustomNonce(driver, '10');
      },
    );
  });

  it(`Opens a contract interaction type 2 transaction`, async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .withPreferencesController({
            preferences: { redesignedConfirmationsEnabled: true },
          })
          .build(),
        ganacheOptions: defaultGanacheOptionsForType2Transactions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);
        await openDapp(driver);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await driver.clickElement(`#deployButton`);

        await driver.delay(3000);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.waitForSelector({
          css: '.confirm-page-container-summary__action__name',
          text: 'Contract deployment',
        });

        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await driver.clickElement({ text: 'Activity', tag: 'button' });
        await driver.waitForSelector(
          '.transaction-list__completed-transactions .activity-list-item:nth-of-type(1)',
        );

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await driver.clickElement(`#depositButton`);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await driver.waitForSelector({
          css: 'h2',
          text: 'Transaction request',
        });
      },
    );
  });

  it(`Opens a contract interaction type 2 transaction (EIP1559)`, async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .withPreferencesController({
            preferences: { redesignedConfirmationsEnabled: true },
          })
          .build(),
        ganacheOptions: defaultGanacheOptionsForType2Transactions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);
        await openDapp(driver);

        await deployContract(driver);
        await initiateContractInteractionTx(driver);
      },
    );
  });

  it(`Opens a contract interaction type 1 transaction`, async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .withPreferencesController({
            preferences: { redesignedConfirmationsEnabled: true },
          })
          .build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);
        await openDapp(driver);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await driver.clickElement(`#deployButton`);

        await driver.delay(2 ** 5);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
        await driver.waitForSelector({
          css: '.confirm-page-container-summary__action__name',
          text: 'Contract deployment',
        });

        await driver.clickElement({ text: 'Confirm', tag: 'button' });
        await driver.waitUntilXWindowHandles(2);
        await driver.switchToWindowWithTitle(
          WINDOW_TITLES.ExtensionInFullScreenView,
        );
        await driver.clickElement({ text: 'Activity', tag: 'button' });
        await driver.waitForSelector(
          '.transaction-list__completed-transactions .activity-list-item:nth-of-type(1)',
        );

        await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
        await driver.clickElement(`#depositButton`);

        await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

        await driver.waitForSelector({
          css: 'h2',
          text: 'Transaction request',
        });
      },
    );
  });
});

it(`Opens a contract interaction type 2 transaction that includes layer 1 fees breakdown on a layer 2`, async function () {
  await withFixtures(
    {
      dapp: true,
      fixtures: new FixtureBuilder({ inputChainId: CHAIN_IDS.OPTIMISM })
        .withPermissionControllerConnectedToTestDapp()
        .withPreferencesController({
          preferences: { redesignedConfirmationsEnabled: true },
        })
        .withTransactionControllerOPLayer2Transaction()
        .build(),
      ganacheOptions: {
        ...defaultGanacheOptionsForType2Transactions,
        network_id: hexToNumber(CHAIN_IDS.OPTIMISM),
        chainId: hexToNumber(CHAIN_IDS.OPTIMISM),
      },
      title: this.test?.fullTitle(),
    },
    async ({ driver }) => {
      await unlockWallet(driver);
    },
  );
});

async function toggleOnCustomNonce(driver) {
  // switch to metamask page and open the three dots menu
  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);

  // Open settings menu button
  const accountOptionsMenuSelector =
    '[data-testid="account-options-menu-button"]';
  await driver.waitForSelector(accountOptionsMenuSelector);
  await driver.clickElement(accountOptionsMenuSelector);

  // Click settings from dropdown menu
  const globalMenuSettingsSelector = '[data-testid="global-menu-settings"]';
  await driver.waitForSelector(globalMenuSettingsSelector);
  await driver.clickElement(globalMenuSettingsSelector);

  // Click Advanced tab
  const advancedTabRawLocator = {
    text: 'Advanced',
    tag: 'div',
  };
  await driver.clickElement(advancedTabRawLocator);

  // Toggle on custom toggle setting (off by default)
  await driver.clickElement('.custom-nonce-toggle');

  // Close settings
  await driver.clickElement(
    '.settings-page__header__title-container__close-button',
  );
}

async function createContractDeploymentTransaction(driver) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await driver.clickElement(`#deployButton`);
}

async function confirmContractDeploymentTransaction(driver) {
  await driver.delay(2000);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  await driver.waitForSelector({
    css: '.confirm-page-container-summary__action__name',
    text: 'Contract deployment',
  });

  await driver.clickElement({ text: 'Confirm', tag: 'button' });
  await driver.waitUntilXWindowHandles(2);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);
  await driver.clickElement({ text: 'Activity', tag: 'button' });
  await driver.waitForSelector(
    '.transaction-list__completed-transactions .activity-list-item:nth-of-type(1)',
  );
}

async function deployContract(driver) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await driver.clickElement(`#deployButton`);

  await driver.delay(2000);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  await driver.waitForSelector({
    css: '.confirm-page-container-summary__action__name',
    text: 'Contract deployment',
  });

  await driver.clickElement({ text: 'Confirm', tag: 'button' });
  await driver.waitUntilXWindowHandles(2);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);
  await driver.clickElement({ text: 'Activity', tag: 'button' });
  await driver.waitForSelector(
    '.transaction-list__completed-transactions .activity-list-item:nth-of-type(1)',
  );
}

async function createDepositTransaction(driver) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await driver.clickElement(`#depositButton`);
}

async function confirmDepositTransaction(driver) {
  await driver.delay(2000);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  await driver.waitForSelector({
    css: 'h2',
    text: 'Transaction request',
  });

  await toggleAdvancedDetails(driver);

  await driver.waitForSelector({
    css: 'p',
    text: 'Nonce',
  });

  await scrollAndConfirmAndAssertConfirm(driver);
}

async function confirmDepositTransactionWithCustomNonce(driver, customNonce) {
  await driver.delay(2000);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  await driver.waitForSelector({
    css: 'h2',
    text: 'Transaction request',
  });

  await toggleAdvancedDetails(driver);

  await driver.waitForSelector({
    css: 'p',
    text: 'Nonce',
  });

  await driver.clickElement('.edit-nonce-btn');
  await driver.fill('[data-testid="custom-nonce-input"]', customNonce);
  await driver.clickElement({
    text: 'Save',
    tag: 'button',
  });
  await scrollAndConfirmAndAssertConfirm(driver);

  // Confirm tx was submitted with the higher nonce
  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);

  await driver.delay(500);

  const sendTransactionListItem = await driver.findElement(
    '.transaction-list__pending-transactions .activity-list-item',
  );
  await sendTransactionListItem.click();

  await driver.waitForSelector({
    css: '.transaction-breakdown__value',
    text: customNonce,
  });
}

async function toggleAdvancedDetails(driver) {
  // TODO - Scroll button not shown in Firefox if advanced details enabled too fast.
  await driver.delay(1000);

  await driver.clickElement(`[data-testid="header-advanced-details-button"]`);
}

async function initiateContractInteractionTx(driver) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await driver.clickElement(`#depositButton`);

  await driver.delay(2000);
  await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);

  await driver.waitForSelector({
    css: 'h2',
    text: 'Transaction request',
  });
}

async function openAdvancedDetailsAndCheckTheyExist(driver) {
  await driver.waitForSelector({ css: 'p', text: 'Fee details' });
  await driver.clickElement({ css: 'p', text: 'Fee details' });

  await driver.waitForSelector({ css: 'p', text: 'L2 Fees' });
  await driver.waitForSelector({ css: 'p', text: 'L1 Fees' });
}
