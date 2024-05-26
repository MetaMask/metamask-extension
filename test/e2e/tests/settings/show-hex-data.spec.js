const { strict: assert } = require('assert');
const {
  defaultGanacheOptions,
  withFixtures,
  logInWithBalanceValidation,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');

const selectors = {
  accountOptionsMenu: '[data-testid="account-options-menu-button"]',
  settingsDiv: { text: 'Settings', tag: 'div' },
  advancedDiv: { text: 'Advanced', tag: 'div' },
  hexDataToggle: '[data-testid="advanced-setting-hex-data"] .toggle-button',
  appHeaderLogo: '[data-testid="app-header-logo"]',
  ethOverviewSend: '[data-testid="eth-overview-send"]',
  ensInput: '[data-testid="ens-input"]',
  quantity: 'input[placeholder="0"]',
  hexDataInput: '[data-testid="send-hex-textarea"]',
  nextPageButton: { text: 'Continue', tag: 'button' },
  hexButton: { text: 'Hex', tag: 'button' },
  detailsTab: { text: 'Details', tag: 'button' },
  containerContent: '.confirm-page-container-content',
  confirmButton: { text: 'Confirm', tag: 'button' },
};

const inputData = {
  recipientAddress: '0x985c30949c92df7a0bd42e0f3e3d539ece98db24',
  hexDataText: '0x0abc',
};

// Function to click elements in sequence
async function clickElementsInSequence(driver, clickSelectors) {
  for (const selector of clickSelectors) {
    await driver.waitForSelector(selector);
    await driver.clickElement(selector);
  }
}

// Function to perform the hex data toggle
async function toggleHexData(driver) {
  const sequence = [
    selectors.accountOptionsMenu,
    selectors.settingsDiv,
    selectors.advancedDiv,
    selectors.hexDataToggle,
  ];

  await clickElementsInSequence(driver, sequence);
}

// Function to click on the app logo
async function clickOnLogo(driver) {
  await driver.clickElement(selectors.appHeaderLogo);
}

// Function to send a transaction and verify hex data text area appears.
async function sendTransactionAndVerifyHexData(driver) {
  await driver.clickElement(selectors.ethOverviewSend);
  await driver.fill(selectors.ensInput, inputData.recipientAddress);
  await driver.fill(selectors.quantity, 1);
  await driver.fill(selectors.hexDataInput, inputData.hexDataText);
  await driver.clickElement(selectors.nextPageButton);
  await driver.clickElement(selectors.hexButton);
}

// Main test suite
describe('Check the toggle for hex data', function () {
  it('Setting the hex data toggle and verify that the textbox appears', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test.fullTitle(),
      },
      async ({ driver, ganacheServer }) => {
        await logInWithBalanceValidation(driver, ganacheServer);
        await toggleHexData(driver);
        await clickOnLogo(driver);
        await sendTransactionAndVerifyHexData(driver);

        // Verify hex data in the container content
        const pageContentContainer = await driver.findElement(
          selectors.containerContent,
        );
        const pageContentContainerText = await pageContentContainer.getText();
        assert.equal(
          pageContentContainerText.includes(inputData.hexDataText),
          true,
          'Hex data is incorrect',
        );
      },
    );
  });
});
