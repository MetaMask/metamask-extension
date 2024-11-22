const { strict: assert } = require('assert');
const FixtureBuilder = require('../../fixture-builder');
const {
  defaultGanacheOptions,
  openDapp,
  sendTransaction,
  unlockWallet,
  withFixtures,
  ACCOUNT_1,
  ACCOUNT_2,
  WINDOW_TITLES,
  clickNestedButton,
  tempToggleSettingRedesignedTransactionConfirmations,
} = require('../../helpers');
const { SMART_CONTRACTS } = require('../../seeder/smart-contracts');

const DEFAULT_TEST_DAPP_INCREASE_ALLOWANCE_SPENDING_CAP = '1';

describe('Increase Token Allowance', function () {
  const smartContract = SMART_CONTRACTS.HST;

  it('increases token spending cap to allow other accounts to transfer tokens @no-mmi', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withPermissionControllerConnectedToTestDapp()
          .build(),
        ganacheOptions: defaultGanacheOptions,
        smartContract,
        title: this.test.fullTitle(),
      },
      async ({ driver, contractRegistry }) => {
        const ACCOUNT_1_NAME = 'Account 1';
        const ACCOUNT_2_NAME = '2nd Account';

        const initialSpendingCap = '1';
        const additionalSpendingCap = '1';

        await unlockWallet(driver);

        await tempToggleSettingRedesignedTransactionConfirmations(driver);

        const contractAddress = await contractRegistry.getContractAddress(
          smartContract,
        );
        await openDapp(driver, contractAddress);

        await deployTokenContract(driver);
        await approveTokenSpendingCapTo(driver, ACCOUNT_2, initialSpendingCap);

        await sendTransaction(driver, ACCOUNT_2, '1');
        await addAccount(driver, ACCOUNT_2_NAME);

        await triggerTransferFromTokens(driver, ACCOUNT_1, ACCOUNT_2);
        // 'Transfer From Tokens' on the test dApp attempts to transfer 1.5 TST.
        // Since this is higher than the 'initialSpendingCap', it should fail.
        await pollForTokenAddressesError(
          driver,
          'reverted ERC20: insufficient allowance',
        );

        await switchToAccountWithName(driver, ACCOUNT_1_NAME);

        await increaseTokenAllowance(driver, additionalSpendingCap);

        await switchToAccountWithName(driver, ACCOUNT_2_NAME);
        await triggerTransferFromTokens(driver, ACCOUNT_1, ACCOUNT_2);
        await confirmTransferFromTokensSuccess(driver);
      },
    );
  });

  async function deployTokenContract(driver) {
    await driver.findClickableElement('#deployButton');
  }

  async function approveTokenSpendingCapTo(
    driver,
    accountToApproveFor,
    initialSpendingCap,
  ) {
    await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);

    const approveToFillEl = await driver.findElement('[id="approveTo"]');
    await approveToFillEl.clear();
    await approveToFillEl.fill(accountToApproveFor);

    await driver.clickElement({ text: 'Approve Tokens', tag: 'button' });

    await driver.switchToWindowWithTitle(
      WINDOW_TITLES.ExtensionInFullScreenView,
    );
    await clickNestedButton(driver, 'Activity');

    const pendingTransactions = await driver.findElements(
      '.transaction-list__pending-transactions .activity-list-item',
    );
    pendingTransactions[0].click();

    const setSpendingCap = await driver.findElement(
      '[data-testid="custom-spending-cap-input"]',
    );
    await setSpendingCap.fill(initialSpendingCap);

    await driver.clickElement({
      tag: 'button',
      text: 'Next',
    });
    await driver.waitForSelector({
      css: '.box--display-flex > h6',
      text: `10 TST`,
    });
    await driver.waitForSelector({
      text: `${initialSpendingCap} TST`,
      css: '.mm-box > h6',
    });
    await driver.clickElement({
      tag: 'button',
      text: 'Approve',
    });

    await driver.waitForSelector({
      css: '.transaction-list__completed-transactions .activity-list-item [data-testid="activity-list-item-action"]',
      text: 'Approve TST spending cap',
    });
  }

  async function addAccount(driver, newAccountName) {
    await driver.clickElement('[data-testid="account-menu-icon"]');
    await driver.clickElement(
      '[data-testid="multichain-account-menu-popover-action-button"]',
    );
    await driver.clickElement(
      '[data-testid="multichain-account-menu-popover-add-account"]',
    );

    await driver.fill('[placeholder="Account 2"]', newAccountName);
    await driver.clickElement({ text: 'Add account', tag: 'button' });
    await driver.findElement({
      css: '[data-testid="account-menu-icon"]',
      text: newAccountName,
    });
  }

  async function triggerTransferFromTokens(
    driver,
    senderAccount,
    recipientAccount,
  ) {
    await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
    const transferFromSenderInputEl = await driver.findElement(
      '[id="transferFromSenderInput"]',
    );
    await transferFromSenderInputEl.clear();
    await transferFromSenderInputEl.fill(senderAccount);

    const transferFromRecipientInputEl = await driver.findElement(
      '[id="transferFromRecipientInput"]',
    );
    await transferFromRecipientInputEl.clear();
    await transferFromRecipientInputEl.fill(recipientAccount);

    await driver.clickElement('#transferFromTokens');
    await driver.delay(2000);
  }

  async function pollForTokenAddressesError(
    driver,
    errorMessagePart,
    timeout = driver.timeout,
  ) {
    const pollInterval = 500;
    let elapsedTime = 0;

    await new Promise((resolve, reject) => {
      const pollInsufficientAllowanceError = setInterval(async () => {
        try {
          const tokenAddressesElement = await driver.findElement(
            '#tokenMethodsResult',
          );
          const tokenAddressesMsgText = await tokenAddressesElement.getText();
          const isErrorThrown =
            tokenAddressesMsgText.includes(errorMessagePart);

          if (isErrorThrown) {
            // Condition satisfied, stopping poll.
            clearInterval(pollInsufficientAllowanceError);
            resolve();
          } else {
            elapsedTime += pollInterval;
            if (elapsedTime >= timeout) {
              // Timeout reached, stopping poll.
              clearInterval(pollInsufficientAllowanceError);
              reject(
                new Error(
                  `Did not throw '${errorMessagePart}' error as expected. Timeout reached, stopping poll.`,
                ),
              );
            }
          }
        } catch (error) {
          clearInterval(pollInsufficientAllowanceError);
          reject(error);
        }
      }, pollInterval);
    });
  }

  async function switchToAccountWithName(driver, accountName) {
    await driver.switchToWindowWithTitle(
      WINDOW_TITLES.ExtensionInFullScreenView,
    );
    await driver.clickElement('[data-testid="account-menu-icon"]');

    await driver.findElement({
      css: `.multichain-account-list-item .multichain-account-list-item__account-name__button`,
      text: accountName,
    });

    await driver.clickElement({
      css: `.multichain-account-list-item .multichain-account-list-item__account-name__button`,
      text: accountName,
    });
  }

  async function increaseTokenAllowance(driver, finalSpendingCap) {
    await driver.switchToWindowWithTitle(WINDOW_TITLES.TestDApp);
    await driver.clickElement({
      text: 'Increase Token Allowance',
      tag: 'button',
    });
    await driver.delay(2000);

    // Windows: MetaMask, Test Dapp and Dialog
    await driver.waitUntilXWindowHandles(3);
    await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
    let spendingCapElement = await driver.findElement(
      '[data-testid="custom-spending-cap-input"]',
    );

    let spendingCapValue = await spendingCapElement.getProperty('value');
    assert.equal(
      spendingCapValue,
      DEFAULT_TEST_DAPP_INCREASE_ALLOWANCE_SPENDING_CAP,
      'Default Test Dapp Increase Allowance Spending Cap is unexpected',
    );

    spendingCapElement = await driver.findElement(
      '[data-testid="custom-spending-cap-input"]',
    );
    await spendingCapElement.clear();

    await spendingCapElement.fill('0');

    await driver.clickElement({
      text: 'Use site suggestion',
      tag: 'button',
    });

    spendingCapValue = await spendingCapElement.getProperty('value');
    assert.equal(
      spendingCapValue,
      DEFAULT_TEST_DAPP_INCREASE_ALLOWANCE_SPENDING_CAP,
      'Test Dapp Suggestion Increase Allowance Spending Cap is unexpected',
    );

    await spendingCapElement.fill(finalSpendingCap);

    await driver.clickElement({
      tag: 'button',
      text: 'Next',
    });
    await driver.waitForSelector({
      css: '.box--display-flex > h6',
      text: `10 TST`,
    });
    await driver.assertElementNotPresent(
      {
        tag: 'h6',
        text: '0.000054 ETH',
      },
      {
        waitAtLeastGuard: 2000,
      },
    );
    await driver.waitForSelector({
      tag: 'h6',
      text: '0.000062 ETH',
    });
    await driver.waitForSelector({
      text: `${finalSpendingCap} TST`,
      css: '.mm-box > h6',
    });
    await driver.clickElementAndWaitForWindowToClose({
      tag: 'button',
      text: 'Approve',
    });

    await driver.switchToWindowWithTitle(
      WINDOW_TITLES.ExtensionInFullScreenView,
    );
    await clickNestedButton(driver, 'Activity');
    await driver.waitForSelector({
      css: '.transaction-list__completed-transactions .activity-list-item [data-testid="activity-list-item-action"]',
      text: 'Increase TST spending cap',
    });

    await driver.delay(2000);
  }

  async function confirmTransferFromTokensSuccess(driver) {
    // Windows: MetaMask, Test Dapp and Dialog
    await driver.waitUntilXWindowHandles(3, 1000, 10000);
    await driver.switchToWindowWithTitle(WINDOW_TITLES.Dialog);
    await driver.waitForSelector({ text: '1.5 TST', tag: 'h1' });
    await driver.clickElement({ text: 'Confirm', tag: 'button' });

    await driver.switchToWindowWithTitle(
      WINDOW_TITLES.ExtensionInFullScreenView,
    );
    await clickNestedButton(driver, 'Activity');

    await driver.waitForSelector({
      css: '.transaction-list__completed-transactions .activity-list-item [data-testid="activity-list-item-action"]',
      text: 'Send TST',
    });
  }
});
