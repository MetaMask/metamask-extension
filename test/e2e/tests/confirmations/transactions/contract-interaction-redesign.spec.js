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
const { SMART_CONTRACTS } = require('../../../seeder/smart-contracts');
const { CHAIN_IDS } = require('../../../../../shared/constants/network');

describe('Confirmation Redesign Contract Interaction Component', function () {
  const smartContract = SMART_CONTRACTS.PIGGYBANK;

  if (!process.env.ENABLE_CONFIRMATION_REDESIGN) {
    return;
  }

  describe('Create a deposit transaction', function () {
    it(`Sends a contract interaction type 0 transaction (Legacy)`, async function () {
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
          smartContract,
          title: this.test?.fullTitle(),
        },
        async ({ driver, contractRegistry }) => {
          const contractAddress = await contractRegistry.getContractAddress(
            smartContract,
          );
          await unlockWallet(driver);

          await openDapp(driver, contractAddress);

          await createDepositTransaction(driver);
          await confirmDepositTransaction(driver);
        },
      );
    });

    it(`Sends a contract interaction type 2 transaction (EIP1559)`, async function () {
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
          smartContract,
          title: this.test?.fullTitle(),
        },
        async ({ driver, contractRegistry }) => {
          const contractAddress = await contractRegistry.getContractAddress(
            smartContract,
          );
          await unlockWallet(driver);

          await openDapp(driver, contractAddress);

          await createDepositTransaction(driver);
          await confirmDepositTransaction(driver);
        },
      );
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
          smartContract,
          title: this.test?.fullTitle(),
        },
        async ({ driver, contractRegistry }) => {
          const contractAddress = await contractRegistry.getContractAddress(
            smartContract,
          );
          await unlockWallet(driver);

          await openDapp(driver, contractAddress);

          await driver.switchToWindowWithTitle(
            WINDOW_TITLES.ExtensionInFullScreenView,
          );

          await openAdvancedDetailsAndCheckTheyExist(driver);
        },
      );
    });
  });

  describe('Custom nonce editing', function () {
    it('Sends a contract interaction type 2 transaction without custom nonce editing (EIP1559)', async function () {
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
          smartContract,
          title: this.test?.fullTitle(),
        },
        async ({ driver, contractRegistry }) => {
          const contractAddress = await contractRegistry.getContractAddress(
            smartContract,
          );
          await unlockWallet(driver);

          await openDapp(driver, contractAddress);

          await createContractDeploymentTransaction(driver);
          await confirmContractDeploymentTransaction(driver);

          await createDepositTransaction(driver);

          await confirmDepositTransaction(driver);
        },
      );
    });

    it('Sends a contract interaction type 2 transaction with custom nonce editing (EIP1559)', async function () {
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
          smartContract,
          title: this.test?.fullTitle(),
        },
        async ({ driver, contractRegistry }) => {
          const contractAddress = await contractRegistry.getContractAddress(
            smartContract,
          );
          await unlockWallet(driver);

          await openDapp(driver, contractAddress);

          await toggleOnCustomNonce(driver);

          await createContractDeploymentTransaction(driver);
          await confirmContractDeploymentTransaction(driver);

          await createDepositTransaction(driver);
          await confirmDepositTransactionWithCustomNonce(driver, '10');
        },
      );
    });
  });
});

async function createContractDeploymentTransaction(driver) {
  await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
  await driver.clickElement(`#deployButton`);
}

async function confirmContractDeploymentTransaction(driver) {
  await driver.waitUntilXWindowHandles(3);
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
  await driver.waitUntilXWindowHandles(3);
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
  await driver.waitUntilXWindowHandles(3);
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

async function toggleOnCustomNonce(driver) {
  // switch to metamask page and open the three dots menu
  await driver.switchToWindowWithTitle(WINDOW_TITLES.ExtensionInFullScreenView);

  // Open settings menu button
  const accountOptionsMenuSelector =
    '[data-testid="account-options-menu-button"]';
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

async function toggleAdvancedDetails(driver) {
  // TODO - Scroll button not shown in Firefox if advanced details enabled too fast.
  await driver.delay(1000);

  await driver.clickElement(`[data-testid="header-advanced-details-button"]`);
}
